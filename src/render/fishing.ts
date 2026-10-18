import { TILE_SIZE } from '../config/world';
import { PALETTE as C } from '../sprites/palette';
import { ROD_TIP } from '../sprites/tools';
import { CAST_MS } from '../systems/fishing';
import { tileHash } from '../sprites/terrain';
import type { Critter, World } from '../world/World';
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
    const under = line.state === 'bite' || line.state === 'reel';
    const dip = line.state === 'nibble' ? 2 : under ? 4 : 0;
    float = { x: water.x, y: water.y + Math.round(Math.sin(nowMs / 500)) + dip };
  }
  // The line, sagging toward the water between her tip and the float.
  ctx.fillStyle = C.ghost;
  ctx.globalAlpha = 0.8;
  const steps = Math.max(8, Math.ceil(Math.hypot(float.x - tip.x, float.y - tip.y)));
  const sag = line.state === 'bite' || line.state === 'reel' ? 0 : 6;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = tip.x + (float.x - tip.x) * t;
    const y = tip.y + (float.y - tip.y) * t + Math.sin(t * Math.PI) * sag;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  ctx.globalAlpha = 1;
  if (line.state !== 'casting') rings(ctx, water, line.state, nowMs);
  if (line.state === 'bite' || line.state === 'reel') return;
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

/**
 * A ring now and then over each fish in the water, so a shadow can be found on dark water, in the
 * fog or at night. Not over the one on her line, which has its float's rings.
 */
export function drawFishRings(
  ctx: CanvasRenderingContext2D,
  world: World,
  fish: readonly Critter[],
  cam: Point,
  nowMs: number,
): void {
  const hooked = world.fishing.line?.key;
  for (const f of fish) {
    if (f.key === hooked) continue;
    const t = (nowMs + tileHash(f.tx, f.ty) * 3) % FISH_RING_MS;
    if (t > FISH_RING_MS / 3) continue;
    const at = {
      x: f.tx * TILE_SIZE + TILE_SIZE / 2 - cam.x,
      y: f.ty * TILE_SIZE + TILE_SIZE / 2 - cam.y,
    };
    ring(
      ctx,
      at,
      4 + Math.round((t / (FISH_RING_MS / 3)) * 7),
      0.55 * (1 - t / (FISH_RING_MS / 3)),
    );
  }
}

/** How often a fish sends up a ring. */
const FISH_RING_MS = 2400;

/** A flattened ring of pale dots on the water. */
function ring(ctx: CanvasRenderingContext2D, at: Point, r: number, alpha: number): void {
  ctx.globalAlpha = alpha;
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

/** Rings on the water round the float: a slow one as it waits, quick ones at a nibble or bite. */
function rings(ctx: CanvasRenderingContext2D, at: Point, state: string, nowMs: number): void {
  const period = state === 'waiting' ? 1600 : 400;
  const t = (nowMs % period) / period;
  ring(
    ctx,
    at,
    3 + Math.round(t * (state === 'waiting' || state === 'nibble' ? 6 : 10)),
    0.6 * (1 - t),
  );
}

/** How wide the tension bar over her head is, in world pixels (V1's R6a). */
const BAR_W = 44;

/**
 * A rare fish hooked (V1's R6a): the tension bar over her head, its window glowing and its middle
 * brightest, and the needle sweeping across it, read off the world's clock as the score is.
 */
function drawReel(ctx: CanvasRenderingContext2D, world: World, me: Drawable, cam: Point): void {
  const reeling = world.fishing.line?.reeling;
  if (!reeling) return;
  const { reel, needle } = reeling;
  const x = Math.round(me.x + me.sprite.width / 2 - cam.x) - BAR_W / 2;
  const y = Math.round(me.y - cam.y) - 16;
  const along = (u: number) => x + 2 + Math.round(u * (BAR_W - 4));
  ctx.fillStyle = C.ink;
  ctx.fillRect(x, y, BAR_W, 8);
  ctx.fillRect(x + 1, y - 1, BAR_W - 2, 10);
  ctx.fillStyle = C.night;
  ctx.fillRect(x + 2, y + 1, BAR_W - 4, 6);
  const good = [along(reel.target - reel.good), along(reel.target + reel.good)] as const;
  ctx.fillStyle = C.orbGreenDark;
  ctx.fillRect(good[0], y + 1, good[1] - good[0], 6);
  const perfect = [along(reel.target - reel.perfect), along(reel.target + reel.perfect)] as const;
  ctx.fillStyle = C.orbGreen;
  ctx.fillRect(perfect[0], y + 1, Math.max(2, perfect[1] - perfect[0]), 6);
  const at = along(needle);
  ctx.fillStyle = C.ink;
  ctx.fillRect(at - 2, y - 3, 4, 14);
  ctx.fillStyle = C.white;
  ctx.fillRect(at - 1, y - 2, 2, 12);
}

/**
 * At a bite, a "!" over her head, drawn over the night so it's never missed; with a rare fish
 * hooked, the tension bar there instead.
 */
export function drawBite(
  ctx: CanvasRenderingContext2D,
  world: World,
  me: Drawable,
  cam: Point,
): void {
  drawReel(ctx, world, me, cam);
  if (world.fishing.line?.state !== 'bite') return;
  // A bubble half again as big as her head is wide, with a tail pointing down at her (0.2's K2).
  const x = Math.round(me.x + me.sprite.width / 2 - cam.x) - 6;
  const y = Math.round(me.y - cam.y) - 24;
  ctx.fillStyle = C.ink;
  ctx.fillRect(x, y + 1, 13, 16);
  ctx.fillRect(x + 1, y, 11, 18);
  ctx.fillRect(x + 5, y + 18, 3, 1);
  ctx.fillRect(x + 6, y + 19, 1, 1);
  ctx.fillStyle = C.white;
  ctx.fillRect(x + 1, y + 1, 11, 16);
  ctx.fillRect(x + 6, y + 17, 1, 2);
  ctx.fillStyle = C.scarlet;
  ctx.fillRect(x + 4, y + 3, 5, 7);
  ctx.fillRect(x + 5, y + 10, 3, 2);
  ctx.fillRect(x + 4, y + 13, 5, 3);
}
