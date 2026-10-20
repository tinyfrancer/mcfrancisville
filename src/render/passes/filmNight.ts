import type { SeasonId } from '../../data/seasons';
import { bake } from '../../sprites/bake';
import { FILM_GLOW, FILM_PALETTE, FILM_SHOWING } from '../../sprites/filmNight';
import { dayKey, hourOf } from '../../systems/clock';
import type { PlacedProp } from '../../systems/grid';
import { happeningsAt } from '../../systems/happenings';
import type { World } from '../../world/World';
import { glowOf, type Drawable } from '../scene';
import { standing } from './standing';

/*
 * Film night's film (0.2's J3), on the screen `Decorations` puts out on the festival's Saturdays.
 * The screen is one of the decorations, so the sites' pass draws it in its place among them,
 * showing the film while it's on.
 */

/** How long each frame of film night's film shows: the ghost bobs a pixel a beat. */
const FILM_BEAT_MS = 450;

/** Which frame of the film is on the screen, while film night is on (0.2's J3); null if not. */
export function filmFrame(world: World): number | null {
  const now = world.clock.now();
  if (!happeningsAt(hourOf(now), dayKey(now)).includes('filmNight')) return null;
  return Math.floor(now / FILM_BEAT_MS) % FILM_SHOWING.length;
}

/** The screen with the film on it, lit after dark. */
export function showing(p: PlacedProp, frame: number, season: SeasonId): Drawable {
  const source = FILM_SHOWING[frame]!;
  const d = standing(p, season);
  const sprite = bake(`prop:filmScreen:showing:${frame}`, source, FILM_PALETTE);
  const glow = glowOf(`glow:filmScreen:${frame}`, source, FILM_PALETTE, FILM_GLOW);
  return { ...d, sprite, glow };
}
