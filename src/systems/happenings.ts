import { HAPPENING_IDS, HAPPENINGS } from '../data/happenings';
import { INTERIORS } from '../data/interiors';
import { spotOf } from '../data/maps';
import { PARTY_SPOTS, SPECIAL_DAYS } from '../data/specialDays';
import type { HappeningId, VillagerId } from '../types/ids';
import { CALENDAR } from '../data/calendar';
import { fallsOn, festivalsOn, isFullMoon, nextDay, partsOf } from './calendar';
import { DAY_STARTS_AT_HOUR } from './clock';
import { hashString } from './random';
import type { Place } from './schedules';

/**
 * When her neighbours' own events are on (phase S2), from the day key and the hour alone; and a
 * newcomer's welcome party from the day they wrote, as the save has it (0.2's L1).
 */

/** The day each newcomer wrote to say they were coming, told by `Newcomers` as the save has it. */
let wrote: Partial<Record<VillagerId, string>> = {};

/** What the save says of when each newcomer wrote, for their welcome parties. */
export function knowWelcomes(letters: Partial<Record<VillagerId, string>>): void {
  wrote = { ...letters };
}

/** A newcomer's welcome party is the day after they move in: two days after their letter. */
export function welcomeDayOf(letter: string): string {
  return nextDay(nextDay(letter));
}

/** Whether a happening is on at all on a day. */
export function happensOn(id: HappeningId, day: string): boolean {
  const { on } = HAPPENINGS[id];
  if ('festival' in on) {
    if (!on.weekdays.includes(partsOf(day).weekday)) return false;
    const { finale } = CALENDAR[on.festival];
    if (finale && fallsOn(CALENDAR[finale].when, day)) return false;
    return festivalsOn(day).includes(on.festival);
  }
  if ('weekdays' in on) return on.weekdays.includes(partsOf(day).weekday);
  if ('welcome' in on) {
    const letter = wrote[on.welcome];
    return letter !== undefined && welcomeDayOf(letter) === day;
  }
  if ('fullMoon' in on) return isFullMoon(day);
  if ('holiday' in on) return fallsOn(CALENDAR[on.holiday].when, day);
  if ('special' in on) return day.slice(5) === SPECIAL_DAYS[on.special];
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

/**
 * Whether a happening is a holiday's (phase U) or a festival's (0.2's J3), which comes before any
 * everyday one it meets.
 */
export function isHolidays(id: HappeningId): boolean {
  const { on } = HAPPENINGS[id];
  return 'holiday' in on || 'festival' in on || 'welcome' in on || 'special' in on;
}

/** The happenings going on at an hour of a day, a holiday's first. */
export function happeningsAt(hour: number, day: string): HappeningId[] {
  const h = hourOfNight(hour);
  const on = HAPPENING_IDS.filter((id) => {
    const row = HAPPENINGS[id];
    return row.from <= h && h < row.until && happensOn(id, day);
  });
  return [...on.filter(isHolidays), ...on.filter((id) => !isHolidays(id))];
}

/**
 * The happening a villager is at, if any. One on two at once goes to a holiday's, and otherwise to
 * the first in the order the rows are written.
 */
export function happeningOf(villager: VillagerId, hour: number, day: string): HappeningId | null {
  return happeningsAt(hour, day).find((id) => HAPPENINGS[id].who.includes(villager)) ?? null;
}

/**
 * Where a villager stands at a happening. Inside, each has a place of the room's own (`stands`, in
 * the order they're named); outdoors the host stands at the spot and `beside` says the rest
 * gather round them; at a party everyone has their place round the well, and with seats, their own.
 */
export function placeAt(id: HappeningId, villager: VillagerId): { place: Place; beside: boolean } {
  const row = HAPPENINGS[id];
  const i = row.who.indexOf(villager);
  if ('party' in row.where) {
    return { place: { zone: 'town', ...spotOf('town', PARTY_SPOTS[villager]) }, beside: false };
  }
  if ('seats' in row.where) {
    const seat = row.where.seats[i % row.where.seats.length]!;
    return { place: { zone: 'town', ...spotOf('town', seat) }, beside: false };
  }
  if ('inside' in row.where) {
    const stands = INTERIORS[row.where.inside].stands;
    return { place: { zone: row.where.inside, ...stands[i % stands.length]! }, beside: false };
  }
  return { place: { zone: 'town', ...spotOf('town', row.where.at) }, beside: i > 0 };
}
