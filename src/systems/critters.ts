import {
  CRITTER_IDS,
  CRITTERS,
  WEATHER_WEIGHT,
  isFish,
  type Habitat,
  type Rarity,
} from '../data/critters';
import type { Weather } from '../data/weather';
import { spotOf } from '../data/maps';
import { PARTY_SPOTS } from '../data/specialDays';
import type { CritterId, MapZoneId } from '../types/ids';
import { stopsIn } from './schedules';
import { hashString } from './random';
import { tileAt, walkable, type TileMap } from './grid';
import { weatherOn } from './weather';
import { isFullMoon, shiftDay } from './calendar';
import { decorOn } from './holidays';
import { WINDOW_FROM } from './clock';
import { FULL_MOON_WEIGHT } from '../data/calendar';
import type { Tile } from './pathfinding';

/** How many critters are dealt out each hour, each a different kind. */
export const CRITTERS_PER_HOUR = 4;

/** How many fish are dealt into a place's water each hour, each a different kind (phase Q). */
export const FISH_PER_HOUR = 3;

/** How many more fish come up in the rain, which they love. */
export const RAIN_FISH = 1;

/**
 * How much likelier a common critter is to be dealt than a rarer one (0.2's F1, decision 150):
 * 12:5:2:1, doubled so a visitor can be dealt at half a legendary's weight (V1's R5).
 */
export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 24,
  uncommon: 10,
  rare: 4,
  legendary: 2,
};

/**
 * How likely a critter visiting out of its season or its weather is to be dealt, whatever its
 * tier (V1's R5, decision 310): half a legendary's, so a visit is a treat and its season is still
 * the time to look. Tuned with `tests/systems/rarity.test.ts`, which a longer or likelier visit
 * failed by filling the Cabinet in seven months.
 */
export const VISIT_WEIGHT = 1;

/**
 * How likely a holiday's critter is off its holiday's days, when it comes round with the visitors
 * (V1's R5): likelier than they are, since its own days are only a week or so.
 */
export const HOLIDAY_VISIT_WEIGHT = 5;

/**
 * How much likelier a critter that waits on the full moon is on its night: a dozen nights a year
 * are its rarity, so when the moon is up a legendary one comes up twice as readily as a common
 * one (as readily until V1's R5, when there came to be more critters about for it to be among).
 */
export const MOON_BOUND_WEIGHT = 24;

/** Every tile each habitat offers, worked out once from the map. */
export type Habitats = Record<Habitat, Tile[]>;

/** A critter out this hour, on its slot's tile. */
export interface OutCritter {
  /** Which of the hour's critters it is; with the hour, what a catch is remembered by. */
  slot: number;
  critter: CritterId;
  tx: number;
  ty: number;
}

/** Whether a critter is about at an hour of the clock (a whole hour, 0–23). */
export function isOut(id: CritterId, hour: number): boolean {
  const { from, to } = CRITTERS[id];
  const h = Math.floor(hour);
  return from < to ? h >= from && h < to : h >= from || h < to;
}

/** The month of a day key, 1 to 12. */
function monthOf(day: string): number {
  return Number(day.slice(5, 7));
}

/**
 * Whether a critter is in season on a day (0.2's F1): most are all year. A holiday's critter's
 * season is while its holiday's decorations are up (V1's R5).
 */
export function inSeason(id: CritterId, day: string): boolean {
  const { season, holiday } = CRITTERS[id];
  if (holiday) return decorOn(day) === holiday;
  if (!season) return true;
  const [from, to] = season;
  const month = monthOf(day);
  return from <= to ? month >= from && month <= to : month >= from || month <= to;
}

/**
 * Whether a day is the day after a full moon, when a critter out of its time comes visiting (V1's
 * R5, decision 310). Not the full moon's own: that night is the moon-bound critters', and visitors
 * crowding it kept the ghost bat from being found within a year.
 */
export function isVisitDay(day: string): boolean {
  return isFullMoon(shiftDay(day, -1));
}

/**
 * Whether a critter is visiting on a day (V1's R5, decision 310): out of its season, off its
 * holiday or in the wrong weather, but the day after a full moon, so none is ever more than a
 * month away. One that waits on the full moon has its night already, and one with no season, holiday
 * or weather is about anyway.
 */
export function isVisiting(id: CritterId, day: string, weather: Weather): boolean {
  const row = CRITTERS[id];
  if (row.moon) return false;
  if (inSeason(id, day) && likesWeather(id, weather)) return false;
  return isVisitDay(day);
}

/** Whether a critter comes out at all on a day: in its season and its weather, or visiting. */
export function comesOut(id: CritterId, day: string, weather: Weather): boolean {
  return (inSeason(id, day) && likesWeather(id, weather)) || isVisiting(id, day, weather);
}

/**
 * Whether a critter could be dealt out at an hour of a day, wherever it lives: its hours, its
 * season (or a visit round the full moon), its weather, and for one that waits on the full moon,
 * that night.
 */
export function isAbout(id: CritterId, day: string, hour: number, weather: Weather): boolean {
  return (
    isOut(id, hour) && comesOut(id, day, weather) && (!CRITTERS[id].moon || isMoonlit(day, hour))
  );
}

/**
 * What a catch is remembered by in `taken`, so a critter caught is gone for the rest of its hour.
 * Outside the town it's keyed with its place, as a tree is.
 */
export function critterKey(hour: number, slot: number, place: MapZoneId = 'town'): string {
  const key = `critter:${Math.floor(hour)}:${slot}`;
  return place === 'town' ? key : `${place}:${key}`;
}

const key = (t: Tile) => `${t.tx},${t.ty}`;

const NEIGHBOURS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

/**
 * Where each kind of critter can be, from the map: open ground beside a lantern, tree, pumpkin,
 * gravestone, clump of toadstools or flower patch, open ground on the bank of a pond or lake, and
 * the water beside the bank, where she can reach it with her rod (but not where something stands
 * in it). Never on a patch itself, where a tap is for the flowers. `avoid` is anywhere else a
 * critter would be in the way: her door, a snack's spot, a neighbour's stop.
 */
export function habitatsOf(map: TileMap, avoid: readonly Tile[] = []): Habitats {
  const skip = new Set([...avoid, ...map.patches].map(key));
  const open = (tx: number, ty: number) => walkable(map, tx, ty) && !skip.has(`${tx},${ty}`);
  const beside = (things: readonly { tx: number; ty: number; w?: number; h?: number }[]) => {
    const tiles = new Map<string, Tile>();
    for (const p of things) {
      const w = p.w ?? 1;
      const h = p.h ?? 1;
      for (let y = p.ty - 1; y <= p.ty + h; y++) {
        for (let x = p.tx - 1; x <= p.tx + w; x++) {
          if (open(x, y)) tiles.set(`${x},${y}`, { tx: x, ty: y });
        }
      }
    }
    return [...tiles.values()].sort((a, b) => a.ty - b.ty || a.tx - b.tx);
  };
  const wet = (tx: number, ty: number) => {
    return tileAt(map, tx, ty) === 'water';
  };
  const standing = new Set<string>();
  for (const p of map.props) {
    for (let y = p.ty; y < p.ty + p.h; y++)
      for (let x = p.tx; x < p.tx + p.w; x++) standing.add(`${x},${y}`);
  }
  const bank: Tile[] = [];
  const creek: Tile[] = [];
  const pond: Tile[] = [];
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      const around = NEIGHBOURS.map(([dx, dy]) => [tx + dx, ty + dy] as const);
      if (open(tx, ty) && around.some(([x, y]) => wet(x, y))) bank.push({ tx, ty });
      if (open(tx, ty) && tileAt(map, tx, ty) !== 'ice') {
        if (around.some(([x, y]) => tileAt(map, x, y) === 'ice')) creek.push({ tx, ty });
      }
      const clearWater = tileAt(map, tx, ty) === 'water' && !standing.has(`${tx},${ty}`);
      if (clearWater && around.some(([x, y]) => open(x, y))) {
        pond.push({ tx, ty });
      }
    }
  }
  const props = (...ids: string[]) => map.props.filter((p) => ids.includes(p.id));
  const beds: Tile[] = [];
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) if (tileAt(map, tx, ty) === 'bed') beds.push({ tx, ty });
  }
  return {
    lanterns: beside(props('lantern')),
    flowers: beside(map.patches),
    trees: beside(props('tree')),
    pumpkins: beside(props('pumpkin')),
    graves: beside(props('gravestone')),
    mushrooms: beside(props('toadstools')),
    bank,
    creek,
    pond,
    crops: beside(beds),
    hay: beside(props('hayBale')),
    fences: beside(props('fence', 'fencePost')),
    logs: beside(props('log', 'stump')),
    rocks: beside(props('rock')),
    orchard: beside(props('appleTree', 'pearTree', 'plumTree', 'persimmonTree')),
    yard: yardGrass(map, open),
  };
}

/** The open grass in her yard's box (V1's R5), where a critter of her own yard turns up. */
function yardGrass(map: TileMap, open: (tx: number, ty: number) => boolean): Tile[] {
  const box = map.yard;
  if (!box) return [];
  const tiles: Tile[] = [];
  for (let ty = box.ty; ty < box.ty + box.h; ty++) {
    for (let tx = box.tx; tx < box.tx + box.w; tx++) {
      if (tileAt(map, tx, ty) === 'grass' && open(tx, ty)) tiles.push({ tx, ty });
    }
  }
  return tiles;
}

/**
 * A town's habitats, clear of her door, the snack's spots and, where her neighbours live, every
 * stop they keep, where a tap for a critter would be a hello instead.
 */
export function townHabitats(map: TileMap, neighbours: boolean): Habitats {
  const stops = neighbours
    ? [...stopsIn('town'), ...Object.values(PARTY_SPOTS).map((name) => spotOf('town', name))]
    : [];
  return habitatsOf(map, [map.spawn, ...map.snackSpots, ...stops]);
}

/**
 * A place's habitats beyond the town (phase I), clear of where she comes in (her landings from
 * each way in, and the spawn) and of the spots her neighbours keep there.
 */
export function placeHabitats(place: MapZoneId, map: TileMap): Habitats {
  const stops = stopsIn(place);
  const ways = map.exits.flatMap((e) => {
    const tiles: Tile[] = [];
    for (let y = e.ty - 1; y <= e.ty + e.h; y++) {
      for (let x = e.tx - 1; x <= e.tx + e.w; x++) tiles.push({ tx: x, ty: y });
    }
    return tiles;
  });
  return habitatsOf(map, [map.spawn, ...ways, ...stops]);
}

/** Whether a critter comes out in a weather: most don't mind, and a few come out only in theirs. */
export function likesWeather(id: CritterId, weather: Weather): boolean {
  const only = CRITTERS[id].weather;
  return only === undefined || only === weather;
}

/**
 * How likely a critter is to be dealt in a weather: by its rarity, and its family's liking. On the
 * night of a full moon (`moonlit`), the moths and orbs are likelier still. One `visiting` is dealt
 * at a visitor's weight (V1's R5).
 */
export function weightOf(
  id: CritterId,
  weather: Weather,
  moonlit = false,
  visiting = false,
): number {
  const row = CRITTERS[id];
  const moon = moonlit ? (row.moon ? MOON_BOUND_WEIGHT : (FULL_MOON_WEIGHT[row.family] ?? 1)) : 1;
  const tier = visiting
    ? row.holiday
      ? HOLIDAY_VISIT_WEIGHT
      : VISIT_WEIGHT
    : RARITY_WEIGHT[row.rarity];
  return tier * (WEATHER_WEIGHT[weather][row.family] ?? 1) * moon;
}

/** Whether an hour of a day is the night of a full moon: from 6pm until the day turns over. */
export function isMoonlit(day: string, hour: number): boolean {
  return (hour >= WINDOW_FROM.evening || hour < WINDOW_FROM.morning) && isFullMoon(day);
}

/**
 * The critters out in a place this hour, and where: the same all hour, and different the next
 * (decisions.md 4). Each slot deals a different kind of critter from those that live there and
 * are about at this hour, in this season and in today's weather, weighted by rarity, the weather and a full moon,
 * onto a tile of its habitat that `usable` allows and no other critter has. Each place deals its
 * own. The fish are dealt apart, into slots of their own after the rest (phase Q), so there are
 * always a few in the water for her rod, whatever else is about.
 */
export function crittersOut(
  day: string,
  hour: number,
  habitats: Habitats,
  usable: (t: Tile) => boolean = () => true,
  place: MapZoneId = 'town',
  weather: Weather = weatherOn(day),
): OutCritter[] {
  const h = Math.floor(hour);
  const about = CRITTER_IDS.filter(
    (id) => CRITTERS[id].where.includes(place) && isAbout(id, day, h, weather),
  );
  const seed = place === 'town' ? day : `${place}:${day}`;
  const moonlit = isMoonlit(day, h);
  const weights = new Map(
    about.map((id) => [id, weightOf(id, weather, moonlit, isVisiting(id, day, weather))]),
  );
  const weight = (id: CritterId) => weights.get(id)!;
  const taken = new Set<string>();
  const out: OutCritter[] = [];
  const deal = (pool: CritterId[], first: number, count: number) => {
    for (let slot = first; slot < first + count && pool.length > 0; slot++) {
      const roll = hashString(`${seed}@${h}#${slot}`);
      const total = pool.reduce((sum, id) => sum + weight(id), 0);
      let pick = roll % total;
      const at = pool.findIndex((id) => (pick -= weight(id)) < 0);
      const critter = pool.splice(at, 1)[0]!;
      const tiles = habitats[CRITTERS[critter].habitat].filter(
        (t) => usable(t) && !taken.has(key(t)),
      );
      if (tiles.length === 0) continue;
      const tile = tiles[(roll >>> 12) % tiles.length]!;
      taken.add(key(tile));
      out.push({ slot, critter, tx: tile.tx, ty: tile.ty });
    }
  };
  deal(
    about.filter((id) => !isFish(id)),
    0,
    CRITTERS_PER_HOUR,
  );
  const fish = FISH_PER_HOUR + (weather === 'rain' ? RAIN_FISH : 0);
  deal(about.filter(isFish), CRITTERS_PER_HOUR, fish);
  return out;
}

/**
 * Where a wary critter flutters off to: the nearest tile of its habitat at least two tiles from
 * where it was, so she has to follow it, but never far.
 */
export function flutterTo(
  from: Tile,
  tiles: readonly Tile[],
  free: (t: Tile) => boolean,
): Tile | null {
  let best: Tile | null = null;
  let bestDistance = Infinity;
  for (const t of tiles) {
    const d = Math.max(Math.abs(t.tx - from.tx), Math.abs(t.ty - from.ty));
    if (d < 2 || !free(t)) continue;
    const distance = Math.hypot(t.tx - from.tx, t.ty - from.ty);
    if (distance < bestDistance) {
      best = t;
      bestDistance = distance;
    }
  }
  return best;
}

/** How far ahead the Cabinet looks for a critter's next chance: past a whole moon, the longest wait. */
const LOOK_AHEAD = 40;

/** The next day a critter could be out, and whether it's only visiting then (V1's R5). */
export interface Chance {
  day: string;
  visit: boolean;
}

/**
 * The next day a critter could be out, from an hour of a day on (V1's R5): today if its hours are
 * still to come, the day's hours running on to five the next morning as the day key does. The
 * weather to come is the day key's too, so it's known. Null if none within `LOOK_AHEAD` days.
 */
export function nextChance(id: CritterId, day: string, hour: number): Chance | null {
  const h = Math.floor(hour);
  const from = h < WINDOW_FROM.morning ? h + 24 : h;
  for (let k = 0; k <= LOOK_AHEAD; k++) {
    const on = shiftDay(day, k);
    const weather = weatherOn(on);
    for (let at = k === 0 ? from : WINDOW_FROM.morning; at < WINDOW_FROM.morning + 24; at++) {
      if (isAbout(id, on, at % 24, weather)) return { day: on, visit: isVisiting(id, on, weather) };
    }
  }
  return null;
}

/** "8pm–4am", "All day", for the Curiosity Cabinet. */
export function hoursOf(id: CritterId): string {
  const { from, to } = CRITTERS[id];
  if (from === 0 && to === 24) return 'All day';
  return `${clockHour(from)}–${clockHour(to)}`;
}

/** "6pm", "noon", "midnight", for an hour of the day key (26 is two in the morning). */
export function clockHour(hour: number): string {
  const h = hour % 24;
  if (h === 0) return 'midnight';
  if (h === 12) return 'noon';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}
