import { PALETTE } from '../sprites/palette';
import { seeded } from '../systems/random';
import { dithered } from './dither';

/**
 * The shadows of clouds drifting over the ground by day (V1's L3, decision 291): a tile of soft
 * blobs from low-frequency noise, repeating without a seam, drawn into the light map so they
 * darken the ground and everything on it alike, and cost the frame nothing more than the light
 * map it already lays. Their edges are dithered in world pixels, like the fog's.
 */
export const CLOUD_TILE = 512;

/** How fast the clouds drift, in world pixels a millisecond: a tile's width in about six seconds. */
export const CLOUD_DRIFT = [0.005, 0.0018] as const;

/** How much of the ground a cloud covers, at its middle and its edge (0 to 1). */
const COVER_FROM = 0.52;
const COVER_SOFT = 0.16;
/** How many steps a cloud's edge thickens in, dithered between. */
const EDGE_LEVELS = 4;

/**
 * Smooth value noise on a lattice that wraps round the tile, in two sizes: big slow banks and
 * smaller lumps on their edges. Between 0 and 1.
 */
function noiseOf(size: number, seed: number): (x: number, y: number) => number {
  const random = seeded(seed);
  const octaves = [
    { cells: 3, weight: 0.65 },
    { cells: 7, weight: 0.35 },
  ].map((o) => ({ ...o, grid: Array.from({ length: o.cells * o.cells }, () => random()) }));
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    let sum = 0;
    for (const { cells, weight, grid } of octaves) {
      const fx = (x / size) * cells;
      const fy = (y / size) * cells;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const at = (i: number, j: number) => grid[(j % cells) * cells + (i % cells)]!;
      const tx = smooth(fx - x0);
      const ty = smooth(fy - y0);
      const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
      const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
      sum += (top + (bottom - top) * ty) * weight;
    }
    return sum;
  };
}

/**
 * How deep in a cloud's shadow each pixel of a tile `size` across lies: 255 under its middle, 0
 * in the open, its edge a few steps of ordered dither between. One byte a pixel, row by row.
 */
export function cloudMask(size = CLOUD_TILE, seed = 57): Uint8Array {
  const noise = noiseOf(size, seed);
  const mask = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = (noise(x, y) - COVER_FROM) / COVER_SOFT;
      if (v <= 0) continue;
      mask[y * size + x] = Math.round(dithered(v, EDGE_LEVELS, x, y) * 255);
    }
  }
  return mask;
}

let tile: HTMLCanvasElement | null = null;

/** The tile of cloud shadows, made the first time a sunny hour needs it. */
export function cloudTile(): HTMLCanvasElement {
  if (tile) return tile;
  const canvas = document.createElement('canvas');
  canvas.width = CLOUD_TILE;
  canvas.height = CLOUD_TILE;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('no 2d context');
  const image = g.createImageData(CLOUD_TILE, CLOUD_TILE);
  const shade = parseInt(PALETTE.cloudShade.slice(1), 16);
  const mask = cloudMask();
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue;
    image.data[i * 4] = (shade >> 16) & 0xff;
    image.data[i * 4 + 1] = (shade >> 8) & 0xff;
    image.data[i * 4 + 2] = shade & 0xff;
    image.data[i * 4 + 3] = mask[i]!;
  }
  g.putImageData(image, 0, 0);
  tile = canvas;
  return canvas;
}
