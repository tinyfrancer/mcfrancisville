import { TILE_SIZE } from '../config/world';
import { mix, PALETTE as C, ramp } from '../sprites/palette';
import { ROD_TIP } from '../sprites/tools';
import { CAST_MS } from '../systems/fishing';
import { tileHash } from '../sprites/terrain';
import type { Critter, World } from '../world/World';
import { isFish } from '../data/critters';
import type { MapZoneId } from '../types/ids';
import type { Tile } from '../systems/pathfinding';
import type { Point } from './camera';
import type { Pass } from './passes/pass';
import type { Drawable } from './scene';

/**
 * Her line (phase Q): from her rod's tip, sagging a little, to her pumpkin float over the fish.
 * The float arcs out as she casts, bobs as it waits, dips at a nibble and goes under at a bite,
 * with rings on the water. `me` is her drawable this frame, whose `held` is the rod. `inHole`
 * when the float is in a hole through the ice (1.4's G3), where its rings stay inside the hole.
 */
export function drawLine(
  ctx: CanvasRenderingContext2D,
  world: World,
  me: Drawable,
  cam: Point,
  nowMs: number,
  inHole = false,
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
  if (line.state !== 'casting') rings(ctx, water, line.state, nowMs, inHole ? HOLE.rx - 2 : 13);
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
  under: (f: Critter) => boolean = () => false,
): void {
  const hooked = world.fishing.line?.key;
  for (const f of fish) {
    // No rings on ice: a fish under it is only its dim shadow (1.4's G3).
    if (f.key === hooked || under(f)) continue;
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

/**
 * Rings on the water round the float: a slow one as it waits, quick ones at a nibble or bite, never
 * wider than `widest`.
 */
function rings(
  ctx: CanvasRenderingContext2D,
  at: Point,
  state: string,
  nowMs: number,
  widest: number,
): void {
  const period = state === 'waiting' ? 1600 : 400;
  const t = (nowMs % period) / period;
  const spread = Math.min(widest - 3, state === 'waiting' || state === 'nibble' ? 6 : 10);
  ring(ctx, at, 3 + Math.round(t * spread), 0.6 * (1 - t));
}

/**
 * The hole she fishes through on the ice (1.4's G3), round its middle in world pixels: flattened
 * as the rings are, `rx` across and `ry` deep, the lip of slush she drilled out round it.
 */
export const HOLE = { rx: 10, ry: 5.5 } as const;

/** The hole's colours: dark open water, deeper under the far edge, a wet rim, and slush. */
const HOLE_COLOURS = {
  deep: ramp(C.water)[1],
  water: C.water,
  glint: C.waterLight,
  wall: mix(C.ice, C.water, 0.45),
  rim: mix(ramp(C.ice)[1], C.water, 0.55),
  slush: C.iceLight,
  shade: mix(C.ice, ramp(C.ice)[1], 0.55),
} as const;

/** Which of the hole's colours a pixel `(dx, dy)` from its middle is, if any. */
export function holePixel(dx: number, dy: number): keyof typeof HOLE_COLOURS | null {
  const px = dx + 0.5;
  const py = dy + 0.5;
  const e = (px / HOLE.rx) ** 2 + (py / HOLE.ry) ** 2;
  const lip = (px / (HOLE.rx + 2)) ** 2 + (py / (HOLE.ry + 1.5)) ** 2;
  if (e <= 1) {
    // The ice's thickness, seen down the far side; then the water, darkest under it.
    const wall = (px / HOLE.rx) ** 2 + ((py + 1.5) / HOLE.ry) ** 2 > 1;
    if (wall && dy < 0) return 'wall';
    if (dy === -1 && dx >= -2 && dx <= 1) return 'deep';
    if (dy === 1 && (dx === 3 || dx === 4)) return 'glint';
    return dy < 0 ? 'deep' : 'water';
  }
  if (e <= 1.35) return 'rim';
  if (lip <= 1) {
    // Slush pushed up round the hole, its near side in shade, in lumps rather than a ring.
    const lumpy = (dx * 7 + dy * 13 + 40) % 5 !== 0;
    if (!lumpy) return null;
    return dy > 0 ? 'shade' : 'slush';
  }
  return null;
}

/**
 * The hole through the ice under her float (1.4's G3): a dark round of open water with the ice's
 * thickness showing down its far side, a wet rim, and lumps of the slush she drilled out round it,
 * drawn on the ground under everything standing. Only while her line is in on ice.
 */
export function drawHole(ctx: CanvasRenderingContext2D, at: Tile, cam: Point): void {
  const cx = at.tx * TILE_SIZE + TILE_SIZE / 2 - cam.x;
  const cy = at.ty * TILE_SIZE + TILE_SIZE / 2 + 2 - cam.y;
  for (let dy = -Math.ceil(HOLE.ry + 2); dy <= Math.ceil(HOLE.ry + 2); dy++) {
    for (let dx = -HOLE.rx - 2; dx <= HOLE.rx + 2; dx++) {
      const key = holePixel(dx, dy);
      if (!key) continue;
      ctx.fillStyle = HOLE_COLOURS[key];
      ctx.fillRect(cx + dx, cy + dy, 1, 1);
    }
  }
}

/** Where her line's hole through the ice is in a place (1.4's G3), or null if it's on open water. */
export function holeOf(world: World, zone: MapZoneId): Tile | null {
  const line = world.fishing.line;
  if (!line || world.scene !== zone) return null;
  const place = world.zones.outdoor(zone);
  return place?.isIce(line.tx, line.ty) ? { tx: line.tx, ty: line.ty } : null;
}

/**
 * The tension bar's size in world pixels (V1's R6a; 1.0.1 made it two tiles wide, half again as
 * tall): its whole box, a light rim outside an ink frame round the track, and how far the needle
 * stands out above and below it.
 */
export const REEL_BAR = { w: 64, h: 12, needle: 2 } as const;

/** The space between the bar and her, or the bar and her float. */
const REEL_GAP = 4;

/** How far the float and its rings reach round where it sits, for keeping the bar off them. */
const FLOAT_REACH = 6;

/** A box on the screen or in the world. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Where the tension bar goes, its box's top left (1.0.1): centred over her head, clear of her; or,
 * when her float is up there (she fishes facing up the screen), centred under her feet instead,
 * so it never covers her or the float. `her` is her sprite's box, `float` where the float is, and
 * `width` the view's, which the bar is kept inside when she stands near its edge.
 */
export function reelBarAt(
  her: Box,
  float: { x: number; y: number },
  width = Infinity,
): { x: number; y: number } {
  const centred = Math.round(her.x + her.w / 2 - REEL_BAR.w / 2);
  const x = Math.max(1, Math.min(centred, width - REEL_BAR.w - 1));
  const above = her.y - REEL_GAP - REEL_BAR.needle - REEL_BAR.h;
  const span = above - REEL_BAR.needle - FLOAT_REACH;
  const floatOver =
    float.y < her.y + her.h / 2 &&
    float.y >= span &&
    float.x >= x - FLOAT_REACH &&
    float.x <= x + REEL_BAR.w + FLOAT_REACH;
  if (!floatOver) return { x, y: Math.round(above) };
  return { x, y: Math.round(her.y + her.h + REEL_GAP + REEL_BAR.needle) };
}

/** The track, a dusky plum: dark enough for the window to glow on, light enough to hold at night. */
const REEL_TRACK = C.dusk;

/**
 * A rare fish hooked (V1's R6a): the tension bar, its window glowing and its middle brightest, and
 * the needle sweeping across it, read off the world's clock as the score is. Drawn over the night,
 * with a light rim outside its ink frame so it reads on dark water as on the day's (1.0.1).
 */
function drawReel(ctx: CanvasRenderingContext2D, world: World, me: Drawable, cam: Point): void {
  const line = world.fishing.line;
  const reeling = line?.reeling;
  if (!line || !reeling) return;
  const { reel, needle } = reeling;
  const her = {
    x: me.x - cam.x,
    y: me.y - cam.y,
    w: me.sprite.width,
    h: me.sprite.height,
  };
  const float = {
    x: line.tx * TILE_SIZE + TILE_SIZE / 2 - cam.x,
    y: line.ty * TILE_SIZE + TILE_SIZE / 2 - cam.y,
  };
  const { x, y } = reelBarAt(her, float, ctx.canvas.width);
  const { w, h } = REEL_BAR;
  // The light rim, rounded at its corners, then the ink frame and the track inside it.
  ctx.fillStyle = C.ghost;
  ctx.fillRect(x + 1, y, w - 2, h);
  ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = C.ink;
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = REEL_TRACK;
  const inner = { x: x + 2, y: y + 2, w: w - 4, h: h - 4 };
  ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
  const along = (u: number) => inner.x + Math.round(u * inner.w);
  const good = [along(reel.target - reel.good), along(reel.target + reel.good)] as const;
  ctx.fillStyle = C.orbGreen;
  ctx.fillRect(good[0], inner.y, good[1] - good[0], inner.h);
  // A dark edge at each end of the window, so it stands out against the track.
  ctx.fillStyle = C.orbGreenDark;
  ctx.fillRect(good[0], inner.y, 1, inner.h);
  ctx.fillRect(good[1] - 1, inner.y, 1, inner.h);
  const perfect = [along(reel.target - reel.perfect), along(reel.target + reel.perfect)] as const;
  ctx.fillStyle = C.orbGreenLight;
  ctx.fillRect(perfect[0], inner.y, Math.max(2, perfect[1] - perfect[0]), inner.h);
  const at = along(needle);
  const n = REEL_BAR.needle;
  ctx.fillStyle = C.ink;
  ctx.fillRect(at - 2, y - n, 4, h + n * 2);
  ctx.fillStyle = C.white;
  ctx.fillRect(at - 1, y - n + 1, 2, h + n * 2 - 2);
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

/**
 * Her fishing as a place outdoors draws it (1.1's A4): her hole on the ice on the ground (1.4's
 * G3), the rings over every fish and her line over everything standing, and the bite's "!" and the
 * reel's tension bar over the light.
 */
export function fishingPass(world: World, zone: MapZoneId): Pass {
  const place = world.zones.outdoor(zone);
  const underIce = (f: Critter) => place?.isIce(f.tx, f.ty) ?? false;
  return {
    name: 'fishing',
    // Her hole through the ice, under the fish and everything standing (1.4's G3).
    ground(ctx, { cam }) {
      const hole = holeOf(world, zone);
      if (hole) drawHole(ctx, hole, cam);
    },
    over(ctx, { cam, nowMs, me }) {
      drawFishRings(
        ctx,
        world,
        world.collecting.critters(zone).filter((c) => isFish(c.critter)),
        cam,
        nowMs,
        underIce,
      );
      drawLine(ctx, world, me, cam, nowMs, holeOf(world, zone) !== null);
    },
    lit(ctx, { cam, me }) {
      drawBite(ctx, world, me, cam);
    },
  };
}
