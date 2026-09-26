/** `?loop=manual` puts the simulation on a hand crank for the smoke check (dev builds only). */
export function manualLoopRequested(search: string): boolean {
  return new URLSearchParams(search).get('loop') === 'manual';
}

/** `?gallery` shows every sprite instead of the game, so art can be reviewed on a phone. */
export function galleryRequested(search: string): boolean {
  return new URLSearchParams(search).has('gallery');
}
