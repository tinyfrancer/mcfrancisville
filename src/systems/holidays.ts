import { CALENDAR, type HolidayId } from '../data/calendar';
import {
  DECOR,
  DECOR_IDS,
  EGG_SPOTS,
  EGGS_HIDDEN,
  FROZEN,
  HOLIDAY_LETTERS,
  SKIES,
  type DecorId,
} from '../data/holidays';
import type { Tile } from '../data/maps';
import { fallsOn, keyOf, partsOf } from './calendar';
import { hourOfNight } from './happenings';
import { hashString, seeded } from './random';

/**
 * The holidays in town (phase U), from the day key alone: whose decorations are up, what's in the
 * sky, which letter comes, and where Easter's eggs are hidden.
 */

/** The day `offset` days from a day key. */
function shift(day: string, offset: number): string {
  const { year, month, date } = partsOf(day);
  return keyOf(year, month, date + offset);
}

let decorCache: { day: string; decor: DecorId | null } | null = null;

/**
 * The decorations up on a day, if any: the set whose holiday is nearest, of those whose days
 * before and after reach it. A holiday's own day is always its own.
 */
export function decorOn(day: string): DecorId | null {
  if (decorCache?.day === day) return decorCache.decor;
  let best: { id: DecorId; distance: number } | null = null;
  for (const id of DECOR_IDS) {
    const row = DECOR[id];
    const when = CALENDAR[row.holiday].when;
    for (let k = -row.after; k <= row.before; k++) {
      if (!fallsOn(when, shift(day, k))) continue;
      const distance = Math.abs(k);
      if (!best || distance < best.distance) best = { id, distance };
    }
  }
  const decor = best?.id ?? null;
  decorCache = { day, decor };
  return decor;
}

/** The decorations that go up on a day, if a set goes up that morning. */
export function goesUpOn(day: string): DecorId | null {
  const decor = decorOn(day);
  return decor && decorOn(shift(day, -1)) !== decor ? decor : null;
}

/** The first big holiday on a day, if any: her own days are on the calendar too, but aren't these. */
export function holidayOn(day: string): HolidayId | null {
  const ids = Object.keys(CALENDAR) as (keyof typeof CALENDAR)[];
  const id = ids.find((i) => CALENDAR[i].kind === 'holiday' && fallsOn(CALENDAR[i].when, day));
  return (id as HolidayId | undefined) ?? null;
}

/** What's in the sky over town at an hour of a day: fireworks, snow, or nothing special. */
export function skyAt(day: string, hour: number): 'fireworks' | 'snow' | null {
  const holiday = holidayOn(day);
  const sky = holiday ? SKIES[holiday] : undefined;
  if (!sky) return null;
  if ('snow' in sky) return 'snow';
  const h = hourOfNight(hour);
  return sky.fireworks.from <= h && h < sky.fireworks.until ? 'fireworks' : null;
}

/** The holiday letter a day brings, as its id (`holiday:year`), if it brings one. */
export function holidayLetterId(day: string): string | null {
  const holiday = holidayOn(day);
  if (!holiday || !HOLIDAY_LETTERS[holiday]) return null;
  return `${holiday}:${day.slice(0, 4)}`;
}

/** Where Easter's eggs are hidden, the same all day: none on any other day. */
export function eggsOn(day: string): readonly Tile[] {
  if (holidayOn(day) !== 'easter') return [];
  const random = seeded(hashString(`eggs:${day}`));
  const spots = [...EGG_SPOTS];
  for (let i = spots.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [spots[i], spots[j]] = [spots[j]!, spots[i]!];
  }
  return spots.slice(0, EGGS_HIDDEN);
}

/** Whether the town's pond is frozen over on a day: winter, round the new year. */
export function isFrozen(day: string): boolean {
  const md = day.slice(5);
  return md >= FROZEN.from || md <= FROZEN.until;
}

/** Whether the pond freezes over this morning. */
export function freezesOn(day: string): boolean {
  return isFrozen(day) && !isFrozen(shift(day, -1));
}

/** What an egg is kept as in `Takings`, once found: once a day, like the snack. */
export const eggKey = (t: Tile) => `egg:${t.tx},${t.ty}`;
