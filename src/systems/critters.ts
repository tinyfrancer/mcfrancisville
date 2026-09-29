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
import { isFullMoon } from './calendar';
import { WINDOW_FROM } from './clock';
import { FULL_MOON_WEIGHT } from '../data/calendar';
import type { Tile } from './pathfinding';

/** How many critters are dealt out each hour, each a different kind. */
export const CRITTERS_PER_HOUR = 4;

/** How many fish are dealt into a place's water each hour, each a different kind (phase Q). */
export const FISH_PER_HOUR = 3;

/** How many more fish come up in the rain, which they love. */
export const RAIN_FISH = 1;

/** How much likelier a common critter is to be dealt than a rare one. */
export const RARITY_WEIGHT: Record<Rarity, number> = { common: 6, uncommon: 3, rare: 1 };

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
  const pond: Tile[] = [];
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      const around = NEIGHBOURS.map(([dx, dy]) => [tx + dx, ty + dy] as const);
      if (open(tx, ty) && around.some(([x, y]) => wet(x, y))) bank.push({ tx, ty });
      const clearWater = tileAt(map, tx, ty) === 'water' && !standing.has(`${tx},${ty}`);
      if (clearWater && around.some(([x, y]) => open(x, y))) {
        pond.push({ tx, ty });
      }
    }
  }
  const props = (id: string) => map.props.filter((p) => p.id === id);
  return {
    lanterns: beside(props('lantern')),
    flowers: beside(map.patches),
    trees: beside(props('tree')),
    pumpkins: beside(props('pumpkin')),
    graves: beside(props('gravestone')),
    mushrooms: beside(props('toadstools')),
    bank,
    pond,
  };
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
 * night of a full moon (`moonlit`), the moths and orbs are likelier still.
 */
export function weightOf(id: CritterId, weather: Weather, moonlit = false): number {
  const row = CRITTERS[id];
  const moon = moonlit ? (FULL_MOON_WEIGHT[row.family] ?? 1) : 1;
  return RARITY_WEIGHT[row.rarity] * (WEATHER_WEIGHT[weather][row.family] ?? 1) * moon;
}

/** Whether an hour of a day is the night of a full moon: from 6pm until the day turns over. */
export function isMoonlit(day: string, hour: number): boolean {
  return (hour >= WINDOW_FROM.evening || hour < WINDOW_FROM.morning) && isFullMoon(day);
}

/**
 * The critters out in a place this hour, and where: the same all hour, and different the next
 * (decisions.md 4). Each slot deals a different kind of critter from those that live there and
 * are about at this hour and in today's weather, weighted by rarity, the weather and a full moon,
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
    (id) => isOut(id, h) && CRITTERS[id].where.includes(place) && likesWeather(id, weather),
  );
  const seed = place === 'town' ? day : `${place}:${day}`;
  const moonlit = isMoonlit(day, h);
  const taken = new Set<string>();
  const out: OutCritter[] = [];
  const deal = (pool: CritterId[], first: number, count: number) => {
    for (let slot = first; slot < first + count && pool.length > 0; slot++) {
      const roll = hashString(`${seed}@${h}#${slot}`);
      const total = pool.reduce((sum, id) => sum + weightOf(id, weather, moonlit), 0);
      let pick = roll % total;
      const at = pool.findIndex((id) => (pick -= weightOf(id, weather, moonlit)) < 0);
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

/** "8pm–4am", "All day", for the Curiosity Cabinet. */
export function hoursOf(id: CritterId): string {
  const { from, to } = CRITTERS[id];
  if (from === 0 && to === 24) return 'All day';
  return `${clockHour(from)}–${clockHour(to)}`;
}

function clockHour(hour: number): string {
  const h = hour % 24;
  if (h === 0) return 'midnight';
  if (h === 12) return 'noon';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}
