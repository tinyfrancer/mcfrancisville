import { ITEMS } from '../data/items';
import { ITEM_VALUE, type Ware } from '../data/shop';
import {
  PARTY_SPOTS,
  SPECIAL_DAYS,
  SPECIAL_LETTERS,
  SPECIAL_LINES,
  WEDDING_YEAR,
  WELCOMES,
  type SpecialDayId,
} from '../data/specialDays';
import { MUSEUM_LETTERS } from '../data/museum';
import { MAYOR_LETTERS } from '../data/mystery';
import { spotIn, spotOf } from '../data/maps';
import {
  CODY_PUFFS,
  VILLAGERS,
  type Favour,
  type Lines,
  type Reward,
  type Stop,
} from '../data/villagers';
import { ZONES } from '../data/zones';
import type { ItemId, MapZoneId, VillagerId, ZoneId } from '../types/ids';
import { isNight } from './clock';
import { hashString } from './random';
import type { Tile } from './pathfinding';

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
  return row.likes.includes(kind) ? 'liked' : 'fine';
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
    ? "Babe, you already gave me something today. Keep that one. I'm not going anywhere."
    : "You've already given me something lovely today, {name}! Save that one for tomorrow.";
}

/** The rewards a friendship passes on its way from `before` points to `after`. */
export function rewardsBetween(villager: VillagerId, before: number, after: number): Reward[] {
  const from = heartsOf(before);
  const to = heartsOf(after);
  return VILLAGERS[villager].rewards.filter((r) => r.hearts > from && r.hearts <= to);
}

/** Which of a villager's lines they're choosing from: `close` from seven hearts, `friend` from three. */
export function tierOf(hearts: number): Exclude<keyof Lines, 'night'> {
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

/** Fills in a line's `{name}`, `{years}` and `{days}`. */
export function fill(
  text: string,
  values: { name: string; years?: number; days?: string },
): string {
  return text
    .replaceAll('{name}', values.name || 'friend')
    .replaceAll('{years}', String(values.years ?? ''))
    .replaceAll('{days}', values.days ?? '');
}

/**
 * Where a villager is on the hour `hour` of `day`: at the stop whose block it falls in, the last one
 * running on past midnight. On her birthday everyone is at the party around the well instead.
 */
export function stopOf(villager: VillagerId, hour: number, day: string): StopAt {
  if (specialDayOf(day) === 'birthday') {
    return { zone: 'town', ...spotOf('town', PARTY_SPOTS[villager]) };
  }
  const schedule = VILLAGERS[villager].schedule;
  let stop = schedule[schedule.length - 1]!;
  for (const s of schedule) if (s.from <= hour) stop = s;
  return stopAt(stop);
}

/** Where a stop in a schedule is, as a place and a tile. */
export function stopAt(stop: Stop): StopAt {
  const zone = stop.zone ?? 'town';
  return { zone, ...spotIn(zone, stop.at) };
}

/** A tile in a place outdoors, where a villager is to be found. */
export interface StopAt extends Tile {
  zone: MapZoneId;
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
}

/**
 * What a villager says when she talks to them. The first talk on a special day is its line; after
 * that, lines come round their pool in an order the day decides, with night lines among them
 * after dark.
 */
export function lineFor(villager: VillagerId, context: LineContext): string {
  const { day, talks } = context;
  const special = specialDayOf(day);
  if (special && talks === 0) return SPECIAL_LINES[special][villager];
  const lines = VILLAGERS[villager].lines;
  const pool = [...lines[tierOf(context.hearts)], ...(isNight(context.hour) ? lines.night : [])];
  const start = hashString(`talk:${villager}:${day}`);
  return pool[(start + talks) % pool.length]!;
}

/**
 * Whether Cody lets one go on this talk: now and then, never on the first talk of the day, which
 * is for saying hello properly.
 */
export function puffsOnTalk(day: string, talks: number): boolean {
  return talks > 0 && hashString(`puff:${day}:${talks}`) % 4 === 0;
}

export function puffLine(day: string, talks: number): string {
  return CODY_PUFFS[hashString(`puffLine:${day}:${talks}`) % CODY_PUFFS.length]!;
}

/** How long a puff hangs about beside Cody. */
export const PUFF_MS = 1600;

/** He also lets one go on his own, now and then, for a moment about every minute or two. */
export function puffingAt(now: number): boolean {
  const slot = Math.floor(now / PUFF_MS);
  return hashString(`puff@${slot}`) % 60 === 0;
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
 * A letter's id is `villager:hearts` for a friendship's reward, `day:year` for a special day's
 * letter, `museum:donated` for Wrapunzel's from the museum, `mayor:n` for the mayor's, or
 * `found:zone` for the one a place brings the first time she finds it. Null for an id no letter
 * has, which a save from a later build could hold.
 */
export function letterOf(id: string): Letter | null {
  const [key, n] = id.split(':');
  if (key === 'found') {
    const letter = n && n in ZONES ? ZONES[n as ZoneId].letter : undefined;
    return letter ? { ...letter } : null;
  }
  const number = Number(n);
  if (!key || !Number.isInteger(number)) return null;
  if (key === 'mayor') {
    const mayor = MAYOR_LETTERS[number];
    return mayor ? { from: 'mayor', text: mayor.letter } : null;
  }
  if (key === 'museum') {
    const museum = MUSEUM_LETTERS.find((l) => l.donated === number);
    return museum ? { from: 'wrapunzel', text: museum.letter, gift: museum.gift } : null;
  }
  if (key in VILLAGERS) {
    const villager = key as VillagerId;
    const reward = VILLAGERS[villager].rewards.find((r) => r.hearts === number);
    return reward ? { from: villager, text: reward.letter, gift: reward.gift } : null;
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

/** "2 days", "1 week", for Cody's welcome back. */
function awayFor(ms: number): string {
  const days = Math.floor(ms / 86_400_000);
  if (days < 14) return days === 1 ? '1 day' : `${days} days`;
  const weeks = Math.floor(days / 7);
  return `${weeks} weeks`;
}

/**
 * Cody's welcome back when she opens the game (decisions.md 24), by how long she's been away. On a
 * special day his welcome is that day's line instead.
 */
export function welcomeLine(awayMs: number, day: string, name: string): string {
  const special = specialDayOf(day);
  const values = { name, years: yearsMarried(day), days: awayFor(awayMs) };
  if (special) return fill(SPECIAL_LINES[special].cody, values);
  const hours = awayMs / 3_600_000;
  const key =
    hours < 0.25
      ? 'minutes'
      : hours < 4
        ? 'hours'
        : hours < 36
          ? 'day'
          : hours < 24 * 5
            ? 'days'
            : hours < 24 * 14
              ? 'week'
              : 'weeks';
  return fill(WELCOMES[key], values);
}
