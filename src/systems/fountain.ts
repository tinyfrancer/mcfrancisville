import type { PlacedProp } from './grid';
import { daylight } from './clock';
import type { Tile } from './pathfinding';

/*
 * The pond's fountain plays its music box after dark while she stands by it (0.2's H2), like the
 * one in the park near them that lights up at night.
 */

/** How near the fountain's middle, in tiles, she can stand and hear it: anywhere round its pond. */
export const FOUNTAIN_REACH = 7.5;

/** It plays once its lamps are more than half lit: from a quarter past six till a quarter to seven. */
const LIT_ENOUGH = 0.5;

/** Whether it's dark enough at this hour for the fountain to light up and play. */
export function fountainLit(hour: number): boolean {
  return daylight(hour).lamps > LIT_ENOUGH;
}

/** Whether `tile` is within hearing of one of the place's fountains. */
export function byFountain(props: readonly PlacedProp[], tile: Tile): boolean {
  return props.some(
    (p) =>
      p.id === 'fountain' &&
      Math.hypot(tile.tx + 0.5 - (p.tx + p.w / 2), tile.ty + 0.5 - (p.ty + p.h / 2)) <=
        FOUNTAIN_REACH,
  );
}
