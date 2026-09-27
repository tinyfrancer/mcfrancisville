import { FURNITURE } from '../data/furniture';
import { CHEST, DOOR_MAT, ROOM, ROOM_HEIGHT, type Placed } from '../data/home';
import type { FurnitureId } from '../types/ids';
import type { Tile } from './pathfinding';

/**
 * Why a piece can't go somewhere: it doesn't fit (off its wall or floor, on the mat or the chest, or
 * over another piece), she's standing there, or it would shut off part of the room.
 */
export type Refusal = 'noRoom' | 'standing' | 'blocking';

/** The tiles a piece covers, which for a long piece turned on its side are the other way round. */
export function footprint(id: FurnitureId, turn: number): { w: number; h: number } {
  const { size, turns } = FURNITURE[id];
  return turns === 'four' && turn % 2 === 1 ? { w: size.h, h: size.w } : { ...size };
}

export function covers(p: Placed, tx: number, ty: number): boolean {
  const { w, h } = footprint(p.id, p.turn);
  return tx >= p.tx && tx < p.tx + w && ty >= p.ty && ty < p.ty + h;
}

const same = (a: Tile, b: Tile) => a.tx === b.tx && a.ty === b.ty;

const onFloor = (tx: number, ty: number) =>
  tx >= 0 && tx < ROOM.width && ty >= ROOM.wallRows && ty < ROOM_HEIGHT;

/** Floor she can stand on: not the chest, and not under anything but a rug. */
export function isOpenFloor(placed: readonly Placed[], tx: number, ty: number): boolean {
  if (!onFloor(tx, ty) || same({ tx, ty }, CHEST)) return false;
  return !placed.some((p) => FURNITURE[p.id].layer === 'floor' && covers(p, tx, ty));
}

/**
 * Whether every bit of open floor can still be reached from the door, and the chest from some of
 * it, so no piece ever walls her in or out (decisions.md 11).
 */
function allReachable(placed: readonly Placed[]): boolean {
  const seen = new Set<string>();
  const key = (t: Tile) => `${t.tx},${t.ty}`;
  const queue: Tile[] = [DOOR_MAT];
  seen.add(key(DOOR_MAT));
  while (queue.length > 0) {
    const t = queue.pop()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const next = { tx: t.tx + dx, ty: t.ty + dy };
      if (!seen.has(key(next)) && isOpenFloor(placed, next.tx, next.ty)) {
        seen.add(key(next));
        queue.push(next);
      }
    }
  }
  let open = 0;
  for (let ty = ROOM.wallRows; ty < ROOM_HEIGHT; ty++) {
    for (let tx = 0; tx < ROOM.width; tx++) if (isOpenFloor(placed, tx, ty)) open++;
  }
  const byChest = [
    { tx: CHEST.tx + 1, ty: CHEST.ty },
    { tx: CHEST.tx - 1, ty: CHEST.ty },
    { tx: CHEST.tx, ty: CHEST.ty + 1 },
    { tx: CHEST.tx, ty: CHEST.ty - 1 },
  ];
  return seen.size === open && byChest.some((t) => seen.has(key(t)));
}

/**
 * Why `piece` can't go where it says among `others` (every other placed piece), or null if it
 * can. `standing` is her tile, which nothing may be put on.
 */
export function refusal(
  others: readonly Placed[],
  piece: Placed,
  standing: Tile | null,
): Refusal | null {
  const { layer } = FURNITURE[piece.id];
  const { w, h } = footprint(piece.id, piece.turn);
  for (let ty = piece.ty; ty < piece.ty + h; ty++) {
    for (let tx = piece.tx; tx < piece.tx + w; tx++) {
      if (layer === 'wall') {
        if (tx < 0 || tx >= ROOM.width || ty < 0 || ty >= ROOM.wallRows) return 'noRoom';
      } else if (!onFloor(tx, ty) || same({ tx, ty }, DOOR_MAT) || same({ tx, ty }, CHEST)) {
        return 'noRoom';
      }
      if (others.some((p) => FURNITURE[p.id].layer === layer && covers(p, tx, ty))) {
        return 'noRoom';
      }
    }
  }
  if (layer !== 'floor') return null;
  if (standing && covers(piece, standing.tx, standing.ty)) return 'standing';
  return allReachable([...others, piece]) ? null : 'blocking';
}

/**
 * Where a piece could go so that it covers a tapped tile, best first: with the tile at the middle
 * of its front edge, which is where a finger lands on it, then every other way round.
 */
export function anchorsFor(id: FurnitureId, turn: number, tx: number, ty: number): Placed[] {
  const { w, h } = footprint(id, turn);
  const first = { id, turn, tx: tx - Math.floor((w - 1) / 2), ty: ty - (h - 1) };
  const all: Placed[] = [first];
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const at = { id, turn, tx: tx - dx, ty: ty - dy };
      if (at.tx !== first.tx || at.ty !== first.ty) all.push(at);
    }
  }
  return all;
}

/**
 * The nearest place to `near` that a piece fits, for taking one out of the chest: the floor near
 * her, or the wall above her. Null if there is no room for it anywhere.
 */
export function nearestFit(
  placed: readonly Placed[],
  id: FurnitureId,
  near: Tile,
  standing: Tile | null,
): Placed | null {
  const wall = FURNITURE[id].layer === 'wall';
  const target = wall ? { tx: near.tx, ty: 1 } : near;
  let best: { piece: Placed; distance: number } | null = null;
  for (let ty = 0; ty < ROOM_HEIGHT; ty++) {
    for (let tx = 0; tx < ROOM.width; tx++) {
      const piece = { id, tx, ty, turn: 0 };
      const distance = Math.abs(tx - target.tx) + Math.abs(ty - target.ty);
      if (best && distance >= best.distance) continue;
      if (refusal(placed, piece, standing) === null) best = { piece, distance };
    }
  }
  return best?.piece ?? null;
}
