import { CRITTER_IDS, CRITTERS, type Habitat, type Rarity } from '../data/critters';
import { PARTY_SPOTS } from '../data/specialDays';
import { VILLAGER_IDS, VILLAGERS } from '../data/villagers';
import type { CritterId } from '../types/ids';
import { hashString } from './gathering';
import { tileAt, walkable, type TileMap } from './grid';
import type { Tile } from './pathfinding';

/** How many critters are dealt out each hour, each a different kind. */
export const CRITTERS_PER_HOUR = 5;

/** How much likelier a common critter is to be dealt than a rare one. */
export const RARITY_WEIGHT: Record<Rarity, number> = { common: 6, uncommon: 3, rare: 1 };

/** Every tile each habitat offers, worked out once from the map. */
export type Habitats = Record<Habitat, Tile[]>;

/** A critter out in town this hour, on its slot's tile. */
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

/** What a catch is remembered by in `taken`, so a critter caught is gone for the rest of its hour. */
export function critterKey(hour: number, slot: number): string {
  return `critter:${Math.floor(hour)}:${slot}`;
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
 * gravestone or flower patch, open ground on the pond's bank, and the pond's water beside the bank,
 * where she can reach it with her net. Never on a patch itself, where a tap is for the flowers.
 * `avoid` is anywhere else a critter would be in the way: her door, a snack's spot, a neighbour's
 * stop.
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
  const bank: Tile[] = [];
  const pond: Tile[] = [];
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      const around = NEIGHBOURS.map(([dx, dy]) => [tx + dx, ty + dy] as const);
      if (open(tx, ty) && around.some(([x, y]) => wet(x, y))) bank.push({ tx, ty });
      if (tileAt(map, tx, ty) === 'water' && around.some(([x, y]) => open(x, y))) {
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
    ? [
        ...VILLAGER_IDS.flatMap((id) => VILLAGERS[id].schedule).filter((s) => !s.zone),
        ...Object.values(PARTY_SPOTS),
      ]
    : [];
  return habitatsOf(map, [map.spawn, ...map.snackSpots, ...stops]);
}

/**
 * The critters out in town this hour, and where: the same all hour, and different the next
 * (decisions.md 4). Each slot deals a different kind of critter from those about at this hour,
 * weighted by rarity, onto a tile of its habitat that `usable` allows and no other critter has.
 */
export function crittersOut(
  day: string,
  hour: number,
  habitats: Habitats,
  usable: (t: Tile) => boolean = () => true,
): OutCritter[] {
  const h = Math.floor(hour);
  const pool = CRITTER_IDS.filter((id) => isOut(id, h));
  const taken = new Set<string>();
  const out: OutCritter[] = [];
  for (let slot = 0; slot < CRITTERS_PER_HOUR && pool.length > 0; slot++) {
    const roll = hashString(`${day}@${h}#${slot}`);
    const total = pool.reduce((sum, id) => sum + RARITY_WEIGHT[CRITTERS[id].rarity], 0);
    let pick = roll % total;
    const at = pool.findIndex((id) => (pick -= RARITY_WEIGHT[CRITTERS[id].rarity]) < 0);
    const critter = pool.splice(at, 1)[0]!;
    const tiles = habitats[CRITTERS[critter].habitat].filter(
      (t) => usable(t) && !taken.has(key(t)),
    );
    if (tiles.length === 0) continue;
    const tile = tiles[(roll >>> 12) % tiles.length]!;
    taken.add(key(tile));
    out.push({ slot, critter, tx: tile.tx, ty: tile.ty });
  }
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
