import { CRITTERS } from '../data/critters';
import { HAPPENINGS } from '../data/happenings';
import { ITEMS } from '../data/items';
import { HAPPENING_CALLED, SMALL_TALK, TOPICS, type Topic } from '../data/smallTalk';
import { SPECIAL_DAYS } from '../data/specialDays';
import { isTool, type Held } from '../data/tools';
import type { Weather } from '../data/weather';
import type {
  BraceletId,
  CritterId,
  CropId,
  FossilId,
  FurnitureId,
  HappeningId,
  ItemId,
  OutfitId,
  VillagerId,
} from '../types/ids';
import { daysBetween } from './calendar';
import { windowAtHour } from './clock';
import { happeningsOn, hourOfNight, venueOf } from './happenings';
import { hashString } from './random';
import { aThing, memoryTopics, type Band, type Brought, type Keyed } from './remembering';

/**
 * What's going on round her as she talks to someone (0.2's D2), and what she has done and worn
 * lately (V1's P1), for what they bring up. The world fills it in at the talk; a test can make one
 * up. What she caught today isn't saved, and only means a line or two fewer after a reload; what
 * she picked, gave the museum and put out is kept by `Lately`.
 */
export interface Around {
  weather: Weather;
  storm: boolean;
  /** What's in her hand, from the quick bar. */
  holding: Held;
  /** The last critter she caught today, if any. */
  caught: CritterId | null;
  /** The pet out walking with her, by the name she has given it. */
  pet: string | null;
  /** The pieces she has on. */
  wearing: readonly OutfitId[];
  /** The last piece she put out at home or in her yard, and the day. */
  placed: { piece: FurnitureId; day: string } | null;
  /** The last crop she picked, and the day. */
  harvested: { crop: CropId; day: string } | null;
  /** The last thing she gave the museum, and the day. */
  donated: { thing: CritterId | FossilId; day: string } | null;
  /** How many days she has come to town (`Visits`): how long she has lived here. */
  visits: number;
}

/** What's between her and the neighbour she's talking to (V1's P1), from their friendship. */
export interface Between {
  /** The last thing she gave them, and the day. */
  gave: { item: ItemId; day: string } | null;
  /** The day she last talked to them before today, if ever. */
  talked: string | null;
  /** A band of friendship reached since they last spoke to her. */
  reached: Band | null;
  /** The bracelet of hers they wear. */
  wears: BraceletId | null;
  /** How close they are now (V1's P2): best friends miss her, and ask her along. */
  band: Band;
  /** What she answered when they asked her something, as they'd say it (V1's P2). */
  answer: string | null;
}

export type TalkScene = Around & Between;

/** Nothing between her and a neighbour: a first meeting, as far as their memory goes. */
export const STRANGERS: Between = {
  gave: null,
  talked: null,
  reached: null,
  wears: null,
  band: 'hello',
  answer: null,
};

/** A critter as it's spoken of, with its "a": "a candle moth", "an axolotl", "a Hercules beetle". */
export function aCritter(id: CritterId): string {
  return aThing(CRITTERS[id].name);
}

/**
 * A happening of theirs still to come today, if any: one they're part of that hasn't begun. On
 * her birthday the whole town is at her party instead.
 */
export function comingUp(villager: VillagerId, day: string, hour: number): HappeningId | null {
  if (day.slice(5) === SPECIAL_DAYS.birthday) return null;
  const h = hourOfNight(hour);
  return (
    happeningsOn(day).find((id) => {
      const row = HAPPENINGS[id];
      return row.who.includes(villager) && h < row.from;
    }) ?? null
  );
}

/** The topics of what's round her that fit now, with what each line leaves to fill. */
function aroundNow(
  villager: VillagerId,
  scene: TalkScene,
  day: string,
  hour: number,
): { topic: Topic; fill: Record<string, string> }[] {
  const fits: { topic: Topic; fill: Record<string, string> }[] = [];
  const held = scene.holding;
  if (scene.weather === 'rain') fits.push({ topic: scene.storm ? 'storm' : 'rain', fill: {} });
  if (scene.weather === 'fog') fits.push({ topic: 'fog', fill: {} });
  const coming = comingUp(villager, day, hour);
  if (coming) {
    const fill = { happening: HAPPENING_CALLED[coming], place: venueOf(coming).place };
    // A best friend asks her along (V1's P2).
    fits.push({ topic: scene.band === 'best' ? 'invite' : 'happening', fill });
  }
  if (scene.caught) fits.push({ topic: 'caught', fill: { catch: aCritter(scene.caught) } });
  if (scene.pet) fits.push({ topic: 'pet', fill: { pet: scene.pet } });
  if (held === 'net' || held === 'can' || held === 'rod') fits.push({ topic: held, fill: {} });
  if (!isTool(held) && ITEMS[held].kind === 'seed') fits.push({ topic: 'seed', fill: {} });
  fits.push({ topic: windowAtHour(hour), fill: {} });
  return fits;
}

const URGENT: ReadonlySet<Topic> = new Set<Topic>(['band', 'away', 'missed']);

/** Days since 1 January 2000, so a topic's lines come round one a day. */
function dayNumber(day: string): number {
  return daysBetween('2000-01-01', day);
}

/** A line with what it leaves filled in, and its key: its words as written. */
function filled(template: string, fill: Record<string, string>): Keyed {
  const text = Object.entries(fill).reduce(
    (line, [key, value]) => line.replaceAll(`{${key}}`, value),
    template,
  );
  return { text, key: hashString(template) };
}

/**
 * What a neighbour could bring up now, in the order they would (`TOPICS`): a band just reached
 * and a long time away first, then the sky, what's on, what she has done and wears and is doing,
 * and her time here and her day last. Each topic's lines are in its words with all but her name
 * filled in, today's first: they come round one a day, so a topic isn't said the same way two
 * days running.
 */
export function topicsNow(
  villager: VillagerId,
  scene: TalkScene,
  day: string,
  hour: number,
): Brought[] {
  const fits = [...aroundNow(villager, scene, day, hour), ...memoryTopics(villager, scene, day)];
  return TOPICS.flatMap((topic) => {
    const fit = fits.find((f) => f.topic === topic);
    if (!fit) return [];
    const lines = SMALL_TALK[topic][villager];
    const start = (dayNumber(day) + hashString(`${villager}:${topic}`)) % lines.length;
    const turned = [...lines.slice(start), ...lines.slice(0, start)];
    return [{ topic, urgent: URGENT.has(topic), lines: turned.map((l) => filled(l, fit.fill)) }];
  });
}

/** What a neighbour could bring up now, a line a topic (today's), in the order they would. */
export function smallTalk(
  villager: VillagerId,
  scene: TalkScene,
  day: string,
  hour: number,
): string[] {
  return topicsNow(villager, scene, day, hour).map((b) => b.lines[0]!.text);
}
