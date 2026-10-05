import type { WindowSky } from '../data/wallsAndFloors';
import type { Weather } from '../data/weather';
import type { Daylight } from './clock';

/*
 * What a window in her wallpaper shows (0.3's S4): the sky outside at the hour, in the day's
 * weather, read off the same light the room is lit by, and where along her back wall they hang.
 */

/** The sky through her windows: whichever the light is nearer, greyed by rain or fog. */
export function windowSky(light: Daylight, weather: Weather): WindowSky {
  const sky = light.t < 0.5 ? light.from : light.to;
  const dark = sky === 'night' || sky === 'moonlit';
  if (weather === 'rain') return dark || sky === 'dusk' ? 'rainyNight' : 'rain';
  if (dark) return 'night';
  if (weather === 'fog') return 'fog';
  return sky;
}

/** How many tiles apart her windows hang. */
export const WINDOW_EVERY = 4;

/**
 * The columns of a back wall `width` tiles wide that have a window: every few tiles, balanced on
 * the middle, never in a corner, never beside a doorway's arch, and never where something hangs
 * (`covered`), so a picture is never hung half over a window.
 */
export function windowsAlong(
  width: number,
  doorways: readonly number[] = [],
  covered: readonly number[] = [],
): number[] {
  const middle = Math.floor(width / 2);
  const columns: number[] = [];
  for (let tx = middle % WINDOW_EVERY; tx < width; tx += WINDOW_EVERY) {
    if (tx === 0 || tx === width - 1) continue;
    if (doorways.some((d) => Math.abs(d - tx) <= 1)) continue;
    if (covered.includes(tx)) continue;
    columns.push(tx);
  }
  return columns;
}
