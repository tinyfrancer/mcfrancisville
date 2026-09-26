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
 * phone at lunchtime. It changes only the light: every rule still reads the real clock, so it can
 * never hand out tomorrow's wood. Null when absent or not an hour.
 */
export function hourRequested(search: string): number | null {
  const raw = new URLSearchParams(search).get('hour');
  if (raw === null || raw.trim() === '') return null;
  const hour = Number(raw);
  return Number.isFinite(hour) && hour >= 0 && hour < 24 ? hour : null;
}
