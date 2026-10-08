import { PALETTE } from '../sprites/palette';
import type { Daylight } from '../systems/clock';
import type { Point } from './camera';
import { CLOUD_DRIFT, CLOUD_TILE, cloudTile } from './clouds';
import { dithered } from './dither';
import { gradeOf, passOf, vignetteShade, type Grade, type Rgb } from './grade';

/** A light on screen, in game pixels, and how bright it is (0 to 1). */
export interface ScreenLight {
  x: number;
  y: number;
  radius: number;
  strength: number;
}

/** How bright a pool of light is at its middle, and how many steps it falls off in. */
const POOL_PEAK = 1;
const POOL_LEVELS = 8;

/**
 * How bright a pool of lamplight is this far from its middle (0 to 1 of its radius): a soft
 * falloff, bright in the middle and gone at the edge, before it's stepped and dithered.
 */
export function poolFalloff(d: number): number {
  if (d >= 1) return 0;
  return POOL_PEAK * (1 - d * d);
}

/**
 * How bright a pool of lamplight of `radius` is at (dx, dy) from its middle, 0 to 1: its falloff
 * stepped into a few levels with an ordered dither between them (V1's L3), where before it was
 * five hard rings. The dither is the pool's own, and a lamp stands on a whole pixel of the world,
 * so the pattern stays put as the camera moves.
 */
export function poolAlpha(dx: number, dy: number, radius: number): number {
  const f = poolFalloff(Math.hypot(dx, dy) / radius);
  if (f <= 0) return 0;
  return dithered(f / POOL_PEAK, POOL_LEVELS, dx, dy) * POOL_PEAK;
}

const pools = new Map<number, HTMLCanvasElement>();

/** A pool of lamplight of one radius, drawn once. */
function pool(radius: number): HTMLCanvasElement {
  const hit = pools.get(radius);
  if (hit) return hit;
  const size = radius * 2 + 1;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  const image = ctx.createImageData(size, size);
  const [r, g, b] = rgb(PALETTE.lampLight);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const alpha = poolAlpha(x - radius, y - radius, radius);
      if (alpha <= 0) continue;
      const at = (y * size + x) * 4;
      image.data[at] = r;
      image.data[at + 1] = g;
      image.data[at + 2] = b;
      image.data[at + 3] = Math.round(alpha * 255);
    }
  }
  ctx.putImageData(image, 0, 0);
  pools.set(radius, canvas);
  return canvas;
}

function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** How many steps the vignette darkens in, dithered between. */
const VIGNETTE_LEVELS = 16;

/**
 * The vignette as a light map of its own, `width` × `height` game pixels, RGBA: white in the
 * middle, darkening toward `PALETTE.vignette` by `strength` at the edges, in dithered steps
 * measured in world pixels from the middle of the frame (`vignetteShade`).
 */
export function vignetteMask(width: number, height: number, strength: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  const edge = rgb(PALETTE.vignette);
  const cx = width / 2;
  const cy = height / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const shade = dithered(
        vignetteShade(Math.hypot(x + 0.5 - cx, y + 0.5 - cy)) * strength,
        VIGNETTE_LEVELS,
        x,
        y,
      );
      const at = (y * width + x) * 4;
      for (let i = 0; i < 3; i++) data[at + i] = Math.round(255 + (edge[i]! - 255) * shade);
      data[at + 3] = 255;
    }
  }
  return data;
}

/** The vignette's strength as it's baked, in steps of a fiftieth. */
function vignetteOf(g: Grade): number {
  return Math.round(g.vignette * 50) / 50;
}

function sized(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const g = canvas.getContext('2d');
  if (!g) throw new Error('no 2d context');
  return g;
}

/**
 * Time of day, as a light map: the grade's light everywhere (`grade.ts`), darkened toward the
 * edges at night and under the clouds by day, brightened where lamps shine, and multiplied over
 * the finished frame; then the grade's one pass over its shadows, if the hour has one. Only the
 * view knows it happens (decisions.md 9).
 */
export class Lighting {
  private readonly map = document.createElement('canvas');
  /** The light and vignette as they were last laid, kept until the hour's colour changes. */
  private readonly base = document.createElement('canvas');
  private baseKey = '';
  private readonly vignette = document.createElement('canvas');
  private vignetteKey = '';
  /** By day, the light and the clouds on one tile, laid straight over the frame. */
  private readonly dayTile = document.createElement('canvas');
  private dayKey = '';
  /** Where this frame is in the world and when, outdoors, for the clouds to keep to the ground. */
  private outside: { cam: Point; nowMs: number } | null = null;

  /**
   * Says this frame is outdoors, its top-left at `cam` in the world, at `nowMs`: the clouds'
   * shadows drift over it. A view that doesn't say so (a room) has none. Good for one frame.
   */
  outdoors(cam: Point, nowMs: number): void {
    this.outside = { cam, nowMs };
  }

  /**
   * Washes `ctx` in the light of `light`. `soften` (0 to 1) lifts the grade that far toward plain,
   * which is how a room indoors is only gently dim at night. `tint` greys the day for rain or fog.
   */
  apply(
    ctx: CanvasRenderingContext2D,
    light: Daylight,
    lights: readonly ScreenLight[],
    soften = 0,
    tint: string | null = null,
  ): void {
    const outside = this.outside;
    this.outside = null;
    const g = gradeOf(light, tint, soften, outside !== null);
    const { width, height } = ctx.canvas;
    const shining = lights.filter(
      (l) =>
        l.strength > 0 &&
        l.x + l.radius >= 0 &&
        l.y + l.radius >= 0 &&
        l.x - l.radius <= width &&
        l.y - l.radius <= height,
    );
    if (shining.length === 0 && vignetteOf(g) === 0) {
      // By day nothing shines and nothing darkens the edges, so there's no map to lay: the
      // light (and the clouds in it) is multiplied straight over the frame, one pass.
      ctx.globalCompositeOperation = 'multiply';
      if (outside && g.clouds > 0) {
        const { cam, nowMs } = outside;
        const x = cam.x - nowMs * CLOUD_DRIFT[0];
        const y = cam.y - nowMs * CLOUD_DRIFT[1];
        cover(ctx, this.dayTileOf(g), x, y);
      } else {
        ctx.fillStyle = `rgb(${g.light.join(', ')})`;
        ctx.fillRect(0, 0, width, height);
      }
      this.shade(ctx, g);
      return;
    }
    const m = sized(this.map, width, height);
    m.globalCompositeOperation = 'copy';
    m.globalAlpha = 1;
    m.drawImage(this.baseOf(g, width, height), 0, 0);
    if (outside && g.clouds > 0) {
      m.globalCompositeOperation = 'multiply';
      m.globalAlpha = g.clouds;
      const { cam, nowMs } = outside;
      cover(m, cloudTile(), cam.x - nowMs * CLOUD_DRIFT[0], cam.y - nowMs * CLOUD_DRIFT[1]);
    }
    m.globalCompositeOperation = 'lighter';
    for (const l of shining) {
      m.globalAlpha = Math.min(1, l.strength);
      m.drawImage(pool(l.radius), Math.round(l.x - l.radius), Math.round(l.y - l.radius));
    }
    m.globalCompositeOperation = 'source-over';
    m.globalAlpha = 1;

    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(this.map, 0, 0);
    this.shade(ctx, g);
  }

  /** The grade's one pass over the shadows, if the hour has one. */
  private shade(ctx: CanvasRenderingContext2D, g: Grade): void {
    const pass = passOf(g.shadows);
    if (pass) {
      ctx.globalCompositeOperation = pass.mode;
      ctx.fillStyle = `rgb(${pass.colour.join(', ')})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /**
   * The tile of the day's light with the clouds' shadows in it, for the frame to be multiplied by
   * directly: made again only when the light's colour or the clouds' strength changes, which by
   * day is never.
   */
  private dayTileOf(g: Grade): HTMLCanvasElement {
    const clouds = Math.round(g.clouds * 20) / 20;
    const key = `${g.light.join(',')}:${clouds}`;
    if (key === this.dayKey) return this.dayTile;
    this.dayKey = key;
    const t = sized(this.dayTile, CLOUD_TILE, CLOUD_TILE);
    t.globalCompositeOperation = 'source-over';
    t.globalAlpha = 1;
    t.fillStyle = `rgb(${g.light.join(', ')})`;
    t.fillRect(0, 0, CLOUD_TILE, CLOUD_TILE);
    t.globalCompositeOperation = 'multiply';
    t.globalAlpha = clouds;
    t.drawImage(cloudTile(), 0, 0);
    t.globalCompositeOperation = 'source-over';
    t.globalAlpha = 1;
    return this.dayTile;
  }

  /**
   * The grade's light with the vignette laid over it, made again only when either changes: the
   * hour's colour moves a step every minute or two, so most frames copy it as it was.
   */
  private baseOf(g: Grade, width: number, height: number): HTMLCanvasElement {
    const vignette = vignetteOf(g);
    const key = `${width}x${height}:${g.light.join(',')}:${vignette}`;
    if (key === this.baseKey) return this.base;
    this.baseKey = key;
    const b = sized(this.base, width, height);
    b.globalCompositeOperation = 'source-over';
    b.fillStyle = `rgb(${g.light.join(', ')})`;
    b.fillRect(0, 0, width, height);
    if (vignette > 0) {
      b.globalCompositeOperation = 'multiply';
      b.drawImage(this.vignetteOf(width, height, vignette), 0, 0);
      b.globalCompositeOperation = 'source-over';
    }
    return this.base;
  }

  private vignetteOf(width: number, height: number, strength: number): HTMLCanvasElement {
    const key = `${width}x${height}:${strength}`;
    if (key === this.vignetteKey) return this.vignette;
    this.vignetteKey = key;
    const v = sized(this.vignette, width, height);
    const image = v.createImageData(width, height);
    image.data.set(vignetteMask(width, height, strength));
    v.putImageData(image, 0, 0);
    return this.vignette;
  }
}

/** Covers a canvas with a repeating tile whose top-left is at (x, y) in the world, less `ox, oy`. */
function cover(g: CanvasRenderingContext2D, source: HTMLCanvasElement, x: number, y: number): void {
  const size = CLOUD_TILE;
  const wrap = (n: number) => ((n % size) + size) % size;
  const ox = -wrap(Math.round(x));
  const oy = -wrap(Math.round(y));
  for (let ty = oy; ty < g.canvas.height; ty += size) {
    for (let tx = ox; tx < g.canvas.width; tx += size) g.drawImage(source, tx, ty);
  }
}
