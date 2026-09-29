import { HAPPENING_IDS, HAPPENINGS } from '../data/happenings';
import { INTERIORS } from '../data/interiors';
import { spotOf } from '../data/maps';
import type { HappeningId, VillagerId } from '../types/ids';
import { isFullMoon, partsOf } from './calendar';
import { DAY_STARTS_AT_HOUR } from './clock';
import { hashString } from './random';
import type { Place } from './schedules';

/**
 * When her neighbours' own events are on (phase S2), from the day key and the hour alone.
 */

/** Whether a happening is on at all on a day. */
export function happensOn(id: HappeningId, day: string): boolean {
  const { on } = HAPPENINGS[id];
  if ('weekdays' in on) return on.weekdays.includes(partsOf(day).weekday);
  if ('fullMoon' in on) return isFullMoon(day);
  return hashString(`happening:${id}:${day}`) % on.oneIn === 0;
}

/** The happenings on a day, earliest first. */
export function happeningsOn(day: string): HappeningId[] {
  return HAPPENING_IDS.filter((id) => happensOn(id, day)).sort(
    (a, b) => HAPPENINGS[a].from - HAPPENINGS[b].from,
  );
}

/** An hour of a day key counted on past midnight: two in the morning is 26. */
export function hourOfNight(hour: number): number {
  return hour < DAY_STARTS_AT_HOUR ? hour + 24 : hour;
}

/** The happenings going on at an hour of a day. */
export function happeningsAt(hour: number, day: string): HappeningId[] {
  const h = hourOfNight(hour);
  return HAPPENING_IDS.filter((id) => {
    const row = HAPPENINGS[id];
    return row.from <= h && h < row.until && happensOn(id, day);
  });
}

/**
 * The happening a villager is at, if any. One on two at once goes to the first, in the order the
 * rows are written.
 */
export function happeningOf(villager: VillagerId, hour: number, day: string): HappeningId | null {
  return happeningsAt(hour, day).find((id) => HAPPENINGS[id].who.includes(villager)) ?? null;
}

/**
 * Where a villager stands at a happening. Inside, each has a place of the room's own (`stands`, in
 * the order they're named); outdoors the host stands at the spot and `beside` says the rest
 * gather round them.
 */
export function placeAt(id: HappeningId, villager: VillagerId): { place: Place; beside: boolean } {
  const row = HAPPENINGS[id];
  const i = row.who.indexOf(villager);
  if ('inside' in row.where) {
    const stands = INTERIORS[row.where.inside].stands;
    return { place: { zone: row.where.inside, ...stands[i % stands.length]! }, beside: false };
  }
  return { place: { zone: 'town', ...spotOf('town', row.where.at) }, beside: i > 0 };
}
