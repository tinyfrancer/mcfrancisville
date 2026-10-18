import { CRITTERS, isCritter } from '../data/critters';
import { CROPS } from '../data/crops';
import { FOSSILS } from '../data/fossils';
import { FURNITURE } from '../data/furniture';
import { ITEMS } from '../data/items';
import { OUTFITS } from '../data/outfits';
import {
  ASKS,
  ASKS_ABOUT,
  EVENINGS_AT_HERS,
  HER_DAY_BACKS,
  HUSBAND,
  HUSBAND_TALK,
  NEWEST_FOR_DAYS,
  OUR_STORY,
  YESTERDAY,
  type HerDayAnswer,
  type HusbandTopic,
  type StoryScene,
} from '../data/cody';
import { SPECIAL_DAYS } from '../data/specialDays';
import type { VillagerId } from '../types/ids';
import { daysBetween } from './calendar';
import { windowAtHour } from './clock';
import type { Around, TalkScene } from './dialogue';
import { happeningOf } from './happenings';
import { hashMixed, hashString } from './random';
import { aThing, spokenName, type Brought, type Keyed } from './remembering';
import { isWeekend } from './schedules';

/*
 * Cody, married (V1's P5, decision 305): when he's at hers of an evening, how he asks about her
 * day and answers what she says, what only he brings up, and which scene from their story is
 * next. All of it from the day key, the hour and what the talk's scene says; what's kept is
 * `Lately`'s (her answer and the scenes told).
 */

export function isHusband(id: VillagerId): boolean {
  return id === HUSBAND;
}

/** Days since 1 January 2000, so a row's lines come round one a day. */
function dayNumber(day: string): number {
  return daysBetween('2000-01-01', day);
}

/** One of `lines` a day in turn: a list of seven never says the same thing twice in a week. */
function ofTheDay<T>(lines: readonly T[], day: string): T {
  return lines[dayNumber(day) % lines.length]!;
}

/**
 * Whether he spends a day's evening at hers: six nights in seven, the seventh at the manor, and
 * never on her birthday, when everyone is at the party.
 */
export function eveningAtHers(day: string): boolean {
  if (day.slice(5) === SPECIAL_DAYS.birthday) return false;
  return hashMixed(`codyHome:${day}`) % EVENINGS_AT_HERS.manorEvery !== 0;
}

/** Whether he's at hers at an hour: from seven until his walk home, unless a happening of his is on. */
export function atHers(hour: number, day: string): boolean {
  const { from, until } = EVENINGS_AT_HERS;
  const end = isWeekend(day) ? until.weekend : until.weekday;
  if (hour < from || hour >= end || !eveningAtHers(day)) return false;
  return happeningOf(HUSBAND, hour, day) === null;
}

/** He asks about her day of an evening, from six until the small hours. */
export function asksNow(hour: number): boolean {
  return windowAtHour(hour) === 'evening';
}

function fillIn(template: string, fill: Record<string, string>): string {
  return Object.entries(fill).reduce((line, [k, v]) => line.replaceAll(`{${k}}`, v), template);
}

/**
 * How he asks about her day: about the first thing she did today he knows of (what she caught,
 * picked, gave the museum or put out), or else the day's way of asking. So his evening line
 * changes with what she did.
 */
export function askOf(scene: Around, day: string): string {
  const about = (key: keyof typeof ASKS_ABOUT, fill: Record<string, string>) =>
    fillIn(ofTheDay(ASKS_ABOUT[key], day), fill);
  if (scene.caught) return about('caught', { catch: aThing(CRITTERS[scene.caught].name) });
  if (scene.harvested?.day === day) {
    const item = CROPS[scene.harvested.crop].harvest.item;
    return about('harvested', { harvest: spokenName(ITEMS[item].name) });
  }
  if (scene.donated?.day === day) {
    const thing = scene.donated.thing;
    const name = isCritter(thing) ? CRITTERS[thing].name : FOSSILS[thing].name;
    return about('donated', { donated: aThing(name) });
  }
  if (scene.placed?.day === day) {
    return about('placed', { piece: spokenName(FURNITURE[scene.placed.piece].name) });
  }
  return ofTheDay(ASKS, day);
}

/** What he says back to her answer, a day's in turn. */
export function backOf(answer: HerDayAnswer, day: string): string {
  return ofTheDay(HER_DAY_BACKS[answer], day);
}

/** The next scene of their story he has to tell, if she has lived here long enough for one. */
export function storyDue(days: number, told: readonly string[]): StoryScene | null {
  return OUR_STORY.find((s) => s.days <= days && !told.includes(s.id)) ?? null;
}

/** A topic's three lines, today's first, with what they leave filled in. */
function brought(
  topic: HusbandTopic,
  lines: readonly string[],
  fill: Record<string, string>,
  day: string,
  urgent = false,
): Brought {
  const start = (dayNumber(day) + hashString(`cody:${topic}`)) % lines.length;
  const turned = [...lines.slice(start), ...lines.slice(0, start)];
  const keyed: Keyed[] = turned.map((l) => ({ text: fillIn(l, fill), key: hashString(l) }));
  return { topic, urgent, lines: keyed };
}

/**
 * What he says first the day after she told him how hers was (V1's P5), by what she said: a day's
 * in turn. Null on any other day.
 */
export function yesterdayOf(
  herDay: { day: string; answer: HerDayAnswer } | null | undefined,
  day: string,
): string | null {
  if (!herDay || daysBetween(herDay.day, day) !== 1) return null;
  return ofTheDay(YESTERDAY[herDay.answer], day);
}

/**
 * What only her husband brings up (decision 269), ahead of what anyone might: her look, her
 * newest piece and her pets when they're at hers, and her yard.
 */
export function husbandTopics(villager: VillagerId, scene: TalkScene, day: string): Brought[] {
  if (!isHusband(villager)) return [];
  const out: Brought[] = [];
  const worn = scene.wearing;
  if (worn.length >= 2) {
    const h = hashMixed(`codyLook:${day}`);
    const a = h % worn.length;
    const b = (a + 1 + ((h >>> 8) % (worn.length - 1))) % worn.length;
    const fill = {
      wearing: spokenName(OUTFITS[worn[a]!].name),
      with: spokenName(OUTFITS[worn[b]!].name),
    };
    out.push(brought('look', HUSBAND_TALK.look, fill, day));
  }
  const home = scene.here === 'home';
  const since = scene.placed ? daysBetween(scene.placed.day, day) : -1;
  if (home && scene.placed && since >= 0 && since <= NEWEST_FOR_DAYS) {
    const piece = spokenName(FURNITURE[scene.placed.piece].name);
    out.push(brought('newest', HUSBAND_TALK.newest, { piece }, day));
  }
  const pets = scene.pets ?? [];
  if (home && pets.length > 0) {
    out.push(brought('pets', HUSBAND_TALK.pets, { pet: ofTheDay(pets, day) }, day));
  }
  const yard = scene.yard ?? [];
  if (yard.length > 0) {
    const piece = yard[hashMixed(`codyYard:${day}`) % yard.length]!;
    out.push(brought('yard', HUSBAND_TALK.yard, { yard: spokenName(FURNITURE[piece].name) }, day));
  }
  return out;
}

/** What she answered him today, if anything: `Lately`'s, read for the day. */
export function answeredOn(
  herDay: { day: string; answer: HerDayAnswer } | null | undefined,
  day: string,
): boolean {
  return herDay?.day === day;
}
