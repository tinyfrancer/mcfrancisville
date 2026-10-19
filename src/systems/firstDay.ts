import { FIRST_DAY_IDS, MEET_NEIGHBOURS } from '../data/firstDay';
import type { FirstDayStepId } from '../types/ids';

/**
 * What the town already keeps that the first day's steps read (V1's R1, decision 311): nothing of
 * its own, so no step is a lock, any order works, and a step done before she looked is done.
 */
export interface FirstDayFacts {
  /** The candy tree has been shaken. */
  shaken: boolean;
  /** Something is growing in a bed, or has been picked from one. */
  planted: boolean;
  /** Something is on the honesty stall, or has sold from it. */
  stalled: boolean;
  /** A note on the board was answered this window. */
  answered: boolean;
  /** How many neighbours she has talked to, her husband aside. */
  met: number;
  /** She has eaten something. */
  ate: boolean;
}

/** How far along a step is: how many of how many (one of one, but for meeting the neighbours). */
export function progressOf(
  id: FirstDayStepId,
  facts: FirstDayFacts,
): { have: number; need: number } {
  if (id === 'meet') return { have: Math.min(facts.met, MEET_NEIGHBOURS), need: MEET_NEIGHBOURS };
  const done: Record<Exclude<FirstDayStepId, 'meet'>, boolean> = {
    shake: facts.shaken,
    plant: facts.planted,
    stall: facts.stalled,
    notice: facts.answered,
    eat: facts.ate,
  };
  return { have: done[id] ? 1 : 0, need: 1 };
}

export function isStepDone(id: FirstDayStepId, facts: FirstDayFacts): boolean {
  const { have, need } = progressOf(id, facts);
  return have >= need;
}

/** The steps the facts say are done that weren't, in the card's order. */
export function newlyDone(done: readonly FirstDayStepId[], facts: FirstDayFacts): FirstDayStepId[] {
  return FIRST_DAY_IDS.filter((id) => !done.includes(id) && isStepDone(id, facts));
}

/** Whether every step is done. */
export function allDone(done: readonly FirstDayStepId[]): boolean {
  return FIRST_DAY_IDS.every((id) => done.includes(id));
}

/** A note's key in the day's takings (`noticeKey` in `systems/notices.ts`). */
export const isNoticeKey = (key: string): boolean => /^notice:\d+$/.test(key);
