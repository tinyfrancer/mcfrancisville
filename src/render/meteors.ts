import { TILE_SIZE } from '../config/world';
import { PALETTE } from '../sprites/palette';
import { hashString, seeded } from '../systems/random';
import type { Point } from './camera';

/*
 * A meteor shower (V1's R3): shooting stars streaking down across the night, each from a place in
 * the world of its own as fireworks are, so they stay put as she walks. Drawn after the light, so
 * they shine in the dark.
 */

/** The sky is cut into cells this many pixels a side, one shooting star each, on its own beat. */
const CELL = 9 * TILE_SIZE;
/** How often each cell's star falls, and how long it takes to cross. */
const EVERY = 3400;
const FALL_MS = 700;
/** How far one falls, and how long its tail is, in pixels. */
const REACH = 90;
const TAIL = 22;

export function drawMeteors(ctx: CanvasRenderingContext2D, cam: Point, nowMs: number): void {
  const { width, height } = ctx.canvas;
  const x0 = Math.floor((cam.x - REACH) / CELL);
  const x1 = Math.floor((cam.x + width + REACH) / CELL);
  const y0 = Math.floor((cam.y - REACH) / CELL);
  const y1 = Math.floor((cam.y + height) / CELL);
  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) {
      const offset = hashString(`meteor:${cx},${cy}`) % EVERY;
      const k = Math.floor((nowMs - offset) / EVERY);
      const age = nowMs - offset - k * EVERY;
      if (age > FALL_MS) continue;
      const random = seeded(hashString(`meteor:${cx},${cy}:${k}`));
      const startX = cx * CELL + random() * CELL - cam.x;
      const startY = cy * CELL + random() * (CELL / 2) - cam.y;
      const t = age / FALL_MS;
      // Down and to the left, a little steeper than a diagonal.
      const headX = startX - t * REACH * 0.8;
      const headY = startY + t * REACH * 0.6;
      for (let i = 0; i < TAIL; i++) {
        ctx.globalAlpha = (1 - i / TAIL) * (1 - t * 0.6);
        ctx.fillStyle = i < 3 ? PALETTE.white : PALETTE.candleBright;
        ctx.fillRect(Math.round(headX + i * 0.8), Math.round(headY - i * 0.6), i < 2 ? 2 : 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;
}
