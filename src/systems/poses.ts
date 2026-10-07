import type { ActionPose, Pose } from '../types/ids';

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

// ---- What she does as she does something (V1's E2, decision 281) ---------------------------

/** What she's doing, which says which action poses she takes, and for how long. */
export type Verb = 'pick' | 'water' | 'find' | 'show' | 'greet' | 'shrug';

/** One pose of an action, held for `ms`. */
export interface Beat {
  pose: ActionPose;
  ms: number;
}

/** A crouch to the ground and up again: picking, digging, planting, patting. */
export const CROUCH_MS = 320;
/** Her can tipped over a bed, long enough for the splash to land. */
export const POUR_MS = 480;
/** Something held up over her head while its pop floats up off her hands (E1's pop's float). */
export const HOLD_UP_MS = 720;
/** A wave hello, her hand to one side and the other, twice. */
export const WAVE_MS = 600;
export const WAVE_FLAP_MS = 150;
/** A shrug where a tap asks her to go somewhere she can't (V1's E4): long enough to be seen. */
export const SHRUG_MS = 640;

const crouch: Beat = { pose: 'crouch', ms: CROUCH_MS };
const holdUp: Beat = { pose: 'holdUp', ms: HOLD_UP_MS };

export const VERBS: Record<Verb, readonly Beat[]> = {
  pick: [crouch],
  water: [{ pose: 'pour', ms: POUR_MS }],
  // Down to the ground for it, then up over her head.
  find: [crouch, holdUp],
  show: [holdUp],
  greet: [{ pose: 'wave', ms: WAVE_MS }],
  shrug: [{ pose: 'shrug', ms: SHRUG_MS }],
};

/** How long an action takes from start to finish. */
export function actionMs(verb: Verb): number {
  return VERBS[verb].reduce((sum, beat) => sum + beat.ms, 0);
}

/**
 * Her pose `sinceMs` into an action, and which of its frames (a wave's hand to one side or the
 * other); null before it begins and once it's done.
 */
export function actionPose(
  verb: Verb,
  sinceMs: number,
): { pose: ActionPose; frame: number } | null {
  if (sinceMs < 0) return null;
  let left = sinceMs;
  for (const beat of VERBS[verb]) {
    if (left < beat.ms) {
      const frame = beat.pose === 'wave' ? Math.floor(left / WAVE_FLAP_MS) % 2 : 0;
      return { pose: beat.pose, frame };
    }
    left -= beat.ms;
  }
  return null;
}

/**
 * Her arm through a net's swing (`Collecting.netSwing`'s 0 to 1): raised as she lifts it, then
 * brought down over the critter as the hoop comes down.
 */
export function swingFrame(progress: number): 0 | 1 {
  return progress < 0.4 ? 0 : 1;
}

/** A breath in and out while she stands, her shoulders down a pixel on the out-breath. */
export const BREATH_MS = 3_200;
/** A blink every few seconds, and every third time a second one just after. */
export const BLINK_EVERY_MS = 4_300;
export const BLINK_MS = 130;

/** Whether she's breathing out, `ms` on the clock. */
export function breathingOut(ms: number): boolean {
  return ms % BREATH_MS >= BREATH_MS / 2;
}

/** Whether her eyes are shut for a blink, `ms` on the clock. */
export function blinking(ms: number): boolean {
  const t = ms % (3 * BLINK_EVERY_MS);
  const again = 2 * BLINK_EVERY_MS + 2 * BLINK_MS;
  return t % BLINK_EVERY_MS < BLINK_MS || (t >= again && t < again + BLINK_MS);
}
