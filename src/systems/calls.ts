import { BEST_CALLS } from '../data/bestFriends';
import { DAY_WINDOWS } from '../data/windows';
import type { VillagerId } from '../types/ids';
import { specialDayOf } from './friendship';
import { happeningOf } from './happenings';
import { hashMixed } from './random';
import { VISIT_HOURS, visitOf, visitsOn, type Visit } from './schedules';

/*
 * A best friend's call at her house by choice (V1's P2, decision 301): about one day in six, for a
 * window's visiting hours, when nothing of theirs is on then (a happening, a visit, a guest of
 * their own). Worked out from the day key alone, as the town's visits are; only whether they're
 * best friends comes from her, which `Neighbourhood` asks before it reads this. Cody's evenings
 * at hers are his session's (P5).
 */

export const CALL_EVERY = 6;

/** The call a neighbour would pay her on a day, were they best friends, if any. */
export function callOn(villager: VillagerId, day: string): Visit | null {
  if (!BEST_CALLS[villager] || specialDayOf(day) === 'birthday') return null;
  const h = hashMixed(`call:${villager}:${day}`);
  if (h % CALL_EVERY !== 0) return null;
  const window = DAY_WINDOWS[(h >>> 8) % DAY_WINDOWS.length]!;
  const [from, until] = VISIT_HOURS[window];
  for (let hour = from; hour < until; hour += 0.5) {
    if (happeningOf(villager, hour, day) || visitOf(villager, hour, day)) return null;
  }
  const hosting = visitsOn(day).some(
    (v) => v.host === villager && v.from < until && from < v.until,
  );
  return hosting ? null : { guest: villager, host: 'her', from, until };
}

/** The call a best friend is paying her at an hour of a day, if they're at hers. */
export function callOf(villager: VillagerId, hour: number, day: string): Visit | null {
  const call = callOn(villager, day);
  return call && call.from <= hour && hour < call.until ? call : null;
}
