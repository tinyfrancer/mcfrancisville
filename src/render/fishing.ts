import { TILE_SIZE } from '../config/world';
import { PALETTE as C } from '../sprites/palette';
import { ROD_TIP } from '../sprites/tools';
import { CAST_MS } from '../systems/fishing';
import type { World } from '../world/World';
import type { Point } from './camera';
import type { Drawable } from './scene';

/**
 * Her line (phase Q): from her rod's tip, sagging a little, to her pumpkin float over the fish.
 * The float arcs out as she casts, bobs as it waits, dips at a nibble and goes under at a bite,
 * with rings on the water. `me` is her drawable this frame, whose `held` is the rod.
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  world: World,
  me: Drawable,
  cam: Point,
  nowMs: number,
): void {
  const line = world.fishing.line;
  const rod = me.held;
  if (!line || !rod) return;
  const flipped = world.player.facing === 'down' || world.player.facing === 'left';
  const tip = {
    x: rod.x + (flipped ? rod.sprite.width - 1 - ROD_TIP.x : ROD_TIP.x) - cam.x,
    y: rod.y + ROD_TIP.y - cam.y,
  };
  const water = {
    x: line.tx * TILE_SIZE + TILE_SIZE / 2 - cam.x,
    y: line.ty * TILE_SIZE + TILE_SIZE / 2 - cam.y,
  };
  const elapsed = world.clock.now() - line.at;
  let float: Point;
  if (line.state === 'casting') {
    const t = Math.min(1, elapsed / CAST_MS);
    float = {
      x: Math.round(tip.x + (water.x - tip.x) * t),
      y: Math.round(tip.y + (water.y - tip.y) * t - Math.sin(t * Math.PI) * 18),
    };
  } else {
    const dip = line.state === 'nibble' ? 2 : line.state === 'bite' ? 4 : 0;
    float = { x: water.x, y: water.y + Math.round(Math.sin(nowMs / 500)) + dip };
  }
  // The line, sagging toward the water between her tip and the float.
  ctx.fillStyle = C.ghost;
  ctx.globalAlpha = 0.8;
  const steps = Math.max(8, Math.ceil(Math.hypot(float.x - tip.x, float.y - tip.y)));
  const sag = line.state === 'bite' ? 0 : 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = tip.x + (float.x - tip.x) * t;
    const y = tip.y + (float.y - tip.y) * t + Math.sin(t * Math.PI) * sag;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  ctx.globalAlpha = 1;
  if (line.state !== 'casting') rings(ctx, water, line.state, nowMs);
  if (line.state === 'bite') return;
  // A little pumpkin: orange, a darker rib, and a green stem.
  ctx.fillStyle = C.pumpkinDark;
  ctx.fillRect(float.x - 3, float.y - 2, 6, 4);
  ctx.fillStyle = C.pumpkin;
  ctx.fillRect(float.x - 2, float.y - 2, 4, 3);
  ctx.fillStyle = C.pumpkinLight;
  ctx.fillRect(float.x - 2, float.y - 2, 1, 1);
  ctx.fillStyle = C.leafDark;
  ctx.fillRect(float.x, float.y - 4, 1, 2);
}

/** Rings on the water round the float: a slow one as it waits, quick ones at a nibble or bite. */
function rings(ctx: CanvasRenderingContext2D, at: Point, state: string, nowMs: number): void {
  const period = state === 'waiting' ? 1600 : 400;
  const t = (nowMs % period) / period;
  const r = 3 + Math.round(t * (state === 'bite' ? 10 : 6));
  ctx.globalAlpha = 0.6 * (1 - t);
  ctx.fillStyle = C.ghost;
  for (let a = 0; a < 24; a++) {
    const angle = (a / 24) * Math.PI * 2;
    ctx.fillRect(
      Math.round(at.x + Math.cos(angle) * r),
      Math.round(at.y + 2 + Math.sin(angle) * r * 0.5),
      1,
      1,
    );
  }
  ctx.globalAlpha = 1;
}

/** At a bite, a "!" over her head, drawn over the night so it's never missed. */
export function drawBite(
  ctx: CanvasRenderingContext2D,
  world: World,
  me: Drawable,
  cam: Point,
): void {
  if (world.fishing.line?.state !== 'bite') return;
  const x = Math.round(me.x + me.sprite.width / 2 - cam.x) - 4;
  const y = Math.round(me.y - cam.y) - 16;
  ctx.fillStyle = C.ink;
  ctx.fillRect(x, y, 9, 13);
  ctx.fillStyle = C.white;
  ctx.fillRect(x + 1, y + 1, 7, 11);
  ctx.fillStyle = C.scarlet;
  ctx.fillRect(x + 3, y + 2, 3, 6);
  ctx.fillRect(x + 3, y + 9, 3, 2);
}
