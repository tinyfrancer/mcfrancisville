import type { ClueId } from '../data/mystery';
import { CHAIN, CHAIN_AFTER, CHAIN_DAYS, CHAIN_LAST } from '../data/mysteryChain';
import { WES_CLOSE_CHATS, WES_FRIEND_CHATS, type WesBand } from '../data/wes';
import { daysBetween, shiftDay } from './calendar';

/** When each clue was pinned, or null while it's still to find. */
export type FoundOn = (id: ClueId) => string | null;

/** The step of the chain still to come next, and the day it comes; null once it's all found. */
export interface NextStep {
  step: number;
  from: string;
}

/**
 * The next step of the chain (V1's P3a, decision 302), and the day it comes: a week after the day
 * she read or found the one before, starting from the mayor's second letter. `began` is the day
 * this build first saw her town; the first step never comes before the morning after, so an old
 * town that has everything so far starts the chain the next day rather than the moment it opens.
 * Null until the second letter is read, and once every step is found.
 */
export function nextStep(found: FoundOn, began: string | null): NextStep | null {
  let last = found(CHAIN_AFTER);
  if (last === null) return null;
  for (let step = 0; step < CHAIN.length; step++) {
    const on = found(CHAIN[step]!.clue);
    if (on !== null) {
      last = on;
      continue;
    }
    let from = shiftDay(last, CHAIN_DAYS);
    const morning = step === 0 && began !== null ? shiftDay(began, 1) : null;
    if (morning !== null && morning > from) from = morning;
    return { step, from };
  }
  return null;
}

/** The step of the chain that's due today, if one is. */
export function dueStep(found: FoundOn, began: string | null, today: string): number | null {
  const next = nextStep(found, began);
  return next !== null && next.from <= today ? next.step : null;
}

/** How many days until a clue of the chain comes: 0 if it's due, null if it's further off. */
export function daysUntil(
  id: ClueId,
  found: FoundOn,
  began: string | null,
  today: string,
): number | null {
  const next = nextStep(found, began);
  if (next === null || CHAIN[next.step]!.clue !== id) return null;
  return Math.max(0, daysBetween(today, next.from));
}

/** Whether a clue is one of the chain's. */
export function inChain(id: ClueId): boolean {
  return CHAIN.some((step) => step.clue === id);
}

/** The day the chain's last clue was pinned: the mayor is ready to be met (P3b reads it). */
export function readyOn(found: FoundOn): string | null {
  return found(CHAIN_LAST);
}

/** How well Wes knows her, by the days she has stopped to chat. */
export function wesBand(chats: number): WesBand {
  if (chats >= WES_CLOSE_CHATS) return 'close';
  if (chats >= WES_FRIEND_CHATS) return 'friend';
  return 'hello';
}

/** How many days after a clue was pinned the neighbours still talk it over. */
export const THEORY_DAYS = 3;

/** Whether a clue pinned on `on` is still news to theorise about today. */
export function stillNews(on: string, today: string): boolean {
  const since = daysBetween(on, today);
  return since >= 0 && since <= THEORY_DAYS;
}
