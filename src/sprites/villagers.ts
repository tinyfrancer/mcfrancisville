import type { Facing, VillagerId } from '../types/ids';
import type { Worn } from '../types/look';
import {
  BODY,
  DOLL_FRAMES,
  EMPTY,
  EYES,
  eyesPalette,
  HAIR,
  hairPalette,
  hairRows,
  paint,
  pieceRows,
  skinPalette,
  stamp,
  viewOf,
  wornPalette,
  type Grid,
  type View,
} from './doll';
import { FABRIC_TONES, type HairTones, type Tone } from './lookColours';
import { PALETTE as C } from './palette';
import type { Layer, Palette } from './sprite';

/*
 * Her neighbours, drawn to her scale (16×32) with the paper doll's own parts: its body, its painted
 * clothes and its hair, in their own colours, with what makes each of them a creature on top.
 * Maude is a ghost, so she is a sheet, and drawn by hand.
 */

/** Everyone drawn like a villager: the six neighbours, the Moon Pie Man, and Wes. */
export type Figure = VillagerId | 'moonPieMan' | 'wes';

/** A piece of clothing a figure wears, in a colour of its own where no fabric fits. */
interface Dressed {
  worn: Worn;
  tone?: Tone;
}

/** Something of their own, drawn from the body for one view and frame. */
type Touch = (
  view: View,
  body: Grid,
  facing: Facing,
) => { rows: readonly string[]; palette: Palette } | null;

interface FigureArt {
  skin: Tone;
  /** The colour of their eyes, or null for a face of their own. */
  eyes: string | null;
  hair: { style: Record<View, Grid>; tones: HairTones } | null;
  /** Bottom first, as she dresses. */
  clothes: readonly Dressed[];
  /** On their skin, under their clothes: bandages, ribs. */
  onSkin?: readonly Touch[];
  /** Over the clothes, under the hair: a cape, a face. */
  under?: readonly Touch[];
  /** Over the hair: ears, hats, glasses. */
  over?: readonly (Dressed | Touch)[];
}

const tone = (main: string, shade: string): Tone => ({ main, shade });
const solidHair = (t: Tone): HairTones => ({ left: t, right: t });
const worn = (id: Worn['id'], fabric: Worn['fabric'], custom?: Tone): Dressed =>
  custom ? { worn: { id, fabric }, tone: custom } : { worn: { id, fabric } };

/** Curls: long hair with its shade scattered through it, so it reads as ringlets. */
function curly(style: Record<View, Grid>): Record<View, Grid> {
  const curl = (grid: Grid): Grid =>
    grid.map((row, r) =>
      [...row].map((ch, c) => (ch === 'h' && r >= 3 && (r * 2 + c) % 5 === 0 ? 'H' : ch)).join(''),
    );
  return { front: curl(style.front), back: curl(style.back), side: curl(style.side) };
}

/**
 * Bandages, wound round and round: a shaded line across every third row of whatever `keys` are,
 * slanting as it goes. Only the lines are drawn.
 */
function bandaged(rows: readonly string[], keys: string): string[] {
  return rows.map((row, r) =>
    [...row].map((ch, c) => (keys.includes(ch) && (r + (c >> 2)) % 3 === 0 ? 'W' : '.')).join(''),
  );
}

const byView = (front: Grid, side: Grid, back: Grid = EMPTY): Record<View, Grid> => ({
  front,
  side,
  back,
});

/** A face drawn over the head, from the top of the sprite. */
function face(grids: Record<View, Grid>, palette: Palette): Touch {
  return (view) => ({ rows: stamp(EMPTY, grids[view], 0), palette });
}

// ---- Cody: a vampire with Cody's own look (personal_touches.md, "Cody's villager") ----

/** Two little fangs under his smile. */
const FANGS = face(
  byView(
    ['', '', '', '', '', '', '', '', '', '.......w.w......'],
    ['', '', '', '', '', '', '', '', '', '............w...'],
  ),
  { '.': null, w: C.white },
);

/** A little cape: a high collar either side of his head, black outside and red within. */
const CAPE: Touch = (view) => {
  const grids: Record<View, Grid> = {
    front: [
      '.o............o.',
      'oro..........oro',
      'oko..........oko',
      'ok............ko',
      'ok............ko',
      'ok............ko',
      'ok............ko',
      'ok............ko',
      'ok............ko',
      'ok............ko',
      'okk..........kko',
      'oooo........oooo',
    ],
    back: [
      '.oooooooooooooo.',
      'okkkkkkkkkkkkkko',
      'okkkkkkkkkkkkkko',
      'okkkkkkkkkkkkkko',
      'okkkkkKkkKkkkkko',
      'okkkkkKkkKkkkkko',
      'okkkkkKkkKkkkkko',
      'okkkkkKkkKkkkkko',
      'okkkkkKkkKkkkkko',
      'okkkkkKkkKkkkkko',
      'okkkkkKkkKkkkkko',
      'okkkkkKkkKkkkkko',
      'oooooooooooooooo',
    ],
    side: [
      '...oo...........',
      '..oro...........',
      '..oko...........',
      '..ok............',
      '.okk............',
      '.okk............',
      '.okk............',
      '.okk............',
      '.okk............',
      'okkk............',
      'okkk............',
      'oooo............',
    ],
  };
  return {
    rows: stamp(EMPTY, grids[view], view === 'back' ? 10 : 9),
    palette: { '.': null, o: C.ink, k: C.inkFabric, K: C.inkFabricShade, r: C.scarlet },
  };
};

// ---- Rufus: a werewolf, all fluff ----

const SNOUT = face(
  byView(
    ['', '', '', '', '', '', '', '.......kk.......', '......LuuL......'],
    ['', '', '', '', '', '', '............LL..', '.............Lk.', '............u...'],
  ),
  { '.': null, k: C.ink, L: C.furLight, u: C.rose },
);

// ---- Wrapunzel: a mummy, whose hair is bandages all the way down ----

const WRAPS: Touch = (_view, body) => ({
  rows: bandaged(body, 'sbal'),
  palette: { '.': null, W: C.bandageShade },
});

const WRAPPED_HAIR: Touch = (_view, _body, facing) => ({
  rows: bandaged(hairRows(HAIR.long, facing), 'hg'),
  palette: { '.': null, W: C.bandageShade },
});

/** A baker's hat, squashed to fit, as the witch hat is. */
const TOQUE: Touch = (view) => ({
  rows: stamp(
    EMPTY,
    view === 'side'
      ? ['...ooooooooo....', '..owwwwwwwwwo...', '..owwwwwwwwwo...', '...oWWWWWWWo....']
      : ['...oooooooooo...', '..owwwwwwwwwwo..', '..owwwwwwwwwwo..', '...oWWWWWWWWo...'],
    0,
  ),
  palette: { '.': null, o: C.ink, w: C.white, W: C.silver },
});

// ---- Barty: a skeleton, cheerful to the bone ----

const SKULL = face(
  byView(
    [
      '',
      '',
      '',
      '',
      '',
      '.....kk..kk.....',
      '.....kk..kk.....',
      '.......kk.......',
      '......kwkwk.....',
    ],
    [
      '',
      '',
      '',
      '',
      '',
      '..........kk....',
      '..........kk....',
      '.............k..',
      '...........kwk..',
    ],
  ),
  { '.': null, k: C.inkFabric, w: C.bone },
);

/** Ribs across his chest, and a knobbly elbow on each arm. */
const RIBS: Touch = (view, body) => ({
  rows: paint(body, (k, r, c) => {
    if (k === 'a' && r === 15) return 'k';
    if (view === 'side' || k !== 'b' || r < 12 || r > 18 || r % 2 !== 1) return null;
    return c === 7 || c === 8 ? null : 'k';
  }),
  palette: { '.': null, k: C.boneShade },
});

// ---- The Moon Pie Man: dark glasses and a hat pulled down, so nobody knows who he is ----

const SHADES = face(
  byView(
    ['', '', '', '', '', '....kkkk.kkkk...', '....kkk...kkk...'],
    ['', '', '', '', '', '.........kkkk...', '..........kkk...'],
  ),
  { '.': null, k: C.ink },
);

const FEDORA: Touch = (view) => ({
  rows: stamp(
    EMPTY,
    view === 'side'
      ? ['...ooooooooo....', '..ommmmmmmmmo...', '..oyyyyyyyyyo...', 'oMMMMMMMMMMMMMo.']
      : ['...oooooooooo...', '..ommmmmmmmmmo..', '..oyyyyyyyyyyo..', 'oMMMMMMMMMMMMMMo'],
    0,
  ),
  palette: { '.': null, o: C.ink, m: C.wood, M: C.bark, y: C.scarlet },
});

// ---- Wes: always lurking, and very bad at it (personal_touches.md, "The finishing touches") ----

/** A hat pulled down low, to just above his eyes. */
const LOW_HAT: Touch = (view) => ({
  rows: stamp(
    EMPTY,
    view === 'side'
      ? ['...ooooooooo....', '..ommmmmmmmmo...', '..oyyyyyyyyyo...', 'oMMMMMMMMMMMMMo.']
      : ['...oooooooooo...', '..ommmmmmmmmmo..', '..oyyyyyyyyyyo..', 'oMMMMMMMMMMMMMMo'],
    1,
  ),
  palette: { '.': null, o: C.ink, m: C.stoneDark, M: C.iron, y: C.inkFabric },
});

/** A big bushy moustache: the whole of his disguise. */
const MOUSTACHE = face(
  byView(
    ['', '', '', '', '', '', '', '', '.....MMMMMM.....'],
    ['', '', '', '', '', '', '', '', '..........MMMM..'],
  ),
  { '.': null, M: C.hairBrownShade },
);

const FIGURES: Record<Exclude<Figure, 'maude'>, FigureArt> = {
  cody: {
    skin: tone(C.skin, C.skinShade),
    eyes: C.eyeHazel,
    hair: { style: curly(HAIR.long), tones: solidHair(tone(C.hairBrown, C.hairBrownShade)) },
    clothes: [worn('jeans', 'denim'), worn('maroonTee', 'maroon'), worn('sneakers', 'ink')],
    under: [FANGS, CAPE],
    over: [worn('roundGlasses', 'ink', tone(C.bark, C.barkDark))],
  },
  rufus: {
    skin: tone(C.fur, C.furShade),
    eyes: C.gold,
    hair: { style: HAIR.bob, tones: solidHair(tone(C.furShade, C.bark)) },
    clothes: [worn('jeans', 'denim'), worn('cozyTee', 'moss'), worn('stompyBoots', 'ink')],
    under: [SNOUT],
    // His ears poke up through his flower crown.
    over: [worn('flowerCrown', 'rose'), worn('catEars', 'ink', tone(C.fur, C.furShade))],
  },
  wrapunzel: {
    skin: tone(C.bandage, C.bandageShade),
    eyes: C.eyePlum,
    hair: { style: HAIR.long, tones: solidHair(tone(C.bandage, C.bandageShade)) },
    clothes: [worn('sundressDots', 'rose'), worn('maryJanes', 'ink')],
    onSkin: [WRAPS],
    over: [WRAPPED_HAIR, TOQUE],
  },
  agatha: {
    skin: tone(C.skinMinty, C.skinMintyShade),
    eyes: C.eyePlum,
    hair: { style: HAIR.long, tones: solidHair(tone(C.hairBlack, C.hairBlackShade)) },
    clothes: [worn('starryDress', 'navy'), worn('maryJanes', 'ink')],
    over: [worn('witchHat', 'plum')],
  },
  barty: {
    skin: tone(C.bone, C.boneShade),
    eyes: null,
    hair: null,
    clothes: [worn('jeans', 'denim'), worn('stompyBoots', 'ink')],
    onSkin: [RIBS],
    under: [SKULL],
    over: [worn('strawSunHat', 'gold')],
  },
  moonPieMan: {
    skin: tone(C.skinHoney, C.skinHoneyShade),
    eyes: null,
    hair: { style: HAIR.pixie, tones: solidHair(tone(C.hairBlack, C.hairBlackShade)) },
    clothes: [
      worn('jeans', 'ink'),
      worn('wednesdayDress', 'cream', tone(C.rope, C.wood)),
      worn('stompyBoots', 'ink'),
    ],
    under: [SHADES],
    over: [FEDORA],
  },
  wes: {
    skin: tone(C.skinPorcelain, C.skinPorcelainShade),
    eyes: C.eyeGrey,
    hair: { style: HAIR.pixie, tones: solidHair(tone(C.hairBrown, C.hairBrownShade)) },
    clothes: [
      worn('jeans', 'ink'),
      worn('wednesdayDress', 'cream', tone(C.stoneLight, C.stone)),
      worn('stompyBoots', 'ink'),
    ],
    under: [MOUSTACHE],
    over: [LOW_HAT],
  },
};

// ---- Maude: a ghost in a sheet, with her reading glasses ----

const SHEET_TOP: Grid = [
  '................',
  '................',
  '................',
  '................',
  '.....oooooo.....',
  '...oowwwwwwoo...',
  '..owwwwwwwwwwo..',
  '.owwwwwwwwwwwwo.',
  '.owwwwwwwwwwwwo.',
];

const MAUDE: Record<View, Grid> = {
  front: [
    ...SHEET_TOP,
    '.owwgggwwgggwwo.',
    '.owwgegwwgegwwo.',
    '.owwgggwwgggwwo.',
    '.owcwwwwwwwwcwo.',
    '.owwwwwuuwwwwwo.',
    'owwwwwwwwwwwwwWo',
    'owwwwwwwwwwwwwWo',
    'owwwwwwwwwwwwwWo',
    'owwwwwwwwwwwwwWo',
    'owwwwwwwwwwwwwWo',
    'owwwwwwwwwwwwwWo',
    'owwwwwwwwwwwwwWo',
    'owwwwwwwwwwwwwWo',
    'owwwwwwwwwwwwwWo',
    'owwwwwwwwwwwwwWo',
    'owwwwwwwwwwwwwWo',
    'owwwwwwwwwwwwwWo',
    'owwwwwwwwwwwwwWo',
    '.owwo.owwo.owwo.',
    '..oo...oo...oo..',
    '................',
    '................',
    '................',
  ],
  back: [
    ...SHEET_TOP,
    ...Array.from({ length: 5 }, () => '.owwwwwwwwwwwwo.'),
    ...Array.from({ length: 13 }, () => 'oWwwwwwwwwwwwwWo'),
    '.owwo.owwo.owwo.',
    '..oo...oo...oo..',
    '................',
    '................',
    '................',
  ],
  side: [
    '................',
    '................',
    '................',
    '................',
    '......oooooo....',
    '....oowwwwwwo...',
    '...owwwwwwwwwo..',
    '..owwwwwwwwwwwo.',
    '..owwwwwwwwwwwo.',
    '..owwwwwwwgggwo.',
    '..owwwwwwwgegwo.',
    '..owwwwwwwgggwo.',
    '..owwwwwwwwwcwo.',
    '..owwwwwwwwwuwo.',
    '..owwwwwwwwwwWo.',
    '..owwwwwwwwwwWo.',
    '..owwwwwwwwwwWo.',
    '..owwwwwwwwwwWo.',
    '..owwwwwwwwwwWo.',
    '..owwwwwwwwwwWo.',
    ...Array.from({ length: 7 }, () => '..owwwwwwwwwwWo.'),
    '..owwo.owwo.owo.',
    '...oo...oo...o..',
    '................',
    '................',
    '................',
  ],
};

/** Maude's colours; she glows a little after dark, as a ghost should. */
export const MAUDE_PALETTE: Palette = {
  '.': null,
  o: C.ink,
  w: C.ghost,
  W: C.skinGhostlyShade,
  g: C.gold,
  e: C.ink,
  c: C.cheek,
  u: C.rose,
};

export const MAUDE_GLOW: Palette = { w: C.ghost };

/** Maude from one side, for the bake cache and the gallery. */
export function maudeRows(facing: Facing): readonly string[] {
  return MAUDE[viewOf(facing)];
}

/**
 * A figure in layers, bottom first, for one facing and walk frame: the body in their skin, their
 * eyes, their clothes, their own touches, their hair, then anything worn over it.
 */
export function figureLayers(id: Figure, facing: Facing, frame: number): Layer[] {
  const view = viewOf(facing);
  if (id === 'maude') return [{ source: { rows: MAUDE[view] }, palette: MAUDE_PALETTE }];
  const art = FIGURES[id];
  const body = BODY[view][frame % DOLL_FRAMES]!;
  const layers: Layer[] = [];
  const add = (rows: readonly string[], palette: Palette) =>
    layers.push({ source: { rows }, palette });
  const dress = (d: Dressed) =>
    add(pieceRows(d.worn, view, body), wornPalette(d.worn, d.tone ?? FABRIC_TONES[d.worn.fabric]));
  const touch = (t: Touch) => {
    const drawn = t(view, body, facing);
    if (drawn) add(drawn.rows, drawn.palette);
  };

  add(body, skinPalette(art.skin));
  art.onSkin?.forEach(touch);
  if (art.eyes && view !== 'back') add(stamp(EMPTY, EYES[view], 0), eyesPalette(art.eyes));
  art.clothes.forEach(dress);
  art.under?.forEach(touch);
  if (art.hair) add(hairRows(art.hair.style, facing), hairPalette(art.hair.tones));
  for (const o of art.over ?? []) {
    if (typeof o === 'function') touch(o);
    else dress(o);
  }
  return layers;
}
