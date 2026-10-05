import type { FurnitureId, SurfacePiece, TrinketPiece } from '../types/ids';
import type { FurnitureRow } from './furniture';

/*
 * Things on tables (0.3's H3). A surface is a piece one tile deep with a flat top, where a small
 * piece may stand on each of its tiles; a small piece goes on a surface or on the floor, and rides
 * along when its surface is moved.
 */

/**
 * Each surface, and how high its top is: the pixels from the front edge of its footprint up to
 * the row a small piece's bottom stands on.
 */
export const SURFACES: Partial<Record<FurnitureId, number>> = {
  sideTable: 20,
  teaTable: 22,
  dresser: 35,
  kitchenCounter: 30,
  lowShelf: 28,
  curiosityCabinet: 56,
  // Out in her yard (0.3's H5).
  picnicTable: 21,
  // The furniture sets (0.3's S3).
  cosyCounter: 30,
  vanity: 26,
  nightstand: 26,
  libraryDesk: 32,
};

/**
 * The pieces small enough for a table: lamps, vases, jars and domes, cakes and teapots, little
 * plants and curios, and the new trinkets. Each is one tile, and goes on the floor as well.
 */
export const SMALL: ReadonlySet<FurnitureId> = new Set<FurnitureId>([
  // Lamps and lanterns.
  'lunaMothLamp',
  'moonflowerLamp',
  'lilyLantern',
  'jackOLantern',
  'catLantern',
  // Vases, jars and domes (0.3's H2 among them).
  'budVase',
  'roseVase',
  'moonBouquet',
  'beadJar',
  'bellJar',
  'terrarium',
  'twoHeadedDuck',
  'blueRoseDome',
  'mothDome',
  'batDome',
  'frogDome',
  'orbDome',
  'beetleDome',
  'fishDome',
  'glowwormDome',
  // Cakes and the teapot.
  'coffinCake',
  'birthdayCake',
  'cupcakeTower',
  'mummyTeapot',
  // Little plants.
  'succulents',
  'seedlingTray',
  'venusFlytrap',
  'skullPlanter',
  // Curios.
  'ghostStories',
  'crystalBall',
  'smoothStones',
  'orrery',
  'moonGlobe',
  'metronome',
  'carvedOwl',
  'stampAlbum',
  'foreverOrbs',
  'littleGargoyle',
  'recordPlayer',
  'tealMixer',
  // The trinkets, made for tables.
  'skullMug',
  'spellbooks',
  'dripCandles',
  'toadstoolLamp',
  'potionBottles',
  'snowGlobe',
  'hourglass',
  'candyPail',
  'luckyCat',
  'ghostVase',
  'amethyst',
  'fireflyJar',
  // Out in her yard too (0.3's H5).
  'yardLantern',
  'flowerPots',
  // The furniture sets' lamps, kettle, jar, globe and seeing stone (0.3's S3).
  'copperKettle',
  'ghostCookieJar',
  'tasselLamp',
  'brassGlobe',
  'bankersLamp',
  'seeingStone',
]);

export function isSurface(id: FurnitureId): boolean {
  return SURFACES[id] !== undefined;
}

export function isSmall(id: FurnitureId): boolean {
  return SMALL.has(id);
}

/** How high a surface's top is, in pixels above the front of its footprint; 0 for the floor. */
export function surfaceTop(id: FurnitureId): number {
  return SURFACES[id] ?? 0;
}

/** The new tables, the dresser, the counter and the low shelf. */
const SURFACE_PIECES: Record<SurfacePiece, FurnitureRow> = {
  sideTable: {
    name: 'Bat-leg side table',
    description:
      'A little round table on three curly legs, with a bat tucked under its top. Just the right size for a lamp, or a mug.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The bat under the table winks at you. Probably.',
    price: 380,
  },
  teaTable: {
    name: 'Lace tea table',
    description:
      'A long table under a plum cloth with a lace edge, for two things side by side. Tea for two, or a cake and its admirer.',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'You smooth the tablecloth. Lovely. Very proper.',
    price: 560,
  },
  dresser: {
    name: 'Moon dresser',
    description:
      'A chest of drawers with a little moon on every knob, and a top just begging for knick-knacks.',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'You open a drawer. Socks. All the socks. Every sock you have ever owned.',
    price: 620,
  },
  kitchenCounter: {
    name: 'Kitchen counter',
    description: 'A cupboard with a chequered tile top, for a teapot, a mixer, or a cake cooling.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The counter is spotless. You feel very grown up.',
    price: 420,
  },
  lowShelf: {
    name: 'Low bookshelf',
    description:
      'A long, low shelf of well-loved books, with room on top for whatever you like best.',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'You run a finger along the spines. So many favourites.',
    price: 520,
  },
};

/** The trinkets: small things made for tables, mantels and the tops of shelves. */
const TRINKETS: Record<TrinketPiece, FurnitureRow> = {
  skullMug: {
    name: 'Skull mug',
    description: 'A grinning skull of a mug, for hot cocoa. It has a very good smile.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'Still warm. Somebody made cocoa.',
    price: 240,
  },
  spellbooks: {
    name: 'Stack of spellbooks',
    description: 'Three spellbooks, stacked just so. Mostly spells for tidying, and one for cake.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The top book falls open at a spell for perfect toast. Handy.',
    price: 280,
  },
  dripCandles: {
    name: 'Drippy candles',
    description: 'Three candles of three heights, dripping wax in the coziest way.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The candles flicker hello.',
    price: 260,
  },
  toadstoolLamp: {
    name: 'Toadstool lamp',
    description: 'A red-capped toadstool with a soft glow under its cap. A woodland nightlight.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You tap the cap. The lamp glows a little brighter, pleased.',
    price: 340,
  },
  potionBottles: {
    name: 'Potion bottles',
    description:
      'Three little bottles of bubbling potion. Labelled, helpfully: LOVE, LUCK, SNACKS.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The snacks potion smells of popcorn.',
    price: 300,
  },
  snowGlobe: {
    name: 'Haunted snow globe',
    description:
      'A tiny haunted house in a globe of snow. Shake it and a ghost waves from the window.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You give it a shake. The little ghost waves. You wave back.',
    price: 320,
  },
  hourglass: {
    name: 'Hourglass',
    description: 'An hourglass of purple sand that takes as long as it likes. No rush.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You turn it over. The sand takes its time. So can you.',
    price: 280,
  },
  candyPail: {
    name: 'Pumpkin pail',
    description: 'A trick-or-treat pail shaped like a pumpkin, full to the brim with sweets.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You take just one sweet. Then just one more.',
    price: 260,
  },
  luckyCat: {
    name: 'Waving black cat',
    description: 'A little black cat with one paw up, waving good luck at everyone who comes in.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The cat waves. You feel luckier already.',
    price: 300,
  },
  ghostVase: {
    name: 'Ghost vase',
    description: 'A little ghost-shaped vase with a sprig of lavender. It is very shy about it.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The lavender smells lovely. The ghost blushes.',
    price: 240,
  },
  amethyst: {
    name: 'Amethyst geode',
    description:
      'A geode cracked open to show its purple crystals. A little bit of sparkle for a shelf.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The crystals catch the light. Ooh.',
    price: 360,
  },
  fireflyJar: {
    name: 'Jar of fireflies',
    description:
      'A jar of fireflies, glowing softly. They visit for the evening and come and go as they please.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The fireflies blink at you, slow and friendly.',
    price: 340,
  },
};

/** Every new piece of 0.3's H3, spread into `FURNITURE`. */
export const TABLETOP_FURNITURE: Record<SurfacePiece | TrinketPiece, FurnitureRow> = {
  ...SURFACE_PIECES,
  ...TRINKETS,
};

/** What Cobweb Corner's shelf of little things deals from: a surface, and trinkets. */
export const SURFACE_WARES = Object.keys(SURFACE_PIECES) as SurfacePiece[];
export const TRINKET_WARES = Object.keys(TRINKETS) as TrinketPiece[];
