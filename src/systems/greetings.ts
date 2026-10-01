import { CALENDAR, type CalendarId, type HolidayId, type TownEventId } from '../data/calendar';
import {
  CHICKEN_BUTT,
  EASTER_EGG_ODDS,
  HELLO_REPLY,
  HOLIDAY_GREETINGS,
  POKEMON,
  RED_ONE,
  WELCOMES,
} from '../data/greetings';
import { SPECIAL_LINES } from '../data/specialDays';
import { happeningOn } from './calendar';
import { dayKey, windowKey, windowOf } from './clock';
import { fill, specialDayOf, yearsMarried } from './friendship';
import { hashString } from './random';

/**
 * Which greeting Cody gives: his first hello, a special day's, a holiday's, the red Tesla, the
 * Pokémon reminder, chicken butt (0.2's D1), or his welcome back.
 */
export type GreetingKind =
  'first' | 'special' | 'holiday' | 'redOne' | 'pokemon' | 'chickenButt' | 'back';

export interface Greeting {
  kind: GreetingKind;
  line: string;
  /** How she answers, on the card's button. */
  reply: string;
  /** Said once she has answered: getting him first. */
  after?: string;
}

/** "2 days", "1 week": how long she's been away, for his welcome back. */
function awayFor(ms: number): string {
  const days = Math.floor(ms / 86_400_000);
  if (days < 14) return days === 1 ? '1 day' : `${days} days`;
  return `${Math.floor(days / 7)} weeks`;
}

/** One of a list, the same all through a window, so coming and going doesn't reshuffle it. */
function pick(lines: readonly string[], now: number, what: string): string {
  return lines[hashString(`${windowKey(now)}:${what}`) % lines.length]!;
}

type Celebrated = HolidayId | TownEventId;

/** The holiday or town event today that has a greeting, if any. */
function celebrated(day: string): Celebrated | null {
  const on = happeningOn(day).find((id: CalendarId) => CALENDAR[id].kind !== 'special');
  return (on as Celebrated | undefined) ?? null;
}

/**
 * What Cody says as she opens the game (decisions.md 24, 114), from the clock, when she last had
 * it open, and her name. `lastPlayedAt` is null for a brand-new game. On one of her special days
 * it's that day's line every time; on the first visit of any other day it may be the day's
 * holiday, or now and then the red Tesla or the Pokémon reminder, picked by the day key; otherwise
 * it's his welcome back, by how long she's been away.
 */
export function greetingFor(now: number, lastPlayedAt: number | null, name: string): Greeting {
  if (lastPlayedAt === null) return { kind: 'first', line: WELCOMES.first, reply: HELLO_REPLY };
  const day = dayKey(now);
  const away = Math.max(0, now - lastPlayedAt);
  const values = { name, years: yearsMarried(day), days: awayFor(away) };
  const special = specialDayOf(day);
  if (special) {
    return { kind: 'special', line: fill(SPECIAL_LINES[special].cody, values), reply: HELLO_REPLY };
  }
  if (dayKey(lastPlayedAt) !== day) {
    const holiday = celebrated(day);
    if (holiday) return { kind: 'holiday', line: HOLIDAY_GREETINGS[holiday], reply: HELLO_REPLY };
    const roll = hashString(`${day}:greeting`) % 100;
    if (roll < EASTER_EGG_ODDS.redOne) {
      const line = pick(RED_ONE.lines, now, 'redOne');
      return { kind: 'redOne', line, reply: RED_ONE.reply, after: RED_ONE.after };
    }
    if (roll < EASTER_EGG_ODDS.redOne + EASTER_EGG_ODDS.pokemon) {
      return { kind: 'pokemon', line: pick(POKEMON.lines, now, 'pokemon'), reply: POKEMON.reply };
    }
    if (roll < EASTER_EGG_ODDS.redOne + EASTER_EGG_ODDS.pokemon + EASTER_EGG_ODDS.chickenButt) {
      const line = pick(CHICKEN_BUTT.lines, now, 'chickenButt');
      return { kind: 'chickenButt', line, reply: CHICKEN_BUTT.reply, after: CHICKEN_BUTT.after };
    }
  }
  return { kind: 'back', line: fill(welcomeBack(now, lastPlayedAt), values), reply: HELLO_REPLY };
}

/** His welcome back, by how long she's been away, before `{days}` and `{name}` are filled in. */
function welcomeBack(now: number, lastPlayedAt: number): string {
  const hours = (now - lastPlayedAt) / 3_600_000;
  if (hours < 0.25) return pick(WELCOMES.minutes, now, 'minutes');
  if (windowKey(lastPlayedAt) === windowKey(now)) return pick(WELCOMES.hours, now, 'hours');
  if (hours < 36) return pick(WELCOMES.window[windowOf(now)], now, 'window');
  if (hours < 24 * 5) return pick(WELCOMES.days, now, 'days');
  if (hours < 24 * 14) return pick(WELCOMES.week, now, 'week');
  return pick(WELCOMES.weeks, now, 'weeks');
}
