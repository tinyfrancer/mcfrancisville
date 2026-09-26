import { OUTFITS } from '../data/outfits';
import type { CutId, Facing, HairStyleId, OutfitId, Slot } from '../types/ids';
import type { Look, Worn } from '../types/look';
import { EYE_COLOURS, FABRIC_TONES, HAIR_TONES, SKIN_TONES } from './lookColours';
import { PALETTE as C } from './palette';
import type { Layer, Palette } from './sprite';

/*
 * Her, as a paper doll: a body and a stack of layers drawn over it, each a 16×32 grid per facing
 * and walk frame. Left is right, flipped when it is baked.
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

type Grid = readonly string[];

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

function paint(body: Grid, painter: Painter): string[] {
  return body.map((line, r) => [...line].map((key, c) => painter(key, r, c) ?? '.').join(''));
}

/** Lays `top` over `base` from row `at` down (and column `left` across); `.` lets `base` show. */
function stamp(base: readonly string[], top: Grid, at: number, left = 0): string[] {
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

export const DOLL_WIDTH = 16;
export const DOLL_HEIGHT = 32;

const EMPTY: Grid = Array.from({ length: DOLL_HEIGHT }, () => '.'.repeat(DOLL_WIDTH));

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

const EYES: Record<Exclude<View, 'back'>, Grid> = {
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

/** An earlobe with a gauge in it, drawn over the hair so it peeks out of any style. */
const GAUGES: Record<Exclude<View, 'back'>, Grid> = {
  front: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '..o..........o..',
    '.os..........so.',
    '.ok..........ko.',
    '..o..........o..',
  ],
  side: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....os.........',
    '.....ok.........',
    '......o.........',
  ],
};

/**
 * Hair is drawn in `h` and `H` (its shade). `hairRows` then splits it into her left half and her
 * right half, which is how split dye works on every style. The face shows through columns 4–11
 * from the eyes down, so every style leaves her eyes and cheeks clear.
 */
const HAIR: Record<HairStyleId, Record<View, Grid>> = {
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
export interface OutfitArt {
  /** Centred on her chest from the front. */
  print?: Grid;
  /** Centred between her shoulder blades from behind. */
  backPrint?: Grid;
  /** Across the front of a dress's skirt, which is wider than her chest. */
  skirtPrint?: Grid;
  /** Hung from a chain, centred under her chin. */
  pendant?: Grid;
  /** Over the piece's main colour: little flowers, checks, dots, or glitter for shoes. */
  pattern?: 'floral' | 'gingham' | 'dots' | 'glitter';
  /** Colours of `x` and `y` in the art, when they aren't white and black. */
  accents?: { x?: string; y?: string };
}

const NUMBER_49: Grid = ['x.xxxx', 'x.xx.x', 'xxxxxx', '..x..x', '..xxxx'];

/** A bone, for Bone Jovi. The records are sleeved in the same prints as the tees. */
export const BONE: Grid = ['x....x', '.xxxx.', 'x....x'];

export const OUTFIT_ART: Record<OutfitId, OutfitArt> = {
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
};

function centred(grid: Grid): number {
  return 8 - Math.ceil((grid[0]?.length ?? 0) / 2);
}

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
        return ((r >> 1) + (c >> 1)) % 2 === 0 ? 'x' : ch;
      })
      .join(''),
  );
}

/** One piece of clothing's layer, for one facing and frame, before its colours. */
function pieceRows(worn: Worn, view: View, body: Grid): string[] {
  const art = OUTFIT_ART[worn.id];
  return withPattern(cutRows(OUTFITS[worn.id].cut, art, view, body), art.pattern);
}

function cutRows(cut: CutId, art: OutfitArt, view: View, body: Grid): string[] {
  const front = view === 'front';
  switch (cut) {
    case 'tee':
    case 'jersey': {
      let rows = paint(body, (k, r, c) => {
        if (k === 'b' && r <= HEM) return r === HEM ? 'M' : 'm';
        if (k === 'a' && r <= SLEEVE + 1) return 'm';
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
function hairRows(style: HairStyleId, facing: Facing): string[] {
  const view = viewOf(facing);
  const rows = stamp(EMPTY, HAIR[style][view], 0);
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

function tattooRows(tattoos: NonNullable<Look['tattoos']>, body: Grid, view: View): string[] {
  const scattered: Record<View, [number, number, string][]> = {
    front: [
      [14, 3, 'k'],
      [16, 2, 'k'],
      [15, 2, 'K'],
      [14, 12, 'K'],
      [15, 13, 'k'],
      [17, 12, 'k'],
    ],
    back: [
      [14, 2, 'k'],
      [16, 3, 'K'],
      [15, 12, 'k'],
    ],
    side: [
      [14, 8, 'k'],
      [16, 7, 'K'],
    ],
  };
  return paint(body, (k, r, c) => {
    if (k !== 'a') return null;
    if (tattoos === 'sleeves') return (r + c) % 2 === 0 ? 'k' : r % 3 === 0 ? 'K' : null;
    return scattered[view].find(([sr, sc]) => sr === r && sc === c)?.[2] ?? null;
  });
}

/** Everything a piece of clothing's layer can use, from its fabric and its accents. */
function wornPalette(worn: Worn): Palette {
  const tone = FABRIC_TONES[worn.fabric];
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

/** The order clothes go on, over the body, eyes and tattoos and under the hair. */
const WORN_ORDER: readonly Slot[] = ['bottom', 'top', 'shoes', 'necklace'];

/**
 * Her, in layers, bottom first: body, eyes, tattoos, bottom, top or dress, shoes, necklace, hair,
 * gauges, hat, glasses. Gauges go over the hair so they peek out of any style, and a dress hides
 * the bottom it covers.
 */
export function dollLayers(look: Look, facing: Facing, frame: number): Layer[] {
  const view = viewOf(facing);
  const body = BODY[view][frame % DOLL_FRAMES]!;
  const skin = SKIN_TONES[look.skin];
  const layers: Layer[] = [];
  const add = (rows: readonly string[], palette: Palette) =>
    layers.push({ source: { rows }, palette });

  add(body, {
    '.': null,
    o: C.ink,
    s: skin.main,
    b: skin.main,
    a: skin.main,
    l: skin.main,
    n: skin.shade,
    A: skin.shade,
    f: skin.shade,
  });
  if (view !== 'back') {
    add(stamp(EMPTY, EYES[view], 0), {
      '.': null,
      e: C.ink,
      i: EYE_COLOURS[look.eyes],
      c: C.cheek,
      u: C.rose,
    });
  }
  if (look.tattoos) {
    add(tattooRows(look.tattoos, body, view), { '.': null, k: C.tattooInk, K: C.tattooRose });
  }

  const dressed = OUTFITS[look.outfit.top?.id ?? 'cozyTee'].dress === true;
  for (const slot of WORN_ORDER) {
    const worn = look.outfit[slot];
    if (!worn || (slot === 'bottom' && dressed)) continue;
    add(pieceRows(worn, view, body), wornPalette(worn));
  }

  const hair = HAIR_TONES[look.hairColour];
  add(hairRows(look.hairStyle, facing), {
    '.': null,
    o: C.ink,
    h: hair.left.main,
    H: hair.left.shade,
    g: hair.right.main,
    G: hair.right.shade,
  });
  if (look.gauges && view !== 'back') {
    add(stamp(EMPTY, GAUGES[view], 0), { '.': null, o: C.ink, s: skin.main, k: C.iron });
  }
  for (const slot of ['hat', 'glasses'] as const) {
    const worn = look.outfit[slot];
    if (worn) add(pieceRows(worn, view, body), wornPalette(worn));
  }
  return layers;
}

/** Names a look's picture for the bake cache. The name she typed doesn't change how she looks. */
export function dollKey(look: Look, facing: Facing, frame: number): string {
  const worn = (['top', 'bottom', 'shoes', 'hat', 'necklace', 'glasses'] as const)
    .map((slot) => {
      const w = look.outfit[slot];
      return w ? `${w.id}/${w.fabric}` : '-';
    })
    .join(',');
  const body = [look.skin, look.eyes, look.hairStyle, look.hairColour, look.gauges, look.tattoos];
  return `doll:${facing}:${frame % DOLL_FRAMES}:${body.join(',')}:${worn}`;
}
