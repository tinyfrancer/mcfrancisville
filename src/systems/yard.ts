import { FURNITURE } from '../data/furniture';
import type { Placed } from '../data/home';
import { EGG_SPOTS } from '../data/holidays';
import { doorStep, PROP_FOOTPRINT, SPOTS } from '../data/maps';
import { LOST_SPOTS } from '../data/smallEvents';
import { isOutdoor } from '../data/yard';
import type { MapZoneId } from '../types/ids';
import { covers, footprint, onSurface, type Refusal } from './decor';
import { walkable, type TileMap } from './grid';
import { lurksOf } from './mystery';
import type { Tile } from './pathfinding';

/*
 * Her yard (0.3's H5): which tiles of the grass round her house a piece of hers may stand on, and
 * whether one fits where she tries it. Unlike a room's floor, the yard is part of the town, so a
 * piece there may never cut off anywhere anyone walks, nor anything anyone walks up to.
 */

interface Box {
  tx: number;
  ty: number;
  w: number;
  h: number;
}

/** The ground of her yard, worked out once from the town's map. */
export interface YardGround {
  map: TileMap;
  box: Box;
  /** The tiles a piece may stand on, by `ty * width + tx`. */
  lawn: ReadonlySet<number>;
  /** Every tile reached on foot from her door with nothing of hers out, by the same index. */
  reached: Uint8Array;
  /** Whatever is walked up to from a tile of the lawn (a prop, a bed), which must stay reachable. */
  uses: readonly Box[];
}

const index = (map: TileMap, tx: number, ty: number) => ty * map.width + tx;

/** Whether a tile is in her yard's box: where she stands to decorate it. */
export function inBox(box: Box, tx: number, ty: number): boolean {
  return tx >= box.tx && tx < box.tx + box.w && ty >= box.ty && ty < box.ty + box.h;
}

/**
 * Where nothing of hers may stand, though it's open grass: her door's step and the town's spawn,
 * where the night's snack turns up, every named spot her neighbours keep, where Barty hides an
 * egg, where a lost thing turns up, and where Wes peers round a tree.
 */
function reserved(map: TileMap, zone: MapZoneId): Tile[] {
  const tiles: Tile[] = [map.spawn, ...map.snackSpots, ...Object.values(SPOTS[zone])];
  for (const p of map.props) if (PROP_FOOTPRINT[p.id].door !== undefined) tiles.push(doorStep(p));
  if (zone === 'town') {
    tiles.push(...EGG_SPOTS, ...LOST_SPOTS.map((s) => s.at));
    tiles.push(...lurksOf(map, (tx, ty) => walkable(map, tx, ty)));
  }
  return tiles;
}

/**
 * Grass a building's roof and chimney rise over from behind, two rows above it and a column
 * either side: a piece there would be hidden.
 */
function behindBuildings(map: TileMap): Tile[] {
  const tiles: Tile[] = [];
  for (const p of map.props) {
    if (PROP_FOOTPRINT[p.id].door === undefined) continue;
    for (let ty = p.ty - 2; ty < p.ty; ty++) {
      for (let tx = p.tx - 1; tx <= p.tx + p.w; tx++) tiles.push({ tx, ty });
    }
  }
  return tiles;
}

/** Every tile reached on foot from the spawn, nothing standing on `blocked`. */
function reach(map: TileMap, blocked: (tx: number, ty: number) => boolean): Uint8Array {
  const seen = new Uint8Array(map.width * map.height);
  const start = map.spawn;
  const queue: Tile[] = [start];
  seen[index(map, start.tx, start.ty)] = 1;
  while (queue.length > 0) {
    const t = queue.pop()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const tx = t.tx + dx;
      const ty = t.ty + dy;
      if (!walkable(map, tx, ty) || blocked(tx, ty)) continue;
      const i = index(map, tx, ty);
      if (seen[i]) continue;
      seen[i] = 1;
      queue.push({ tx, ty });
    }
  }
  return seen;
}

/** The open tiles round a box. */
function ring(box: Box): Tile[] {
  const tiles: Tile[] = [];
  for (let ty = box.ty - 1; ty <= box.ty + box.h; ty++) {
    for (let tx = box.tx - 1; tx <= box.tx + box.w; tx++) {
      if (!inBox(box, tx, ty)) tiles.push({ tx, ty });
    }
  }
  return tiles;
}

/**
 * Her yard in a place's map, or null if it has none: the open grass in its box, less what's
 * reserved, hidden behind her house, a flower patch, a row kept for the farm, or cut off already.
 */
export function yardOf(map: TileMap, zone: MapZoneId = 'town'): YardGround | null {
  const box = map.yard;
  if (!box) return null;
  const reached = reach(map, () => false);
  const kept = new Set(
    [...reserved(map, zone), ...behindBuildings(map), ...map.patches, ...map.plots.flat()].map(
      (t) => index(map, t.tx, t.ty),
    ),
  );
  const lawn = new Set<number>();
  for (let ty = box.ty; ty < box.ty + box.h; ty++) {
    for (let tx = box.tx; tx < box.tx + box.w; tx++) {
      const i = index(map, tx, ty);
      if (map.tiles[i] !== 'grass' || !walkable(map, tx, ty) || kept.has(i) || !reached[i])
        continue;
      lawn.add(i);
    }
  }
  const nextToLawn = (b: Box) => ring(b).some((t) => lawn.has(index(map, t.tx, t.ty)));
  const beds = map.beds.map((b) => ({ ...b, w: 1, h: 1 }));
  const uses = [...map.props, ...beds].filter(nextToLawn).map(({ tx, ty, w, h }) => ({
    tx,
    ty,
    w,
    h,
  }));
  return { map, box, lawn, reached, uses };
}

/** Whether a standing piece of hers covers a tile, which nobody walks through then. */
export function standsOn(placed: readonly Placed[], tx: number, ty: number): boolean {
  return placed.some((p) => !p.on && FURNITURE[p.id].layer === 'floor' && covers(p, tx, ty));
}

/**
 * Whether everywhere reached on foot with nothing of hers out is reached still, and everything
 * walked up to from her lawn still has somewhere to stand beside it.
 */
function nothingCutOff(ground: YardGround, placed: readonly Placed[]): boolean {
  const { map } = ground;
  const now = reach(map, (tx, ty) => standsOn(placed, tx, ty));
  for (let i = 0; i < ground.reached.length; i++) {
    if (!ground.reached[i] || now[i]) continue;
    const tx = i % map.width;
    if (!standsOn(placed, tx, (i - tx) / map.width)) return false;
  }
  return ground.uses.every((u) => {
    const beside = ring(u).filter((t) => walkable(map, t.tx, t.ty));
    const before = beside.some((t) => ground.reached[index(map, t.tx, t.ty)]);
    return !before || beside.some((t) => now[index(map, t.tx, t.ty)]);
  });
}

/**
 * Why `piece` can't stand where it says in her yard among `others` (every other piece out there),
 * or null if it can. `standing` is her tile, which nothing may be put on.
 */
export function yardRefusal(
  ground: YardGround,
  others: readonly Placed[],
  piece: Placed,
  standing: Tile | null,
): Refusal | null {
  if (!isOutdoor(piece.id)) return 'indoors';
  if (piece.on) return onSurface(others, piece) ? null : 'noRoom';
  const { layer } = FURNITURE[piece.id];
  if (layer === 'wall') return 'noRoom';
  const { map } = ground;
  const { w, h } = footprint(piece.id, piece.turn);
  for (let ty = piece.ty; ty < piece.ty + h; ty++) {
    for (let tx = piece.tx; tx < piece.tx + w; tx++) {
      if (tx < 0 || tx >= map.width || !ground.lawn.has(index(map, tx, ty))) return 'noRoom';
      if (others.some((p) => !p.on && FURNITURE[p.id].layer === layer && covers(p, tx, ty))) {
        return 'noRoom';
      }
    }
  }
  if (layer !== 'floor') return null;
  if (standing && covers(piece, standing.tx, standing.ty)) return 'standing';
  return nothingCutOff(ground, [...others, piece]) ? null : 'inTheWay';
}

/**
 * The nearest place to `near` in her yard that a piece fits, for taking one out of the chest
 * there. Null if there's no room for it anywhere.
 */
export function yardFit(
  ground: YardGround,
  placed: readonly Placed[],
  id: Placed['id'],
  near: Tile,
  standing: Tile | null,
): Placed | null {
  const { map } = ground;
  const tiles = [...ground.lawn]
    .map((i) => ({ tx: i % map.width, ty: Math.floor(i / map.width) }))
    .sort((a, b) => distance(a, near) - distance(b, near) || a.ty - b.ty || a.tx - b.tx);
  for (const t of tiles) {
    const piece: Placed = { id, tx: t.tx, ty: t.ty, turn: 0 };
    if (yardRefusal(ground, placed, piece, standing) === null) return piece;
  }
  return null;
}

const distance = (a: Tile, b: Tile) => Math.abs(a.tx - b.tx) + Math.abs(a.ty - b.ty);
