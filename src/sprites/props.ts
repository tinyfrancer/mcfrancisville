import type { PropId } from '../types/ids';
import { overlay, FARM_SIGN, FARM_SIGN_PALETTE, HOSTA, HOSTA_LEAVES } from './garden';
import { PUMPKIN } from './items';
import { FOUNTAIN, FOUNTAIN_GLOW, FOUNTAIN_PALETTE } from './park';
import {
  PEBBLES,
  ROCK,
  ROCK_PALETTE,
  ROSE_BUSH,
  ROSE_BUSH_BARE,
  ROSE_BUSH_PALETTE,
  TREE,
  TREE_FORMS,
  TREE_LEAVES,
  WILLOW,
  WILLOW_PALETTE,
} from './nature';
import { PALETTE as C } from './palette';
import type { Palette, SpriteSource } from './sprite';

/** A pool of lamplight after dusk, in the sprite's own pixels. */
export interface PropLight {
  x: number;
  y: number;
  radius: number;
}

export interface PropArt {
  source: SpriteSource;
  /** How it looks by day, lamps out. */
  palette: Palette;
  /**
   * The keys that light up after dusk, in their lit colours. They are baked as a layer of their
   * own and drawn over the night, so a lit window stays bright however dark the town gets.
   */
  glow?: Palette;
  lights?: readonly PropLight[];
  /** The soft shadow it stands in, centred under its base, in the grid's own pixels. */
  shadow: { w: number; h: number };
  /** How it looks once it has given what it gives for the day, if that shows. */
  spent?: SpriteSource;
  /** Other colourings, one picked for each by where it stands, so a row of them isn't a copy. */
  variants?: readonly Palette[];
  /** Other shapes, `source` first, one picked for each by where it stands, as `variants` are. */
  forms?: readonly SpriteSource[];
}

const LANTERN: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '......oooo......',
    '.....oLLLLo.....',
    '.....oiyyio.....',
    '.....oiyYio.....',
    '.....oiyyio.....',
    '.....oiiiio.....',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '......oiio......',
    '.....oiiiio.....',
    '....oiiiiiio....',
    '....oooooooo....',
    '...ssssssssss...',
    '................',
  ],
};

const GRAVESTONE: SpriteSource = {
  rows: [
    '................',
    '................',
    '.....oooooo.....',
    '....oAAaaaao....',
    '...oAaaaaaaao...',
    '...oAaaakaaao...',
    '...oAaakkkaao...',
    '...oAaaakaaao...',
    '...oAaaakaaao...',
    '...oAaaaaaaao...',
    '...oAaaaaaaao...',
    '...oaaaaaaaao...',
    '...oaaaaaaaao...',
    '..oooooooooooo..',
    '..ssssssssssss..',
    '................',
  ],
};

const FENCE: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '..i...i...i...i.',
    '.iii.iii.iii.iii',
    '..i...i...i...i.',
    'iiiiiiiiiiiiiiii',
    '..i...i...i...i.',
    '..i...i...i...i.',
    '..i...i...i...i.',
    '..i...i...i...i.',
    'iiiiiiiiiiiiiiii',
    '..i...i...i...i.',
    '..i...i...i...i.',
    'ssssssssssssssss',
    '................',
  ],
};

/** A fence running up the screen, seen end-on: one post per tile on a rail that joins them. */
const FENCE_POST: SpriteSource = {
  rows: [
    '.......i........',
    '......iii.......',
    '.......i........',
    '.......is.......',
    '.......is.......',
    '......iiis......',
    '.......is.......',
    '.......is.......',
    '.......is.......',
    '.......is.......',
    '......iiis......',
    '.......is.......',
    '.......is.......',
    '.......is.......',
    '.......is.......',
    '.......is.......',
  ],
};

const WELL: SpriteSource = {
  rows: [
    '................................',
    '................................',
    '................................',
    '................................',
    '...........oooooooooo...........',
    '.........oRRrRRRRrRRRRo.........',
    '.......oRRRrRRRRrRRRRrRRo.......',
    '.....oRRRRrRRRRrRRRRrRRRRro.....',
    '...orRRRRrRRRRrRRRRrRRRRrRRRo...',
    '...oooooooooooooooooooooooooo...',
    '......ow.......nn.......wo......',
    '......ow.......nn.......wo......',
    '......ow.......nn.......wo......',
    '......ow.......nn.......wo......',
    '......ow.......nn.......wo......',
    '......ow......obbo......wo......',
    '......ow......obbo......wo......',
    '......ow......oooo......wo......',
    '......ow................wo......',
    '......ow................wo......',
    '...oooooooooooooooooooooooooo...',
    '...oAAaaAAaaAAaaAAaaAAaaAAaao...',
    '...ovvvvvvvvvvvvvvvvvvvvvvvvo...',
    '...ovvvvvvvvvvvvvvvvvvvvvvvvo...',
    '...okaaaaaaakaaaaaaakaaaaaaao...',
    '...oaaaakaaaaaaakaaaaaaakaaao...',
    '...okkkkkkkkkkkkkkkkkkkkkkkko...',
    '...oaaaakaaaaaaakaaaaaaakaaao...',
    '...okkkkkkkkkkkkkkkkkkkkkkkko...',
    '...oaaaakaaaaaaakaaaaaaakaaao...',
    '...oooooooooooooooooooooooooo...',
    '....ssssssssssssssssssssssss....',
  ],
};

/** One grid, three buildings: the roof and walls are palette keys, so each house is a recolour. */
const HOUSE: SpriteSource = {
  rows: [
    '................................................',
    '................................................',
    '................................................',
    '.................................oooooo.........',
    '.................................oCCCCo.........',
    '.................................occcco.........',
    '...............ooooooooooooooooooocccco.........',
    '..............oRRRRRRRRRRRRRRRRRRocccco.........',
    '.............orRRRrRRRrRRRrRRRrRRRoccco.........',
    '............oRRRRRrRRRRRrRRRRRrRRRRocco.........',
    '...........oRRRRRRRRRRRRRRRRRRRRRRRRoco.........',
    '..........orRRRrRRRrRRRrRRRrRRRrRRRrRoo.........',
    '.........oRRrRRRRRrRRRRRrRRRRRrRRRRRrRo.........',
    '........oRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRo........',
    '.......orRRRrRRRrRRRrRRRrRRRrRRRrRRRrRRRo.......',
    '......oRRRRRrRRRRRrRRRRRrRRRRRrRRRRRrRRRRo......',
    '.....oRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRo.....',
    '....orRRRrRRRrRRRrRRRrRRRrRRRrRRRrRRRrRRRrRo....',
    '...oRRrRRRRRrRRRRRrRRRRRrRRRRRrRRRRRrRRRRRrRo...',
    '..oRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRo..',
    '..oRRRrRRRrRRRrRRRrRRRrRRRrRRRrRRRrRRRrRRRrRRo..',
    '..oRRRrRRRRRrRRRRRrRRRRRrRRRRRrRRRRRrRRRRRrRRo..',
    '..oRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRo..',
    '..orRRRrRRRrRRRrRRRrRRRrRRRrRRRrRRRrRRRrRRRrRo..',
    '.oooooooooooooooooooooooooooooooooooooooooooooo.',
    '....oWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwo....',
    '....oWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwo....',
    '....oWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwo....',
    '....oWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWwo....',
    '....oWWWooooooooWWWWWWWWWWWWWWWWooooooooWWwo....',
    '....oWWWoYyooYyoWWWWWWWWWWWWWWWWoYyooYyoWWwo....',
    '....oWWWoyyooyyoWWWWWWWWWWWWWWWWoyyooyyoWWwo....',
    '....oWWWooooooooWWWWWooooooWWWWWooooooooWWwo....',
    '....oWWWoyyooyyoWWWWodDDDDdoWWWWoyyooyyoWWwo....',
    '....oWWWoyyooyyoWWWWodDDDDdoWWWWoyyooyyoWWwo....',
    '....oWWWoyyooyyoWWWWodDDDDdoWWWWoyyooyyoWWwo....',
    '....oWWWooooooooWWWWodDDDDdoWWWWooooooooWWwo....',
    '....oWWooooooooooWWWodDDDDdoWWWooooooooooWwo....',
    '....oWWofbfbfbfboWWWodDDDDdoWWWofbfbfbfboWwo....',
    '....oWWWWWWWWWWWWWWWodDDDkdoWWWWWWWWWWWWWWwo....',
    '....oWWWWWWWWWWWWWWWodDDDDdoWWWWWWWWWWWWWWwo....',
    '....oWWWWWWWWWWWWWWWodDDDDdoWWWWWWWWWWWWWWwo....',
    '....oWWWWWWWWWWWWWWWodDDDDdoWWWWWWWWWWWWWWwo....',
    '....oWWWWWWWWWWWWWWWodDDDDdoWWWWWWWWWWWWWWwo....',
    '....owwwwwwwwwwwwwwwodDDDDdowwwwwwwwwwwwwwwo....',
    '....owwwwwwwwwwwwwwwodDDDDdowwwwwwwwwwwwwwwo....',
    '...sssssssssssssssoaaaaaaaaaaosssssssssssssss...',
    '.....ssssssssssssssssssssssssssssssssssssss.....',
  ],
};

/** Her mailbox by her door (phase 9), its flag up when a letter is waiting. */
export const MAILBOX_FULL: SpriteSource = {
  rows: [
    '............oo..',
    '............oFo.',
    '....ooooooooooFo',
    '...oBBBBBBBBBoFo',
    '..oBbbbbbbbbbBoo',
    '..obbbbbbbbbbbo.',
    '..obbbbwwwbbbbo.',
    '..obbbbbbbbbbbo.',
    '..ooooooooooooo.',
    '.......oPo......',
    '.......oPo......',
    '.......oPo......',
    '.......oPo......',
    '.......oPo......',
    '......oPPPo.....',
    '......ooooo.....',
  ],
};

const MAILBOX: SpriteSource = {
  rows: [
    '................',
    '................',
    '....oooooooooo..',
    '...oBBBBBBBBBBo.',
    '..oBbbbbbbbbbBo.',
    '..obbbbbbbbbbbo.',
    '..obbbbwwwbbbboo',
    '..obbbbbbbbbbbFo',
    '..ooooooooooooFo',
    '.......oPo......',
    '.......oPo......',
    '.......oPo......',
    '.......oPo......',
    '.......oPo......',
    '......oPPPo.....',
    '......ooooo.....',
  ],
};

const MAILBOX_PALETTE: Palette = {
  '.': null,
  o: C.ink,
  B: C.blueFabric,
  b: C.blueFabricShade,
  w: C.sky,
  F: C.scarlet,
  P: C.wood,
};

/** A little sign over the bakery door: a heart between two candles, which is to say, cake. */
const BAKERY_SIGN: readonly string[] = ['oooooooooo', 'oDDfkkfDDo', 'oDfkffkfDo', 'oooooooooo'];

/**
 * The Moon Pie Man's cart: a striped umbrella on a pole, and a counter of moon pies, one of each
 * flavour at once. He stands behind it, in the top-left of its two-by-two footprint.
 */
const MOON_PIE_CART: SpriteSource = {
  rows: [
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '................................',
    '..................oooooooooooo..',
    '................ooRRWWRRWWRRWWo.',
    '...............oRRWWRRWWRRWWRRWo',
    '...............oooooooooooooooo.',
    '......................oPo.......',
    '......................oPo.......',
    '......................oPo.......',
    '......................oPo.......',
    '......................oPo.......',
    '.oooooooooooooooooooooooooooooo.',
    '.oTTTTTTTTTTTTTTTTTTTTTTTTTTTTo.',
    '.oCCmmCCmmCCmmCCmmCCmmCCmmCCmmo.',
    '.otttttttttttttttttttttttttttto.',
    '.otttoooooooooooooooooooooottto.',
    '.ottto.y.gyp.y.gyp.y.gyp..ottto.',
    '.otttoooooooooooooooooooooottto.',
    '.otttttttttttttttttttttttttttto.',
    '.oooooooooooooooooooooooooooooo.',
    '...oooo..................oooo...',
    '..oKKKKo................oKKKKo..',
    '..oKkkKo................oKkkKo..',
    '...oooo..................oooo...',
  ],
};

/**
 * The pop-up costume shop (personal_touches.md): a parody of the kind that takes over an empty shop
 * for a season. Its banner says NOW OPEN!, a ghost glows on its sign after dark, and a witch hat
 * and a pumpkin sit in its windows. Its roof overhangs the row behind its three-by-two footprint.
 */
const POP_UP_SHOP: SpriteSource = {
  rows: [
    '................................................',
    '................................................',
    '...o........................................o...',
    '...p........................................p...',
    '...poooooooooooooooooooooooooooooooooooooooop...',
    '...pobbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbop...',
    '...pobbtbbtbtttbtbbbtbbtttbttbbtttbtbbtbtbbop...',
    '...pobbttbtbtbtbtbbbtbbtbtbtbtbtbbbttbtbtbbop...',
    '...pobbtbttbtbtbtbtbtbbtbtbttbbttbbtbttbtbbop...',
    '...pobbtbbtbtbtbtbtbtbbtbtbtbbbtbbbtbbtbbbbop...',
    '...pobbtbbtbtttbbtbtbbbtttbtbbbtttbtbbtbtbbop...',
    '...poBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBop...',
    '...poooooooooooooooooooooooooooooooooooooooop...',
    '...p........................................p...',
    '...p........................................p...',
    '...p........................................p...',
    '.oooooooooooooooooooooooooooooooooooooooooooooo.',
    '.oRRRRRRRRRRRRRRRRRRRRggggRRRRRRRRRRRRRRRRRRRRo.',
    '.orrrrrrrrrrrrrrrrrrrgoggogrrrrrrrrrrrrrrrrrrro.',
    '.orrrrrrrrrrrrrrrrrrrggggggrrrrrrrrrrrrrrrrrrro.',
    '.orrrrrrrrrrrrrrrrrrrgrggrgrrrrrrrrrrrrrrrrrrro.',
    '.oooooooooooooooooooooooooooooooooooooooooooooo.',
    '..owwwwwWwwwwwWwwwwwwwwwwwwwwwwwwWwwwwwWwwwwWo..',
    '..owwwwwWwwwwwWwwwwwwwwwwwwwwwwwwWwwwwwWwwwwWo..',
    '..owwwwwWwwwwwWwwwwwwwwwwwwwwwwwwWwwwwwWwwwwWo..',
    '..owwwkkkkkkkkkkkkwwwwwwwwwwwwkkkkkkkkkkkkwwWo..',
    '..owwwkyyyyyyyyyykwwwwwwwwwwwwkyyyyyynnnnkwwWo..',
    '..owwwkyyyyyhhyyykwwoooooooowwkyyyyyynvvnkwwWo..',
    '..owwwkyyyyhhyyyykwwoyyyyyyowwkyyyyyynnnnkwwWo..',
    '..owwwkyyyhhhhyyykwwoyyyyyyowwkyyyyllyyyykwwWo..',
    '..owwwkyyyhhhhyyykwwoyyyyyyowwkyyPPPPPPyykwwWo..',
    '..owwwkyyhhhhhhyykwwoyyyyyyowwkyPPhPPhPPykwwWo..',
    '..owwwkhhhhhhhhhhkwwoyyyyyyowwkyPPPPPPPPykwwWo..',
    '..owwwkyyyyyyyyyykwwoyyyyyyowwkyPhPhhPhPykwwWo..',
    '..owwwkyyyyyyyyyykwwoyyyyyyowwkyyPPPPPPyykwwWo..',
    '..owwwkyyyyyyyyyykwwoyyyyyyowwkyyyyyyyyyykwwWo..',
    '..owwwkkkkkkkkkkkkwwoooooooowwkkkkkkkkkkkkwwWo..',
    '..owwwkkkkkkkkkkkkwwoddddddowwkkkkkkkkkkkkwwWo..',
    '..owwwwwWwwwwwWwwwwwoddddddowwwwwWwwwwwWwwwwWo..',
    '..owwwwwWwwwwwWwwwwwoddddddowwwwwWwwwwwWwwwwWo..',
    '..owwwwwWwwwwwWwwwwwoddddKdowwwwwWwwwwwWwwwwWo..',
    '..owwwwwWwwwwwWwwwwwoddddddowwwwwWwwwwwWwwwwWo..',
    '..owwwwwWwwwwwWwwwwwoddddddowwwwwWwwwwwWwwwwWo..',
    '..oWWWWWWWWWWWWWWWWWoddddddoWWWWWWWWWWWWWWWWWo..',
    '..oWWWWWWWWWWWWWWWWWoddddddoWWWWWWWWWWWWWWWWWo..',
    '..oooooooooooooooooooooooooooooooooooooooooooo..',
    '...................aaaaaaaaaa...................',
    '................................................',
  ],
};

/** Her storage chest: a plum trunk with iron bands and a little bat on the latch. */
const STORAGE_CHEST: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '..oooooooooooo..',
    '.oRRRRRRRRRRRRo.',
    '.orrrrrrrrrrrro.',
    '.oiRRRRRRRRRRio.',
    '.oiRRRRRRRRRRio.',
    '.oooooooooooooo.',
    '.oiWWWobboWWWio.',
    '.oiWWWbkkbWWWio.',
    '.oiWWWWbbWWWWio.',
    '.oiWWWWWWWWWWio.',
    '.oiwwwwwwwwwwio.',
    '.oiwwwwwwwwwwio.',
    '.oooooooooooooo.',
  ],
};

/** The bat on her front door, wings spread across it, eyes the colour of the door knob. */
const BAT_ON_DOOR = ['..o..o..', 'o.oooo.o', 'ookookoo', '.oooooo.', '..o..o..'];

/** The old painted-on shadow rows, now left clear: the ground draws a soft one (see `shadow`). */
const SHADOW = null;

const LIT = { y: C.candle, Y: C.candleBright } as const;

const HOUSE_LIGHTS: readonly PropLight[] = [
  { x: 12, y: 34, radius: 22 },
  { x: 36, y: 34, radius: 22 },
];

function house(roof: string, roofLight: string, wall: string, wallShade: string): PropArt {
  return {
    source: HOUSE,
    palette: housePalette(roof, roofLight, wall, wallShade),
    glow: LIT,
    lights: HOUSE_LIGHTS,
    shadow: { w: 44, h: 8 },
  };
}

function housePalette(roof: string, roofLight: string, wall: string, wallShade: string): Palette {
  return {
    '.': null,
    o: C.ink,
    R: roof,
    r: roofLight,
    W: wall,
    w: wallShade,
    c: C.stone,
    C: C.stoneLight,
    D: C.bark,
    d: C.barkDark,
    k: C.candle,
    y: C.dusk,
    Y: C.plumLight,
    f: C.rose,
    b: C.hedgeLight,
    a: C.stone,
    s: SHADOW,
  };
}

export const PROP_ART: Record<PropId, PropArt> = {
  // Drawn at 32 (phase F), as is everything marked so in `render/legacy.ts`.
  tree: {
    source: TREE,
    palette: TREE_LEAVES[0]!,
    variants: TREE_LEAVES,
    forms: TREE_FORMS,
    shadow: { w: 44, h: 12 },
  },
  willow: { source: WILLOW, palette: WILLOW_PALETTE, shadow: { w: 120, h: 18 } },
  // It stands in the pond, so its shadow falls on the water.
  fountain: {
    source: FOUNTAIN,
    palette: FOUNTAIN_PALETTE,
    glow: FOUNTAIN_GLOW,
    lights: [
      { x: 32, y: 40, radius: 70 },
      { x: 32, y: 66, radius: 40 },
    ],
    shadow: { w: 56, h: 10 },
  },
  rock: { source: ROCK, palette: ROCK_PALETTE, spent: PEBBLES, shadow: { w: 28, h: 7 } },
  pumpkin: {
    source: PUMPKIN,
    palette: {
      '.': null,
      o: C.pumpkinDark,
      p: C.pumpkin,
      P: C.pumpkinLight,
      s: C.moss,
      f: C.pumpkinDark,
    },
    glow: { f: C.candle },
    lights: [{ x: 8, y: 10, radius: 14 }],
    shadow: { w: 14, h: 4 },
  },
  lantern: {
    source: LANTERN,
    palette: {
      '.': null,
      o: C.ink,
      L: C.iron,
      i: C.iron,
      y: C.dusk,
      Y: C.plumLight,
      s: SHADOW,
    },
    glow: LIT,
    lights: [{ x: 8, y: 7, radius: 30 }],
    shadow: { w: 10, h: 4 },
  },
  gravestone: {
    source: GRAVESTONE,
    palette: {
      '.': null,
      o: C.ink,
      a: C.stone,
      A: C.stoneLight,
      k: C.stoneDark,
      s: SHADOW,
    },
    shadow: { w: 12, h: 4 },
  },
  fence: { source: FENCE, palette: { '.': null, i: C.iron, s: SHADOW }, shadow: { w: 16, h: 3 } },
  // The post's `s` is its shaded side, not a shadow on the ground.
  fencePost: {
    source: FENCE_POST,
    palette: { '.': null, i: C.iron, s: C.night },
    shadow: { w: 6, h: 3 },
  },
  well: {
    source: WELL,
    palette: {
      '.': null,
      o: C.ink,
      R: C.berry,
      r: C.berryLight,
      w: C.bark,
      n: C.rope,
      b: C.wood,
      a: C.stone,
      A: C.stoneLight,
      k: C.stoneDark,
      v: C.night,
      s: SHADOW,
    },
    shadow: { w: 30, h: 6 },
  },
  roseBush: {
    source: ROSE_BUSH,
    palette: ROSE_BUSH_PALETTE,
    spent: ROSE_BUSH_BARE,
    shadow: { w: 30, h: 9 },
  },
  hosta: {
    source: HOSTA,
    palette: HOSTA_LEAVES[0]!,
    variants: HOSTA_LEAVES,
    shadow: { w: 28, h: 8 },
  },
  farmSign: { source: FARM_SIGN, palette: FARM_SIGN_PALETTE, shadow: { w: 26, h: 5 } },
  // Her own house wears a bat on its door, like a wreath (personal_touches.md, "Her home").
  homeHouse: {
    ...house(C.plum, C.plumLight, C.cream, C.creamShade),
    source: overlay(HOUSE, [{ x: 20, y: 33, rows: BAT_ON_DOOR }]),
  },
  shopHouse: house(C.teal, C.tealLight, C.cream, C.creamShade),
  salonHouse: house(C.rose, C.roseLight, C.ghost, C.creamShade),
  storageChest: {
    source: STORAGE_CHEST,
    palette: {
      '.': null,
      o: C.ink,
      R: C.plumLight,
      r: C.plum,
      W: C.plum,
      w: C.dusk,
      i: C.iron,
      b: C.ink,
      k: C.candle,
    },
    shadow: { w: 14, h: 4 },
  },
  mailbox: { source: MAILBOX, palette: MAILBOX_PALETTE, shadow: { w: 10, h: 3 } },
  // Wrapunzel's bakery, with a museum at the back (personal_touches.md, "The neighbours").
  bakery: {
    ...house(C.lavenderShade, C.lavender, C.bandage, C.bandageShade),
    source: overlay(HOUSE, [{ x: 19, y: 28, rows: BAKERY_SIGN }]),
  },
  moonPieCart: {
    source: MOON_PIE_CART,
    palette: {
      '.': null,
      o: C.ink,
      R: C.roseLight,
      W: C.candleBright,
      P: C.iron,
      T: C.wood,
      t: C.bark,
      C: C.cream,
      m: C.bark,
      y: C.candle,
      g: C.leafLight,
      p: C.roseLight,
      K: C.iron,
      k: C.stone,
    },
    shadow: { w: 30, h: 5 },
  },
  popUpShop: {
    source: POP_UP_SHOP,
    palette: {
      '.': null,
      o: C.ink,
      p: C.iron,
      b: C.pumpkin,
      B: C.pumpkinShade,
      t: C.ink,
      r: C.inkFabric,
      R: C.plum,
      g: C.lavender,
      w: C.stoneLight,
      W: C.stone,
      k: C.iron,
      y: C.dusk,
      h: C.ink,
      P: C.pumpkin,
      l: C.leaf,
      n: C.white,
      v: C.stone,
      d: C.berry,
      K: C.candle,
      a: C.stone,
    },
    glow: { y: C.candle, g: C.ghost },
    lights: [
      { x: 12, y: 31, radius: 22 },
      { x: 36, y: 31, radius: 22 },
      { x: 24, y: 32, radius: 16 },
      { x: 24, y: 19, radius: 14 },
    ],
    shadow: { w: 44, h: 8 },
  },
};
