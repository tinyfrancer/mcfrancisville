import type { FurnitureId } from '../types/ids';
import { PUMPKIN } from './items';
import { PALETTE as C } from './palette';
import type { FurnitureArt } from './furniture';
import type { SpriteSource } from './sprite';

// The workbench, and what she makes at it (phase 8). Symmetrical pieces were drawn as half and
// mirrored, which is why they have no way to turn.

const WORKBENCH: SpriteSource = {
  rows: [
    '......ooooo.....................',
    '......oLLLo.....................',
    '.....oGGGGGo....................',
    '.....oGrGbGo..........ooo.......',
    '.....oGyGpGo..........oio.......',
    '.....orGbGyo..........oio.......',
    '.....oGpGrGo...ooooooooiio......',
    '......ooooo....oRRRRRRRiio......',
    'oooooooooooooooooooooooooooooooo',
    'oTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTo',
    'otttttttttttttttttttttttttttttto',
    'oooooooooooooooooooooooooooooooo',
    '.oddo......................oddo.',
    '.oddo......................oddo.',
    '.oddooooooooooooooooooooooooddo.',
    '.oddoTTTTTTTTTTTTTTTTTTTTTToddo.',
    '.oddooooooooooooooooooooooooddo.',
    '.oddo......................oddo.',
    '.oooo......................oooo.',
  ],
};

const STUMP_STOOL: SpriteSource = {
  rows: [
    '...oooooooooo...',
    '..oRRRRRRRRRRo..',
    '.oRRrrrrrrrrRRo.',
    '.oRrRRRRRRRRrRo.',
    '.oRrRRrrrrRRrRo.',
    '.oRrRRRRRRRRrRo.',
    '.oRRrrrrrrrrRRo.',
    '..oRRRRRRRRRRo..',
    '.obbbbbbbbbbbbo.',
    '.obBbbbbBbbbbBo.',
    '.obBbbbbBbbbbBo.',
    '.obbbbbbbbbbbbo.',
    'obbbbbbbbbbbbbbo',
    'oooooooooooooooo',
  ],
};

const ROSE_VASE: SpriteSource = {
  rows: [
    '........oo......',
    '...oo..oRro.....',
    '..oRro..oo..oo..',
    '...oo...l..oRro.',
    '....l...l...oo..',
    '....ll..l..ll...',
    '.....l.lL.ll....',
    '.....lllLll.....',
    '....oooooooo....',
    '...oAAaaaaaao...',
    '....oAaaaaao....',
    '....oAaaaaao....',
    '...oAaakkaaao...',
    '..oAaaakkaaaao..',
    '..oAaaaaaaaaao..',
    '..oAaaaaaaaaao..',
    '...okkkkkkkko...',
    '....oooooooo....',
  ],
};

const PRESSED_FLOWERS: SpriteSource = {
  rows: [
    '................',
    '.oooooooooooooo.',
    '.oWWWWWWWWWWWWo.',
    '.oWccccccccccWo.',
    '.oWcvccccccwcWo.',
    '.oWvyvccbcwywWo.',
    '.oWcvccbybcwcWo.',
    '.oWcgcccbccgcWo.',
    '.oWccgccgccgcWo.',
    '.oWcccgcgcgccWo.',
    '.oWccccgggcccWo.',
    '.oWcccrrgrrccWo.',
    '.oWccccccccccWo.',
    '.oWWWWWWWWWWWWo.',
    '.oooooooooooooo.',
    '................',
  ],
};

const STONE_HEARTH: SpriteSource = {
  rows: [
    '.oooooooooooooooooooooooooooooo.',
    'oWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWo',
    'owwwwwwwwwwwwwwwwwwwwwwwwwwwwwwo',
    '.oooooooooooooooooooooooooooooo.',
    '.oAaaaakAaaaakAaaaakAaaaakAaaao.',
    '.oAaaaakAaaaakAaaaakAaaaakAaaao.',
    '.okkkkkkkkkkkkkkkkkkkkkkkkkkkko.',
    '.oaakAaaaakAooooooooaakAaaaakAo.',
    '.oaakAaaaakoddddddddoakAaaaakAo.',
    '.okkkkkkkkoddddddddddokkkkkkkko.',
    '.oAaaaakAaoddddddddddoaaakAaaao.',
    '.oAaaaakAaoddddddddddoaaakAaaao.',
    '.okkkkkkkkoddddydddddokkkkkkkko.',
    '.oaakAaaaaoddydyyddydokAaaaakAo.',
    '.oaakAaaaaodyydyYydyyokAaaaakAo.',
    '.okkkkkkkkodyYyYYyyYyokkkkkkkko.',
    '.oAaaaakAaollyYYYYYyloaaakAaaao.',
    '.oAaaaakAaolllllllllloaaakAaaao.',
    'oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAo',
    'okkkkkkkkkkkkkkkkkkkkkkkkkkkkkko',
    'oooooooooooooooooooooooooooooooo',
  ],
};

const MOONFLOWER_LAMP: SpriteSource = {
  rows: [
    '......oooo......',
    '..oo.ommmmo.oo..',
    '.ommoomMMmoommo.',
    '.omMmomMMmomMmo.',
    '..ommoommoommo..',
    '..llooooooooll..',
    '..oAAaaaaaaAAo..',
    '...oAaaaaaaAo...',
    '....okkkkkko....',
    '......oaao......',
    '......oaao......',
    '......oaao......',
    '......oaao......',
    '......oaao......',
    '......oaao......',
    '......oaao......',
    '.....oAaaAo.....',
    '....oAaaaaAo....',
    '....okkkkkko....',
    '....oooooooo....',
  ],
};

const CANDY_CORN_WREATH: SpriteSource = {
  rows: [
    '.....oooooo.....',
    '...ooyyyyyyoo...',
    '..ooyPPPPPPyoo..',
    '..oyPPwwwwPPyo..',
    '.oyPwwo..owwPyo.',
    '.oyPwo....owPyo.',
    'oyPwo......owPyo',
    'oyPwo......owPyo',
    'oyPwo......owPyo',
    '.oyPwo....owPyo.',
    '.oyPwwo..owwPyo.',
    '..oyPPwwwwPPyo..',
    '..ooyPooPPoooo..',
    '...ooobbobbbo...',
    '.....ooobboo....',
    '.......obbo.....',
  ],
};

const HOSTA_PLANTER: SpriteSource = {
  rows: [
    '.......oo.......',
    '..oo..oLLo..oo..',
    '.oLLo.oLlLo.oLLo',
    '.oLlLooLlLooLlLo',
    '..oLlLoLlLoLlLo.',
    'ooooLlcLlLcLloo.',
    'oLLLoLlcLcLlooLo',
    'oLllLLoLlLoLLllo',
    '.oLLllLoLoLllLo.',
    '..oooLlLoLlLooo.',
    '.oooooooooooooo.',
    '.oWWWWWWWWWWWWo.',
    '.owwwwwwwwwwwwo.',
    '.oWWWWWWWWWWWWo.',
    '.owwwwwwwwwwwwo.',
    '.oWWWWWWWWWWWWo.',
    '.oooooooooooooo.',
  ],
};

const LITTLE_GARGOYLE: SpriteSource = {
  rows: [
    '.o............o.',
    '.oo..........oo.',
    '.oAo.oooooo.oAo.',
    '.oAAoAAaaAAoAAo.',
    '..oAAaaaaaaAAo..',
    '...oaewaaweao...',
    '...oaekaakeao...',
    '...oaaaaaaaao...',
    '....oawwwwao....',
    '..ooooaaaaoooo..',
    '.oGGoaaaaaaoGGo.',
    'oGGGoaAaaAaoGGGo',
    'oGGoaaAaaAaaoGGo',
    '.oooaaaaaaaaooo.',
    '...oaoaaaaoao...',
    '..oooooooooooo..',
    '.oAAAAAAAAAAAAo.',
    '.oaaaaaaaaaaaao.',
    '.okkkkkkkkkkkko.',
    '.oooooooooooooo.',
  ],
};

const BLUE_ROSE_DOME: SpriteSource = {
  rows: [
    '.....oooooo.....',
    '...oo......oo...',
    '..o.G........o..',
    '.o.G..........o.',
    '.o.G...oo.....o.',
    '.o....obBo....o.',
    '.o...obBbBo...o.',
    '.o...oBbBbo...o.',
    '.o....obbo....o.',
    '.o.....oo.....o.',
    '.o.....l..l...o.',
    '.o...ll.l.ll..o.',
    '.o...lllLll...o.',
    '.o......L.....o.',
    '.o......L.....o.',
    '.o......L.....o.',
    '.oooooooooooooo.',
    'oWWWWWWWWWWWWWWo',
    'oxxxxxxxxxxxxxxo',
    'oooooooooooooooo',
  ],
};

const PEPPER_GARLAND: SpriteSource = {
  rows: [
    '................................',
    'oo............................oo',
    '.orr......................rrrro.',
    '...rrrr................rrrr.....',
    '.....o.rrrr........rrrr..o......',
    '....ogo....rrrrrrrr.....ogo.....',
    '...owwwo.....o.o.......owwwo....',
    '...owkwo....ogo..o....owkwko....',
    '...owwwo...owwwo.go...owwwwo....',
    '...owkwo...owkwowwwo...owkwo....',
    '....owo....owwwowkwo...owwo.....',
    '.....o......owo.owwwo...oo......',
    '.............o...owo............',
    '..................o.............',
    '................................',
    '................................',
  ],
};

/** Stone, as the rocks in town are. */
const STONE = { a: C.stone, A: C.stoneLight, k: C.stoneDark } as const;

export const CRAFTED_ART: Record<
  Extract<
    FurnitureId,
    | 'workbench'
    | 'stumpStool'
    | 'jackOLantern'
    | 'roseVase'
    | 'pressedFlowers'
    | 'stoneHearth'
    | 'moonflowerLamp'
    | 'candyCornWreath'
    | 'hostaPlanter'
    | 'littleGargoyle'
    | 'blueRoseDome'
    | 'pepperGarland'
  >,
  FurnitureArt
> = {
  workbench: {
    source: WORKBENCH,
    palette: {
      '.': null,
      o: C.ink,
      L: C.bark,
      G: C.ghost,
      r: C.rose,
      b: C.blueFabric,
      y: C.gold,
      p: C.lavender,
      i: C.iron,
      R: C.rope,
      T: C.wood,
      t: C.bark,
      d: C.barkDark,
    },
  },
  stumpStool: {
    source: STUMP_STOOL,
    palette: { '.': null, o: C.ink, R: C.rope, r: C.wood, b: C.bark, B: C.barkDark },
  },
  // The same jack-o'-lantern as the ones in town, carved from a pumpkin she grew.
  jackOLantern: {
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
    lights: [{ x: 8, y: 10, radius: 16 }],
  },
  roseVase: {
    source: ROSE_VASE,
    palette: {
      '.': null,
      o: C.ink,
      R: C.roseLight,
      r: C.rose,
      l: C.leaf,
      L: C.leafDark,
      ...STONE,
    },
  },
  pressedFlowers: {
    source: PRESSED_FLOWERS,
    palette: {
      '.': null,
      o: C.ink,
      W: C.wood,
      c: C.cream,
      v: C.lavender,
      b: C.sky,
      w: C.white,
      y: C.candle,
      g: C.leaf,
      r: C.rose,
    },
  },
  stoneHearth: {
    source: STONE_HEARTH,
    palette: {
      '.': null,
      o: C.ink,
      W: C.wood,
      w: C.bark,
      d: C.iron,
      y: C.pumpkin,
      Y: C.pumpkinLight,
      l: C.barkDark,
      ...STONE,
    },
    glow: { y: C.candle, Y: C.candleBright },
    lights: [{ x: 16, y: 14, radius: 34 }],
  },
  moonflowerLamp: {
    source: MOONFLOWER_LAMP,
    palette: { '.': null, o: C.ink, m: C.silver, M: C.cream, l: C.leaf, ...STONE },
    glow: { m: C.ghost, M: C.candleBright },
    lights: [{ x: 8, y: 3, radius: 24 }],
  },
  candyCornWreath: {
    source: CANDY_CORN_WREATH,
    palette: { '.': null, o: C.ink, y: C.gold, P: C.pumpkin, w: C.white, b: C.plumLight },
  },
  hostaPlanter: {
    source: HOSTA_PLANTER,
    palette: {
      '.': null,
      o: C.ink,
      L: C.hostaBlueLight,
      l: C.hostaBlue,
      c: C.hostaCream,
      W: C.wood,
      w: C.bark,
    },
  },
  littleGargoyle: {
    source: LITTLE_GARGOYLE,
    palette: { '.': null, o: C.ink, G: C.stoneDark, w: C.white, e: C.ink, ...STONE },
  },
  blueRoseDome: {
    source: BLUE_ROSE_DOME,
    palette: {
      '.': null,
      o: C.ink,
      G: C.ghost,
      b: C.blueFabric,
      B: C.sky,
      l: C.leaf,
      L: C.leafDark,
      W: C.wood,
      x: C.bark,
    },
    glow: { b: C.sky, B: C.ghost },
    lights: [{ x: 8, y: 7, radius: 14 }],
  },
  pepperGarland: {
    source: PEPPER_GARLAND,
    palette: { '.': null, o: C.ink, r: C.rope, g: C.leaf, w: C.silver, k: C.ink },
    glow: { w: C.candleBright },
    lights: [
      { x: 5, y: 8, radius: 10 },
      { x: 13, y: 9, radius: 10 },
      { x: 18, y: 10, radius: 10 },
      { x: 25, y: 8, radius: 10 },
    ],
  },
};
