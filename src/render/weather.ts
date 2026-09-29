import type { Weather } from '../data/weather';
import { PALETTE } from '../sprites/palette';
import { seeded } from '../systems/random';
import type { Point } from './camera';

/**
 * How a day's weather looks outdoors (phase L): the colour its light is greyed by, and how lit the
 * lamps and windows are at least, so a grey day glows cosily at every hour.
 */
export const WEATHER_LOOK: Record<Weather, { tint: string | null; lamps: number }> = {
  clear: { tint: null, lamps: 0 },
  rain: { tint: PALETTE.skyRain, lamps: 0.45 },
  fog: { tint: PALETTE.skyFog, lamps: 0.3 },
};

/** Rain and fog are drawn from tiles this many pixels across, which repeat seamlessly. */
const RAIN_TILE = 128;
const FOG_TILE = 256;

/** How fast the rain falls and the fog drifts, in world pixels a millisecond. */
const RAIN_FALL = 0.42;
/** The rain leans: it moves one pixel across for every four it falls. */
const RAIN_LEAN = 0.25;
const FOG_DRIFT = [0.006, -0.004] as const;

function blank(size: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('no 2d context');
  return [canvas, g];
}

/**
 * A tile of falling rain: leaning streaks a pixel wide, wrapped round its edges so it repeats
 * without a seam, the near drops longer and brighter than the far ones. Each pixel carries its
 * own opacity, so the whole of the rain is one pass over the frame.
 */
function rainTile(): HTMLCanvasElement {
  const [canvas, g] = blank(RAIN_TILE);
  const random = seeded(11);
  g.fillStyle = PALETTE.rain;
  for (const [drops, length, alpha] of [
    [18, 5, 0.4],
    [12, 8, 0.7],
  ] as const) {
    g.globalAlpha = alpha;
    for (let i = 0; i < drops; i++) {
      const x = Math.floor(random() * RAIN_TILE);
      const y = Math.floor(random() * RAIN_TILE);
      for (let j = 0; j < length; j++) {
        const px = (x - Math.floor(j * RAIN_LEAN) + RAIN_TILE) % RAIN_TILE;
        g.fillRect(px, (y + j) % RAIN_TILE, 1, 1);
      }
    }
  }
  return canvas;
}

/**
 * Splashes where the rain lands, in three frames that take turns: a little ring with a drop
 * jumping from it, which on the water reads as a ripple.
 */
function splashTile(frame: number): HTMLCanvasElement {
  const [canvas, g] = blank(RAIN_TILE);
  const random = seeded(20 + frame);
  g.fillStyle = PALETTE.rain;
  for (let i = 0; i < 7; i++) {
    const x = 3 + Math.floor(random() * (RAIN_TILE - 6));
    const y = 2 + Math.floor(random() * (RAIN_TILE - 4));
    g.fillRect(x - 2, y, 1, 1);
    g.fillRect(x + 2, y, 1, 1);
    g.fillRect(x - 1, y + 1, 3, 1);
    g.fillRect(x - 1, y - 1, 3, 1);
    if (i % 2 === 0) g.fillRect(x, y - 3, 1, 1);
  }
  return canvas;
}

/**
 * A tile of fog: soft value noise in two sizes, stepped into a few levels and dithered, so it
 * drifts in clumps with the same crisp pixels as the art rather than a smooth blur.
 */
function fogTile(): HTMLCanvasElement {
  const [canvas, g] = blank(FOG_TILE);
  const random = seeded(31);
  const lattice = (cells: number) =>
    Array.from({ length: cells * cells }, () => random()) as readonly number[];
  const octaves = [
    { cells: 4, weight: 0.65, grid: lattice(4) },
    { cells: 8, weight: 0.35, grid: lattice(8) },
  ];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const noise = (x: number, y: number) => {
    let sum = 0;
    for (const { cells, weight, grid } of octaves) {
      const fx = (x / FOG_TILE) * cells;
      const fy = (y / FOG_TILE) * cells;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const at = (i: number, j: number) => grid[((j % cells) * cells + (i % cells)) % grid.length]!;
      const tx = smooth(fx - x0);
      const ty = smooth(fy - y0);
      const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
      const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
      sum += (top + (bottom - top) * ty) * weight;
    }
    return sum;
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const image = g.createImageData(FOG_TILE, FOG_TILE);
  const fog = parseInt(PALETTE.fog.slice(1), 16);
  for (let y = 0; y < FOG_TILE; y++) {
    for (let x = 0; x < FOG_TILE; x++) {
      const threshold = (BAYER[(y % 4) * 4 + (x % 4)]! + 0.5) / 16;
      // Three levels of thickness, the dither choosing between two neighbouring ones.
      const level = Math.max(0, (noise(x, y) - 0.3) / 0.5) * 3;
      const step = Math.min(3, Math.floor(level) + (level % 1 > threshold ? 1 : 0));
      if (step === 0) continue;
      const at = (y * FOG_TILE + x) * 4;
      image.data[at] = (fog >> 16) & 0xff;
      image.data[at + 1] = (fog >> 8) & 0xff;
      image.data[at + 2] = fog & 0xff;
      image.data[at + 3] = [0, 90, 150, 200][step]!;
    }
  }
  g.putImageData(image, 0, 0);
  return canvas;
}

/**
 * A tile of falling snow (phase U): flakes of two sizes, the near ones bigger, wrapped round its
 * edges so it repeats without a seam.
 */
function snowTile(): HTMLCanvasElement {
  const [canvas, g] = blank(RAIN_TILE);
  const random = seeded(41);
  g.fillStyle = PALETTE.white;
  for (const [flakes, size, alpha] of [
    [16, 1, 0.6],
    [9, 2, 0.9],
  ] as const) {
    g.globalAlpha = alpha;
    for (let i = 0; i < flakes; i++) {
      const x = Math.floor(random() * (RAIN_TILE - size));
      const y = Math.floor(random() * (RAIN_TILE - size));
      g.fillRect(x, y, size, size);
    }
  }
  return canvas;
}

/** How fast the snow falls, in world pixels a millisecond, and how far it sways as it does. */
const SNOW_FALL = 0.035;
const SNOW_SWAY = 10;

/** Snow falling over everything on a snowy holiday (phase U), in two layers at their own pace. */
export function drawSnow(ctx: CanvasRenderingContext2D, cam: Point, nowMs: number): void {
  const snow = tile('snow', snowTile);
  const sway = Math.sin(nowMs / 1400) * SNOW_SWAY;
  cover(ctx, snow, cam, sway, nowMs * SNOW_FALL);
  ctx.globalAlpha = 0.7;
  cover(ctx, snow, cam, RAIN_TILE / 2 - sway, RAIN_TILE / 3 + nowMs * SNOW_FALL * 0.6);
  ctx.globalAlpha = 1;
}

/** Each tile, made the first time a rainy or foggy day needs it. */
const tiles = new Map<string, HTMLCanvasElement>();
function tile(key: string, make: () => HTMLCanvasElement): HTMLCanvasElement {
  let found = tiles.get(key);
  if (!found) {
    found = make();
    tiles.set(key, found);
  }
  return found;
}

/**
 * Covers the frame with a repeating tile, shifted so it stays put in the world as the camera moves
 * (or drifts across it by `dx`, `dy`).
 */
function cover(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  cam: Point,
  dx: number,
  dy: number,
): void {
  const size = source.width;
  const wrap = (n: number) => ((n % size) + size) % size;
  const ox = wrap(Math.round(dx - cam.x)) - size;
  const oy = wrap(Math.round(dy - cam.y)) - size;
  for (let y = oy; y < ctx.canvas.height; y += size) {
    for (let x = ox; x < ctx.canvas.width; x += size) ctx.drawImage(source, x, y);
  }
}

/**
 * What of the weather lies on the ground, under everything standing on it: the rain's splashes
 * and ripples. Drawn over the baked ground, never into it.
 */
export function drawWeatherGround(
  ctx: CanvasRenderingContext2D,
  weather: Weather,
  cam: Point,
  nowMs: number,
): void {
  if (weather !== 'rain') return;
  const frame = Math.floor(nowMs / 110) % 3;
  ctx.globalAlpha = 0.55;
  cover(
    ctx,
    tile(`splash:${frame}`, () => splashTile(frame)),
    cam,
    0,
    0,
  );
  ctx.globalAlpha = 1;
}

/**
 * What of the weather is in the air, over everything: the rain falling, or the fog drifting in two
 * layers, each at its own pace. Drawn before the light, so the night darkens it and the
 * lamps' pools brighten the fog round them.
 */
export function drawWeatherAir(
  ctx: CanvasRenderingContext2D,
  weather: Weather,
  cam: Point,
  nowMs: number,
): void {
  if (weather === 'rain') {
    const fall = nowMs * RAIN_FALL;
    cover(ctx, tile('rain', rainTile), cam, -fall * RAIN_LEAN, fall);
  } else if (weather === 'fog') {
    const fog = tile('fog', fogTile);
    ctx.globalAlpha = 0.45;
    cover(ctx, fog, cam, nowMs * FOG_DRIFT[0], nowMs * FOG_DRIFT[0] * 0.3);
    ctx.globalAlpha = 0.3;
    cover(ctx, fog, cam, FOG_TILE / 2 + nowMs * FOG_DRIFT[1], FOG_TILE / 3);
    ctx.globalAlpha = 1;
  }
}
