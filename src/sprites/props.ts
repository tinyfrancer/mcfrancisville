import type { PropId } from '../types/ids';
import { FARM_SIGN, FARM_SIGN_PALETTE, HOSTA, HOSTA_LEAVES } from './garden';
import { PUMPKIN } from './items';
import { fillOf, ACCENT, WINDOWS_LIT } from './buildings';

/** Agatha's brew, which glows a little after dark. */
const CAULDRON = fillOf(ACCENT);
import {
  CART,
  CART_PALETTE,
  COBWEB_CORNER,
  COBWEB_CORNER_PALETTE,
  CRUMBS_AND_CURIOS,
  CRUMBS_AND_CURIOS_PALETTE,
  MUSE,
  MUSE_PALETTE,
  POP_UP,
  POP_UP_LIT,
  POP_UP_PALETTE,
} from './shops';
import {
  AGATHA_HOUSE,
  AGATHA_HOUSE_PALETTE,
  BARTY_HOUSE,
  BARTY_HOUSE_PALETTE,
  CODY_HOUSE,
  CODY_HOUSE_PALETTE,
  MAUDE_HOUSE,
  MAUDE_HOUSE_PALETTE,
  RUFUS_HOUSE,
  RUFUS_HOUSE_PALETTE,
} from './neighbourHouses';
import { HER_HOUSE, HER_HOUSE_PALETTE, POT, POT_PALETTE, SKELLY, SKELLY_PALETTE } from './houses';
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
  shadow: { w: number; h: number; dy?: number };
  /** How it looks once it has given what it gives for the day, if that shows. */
  spent?: SpriteSource;
  /** Other colourings, one picked for each by where it stands, so a row of them isn't a copy. */
  variants?: readonly Palette[];
  /** Where its front door is, frame and all, in its own pixels: a building's. */
  door?: { x: number; y: number; w: number; h: number };
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

/** The old painted-on shadow rows, now left clear: the ground draws a soft one (see `shadow`). */
const SHADOW = null;

const LIT = { y: C.candle, Y: C.candleBright } as const;

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
  // Drawn at 32 (phase G): her house, Skelly in the yard and the pots by her door.
  homeHouse: {
    ...HER_HOUSE,
    palette: HER_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 46, y: 124, radius: 40 },
      { x: 130, y: 124, radius: 40 },
      { x: 114, y: 132, radius: 26 },
    ],
    shadow: { w: 168, h: 18 },
  },
  skelly: { source: SKELLY, palette: SKELLY_PALETTE, shadow: { w: 52, h: 10 } },
  pottedPlant: { source: POT, palette: POT_PALETTE, shadow: { w: 22, h: 6, dy: 6 } },
  shopHouse: {
    ...COBWEB_CORNER,
    palette: COBWEB_CORNER_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 46, y: 138, radius: 44 },
      { x: 130, y: 138, radius: 44 },
      { x: 88, y: 150, radius: 30 },
    ],
    shadow: { w: 168, h: 18 },
  },
  salonHouse: {
    ...MUSE,
    palette: MUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 44, y: 136, radius: 44 },
      { x: 132, y: 136, radius: 44 },
      { x: 88, y: 46, radius: 26 },
    ],
    shadow: { w: 168, h: 18 },
  },
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
  // Wrapunzel's bakery, with a museum beside it (personal_touches.md, "The neighbours").
  bakery: {
    ...CRUMBS_AND_CURIOS,
    palette: CRUMBS_AND_CURIOS_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 45, y: 142, radius: 44 },
      { x: 168, y: 124, radius: 36 },
      { x: 88, y: 150, radius: 28 },
    ],
    shadow: { w: 200, h: 18 },
  },
  moonPieCart: {
    source: CART,
    palette: CART_PALETTE,
    glow: WINDOWS_LIT,
    lights: [{ x: 55, y: 25, radius: 30 }],
    shadow: { w: 64, h: 10 },
  },
  popUpShop: {
    ...POP_UP,
    palette: POP_UP_PALETTE,
    glow: POP_UP_LIT,
    lights: [
      { x: 27, y: 67, radius: 30 },
      { x: 85, y: 67, radius: 30 },
      { x: 56, y: 88, radius: 30 },
    ],
    shadow: { w: 104, h: 14 },
  },
  // Her neighbours' houses (phase G), each after its owner, their windows lit after dark.
  maudeHouse: {
    ...MAUDE_HOUSE,
    palette: MAUDE_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 36, y: 118, radius: 40 },
      { x: 72, y: 40, radius: 24 },
      { x: 62, y: 112, radius: 22 },
    ],
    shadow: { w: 136, h: 16 },
  },
  rufusHouse: {
    ...RUFUS_HOUSE,
    palette: RUFUS_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 41, y: 103, radius: 36 },
      { x: 135, y: 103, radius: 36 },
      { x: 64, y: 104, radius: 22 },
    ],
    shadow: { w: 168, h: 16 },
  },
  agathaHouse: {
    ...AGATHA_HOUSE,
    palette: AGATHA_HOUSE_PALETTE,
    glow: { ...WINDOWS_LIT, [CAULDRON]: C.orbGreenLight },
    lights: [
      { x: 103, y: 125, radius: 34 },
      { x: 72, y: 54, radius: 22 },
      { x: 106, y: 160, radius: 28 },
    ],
    shadow: { w: 136, h: 16 },
  },
  bartyHouse: {
    ...BARTY_HOUSE,
    palette: BARTY_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 113, y: 110, radius: 44 },
      { x: 29, y: 107, radius: 28 },
    ],
    shadow: { w: 136, h: 16 },
  },
  codyHouse: {
    ...CODY_HOUSE,
    palette: CODY_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 38, y: 129, radius: 38 },
      { x: 138, y: 129, radius: 38 },
      { x: 60, y: 128, radius: 22 },
      { x: 114, y: 128, radius: 22 },
    ],
    shadow: { w: 168, h: 18 },
  },
};
