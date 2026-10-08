import type { Facing } from '../types/ids';
import type { Tile } from './pathfinding';

/** A run of tiles from its top-left, `w` by `h`: a prop's footprint, a bed, a piece. */
export interface Box {
  tx: number;
  ty: number;
  w: number;
  h: number;
}

/**
 * Which way she faces, standing on `here`, to see to what's in `box` (V1's E2, decision 281):
 * toward the nearest of its tiles, across or along whichever is further, up or down on a tie (a
 * thing at her corner is in front of her or behind, as a bed she reaches over is). Standing on
 * it (flowers, a mat), she keeps the way she came.
 */
export function facingToward(here: Tile, box: Box, current: Facing): Facing {
  const nearest = (at: number, from: number, size: number) =>
    Math.min(Math.max(at, from), from + Math.max(1, size) - 1);
  const dx = nearest(here.tx, box.tx, box.w) - here.tx;
  const dy = nearest(here.ty, box.ty, box.h) - here.ty;
  if (dx === 0 && dy === 0) return current;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}
