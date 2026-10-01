import { PALETTE } from '../sprites/palette';
import type { Point } from './camera';
import type { WorldLight } from './scene';

/*
 * The fountain playing its music box after dark (0.2's H2): its lamps swell on every beat and
 * ease off between, and little notes float up off its jet, one a beat, drifting either way.
 */

/** A quaver, five pixels across and seven high: its head, stem and flag. */
const NOTE: readonly string[] = ['..##.', '..#.#', '..#..', '..#..', '###..', '###..', '.#...'];

/** How many beats a note takes to float up and fade, and how far it rises in that time. */
const NOTE_BEATS = 3;
const NOTE_RISE = 30;

/** How a beat swells the lamps: brightest on it, easing off before the next. */
function swell(beat: number): number {
  const since = beat - Math.floor(beat);
  return (1 - since) * (1 - since);
}

/** The fountain's lamps on this beat: a little brighter and wider on it, a little dimmer between. */
export function pulsed(lights: readonly WorldLight[], beat: number | null): WorldLight[] {
  if (beat === null) return [...lights];
  const s = swell(beat);
  return lights.map((l) => ({
    ...l,
    // An even step of radius at a time, so only a few pools of light are ever drawn.
    radius: l.radius + Math.round(s * 3) * 2,
    strength: (l.strength ?? 1) * (0.7 + 0.3 * s),
  }));
}

/** The notes rising off a fountain whose jet tops out at `top`, for the beat it's on. */
export function drawFountainNotes(
  ctx: CanvasRenderingContext2D,
  top: Point,
  beat: number,
  cam: Point,
): void {
  ctx.fillStyle = PALETTE.candleBright;
  const whole = Math.floor(beat);
  for (let k = 0; k < NOTE_BEATS; k++) {
    const age = beat - (whole - k);
    if (age >= NOTE_BEATS) continue;
    // Each note leans away to the side its beat sends it, a little further as it rises.
    const side = (whole - k) % 2 === 0 ? -1 : 1;
    const x = Math.round(top.x - 2 + side * (4 + age * 4) - cam.x);
    const y = Math.round(top.y - 8 - (age / NOTE_BEATS) * NOTE_RISE - cam.y);
    // The last of its rise, it thins out to nothing, a row at a time from the bottom.
    const rows = age > NOTE_BEATS - 1 ? Math.ceil((NOTE_BEATS - age) * NOTE.length) : NOTE.length;
    NOTE.slice(0, rows).forEach((row, dy) => {
      for (let dx = 0; dx < row.length; dx++) {
        if (row[dx] === '#') ctx.fillRect(x + dx, y + dy, 1, 1);
      }
    });
  }
}
