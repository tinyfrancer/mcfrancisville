import { FLYER_HOURS, SKY, type Flyer } from '../data/sky';
import { bake } from '../sprites/bake';
import {
  BAT_FLYING,
  BAT_PALETTE,
  CROW_FLYING,
  CROW_PALETTE,
  CROW_PERCHED,
  PERCH_FEET,
} from '../sprites/sky';
import { tileHash } from '../sprites/terrain';
import type { MapZoneId } from '../types/ids';
import type { Point } from './camera';
import type { Drawable } from './scene';

/*
 * Crows and bats crossing the sky over a place (V1's E5), with `render/butterflies.ts` as the
 * pattern: drawing only, worked out from the clock, the hour and a phase of each one's own, so
 * nothing in the world knows of them. They fly across the top or the bottom of the view, never
 * through the middle where she is, and one that would cross her isn't drawn.
 */

/** How long a crossing takes, and how long a round is at least, each flyer's own on top. */
const CROSSING_MS: Record<Flyer, number> = { crow: 7000, bat: 4600 };
const ROUND_MS = 16_000;
/** How long each wingbeat shows. */
const BEAT_MS: Record<Flyer, number> = { crow: 130, bat: 85 };
/** A crow's wingbeats in order: up, level, down, level. */
const CROW_BEATS = [0, 1, 2, 1] as const;

/** Whether a kind of flyer is out at this hour. */
export function flyerOut(flyer: Flyer, hour: number): boolean {
  const { from, to } = FLYER_HOURS[flyer];
  return hour >= from && hour < to;
}

/** A flyer crossing `view` now: where, which way, which wingbeat; null between crossings. */
export function crossing(
  flyer: Flyer,
  index: number,
  zone: MapZoneId,
  view: { x: number; y: number; width: number; height: number },
  nowMs: number,
): { x: number; y: number; right: boolean; frame: number } | null {
  const h = tileHash(index * 13 + 5, zone.length * 7 + (flyer === 'crow' ? 1 : 2));
  const round = ROUND_MS + (h % 14_000);
  const t = (((nowMs + (h >>> 7)) % round) + round) % round;
  const span = CROSSING_MS[flyer];
  if (t >= span) return null;
  const f = t / span;
  const right = ((h >>> 3) & 1) === 0;
  // Across the top fifth or the bottom fifth of the view, rising or falling a little as it goes.
  const band =
    ((h >>> 5) & 1) === 0 ? 0.08 + ((h >>> 9) % 14) / 100 : 0.74 + ((h >>> 9) % 14) / 100;
  const across = view.width + 48;
  const x = view.x - 24 + (right ? f : 1 - f) * across;
  const wobble = flyer === 'bat' ? Math.sin(t / 110) * 3 + Math.sin(t / 47) * 2 : 0;
  const y = view.y + band * view.height + Math.sin(f * Math.PI * 2 + h) * 8 + wobble;
  const beat = Math.floor(t / BEAT_MS[flyer]);
  const frame = flyer === 'crow' ? CROW_BEATS[beat % CROW_BEATS.length]! : beat % 2;
  return { x: Math.round(x), y: Math.round(y), right, frame };
}

/** A flyer's picture, facing the way it flies. */
function flyerSprite(flyer: Flyer, frame: number, right: boolean): HTMLCanvasElement {
  const [frames, palette] =
    flyer === 'crow' ? [CROW_FLYING, CROW_PALETTE] : [BAT_FLYING, BAT_PALETTE];
  return bake(`sky:${flyer}:${frame}:${right ? 'r' : 'l'}`, frames[frame]!, palette, {
    flipX: !right,
  });
}

/** Whether two rectangles in world pixels overlap. */
function overlaps(a: Drawable, b: { x: number; y: number; w: number; h: number }): boolean {
  return (
    a.x < b.x + b.w && a.x + a.sprite.width > b.x && a.y < b.y + b.h && a.y + a.sprite.height > b.y
  );
}

/**
 * Everything crossing this place's sky now, aloft over whatever stands below, but never drawn
 * over her (`her`, her picture's box in world pixels).
 */
export function skyDrawables(
  zone: MapZoneId,
  cam: Point,
  canvas: { width: number; height: number },
  her: { x: number; y: number; w: number; h: number },
  nowMs: number,
  hour: number,
): Drawable[] {
  const view = { x: cam.x, y: cam.y, width: canvas.width, height: canvas.height };
  const drawn: Drawable[] = [];
  SKY[zone].forEach((flyer, i) => {
    if (!flyerOut(flyer, hour)) return;
    const at = crossing(flyer, i, zone, view, nowMs);
    if (!at) return;
    const sprite = flyerSprite(flyer, at.frame, at.right);
    const d: Drawable = {
      footY: cam.y + canvas.height + 10_000,
      sprite,
      x: at.x - sprite.width / 2,
      y: at.y - sprite.height / 2,
    };
    if (!overlaps(d, her)) drawn.push(d);
  });
  return drawn;
}

/** A crow's round at the scarecrow: in, a sit, and away again, then a while with none. */
const PERCH = { round: 46_000, landing: 2600, sitting: 22_000 };
/** Where on the scarecrow's picture its right arm is, to sit on. */
const ARM = { x: 36, y: 31 };
/** Where a crow comes in from and leaves to, from the arm. */
const FROM = { x: -120, y: -90 };
const TO = { x: 130, y: -100 };

/**
 * A crow on each scarecrow's arm now and then (V1's E5): it flies in from the top left, sits a
 * while looking about and pecking, then flies off to the top right. By day only, with the crows.
 */
export function perchDrawables(scarecrows: readonly Drawable[], nowMs: number, hour: number) {
  if (!flyerOut('crow', hour)) return [];
  return scarecrows.flatMap((s): Drawable[] => {
    const t = (nowMs + ((s.x * 37) % PERCH.round)) % PERCH.round;
    const arm = { x: s.x + ARM.x, y: s.y + ARM.y };
    const footY = s.footY + 0.5;
    const { landing, sitting } = PERCH;
    if (t < landing || (t >= landing + sitting && t < 2 * landing + sitting)) {
      const leaving = t >= landing;
      const f = leaving ? (t - landing - sitting) / landing : t / landing;
      // Easing in to land, and out as it takes off.
      const e = leaving ? f * f : 1 - (1 - f) * (1 - f);
      const off = leaving ? TO : FROM;
      const k = leaving ? e : 1 - e;
      const frame = CROW_BEATS[Math.floor(t / BEAT_MS.crow) % CROW_BEATS.length]!;
      const sprite = flyerSprite('crow', frame, true);
      const x = Math.round(arm.x + off.x * k - sprite.width / 2);
      const y = Math.round(arm.y - 6 + off.y * k - sprite.height / 2);
      return [{ footY, sprite, x, y }];
    }
    if (t >= landing + sitting) return [];
    const peck = Math.floor((t - landing) / 900) % 5 === 3 ? 1 : 0;
    const sprite = bake(`sky:crow:perched:${peck}`, CROW_PERCHED[peck]!, CROW_PALETTE);
    return [{ footY, sprite, x: arm.x - PERCH_FEET.x, y: arm.y - PERCH_FEET.y }];
  });
}
