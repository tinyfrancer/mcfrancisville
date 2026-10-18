import {
  HAPPENING_IDS,
  HAPPENINGS,
  STAGE_SPOTS,
  type Away,
  type HappeningRow,
  type Outdoors,
  type SetPiece,
} from '../data/happenings';
import { INTERIORS } from '../data/interiors';
import { spotIn } from '../data/maps';
import { PARTY_SPOTS, SPECIAL_DAYS } from '../data/specialDays';
import type { HappeningId, InteriorId, MapZoneId, VillagerId, ZoneId } from '../types/ids';
import { CALENDAR } from '../data/calendar';
import { fallsOn, festivalsOn, isFullMoon, partsOf } from './calendar';
import { DAY_STARTS_AT_HOUR } from './clock';
import { inTown, unmaskingOn } from './mayor';
import { isBirthday } from '../data/birthdays';
import { weatherOn } from './weather';
import { hashString } from './random';
import type { Place } from './schedules';
import { atTheFair } from './venues';

/* When her neighbours' own events are on (phase S2), from the day key and the hour alone. */

/** Whether a happening is on at all on a day. */
export function happensOn(id: HappeningId, day: string): boolean {
  const { on, clear } = HAPPENINGS[id];
  // Stargazing wants a clear sky (V1's P4), worked out from the day key as the weather is.
  if (clear && weatherOn(day) !== 'clear') return false;
  if ('festival' in on) {
    if (!on.weekdays.includes(partsOf(day).weekday)) return false;
    const { finale } = CALENDAR[on.festival];
    if (finale && fallsOn(CALENDAR[finale].when, day)) return false;
    return festivalsOn(day).includes(on.festival);
  }
  if ('weekdays' in on) return on.weekdays.includes(partsOf(day).weekday);
  if ('fullMoon' in on) return isFullMoon(day);
  if ('holiday' in on) return fallsOn(CALENDAR[on.holiday].when, day);
  if ('special' in on) return day.slice(5) === SPECIAL_DAYS[on.special];
  if ('unmasking' in on) return unmaskingOn(day);
  // A neighbour's birthday party (V1's P4); the mayor's only once she has met him.
  if ('birthday' in on) return isBirthday(on.birthday, day) && inTown(on.birthday);
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
  return (
    'holiday' in on || 'festival' in on || 'special' in on || 'unmasking' in on || 'birthday' in on
  );
}

/** The happenings going on at an hour of a day, a holiday's first. */
export function happeningsAt(hour: number, day: string): HappeningId[] {
  const h = hourOfNight(hour);
  const on = HAPPENING_IDS.filter((id) => {
    const row = HAPPENINGS[id];
    return row.from <= h && h < row.until && happensOn(id, day);
  });
  // The mayor's hello (V1's P3b) comes before anything else: it happens once.
  const once = on.filter((id) => 'unmasking' in HAPPENINGS[id].on);
  const rest = on.filter((id) => !once.includes(id));
  return [...once, ...rest.filter(isHolidays), ...rest.filter((id) => !isHolidays(id))];
}

/**
 * The happening a villager is at, if any. One on two at once goes to a holiday's, and otherwise to
 * the first in the order the rows are written.
 */
export function happeningOf(villager: VillagerId, hour: number, day: string): HappeningId | null {
  return happeningsAt(hour, day).find((id) => HAPPENINGS[id].who.includes(villager)) ?? null;
}

/** Where a happening is today: the place, how they gather, as the calendar says it, and its set. */
export interface Venue {
  zone: ZoneId;
  where: { inside: InteriorId } | Outdoors<'town'> | Outdoors<'fairground'> | Away;
  /** "round the well", "at the fairground's stage". */
  place: string;
  set: readonly SetPiece[];
}

/**
 * Where a happening is: at the fairground once it's open to her, for one that moves there (0.2's
 * M3), and otherwise where its row says, inside or in town.
 */
export function venueOf(id: HappeningId): Venue {
  const row: HappeningRow = HAPPENINGS[id];
  if (row.fair && atTheFair()) {
    return {
      zone: 'fairground',
      where: row.fair.where,
      place: row.fair.place,
      set: row.fair.set ?? [],
    };
  }
  const zone =
    'inside' in row.where ? row.where.inside : 'zone' in row.where ? row.where.zone : 'town';
  return { zone, where: row.where, place: row.place, set: row.set ?? [] };
}

/**
 * Where a villager stands at a happening. Inside, each has a place of the room's own (`stands`, in
 * the order they're named); outdoors the host stands at the spot and `beside` says the rest
 * gather round them; at a party everyone has their own place (round the well in town, before the
 * stage at the fairground), and with seats, their own seat.
 */
export function placeAt(id: HappeningId, villager: VillagerId): { place: Place; beside: boolean } {
  const { zone, where } = venueOf(id);
  const i = HAPPENINGS[id].who.indexOf(villager);
  if ('inside' in where) {
    const stands = INTERIORS[where.inside].stands;
    return { place: { zone: where.inside, ...stands[i % stands.length]! }, beside: false };
  }
  const outdoors = zone as MapZoneId;
  const spot = (name: string): Place => ({ zone: outdoors, ...spotIn(outdoors, name) });
  if ('party' in where) {
    const spots = outdoors === 'fairground' ? STAGE_SPOTS : PARTY_SPOTS;
    return { place: spot(spots[villager]), beside: false };
  }
  if ('seats' in where) return { place: spot(where.seats[i % where.seats.length]!), beside: false };
  return { place: spot(where.at), beside: i > 0 };
}
