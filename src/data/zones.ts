import type { ItemId, VillagerId, ZoneId } from '../types/ids';
import {
  CASTLE_HILL,
  FAIRGROUND,
  HIDDEN_CLEARING,
  LANTERN_SHORE,
  TOWN,
  WHISPERWOOD,
  type MapSource,
} from './maps';
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
  /**
   * A secret: the world map shows no question mark down the way to it, so it's only on the map
   * once she has found it herself.
   */
  secret?: true;
}

/**
 * Every place she can be (decisions.md 78): the town, the places beyond it (phase I), her home and
 * the insides of the town's buildings.
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
  // Named after the castles they were married at (personal_touches.md, "Places"), by their own
  // names rather than the venue's.
  castleHill: {
    name: 'Castle Mac-A-Boo',
    blurb: 'A little stone castle on the hill, with monarch butterflies on every sill.',
    icon: '🏰',
    map: CASTLE_HILL,
    unlock: { has: 'castleKey' },
    shut:
      'The gate up to the castle is locked tight. Its key was lost long ago, they say, somewhere ' +
      'deep in Whisperwood where the toadstools grow in a ring.',
    opened: 'The old key turns with a happy clunk, and the castle gate swings open!',
    onMap: { x: 30, y: 14 },
    letter: {
      from: 'cody',
      text:
        'Babe! You made it up to the castle! Look at all the monarchs, just like our wedding ' +
        'day. Best day of my life, and I got to spend it with you. Love you, Cody',
    },
  },
  hiddenClearing: {
    name: 'The hidden clearing',
    blurb: 'A ring of toadstools in the moonlight, at the end of a way nobody takes.',
    icon: '🍄',
    map: HIDDEN_CLEARING,
    unlock: { open: true },
    onMap: { x: 84, y: 12 },
    secret: true,
  },
  // Beyond the graveyard and the park (0.2's M1), behind a gate that opens once she has met
  // Boothoven: he's the one who hears the calliope playing down there at night, all by itself.
  fairground: {
    name: 'The Hollow Fairground',
    blurb: 'Stalls, string lights and a big wheel, with something on the stage most nights.',
    icon: '🎡',
    map: FAIRGROUND,
    unlock: { hearts: 1, with: 'boothoven' },
    shut:
      'The gate to the fairground is shut, and a calliope is playing somewhere beyond it. ' +
      "Boothoven hums along to it at night. Maybe he'd know how to get in?",
    opened:
      "Boothoven whistled the calliope's tune, and the fairground gate swung open to it, string " +
      'lights and all!',
    onMap: { x: 44, y: 80 },
    letter: {
      from: 'boothoven',
      text:
        'Dear {name},\n\nYou found the Hollow Fairground! I have been listening to its calliope ' +
        'from my window every night since I moved in. It plays in three-four time, and always ' +
        'a little sharp, which I find very charming.\n\nRide the big wheel for me? Ghosts get ' +
        'dizzy.\n\nYours in harmony,\nBoothoven',
    },
  },
  // Inside the town's buildings (phase H): each a room in `data/interiors.ts`, open from the start.
  cobwebCorner: {
    name: 'Cobweb Corner',
    blurb: 'Seeds, shoes, squishies and more, fresh on the shelves every morning.',
    icon: '🕸️',
    unlock: { open: true },
  },
  muse: {
    name: 'The Muse Hair Salon',
    blurb: 'Her salon: a chair, a mirror, and every colour of dye there is.',
    icon: '💇',
    unlock: { open: true },
  },
  crumbs: {
    name: 'Crumbs & Curios',
    blurb: "Wrapunzel's bakery, with her museum through the arch.",
    icon: '🧁',
    unlock: { open: true },
  },
  library: {
    name: "Maude's library",
    blurb: 'Ghost stories floor to ceiling, and a chair made for reading them.',
    icon: '📚',
    unlock: { open: true },
  },
  rufusCabin: {
    name: "Rufus's cabin",
    blurb: 'Roses in buckets, and a hearth to warm your paws.',
    icon: '🌹',
    unlock: { open: true },
  },
  agathaCottage: {
    name: "Agatha's cottage",
    blurb: 'A great cauldron that says hello.',
    icon: '🧙',
    unlock: { open: true },
  },
  bartyCottage: {
    name: "Barty's cottage",
    blurb: 'More seedlings than floor.',
    icon: '🪴',
    unlock: { open: true },
  },
  codyManor: {
    name: "Cody's manor",
    blurb: 'Velvet, candlelight and a pipe organ.',
    icon: '🦇',
    unlock: { open: true },
  },
  // The newcomers' homes (phase T): their doors open once they've moved in.
  ollieCottage: {
    name: "Ollie's cottage",
    blurb: 'Letters in neat piles, and a bicycle bell on the door.',
    icon: '✉️',
    unlock: { open: true },
  },
  nessaBoathouse: {
    name: "Nessa's boathouse",
    blurb: 'Lanterns waiting to be lit, and the kettle on.',
    icon: '🏮',
    unlock: { open: true },
  },
  gourdonPumpkin: {
    name: "Gourdon's pumpkin",
    blurb: 'Roomier inside than out, and smelling of sawdust.',
    icon: '🎃',
    unlock: { open: true },
  },
  hazelObservatory: {
    name: "Hazel's observatory",
    blurb: 'A roof that opens to the stars.',
    icon: '🔭',
    unlock: { open: true },
  },
  boothovenParlour: {
    name: "Boothoven's parlour",
    blurb: 'Sheet music everywhere, and a grand piano.',
    icon: '🎹',
    unlock: { open: true },
  },
  // The fortune teller's tent at the fairground (0.2's M1), where Agatha reads fortunes at weekends.
  fortuneTent: {
    name: 'The fortune tent',
    blurb: 'A crystal ball, a fan of cards, and Agatha at weekends, reading what the stars say.',
    icon: '🔮',
    unlock: { open: true },
  },
  // Castle Mac-A-Boo's hall (phase U, personal_touches.md "After phase I"): its doors open with a
  // second hidden key, dug up where the frozen creek bends, where they'd have skated on their first
  // date.
  castleHall: {
    name: 'The great hall',
    blurb: "Castle Mac-A-Boo's hall, set for an anniversary.",
    icon: '💍',
    unlock: { has: 'hallKey' },
    shut:
      "The castle's great doors are locked, and the lock is shaped like a heart. Wherever would " +
      'a heart-shaped key be? Somewhere you once went skating, maybe… like the bend in ' +
      "Whisperwood's frozen creek?",
    opened:
      'The little heart key is warm in your hand. Somewhere up at Castle Mac-A-Boo, a heart-shaped ' +
      'lock is waiting for it.',
    letter: {
      from: 'cody',
      text:
        'Babe,\n\nYou found the hall! I asked the castle to keep it just the way it was, for ' +
        "us. The cake, the candles, all of it.\n\nMeet me there on our anniversary? I'll be the " +
        'one humming the waltz, a little off.\n\nLove you forever,\nCody',
    },
  },
};

export const ZONE_IDS = Object.keys(ZONES) as ZoneId[];
