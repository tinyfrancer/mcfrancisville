import { TILE_SIZE } from '../config/world';
import { bake } from '../sprites/bake';
import { TUFT_FRAMES, TUFT_H, TUFT_PALETTE, TUFT_W } from '../sprites/life';
import { tuftColours } from '../sprites/seasons';
import type { SeasonId } from '../data/seasons';
import { PALETTE } from '../sprites/palette';
import { PROP_ART } from '../sprites/props';
import { iceSheen, tileHash } from '../sprites/terrain';
import { tileAt, walkable, type PlacedProp, type TileMap } from '../systems/grid';
import type { TileId } from '../types/ids';
import type { Point } from './camera';
import { fillPixelEllipse } from './ground';

/**
 * The small life of a place outdoors (phase L): glints on the water, a sheen passing over the ice
 * (1.1's A3), long grass swaying in the wind, and smoke from the chimneys. All of it is drawn over
 * the baked ground each frame, and only where the camera is; the ground itself is never baked
 * again.
 */
export interface Life {
  /** Tiles of open water and ice, where a glint can catch the light. */
  water: readonly { tx: number; ty: number; ice: boolean }[];
  /** Tiles of ice, and the pixels of each (local x, y pairs) a sheen can pass over. */
  sheen: readonly { tx: number; ty: number; pixels: Int8Array }[];
  /** Where each tuft of long grass stands, in world pixels (its foot's left). */
  tufts: readonly Point[];
  /** Where each chimney's smoke rises from, in world pixels. */
  chimneys: readonly Point[];
}

/**
 * How often a tile of grass has a tuft of long grass on it: one in this many, picked by where it
 * is, and never where she picks flowers or on a way through. A meadow has more, and long grass
 * one on every tile (V1's L2).
 */
const TUFT_ONE_IN: Partial<Record<TileId, number>> = { grass: 4, meadow: 2, longGrass: 1 };

export function lifeOf(map: TileMap): Life {
  const standing = new Set<string>();
  for (const p of map.props) {
    for (let y = p.ty; y < p.ty + p.h; y++)
      for (let x = p.tx; x < p.tx + p.w; x++) standing.add(`${x},${y}`);
  }
  const patches = new Set(map.patches.map((p) => `${p.tx},${p.ty}`));
  const water: Life['water'][number][] = [];
  const sheen: Life['sheen'][number][] = [];
  const tufts: Point[] = [];
  const ground = (tx: number, ty: number) => tileAt(map, tx, ty);
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      const id = tileAt(map, tx, ty);
      const key = `${tx},${ty}`;
      if ((id === 'water' || id === 'ice') && !standing.has(key)) {
        water.push({ tx, ty, ice: id === 'ice' });
      }
      if (id === 'ice') {
        const pixels = iceSheen(ground, tx, ty);
        if (pixels.length > 0) sheen.push({ tx, ty, pixels });
      }
      const h = tileHash(tx, ty);
      const oneIn = id === undefined ? undefined : TUFT_ONE_IN[id];
      if (
        oneIn !== undefined &&
        walkable(map, tx, ty) &&
        !standing.has(key) &&
        !patches.has(key) &&
        h % oneIn === 0
      ) {
        tufts.push({
          x: tx * TILE_SIZE + 3 + ((h >>> 4) % (TILE_SIZE - TUFT_W - 6)),
          y: ty * TILE_SIZE + TUFT_H + 4 + ((h >>> 9) % (TILE_SIZE - TUFT_H - 6)),
        });
        // Long grass is thick with them: a second on about half its tiles.
        if (id === 'longGrass' && (h >>> 20) % 2 === 0) {
          tufts.push({
            x: tx * TILE_SIZE + 3 + ((h >>> 13) % (TILE_SIZE - TUFT_W - 6)),
            y: ty * TILE_SIZE + TUFT_H + 4 + ((h >>> 23) % (TILE_SIZE - TUFT_H - 6)),
          });
        }
      }
    }
  }
  return { water, sheen, tufts, chimneys: chimneysOf(map.props) };
}

/** Where smoke rises from the chimneys of what stands in a place, in world pixels. */
export function chimneysOf(props: readonly PlacedProp[]): Point[] {
  const chimneys: Point[] = [];
  for (const p of props) {
    const art = PROP_ART[p.id];
    if (!art.smoke) continue;
    const width = art.source.rows[0]!.length;
    const height = art.source.rows.length;
    const left = p.tx * TILE_SIZE + (p.w * TILE_SIZE - width) / 2;
    const top = (p.ty + p.h) * TILE_SIZE - height;
    for (const c of art.smoke) chimneys.push({ x: left + c.x, y: top + c.y });
  }
  return chimneys;
}

/** Whether a world rectangle is in the camera's view. */
function seen(x: number, y: number, w: number, h: number, cam: Point, canvas: HTMLCanvasElement) {
  return x + w > cam.x && y + h > cam.y && x < cam.x + canvas.width && y < cam.y + canvas.height;
}

/** How far apart the bands of sheen on the ice are, along the diagonal, in world pixels. */
export const SHEEN_EVERY = 352;
/** How far either side of a band's middle it catches the light, and its bright core. */
const SHEEN_HALF = 16;
const SHEEN_CORE = 5;
/** How fast a band glides over the ice, down to the right: pixels a millisecond. */
const SHEEN_SPEED = 0.008;

/**
 * Where the band of sheen nearest a world pixel's diagonal is, `nowMs` on the clock: how far
 * from its middle the pixel lies, from 0 to half the bands' spacing.
 */
export function sheenFrom(wx: number, wy: number, nowMs: number): number {
  const along = Math.floor(nowMs * SHEEN_SPEED) % SHEEN_EVERY;
  const off = (((wx + wy - along) % SHEEN_EVERY) + SHEEN_EVERY) % SHEEN_EVERY;
  return Math.min(off, SHEEN_EVERY - off);
}

/**
 * The sheen on the ice (1.1's A3): broad bands of light gliding slowly down across it on the
 * diagonal, a pixel at a time, lighting the dashes of its open face as they pass, brightest in
 * the middle. Not in the rain, under a grey sky.
 */
function drawSheen(ctx: CanvasRenderingContext2D, life: Life, cam: Point, nowMs: number): void {
  const canvas = ctx.canvas;
  for (const pass of [0, 1] as const) {
    ctx.fillStyle = pass === 0 ? PALETTE.iceLight : PALETTE.white;
    for (const { tx, ty, pixels } of life.sheen) {
      const x0 = tx * TILE_SIZE;
      const y0 = ty * TILE_SIZE;
      if (!seen(x0, y0, TILE_SIZE, TILE_SIZE, cam, canvas)) continue;
      // The whole tile is out of every band: nothing to light.
      if (sheenFrom(x0 + 16, y0 + 16, nowMs) > SHEEN_HALF + 32) continue;
      for (let i = 0; i < pixels.length; i += 2) {
        const x = x0 + pixels[i]!;
        const y = y0 + pixels[i + 1]!;
        const off = sheenFrom(x, y, nowMs);
        if (off >= SHEEN_HALF || (pass === 1) !== off < SHEEN_CORE) continue;
        ctx.fillRect(x - cam.x, y - cam.y, 1, 1);
      }
    }
  }
}

/**
 * Glints on the water: a short bright dash on a tile now and then, each in its own time, growing
 * and shrinking again, and on ice a little star and the sheen passing over it. `busy` (rain) keeps
 * them fewer, since the ripples are doing the work, and the ice without its sheen.
 */
export function drawShimmer(
  ctx: CanvasRenderingContext2D,
  life: Life,
  cam: Point,
  nowMs: number,
  busy: boolean,
): void {
  const canvas = ctx.canvas;
  if (!busy) drawSheen(ctx, life, cam, nowMs);
  for (const { tx, ty, ice } of life.water) {
    const x0 = tx * TILE_SIZE;
    const y0 = ty * TILE_SIZE;
    if (!seen(x0, y0, TILE_SIZE, TILE_SIZE, cam, canvas)) continue;
    const h = tileHash(tx * 7 + 3, ty * 5 + 1);
    const period = (ice ? 5200 : 2600) + (h % 1400) + (busy ? 2000 : 0);
    const t = (nowMs + (h >>> 3)) % period;
    const lasting = ice ? 360 : 700;
    if (t >= lasting) continue;
    const grow = Math.sin((t / lasting) * Math.PI);
    const x = x0 + 6 + ((h >>> 11) % 18) - cam.x;
    const y = y0 + 6 + ((h >>> 17) % 20) - cam.y;
    if (ice) {
      ctx.fillStyle = PALETTE.white;
      const r = grow > 0.6 ? 2 : 1;
      ctx.fillRect(x - r, y, r * 2 + 1, 1);
      ctx.fillRect(x, y - r, 1, r * 2 + 1);
    } else {
      const half = Math.max(1, Math.round(grow * 3));
      ctx.fillStyle = PALETTE.waterLight;
      ctx.fillRect(x - half - 1, y + 1, half * 2 + 3, 1);
      ctx.fillStyle = PALETTE.ice;
      ctx.fillRect(x - half, y, half * 2 + 1, 1);
    }
  }
}

/**
 * The long grass, leaning as a gust passes over it: the wind comes across the place in waves from
 * the left, and on a rainy day it comes quicker and stronger.
 */
export function drawTufts(
  ctx: CanvasRenderingContext2D,
  life: Life,
  cam: Point,
  nowMs: number,
  gusty: boolean,
  season: SeasonId = 'autumn',
): void {
  const canvas = ctx.canvas;
  // In the season's colours (V1's L4): straw standing out of the snow in winter.
  const palette = tuftColours(season, TUFT_PALETTE);
  const frames = TUFT_FRAMES.map((f, i) => bake(`tuft:${i}@${season}`, f, palette));
  const speed = gusty ? 380 : 700;
  const reach = gusty ? 0.2 : 0.55;
  for (const t of life.tufts) {
    if (!seen(t.x, t.y - TUFT_H, TUFT_W, TUFT_H, cam, canvas)) continue;
    const wave = Math.sin(nowMs / speed - t.x / 90 - t.y / 240);
    const frame = wave > reach ? 2 : wave < -0.85 ? 0 : 1;
    ctx.drawImage(frames[frame]!, t.x - cam.x, t.y - TUFT_H - cam.y);
  }
}

/** How long a puff of smoke takes to rise and thin away, and how many are in the air at once. */
const PUFF_MS = 3600;
const PUFFS = 7;

const puffs = new Map<string, HTMLCanvasElement>();

/** A round puff of one size and colour, drawn once. */
function puff(size: number, colour: string): HTMLCanvasElement {
  const key = `${size}:${colour}`;
  let found = puffs.get(key);
  if (!found) {
    found = document.createElement('canvas');
    found.width = size + 2;
    found.height = size + 2;
    const g = found.getContext('2d');
    if (!g) throw new Error('no 2d context');
    g.fillStyle = colour;
    fillPixelEllipse(g, found.width / 2, found.height / 2, size, size - 2);
    puffs.set(key, found);
  }
  return found;
}

/**
 * Smoke curling up from each chimney: soft puffs that rise, drift with the wind, grow and thin
 * out. It's drawn over everything, since nothing stands above a chimney. In the rain it's thinner.
 */
export function drawSmoke(
  ctx: CanvasRenderingContext2D,
  life: Life,
  cam: Point,
  nowMs: number,
  thin: boolean,
): void {
  const canvas = ctx.canvas;
  for (const [i, c] of life.chimneys.entries()) {
    if (!seen(c.x - 30, c.y - 60, 60, 64, cam, canvas)) continue;
    for (let p = 0; p < PUFFS; p++) {
      const age = (nowMs + i * 911 + (p * PUFF_MS) / PUFFS) % PUFF_MS;
      const f = age / PUFF_MS;
      const rise = Math.round(f * 50);
      const drift = Math.round(f * f * 16 + Math.sin(age / 420 + i) * 2);
      const size = Math.round(6 + f * 8);
      const sprite = puff(size, f < 0.3 ? PALETTE.stoneLight : PALETTE.ghost);
      ctx.globalAlpha = (1 - f) * (thin ? 0.45 : 0.8);
      const x = c.x + drift - cam.x - sprite.width / 2;
      const y = c.y - rise - cam.y - sprite.height / 2;
      ctx.drawImage(sprite, Math.round(x), Math.round(y));
    }
  }
  ctx.globalAlpha = 1;
}
