import { OUTFITS } from '../data/outfits';
import type { CutId, Facing, HairStyleId, OutfitId, Slot } from '../types/ids';
import type { Look, Worn } from '../types/look';
import { EYE_COLOURS, FABRIC_TONES, HAIR_TONES, SKIN_TONES } from './lookColours';
import { PALETTE as C } from './palette';
import type { Layer, Palette } from './sprite';

/*
 * Her, as a paper doll: a body and a stack of layers drawn over it, each a 16×24 grid per facing
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
  '.....oooooo.....',
  '....osssssso....',
  '...osssssssso...',
  '...osssssssso...',
  '...osssssssso...',
  '...osssssssso...',
  '...osssssssso...',
  '....osssssso....',
  '.....onnnno.....',
];

const TORSO_FRONT: Grid = [
  '..oobbbbbbbboo..',
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
  '....offooffo....',
  '....oooooooo....',
];

/** Her right foot lifted; the other walk frame is this mirrored. */
const LEGS_FRONT_STEP: Grid = [
  '....ollllllo....',
  '....olloollo....',
  '....olloollo....',
  '....olloollo....',
  '....offoollo....',
  '....oooooffo....',
  '........oooo....',
];

const HEAD_SIDE: Grid = [
  '.....oooooo.....',
  '....osssssso....',
  '...osssssssso...',
  '...osssssssso...',
  '...ossssssssso..',
  '...ossssssssso..',
  '...osssssssso...',
  '....osssssso....',
  '......onno......',
];

const TORSO_SIDE: Grid = [
  '....obbbbbbo....',
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
  '.....offfffo....',
  '.....ooooooo....',
];

const LEGS_SIDE_STEP: Grid = [
  '.....ollllo.....',
  '....ollolllo....',
  '...ollo.ollo....',
  '...ollo..ollo...',
  '..ollo...ollo...',
  '..offo...offfo..',
  '..oooo...ooooo..',
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
const SHOULDER = 9;
const SLEEVE = 10;
const HEM = 15;
const WAIST = 16;

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

const EMPTY: Grid = Array.from({ length: 24 }, () => '.'.repeat(16));

/** How many rows above a foot pixel (r, c) is, straight down her leg; Infinity if not on one. */
function aboveFoot(body: Grid, r: number, c: number): number {
  for (let rr = r + 1; rr < body.length; rr++) {
    const key = body[rr]![c];
    if (key === 'f') return rr - r;
    if (key !== 'l') return Infinity;
  }
  return Infinity;
}

// ---- Drawn by hand: the face, hair, hats, glasses, and anything that isn't painted on ----

const EYES: Record<Exclude<View, 'back'>, Grid> = {
  front: [
    '................',
    '................',
    '................',
    '................',
    '.....e....e.....',
    '.....i....i.....',
    '....c......c....',
  ],
  side: [
    '................',
    '................',
    '................',
    '................',
    '..........e.....',
    '..........i.....',
    '...........c....',
  ],
};

/** An earlobe with a gauge in it, drawn over the hair so it peeks out of any style. */
const GAUGES: Record<Exclude<View, 'back'>, Grid> = {
  front: [
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
    '......o.........',
    '.....oso........',
    '.....oko........',
    '......o.........',
  ],
};

/**
 * Hair is drawn in `h` and `H` (its shade). `hairRows` then splits it into her left half and her
 * right half, which is how split dye works on every style.
 */
const HAIR: Record<HairStyleId, Record<View, Grid>> = {
  long: {
    front: [
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '.ohhhH....Hhhho.',
      '.ohhH......Hhho.',
      '.ohH........Hho.',
      '.ohH........Hho.',
      '.ohH........Hho.',
      '.ohhH......Hhho.',
      '.ohhhh....hhhho.',
      '..ohho....ohho..',
      '...oo......oo...',
    ],
    back: [
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
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
      '....ooooooo.....',
      '...ohhhhhhho....',
      '..ohhhhhhhhho...',
      '..ohhhhhhhhHo...',
      '.ohhhhhhH.......',
      '.ohhhhhhH.......',
      '.ohhhhhhH.......',
      '.ohhhhhH........',
      '.ohhhhho........',
      '.ohhhhho........',
      '..ohhhho........',
      '...ohho.........',
      '....oo..........',
    ],
  },
  bob: {
    front: [
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..oH........Ho..',
      '..oH........Ho..',
      '..oH........Ho..',
      '..ohhH....Hhho..',
      '..oooo....oooo..',
    ],
    back: [
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..oHHHHHHHHHHo..',
      '...oooooooooo...',
    ],
    side: [
      '....ooooooo.....',
      '...ohhhhhhho....',
      '..ohhhhhhhhho...',
      '..ohhhhhhhhHo...',
      '..ohhhhhH.......',
      '..ohhhhhH.......',
      '..ohhhhhH.......',
      '..ohhhhhH.......',
      '..oHHHHHo.......',
      '...ooooo........',
    ],
  },
  bunches: {
    front: [
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '.oohhhhhhhhhhoo.',
      'ohho........ohho',
      'ohho........ohho',
      'ohho........ohho',
      'oHho........ohHo',
      '.oHo........oHo.',
      '..o..........o..',
    ],
    back: [
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '.oohhhhhhhhhhoo.',
      'ohhohhhhhhhhohho',
      'ohhohhhhhhhhohho',
      'ohhohhhhhhhhohho',
      'oHhoHhhhhhhHohHo',
      '.oHo.oooooo.oHo.',
      '..o..........o..',
    ],
    side: [
      '....ooooooo.....',
      '...ohhhhhhho....',
      '..ohhhhhhhhho...',
      '..ohhhhhhhhHo...',
      '.ohhhhhhH.......',
      'ohhhhhhH........',
      'ohhhhhHo........',
      'oHhhoo..........',
      '.oHo............',
      '..o.............',
    ],
  },
  pixie: {
    front: [
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '..ohhhhhH...Ho..',
      '..oH........Ho..',
    ],
    back: [
      '....oooooooo....',
      '...ohhhhhhhho...',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..ohhhhhhhhhho..',
      '..oHhhhhhhhhHo..',
      '...oHHHHHHHHo...',
      '....oooooooo....',
    ],
    side: [
      '....ooooooo.....',
      '...ohhhhhhho....',
      '..ohhhhhhhhho...',
      '..ohhhhhhhhHo...',
      '..ohhhhhHo......',
      '..ohhhhHo.......',
      '..oHhhHo........',
      '...oooo.........',
    ],
  },
};

const BEANIE: Record<View, Grid> = {
  front: ['....oooxxooo....', '...ommmmmmmmo...', '..ommMmmmmMmmo..', '..oMMMMMMMMMMo..'],
  back: ['....oooxxooo....', '...ommmmmmmmo...', '..ommMmmmmMmmo..', '..oMMMMMMMMMMo..'],
  side: ['....oooxxoo.....', '...ommmmmmmo....', '..ommMmmmMmmo...', '..oMMMMMMMMMo...'],
};

const GLASSES: Record<'roundGlasses' | 'catEyeGlasses', Record<Exclude<View, 'back'>, Grid>> = {
  roundGlasses: {
    front: [
      '................',
      '................',
      '................',
      '................',
      '...mm.mmmm.mm...',
      '....m.m..m.m....',
      '.....m....m.....',
    ],
    side: [
      '................',
      '................',
      '................',
      '................',
      '.......mmm.m....',
      '.........m.m....',
      '..........m.....',
    ],
  },
  catEyeGlasses: {
    front: [
      '................',
      '................',
      '................',
      '...m........m...',
      '...mm.mmmm.mm...',
      '....m.m..m.m....',
      '.....m....m.....',
    ],
    side: [
      '................',
      '................',
      '................',
      '...........m....',
      '.......mmm.m....',
      '.........m.m....',
      '..........m.....',
    ],
  },
};

/** The skirt of a dress, which flares past her legs and so can't be painted on. */
const DRESS_SKIRT: Record<View, Grid> = {
  front: [
    '....ommmmmmo....',
    '...ommmmmmmmo...',
    '...ommmmmmmmo...',
    '..oMMMMMMMMMMo..',
    '..oooooooooooo..',
  ],
  back: [
    '....ommmmmmo....',
    '...ommmmmmmmo...',
    '...ommmmmmmmo...',
    '..oMMMMMMMMMMo..',
    '..oooooooooooo..',
  ],
  side: [
    '....ommmmmmo....',
    '....ommmmmmmo...',
    '...ommmmmmmmo...',
    '...oMMMMMMMMMo..',
    '...ooooooooooo..',
  ],
};

const PLEATED_SKIRT: Record<View, Grid> = {
  front: ['....oMMMMMMo....', '...omMmMmMmMo...', '...omMmMmMmMo...', '...oooooooooo...'],
  back: ['....oMMMMMMo....', '...omMmMmMmMo...', '...omMmMmMmMo...', '...oooooooooo...'],
  side: ['....oMMMMMMo....', '...omMmMmMmo....', '...omMmMmMmMo...', '...oooooooooo...'],
};

/** What is drawn on a piece beyond its cut: a band tee's print, a pendant, a dress's pattern. */
export interface OutfitArt {
  /** Centred on her chest from the front. */
  print?: Grid;
  /** Centred between her shoulder blades from behind. */
  backPrint?: Grid;
  /** Hung from a chain, centred under her chin. */
  pendant?: Grid;
  pattern?: 'floral' | 'gingham';
  /** Colours of `x` and `y` in the art, when they aren't white and black. */
  accents?: { x?: string; y?: string };
}

const NUMBER_49: Grid = ['x.xxxx', 'x.xx.x', 'xxxxxx', '..x..x', '..xxxx'];

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
        return ((r >> 1) + (c >> 1)) % 2 === 0 ? 'x' : ch;
      })
      .join(''),
  );
}

/** One piece of clothing's layer, for one facing and frame, before its colours. */
function cutRows(cut: CutId, art: OutfitArt, view: View, body: Grid): string[] {
  const front = view === 'front';
  switch (cut) {
    case 'tee':
    case 'jersey': {
      let rows = paint(body, (k, r, c) => {
        if (k === 'b' && r <= HEM) return r === HEM ? 'M' : 'm';
        if (k === 'a' && r === SLEEVE) return 'm';
        if (cut === 'jersey' && k === 'a' && r === SLEEVE + 1) return (r + c) % 2 ? 'y' : 'm';
        return null;
      });
      // A print ends just above the hem, however tall it is.
      if (front && art.print) {
        rows = stamp(rows, art.print, HEM - art.print.length, centred(art.print));
      }
      if (view === 'back' && art.backPrint) {
        rows = stamp(rows, art.backPrint, 10, centred(art.backPrint));
      }
      return rows;
    }
    case 'sundress': {
      const straps = view === 'side' ? [8] : [5, 10];
      const rows = paint(body, (k, r, c) => {
        if (k !== 'b') return null;
        if (r === SHOULDER) return straps.includes(c) ? 'm' : null;
        return 'm';
      });
      return withPattern(stamp(rows, DRESS_SKIRT[view], WAIST), art.pattern);
    }
    case 'collarDress': {
      const collar =
        view === 'side' ? [9, 10] : view === 'front' ? [5, 6, 9, 10] : [4, 5, 6, 7, 8, 9, 10, 11];
      const rows = paint(body, (k, r, c) => {
        if (k === 'b') return r === SHOULDER && collar.includes(c) ? 'x' : 'm';
        if (k === 'a') return r === SLEEVE + 3 ? 'x' : 'm';
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
        if (k === 'l' && r <= WAIST + 2) return r === WAIST + 2 ? 'M' : 'm';
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
        return up <= 2 ? 'm' : up === 3 ? 'M' : null;
      });
    case 'maryJanes':
      return paint(body, (k, r, c) => {
        if (k === 'f') return 'm';
        return k === 'l' && aboveFoot(body, r, c) === 1 ? 'x' : null;
      });
    case 'beanie':
      return stamp(EMPTY, BEANIE[view], 0);
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
      [11, 3, 'k'],
      [13, 2, 'k'],
      [12, 2, 'K'],
      [11, 12, 'K'],
      [12, 13, 'k'],
    ],
    back: [
      [11, 2, 'k'],
      [13, 3, 'K'],
      [12, 12, 'k'],
    ],
    side: [
      [11, 8, 'k'],
      [13, 7, 'K'],
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
    });
  }
  if (look.tattoos) {
    add(tattooRows(look.tattoos, body, view), { '.': null, k: C.tattooInk, K: C.tattooRose });
  }

  const dressed = OUTFITS[look.outfit.top?.id ?? 'cozyTee'].dress === true;
  for (const slot of WORN_ORDER) {
    const worn = look.outfit[slot];
    if (!worn || (slot === 'bottom' && dressed)) continue;
    add(cutRows(OUTFITS[worn.id].cut, OUTFIT_ART[worn.id], view, body), wornPalette(worn));
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
    if (worn) {
      add(cutRows(OUTFITS[worn.id].cut, OUTFIT_ART[worn.id], view, body), wornPalette(worn));
    }
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
