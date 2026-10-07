import { bayer } from './dither';

/**
 * Bloom (V1's L3, decision 291): a small halo round whatever glows after dark (bulbs, lit
 * windows, lanterns, a glowworm's tail), made once from a sprite's own `glow` and kept with it, so
 * a frame pays a copy per glowing thing on screen and never a pass over the whole of it. The halo
 * is drawn into the glow layer under the glow itself (`drawLight`), so whatever stands in front
 * rubs it out as it does the glow, and it fades in and out with the lamps.
 */

/** How far a halo reaches past what glows, in world pixels. */
export const BLOOM_REACH = 5;
/** How strong a halo is at its fullest, and how many dithered steps it falls off in. */
const BLOOM_PEAK = 0.42;
const BLOOM_LEVELS = 4;
/** How much each lit pixel adds to the halo around it, before the halo is capped at its peak. */
const BLOOM_GAIN = 0.22;

/**
 * The halo round a glow `width` × `height` (RGBA, a pixel lit where its alpha is over half),
 * `BLOOM_REACH` bigger each way: each pixel the colour of the lit pixels near it, as strong as
 * there are many of them close by, stepped and dithered in its own pixels.
 */
export function haloPixels(
  glow: Uint8ClampedArray,
  width: number,
  height: number,
  reach = BLOOM_REACH,
): Uint8ClampedArray {
  const w = width + reach * 2;
  const h = height + reach * 2;
  const weight = new Float32Array(w * h);
  const sum = new Float32Array(w * h * 3);
  const kernel: { dx: number; dy: number; k: number }[] = [];
  for (let dy = -reach; dy <= reach; dy++) {
    for (let dx = -reach; dx <= reach; dx++) {
      const d = Math.hypot(dx, dy) / (reach + 1);
      if (d < 1) kernel.push({ dx, dy, k: (1 - d) * (1 - d) });
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const at = (y * width + x) * 4;
      if (glow[at + 3]! < 128) continue;
      const r = glow[at]!;
      const g = glow[at + 1]!;
      const b = glow[at + 2]!;
      for (const { dx, dy, k } of kernel) {
        const i = (y + reach + dy) * w + (x + reach + dx);
        weight[i]! += k;
        sum[i * 3]! += r * k;
        sum[i * 3 + 1]! += g * k;
        sum[i * 3 + 2]! += b * k;
      }
    }
  }
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const total = weight[i]!;
      if (total <= 0) continue;
      const strength = Math.min(1, total * BLOOM_GAIN);
      const v = Math.min(BLOOM_LEVELS, Math.floor(strength * BLOOM_LEVELS + bayer(x, y)));
      if (v <= 0) continue;
      out[i * 4] = sum[i * 3]! / total;
      out[i * 4 + 1] = sum[i * 3 + 1]! / total;
      out[i * 4 + 2] = sum[i * 3 + 2]! / total;
      out[i * 4 + 3] = Math.round((v / BLOOM_LEVELS) * BLOOM_PEAK * 255);
    }
  }
  return out;
}

const halos = new WeakMap<HTMLCanvasElement, HTMLCanvasElement | null>();

/** The halo round a glow, made the first time it's drawn; null where nothing in it is lit. */
export function bloomOf(glow: HTMLCanvasElement): HTMLCanvasElement | null {
  const hit = halos.get(glow);
  if (hit !== undefined) return hit;
  let halo: HTMLCanvasElement | null = null;
  const source = glow.getContext('2d');
  if (source && glow.width > 0 && glow.height > 0) {
    const { data } = source.getImageData(0, 0, glow.width, glow.height);
    const pixels = haloPixels(data, glow.width, glow.height);
    if (pixels.some((v, i) => i % 4 === 3 && v > 0)) {
      halo = document.createElement('canvas');
      halo.width = glow.width + BLOOM_REACH * 2;
      halo.height = glow.height + BLOOM_REACH * 2;
      const g = halo.getContext('2d');
      if (g) {
        const image = g.createImageData(halo.width, halo.height);
        image.data.set(pixels);
        g.putImageData(image, 0, 0);
      }
    }
  }
  halos.set(glow, halo);
  return halo;
}

/** Draws the halo round `glow`, whose top-left is at (x, y) on `g`. */
export function drawBloom(
  g: CanvasRenderingContext2D,
  glow: HTMLCanvasElement,
  x: number,
  y: number,
): void {
  const halo = bloomOf(glow);
  if (halo) g.drawImage(halo, x - BLOOM_REACH, y - BLOOM_REACH);
}
