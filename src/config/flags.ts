import type { Weather } from '../data/weather';

/** `?loop=manual` puts the simulation on a hand crank for the smoke check (dev builds only). */
export function manualLoopRequested(search: string): boolean {
  return new URLSearchParams(search).get('loop') === 'manual';
}

/** `?gallery` shows every sprite instead of the game, so art can be reviewed on a phone. */
export function galleryRequested(search: string): boolean {
  return new URLSearchParams(search).has('gallery');
}

/**
 * `?hour=21.5` draws the town in the light of that hour, so the night art can be reviewed on a
 * phone at lunchtime. In production it changes only the light: every rule still reads the real
 * clock, so it can never hand out tomorrow's wood. A dev build moves the town's clock to that hour
 * too, so the smoke check can find the night's snack. Null when absent or not an hour.
 */
export function hourRequested(search: string): number | null {
  const raw = new URLSearchParams(search).get('hour');
  if (raw === null || raw.trim() === '') return null;
  const hour = Number(raw);
  return Number.isFinite(hour) && hour >= 0 && hour < 24 ? hour : null;
}

/**
 * `?weather=rain` draws the places outdoors in that weather, so a rainy or foggy day can be seen on
 * a clear one. Like `?hour=` in production, it changes only what's drawn: the critters and the
 * garden still go by the day's own weather. Null when absent or not a weather.
 */
export function weatherRequested(search: string): Weather | null {
  const raw = new URLSearchParams(search).get('weather');
  return raw === 'clear' || raw === 'rain' || raw === 'fog' ? raw : null;
}
