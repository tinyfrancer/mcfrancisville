import type { PlacedProp } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import type { Facing, ZoneId } from '../../types/ids';

/** Where a way out leads, and how far along it she went, to come in level on the other side. */
export interface Crossing {
  to: ZoneId;
  along: number;
}

/** Where she stands, and which way she faces, as she comes into a zone. */
export interface Entry {
  tile: Tile;
  facing: Facing;
}

/**
 * One of the places she can be (decisions.md 78): its own small grid of tiles, what can be walked
 * on and walked up to, and its doors to other zones. Movement, taps and pathfinding ask the zone
 * she's in, and nothing else needs to know which one it is.
 */
export interface Zone {
  readonly id: ZoneId;
  /** Its size in tiles, which can change (her house grows). */
  readonly width: number;
  readonly height: number;
  canWalk(tx: number, ty: number): boolean;
  /** Something solid on a tile that she walks up to and uses, rather than onto. */
  propAt(tx: number, ty: number): PlacedProp | undefined;
  /** The open tiles to stand on to use whatever is on a tile, nearest first or not. */
  standBeside(tx: number, ty: number): Tile[];
  /**
   * Where she comes in from another zone, `along` its way out; from null, the world map, she
   * arrives wherever the place is first come to.
   */
  entry(from: ZoneId | null, along?: number): Entry;
  /**
   * Where she goes through to by arriving here: at a door she walked up to (`prop`), or on a tile
   * she walked onto. Null if this isn't a way out.
   */
  doorAt(here: Tile, prop: PlacedProp | undefined): Crossing | null;
}

/** Whether a prop's footprint covers a tile. */
export function covers(p: PlacedProp | null | undefined, tx: number, ty: number): boolean {
  return p != null && tx >= p.tx && tx < p.tx + p.w && ty >= p.ty && ty < p.ty + p.h;
}

/** The open tiles in the ring round a box, outside it. */
export function ringOf(
  box: { tx: number; ty: number; w: number; h: number },
  canWalk: (tx: number, ty: number) => boolean,
): Tile[] {
  const open: Tile[] = [];
  for (let y = box.ty - 1; y <= box.ty + box.h; y++) {
    for (let x = box.tx - 1; x <= box.tx + box.w; x++) {
      const inside = x >= box.tx && x < box.tx + box.w && y >= box.ty && y < box.ty + box.h;
      if (!inside && canWalk(x, y)) open.push({ tx: x, ty: y });
    }
  }
  return open;
}

/**
 * Where to stand to use something in a room: anywhere round it on the floor, or for something on
 * the wall, the floor just below it.
 */
export function besideInRoom(
  box: { tx: number; ty: number; w: number; h: number },
  wallRows: number,
  canWalk: (tx: number, ty: number) => boolean,
): Tile[] {
  if (box.ty >= wallRows) return ringOf(box, canWalk);
  const open: Tile[] = [];
  for (let x = box.tx - 1; x <= box.tx + box.w; x++) {
    if (canWalk(x, wallRows)) open.push({ tx: x, ty: wallRows });
  }
  return open;
}
