import type { ItemId, VillagerId, ZoneId } from '../types/ids';
import { LANTERN_SHORE, TOWN, WHISPERWOOD, type MapSource } from './maps';
import type { Ware } from './shop';

/**
 * What opens a place (decisions.md 91). Once one holds, the place stays open for good, whatever
 * happens after (decision 11): skates given away don't freeze the creek over again.
 */
export type Unlock =
  /** Open from the first day. */
  | { open: true }
  /** Once she has one of these in her bag. */
  | { has: ItemId }
  /** Once a friendship reaches so many hearts. */
  | { hearts: number; with: VillagerId }
  /** Once she has been somewhere. */
  | { found: ZoneId }
  /** Once she has caught so many kinds of critter. */
  | { caught: number }
  /** Once every one of these holds. */
  | { all: readonly Unlock[] };

/** A letter a neighbour posts the first time she finds a place. */
export interface FoundLetter {
  from: VillagerId;
  text: string;
  gift?: Ware;
}

export interface ZoneRow {
  name: string;
  /** A line about it on the world map. */
  blurb: string;
  /** Its pin on the world map. */
  icon: string;
  /** Its map, for a place outdoors. Her home is her room, shaped in `data/home.ts`. */
  map?: MapSource;
  unlock: Unlock;
  /** What she's told at a way in while it's still shut: a hint at what opens it. */
  shut?: string;
  /** What she's told the moment it opens. */
  opened?: string;
  /**
   * Where it sits on the world map, in percent of the map's width and height. A place with no spot
   * (her home, which is in town) isn't on it.
   */
  onMap?: { x: number; y: number };
  /** A letter the first time she finds it, id `found:<zone>`. */
  letter?: FoundLetter;
}

/**
 * Every place she can be (decisions.md 78). Whisperwood and Lantern Shore are first drafts, there
 * to be walked between; phase I fills them in, and adds the castle on the hill.
 */
export const ZONES: Record<ZoneId, ZoneRow> = {
  town: {
    name: 'McFrancisVille',
    blurb: 'Home sweet haunted home: the square, the shops, and Hosta La Vista Farm.',
    icon: '🏘️',
    map: TOWN,
    unlock: { open: true },
    onMap: { x: 34, y: 42 },
  },
  home: {
    name: 'Home',
    blurb: 'Her house, with the bat on the door.',
    icon: '🏠',
    unlock: { open: true },
  },
  whisperwood: {
    name: 'Whisperwood',
    blurb: 'Old trees that murmur to each other. Nobody knows what about.',
    icon: '🌲',
    map: WHISPERWOOD,
    unlock: { open: true },
    onMap: { x: 72, y: 30 },
    letter: {
      from: 'cody',
      text:
        "Babe! You found Whisperwood! Past the trees there's a creek that's frozen all year " +
        'round, and past that, Lantern Shore. I found these at the back of the closet. Remember ' +
        "our first date? Ice skating! Go have a spin, for old times' sake. Love you, Cody",
      gift: { item: 'iceSkates' },
    },
  },
  lanternShore: {
    name: 'Lantern Shore',
    blurb: 'A still lake with a pier, and lanterns bobbing on the water after dark.',
    icon: '🏮',
    map: LANTERN_SHORE,
    unlock: { has: 'iceSkates' },
    shut: 'The creek here is frozen solid, and slippery as anything. A pair of skates would do it!',
    opened: 'With your skates on, the frozen creek is no trouble at all. Lantern Shore awaits!',
    onMap: { x: 76, y: 76 },
  },
};

export const ZONE_IDS = Object.keys(ZONES) as ZoneId[];
