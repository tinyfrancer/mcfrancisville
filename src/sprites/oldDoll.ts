import { OUTFITS } from '../data/outfits';
import type { CutId, Facing, OutfitId } from '../types/ids';
import type { Worn } from '../types/look';
import { FABRIC_TONES, type HairTones, type Tone } from './lookColours';
import { PALETTE as C } from './palette';
import type { Palette } from './sprite';

/*
 * Version 0's paper doll at 16×32, kept only for the neighbours, the Moon Pie Man and Wes, who are
 * built from its parts until phase D2 redraws them at 32×48 and this file goes (decisions.md 88).
 * She is drawn by `doll.ts`. Left is right, flipped when it is baked.
 *
 * The body is drawn in *region* keys (`b` torso, `a` arm, `l` leg…) that all map to her skin. That
 * lets most clothes be painted rather than drawn: a tee is "the torso down to the hem, and the top
 * of each arm", worked out from the body for every facing and frame, so a new top or colour is a
 * row in `src/data/outfits.ts` rather than twelve more grids. Only what changes the silhouette (a
 * skirt, hair, a hat, glasses) is drawn by hand.
 */

export type View = 'front' | 'back' | 'side';

export function viewOf(facing: Facing): View {
  if (facing === 'down') return 'front';
  if (facing === 'up') return 'back';
  return 'side';
}

/** Standing, then two walk frames. */
export const DOLL_FRAMES = 3;

export type Grid = readonly string[];

const HEAD_FRONT: Grid = [
  '....oooooooo....',
  '...osssssssso...',
  '..osssssssssso..',
  '..osssssssssso..',
  '..osssssssssso..',
  '..osssssssssso..',
  '..osssssssssso..',
  '..osssssssssso..',
  '...osssssssso...',
  '....oossssoo....',
  '......onno......',
];

const TORSO_FRONT: Grid = [
  '..oobbbbbbbboo..',
  '.oaaobbbbbboaao.',
  '.oaaobbbbbboaao.',
  '.oaaobbbbbboaao.',
  '.oaaobbbbbboaao.',
  '.oaaobbbbbboaao.',
  '.oaaobbbbbboaao.',
  '.oAAobbbbbboAAo.',
  '..ooobbbbbbooo..',
  '....obbbbbbo....',
];

const LEGS_FRONT: Grid = [
  '....ollllllo....',
  '....olloollo....',
  '....olloollo....',
  '....olloollo....',
  '....olloollo....',
  '....olloollo....',
  '....olloollo....',
  '....olloollo....',
  '....olloollo....',
  '....offooffo....',
  '....oooooooo....',
];

/** Her right foot lifted; the other walk frame is this mirrored. */
const LEGS_FRONT_STEP: Grid = [
  '....ollllllo....',
  '....olloollo....',
  '....olloollo....',
  '....olloollo....',
  '....olloollo....',
  '....olloollo....',
  '....olloollo....',
  '....olloollo....',
  '....offoollo....',
  '....oooooffo....',
  '........oooo....',
];

const HEAD_SIDE: Grid = [
  '....oooooooo....',
  '...osssssssso...',
  '..osssssssssso..',
  '..osssssssssso..',
  '..osssssssssso..',
  '..ossssssssssso.',
  '..ossssssssssso.',
  '..osssssssssso..',
  '...osssssssso...',
  '....oossssoo....',
  '......onno......',
];

const TORSO_SIDE: Grid = [
  '....obbbbbbo....',
  '....oboaaobo....',
  '....oboaaobo....',
  '....oboaaobo....',
  '....oboaaobo....',
  '....oboaaobo....',
  '....oboaaobo....',
  '....oboAAobo....',
  '....oboooobo....',
  '....obbbbbbo....',
];

const LEGS_SIDE: Grid = [
  '.....ollllo.....',
  '.....ollllo.....',
  '.....ollllo.....',
  '.....ollllo.....',
  '.....ollllo.....',
  '.....ollllo.....',
  '.....ollllo.....',
  '.....ollllo.....',
  '.....ollllo.....',
  '.....offfffo....',
  '.....ooooooo....',
];

const LEGS_SIDE_STEP: Grid = [
  '.....ollllo.....',
  '.....ollllo.....',
  '....ollolllo....',
  '....ollo.ollo...',
  '...ollo..ollo...',
  '...ollo...ollo..',
  '..ollo....ollo..',
  '..ollo....ollo..',
  '..ollo....ollo..',
  '..offo....offfo.',
  '..oooo....ooooo.',
];

function mirror(grid: Grid): string[] {
  return grid.map((row) => [...row].reverse().join(''));
}

const FRONT_BODY: Grid[] = [LEGS_FRONT, LEGS_FRONT_STEP, mirror(LEGS_FRONT_STEP)].map((legs) => [
  ...HEAD_FRONT,
  ...TORSO_FRONT,
  ...legs,
]);

/** Her back is her front without a face, and the face is a layer of its own. */
export const BODY: Record<View, readonly Grid[]> = {
  front: FRONT_BODY,
  back: FRONT_BODY,
  side: [LEGS_SIDE, LEGS_SIDE_STEP, LEGS_SIDE].map((legs) => [
    ...HEAD_SIDE,
    ...TORSO_SIDE,
    ...legs,
  ]),
};

/** Rows of the body the clothes are measured against. */
const SHOULDER = 11;
const SLEEVE = 12;
/** The last row of her arm above her hand, where a long sleeve ends. */
const CUFF = 17;
const HEM = 19;
const WAIST = 20;

/** Keeps a painted pixel, or leaves it clear so what is underneath shows. */
type Painter = (key: string, row: number, col: number) => string | null;

export function paint(body: Grid, painter: Painter): string[] {
  return body.map((line, r) => [...line].map((key, c) => painter(key, r, c) ?? '.').join(''));
}

/** Lays `top` over `base` from row `at` down (and column `left` across); `.` lets `base` show. */
export function stamp(base: readonly string[], top: Grid, at: number, left = 0): string[] {
  const out = base.map((row) => [...row]);
  top.forEach((line, i) => {
    const row = out[at + i];
    if (!row) return;
    [...line].forEach((ch, j) => {
      if (ch !== '.' && left + j < row.length) row[left + j] = ch;
    });
  });
  return out.map((row) => row.join(''));
}

const DOLL_WIDTH = 16;
const DOLL_HEIGHT = 32;

export const EMPTY: Grid = Array.from({ length: DOLL_HEIGHT }, () => '.'.repeat(DOLL_WIDTH));

/** How many rows above a foot pixel (r, c) is, straight down her leg; Infinity if not on one. */
function aboveFoot(body: Grid, r: number, c: number): number {
  for (let rr = r + 1; rr < body.length; rr++) {
    const key = body[rr]![c];
    if (key === 'f') return rr - r;
    if (key !== 'l') return Infinity;
  }
  return Infinity;
}

/**
 * Which end of a foot a foot pixel is. From the side she faces right in the grid, so the heel is a
 * foot's left end and the toe its right; from the front they are just its two sides.
 */
function footEnd(body: Grid, r: number, c: number): 'heel' | 'toe' | 'both' | null {
  const row = body[r]!;
  if (row[c] !== 'f') return null;
  const heel = row[c - 1] !== 'f';
  const toe = row[c + 1] !== 'f';
  return heel && toe ? 'both' : heel ? 'heel' : toe ? 'toe' : null;
}

/** Whether (r, c) is the outline just under a foot pixel, where a sole or a heel would be. */
function underFoot(body: Grid, r: number, c: number): boolean {
  return body[r]![c] === 'o' && body[r - 1]?.[c] === 'f';
}

/** A heel is drawn under the back of each foot, and shows only from the side. */
function underHeel(body: Grid, view: View, r: number, c: number): boolean {
  if (view !== 'side' || !underFoot(body, r, c)) return false;
  const end = footEnd(body, r - 1, c);
  return end === 'heel' || end === 'both';
}

// ---- Drawn by hand: the face, hair, hats, glasses, and anything that isn't painted on ----

export const EYES: Record<Exclude<View, 'back'>, Grid> = {
  front: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....e....e.....',
    '.....i....i.....',
    '....c......c....',
    '.......uu.......',
  ],
  side: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '...........e....',
    '...........i....',
    '............c...',
    '............u...',
  ],
};

/**
 * Hair is drawn in `h` and `H` (its shade). `hairRows` then splits it into her left half and her
 * right half, which is how split dye works on every style. The face shows through columns 4–11
 * from the eyes down, so every style leaves her eyes and cheeks clear.
 */
export const HAIR: Record<'long' | 'bob' | 'bunches' | 'pixie', Record<View, Grid>> = {
  long: {
    front: [
      '...oooooooooo...',
      '..ohhhhhhhhhho..',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhH....Hhhho.',
      '.ohhH......Hhho.',
      '.ohH........Hho.',
      '.ohH........Hho.',
      '.ohH........Hho.',
      '.ohhH......Hhho.',
      '.ohhho....ohhho.',
      '.ohho......ohho.',
      '.ohho......ohho.',
      '.oHho......ohHo.',
      '..oHo......oHo..',
      '...o........o...',
    ],
    back: [
      '...oooooooooo...',
      '..ohhhhhhhhhho..',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.oHhhhhhhhhhhHo.',
      '..oHhhhhhhhhHo..',
      '...oHHhhhhHHo...',
      '....oooooooo....',
    ],
    side: [
      '...ooooooooo....',
      '..ohhhhhhhhho...',
      '.ohhhhhhhhhhho..',
      '.ohhhhhhhhhhHo..',
      '.ohhhhhhhhH.....',
      '.ohhhhhhhH......',
      '.ohhhhhhhH......',
      '.ohhhhhhH.......',
      '.ohhhhhhH.......',
      '.ohhhhhho.......',
      '.ohhhhho........',
      '.ohhhho.........',
      '.ohhhho.........',
      '.ohhhho.........',
      '..ohHo..........',
      '...oo...........',
    ],
  },
  bob: {
    front: [
      '...oooooooooo...',
      '..ohhhhhhhhhho..',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhH......Hhho.',
      '.ohH........Hho.',
      '.ohH........Hho.',
      '.ohH........Hho.',
      '.ohH........Hho.',
      '.ohhH......Hhho.',
      '.oHHHo....oHHHo.',
      '..oo........oo..',
    ],
    back: [
      '...oooooooooo...',
      '..ohhhhhhhhhho..',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.oHHHHHHHHHHHHo.',
      '..oooooooooooo..',
    ],
    side: [
      '...ooooooooo....',
      '..ohhhhhhhhho...',
      '.ohhhhhhhhhhho..',
      '.ohhhhhhhhhhHo..',
      '.ohhhhhhhhH.....',
      '.ohhhhhhhH......',
      '.ohhhhhhhH......',
      '.ohhhhhhhH......',
      '.ohhhhhhhH......',
      '.oHHHHHHHo......',
      '..ooooooo.......',
    ],
  },
  bunches: {
    front: [
      '...oooooooooo...',
      '..ohhhhhhhhhho..',
      '.ohhhhhhhhhhhho.',
      'oohhhhhhhhhhhhoo',
      'ohhohH....Hhohho',
      'ohhoH......Hohho',
      'ohho........ohho',
      'ohho........ohho',
      'ohho........ohho',
      'oHho........ohHo',
      'oHho........ohHo',
      '.oHo........oHo.',
      '.oHo........oHo.',
      '..o..........o..',
    ],
    back: [
      '...oooooooooo...',
      '..ohhhhhhhhhho..',
      '.ohhhhhhhhhhhho.',
      'oohhhhhhhhhhhhoo',
      'ohhohhhhhhhhohho',
      'ohhohhhhhhhhohho',
      'ohhohhhhhhhhohho',
      'ohhohhhhhhhhohho',
      'ohhohhhhhhhhohho',
      'oHhoHhhhhhhHohHo',
      'oHho.oooooo.ohHo',
      '.oHo........oHo.',
      '.oHo........oHo.',
      '..o..........o..',
    ],
    side: [
      '...ooooooooo....',
      '..ohhhhhhhhho...',
      '.ohhhhhhhhhhho..',
      'oohhhhhhhhhhHo..',
      'ohhhhhhhhhH.....',
      'ohhhhhhhhH......',
      'ohhhhhhhhH......',
      'ohhhhhhhH.......',
      'ohhoohhhH.......',
      'oHho.ohho.......',
      'oHho..oo........',
      '.oHo............',
      '.oHo............',
      '..o.............',
    ],
  },
  pixie: {
    front: [
      '...oooooooooo...',
      '..ohhhhhhhhhho..',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhH.Ho.',
      '.ohhhhhH....Hho.',
      '..oH........Ho..',
      '..oH........Ho..',
    ],
    back: [
      '...oooooooooo...',
      '..ohhhhhhhhhho..',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '.ohhhhhhhhhhhho.',
      '..oHhhhhhhhhHo..',
      '...oHHHHHHHHo...',
      '....oooooooo....',
    ],
    side: [
      '...ooooooooo....',
      '..ohhhhhhhhho...',
      '.ohhhhhhhhhhho..',
      '.ohhhhhhhhhhHo..',
      '.ohhhhhhhhHo....',
      '.ohhhhhhHo......',
      '.ohhhhhHo.......',
      '.ohhhhHo........',
      '.oHhhHo.........',
      '..oooo..........',
    ],
  },
};

const BEANIE: Record<View, Grid> = {
  front: ['...ooooxxoooo...', '..ommmmmmmmmmo..', '.ommmMmmmmMmmmo.', '.oMMMMMMMMMMMMo.'],
  back: ['...ooooxxoooo...', '..ommmmmmmmmmo..', '.ommmMmmmmMmmmo.', '.oMMMMMMMMMMMMo.'],
  side: ['...oooxxoooo....', '..ommmmmmmmmo...', '.ommMmmmmMmmmo..', '.oMMMMMMMMMMMo..'],
};

/** A witch hat, squashed to fit above her eyes, its tip flopped over the way they always are. */
const WITCH_HAT: Record<View, Grid> = {
  front: [
    '....oooooooo.oo.',
    '...ommmmmmmmomMo',
    '...ommmmmmmmMMo.',
    '..oxxxxxxxxxxo..',
    'oMMMMMMMMMMMMMMo',
  ],
  back: [
    '.oo.oooooooo....',
    'oMmommmmmmmmo...',
    '.oMMmmmmmmmmo...',
    '..oxxxxxxxxxxo..',
    'oMMMMMMMMMMMMMMo',
  ],
  side: [
    '.oo.oooooooo....',
    'oMmommmmmmmmo...',
    '.oMMmmmmmmmmo...',
    '..oxxxxxxxxxxo..',
    'oMMMMMMMMMMMMMo.',
  ],
};

/** Cat ears on a headband, pink inside where they face her way. */
const CAT_EARS: Record<View, Grid> = {
  front: ['..oo........oo..', '..omo......omo..', '..oxmo....omxo..', '...oMMMMMMMMo...'],
  back: ['..oo........oo..', '..omo......omo..', '..ommo....ommo..', '...oMMMMMMMMo...'],
  side: ['......oo..oo....', '......omo.omo...', '.....omxo.oxmo..', '...oMMMMMMMMo...'],
};

/** A ring of little flowers with leaves between them, over the top of her head. */
const FLOWER_CROWN: Record<View, Grid> = {
  front: ['..y.mm.yy.mm.y..', '.ymmxmmyymmxmmy.', '..yymmyyyymmyy..'],
  back: ['..y.mm.yy.mm.y..', '.ymmxmmyymmxmmy.', '..yymmyyyymmyy..'],
  side: ['.....mm.yy.mm...', '....mmxmyymxmmy.', '....yymmyyyymy..'],
};

/** A wide-brimmed straw hat with a ribbon round it, for a day in the garden. */
const SUN_HAT: Record<View, Grid> = {
  front: ['...oooooooooo...', '..ommmmmmmmmmo..', '..oyyyyyyyyyyo..', 'oMMMMMMMMMMMMMMo'],
  back: ['...oooooooooo...', '..ommmmmmmmmmo..', '..oyyyyyyyyyyo..', 'oMMMMMMMMMMMMMMo'],
  side: ['...ooooooooo....', '..ommmmmmmmmo...', '..oyyyyyyyyyo...', 'oMMMMMMMMMMMMMo.'],
};

const GLASSES: Record<'roundGlasses' | 'catEyeGlasses', Record<Exclude<View, 'back'>, Grid>> = {
  roundGlasses: {
    front: [
      '................',
      '................',
      '................',
      '................',
      '....mmm..mmm....',
      '..mm...mm...mm..',
      '...m...mm...m...',
      '....mmm..mmm....',
    ],
    side: [
      '................',
      '................',
      '................',
      '................',
      '.........mmmm...',
      '......mmmm..m...',
      '.........m..m...',
      '.........mmmm...',
    ],
  },
  catEyeGlasses: {
    front: [
      '................',
      '................',
      '................',
      '..m..........m..',
      '...mmmm..mmmm...',
      '..mm...mm...mm..',
      '...m...mm...m...',
      '....mmm..mmm....',
    ],
    side: [
      '................',
      '................',
      '................',
      '.............m..',
      '.........mmmm...',
      '......mmmm..m...',
      '.........m..m...',
      '.........mmmm...',
    ],
  },
};

/** The skirt of a dress, which flares past her legs and so can't be painted on. */
const DRESS_SKIRT: Record<View, Grid> = {
  front: [
    '....ommmmmmo....',
    '...ommmmmmmmo...',
    '...ommmmmmmmo...',
    '..ommmmmmmmmmo..',
    '..ommmmmmmmmmo..',
    '..oMMMMMMMMMMo..',
    '..oooooooooooo..',
  ],
  back: [
    '....ommmmmmo....',
    '...ommmmmmmmo...',
    '...ommmmmmmmo...',
    '..ommmmmmmmmmo..',
    '..ommmmmmmmmmo..',
    '..oMMMMMMMMMMo..',
    '..oooooooooooo..',
  ],
  side: [
    '....ommmmmmo....',
    '....ommmmmmmo...',
    '...ommmmmmmmo...',
    '...ommmmmmmmmo..',
    '..ommmmmmmmmmo..',
    '..oMMMMMMMMMMMo.',
    '..ooooooooooooo.',
  ],
};

const PLEATED_SKIRT: Record<View, Grid> = {
  front: [
    '....oMMMMMMo....',
    '...omMmMmMmMo...',
    '...omMmMmMmMo...',
    '..omMmMmMmMmMo..',
    '..oooooooooooo..',
  ],
  back: [
    '....oMMMMMMo....',
    '...omMmMmMmMo...',
    '...omMmMmMmMo...',
    '..omMmMmMmMmMo..',
    '..oooooooooooo..',
  ],
  side: [
    '....oMMMMMMo....',
    '....omMmMmMmo...',
    '...omMmMmMmMo...',
    '...omMmMmMmMmo..',
    '...ooooooooooo..',
  ],
};

/** What is drawn on a piece beyond its cut: a band tee's print, a pendant, a dress's pattern. */
interface OutfitArt {
  /** Centred on her chest from the front. */
  print?: Grid;
  /** Centred between her shoulder blades from behind. */
  backPrint?: Grid;
  /** Across the front of a dress's skirt, which is wider than her chest. */
  skirtPrint?: Grid;
  /** Hung from a chain, centred under her chin. */
  pendant?: Grid;
  /** Over the piece's main colour: little flowers, checks, dots, or glitter for shoes. */
  pattern?: 'floral' | 'gingham' | 'dots' | 'glitter' | 'patchwork';
  /** Colours of `x` and `y` in the art, when they aren't white and black. */
  accents?: { x?: string; y?: string };
}

const NUMBER_49: Grid = ['x.xxxx', 'x.xx.x', 'xxxxxx', '..x..x', '..xxxx'];

const BONE: Grid = ['x....x', '.xxxx.', 'x....x'];

const OUTFIT_ART: Record<OutfitId, OutfitArt> = {
  // A butterfly, for Dolly's.
  teeGhoulyParton: {
    print: ['xx..xx', 'xxyyxx', '.x..x.'],
    accents: { x: C.candle, y: C.inkFabric },
  },
  // A lightning bolt, a crescent moon and a heart.
  teeLadyGhoulga: { print: ['..xx', '.xx.', 'xx..'], accents: { x: C.candle } },
  teeFleetwoodMacabre: { print: ['.xx.', 'x...', '.xx.'], accents: { x: C.candleBright } },
  teeScreamDion: { print: ['.x..x.', 'xxxxxx', '.xxxx.', '..xx..'], accents: { x: C.rose } },
  cozyTee: {},
  jerseyTigers: { print: NUMBER_49, backPrint: NUMBER_49, accents: { x: C.white, y: C.inkFabric } },
  sundressFloral: { pattern: 'floral' },
  sundressGingham: { pattern: 'gingham' },
  wednesdayDress: {},
  jeans: {},
  cutoffs: {},
  pleatedSkirt: {},
  sneakers: {},
  stompyBoots: {},
  maryJanes: {},
  pumpkinBeanie: { accents: { x: C.mossLight } },
  batPendant: { pendant: ['MMMM', '.MM.'] },
  moonLocket: { pendant: ['.MM.', '.MM.'] },
  pearlStrand: {},
  roundGlasses: {},
  catEyeGlasses: {},
  teeBoneJovi: { print: BONE },
  jerseyScarlet: { accents: { y: C.silver } },
  sundressDots: { pattern: 'dots' },
  glitterHeels: { pattern: 'glitter' },
  velvetPumps: {},
  // White soles under a strap, for a bit of height.
  platformMaryJanes: {},
  batBowFlats: { accents: { x: C.inkFabric } },
  rhinestoneBoots: { pattern: 'glitter' },
  kneeHighBoots: {},
  moonbeamSandals: { accents: { x: C.candleBright } },
  witchHat: { accents: { x: C.candle } },
  catEars: { accents: { x: C.roseLight } },
  // A ribcage, down the front.
  skeletonTee: { print: ['..xx..', 'xx..xx', '..xx..', 'xx..xx', '..xx..'] },
  jackOLanternDress: { skirtPrint: ['.yy..yy.', '.yy..yy.', 'y......y', '.yyyyyy.'] },
  // An open book, and a cupcake.
  bookwormTee: { print: ['xx.xx', 'xxyxx', 'xxyxx'] },
  flowerCrown: { accents: { x: C.candle, y: C.leaf } },
  crumbsTee: { print: ['.xx.', 'xxxx', 'yyyy', '.yy.'], accents: { x: C.roseLight, y: C.wood } },
  starryDress: { pattern: 'glitter', accents: { x: C.candleBright } },
  strawSunHat: { accents: { y: C.rose } },
  maroonTee: {},
  manyColoursCoat: { pattern: 'patchwork', accents: { x: C.candle, y: C.roseLight } },
};

function centred(grid: Grid): number {
  return 8 - Math.ceil((grid[0]?.length ?? 0) / 2);
}

const PATCHES = ['m', 'x', 'y', 'M'] as const;

function withPattern(rows: string[], pattern: OutfitArt['pattern']): string[] {
  if (!pattern) return rows;
  return rows.map((line, r) =>
    [...line]
      .map((ch, c) => {
        if (ch !== 'm') return ch;
        // Little flowers in staggered rows, like a print on cotton.
        if (pattern === 'floral')
          return r % 3 === 1 && (c + (r % 6 === 1 ? 0 : 2)) % 4 === 1 ? 'x' : ch;
        if (pattern === 'dots')
          return r % 2 === 0 && (c + (r % 4 === 0 ? 0 : 2)) % 4 === 1 ? 'x' : ch;
        // A sparkle here and there, dense enough that even a pair of heels catches one.
        if (pattern === 'glitter') return (r * 5 + c * 3) % 7 === 0 ? 'x' : ch;
        // Squares of three colours and the fabric's shade, like a quilt.
        if (pattern === 'patchwork')
          return PATCHES[(Math.floor(r / 3) + 2 * Math.floor(c / 3)) % 4]!;
        return ((r >> 1) + (c >> 1)) % 2 === 0 ? 'x' : ch;
      })
      .join(''),
  );
}

/** One piece of clothing's layer, for one facing and frame, before its colours. */
export function pieceRows(worn: Worn, view: View, body: Grid): string[] {
  const art = OUTFIT_ART[worn.id];
  return withPattern(cutRows(OUTFITS[worn.id].cut, art, view, body), art.pattern);
}

function cutRows(cut: CutId, art: OutfitArt, view: View, body: Grid): string[] {
  const front = view === 'front';
  switch (cut) {
    case 'tee':
    case 'jersey':
    case 'threeQuarterTee': {
      // A ¾ sleeve stops two rows short of her wrist, with a turned-back cuff.
      const sleeve = cut === 'threeQuarterTee' ? CUFF - 2 : SLEEVE + 1;
      let rows = paint(body, (k, r, c) => {
        if (k === 'b' && r <= HEM) return r === HEM ? 'M' : 'm';
        if (k === 'a' && r <= sleeve) return r === sleeve && sleeve !== SLEEVE + 1 ? 'M' : 'm';
        if (cut === 'jersey' && k === 'a' && r === SLEEVE + 2) return (r + c) % 2 ? 'y' : 'm';
        return null;
      });
      // A print ends just above the hem, however tall it is.
      if (front && art.print) {
        rows = stamp(rows, art.print, HEM - art.print.length, centred(art.print));
      }
      if (view === 'back' && art.backPrint) {
        rows = stamp(rows, art.backPrint, SLEEVE + 1, centred(art.backPrint));
      }
      return rows;
    }
    case 'sundress': {
      const straps = view === 'side' ? [8] : [5, 10];
      let rows = paint(body, (k, r, c) => {
        if (k !== 'b') return null;
        // A scooped neck: straps only, for the top two rows of her.
        if (r <= SHOULDER + 1) return straps.includes(c) ? 'm' : null;
        return 'm';
      });
      if (front && art.print) {
        rows = stamp(rows, art.print, HEM - art.print.length, centred(art.print));
      }
      rows = stamp(rows, DRESS_SKIRT[view], WAIST);
      if (front && art.skirtPrint) {
        rows = stamp(rows, art.skirtPrint, WAIST + 1, centred(art.skirtPrint));
      }
      return rows;
    }
    case 'collarDress': {
      const collar =
        view === 'side' ? [9, 10] : view === 'front' ? [5, 6, 9, 10] : [4, 5, 6, 7, 8, 9, 10, 11];
      const rows = paint(body, (k, r, c) => {
        if (k === 'b') return r === SHOULDER && collar.includes(c) ? 'x' : 'm';
        if (k === 'a') return r === CUFF ? 'x' : 'm';
        return null;
      });
      return stamp(rows, DRESS_SKIRT[view], WAIST);
    }
    case 'jeans':
      return paint(body, (k, r, c) => {
        if (k === 'b' && r === WAIST) return 'M';
        if (k === 'l') return aboveFoot(body, r, c) === 1 ? 'M' : 'm';
        return null;
      });
    case 'cutoffs':
      return paint(body, (k, r) => {
        if (k === 'b' && r === WAIST) return 'M';
        if (k === 'l' && r <= WAIST + 3) return r === WAIST + 3 ? 'M' : 'm';
        return null;
      });
    case 'pleatedSkirt':
      return stamp(EMPTY, PLEATED_SKIRT[view], WAIST);
    case 'sneakers':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        const up = k === 'l' ? aboveFoot(body, r, c) : Infinity;
        return up === 1 ? 'm' : up === 2 ? 'x' : null;
      });
    case 'boots':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        const up = k === 'l' ? aboveFoot(body, r, c) : Infinity;
        return up <= 3 ? 'm' : up === 4 ? 'M' : null;
      });
    case 'maryJanes':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        return k === 'l' && aboveFoot(body, r, c) === 1 ? 'x' : null;
      });
    case 'heels':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        return underHeel(body, view, r, c) ? 'M' : null;
      });
    case 'platforms':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        if (underFoot(body, r, c)) return 'x';
        return k === 'l' && aboveFoot(body, r, c) === 1 ? 'M' : null;
      });
    case 'flats':
      // A little bow on each: on the toe from the side, and on the inside of each foot from the front.
      return paint(body, (k, r, c) => {
        if (k !== 'f') return null;
        if (view === 'side') return footEnd(body, r, c) === 'toe' ? 'x' : 'm';
        return view === 'front' && (c === 6 || c === 9) ? 'x' : 'm';
      });
    case 'tallBoots':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        if (underHeel(body, view, r, c)) return 'M';
        const up = k === 'l' ? aboveFoot(body, r, c) : Infinity;
        return up <= 5 ? 'm' : up === 6 ? 'M' : null;
      });
    case 'sandals':
      // Straps with her toes showing between them, a thin sole, and a shining ankle strap.
      return paint(body, (k, r, c) => {
        if (k === 'f') return (r + c) % 2 === 0 ? 'm' : null;
        if (underFoot(body, r, c)) return 'M';
        return k === 'l' && aboveFoot(body, r, c) === 1 ? 'x' : null;
      });
    case 'beanie':
      return stamp(EMPTY, BEANIE[view], 0);
    case 'witchHat':
      return stamp(EMPTY, WITCH_HAT[view], 0);
    case 'catEars':
      return stamp(EMPTY, CAT_EARS[view], 0);
    case 'flowerCrown':
      return stamp(EMPTY, FLOWER_CROWN[view], 0);
    case 'sunHat':
      return stamp(EMPTY, SUN_HAT[view], 0);
    case 'chainPendant':
    case 'pearls': {
      if (view === 'back') return [...EMPTY];
      const pearls = cut === 'pearls';
      if (view === 'side') {
        const chain = ['........m.......', pearls ? '.........mm.....' : '.........m......'];
        const rows = stamp(EMPTY, chain, SHOULDER);
        return pearls ? rows : stamp(rows, ['M'], SHOULDER + 2, 10);
      }
      const chain = ['.....m....m.....', pearls ? '......mmmm......' : '......m..m......'];
      const rows = stamp(EMPTY, chain, SHOULDER);
      return art.pendant ? stamp(rows, art.pendant, SHOULDER + 2, centred(art.pendant)) : rows;
    }
    case 'roundGlasses':
    case 'catEyeGlasses':
      return view === 'back' ? [...EMPTY] : stamp(EMPTY, GLASSES[cut][view], 0);
  }
}

/**
 * Hair in her left and right halves' keys. From the front her left is on the viewer's right;
 * from behind it's on the left. From the side only the near half shows.
 */
export function hairRows(style: Record<View, Grid>, facing: Facing): string[] {
  const view = viewOf(facing);
  const rows = stamp(EMPTY, style[view], 0);
  const leftHalf = (c: number): boolean => {
    if (facing === 'down') return c >= 8;
    if (facing === 'up') return c < 8;
    return facing === 'left';
  };
  return rows.map((line) =>
    [...line]
      .map((ch, c) => {
        if (ch !== 'h' && ch !== 'H') return ch;
        if (leftHalf(c)) return ch;
        return ch === 'h' ? 'g' : 'G';
      })
      .join(''),
  );
}

/**
 * Everything a piece of clothing's layer can use, from its fabric (or a colour of its own, for a
 * neighbour's clothes) and its accents.
 */
export function wornPalette(worn: Worn, tone: Tone = FABRIC_TONES[worn.fabric]): Palette {
  const accents = OUTFIT_ART[worn.id].accents;
  return {
    '.': null,
    o: C.ink,
    m: tone.main,
    M: tone.shade,
    x: accents?.x ?? C.white,
    y: accents?.y ?? C.inkFabric,
  };
}

/** The body's region keys, all in one skin. */
export function skinPalette(skin: Tone): Palette {
  return {
    '.': null,
    o: C.ink,
    s: skin.main,
    b: skin.main,
    a: skin.main,
    l: skin.main,
    n: skin.shade,
    A: skin.shade,
    f: skin.shade,
  };
}

export function eyesPalette(iris: string): Palette {
  return { '.': null, e: C.ink, i: iris, c: C.cheek, u: C.rose };
}

export function hairPalette(hair: HairTones): Palette {
  return {
    '.': null,
    o: C.ink,
    h: hair.left.main,
    H: hair.left.shade,
    g: hair.right.main,
    G: hair.right.shade,
  };
}
