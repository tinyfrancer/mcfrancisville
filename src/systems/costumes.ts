import { NEIGHBOUR_COSTUMES } from '../data/costumes';
import { TRICK_OR_TREAT_FESTIVAL } from '../data/trickOrTreat';
import { VILLAGER_IDS } from '../data/villagers';
import type { VillagerId } from '../types/ids';
import { festivalOn, shiftDay } from './calendar';

/**
 * The neighbours in costume (0.2's J2, decision 144), from the day key alone: which week of the
 * Halloween Festival it is, and who's dressed up.
 */

/** Which week of the festival a day is in, from 1, the last few days counting as the fourth; 0 outside it. */
export function festivalWeek(day: string): number {
  const festival = festivalOn(day);
  if (festival?.id !== TRICK_OR_TREAT_FESTIVAL) return 0;
  return Math.min(4, Math.ceil(festival.nth / 7));
}

/** Whether a neighbour is in their costume on a day. */
export function inCostume(villager: VillagerId, day: string): boolean {
  const week = festivalWeek(day);
  return week > 0 && NEIGHBOUR_COSTUMES[villager].week <= week;
}

/** Those who put their costumes on this morning. */
export function dressingUp(day: string): VillagerId[] {
  return VILLAGER_IDS.filter((id) => inCostume(id, day) && !inCostume(id, shiftDay(day, -1)));
}
