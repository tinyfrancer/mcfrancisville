import type { Pose } from '../types/ids';

/** How long she stands still before she gets her phone out. */
export const IDLE_AFTER_MS = 8_000;
/** How long she holds each idle pose, and stands between them. */
export const IDLE_SPELL_MS = 7_000;
export const IDLE_GAP_MS = 3_000;

/** How long she rocks out at a big moment, and each beat of the head-bang. */
export const ROCK_MS = 2_400;
export const BANG_MS = 300;

/**
 * What she does after standing still for `stillMs`: nothing at first, then her phone, then her
 * arms crossed, taking turns with a moment's plain standing between (personal_touches.md).
 */
export function idlePose(stillMs: number): Pose | null {
  if (stillMs < IDLE_AFTER_MS) return null;
  const turn = IDLE_SPELL_MS + IDLE_GAP_MS;
  const t = (stillMs - IDLE_AFTER_MS) % (2 * turn);
  if (t < IDLE_SPELL_MS) return 'phone';
  if (t >= turn && t < turn + IDLE_SPELL_MS) return 'arms';
  return null;
}

/** Devil horns up, then her head down, on the beat, for `ROCK_MS` after a big moment. */
export function rockPose(sinceMs: number): Pose | null {
  if (sinceMs < 0 || sinceMs >= ROCK_MS) return null;
  return Math.floor(sinceMs / BANG_MS) % 2 === 0 ? 'horns' : 'bang';
}
