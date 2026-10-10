import { CRITTERS, isCritter } from '../data/critters';
import { CROPS } from '../data/crops';
import { FOSSILS } from '../data/fossils';
import { FURNITURE } from '../data/furniture';
import { ITEMS } from '../data/items';
import { COSTUME_PIECES, type MemoryTopic } from '../data/memoryTalk';
import { OUTFITS } from '../data/outfits';
import type { VoiceTopic } from '../data/smallTalk';
import type { CritterId, FossilId, VillagerId } from '../types/ids';
import { daysBetween } from './calendar';
import type { TalkScene } from './dialogue';
import { hashMixed } from './random';
import { answerComesUp } from './voice';

/*
 * What her neighbours remember of her, and how they say it (V1's P1, decision 300): the facts in
 * a `TalkScene` turned into the topics of `data/memoryTalk.ts` and the words that fill them, and
 * how a day's first line is chosen so a week of talks never opens the same way twice.
 */

/** How close a friendship is, as a neighbour would notice it: their line pools, and ten hearts. */
export type Band = 'hello' | 'friend' | 'close' | 'best';

/** The band a number of hearts is in: `friend` from three, `close` from seven, `best` at ten. */
export function bandOf(hearts: number): Band {
  if (hearts >= 10) return 'best';
  return hearts >= 7 ? 'close' : hearts >= 3 ? 'friend' : 'hello';
}

/**
 * The band a friendship has reached since they last spoke to her, if any: null for one that
 * never spoke (a save from before they remembered) or that hasn't moved on.
 */
export function bandReached(spoke: number | undefined, hearts: number): Band | null {
  if (spoke === undefined) return null;
  const now = bandOf(hearts);
  return now !== bandOf(spoke) ? now : null;
}

/** First words that are names, kept capitalised when a name is said mid-sentence. */
const PROPER =
  /^(?:Christmas|Hercules|Mary|Ghouly|Lady|Fleetwood|Scream|Bone Jovi|Harry|Boonlight|Chocolate Banana|Tigers|Walk|Special|Crumbs|Countessa|Patchwork|Lupa|Marina|Duckworth|Great-Aunt|Cody|Agatha|Maude|Rufus|Wrapunzel|Barty|Ollie|Nessa|Gourdon|Hazel|Boothoven|Scarah|Dolly|Halloween|Valentine)\b/;

/**
 * A thing's name as it's said mid-sentence: "Moonbeam sandals" as "moonbeam sandals", but
 * "Mary Janes", "LOVE bracelet" and "Christmas rose" as they are. "Our Halloween photo" is
 * "Halloween photo", since it's said after "your".
 */
export function spokenName(name: string): string {
  const own = name.replace(/^Our /, '');
  const first = own.split(/[\s,]/)[0] ?? '';
  if (PROPER.test(own) || /[A-Z]/.test(first.slice(1))) return own;
  return own.charAt(0).toLowerCase() + own.slice(1);
}

/** A thing as it's spoken of with its "a": "a candle moth", "an ammonite", "a Hercules beetle". */
export function aThing(name: string): string {
  const word = spokenName(name);
  return `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`;
}

const NUMBERS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const MONTHS = [...NUMBERS, 'ten', 'eleven', 'twelve'];

/** How long ago she gave a gift, said after it: "yesterday", up to a fortnight; null past that. */
export function agoOf(days: number): string | null {
  if (days < 1 || days > 14) return null;
  if (days === 1) return 'yesterday';
  if (days <= 3) return 'the other day';
  if (days <= 6) return 'a few days ago';
  return days <= 9 ? 'a week ago' : 'a while back';
}

/** It's three days since they talked, at least, for them to say so: "three days", "a whole week". */
export const AWAY_DAYS = 3;

/** How long since they last talked, as in "it's been {away}": null under three days. */
export function awayOf(days: number): string | null {
  if (days < AWAY_DAYS) return null;
  if (days < 7) return `${NUMBERS[days]} days`;
  if (days < 14) return 'a whole week';
  return days < 30 ? 'weeks' : 'ages';
}

/** She's been in town three days at least before it's worth saying how long. */
export const HERE_DAYS = 3;

/**
 * How long she has lived in town, by the days she has come (`Visits`), as in "you've been here
 * {here}": "a few days", "a week", "two months", "a year". Null before her third day.
 */
export function hereOf(days: number): string | null {
  if (days < HERE_DAYS) return null;
  if (days < 7) return 'a few days';
  if (days < 14) return 'a week';
  if (days < 28) return 'a couple of weeks';
  if (days < 56) return 'a month';
  if (days < 365) return `${MONTHS[Math.min(12, Math.floor(days / 28))]} months`;
  return days < 730 ? 'a year' : 'years';
}

/** A newest piece is new for three days after she puts it out. */
export const NEW_FOR_DAYS = 3;

/** A thing for the museum as it's spoken of, with its "a". */
function donatedName(id: CritterId | FossilId): string {
  return aThing(isCritter(id) ? CRITTERS[id].name : FOSSILS[id].name);
}

/**
 * What she has on to talk about today: a costume piece if she wears one, or else one of the
 * pieces she has on, each day another.
 */
function wornTopic(
  villager: VillagerId,
  scene: TalkScene,
  day: string,
): { topic: MemoryTopic; fill: Record<string, string> } | null {
  const costume = scene.wearing.filter((id) => COSTUME_PIECES.has(id));
  const from = costume.length > 0 ? costume : scene.wearing;
  if (from.length === 0) return null;
  const piece = from[hashMixed(`wearing:${villager}:${day}`) % from.length]!;
  const topic = costume.length > 0 ? 'costume' : 'outfit';
  return { topic, fill: { wearing: spokenName(OUTFITS[piece].name) } };
}

/**
 * The topics a neighbour remembers to bring up now, each with what its lines leave to fill: in no
 * order (`TOPICS` orders them).
 */
export function memoryTopics(
  villager: VillagerId,
  scene: TalkScene,
  day: string,
): { topic: MemoryTopic | VoiceTopic; fill: Record<string, string> }[] {
  const fits: { topic: MemoryTopic | VoiceTopic; fill: Record<string, string> }[] = [];
  if (scene.reached) fits.push({ topic: 'band', fill: {} });
  const away = scene.talked ? awayOf(daysBetween(scene.talked, day)) : null;
  // A best friend misses her (V1's P2).
  if (away) fits.push({ topic: scene.band === 'best' ? 'missed' : 'away', fill: { away } });
  // What she answered when they asked, now and then (V1's P2).
  if (scene.answer && answerComesUp(villager, day)) {
    fits.push({ topic: 'answer', fill: { answer: scene.answer } });
  }
  const ago = scene.gave ? agoOf(daysBetween(scene.gave.day, day)) : null;
  if (scene.gave && ago) {
    fits.push({ topic: 'gift', fill: { gift: spokenName(ITEMS[scene.gave.item].name), ago } });
  }
  if (scene.harvested?.day === day) {
    const item = CROPS[scene.harvested.crop].harvest.item;
    fits.push({ topic: 'harvest', fill: { harvest: spokenName(ITEMS[item].name) } });
  }
  if (scene.donated?.day === day) {
    fits.push({ topic: 'donated', fill: { donated: donatedName(scene.donated.thing) } });
  }
  const since = scene.placed ? daysBetween(scene.placed.day, day) : -1;
  if (scene.placed && since >= 0 && since <= NEW_FOR_DAYS) {
    fits.push({ topic: 'placed', fill: { piece: spokenName(FURNITURE[scene.placed.piece].name) } });
  }
  const worn = wornTopic(villager, scene, day);
  if (worn) fits.push(worn);
  if (scene.wears) {
    fits.push({ topic: 'bracelet', fill: { bracelet: spokenName(ITEMS[scene.wears].name) } });
  }
  const here = hereOf(scene.visits);
  if (here) fits.push({ topic: 'here', fill: { here } });
  return fits;
}

/** What a line is remembered by when it opens a day: its words before anything is filled in. */
export type LineKey = number;

/** A line a neighbour could say, and the key it's remembered by. */
export interface Keyed {
  text: string;
  key: LineKey;
}

/** How many of a neighbour's opening lines they remember, so none comes round again in a week. */
export const OPENERS_KEPT = 7;

/** A topic's lines that fit now, in the day's order, and whether it leads a day's first talk. */
export interface Brought {
  topic: string;
  /** A band just reached, or a long time away: these lead the day's first talk. */
  urgent: boolean;
  lines: readonly Keyed[];
}

/**
 * What a neighbour opens the day's first talk with (V1's P1): something that can't wait (a band
 * just reached, a long time away), and otherwise a topic or one of their own lines (`own`, which
 * counts twice) in an order the day deals, so the window's line no longer leads every morning.
 * Whichever it is, it's the first of its lines they haven't opened with lately (`opened`, the
 * last `OPENERS_KEPT`), so a week of first talks never says the same thing twice.
 */
export function openerOf(
  villager: VillagerId,
  day: string,
  brought: readonly Brought[],
  own: readonly Keyed[],
  opened: readonly LineKey[],
): Keyed & { topic: string | null } {
  const recent = new Set(opened);
  const unheard = (lines: readonly Keyed[]) => lines.find((l) => !recent.has(l.key));
  for (const b of brought.filter((b) => b.urgent)) {
    const line = unheard(b.lines);
    if (line) return { ...line, topic: b.topic };
  }
  const groups = [
    ...brought.map((b) => ({ name: b.topic, topic: b.topic as string | null, lines: b.lines })),
    { name: 'own', topic: null, lines: own },
    { name: 'own again', topic: null, lines: own },
  ];
  const order = (name: string) => hashMixed(`open:${villager}:${day}:${name}`);
  groups.sort((a, b) => order(a.name) - order(b.name));
  for (const group of groups) {
    const line = unheard(group.lines);
    if (line) return { ...line, topic: group.topic };
  }
  return { ...own[0]!, topic: null };
}
