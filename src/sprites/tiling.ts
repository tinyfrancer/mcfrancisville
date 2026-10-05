import { CLEAR, Sketch } from './sketch';
import type { SpriteSource } from './sprite';

/*
 * How a wall or a floor is made one tile that repeats (phase J, `surfaces.ts`; shared with 0.3's
 * S4 in `wallsAndFloors.ts`).
 */

export const SIZE = 32;

/**
 * A tile filled with `ground`, and whatever `draw` paints on a sketch three tiles across, folded
 * onto the middle tile, so a motif drawn across an edge wraps round to the other side.
 */
export function tile(ground: string, draw: (s: Sketch) => void): SpriteSource {
  const big = new Sketch(SIZE * 3, SIZE * 3);
  draw(big);
  const s = new Sketch(SIZE, SIZE, ground);
  for (let y = 0; y < SIZE * 3; y++) {
    for (let x = 0; x < SIZE * 3; x++) {
      const key = big.get(x, y)!;
      if (key !== CLEAR) s.set(x % SIZE, y % SIZE, key);
    }
  }
  return s.toSource();
}

/** Draws `motif` at a point in the tile and again half a tile over and down: a half-drop repeat. */
export function halfDrop(x: number, y: number, motif: (x: number, y: number) => void): void {
  motif(SIZE + x, SIZE + y);
  motif(SIZE + x + SIZE / 2, SIZE + y + SIZE / 2);
  motif(x + SIZE / 2, y + SIZE / 2);
}
