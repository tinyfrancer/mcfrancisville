/**
 * Ordered dithering in world pixels (V1's L3): a soft falloff (a lamp's pool, the night's
 * vignette, a bulb's bloom) stepped into a few levels, with a 4×4 Bayer pattern choosing between
 * the two levels either side of each pixel's value, so it keeps the art's crisp pixels rather
 * than a smooth gradient (decision 2).
 */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5] as const;

/** The threshold the pattern sets at (x, y), between 0 and 1. */
export function bayer(x: number, y: number): number {
  return (BAYER4[(((y % 4) + 4) % 4) * 4 + (((x % 4) + 4) % 4)]! + 0.5) / 16;
}

/**
 * `value` (0 to 1) stepped into `levels` steps at (x, y): the step below it, or the one above
 * where the pattern says so. Returns the step's height, 0 to 1.
 */
export function dithered(value: number, levels: number, x: number, y: number): number {
  const v = Math.min(1, Math.max(0, value)) * levels;
  const low = Math.floor(v);
  const step = low + (v - low > bayer(x, y) ? 1 : 0);
  return Math.min(levels, step) / levels;
}
