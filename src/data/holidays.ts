import type { ItemId, PropId, VillagerId } from '../types/ids';
import type { HolidayId } from './calendar';
import type { Tile } from './maps';
import type { Ware } from './shop';

/**
 * The holidays in town (phase U): the decorations that go up before each big holiday and come down
 * after it, what stands in the square while they're up, the sky on the night (fireworks, snow), the
 * letters that come on the day, and Easter's egg hunt. Every rule is worked out from the day key in
 * `systems/holidays.ts`, so nothing about it is saved but the eggs she has found, in `Takings`.
 */

/** A set of decorations, one per big holiday. Christmas Eve's are Christmas's, New Year's Eve's New Year's. */
export type DecorId =
  | 'newYear'
  | 'valentines'
  | 'stPatricks'
  | 'easter'
  | 'fourthOfJuly'
  | 'halloween'
  | 'thanksgiving'
  | 'christmas';

/** Something standing in the square while a set is up, solid like a stall, by its top-left tile. */
export interface DecorPiece extends Tile {
  prop: PropId;
}

export interface DecorRow {
  /** The holiday they're up for. */
  holiday: HolidayId;
  /** How many days before the holiday they go up, and how many after it they come down. */
  before: number;
  after: number;
  /** What stands in the square while they're up. */
  pieces: readonly DecorPiece[];
  /** What she's told the first time she's out in town with them up, each year. */
  up: string;
}

/**
 * Where the square's pieces stand: open ground off the paths her neighbours keep to, clear of the
 * pop-up's lots, the Moon Pie Man's spots, the snack's spots and every named spot.
 */
const SQUARE: Tile = { tx: 24, ty: 21 };
const SOUTH_OF_SQUARE: Tile = { tx: 21, ty: 26 };

/**
 * The sets, in the order of the year. When two overlap (Easter can come a few days after St
 * Patrick's), the holiday nearer the day wins, and a holiday's own day always does.
 */
export const DECOR: Record<DecorId, DecorRow> = {
  newYear: {
    holiday: 'newYear',
    before: 1,
    after: 0,
    pieces: [{ prop: 'glitterBall', ...SQUARE }],
    up: 'Gold streamers on every door, and a glitter ball in the square. Out with the old year!',
  },
  valentines: {
    holiday: 'valentines',
    before: 6,
    after: 0,
    pieces: [{ prop: 'heartArch', ...SQUARE }],
    up: "Hearts on every door, and a rose arch in the square. Valentine's Day is coming!",
  },
  stPatricks: {
    holiday: 'stPatricks',
    before: 3,
    after: 0,
    pieces: [{ prop: 'potOfGold', ...SQUARE }],
    up: "Shamrocks on the doors, and somebody's left a pot of gold in the square. Top o' the morning!",
  },
  easter: {
    holiday: 'easter',
    before: 6,
    after: 1,
    pieces: [{ prop: 'eggTree', ...SQUARE }],
    up: 'Painted eggs hung on a little tree in the square, and a basket on every door. Easter is coming!',
  },
  fourthOfJuly: {
    holiday: 'fourthOfJuly',
    before: 3,
    after: 0,
    pieces: [{ prop: 'flagPole', ...SQUARE }],
    up: 'Bunting everywhere, and a flag up in the square. The bats have been told about the fireworks.',
  },
  halloween: {
    holiday: 'halloween',
    before: 30,
    after: 0,
    pieces: [{ prop: 'pumpkinTower', ...SQUARE }],
    up: "It's October! A tower of pumpkins in the square, and bats on every door. Even spookier than usual.",
  },
  thanksgiving: {
    holiday: 'thanksgiving',
    before: 6,
    after: 0,
    pieces: [{ prop: 'harvestTable', ...SOUTH_OF_SQUARE }],
    up: 'Corn wreaths on the doors, and a long table set in the square. Thanksgiving is coming!',
  },
  christmas: {
    holiday: 'christmas',
    before: 24,
    after: 5,
    pieces: [{ prop: 'spookyTree', ...SQUARE }],
    up: "It's December! Lights on every lamp, wreaths on every door, and a tree in the square. Skelly is thrilled.",
  },
};

export const DECOR_IDS = Object.keys(DECOR) as DecorId[];

/**
 * The lamps a garland is strung between while any set is up: along the top and bottom of the
 * square, and across the avenue south of it. Each end is a lantern in the town's map.
 */
export const GARLANDS: readonly (readonly [Tile, Tile])[] = [
  [
    { tx: 14, ty: 18 },
    { tx: 25, ty: 18 },
  ],
  [
    { tx: 14, ty: 26 },
    { tx: 25, ty: 26 },
  ],
  [
    { tx: 17, ty: 31 },
    { tx: 22, ty: 31 },
  ],
];

/**
 * The sky on a holiday: fireworks over town for some hours of its day key (an hour past 24 runs on
 * past midnight, still the day's), or snow falling all day.
 */
export type Sky = { fireworks: { from: number; until: number } } | { snow: true };

export const SKIES: Partial<Record<HolidayId, Sky>> = {
  fourthOfJuly: { fireworks: { from: 21, until: 24 } },
  newYearsEve: { fireworks: { from: 23, until: 26 } },
  christmasEve: { snow: true },
  christmas: { snow: true },
};

/** A letter on a holiday, once each year, id `holiday:year`. */
export interface HolidayLetter {
  from: VillagerId | 'everyone' | 'mayor';
  letter: string;
  gift?: Ware;
}

export const HOLIDAY_LETTERS: Partial<Record<HolidayId, HolidayLetter>> = {
  newYear: {
    from: 'mayor',
    letter:
      "Happy New Year, {name}!\n\nThe mayor's office wishes you a year of full baskets, " +
      'friendly ghosts and very few puddles.\n\nWe have never met, but we have heard wonderful ' +
      "things.\n\nThe Mayor\n\nP.S. The fireworks were not the mayor's. The mayor is very sorry " +
      'about the bats.',
  },
  valentines: {
    from: 'cody',
    letter:
      "Babe,\n\nBe mine? You already are. I'm asking anyway, every year, forever.\n\nThere's a " +
      'chocolate heart in here. I only ate a little bit of it.\n\nLove you,\nCody',
    gift: { item: 'chocolateHeart' },
  },
  christmas: {
    from: 'everyone',
    letter:
      'Merry Christmas, {name}!\n\nFrom all of us in McFrancisVille. We clubbed together for a ' +
      'little tree for your house. Barty grew it, Agatha charmed the lights, Wrapunzel made the ' +
      'baubles and Cody put the skull on top (he says it is an angel).\n\nWith love, from everyone',
    gift: { furniture: 'holidayTree' },
  },
};

/**
 * What every neighbour hands her, once, with their line on the day: a treat on Halloween, which is
 * trick-or-treat whoever she talks to.
 */
export const HOLIDAY_TREATS: Partial<Record<HolidayId, ItemId>> = {
  halloween: 'candyCorn',
};

/**
 * Winter: the park pond freezes over for skating (personal_touches.md, "After phase D": their
 * first date was ice skating), from `from` to `until` (month and day), round the new year.
 */
export const FROZEN = { from: '12-15', until: '01-15' } as const;

/** Easter's egg hunt: how many eggs Barty hides in town, and where he might. */
export const EGGS_HIDDEN = 8;

/**
 * Where an egg may be hidden: open grass beside a tree, a bush, a gravestone or a bench, away from
 * the paths and every named spot. Each Easter he picks `EGGS_HIDDEN` of them by the year.
 */
export const EGG_SPOTS: readonly Tile[] = [
  { tx: 3, ty: 3 },
  { tx: 18, ty: 10 },
  { tx: 33, ty: 4 },
  { tx: 37, ty: 9 },
  { tx: 2, ty: 16 },
  { tx: 27, ty: 16 },
  { tx: 12, ty: 21 },
  { tx: 38, ty: 24 },
  { tx: 13, ty: 28 },
  { tx: 24, ty: 30 },
  { tx: 2, ty: 33 },
  { tx: 5, ty: 39 },
  { tx: 12, ty: 41 },
  { tx: 36, ty: 41 },
  { tx: 21, ty: 45 },
  { tx: 29, ty: 47 },
];

/** What each egg is, in her bag: a chocolate one. */
export const EGG_ITEM: ItemId = 'chocolateEgg';
