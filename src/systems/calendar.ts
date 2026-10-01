import {
  CALENDAR,
  CALENDAR_IDS,
  type CalendarId,
  type FestivalId,
  type HolidayId,
  type Span,
  type When,
} from '../data/calendar';
import { atTheFair } from './venues';

/**
 * When the calendar's days fall (phase N), from a day key alone, so nothing is saved and every
 * year works itself out: fixed dates, floating ones (Thanksgiving, Easter), the full moons,
 * Friday the 13ths, and the festivals that span days (decision 143). A day key is `YYYY-MM-DD`,
 * the day that runs from 5am (decisions.md 4).
 */

/** A day key's parts, with its weekday (0 is Sunday). */
export interface DayParts {
  year: number;
  month: number;
  date: number;
  weekday: number;
}

export function partsOf(day: string): DayParts {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const date = Number(day.slice(8, 10));
  return { year, month, date, weekday: new Date(Date.UTC(year, month - 1, date)).getUTCDay() };
}

/** The day key of a year, month (1–12) and date, which may run over into the next month. */
export function keyOf(year: number, month: number, date: number): string {
  const d = new Date(Date.UTC(year, month - 1, date));
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}-${mm}-${dd}`;
}

/** The Monday that a day key's week starts on, as a day key: weeks run Monday to Sunday. */
export function weekOf(day: string): string {
  const { year, month, date, weekday } = partsOf(day);
  return keyOf(year, month, date - ((weekday + 6) % 7));
}

/** The day after a day key. */
export function nextDay(day: string): string {
  const { year, month, date } = partsOf(day);
  return keyOf(year, month, date + 1);
}

/** The day `by` days on from a day key: back, if it's negative. */
export function shiftDay(day: string, by: number): string {
  const { year, month, date } = partsOf(day);
  return keyOf(year, month, date + by);
}

/** How many days on from one day key another is: negative if it's earlier. */
export function daysBetween(from: string, to: string): number {
  const at = (day: string) => {
    const { year, month, date } = partsOf(day);
    return Date.UTC(year, month - 1, date);
  };
  return Math.round((at(to) - at(from)) / 86_400_000);
}

/** How many days a month has. */
export function daysIn(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Easter Sunday in a year, as month and date: the anonymous Gregorian computus. */
export function easterOf(year: number): { month: number; date: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const date = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, date };
}

/** A new moon to count from (6 January 2000, 18:14 UTC), and how long a moon takes. */
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const SYNODIC_DAYS = 29.530588853;
const DAY_MS = 86_400_000;

/**
 * Whether a day is the full moon's: the one day each moon whose noon (UTC, so every phone
 * agrees) is within half a day of the moon being full.
 */
export function isFullMoon(day: string): boolean {
  const { year, month, date } = partsOf(day);
  const noon = Date.UTC(year, month - 1, date, 12);
  const age = ((((noon - NEW_MOON) / DAY_MS) % SYNODIC_DAYS) + SYNODIC_DAYS) % SYNODIC_DAYS;
  const full = SYNODIC_DAYS / 2;
  return age >= full - 0.5 && age < full + 0.5;
}

/** Whether a rule falls on a day. */
export function fallsOn(when: When, day: string): boolean {
  const p = partsOf(day);
  if ('on' in when) return day.slice(5) === when.on;
  if ('from' in when) return withinSpan(when, day);
  if ('easter' in when) {
    const easter = easterOf(p.year);
    return keyOf(p.year, easter.month, easter.date + when.easter) === day;
  }
  if ('fullMoon' in when) return isFullMoon(day);
  if ('date' in when) return p.weekday === when.weekday && p.date === when.date;
  if (when.month !== undefined && when.month !== p.month) return false;
  if (p.weekday !== when.weekday) return false;
  if (when.nth === -1) return p.date + 7 > daysIn(p.year, p.month);
  return Math.ceil(p.date / 7) === when.nth;
}

function withinSpan(span: Span, day: string): boolean {
  const md = day.slice(5);
  return span.from <= span.until
    ? md >= span.from && md <= span.until
    : md >= span.from || md <= span.until;
}

const isSpan = (when: When): when is Span => 'from' in when;

const DAY_IDS = CALENDAR_IDS.filter((id) => !isSpan(CALENDAR[id].when));
const FESTIVAL_IDS = CALENDAR_IDS.filter((id): id is FestivalId => isSpan(CALENDAR[id].when));

/**
 * What's on a day, of the rows that fall on a day of their own: her days first, then the
 * holidays, then the town's events. A festival spanning it is `festivalsOn`'s.
 */
export function happeningOn(day: string): CalendarId[] {
  return DAY_IDS.filter((id) => fallsOn(CALENDAR[id].when, day));
}

export function isHappening(id: CalendarId, day: string): boolean {
  return fallsOn(CALENDAR[id].when, day);
}

/** The festivals a day falls in. */
export function festivalsOn(day: string): FestivalId[] {
  return FESTIVAL_IDS.filter((id) => fallsOn(CALENDAR[id].when, day));
}

/** A festival as it stands on one of its days: how far in, and how long till its big day. */
export interface FestivalDay {
  id: FestivalId;
  /** Which of its days this is, from 1. */
  nth: number;
  /** How many days there are of it. */
  of: number;
  /** What it counts down to, and how many days off that is: 0 on the day itself. */
  finale: HolidayId | null;
  left: number;
}

/** Where a day falls in a festival spanning it. */
export function festivalDay(id: FestivalId, day: string): FestivalDay {
  const row = CALENDAR[id];
  let first = day;
  while (fallsOn(row.when, shiftDay(first, -1)) && daysBetween(first, day) < 366) {
    first = shiftDay(first, -1);
  }
  let last = day;
  while (fallsOn(row.when, nextDay(last)) && daysBetween(day, last) < 366) last = nextDay(last);
  let finaleDay = last;
  if (row.finale) {
    const when = CALENDAR[row.finale].when;
    for (let d = day; daysBetween(d, last) >= 0; d = nextDay(d)) {
      if (fallsOn(when, d)) {
        finaleDay = d;
        break;
      }
    }
  }
  return {
    id,
    nth: daysBetween(first, day) + 1,
    of: daysBetween(first, last) + 1,
    finale: row.finale ?? null,
    left: daysBetween(day, finaleDay),
  };
}

/** The festival on a day, as it stands, if one is on. */
export function festivalOn(day: string): FestivalDay | null {
  const id = festivalsOn(day)[0];
  return id ? festivalDay(id, day) : null;
}

/** A day on the calendar, what's on it, and the festivals it falls in. */
export interface CalendarDay {
  day: string;
  happening: CalendarId[];
  festivals: FestivalId[];
}

/** Every day of a month (1–12), and what's on each. */
export function monthOf(year: number, month: number): CalendarDay[] {
  return Array.from({ length: daysIn(year, month) }, (_, i) => {
    const day = keyOf(year, month, i + 1);
    return { day, happening: happeningOn(day), festivals: festivalsOn(day) };
  });
}

/**
 * The next few days with something on, after `today`, looking up to a year ahead: what the
 * calendar says is coming up. A festival is coming up on its first day, so its `happening` leads
 * with any that begin then, and its `festivals` are only those.
 */
export function comingUp(today: string, count: number): CalendarDay[] {
  const found: CalendarDay[] = [];
  let day = today;
  for (let i = 0; i < 366 && found.length < count; i++) {
    const before = day;
    day = nextDay(day);
    const begin = festivalsOn(day).filter((id) => !fallsOn(CALENDAR[id].when, before));
    const happening = [...begin, ...happeningOn(day)];
    if (happening.length > 0) found.push({ day, happening, festivals: begin });
  }
  return found;
}

/** How many monarchs flutter about every place on Dolly Parton day, at the least (0.2's D2). */
export const DOLLY_MONARCHS = 16;

/** How many monarchs flutter about a place that has `usual` on a day: more on Dolly Parton day. */
export function monarchsOn(day: string, usual: number): number {
  return fallsOn(CALENDAR.dollyDay.when, day) ? Math.max(usual, DOLLY_MONARCHS) : usual;
}

/** What the calendar says of a row, and what it says on its morning: the fairground's, once it's open (0.2's M3). */
export function wordsOf(id: CalendarId): { about: string; morning: string } {
  const row = CALENDAR[id];
  return row.fair && atTheFair() ? row.fair : row;
}
