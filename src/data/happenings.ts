import type { HappeningId, InteriorId, ItemId, VillagerId } from '../types/ids';
import type { SpotName } from './maps';

/**
 * Which days a happening is on: some weekdays (0 is Sunday) by the day key, the night of a full
 * moon, or about one day in `oneIn`, dealt from the day key.
 */
export type HappeningDays =
  { weekdays: readonly number[] } | { fullMoon: true } | { oneIn: number };

export interface HappeningRow {
  name: string;
  /** Beside its name on the calendar. */
  icon: string;
  /** Where, as the calendar says it: "in Maude's library". */
  place: string;
  on: HappeningDays;
  /**
   * The hours of the day key it runs, from `from` until `until`; an `until` past 24 runs on past
   * midnight (a Friday's 26 is two in the morning, still Friday's).
   */
  from: number;
  until: number;
  /** Inside a building, round whoever keeps it, or at a spot in town. */
  where: { inside: InteriorId } | { at: SpotName<'town'> };
  /** Who's there, the host first, standing at the place; the rest gather round them. */
  who: readonly VillagerId[];
  /** What each says to her the first time she talks to them there. `{name}` is her name. */
  says: Partial<Record<VillagerId, string>>;
  /** What she finds as she walks in on it, after the room's own welcome. */
  welcome?: string;
  /** Something the host hands her, once, the first time she talks to them there. */
  gift?: ItemId;
  /** Something about it she can see from across the room: sparkles over the host, for a spell. */
  sparkles?: boolean;
}

/**
 * Her neighbours' own events (phase S2), each on its days and hours, where they gather and what
 * they say. They come before visits and schedules, and after her birthday party, which nobody
 * misses. Nothing is missed by not going: they come round again (decisions.md 11).
 */
export const HAPPENINGS: Record<HappeningId, HappeningRow> = {
  bookClub: {
    name: 'Book club',
    icon: '📚',
    place: "in Maude's library",
    on: { weekdays: [3] },
    from: 19,
    until: 22,
    where: { inside: 'library' },
    who: ['maude', 'agatha'],
    says: {
      maude:
        "Book club! This week's is a mystery. Agatha solved it on page four, so we're discussing the biscuits.",
      agatha:
        "Don't tell Maude, {name}, but I come for the gossip. And the book. Mostly the gossip.",
    },
    welcome: "It's book club night. Two members, one of them see-through, and a plate of biscuits.",
  },
  midnightBake: {
    name: 'The midnight bake',
    icon: '🍪',
    place: 'at Crumbs & Curios',
    on: { weekdays: [5] },
    from: 22,
    until: 26,
    where: { inside: 'crumbs' },
    who: ['wrapunzel', 'rufus'],
    says: {
      wrapunzel:
        "The midnight bake! Everything tastes better at midnight, {name}. Have a cookie while they're warm.",
      rufus: "I'm on broken-cookie duty! It's the most important job. Wrapunzel said so!",
    },
    welcome: 'The ovens are on, it smells of chocolate, and it is very nearly midnight.',
    gift: 'batWingCookie',
  },
  spellGoneWrong: {
    name: 'A spell gone mildly wrong',
    icon: '✨',
    place: 'by the well',
    on: { oneIn: 5 },
    from: 14,
    until: 17,
    where: { at: 'byTheWell' },
    who: ['agatha', 'barty'],
    says: {
      agatha:
        "Nobody panic. I was aiming for 'sparkly', and the well is now 'singing'. It only knows sea shanties.",
      barty: "The well's been singing all afternoon. I've learned the chorus. Yo ho, and so forth.",
    },
    sparkles: true,
  },
  moonHowl: {
    name: 'Howling at the full moon',
    icon: '🐺',
    place: 'up at the lookout',
    on: { fullMoon: true },
    from: 21,
    until: 24,
    where: { at: 'lookout' },
    who: ['rufus'],
    says: {
      rufus:
        "AWOOOOO! Full moon, {name}! Howl with me! You don't have to. You totally can, though.",
    },
  },
  seedSwap: {
    name: 'The Sunday seed swap',
    icon: '🌱',
    place: 'at the farm gate',
    on: { weekdays: [0] },
    from: 8,
    until: 11,
    where: { at: 'farmGate' },
    who: ['barty'],
    says: {
      barty:
        "Sunday seed swap! Take a packet, leave a packet. Or just take one, {name}. I've plenty.",
    },
    gift: 'snapdragonSeed',
  },
  movieNight: {
    name: 'Movie night',
    icon: '🎬',
    place: "at Cody's manor",
    on: { weekdays: [6] },
    from: 20,
    until: 23,
    where: { inside: 'codyManor' },
    who: ['cody', 'rufus', 'wrapunzel'],
    says: {
      cody: "Movie night, babe. It's a scary one. Rufus has been behind the settee since the opening credits.",
      rufus: "I'm not scared! I'm just watching from back here. It's a better angle!",
      wrapunzel:
        "I brought popcorn. Cody says it's 'a lot of popcorn'. There's no such thing, dear.",
    },
    welcome: "It's movie night at Cody's. The candles are low and somebody is hiding.",
  },
};

export const HAPPENING_IDS = Object.keys(HAPPENINGS) as HappeningId[];
