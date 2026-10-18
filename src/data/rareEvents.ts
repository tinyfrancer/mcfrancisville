import type { CritterId, ItemId, MapZoneId, RareKeepsakeId, VillagerId } from '../types/ids';
import type { Span } from './calendar';
import type { Glyph } from './glyphs';
import type { ItemRow } from './items';
import type { Tile } from './maps';

/*
 * Rare events (V1's R3, `docs/v1_analysis.md` finding 3's "Surprises are thin"): now and then,
 * about one day in nine, something that isn't on any calendar. Dealt from the day key in
 * `systems/rareEvents.ts`, never two at once and never on a holiday or one of her days; she's told
 * by a toast the first time she's out that day and by a line in Today, and the first time each comes
 * a keepsake follows in the mail. Nothing is locked or missed by not being there (decision 271):
 * they come round again.
 */

export type RareEventId =
  'meteorShower' | 'wanderingStall' | 'stranger' | 'snowDay' | 'lostCritter';

export interface RareEventRow {
  name: string;
  glyph: Glyph;
  /** The toast the first time she's out that day. */
  heralds: string;
  /** What Today says under its line. */
  small: string;
  /** The keepsake that comes in the mail the first time it does, and the letter it comes with. */
  keepsake: RareKeepsakeId;
  letter: { from: VillagerId; text: string };
  /** The months it can come in (1 is January); any month if none are said. */
  months?: readonly number[];
  /** Only on a clear day: a meteor shower wants a clear night. */
  clear?: true;
  /** It stays a week, Monday to Sunday: the wandering stall. */
  week?: true;
}

export const RARE_EVENTS: Record<RareEventId, RareEventRow> = {
  meteorShower: {
    name: 'A meteor shower',
    glyph: 'star',
    heralds:
      "Hazel's put a note on every door: a meteor shower tonight! Look up after eight, anywhere outdoors.",
    small: 'Shooting stars after eight tonight, anywhere outdoors. Make a wish!',
    keepsake: 'starShard',
    letter: {
      from: 'hazel',
      text:
        "{name}!\n\nA meteor shower tonight! The first I've seen from here in years. I found this " +
        "on the lookout last time one came: a little piece of a falling star. It's still warm. " +
        'Well. I like to think so.\n\nLook up after eight!\n\nHazel',
    },
    clear: true,
  },
  wanderingStall: {
    name: 'The wandering stall',
    glyph: 'parcel',
    heralds:
      'The wandering stall is in town this week! It stands in the field by the bakery, piled with curios from far away.',
    small: 'In the field by the bakery all week, with a shelf of curios from far away.',
    keepsake: 'stallPennant',
    letter: {
      from: 'ollie',
      text:
        '{name}!\n\nThe lady with the wandering stall gave me this for you, the very first ' +
        'customer of the week. She says it means you are always welcome, wherever her cart ' +
        "rolls. I've never delivered a pennant before! It flapped the whole way.\n\nOllie",
    },
    week: true,
  },
  stranger: {
    name: 'A wayfarer passing through',
    glyph: 'footprints',
    heralds:
      'Someone new is passing through town today: a wayfarer with a lantern and a very big pack. Go and say hello!',
    small: 'Just for today, with a lantern and a story.',
    keepsake: 'wayfarerPostcard',
    letter: {
      from: 'ollie',
      text:
        "{name}!\n\nA postcard for you, from the wayfarer! It's of somewhere I've never heard of, " +
        "and the stamp is a moth. It says: 'Thank you for the hello. Your town is the kindest " +
        "stop on my road.'\n\nOllie",
    },
  },
  snowDay: {
    name: 'A snow day',
    glyph: 'snowflake',
    heralds: "It's a snow day! Big soft flakes all day long, and everyone's out in their mittens.",
    small: 'Snow falling all day long. Everyone has the day off. Nobody had a day on.',
    keepsake: 'snowflakeCharm',
    letter: {
      from: 'cody',
      text:
        "Babe,\n\nSNOW DAY! I caught the first snowflake for you, and Agatha made it so it'd keep. " +
        "It's on a little chain now. It won't melt. I checked, very carefully, all morning.\n\n" +
        'Love you,\nCody',
    },
    months: [12, 1, 2],
  },
  lostCritter: {
    name: 'A critter gone astray',
    glyph: 'lookingGlass',
    heralds:
      "Someone's little critter has wandered off! They're asking all over town. Keep an eye out.",
    small: 'Find it, and take it home to them.',
    keepsake: 'finderRosette',
    letter: {
      from: 'maude',
      text:
        '{name},\n\nWord gets round in a town this small, and the word is that you found a lost ' +
        "critter and carried it home. The library keeps a rosette for such things. It hasn't " +
        "been given out since 1887. It's yours.\n\nWarmly,\nMaude",
    },
  },
};

export const RARE_EVENT_IDS = Object.keys(RARE_EVENTS) as RareEventId[];

/**
 * About how often: one day in `RARE_ONE_IN` a day's event, and one week in `STALL_WEEKS_IN` the
 * wandering stall all week; with the holidays and her days left out, about one day in nine.
 */
export const RARE_ONE_IN = 11;
export const STALL_WEEKS_IN = 15;

/** Where the wandering stall stands in town while it's here, by its top left (3 by 1). */
export const WANDERING_STALL_AT: Tile = { tx: 30, ty: 35 };

// ---- Who passes through: the wayfarer on a rare day, and a visitor who stays a week ----

export type PasserId = 'wayfarer' | 'moira';

export interface PasserRow {
  name: string;
  /** "a wayfarer", "Moira", for the words round them. */
  called: string;
  zone: MapZoneId;
  /** Where they may stand, one a day by the day key. */
  at: readonly Tile[];
  /** The hours of the day they're there. */
  from: number;
  until: number;
  /** Their hello, one a day. `{name}` is her name. */
  hello: readonly string[];
  /** What they say when she comes back the same day. */
  again: string;
  /** A small thing they hand her with the day's hello, one a day by the day key. */
  gifts: readonly ItemId[];
  /**
   * A visitor's days (decision 271: an arrival on a schedule, never a lock): every year from one
   * `MM-DD` until another. The wayfarer has none; they come on the stranger's rare day.
   */
  when?: Span;
  /** Said the first time she's out, the first day of a visitor's stay. */
  heralds?: string;
}

export const PASSERS: Record<PasserId, PasserRow> = {
  wayfarer: {
    name: 'The wayfarer',
    called: 'a wayfarer',
    zone: 'town',
    at: [
      { tx: 16, ty: 16 },
      { tx: 22, ty: 35 },
    ],
    from: 8,
    until: 20,
    hello: [
      'Oh, hello! Just passing through, love. I go where the road goes, and today it went here. What a lucky road.',
      "A friendly face! {name}, I've walked since the hills. Your well has the nicest echo I've met this year.",
      "Hello there. Mind the lantern, it's shy. I'm on my way somewhere I can't pronounce, but I stopped to say hello.",
      "Well met, {name}! The bats told me about this town. They said 'cosy'. Bats are never wrong.",
    ],
    again:
      "Still here, for a bit! I'll be gone by morning. I always leave before the goodbyes. They're the hard part.",
    gifts: ['moonPieMini', 'heartBead', 'ghostMallow', 'smileyBead'],
  },
  moira: {
    name: 'Moira',
    called: 'Moira',
    zone: 'lanternShore',
    at: [{ tx: 22, ty: 20 }],
    from: 9,
    until: 21,
    hello: [
      "{name}! I'm Moira, Nessa's aunt. I keep a lighthouse a long way from here, and every July I come and keep this lake company instead.",
      "Morning, {name}! Swam out to the far lanterns at dawn. The lake's warm as a bath this week. Nessa won't believe me.",
      "There you are, {name}! I've been telling the gulls about you. We don't have gulls. I've been telling the bats.",
      'A whole week of no fog horn, {name}. I keep reaching for it. Then I have a biscuit instead.',
      "Nessa lit every lantern for me last night, {name}. She thinks I didn't see her wave. I saw.",
    ],
    again: "Back again! The lake doesn't mind company. Neither do I.",
    gifts: ['ghostMallow', 'batWingCookie', 'pumpkinPudding'],
    when: { from: '07-12', until: '07-18' },
    heralds:
      "Nessa's aunt Moira has come to stay at Lantern Shore for the week! She's by the water on the east bank.",
  },
};

export const PASSER_IDS = Object.keys(PASSERS) as PasserId[];

// ---- A critter gone astray ----

/** A neighbour's own little critter, wandered off somewhere for her to find and carry home. */
export interface StrayRow {
  owner: VillagerId;
  /** What kind of critter it is, for its picture. */
  critter: CritterId;
  /** Its name, as its owner calls it. */
  name: string;
  /** Where it has wandered to. */
  zone: MapZoneId;
  /** What she reads when she finds it. */
  found: string;
  /** What its owner says when she brings it home. `{name}` is her name. */
  thanks: string;
}

export const STRAYS: readonly StrayRow[] = [
  {
    owner: 'barty',
    critter: 'pumpkinToad',
    name: 'Sir Hops',
    zone: 'whisperwood',
    found:
      "It's Sir Hops, Barty's toad! He's sitting very still, as if he meant to be here. Carry him home.",
    thanks:
      "SIR HOPS! Where have you been, you old rascal? Thank you, {name}. He likes you. You can tell, he's not blinking.",
  },
  {
    owner: 'maude',
    critter: 'velvetBat',
    name: 'Pipistrelle',
    zone: 'town',
    found:
      "It's Pipistrelle, Maude's little bat, hanging upside down and fast asleep. Carry her home, gently.",
    thanks:
      'Pipistrelle! Oh, {name}. She does wander. She once slept a week in the poetry section. Thank you, dear.',
  },
  {
    owner: 'hazel',
    critter: 'pumpkinSnail',
    name: 'Professor Slow',
    zone: 'lanternShore',
    found:
      "It's Professor Slow, Hazel's snail! He's come an awfully long way, for a snail. Carry him home.",
    thanks:
      'Professor Slow! Three days I looked. He was at the lake? {name}, that is a record. I will write it down.',
  },
  {
    owner: 'rufus',
    critter: 'lilyFrog',
    name: 'Kevin Two',
    zone: 'booAcres',
    found:
      "It's Kevin Two, Rufus's frog! He's sitting in the shade looking pleased with himself. Carry him home.",
    thanks:
      'KEVIN TWO!!! {name}, you found him! He sat on my head all morning and then he LEFT. Thank you thank you thank you!',
  },
];

/** What she's given for carrying a critter home: a little Candy, as for anything lost. */
export const STRAY_CANDY = 40;
/** And a little friendship. */
export const STRAY_POINTS = 10;

// ---- The keepsakes ----

/** Each rare event's keepsake, hers to keep, never sold (`ITEM_VALUE` 0, as the fair's prizes). */
export const RARE_KEEPSAKES: Record<RareKeepsakeId, ItemRow> = {
  starShard: {
    name: 'Star shard',
    kind: 'keepsake',
    description:
      'A little piece of a falling star, from Hazel. It glows faintly, and is warm if you believe it is.',
  },
  stallPennant: {
    name: "Wanderer's pennant",
    kind: 'keepsake',
    description:
      "A plum pennant from the wandering stall. It means you're always welcome, wherever the cart rolls.",
  },
  wayfarerPostcard: {
    name: "Wayfarer's postcard",
    kind: 'keepsake',
    description:
      'A postcard from the wayfarer, of somewhere far away. The stamp is a moth. It says thank you.',
  },
  snowflakeCharm: {
    name: 'Snowflake charm',
    kind: 'keepsake',
    description:
      "The first snowflake of your first snow day, caught by Cody and charmed by Agatha so it won't melt.",
  },
  finderRosette: {
    name: "Finder's rosette",
    kind: 'keepsake',
    description:
      "The library's rosette for carrying a lost critter home. Last given out in 1887. Now it's yours.",
  },
};

export const RARE_KEEPSAKE_VALUES: Record<RareKeepsakeId, number> = {
  starShard: 0,
  stallPennant: 0,
  wayfarerPostcard: 0,
  snowflakeCharm: 0,
  finderRosette: 0,
};
