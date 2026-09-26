import type { PropId } from '../types/ids';
import {
  FARM_SIGN,
  FARM_SIGN_PALETTE,
  HOSTA,
  HOSTA_LEAVES,
  ROSE_BUSH,
  ROSE_BUSH_BARE,
  ROSE_BUSH_PALETTE,
} from './garden';
import { PEBBLES, PUMPKIN, ROCK, STONE_PALETTE } from './items';
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
  /** The soft shadow it stands in, centred under its base. */
  shadow: { w: number; h: number };
  /** How it looks once it has given what it gives for the day, if that shows. */
  spent?: SpriteSource;
  /** Other colourings, one picked for each by where it stands, so a row of them isn't a copy. */
  variants?: readonly Palette[];
}

const TREE: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...ooLLLlllloo..',
    '..oLLlllllllllo.',
    '.oLLllllllllldo.',
    '.oLlllllllllldo.',
    'olllllllllllldo.',
    'olllllllllllldo.',
    'olllllllllllddo.',
    '.olllllllllldo..',
    '.olllllllllddo..',
    '..olllllllddo...',
    '...oolllddoo....',
    '.....oottoo.....',
    '......otto......',
    '.....ottTo......',
    '.....otTo.......',
    '.....otTo.......',
    '......ottTo.....',
    '......otTTo.....',
    '.......otTo.....',
    '.......ottTo....',
    '......ottTTo....',
    '.....ootttTTo...',
    '....ooottTTooo..',
    '...ssssssssss...',
  ],
};

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
  tree: {
    source: TREE,
    palette: {
      '.': null,
      o: C.ink,
      l: C.canopy,
      L: C.canopyLight,
      d: C.canopyDark,
      t: C.bark,
      T: C.barkDark,
      s: SHADOW,
    },
    shadow: { w: 14, h: 6 },
  },
  rock: { source: ROCK, palette: STONE_PALETTE, spent: PEBBLES, shadow: { w: 14, h: 4 } },
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
    shadow: { w: 16, h: 5 },
  },
  hosta: {
    source: HOSTA,
    palette: HOSTA_LEAVES[0]!,
    variants: HOSTA_LEAVES,
    shadow: { w: 14, h: 4 },
  },
  farmSign: { source: FARM_SIGN, palette: FARM_SIGN_PALETTE, shadow: { w: 14, h: 3 } },
  homeHouse: house(C.plum, C.plumLight, C.cream, C.creamShade),
  shopHouse: house(C.teal, C.tealLight, C.cream, C.creamShade),
  salonHouse: house(C.rose, C.roseLight, C.ghost, C.creamShade),
};
