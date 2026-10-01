import type { Family } from './critters';
import { SPECIAL_DAYS, type SpecialDayId } from './specialDays';

/**
 * The calendar (phase N): the big holidays, her special days, the town's own events, and its
 * festivals, each a row with a rule for when it falls (`systems/calendar.ts`). Phase N shows them
 * all on the calendar; the town events do something small already, the holidays get their
 * decorations, events and dialogue in phase U, and a festival (0.2's J1) spans days, counting down
 * to its big one. A new one is a row, and its id in one of the unions below.
 */
export type HolidayId =
  | 'newYear'
  | 'valentines'
  | 'stPatricks'
  | 'easter'
  | 'fourthOfJuly'
  | 'halloween'
  | 'thanksgiving'
  | 'christmasEve'
  | 'christmas'
  | 'newYearsEve';

/** The town's own days, which change something while they last. */
export type TownEventId = 'marketDay' | 'fullMoon' | 'luckyFriday';

/** The town's festivals, which span days (decision 143). */
export type FestivalId = 'halloweenFestival';

export type CalendarId = SpecialDayId | HolidayId | TownEventId | FestivalId;

/**
 * When a row falls, every year: a fixed `MM-DD`; the `nth` weekday of a month (0 is Sunday; -1 is
 * the last), in every month if none is said; so many days from Easter Sunday; the night of each
 * full moon; a weekday that falls on a date (Friday the 13th); or every day `from` one `MM-DD`
 * `until` another, both kept (a festival's span, which may run over the new year).
 */
export type When =
  | { on: string }
  | { nth: 1 | 2 | 3 | 4 | -1; weekday: number; month?: number }
  | { easter: number }
  | { fullMoon: true }
  | { weekday: number; date: number }
  | { from: string; until: string };

/** A rule that spans days. Only a festival's does. */
export type Span = Extract<When, { from: string }>;

export type CalendarKind = 'special' | 'holiday' | 'event' | 'festival';

export interface CalendarRow {
  name: string;
  icon: string;
  kind: CalendarKind;
  when: When;
  /** What the calendar says of it: what happens, warm and a little silly. */
  about: string;
  /** Said when its morning begins while she plays: "It's market day!" */
  morning: string;
  /** A festival's: the day it counts down to, which falls on its last. */
  finale?: HolidayId;
  /** A festival's: the words on the banner strung across the square while it's on, a line each. */
  banner?: readonly string[];
}

const special = (id: SpecialDayId) => ({ on: SPECIAL_DAYS[id] });

export const CALENDAR: Record<CalendarId, CalendarRow> = {
  // Her days, first on any day they share.
  earlyBirthday: {
    name: "Cody's birthday for you",
    icon: '🎂',
    kind: 'special',
    when: special('earlyBirthday'),
    about: "Cody is sure it's today. Everyone else has checked. Let him have it.",
    morning: "Cody says it's your birthday. (It's tomorrow.)",
  },
  birthday: {
    name: 'Your birthday',
    icon: '🎉',
    kind: 'special',
    when: special('birthday'),
    about: 'The whole town gathers round the well, and there is always cake.',
    morning: "It's your birthday! Happy birthday!",
  },
  anniversary: {
    name: 'Your anniversary',
    icon: '💍',
    kind: 'special',
    when: special('anniversary'),
    about: 'Another year of you and Cody. He has something for you in the mailbox.',
    morning: "It's your anniversary!",
  },
  septemberSong: {
    name: 'Your song day',
    icon: '🎶',
    kind: 'special',
    when: special('septemberSong'),
    about:
      'The twenty-first of September. The town plays a tune for it, and you know which song to sing.',
    morning: "It's the twenty-first of September!",
  },
  dollyDay: {
    name: 'Dolly Parton day',
    icon: '🦋',
    kind: 'special',
    when: special('dollyDay'),
    about: 'Butterflies everywhere, big hair all round, and everyone a little bit rhinestone.',
    morning: "It's Dolly Parton day! Look at all the butterflies!",
  },

  newYear: {
    name: "New Year's Day",
    icon: '🎆',
    kind: 'holiday',
    when: { on: '01-01' },
    about: 'A fresh year in McFrancisVille. Same ghosts, new resolutions.',
    morning: 'Happy New Year!',
  },
  valentines: {
    name: "Valentine's Day",
    icon: '💘',
    kind: 'holiday',
    when: { on: '02-14' },
    about: 'Hearts on every door, and a few that still beat.',
    morning: "Happy Valentine's Day!",
  },
  stPatricks: {
    name: "St Patrick's Day",
    icon: '☘️',
    kind: 'holiday',
    when: { on: '03-17' },
    about: 'Everything green, even the ghosts. Especially the ghosts.',
    morning: "Happy St Patrick's Day!",
  },
  easter: {
    name: 'Easter',
    icon: '🥚',
    kind: 'holiday',
    when: { easter: 0 },
    about: 'Eggs hidden all over town. Some of them are hatching into something.',
    morning: 'Happy Easter!',
  },
  fourthOfJuly: {
    name: 'Fourth of July',
    icon: '🎇',
    kind: 'holiday',
    when: { on: '07-04' },
    about: 'Fireworks over the pond, and the bats are not impressed.',
    morning: 'Happy Fourth of July!',
  },
  halloween: {
    name: 'Halloween',
    icon: '🎃',
    kind: 'holiday',
    when: { on: '10-31' },
    about: "It's Halloween every day here, but today it's official. Party!",
    morning: 'Happy Halloween! The real one!',
  },
  thanksgiving: {
    name: 'Thanksgiving',
    icon: '🦃',
    kind: 'holiday',
    when: { nth: 4, weekday: 4, month: 11 },
    about: 'A long table, a lot of pie, and everyone saying what they are thankful for.',
    morning: 'Happy Thanksgiving!',
  },
  christmasEve: {
    name: 'Christmas Eve',
    icon: '🕯️',
    kind: 'holiday',
    when: { on: '12-24' },
    about: 'Stockings up, and something on the roof that is probably just the wind.',
    morning: "It's Christmas Eve!",
  },
  christmas: {
    name: 'Christmas',
    icon: '🎄',
    kind: 'holiday',
    when: { on: '12-25' },
    about: 'Snow on the gravestones, lights on everything, and presents for everyone.',
    morning: 'Merry Christmas!',
  },
  newYearsEve: {
    name: "New Year's Eve",
    icon: '🥂',
    kind: 'holiday',
    when: { on: '12-31' },
    about: 'Staying up till midnight, which in this town is nothing special.',
    morning: "It's New Year's Eve!",
  },

  marketDay: {
    name: 'Market day',
    icon: '🧺',
    kind: 'event',
    when: { nth: 1, weekday: 6 },
    about: 'The first Saturday of the month. Cobweb Corner puts out a market table of extras.',
    morning: "It's market day: Cobweb Corner has a market table out.",
  },
  fullMoon: {
    name: 'Full moon',
    icon: '🌕',
    kind: 'event',
    when: { fullMoon: true },
    about: 'The night is bright, and the moths and orbs come out in their droves.',
    morning: "There's a full moon tonight.",
  },
  luckyFriday: {
    name: 'Lucky Friday',
    icon: '🍀',
    kind: 'event',
    when: { weekday: 5, date: 13 },
    about:
      'Friday the 13th is the luckiest day there is, here. Beads turn up in every rock and tree.',
    morning: "It's a lucky Friday! Beads are turning up everywhere.",
  },

  // Last, so a day's own rows come before the festival it falls in.
  halloweenFestival: {
    name: 'The Halloween Festival',
    icon: '🦇',
    kind: 'festival',
    when: { from: '10-01', until: '10-31' },
    about:
      'All of October, the whole town dressed for it, with something new each week and a party on the 31st.',
    morning: 'The Halloween Festival is on!',
    finale: 'halloween',
    banner: ['HALLOWEEN', 'FESTIVAL'],
  },
};

/** Every row, her days first, then the holidays, the town's events and the festivals. */
export const CALENDAR_IDS = Object.keys(CALENDAR) as CalendarId[];

/** How much likelier a family of critter is on the night of a full moon (from 6pm to 5am). */
export const FULL_MOON_WEIGHT: Partial<Record<Family, number>> = { moth: 3, orb: 3 };

/** On a lucky Friday a bead is this many times likelier in a rock or a tree. */
export const LUCKY_BEADS = 4;
