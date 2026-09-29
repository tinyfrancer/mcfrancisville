import type { Facing, VillagerId } from '../types/ids';
import type { Worn } from '../types/look';
import {
  BODY,
  DOLL_FRAMES,
  DOLL_HEIGHT,
  DOLL_WIDTH,
  facePalette,
  faceRows,
  finish,
  HAIR,
  hairPalette,
  hairRows,
  paint,
  pieceRows,
  skinPalette,
  skinRows,
  viewOf,
  wornPalette,
  type FaceTouches,
  type Grid,
  type View,
} from './doll';
import { FABRIC_TONES, type HairTones, type Tone } from './lookColours';
import { PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Layer, Palette } from './sprite';

/*
 * Her neighbours, drawn to her scale (32×48) with the paper doll's own parts: its body, its
 * painted clothes and its hair, in their own colours, with what makes each of them a creature on
 * top. Maude is a ghost, so she is a sheet, and drawn by hand.
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
  /** Lashes, freckles and the like. */
  face?: FaceTouches;
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

/** A sketch the size of the doll, to draw a touch on. */
const sketch = () => new Sketch(DOLL_WIDTH, DOLL_HEIGHT);

/** A finished layer's outline, shade, colour and light, from its colour's ramp. */
function tones(main: string): Palette {
  const r = ramp(main);
  return { '.': null, O: r[0], M: r[1], m: main, L: r[3] };
}

/** Curls: little arcs of shade through the hair, staggered, so it reads as ringlets. */
function curly(style: Record<View, Grid>): Record<View, Grid> {
  const arc = (r: number, c: number) => {
    const y = (r + (Math.floor(c / 4) % 2) * 2) % 4;
    const x = c % 4;
    return (y === 0 && x === 2) || (y === 1 && x === 1) || (y === 2 && x === 2);
  };
  const curl = (grid: Grid): Grid =>
    grid.map((row, r) =>
      [...row].map((ch, c) => (ch === 'h' && r >= 6 && arc(r, c) ? 'H' : ch)).join(''),
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

/** A face drawn over the head, one sketch for each way they face. */
function face(draw: (view: Exclude<View, 'back'>) => Sketch, palette: Palette): Touch {
  return (view) => (view === 'back' ? null : { rows: draw(view).rows, palette });
}

/** A hat or the like, drawn by hand and outlined all round, like her hats. */
function drawn(draw: (view: View) => Sketch, colour: string, extra: Palette = {}): Touch {
  return (view, body) => ({
    rows: finish(draw(view).rows, body, 'drawn'),
    palette: { ...tones(colour), ...extra },
  });
}

// ---- Cody: a vampire with Cody's own look (personal_touches.md, "Cody's villager") ----

/** Two little fangs in his smile. */
const FANGS = face(
  (view) =>
    view === 'front' ? sketch().set(15, 21, 'w').set(16, 21, 'w') : sketch().set(21, 21, 'w'),
  { '.': null, w: C.white },
);

/**
 * A cape: a high collar standing up behind his shoulders, black outside and red within, falling
 * behind his arms to his knees. It shows only where he doesn't.
 */
const CAPE: Touch = (view, body) => {
  const s = sketch();
  if (view === 'back') {
    s.rect(6, 22, 20, 19, 'm').rect(4, 21, 3, 5, 'm').rect(25, 21, 3, 5, 'm');
    s.rect(15, 23, 2, 17, 'M');
  } else {
    const sides =
      view === 'side'
        ? [[5, 7]]
        : [
            [3, 4],
            [25, 4],
          ];
    for (const [x, w] of sides) {
      s.rect(x!, 21, w!, 20, 'm');
      s.rect(x! + 1, 21, Math.max(1, w! - 2), 5, 'x');
    }
    // Behind him: nothing over his arms, his legs or anything else of him.
    for (let y = 0; y < DOLL_HEIGHT; y++) {
      for (let x = 0; x < DOLL_WIDTH; x++) {
        const under = body[y]?.[x] ?? CLEAR;
        if (under !== CLEAR && under !== 'o') s.set(x, y, CLEAR);
      }
    }
  }
  return {
    rows: finish(s.rows, body, 'drawn'),
    palette: { ...tones(C.inkFabric), x: C.scarlet },
  };
};

// ---- Rufus: a werewolf, all fluff ----

const SNOUT = face(
  (view) =>
    view === 'front'
      ? sketch().rect(13, 19, 6, 2, 'L').rect(15, 18, 2, 1, 'k').rect(15, 20, 2, 1, 'u')
      : sketch().rect(21, 18, 4, 3, 'L').set(24, 18, 'k').set(22, 20, 'u'),
  { '.': null, k: C.ink, L: C.furLight, u: C.rose },
);

// ---- Wrapunzel: a mummy, whose hair is bandages all the way down ----

const WRAPS: Touch = (_view, body) => ({
  rows: bandaged(body, 'snbpaewAlf'),
  palette: { '.': null, W: C.bandageShade },
});

const WRAPPED_HAIR: Touch = (_view, body, facing) => ({
  rows: bandaged(hairRows(HAIR.long, facing, body), 'hgjJ'),
  palette: { '.': null, W: C.bandageShade },
});

/** A baker's hat, puffed up above a band, squashed to fit as the witch hat is. */
const TOQUE = drawn(
  (view) => {
    const cx = view === 'side' ? 15 : 16;
    return sketch()
      .ellipse(cx, 4, 9, 4, 'm')
      .rect(cx - 7, 5, 14, 4, 'm')
      .rect(cx - 7, 8, 14, 2, 'x');
  },
  C.white,
  { x: C.silver },
);

// ---- Agatha: a witch ----

// Her witch hat is the one from the shop, in plum.

// ---- Barty: a skeleton, cheerful to the bone ----

const SKULL = face(
  (view) => {
    const s = sketch();
    const socket = (x: number) =>
      s
        .rect(x, 14, 3, 4, 'k')
        .set(x, 14, CLEAR)
        .set(x + 2, 17, CLEAR);
    if (view === 'front') {
      socket(11);
      socket(18);
      s.set(15, 19, 'k').set(16, 19, 'k');
      s.rect(13, 21, 6, 1, 'k');
      for (const x of [14, 16]) s.set(x, 21, 'w');
      s.rect(13, 21, 1, 1, 'k');
    } else {
      socket(19);
      s.set(22, 19, 'k');
      s.rect(19, 21, 3, 1, 'k').set(20, 21, 'w');
    }
    return s;
  },
  { '.': null, k: C.inkFabric, w: C.bone },
);

/** Ribs across his chest, and a knobbly elbow on each arm. */
const RIBS: Touch = (view, body) => ({
  rows: paint(body, (k, r, c) => {
    if (k === 'e' && body[r - 1]?.[c] === 'a') return 'k';
    if (view === 'side' || k !== 'b' || r < 27 || r > 32 || r % 2 !== 1) return null;
    return c === 15 || c === 16 ? null : 'k';
  }),
  palette: { '.': null, k: C.boneShade },
});

// ---- The Moon Pie Man: dark glasses and a hat pulled down, so nobody knows who he is ----

const SHADES = face(
  (view) =>
    view === 'front'
      ? sketch().rect(10, 14, 5, 4, 'k').rect(17, 14, 5, 4, 'k').rect(15, 15, 2, 1, 'k')
      : sketch().rect(19, 14, 5, 4, 'k').rect(14, 15, 5, 1, 'k'),
  { '.': null, k: C.ink },
);

/** A hat with a band round it and a brim, sitting at `low` rows down. */
function brimmedHat(low: number) {
  return (view: View) => {
    const s = sketch();
    const cx = view === 'side' ? 15 : 16;
    s.ellipse(cx, 6 + low, 8, 5, 'm').rect(0, 7 + low, DOLL_WIDTH, 40, CLEAR);
    s.rect(cx - 8, 5 + low, 16, 2, 'x');
    s.ellipse(16, 8 + low, 13.5, 1.5, 'm');
    return s;
  };
}

const FEDORA = drawn(brimmedHat(0), C.wood, { x: C.scarlet });

// ---- Wes: always lurking, and very bad at it (personal_touches.md, "The finishing touches") ----

/** A hat pulled down low, to just above his eyes. */
const LOW_HAT = drawn(brimmedHat(3), C.stoneDark, { x: C.inkFabric });

/** A big bushy moustache: the whole of his disguise. */
const MOUSTACHE = face(
  (view) =>
    view === 'front'
      ? sketch()
          .rect(12, 19, 8, 2, 'M')
          .set(11, 20, 'M')
          .set(20, 20, 'M')
          .set(10, 21, 'M')
          .set(21, 21, 'M')
      : sketch().rect(19, 19, 4, 2, 'M').set(23, 20, 'M'),
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
    face: { lashes: true },
    hair: { style: HAIR.long, tones: solidHair(tone(C.bandage, C.bandageShade)) },
    clothes: [worn('sundressDots', 'rose'), worn('maryJanes', 'ink')],
    onSkin: [WRAPS],
    over: [WRAPPED_HAIR, TOQUE],
  },
  agatha: {
    skin: tone(C.skinMinty, C.skinMintyShade),
    eyes: C.eyePlum,
    face: { lashes: true },
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

/** A sheet over a round head, flaring to a wavy hem, with eyes behind gold-rimmed glasses. */
function maudeSheet(view: View): string[] {
  const s = sketch();
  const cx = view === 'side' ? 15 : 16;
  s.ellipse(cx, 18, 10, 10, 'w');
  for (let y = 18; y < 40; y++) {
    const half = 10 + Math.round((y - 18) * 0.12);
    s.rect(cx - half, y, half * 2, 1, 'w');
  }
  // Three soft points at the hem.
  const hem = cx - 12;
  for (let i = 0; i < 3; i++) s.ellipse(hem + 4 + i * 8, 40, 4, 3, 'w');
  s.bevel('w', null, 'W');
  s.outline({ w: 'o', W: 'o' });
  if (view === 'back') return s.rows;
  const lens = (x: number) => {
    s.rect(x, 15, 5, 5, 'g')
      .rect(x + 1, 16, 3, 3, 'w')
      .set(x + 2, 17, 'e')
      .set(x + 2, 16, 'e');
  };
  if (view === 'front') {
    lens(10);
    lens(17);
    s.set(15, 16, 'g').set(16, 16, 'g');
    s.rect(9, 21, 2, 1, 'c').rect(21, 21, 2, 1, 'c');
    s.rect(15, 22, 2, 1, 'u');
  } else {
    lens(19);
    s.rect(15, 16, 4, 1, 'g');
    s.rect(22, 21, 2, 1, 'c');
    s.set(23, 22, 'u');
  }
  return s.rows;
}

const MAUDE: Record<View, Grid> = {
  front: maudeSheet('front'),
  back: maudeSheet('back'),
  side: maudeSheet('side'),
};

/** Maude's colours; she glows a little after dark, as a ghost should. */
export const MAUDE_PALETTE: Palette = {
  '.': null,
  o: ramp(C.ghost)[0],
  w: C.ghost,
  W: C.skinGhostlyShade,
  g: C.gold,
  e: C.ink,
  c: C.cheek,
  u: C.rose,
};

export const MAUDE_GLOW: Palette = { w: C.ghost, W: C.skinGhostlyShade };

/** Maude from one side, for the bake cache and the gallery. */
export function maudeRows(facing: Facing): readonly string[] {
  return MAUDE[viewOf(facing)];
}

/**
 * A figure in layers, bottom first, for one facing and walk frame: the body in their skin, their
 * face, their clothes, their own touches, their hair, then anything worn over it.
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

  add(skinRows(body), skinPalette(art.skin));
  art.onSkin?.forEach(touch);
  if (art.eyes && view !== 'back') {
    add(faceRows(view, 'open', art.face ?? {}), facePalette(art.eyes, art.skin));
  }
  art.clothes.forEach(dress);
  art.under?.forEach(touch);
  if (art.hair) add(hairRows(art.hair.style, facing, body), hairPalette(art.hair.tones));
  for (const o of art.over ?? []) {
    if (typeof o === 'function') touch(o);
    else dress(o);
  }
  return layers;
}

/**
 * What shows over a neighbour's head (phase S2): "!" when they've news for her, "?" when they've
 * lost something. Grids at 16, like the pets' bubbles, baked at 2× in the world.
 */
export const NEIGHBOUR_BUBBLES: Record<
  '!' | '?',
  { source: { rows: string[] }; palette: Palette }
> = {
  '!': {
    source: {
      rows: [
        '.ooooooo.',
        'owwwxwwwo',
        'owwwxwwwo',
        'owwwxwwwo',
        'owwwxwwwo',
        'owwwwwwwo',
        'owwwxwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { '.': null, o: C.ink, w: C.white, x: C.scarlet },
  },
  '?': {
    source: {
      rows: [
        '.ooooooo.',
        'owwxxxwwo',
        'owxwwwxwo',
        'owwwwxwwo',
        'owwwxwwwo',
        'owwwwwwwo',
        'owwwxwwwo',
        '.oowoooo.',
        '..oo.....',
      ],
    },
    palette: { '.': null, o: C.ink, w: C.white, x: C.plum },
  },
};
