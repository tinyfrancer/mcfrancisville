import { spotOf } from '../data/maps';
import type { VillagerId, ZoneId } from '../types/ids';
import type { Tile } from './pathfinding';

/*
 * Ollie with the post (V1's P4): when a letter comes for her while she's in town, he walks it to
 * her mailbox, stands a moment putting it in, and the flag goes up as he leaves. The rules, from
 * where she is and how long it has been; `world/services/PostRound.ts` keeps the round.
 */

/** Who carries it. */
export const POSTMAN: VillagerId = 'ollie';

/** Where he stands to post it: on her path, before her mailbox. */
export const MAILBOX_STEP: Tile = spotOf('town', 'herPath');

/** How long he stands at her mailbox putting the letter in, once he's there. */
export const POSTING_MS = 1_600;

/**
 * How long a round may take before the letter is simply in her mailbox: he comes from wherever he
 * was, and she shouldn't wait on him.
 */
export const ROUND_MS = 90_000;

/**
 * Whether he walks a letter over now: only while she's in town to see him, and not while she's
 * talking to him (he'd have to leave mid-sentence).
 */
export function walksIt(here: ZoneId, talkingTo: VillagerId | null): boolean {
  return here === 'town' && talkingTo !== POSTMAN;
}

/** Where his round is up to: on his way, putting it in for so long, or done. */
export function roundState(
  sinceMs: number,
  postingMs: number | null,
): 'walking' | 'posting' | 'done' {
  if (sinceMs >= ROUND_MS) return 'done';
  if (postingMs === null) return 'walking';
  return postingMs >= POSTING_MS ? 'done' : 'posting';
}
