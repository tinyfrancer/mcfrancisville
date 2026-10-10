import { BEST_LETTERS } from '../data/bestFriends';
import { VILLAGERS } from '../data/villagers';
import type { VillagerId } from '../types/ids';
import { hashMixed } from './random';

/*
 * Best friends (V1's P2, decision 301): ten hearts, and what comes after. A letter now and then,
 * dealt from the day key, as `dear:<villager>:<day>`; the mailbox never takes the same id twice.
 * Their calls by choice are `systems/calls.ts`'s; what they say is `data/bestFriends.ts`.
 */

/** Best friends: as close as friends get. */
export const BEST_HEARTS = 10;

/** A best friend writes about one day in twelve she's in town. */
export const LETTER_EVERY = 12;

/** Whether a best friend writes to her on a day. Cody's letters are his session's (P5). */
export function writesOn(villager: VillagerId, day: string): boolean {
  return (
    BEST_LETTERS[villager] !== undefined &&
    hashMixed(`dear:${villager}:${day}`) % LETTER_EVERY === 0
  );
}

export function bestLetterId(villager: VillagerId, day: string): string {
  return `dear:${villager}:${day}`;
}

/** A best friend's letter by its id: who it's from, and which of their letters it is. */
export function bestLetter(id: string): { from: VillagerId; text: string } | null {
  const match = /^dear:(\w+):\d{4}-\d{2}-\d{2}$/.exec(id);
  const from = match?.[1];
  if (!from || !(from in VILLAGERS)) return null;
  const letters = BEST_LETTERS[from as VillagerId];
  if (!letters?.length) return null;
  return { from: from as VillagerId, text: letters[hashMixed(id) % letters.length]! };
}

export function isBestLetter(id: string): boolean {
  return id.startsWith('dear:');
}
