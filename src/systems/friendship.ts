import { ITEMS } from '../data/items';
import { BROOM_LETTER } from '../data/broom';
import { ITEM_VALUE, type Ware } from '../data/shop';
import {
  SPECIAL_DAYS,
  SPECIAL_LETTERS,
  SPECIAL_LINES,
  WEDDING_YEAR,
  type SpecialDayId,
} from '../data/specialDays';
import { MUSEUM_FORMERLY_FULL, MUSEUM_LETTERS } from '../data/museum';
import { MILESTONES } from '../data/milestones';
import { HOLIDAY_LETTERS } from '../data/holidays';
import { HOLIDAY_LINES } from '../data/holidayLines';
import type { HolidayId } from '../data/calendar';
import { MAYOR_LETTERS } from '../data/mystery';
import { CHAPTERS } from '../data/story';
import { FINALE_FESTIVAL, FINALE_LETTER } from '../data/finale';
import { finaleLetterId } from './finale';
import { VILLAGERS, type Favour, type Lines, type Reward } from '../data/villagers';
import { ZONES } from '../data/zones';
import type { ItemId, MilestoneId, VillagerId, ZoneId } from '../types/ids';
import { isNight, windowAtHour } from './clock';
import { smallTalk, type TalkScene } from './dialogue';
import { holidayLetterId, holidayOn } from './holidays';
import { hashMixed, hashString } from './random';

/** A heart is a hundred points of friendship, and ten hearts is as close as friends get. */
export const POINTS_PER_HEART = 100;
export const MAX_HEARTS = 10;

/**
 * What each kindness is worth. Talking is worth something once a day, and so is a gift; a gift is
 * never worth less than a talk, and nothing she does ever takes friendship away (decisions.md 11).
 */
export const TALK_POINTS = 10;
export const GIFT_POINTS: Record<Reaction, number> = { loved: 50, liked: 25, fine: 10 };
export const FAVOUR_POINTS = 40;

/** How a villager takes a gift. */
export type Reaction = 'loved' | 'liked' | 'fine';

export function heartsOf(points: number): number {
  return Math.min(MAX_HEARTS, Math.floor(points / POINTS_PER_HEART));
}

/** Every bracelet is loved by everyone: they're made to be given (decisions.md 53). */
export function reactionTo(villager: VillagerId, item: ItemId): Reaction {
  const row = VILLAGERS[villager];
  const kind = ITEMS[item].kind;
  if (kind === 'bracelet' || row.loves.includes(item)) return 'loved';
  // Everyone likes something she cooked for them (phase R).
  return kind === 'dish' || row.likes.includes(kind) ? 'liked' : 'fine';
}

/** What a villager says to a gift. */
export function giftLine(villager: VillagerId, item: ItemId): string {
  const row = VILLAGERS[villager];
  const special = row.says?.[item];
  if (special) return special;
  if (ITEMS[item].kind === 'bracelet' && row.bracelet) return row.bracelet;
  return row.reactions[reactionTo(villager, item)];
}

/** What a villager says to a second gift in a day: thank you, but keep it for tomorrow. */
export function declineLine(villager: VillagerId): string {
  return villager === 'cody'
    ? "Mi amor, you already gave me something today. Keep that one. I'm not going anywhere."
    : "You've already given me something lovely today, {name}! Save that one for tomorrow.";
}

/** The rewards a friendship passes on its way from `before` points to `after`. */
export function rewardsBetween(villager: VillagerId, before: number, after: number): Reward[] {
  const from = heartsOf(before);
  const to = heartsOf(after);
  return VILLAGERS[villager].rewards.filter((r) => r.hearts > from && r.hearts <= to);
}

/** Which of a villager's lines they're choosing from: `close` from seven hearts, `friend` from three. */
export function tierOf(hearts: number): Exclude<keyof Lines, 'night' | 'windows'> {
  return hearts >= 7 ? 'close' : hearts >= 3 ? 'friend' : 'hello';
}

/** The special day a day key falls on, if any. */
export function specialDayOf(day: string): SpecialDayId | null {
  const monthDay = day.slice(5);
  const ids = Object.keys(SPECIAL_DAYS) as SpecialDayId[];
  return ids.find((id) => SPECIAL_DAYS[id] === monthDay) ?? null;
}

/** How many years they've been married, on a day key: they married on 06-06-2020. */
export function yearsMarried(day: string): number {
  const year = Number(day.slice(0, 4));
  return day.slice(5) >= SPECIAL_DAYS.anniversary ? year - WEDDING_YEAR : year - WEDDING_YEAR - 1;
}

/**
 * Fills in a line's `{name}`, `{years}` and `{days}`. Her name is as she typed it, tidied of
 * stray spaces, and "friend" if she typed none; where it starts a sentence it starts with a
 * capital, however she typed it.
 */
export function fill(
  text: string,
  values: { name: string; years?: number; days?: string },
): string {
  const name = values.name.trim().replace(/\s+/g, ' ') || 'friend';
  const opening = name.charAt(0).toUpperCase() + name.slice(1);
  return text
    .replace(/(^|[.!?…]\s+|\n)\{name\}/g, (_, before: string) => before + opening)
    .replaceAll('{name}', name)
    .replaceAll('{years}', String(values.years ?? ''))
    .replaceAll('{days}', values.days ?? '');
}

/** What a thing says to her on `day`: her name, and the years they've been married. */
export function sayTo(text: string, name: string, day: string): string {
  return fill(text, { name, years: yearsMarried(day) });
}

/**
 * The favour a villager has to ask on a day, if they have one. About a third of them ask each day,
 * the same all day, and another asks tomorrow.
 */
export function favourOf(villager: VillagerId, day: string): Favour | null {
  const h = hashString(`favour:${villager}:${day}`);
  if (h % 3 !== 0) return null;
  const favours = VILLAGERS[villager].favours;
  return favours[(h >>> 8) % favours.length] ?? null;
}

/** The Candy a favour brings, a little more than what she hands over would sell for. */
export function favourCandy(favour: Favour): number {
  return 50 + 2 * ITEM_VALUE[favour.item] * favour.count;
}

export interface LineContext {
  hearts: number;
  day: string;
  hour: number;
  /** How many times she has talked to them already today. */
  talks: number;
  /** What they have said to her already today, so they don't say it again (0.2's D1). */
  said?: readonly string[];
  /** What's going on round her, for what they bring up (0.2's D2). */
  scene?: TalkScene;
}

/**
 * What a villager says first on a day that's more than a day: one of her special days, or else a
 * holiday (phase U). Null on any other day.
 */
export function dayLine(villager: VillagerId, day: string): string | null {
  const special = specialDayOf(day);
  if (special) return SPECIAL_LINES[special][villager];
  const holiday = holidayOn(day);
  return holiday ? HOLIDAY_LINES[holiday][villager] : null;
}

/**
 * What a villager could say now: their band's lines, the window's line, and the night's after dark.
 */
export function linesNow(villager: VillagerId, hearts: number, hour: number): string[] {
  const lines = VILLAGERS[villager].lines;
  return [
    ...lines[tierOf(hearts)],
    lines.windows[windowAtHour(hour)],
    ...(isNight(hour) ? lines.night : []),
  ];
}

/**
 * What a villager says when she talks to them. The first talk on a special day or a holiday is its
 * line; after that, something about what's going on round her when there's something fresh to say
 * (0.2's D2), every other talk at most, so their own lines still come; and otherwise the lines she
 * could hear now, in an order the day decides, each only once a day (0.2's D1), and only when
 * every one has been said do they come round again.
 */
export function lineFor(villager: VillagerId, context: LineContext): string {
  const { day, talks } = context;
  const first = talks === 0 ? dayLine(villager, day) : null;
  if (first) return first;
  const said = new Set(context.said ?? []);
  const topical = context.scene ? smallTalk(villager, context.scene, day, context.hour) : [];
  const last = context.said?.at(-1);
  const fresh = topical.find((line) => !said.has(line));
  if (fresh && !(last !== undefined && topical.includes(last))) return fresh;
  const order = (line: string) => hashString(`talk:${villager}:${day}:${line}`);
  const pool = linesNow(villager, context.hearts, context.hour).sort((a, b) => order(a) - order(b));
  return pool.find((line) => !said.has(line)) ?? pool[talks % pool.length]!;
}

/**
 * How often each lets one go: Cody on about one talk in four and a moment every minute or two
 * (personal_touches.md, "The neighbours"), anyone else only now and then (phase S2).
 */
const PUFF_ODDS = { talk: 4, idle: 60 };
const NOW_AND_THEN = { talk: 12, idle: 400 };

function oddsOf(villager: VillagerId) {
  return villager === 'cody' ? PUFF_ODDS : NOW_AND_THEN;
}

/**
 * Whether a neighbour lets one go on this talk: now and then, never on the first talk of the day,
 * which is for saying hello properly. Dealt from a stirred hash of the talk (phase B1), so they
 * don't come round in a pattern.
 */
export function puffsOnTalk(villager: VillagerId, day: string, talks: number): boolean {
  return talks > 0 && hashMixed(`puff:${villager}:${day}:${talks}`) % oddsOf(villager).talk === 0;
}

export function puffLine(villager: VillagerId, day: string, talks: number): string {
  const lines = VILLAGERS[villager].puffs;
  return lines[hashMixed(`puffLine:${villager}:${day}:${talks}`) % lines.length]!;
}

/** How long a puff hangs about beside them. */
export const PUFF_MS = 1600;

/** They also let one go on their own, for a moment: Cody about every minute or two. */
export function puffingAt(villager: VillagerId, now: number): boolean {
  const slot = Math.floor(now / PUFF_MS);
  return hashMixed(`puff:${villager}@${slot}`) % oddsOf(villager).idle === 0;
}

/** Who a letter can be from: a neighbour, the whole town, or the mayor nobody has met. */
export type Sender = VillagerId | 'everyone' | 'mayor';

/** A letter in her mailbox: what it says, who it's from, and what came with it. */
export interface Letter {
  from: Sender;
  text: string;
  gift?: Ware;
}

/**
 * A letter's id is `villager:hearts` for a friendship's reward, `day:year` for a special day's or
 * a holiday's letter, `villager:0` for the one a neighbour wrote before moving in (phase T), `museum:donated` for Wrapunzel's from the museum, `mayor:n` for the mayor's, `story:n` for a chapter of their October story, `shelf:id` for a shelf she finished (0.2's F2), or
 * `found:zone` for the one a place brings the first time she finds it. Null for an id no letter
 * has, which a save from a later build could hold.
 */
export function letterOf(id: string): Letter | null {
  const [key, n] = id.split(':');
  if (key === 'found') {
    const letter = n && n in ZONES ? ZONES[n as ZoneId].letter : undefined;
    return letter ? { ...letter } : null;
  }
  if (key === 'shelf') {
    const milestone = n && n in MILESTONES ? MILESTONES[n as MilestoneId] : undefined;
    return milestone
      ? { from: milestone.from, text: milestone.letter, gift: milestone.gift }
      : null;
  }
  const number = Number(n);
  if (!key || !Number.isInteger(number)) return null;
  if (key === 'broom') return number === 1 ? { from: 'agatha', ...BROOM_LETTER } : null;
  if (key === 'mayor') {
    const mayor = MAYOR_LETTERS[number];
    return mayor ? { from: 'mayor', text: mayor.letter } : null;
  }
  if (key === FINALE_FESTIVAL) {
    const { from, letter: text, gift } = FINALE_LETTER;
    return gift ? { from, text, gift } : { from, text };
  }
  if (key === 'story') {
    const chapter = CHAPTERS[number];
    return chapter ? { from: 'mayor', text: chapter.letter } : null;
  }
  if (key === 'museum') {
    const museum =
      MUSEUM_LETTERS.find((l) => l.donated === number) ??
      (MUSEUM_FORMERLY_FULL.includes(number) ? MUSEUM_LETTERS.at(-1) : undefined);
    return museum ? { from: 'wrapunzel', text: museum.letter, gift: museum.gift } : null;
  }
  if (key in VILLAGERS) {
    const villager = key as VillagerId;
    const wrote = VILLAGERS[villager].wrote;
    if (number === 0) return wrote ? { from: villager, text: wrote } : null;
    const reward = VILLAGERS[villager].rewards.find((r) => r.hearts === number);
    return reward ? { from: villager, text: reward.letter, gift: reward.gift } : null;
  }
  const holiday = HOLIDAY_LETTERS[key as HolidayId];
  if (holiday) {
    const letter: Letter = { from: holiday.from, text: holiday.letter };
    if (holiday.gift) letter.gift = holiday.gift;
    return letter;
  }
  const special = SPECIAL_LETTERS[key as SpecialDayId];
  if (!special) return null;
  const letter: Letter = { from: special.from, text: special.letter };
  if (special.gift) letter.gift = special.gift;
  return letter;
}

/** The special letter a day brings, as its id, if it brings one. */
export function specialLetterId(day: string): string | null {
  const special = specialDayOf(day);
  if (!special || !SPECIAL_LETTERS[special]) return null;
  return `${special}:${day.slice(0, 4)}`;
}

/**
 * Every letter a day brings: her special day's, a holiday's (phase U), and Cody's the morning
 * after the Halloween Festival (0.2's J4).
 */
export function lettersOn(day: string): string[] {
  return [specialLetterId(day), holidayLetterId(day), finaleLetterId(day)].filter(
    (id) => id !== null,
  );
}
