import type { FilterId } from '../data/photo';
import { hashMixed } from '../systems/random';

/*
 * The photo mode's filters (1.5's G5, decision 374): plain, sepia, spooky green with its edges
 * darkened, and moonlit blue with stars. Worked a pixel at a time on her pixels (the photo is a
 * few hundred across), so the viewfinder's live picture and the photo kept are one sum, and a
 * test can hold what a pixel becomes.
 */

export type Rgb = readonly [number, number, number];

/** How much each filter darkens the corners, 0 to 1. */
const VIGNETTE: Record<FilterId, number> = { plain: 0, sepia: 0.18, spooky: 0.6, moonlit: 0.3 };

/** How far from the middle the darkening starts, as a fraction of the way to a corner. */
const VIGNETTE_FROM = 0.45;

const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));

/** How bright a colour is, 0 to 255. */
function lightOf([r, g, b]: Rgb): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** How much the corners darken a pixel at x, y of a picture w × h: 1 in the middle. */
export function vignetteAt(id: FilterId, x: number, y: number, w: number, h: number): number {
  const strength = VIGNETTE[id];
  if (strength === 0) return 1;
  const dx = (x + 0.5) / w - 0.5;
  const dy = (y + 0.5) / h - 0.5;
  const d = Math.min(1, Math.hypot(dx, dy) / Math.SQRT1_2);
  const t = Math.max(0, (d - VIGNETTE_FROM) / (1 - VIGNETTE_FROM));
  return 1 - strength * t * t;
}

/** A pixel's colour through a filter, before the corners darken. */
export function tint(id: FilterId, rgb: Rgb): Rgb {
  const [r, g, b] = rgb;
  switch (id) {
    case 'plain':
      return rgb;
    case 'sepia':
      // The old photo's brown, lifted a touch so its blacks are an old print's, not ink.
      return [
        clamp(12 + 0.393 * r + 0.769 * g + 0.189 * b),
        clamp(8 + 0.349 * r + 0.686 * g + 0.168 * b),
        clamp(4 + 0.272 * r + 0.534 * g + 0.131 * b),
      ];
    case 'spooky': {
      // A ghostly green: the light mostly in green, a little of the colour kept so she's still her.
      const l = lightOf(rgb);
      return [
        clamp(0.25 * r + 0.35 * l),
        clamp(0.2 * g + 0.95 * l + 10),
        clamp(0.25 * b + 0.45 * l),
      ];
    }
    case 'moonlit': {
      // Cool and blue, the shadows lifted toward a night's navy.
      const l = lightOf(rgb);
      return [
        clamp(0.2 * r + 0.5 * l + 6),
        clamp(0.2 * g + 0.62 * l + 12),
        clamp(0.2 * b + 0.85 * l + 34),
      ];
    }
  }
}

/** A pixel at x, y of a picture w × h through a filter: tinted, then its corner darkened. */
export function filterPixel(id: FilterId, rgb: Rgb, x: number, y: number, w: number, h: number) {
  const [r, g, b] = tint(id, rgb);
  const v = vignetteAt(id, x, y, w, h);
  return [clamp(r * v), clamp(g * v), clamp(b * v)] as const;
}

/** A star's pale colour on the moonlit filter. */
export const STAR: Rgb = [236, 242, 255];

/** How many pixels of a picture's top two-fifths are a star's middle: one in this many. */
const STAR_EVERY = 900;

/**
 * Where the moonlit filter's stars are on a picture w × h: scattered over its top two-fifths,
 * the same each frame (seeded by the size), each a pixel, a few a little cross of five.
 */
export function starsOf(w: number, h: number): { x: number; y: number; big: boolean }[] {
  const count = Math.max(3, Math.round((w * h * 0.4) / STAR_EVERY));
  const stars: { x: number; y: number; big: boolean }[] = [];
  for (let n = 0; n < count; n++) {
    const x = 1 + (hashMixed(`star:x:${w}:${h}:${n}`) % Math.max(1, w - 2));
    const y = 1 + (hashMixed(`star:y:${w}:${h}:${n}`) % Math.max(1, Math.floor(h * 0.4) - 2));
    stars.push({ x, y, big: hashMixed(`star:big:${n}`) % 4 === 0 });
  }
  return stars;
}

/** A picture's pixels, as a canvas's `ImageData` has them. */
export interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Puts a picture's pixels through a filter in place. The moonlit filter's stars twinkle only where
 * it's dark enough to see them, so they never sit on her face in daylight.
 */
export function filterPixels(image: Pixels, id: FilterId): void {
  if (id === 'plain') return;
  const { data, width: w, height: h } = image;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const [r, g, b] = filterPixel(id, [data[i]!, data[i + 1]!, data[i + 2]!], x, y, w, h);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }
  if (id !== 'moonlit') return;
  const dark = (x: number, y: number) => {
    const i = (y * w + x) * 4;
    return lightOf([data[i]!, data[i + 1]!, data[i + 2]!]) < 150;
  };
  const light = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    [data[i], data[i + 1], data[i + 2]] = STAR;
  };
  for (const s of starsOf(w, h)) {
    if (!dark(s.x, s.y)) continue;
    light(s.x, s.y);
    if (!s.big) continue;
    light(s.x - 1, s.y);
    light(s.x + 1, s.y);
    light(s.x, s.y - 1);
    light(s.x, s.y + 1);
  }
}
