import { TILE_SIZE } from '../config/world';
import { PALETTE } from '../sprites/palette';
import { daylight, type Daylight, type Sky } from '../systems/clock';

/**
 * The grade by hour (V1's L3, decision 291): how the light of each sky colours the finished frame,
 * beyond darkening it. Only the view knows it happens (decision 9); the hour comes from the world.
 *
 * A grade is two things a channel at a time. Its `light` is what the frame is multiplied by, which
 * tells most on what's bright: the highlights' colour. Its `shadows` lift what's dark toward a
 * colour (a positive offset, drawn as a `screen`) or press it down for contrast (a negative one,
 * drawn as a `color-burn`), which tells most on what's dark. The light map already multiplied the
 * frame, so the grade costs one pass more at most, and none while the shadows are left alone: at
 * midday the touch of warm sun is in the light map alone.
 */
export type Rgb = readonly [number, number, number];

export interface GradeRow {
  /** What the frame is multiplied by: a colour in the palette. */
  light: string;
  /**
   * Each channel's shadows lifted toward this (positive) or deepened by it (negative), as a
   * fraction of full: 0.1 lifts black to a tenth.
   */
  shadows: Rgb;
  /** How far the edges of the frame darken toward `PALETTE.vignette`, 0 to 1. */
  vignette: number;
  /** How strongly the clouds' shadows show as they drift over the ground, 0 to 1. */
  clouds: number;
}

/**
 * The grade at each sky's fullest, blended between as the light is (`daylight`). Dusk is cool
 * shadows under warm rose highlights; the golden hour deepens its shadows for contrast; night is
 * the old blue with its shadows lifted toward a grey-blue, a little desaturated; a full moon's
 * night is brighter and silver; dawn is pink and soft; midday is warm sun and drifting clouds.
 */
export const GRADE: Record<Sky, GradeRow> = {
  dawn: { light: PALETTE.lightDawn, shadows: [0.05, 0.035, 0.07], vignette: 0.12, clouds: 0.4 },
  day: { light: PALETTE.lightDay, shadows: [0, 0, 0], vignette: 0, clouds: 1 },
  golden: { light: PALETTE.lightGolden, shadows: [-0.05, -0.07, -0.1], vignette: 0.1, clouds: 0.5 },
  dusk: { light: PALETTE.lightDusk, shadows: [0.015, 0.035, 0.1], vignette: 0.3, clouds: 0 },
  night: { light: PALETTE.lightNight, shadows: [0.02, 0.03, 0.065], vignette: 0.55, clouds: 0 },
  moonlit: {
    light: PALETTE.lightMoonlit,
    shadows: [0.035, 0.045, 0.08],
    vignette: 0.45,
    clouds: 0,
  },
};

/** A grade worked out for a moment: the light as whole channels, 0 to 255. */
export interface Grade {
  light: Rgb;
  shadows: Rgb;
  vignette: number;
  clouds: number;
}

function channels(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const each = (f: (i: 0 | 1 | 2) => number): Rgb => [f(0), f(1), f(2)];

/**
 * The grade for this light. `tint` greys it for rain or fog (multiplied into the light, and no
 * clouds' shadows under an overcast sky); `soften` (0 to 1) lifts it that far toward plain, as a
 * room indoors is only gently dim at night; `outdoors` false has no clouds.
 */
export function gradeOf(
  light: Daylight,
  tint: string | null = null,
  soften = 0,
  outdoors = true,
): Grade {
  const a = GRADE[light.from];
  const b = GRADE[light.to];
  const la = channels(a.light);
  const lb = channels(b.light);
  const t = tint ? channels(tint) : ([255, 255, 255] as Rgb);
  const lit = each((i) => (lerp(la[i], lb[i], light.t) * t[i]) / 255);
  return {
    light: each((i) => Math.round(lit[i] + (255 - lit[i]) * soften)),
    shadows: each((i) => lerp(a.shadows[i], b.shadows[i], light.t) * (1 - soften)),
    vignette: lerp(a.vignette, b.vignette, light.t) * (1 - soften * 0.5),
    clouds: outdoors && !tint ? lerp(a.clouds, b.clouds, light.t) : 0,
  };
}

/** The grade at an hour of a clear day outdoors, for reviewing and testing the rule. */
export function grade(hour: number): Grade {
  return gradeOf(daylight(hour));
}

/** The one pass the shadows take, if any: its blend and the colour it's drawn in, 0 to 255. */
export interface GradePass {
  mode: 'screen' | 'color-burn';
  colour: Rgb;
}

/**
 * How the shadows are drawn: a lift as a `screen` in their colour, a deepening as a
 * `color-burn` (which, in a colour just under white, darkens the darks most and leaves white
 * alone), or nothing when it would change nothing. A channel that leans the other way from the
 * rest is left alone, so it's always one pass; between a sky that lifts and one that deepens the
 * offsets pass through nothing, so the blend never jumps.
 */
export function passOf(shadows: Rgb): GradePass | null {
  const lift = shadows[0] + shadows[1] + shadows[2] >= 0;
  if (lift) {
    const colour = each((i) => Math.round(Math.max(0, shadows[i]) * 255));
    return colour.some((c) => c > 0) ? { mode: 'screen', colour } : null;
  }
  const colour = each((i) => Math.round(255 / (1 + Math.max(0, -shadows[i]))));
  return colour.some((c) => c < 255) ? { mode: 'color-burn', colour } : null;
}

/**
 * What the grade does to one colour (0 to 255 a channel), away from the vignette, clouds and
 * lamps, exactly as the canvas blends it: the multiply and then the pass. For tests and review.
 */
export function gradePixel(g: Grade, colour: Rgb): Rgb {
  const multiplied = each((i) => (colour[i] * g.light[i]) / 255);
  const pass = passOf(g.shadows);
  if (!pass) return each((i) => Math.round(multiplied[i]));
  return each((i) => {
    const b = multiplied[i] / 255;
    const s = pass.colour[i] / 255;
    const out = pass.mode === 'screen' ? b + s - b * s : s === 0 ? 0 : 1 - Math.min(1, (1 - b) / s);
    return Math.round(Math.max(0, out) * 255);
  });
}

/** Where the night's vignette starts darkening, and where it's at its darkest, in world pixels. */
export const VIGNETTE_FROM = 4 * TILE_SIZE;
export const VIGNETTE_TO = 11 * TILE_SIZE;

/**
 * How far into the vignette a pixel this far from the middle of the frame is, 0 to 1. Measured in
 * world pixels, so it falls the same in tiles at Close as at Far (decision 290): Far, which shows
 * more of the town, sees more of it darkened.
 */
export function vignetteShade(distance: number): number {
  const t = Math.min(1, Math.max(0, (distance - VIGNETTE_FROM) / (VIGNETTE_TO - VIGNETTE_FROM)));
  return t * t * (3 - 2 * t);
}
