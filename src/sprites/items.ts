import type { ItemId, PatchId } from '../types/ids';
import { PALETTE as C } from './palette';
import type { Palette, SpriteSource } from './sprite';

export interface ItemArt {
  source: SpriteSource;
  palette: Palette;
}

/** A rock, which is also what a handful of stone looks like in the bag. */
export const ROCK: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....oooo.......',
    '...ooAAaaoo.....',
    '..oAAaaaaaao....',
    '..oAaaaaaaakoo..',
    '.oAaaaaaakaaaao.',
    '.oaaaaakaaaaaao.',
    '.oaaaaaaaaaakko.',
    '.okaaaaaaaaakko.',
    '..okkkkkkkkkko..',
    '...oooooooooo...',
    '................',
  ],
};

/** A rock once it's been chipped for the day: a couple of pebbles, whole again tomorrow. */
export const PEBBLES: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '....ooo...oo....',
    '...oAako.oAko...',
    '...okkko.okko...',
    '....ooo...oo....',
    '................',
  ],
};

export const STONE_PALETTE: Palette = {
  '.': null,
  o: C.ink,
  a: C.stone,
  A: C.stoneLight,
  k: C.stoneDark,
};

const WOOD: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '..ooooooooooooo.',
    '.oTTTTTTTTToRRo.',
    '.otttttttttoRro.',
    '.otttttttttorRo.',
    '.odddddddddoRRo.',
    '..ooooooooooooo.',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

const FLOWER: SpriteSource = {
  rows: [
    '................',
    '......ooo.......',
    '.....offfo......',
    '...ooofffooo....',
    '..offfoFofffo...',
    '..offfFcFfffo...',
    '..offfoFofffo...',
    '...ooofffooo....',
    '.....offfo......',
    '......ooo.......',
    '.......e........',
    '....ee.e........',
    '.....eee........',
    '.......e.ee.....',
    '.......eee......',
    '.......e........',
  ],
};

const PURSE_BUTTER: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '..oooooooooooo..',
    '..oGGGGGGGGGGo..',
    '..oGggggggggGo..',
    '..oGgSSSSSSgGo..',
    '..oGgSSSSSSgGo..',
    '..oGggggggggGo..',
    '..oGGGGGGGGGGo..',
    '..oooooooooooo..',
    '................',
    '................',
    '................',
  ],
};

const PIZZA: SpriteSource = {
  rows: [
    '................',
    '................',
    '..oooooooooooo..',
    '..oCCCCCCCCCCo..',
    '..oyyryyyyryyo..',
    '...oyyyyryyyo...',
    '...oyryyyyyyo...',
    '....oyyyryyo....',
    '....oyyyyyyo....',
    '.....oyryyo.....',
    '.....oyyyyo.....',
    '......oyyo......',
    '......oyyo......',
    '.......oo.......',
    '................',
    '................',
  ],
};

const BAT_COOKIE: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    'oo....oooo....oo',
    'obo..obbbbo..obo',
    'obbooobbbbooobbo',
    'obbbbbcbbcbbbbbo',
    '.obbbbbbbbbbbbo.',
    '..oobbcbbbbboo..',
    '....obbbbbbo....',
    '.....oooooo.....',
    '................',
    '................',
    '................',
  ],
};

const PUDDING: SpriteSource = {
  rows: [
    '................',
    '................',
    '.......oo.......',
    '......oWWo......',
    '.....okWWko.....',
    '....oWWWWWWo....',
    '..oooooooooooo..',
    '..oppppppppppo..',
    '..occcccccccco..',
    '...occcccccco...',
    '...oCccccccCo...',
    '....occcccco....',
    '....oooooooo....',
    '................',
    '................',
    '................',
  ],
};

const GHOST_MALLOW: SpriteSource = {
  rows: [
    '................',
    '................',
    '.....oooooo.....',
    '....oGGGGGGo....',
    '....oWkWWkWo....',
    '....oWWWWWWo....',
    '....oWWuuWWo....',
    '....oGGGGGGo....',
    '.....oooooo.....',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '................',
    '................',
  ],
};

function flower(petal: string, shade: string): ItemArt {
  return {
    source: FLOWER,
    palette: { '.': null, o: C.ink, f: petal, F: shade, c: C.candle, e: C.mossLight },
  };
}

/** Every item as it's shown in the bag, 16×16. The night's snack is drawn on the ground with it too. */
export const ITEM_ART: Record<ItemId, ItemArt> = {
  wood: {
    source: WOOD,
    palette: { '.': null, o: C.ink, T: C.wood, t: C.bark, d: C.barkDark, R: C.rope, r: C.wood },
  },
  stone: { source: ROCK, palette: STONE_PALETTE },
  moonpetal: flower(C.lavender, C.lavenderShade),
  forgetMeBoo: flower(C.sky, C.blueFabric),
  ghostDaisy: flower(C.white, C.silver),
  purseButter: {
    source: PURSE_BUTTER,
    palette: { '.': null, o: C.ink, G: C.teal, g: C.tealLight, S: C.silver },
  },
  midnightPizza: {
    source: PIZZA,
    palette: { '.': null, o: C.ink, C: C.goldShade, y: C.candle, r: C.rose },
  },
  batWingCookie: {
    source: BAT_COOKIE,
    palette: { '.': null, o: C.ink, b: C.bark, c: C.cream },
  },
  pumpkinPudding: {
    source: PUDDING,
    palette: {
      '.': null,
      o: C.ink,
      W: C.white,
      k: C.ink,
      p: C.pumpkin,
      c: C.silver,
      C: C.silverShade,
    },
  },
  ghostMallow: {
    source: GHOST_MALLOW,
    palette: { '.': null, o: C.ink, G: C.goldShade, W: C.white, k: C.ink, u: C.rose, s: C.wood },
  },
};

const BLOOMS: SpriteSource = {
  rows: [
    '................',
    '................',
    '..f.............',
    '.fcf............',
    '..f.............',
    '..e........f....',
    '..e.......fcf...',
    '...........f....',
    '...........e....',
    '...........e....',
    '.......f........',
    '......fcf.......',
    '.......f........',
    '.......e........',
    '.......e........',
    '................',
  ],
};

/** What's left of a patch once it's been picked: sprouts, in bloom again tomorrow. */
export const SPROUTS: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '.e.e............',
    '..e.............',
    '..........e.e...',
    '...........e....',
    '................',
    '................',
    '................',
    '......e.e.......',
    '.......e........',
    '................',
    '................',
    '................',
  ],
};

export const SPROUTS_PALETTE: Palette = { '.': null, e: C.mossLight };

export interface PatchArt extends ItemArt {
  /** Blooms that glow after dark, as moonpetals do. */
  glows?: true;
}

function blooms(petal: string, glows?: true): PatchArt {
  const art: PatchArt = {
    source: BLOOMS,
    palette: { '.': null, f: petal, c: C.candle, e: C.mossLight },
  };
  if (glows) art.glows = true;
  return art;
}

export const PATCH_ART: Record<PatchId, PatchArt> = {
  moonpetals: blooms(C.lavender, true),
  forgetMeBoos: blooms(C.sky),
  ghostDaisies: blooms(C.white),
};
