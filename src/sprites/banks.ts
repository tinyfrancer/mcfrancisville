import type { TileId } from '../types/ids';

/*
 * Organic banks for water and ice (V1's L6, decision 292). A pond laid in tiles came out as the
 * tiles' outline with its corners rounded and its staircases cut at 45°: an octagon, and a creek a
 * right-angled L. Here the edge is worked out from the water around a pixel instead of from the
 * tile it's on: how much of what's round the pixel is water, the nearer counting more (the tiles
 * smoothed into a blob), nudged in and out a few pixels by a slow wobble along the bank, so a
 * staircase becomes a curve and a straight run of bank meanders. Where the tiles are water still
 * decides where she can go; the bank only rounds off near it, so a corner of the grass beside a
 * pond may be wet and a corner of the pond grassy. The hedge round the edge of a place is taken as
 * beyond it, so a creek runs on under it rather than stopping short.
 */

const TILE = 32;

/**
 * How far round a pixel its water is counted, in pixels, weighed less the farther out (a tent):
 * wide enough that a staircase of tiles comes out as one curve, and a creek a tile wide still runs.
 */
export const REACH = 36;

/** How many tiles out each way the count can reach. */
const RING = 2;

/** Tiles a side of the square round a tile that its bank is drawn from. */
const SIDE = RING * 2 + 1;

/** How far the wobble moves the bank in and out, in pixels. */
const WOBBLE = 4;

/** How far apart the wobble's knots are, in pixels: a bend every tile or two. */
const KNOT = 56;

/** A pixel's place against the bank, as `sprites/terrain.ts` paints from it. */
export interface BankEdge {
  /** Pixels in from the bank; zero or less is dry. Infinite deep inside, past the box's reach. */
  d: number;
  /** The way out to the bank, a unit vector (0, 0 deep inside). */
  nx: number;
  ny: number;
  along: number;
}

function knot(x: number, y: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (((h ^ (h >>> 16)) >>> 0) / 0xffffffff) * 2 - 1;
}

/** A smooth wobble from −1 to 1 over the world's pixels, the same every time. */
export function wobble(x: number, y: number): number {
  const gx = x / KNOT;
  const gy = y / KNOT;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const ease = (t: number) => t * t * (3 - 2 * t);
  const fx = ease(gx - x0);
  const fy = ease(gy - y0);
  const top = knot(x0, y0) * (1 - fx) + knot(x0 + 1, y0) * fx;
  const bottom = knot(x0, y0 + 1) * (1 - fx) + knot(x0 + 1, y0 + 1) * fx;
  return top * (1 - fy) + bottom * fy;
}

/**
 * Which of the tiles round (tx, ty), `RING` out each way, are wet, row by row from the top left,
 * as `0` and `1`. Off the map a tile is taken from the nearest one toward (tx, ty) that's on it,
 * so water running off the edge runs on, and the grass beside it doesn't get wet from beyond.
 */
export function wetAround(
  tileAt: (tx: number, ty: number) => TileId | undefined,
  tx: number,
  ty: number,
  wet: (id: TileId | undefined) => boolean,
): string {
  // The hedge on a place's edge is the edge.
  const within = (x: number, y: number) => {
    const id = tileAt(x, y);
    if (id !== 'hedge') return id;
    const edge = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].some(([ex, ey]) => tileAt(x + ex!, y + ey!) === undefined);
    return edge ? undefined : id;
  };
  let out = '';
  for (let dy = -RING; dy <= RING; dy++) {
    for (let dx = -RING; dx <= RING; dx++) out += wet(nearest(within, tx, ty, dx, dy)) ? '1' : '0';
  }
  return out;
}

/** The tile at (tx + dx, ty + dy), or the nearest toward (tx, ty) on the map if that's off it. */
function nearest(
  tileAt: (tx: number, ty: number) => TileId | undefined,
  tx: number,
  ty: number,
  dx: number,
  dy: number,
): TileId | undefined {
  for (let steps = 0; steps <= Math.abs(dx) + Math.abs(dy); steps++) {
    for (let ix = 0; ix <= Math.min(steps, Math.abs(dx)); ix++) {
      const iy = steps - ix;
      if (iy > Math.abs(dy)) continue;
      const id = tileAt(tx + dx - Math.sign(dx) * ix, ty + dy - Math.sign(dy) * iy);
      if (id !== undefined) return id;
    }
  }
  return undefined;
}

/**
 * How much of a tent `REACH` either side of nought lies before `u`, from 0 to 1: the share of a
 * pixel's water that a straight bank `u` pixels behind it would give.
 */
function tent(u: number): number {
  if (u <= -REACH) return 0;
  if (u >= REACH) return 1;
  const r2 = 2 * REACH * REACH;
  return u < 0 ? (u + REACH) ** 2 / r2 : 1 - (REACH - u) ** 2 / r2;
}

/** The share of a tent centred on `p` that falls on the tile from `a` to `a + TILE`. */
const overlap = (a: number, p: number) => tent(a + TILE - p) - tent(a - p);

/** How far inside a straight bank a pixel would be to have this share of water: tent's inverse. */
function depthOf(share: number): number {
  return share < 0.5
    ? REACH * Math.sqrt(2 * share) - REACH
    : REACH - REACH * Math.sqrt(2 * (1 - share));
}

/**
 * The bank across the tile at (tx, ty) from which of the tiles round it are wet (`wetAround`):
 * for every pixel, how far inside the water it is and which way the bank lies.
 */
export function bankField(tx: number, ty: number, around: string): BankEdge[] {
  const size = TILE + 2;
  const share = new Float64Array(size * size);
  // The share of the box that's wet, a pixel out round the tile too for the slope at its edge.
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const px = i - 1 + 0.5;
      const py = j - 1 + 0.5;
      let wet = 0;
      for (let dy = -RING; dy <= RING; dy++) {
        const oy = overlap(dy * TILE, py);
        if (oy === 0) continue;
        for (let dx = -RING; dx <= RING; dx++) {
          if (around[(dy + RING) * SIDE + dx + RING] !== '1') continue;
          wet += overlap(dx * TILE, px) * oy;
        }
      }
      share[j * size + i] = wet;
    }
  }
  const out: BankEdge[] = [];
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const at = (y + 1) * size + x + 1;
      const g = share[at]!;
      if (g >= 1 - 1e-9) {
        out.push({ d: Infinity, nx: 0, ny: 0, along: x });
        continue;
      }
      const gx = share[at + 1]! - share[at - 1]!;
      const gy = share[at + size]! - share[at - size]!;
      const length = Math.hypot(gx, gy);
      const d = depthOf(g) - wobble(tx * TILE + x, ty * TILE + y) * WOBBLE;
      // Out to the bank is down the slope of the water's share.
      const nx = length > 0 ? -gx / length : 0;
      const ny = length > 0 ? -gy / length : 0;
      out.push({ d, nx, ny, along: Math.abs(ny) > Math.abs(nx) ? x : y });
    }
  }
  return out;
}
