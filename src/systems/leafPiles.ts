import { FALLING_LEAVES } from '../data/leaves';
import { PILE_CANDY, PILE_CRITTER_IN_FIVE, PILES_A_PLACE } from '../data/leafPiles';
import { doorStep, PROP_FOOTPRINT, SPOTS } from '../data/maps';
import type { MapZoneId, PropId } from '../types/ids';
import type { PlacedProp, TileMap } from './grid';
import type { Tile } from './pathfinding';
import { hashMixed } from './random';
import { seasonOf } from './seasons';

/*
 * Leaf piles (1.7's Y2, decision 389): in autumn, when the trees let their leaves go (V1's E5's
 * `FALLING_LEAVES`), a pile gathers at the foot of two or three of each place's trees, dealt from
 * the day key, on open grass and never in anyone's way.
 */

/** What's in a place's piles today is taken once a day (`onceADay`'s `pile:`). */
export function pileKey(zone: MapZoneId): string {
  return `pile:${zone}`;
}

/** Whether leaf piles gather on a day: in autumn, as the leaves fall. */
export function pilesFallOn(day: string): boolean {
  return seasonOf(day) === FALLING_LEAVES.season;
}

/** Whether a prop is a tree that sheds its leaves into a pile. */
function sheds(id: PropId): boolean {
  return (FALLING_LEAVES.trees as readonly PropId[]).includes(id);
}

const key = (t: Tile) => `${t.tx},${t.ty}`;

/** How many rows over a prop's footprint its picture may rise: a tree's crown, a roof. */
const BEHIND = 3;

/**
 * The tiles a place keeps clear of a pile: anywhere a neighbour stands or the day's mound may be,
 * where the snack or a stall turns up, her yard and the farm's rows to come, the way in at a door,
 * each way out, the spawn, and the flower patches.
 */
function keptClear(zone: MapZoneId, map: TileMap): Set<string> {
  const clear = new Set<string>();
  const add = (t: Tile) => clear.add(key(t));
  const box = (b: { tx: number; ty: number; w: number; h: number }) => {
    for (let y = b.ty; y < b.ty + b.h; y++)
      for (let x = b.tx; x < b.tx + b.w; x++) add({ tx: x, ty: y });
  };
  for (const t of Object.values(SPOTS[zone] as Readonly<Record<string, Tile>>)) add(t);
  for (const t of map.digSpots) add(t);
  for (const t of map.snackSpots) add(t);
  for (const t of map.peddlerSpots) box({ ...t, ...PROP_FOOTPRINT.moonPieCart });
  for (const t of map.popUpLots) box({ ...t, ...PROP_FOOTPRINT.popUpShop });
  for (const row of map.plots) for (const t of row) add(t);
  for (const p of map.patches) add(p);
  for (const e of map.exits) box(e);
  if (map.yard) box(map.yard);
  add(map.spawn);
  for (const p of map.props) if (PROP_FOOTPRINT[p.id].door !== undefined) add(doorStep(p));
  return clear;
}

/**
 * Where a pile could be under each shedding tree: the grass just in front of its trunk first, then
 * beside it, open and kept clear of everything `keptClear` names. A tree with nowhere has none.
 */
export function pileSpots(
  zone: MapZoneId,
  map: TileMap,
  open: (tx: number, ty: number) => boolean,
): Tile[][] {
  const clear = keptClear(zone, map);
  const standing = new Set<string>();
  for (const p of map.props) {
    // Its footprint, and the three rows over it that a crown or a roof rises into, so a pile is
    // never drawn showing through another tree's branches.
    for (let y = p.ty - BEHIND; y < p.ty + p.h; y++) {
      for (let x = p.tx; x < p.tx + p.w; x++) standing.add(key({ tx: x, ty: y }));
    }
  }
  const fits = (t: Tile) =>
    t.tx >= 0 &&
    t.ty >= 0 &&
    t.tx < map.width &&
    t.ty < map.height &&
    map.tiles[t.ty * map.width + t.tx] === 'grass' &&
    !map.solid[t.ty * map.width + t.tx] &&
    !standing.has(key(t)) &&
    !clear.has(key(t)) &&
    open(t.tx, t.ty);
  const spots: Tile[][] = [];
  for (const p of map.props) {
    if (!sheds(p.id)) continue;
    const below = p.ty + p.h;
    const front = Array.from({ length: p.w }, (_, i) => ({ tx: p.tx + i, ty: below }));
    const beside = [
      { tx: p.tx - 1, ty: below },
      { tx: p.tx + p.w, ty: below },
      { tx: p.tx - 1, ty: below - 1 },
      { tx: p.tx + p.w, ty: below - 1 },
    ];
    const tiles = [...front, ...beside].filter(fits);
    if (tiles.length > 0) spots.push(tiles);
  }
  return spots;
}

/**
 * Today's piles in a place: two or three trees dealt from the day, a tile at each one's foot, no
 * two piles side by side. None out of autumn.
 */
export function pilesOn(zone: MapZoneId, spots: readonly Tile[][], day: string): PlacedProp[] {
  if (!pilesFallOn(day) || spots.length === 0) return [];
  const { least, most } = PILES_A_PLACE;
  const want = least + (hashMixed(`piles:${zone}:${day}`) % (most - least + 1));
  const order = spots
    .map((tiles, i) => ({ tiles, rank: hashMixed(`pile:${zone}:${day}:${i}`) }))
    .sort((a, b) => a.rank - b.rank);
  const piles: PlacedProp[] = [];
  for (const { tiles, rank } of order) {
    if (piles.length >= want) break;
    const near = (t: Tile) =>
      piles.some((p) => Math.abs(p.tx - t.tx) <= 1 && Math.abs(p.ty - t.ty) <= 1);
    const free = tiles.filter((t) => !near(t));
    // In front of the trunk most days, beside it now and then.
    const pick = free[(rank >>> 7) % Math.min(free.length, 2)] ?? free[0];
    if (pick) piles.push({ id: 'leafPile', tx: pick.tx, ty: pick.ty, w: 1, h: 1 });
  }
  return piles;
}

/** What a place's first jump of the day finds, after any lost thing or keepsake: a critter or Candy. */
export type PileFind = { critter: true } | { candy: number };

/**
 * What's in a place's piles today, besides a lost thing lying in town: a critter rustling out
 * three days in five, else a little Candy someone dropped.
 */
export function pileFindOn(zone: MapZoneId, day: string): PileFind {
  const h = hashMixed(`pile:find:${zone}:${day}`);
  if (h % 5 < PILE_CRITTER_IN_FIVE) return { critter: true };
  const { least, most } = PILE_CANDY;
  return { candy: least + ((h >>> 5) % (most - least + 1)) };
}

/** Candy the day's piles hand out where a critter was dealt but none could come out. */
export function pileCandyOn(zone: MapZoneId, day: string): number {
  const { least, most } = PILE_CANDY;
  return least + (hashMixed(`pile:candy:${zone}:${day}`) % (most - least + 1));
}
