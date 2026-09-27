import type { FurnitureId } from '../types/ids';
import type { FurnitureArt } from './furniture';
import { PALETTE as C } from './palette';
import type { SpriteSource } from './sprite';

// Pieces her neighbours give her (phase 9): one from each at ten hearts, and a cake on her
// birthday. Like the made pieces, no shop sells them.

/** A stack of ghost stories, with a candle on top to read them by. */
const GHOST_STORIES: SpriteSource = {
  rows: [
    '.......y........',
    '......yYy.......',
    '.......Y........',
    '......oWo.......',
    '......oWo.......',
    '....ooooooo.....',
    '...oRRRRRRRo....',
    '...orrrrrrro....',
    '..ooooooooooo...',
    '..oBBBBBBBBBo...',
    '..obbbbbbbbbo...',
    '...ooooooooooo..',
    '...oPPPPPPPPPo..',
    '...oppwppppppo..',
    '.ooooooooooooo..',
    '.oGGGGGGGGGGGo..',
    '.oggggwggggggo..',
    '.ooooooooooooo..',
  ],
};

/** Roses and moonflowers in a tall blue vase, far too many of them, as a florist would. */
const MOON_BOUQUET: SpriteSource = {
  rows: [
    '.....oo...oo....',
    '..oo.oRo.oMMo...',
    '.oMMo.oo.oMMo.o.',
    '.oMMo.l.oo.oooRo',
    '..oo.l.oRRo.l.o.',
    '..l..l.oRRo.l...',
    '...l.ll.oo.ll...',
    '...LlLl.l.lL....',
    '....LlLlllL.....',
    '.....oooooo.....',
    '....obbbbbBo....',
    '.....obbbBo.....',
    '.....obbbBo.....',
    '....obbbbbBo....',
    '...obbbbbbbBo...',
    '...obbwbbbbBo...',
    '...obbbbbbbBo...',
    '....oBBBBBBo....',
    '.....oooooo.....',
  ],
};

/** A cake in the shape of a coffin on a cake stand, iced in purple with a cross of cream. */
const COFFIN_CAKE: SpriteSource = {
  rows: [
    '................',
    '.....oooooo.....',
    '....oPPwPPPo....',
    '...oPPPwPPPPo...',
    '...oPwwwwwPPo...',
    '...oPPPwPPPPo...',
    '....oPPwPPPo....',
    '....oPPPPPPo....',
    '.....oPPPPo.....',
    '....oppppppo....',
    '..oooooooooooo..',
    '..osssssssssso..',
    '...oooooooooo...',
    '......oSSo......',
    '......oSSo......',
    '....oooooooo....',
    '....oSSSSSSo....',
    '....oooooooo....',
  ],
};

/** A witch's broom, leaning, with a few stars still caught in its bristles. */
const BROOMSTICK: SpriteSource = {
  rows: [
    '............oo..',
    '...........oWo..',
    '..........oWo...',
    '..........oWo...',
    '.........oWo....',
    '.........oWo....',
    '........oWo.....',
    '........oWo.....',
    '.......oRRo.....',
    '......oRRRo.....',
    '.....obbbbbo....',
    '....obbybbbbo...',
    '....obbbbbbbo...',
    '...obbbbbbybbo..',
    '...obybbbbbbbo..',
    '..obbbbbbbbbbbo.',
    '..obBbBbBbBbBbo.',
    '..ooooooooooooo.',
  ],
};

/** A garden gnome who is also a skeleton, in a tall red hat, holding a tiny trowel. */
const BONE_GNOME: SpriteSource = {
  rows: [
    '.......oo.......',
    '......oRRo......',
    '......oRRo......',
    '.....oRRRRo.....',
    '.....oRRRRo.....',
    '....oRRRRRRo....',
    '...oooooooooo...',
    '....owwwwwwo....',
    '....okwwwwko....',
    '....owwkkwwo....',
    '....owkwkwkwo...',
    '.....owwwwo.o...',
    '...oTTTTTTTTo...',
    '...owTTTTTTwo...',
    '...oTTTTTTTTo...',
    '....oTTTTTTo....',
    '....owwoowwo....',
    '...oooooooooo...',
  ],
};

/**
 * Cody, as a vampire, in a gilt frame: long curly hair, glasses and a maroon tee, with a brass
 * plate underneath (personal_touches.md, "Cody's villager").
 */
const CODY_PORTRAIT: SpriteSource = {
  rows: [
    'oooooooooooooooo',
    'oGGGGGGGGGGGGGGo',
    'oGoooooooooooogo',
    'oGoddhhhhhhddogo',
    'oGodhhhhhhhhdogo',
    'oGohhssssssshogo',
    'oGohkkskkskkhogo',
    'oGohkssssssshogo',
    'oGohhsswwsshhogo',
    'oGohhhsssshhhogo',
    'oGodhmmmmmmhdogo',
    'oGodmmmmmmmmdogo',
    'oGoooooooooooogo',
    'oGggoyyyyyyoggGo',
    'oggggooooooggggo',
    'oooooooooooooooo',
  ],
};

/** Three tiers of pink-and-blue cake, with a candle for every wish. */
const BIRTHDAY_CAKE: SpriteSource = {
  rows: [
    '....y..y..y.....',
    '....Y..Y..Y.....',
    '....w..w..w.....',
    '...oooooooooo...',
    '...opPpPpPpPo...',
    '...obbbbbbbbo...',
    '..oooooooooooo..',
    '..opPpPpPpPpPo..',
    '..obbbbbbbbbbo..',
    '..obbbrbbbrbbo..',
    '.oooooooooooooo.',
    '.opPpPpPpPpPpPo.',
    '.obbbbbbbbbbbbo.',
    '.obbrbbbrbbbrbo.',
    '.obbbbbbbbbbbbo.',
    'oooooooooooooooo',
    'osssssssssssssso',
    'oooooooooooooooo',
  ],
};

const FLAME = { y: C.candle, Y: C.candleBright } as const;

export const GIFT_ART: Record<
  Extract<
    FurnitureId,
    | 'ghostStories'
    | 'moonBouquet'
    | 'coffinCake'
    | 'broomstick'
    | 'boneGnome'
    | 'codyPortrait'
    | 'birthdayCake'
  >,
  FurnitureArt
> = {
  ghostStories: {
    source: GHOST_STORIES,
    palette: {
      '.': null,
      o: C.ink,
      ...FLAME,
      W: C.cream,
      R: C.roseLight,
      r: C.rose,
      B: C.tealLight,
      b: C.teal,
      P: C.plumLight,
      p: C.plum,
      G: C.blueFabric,
      g: C.blueFabricShade,
      w: C.gold,
    },
    glow: FLAME,
    lights: [{ x: 7, y: 1, radius: 14 }],
  },
  moonBouquet: {
    source: MOON_BOUQUET,
    palette: {
      '.': null,
      o: C.ink,
      R: C.rose,
      M: C.ghost,
      l: C.leaf,
      L: C.leafDark,
      b: C.blueFabric,
      B: C.blueFabricShade,
      w: C.sky,
    },
    glow: { M: C.candleBright },
  },
  coffinCake: {
    source: COFFIN_CAKE,
    palette: {
      '.': null,
      o: C.ink,
      P: C.lavender,
      p: C.lavenderShade,
      w: C.cream,
      s: C.silver,
      S: C.silverShade,
    },
  },
  broomstick: {
    source: BROOMSTICK,
    palette: {
      '.': null,
      o: C.ink,
      W: C.wood,
      R: C.plum,
      b: C.rope,
      B: C.wood,
      y: C.candleBright,
    },
    glow: { y: C.candleBright },
  },
  boneGnome: {
    source: BONE_GNOME,
    palette: {
      '.': null,
      o: C.ink,
      R: C.scarlet,
      w: C.bone,
      k: C.ink,
      T: C.moss,
    },
  },
  codyPortrait: {
    source: CODY_PORTRAIT,
    palette: {
      '.': null,
      o: C.ink,
      G: C.gold,
      g: C.goldShade,
      d: C.plum,
      h: C.hairBrown,
      s: C.vampire,
      k: C.iron,
      w: C.white,
      m: C.maroon,
      y: C.candle,
    },
  },
  birthdayCake: {
    source: BIRTHDAY_CAKE,
    palette: {
      '.': null,
      o: C.ink,
      ...FLAME,
      w: C.white,
      p: C.roseLight,
      P: C.white,
      b: C.sky,
      r: C.rose,
      s: C.silver,
    },
    glow: FLAME,
    lights: [{ x: 7, y: 1, radius: 16 }],
  },
};
