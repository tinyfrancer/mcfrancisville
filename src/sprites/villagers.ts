import type { CodyHalf, Costume } from '../data/finale';
import type { BraceletId, Facing, VillagerId } from '../types/ids';
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
  raised,
  skinPalette,
  skinRows,
  viewOf,
  wornPalette,
  type FaceTouches,
  type Grid,
  type View,
  wristPalette,
  wristRows,
} from './doll';
import { FABRIC_TONES, type HairTones, type Tone } from './lookColours';
import { PALETTE as C, mix, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Layer, Palette } from './sprite';

/*
 * Her neighbours, drawn to her scale (32×48) with the paper doll's own parts: its body, its
 * painted clothes and its hair, in their own colours, with what makes each of them a creature on
 * top. Maude is a ghost, so she is a sheet, and drawn by hand.
 */

/** Everyone drawn like a villager: the six neighbours, the Moon Pie Man, and Wes. */
export type Figure = VillagerId | 'moonPieMan' | 'wes';
export type { Costume };

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
  /** Lips of a colour of their own. */
  lips?: string;
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
 * Bandages, wound round and round over whatever `keys` are: bands three rows deep, slanting as
 * they go, each with a shaded lower edge and the next one's lit edge overlapping it. `open` leaves
 * a gap (her eyes).
 */
function bandaged(
  rows: readonly string[],
  keys: string,
  open: (r: number, c: number) => boolean = () => false,
): string[] {
  return rows.map((row, r) =>
    [...row]
      .map((ch, c) => {
        if (!keys.includes(ch) || open(r, c)) return '.';
        const band = r + (c >> 2);
        if (band % 3 === 0) return 'W';
        return band % 3 === 1 ? 'l' : '.';
      })
      .join(''),
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
 * A cape: a high collar standing up behind his head and flaring out past his hair, black outside
 * and lined in maroon (personal_touches.md, question 64), falling behind his arms to his knees.
 * It shows only where he doesn't.
 */
const CAPE: Touch = (view, body) => {
  const s = sketch();
  // Each collar point, from its tip down to where it meets his shoulder, lined where it opens.
  const collar = (tip: number, dir: 1 | -1) => {
    for (let y = 12; y <= 24; y++) {
      const wide = 2 + Math.floor((y - 12) / 3);
      for (let k = 0; k < wide; k++) s.set(tip + dir * k, y, k === 0 || y === 12 ? 'm' : 'x');
    }
  };
  if (view === 'back') {
    s.rect(6, 22, 20, 19, 'm').rect(4, 21, 3, 5, 'm').rect(25, 21, 3, 5, 'm');
    s.rect(15, 23, 2, 17, 'M');
    collar(1, 1);
    collar(30, -1);
    s.replace('x', 'm');
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
    if (view === 'side') collar(1, 1);
    else {
      collar(1, 1);
      collar(30, -1);
    }
    // Behind him: nothing over his arms, his legs or anything else of him.
    behind(s, body);
  }
  return {
    rows: finish(s.rows, body, 'drawn'),
    palette: { ...tones(C.inkFabric), x: C.maroon },
  };
};

/** The clasp that holds his cape at his throat: gold, with a garnet. */
const CLASP = face(
  (view) =>
    view === 'front'
      ? sketch().rect(15, 25, 2, 2, 'g').set(16, 26, 'r')
      : sketch().rect(19, 25, 1, 2, 'g'),
  { '.': null, g: C.gold, r: C.scarlet },
);

// ---- Rufus: a werewolf, all fluff ----

/**
 * Hair gone to a mane: its bottom edge ragged, alternately notched and hanging a pixel lower, and
 * tufts sticking out of its sides every third row.
 */
function shaggy(style: Record<View, Grid>): Record<View, Grid> {
  const rag = (grid: Grid, view: View): Grid => {
    const s = Sketch.from({ rows: grid });
    const hair = (x: number, y: number) => grid[y]?.[x] === 'h';
    for (let y = 0; y < DOLL_HEIGHT; y++) {
      for (let x = 0; x < DOLL_WIDTH; x++) {
        if (!hair(x, y) || hair(x, y + 1) || y < 8) continue;
        if (x % 3 === 0) s.set(x, y, CLEAR);
        else if (x % 3 === 1) s.set(x, y + 1, 'h');
      }
      const cols = [...Array(DOLL_WIDTH).keys()].filter((x) => hair(x, y));
      if (cols.length === 0 || y < 8 || y % 3 !== 1) continue;
      s.set(cols[0]! - 1, y, 'h');
      if (view !== 'side') s.set(cols[cols.length - 1]! + 1, y, 'h');
    }
    return s.rows;
  };
  return {
    front: rag(style.front, 'front'),
    back: rag(style.back, 'back'),
    side: rag(style.side, 'side'),
  };
}

/** Clears whatever of a sketch is over the body, so it shows only behind them. */
function behind(s: Sketch, body: Grid): Sketch {
  for (let y = 0; y < DOLL_HEIGHT; y++) {
    for (let x = 0; x < DOLL_WIDTH; x++) {
      const under = body[y]?.[x] ?? CLEAR;
      if (under !== CLEAR && under !== 'o') s.set(x, y, CLEAR);
    }
  }
  return s;
}

/** Fur on his arms and neck: a short fleck of shade here and there, and pale claws. */
const FUR: Touch = (_view, body) => ({
  rows: paint(body, (k, r, c) => {
    if (k === 'A' && body[r + 1]?.[c] === 'o' && c % 2 === 0) return 'w';
    if (!'naew'.includes(k) || k === CLEAR) return null;
    return (r % 3 === 0 && (c + r) % 4 === 0) || (r % 3 === 1 && (c + r) % 4 === 1) ? 'F' : null;
  }),
  palette: { '.': null, F: C.furShade, w: C.furLight },
});

/** A wolf's ears: tall and pointed, tipped outward, pink inside, pricked up through his mane. */
const WOLF_EARS = drawn(
  (view) => {
    const s = sketch();
    const ear = (tip: number, from: number, to: number, inner: boolean) => {
      for (let y = 0; y <= 7; y++) {
        const t = y / 7;
        const l = Math.round(tip + (from - tip) * t);
        const r = Math.round(tip + 1 + (to - tip - 1) * t);
        for (let x = Math.min(l, r); x <= Math.max(l, r); x++) s.set(x, y, 'm');
        if (inner && y >= 3 && y <= 6) {
          for (let x = Math.min(l, r) + 1; x < Math.max(l, r); x++) s.set(x, y, 'x');
        }
      }
      s.set(tip, 0, 'L');
    };
    if (view === 'side') ear(12, 10, 16, true);
    else {
      ear(5, 6, 11, view === 'front');
      ear(26, 21, 26, view === 'front');
    }
    return s;
  },
  C.fur,
  { x: C.rose },
);

/** His muzzle: pale fur round a big black nose and a smile, pushed out past his face from the side. */
const SNOUT: Touch = (view, body) => {
  const s = sketch();
  const palette: Palette = {
    '.': null,
    k: C.ink,
    n: C.stoneDark,
    L: mix(C.furLight, C.cream, 0.4),
    M: C.furShade,
    u: C.rose,
    o: ramp(C.fur)[0],
  };
  if (view === 'back') return null;
  if (view === 'front') {
    s.rect(13, 18, 6, 1, 'L').rect(12, 19, 8, 2, 'L').rect(13, 21, 6, 1, 'L');
    s.rect(14, 18, 4, 1, 'k').rect(15, 19, 2, 1, 'k').set(14, 18, 'n');
    s.set(14, 20, 'M').set(17, 20, 'M').rect(15, 21, 2, 1, 'u');
    s.rect(13, 22, 6, 1, 'M');
    return { rows: s.rows, palette };
  }
  s.rect(20, 17, 7, 4, 'L').rect(21, 21, 5, 1, 'L');
  s.rect(26, 16, 2, 2, 'k').set(26, 16, 'n').rect(23, 20, 3, 1, 'M').set(22, 21, 'u');
  // An outline round what sticks out past his face.
  s.outline((k) => (k === 'L' || k === 'k' || k === 'n' ? 'o' : null));
  for (let y = 0; y < DOLL_HEIGHT; y++) {
    for (let x = 0; x < DOLL_WIDTH; x++) {
      if (s.get(x, y) === 'o' && (body[y]?.[x] ?? CLEAR) !== CLEAR) s.set(x, y, CLEAR);
    }
  }
  return { rows: s.rows, palette };
};

/** A big bushy tail, pale at the tip: behind his legs from the front and side, over his jeans behind. */
const TAIL: Touch = (view, body) => {
  const s = sketch();
  if (view === 'back') {
    s.sphere(16, 40, 3.5, 5.5, 'MmmL').rect(15, 45, 2, 1, 'x').rect(14, 44, 4, 1, 'x');
  } else if (view === 'side') {
    s.sphere(6, 36, 3.5, 6, 'MmmL').rect(3, 31, 3, 2, 'x').set(2, 32, 'x');
    s.rect(8, 34, 3, 3, 'm');
    behind(s, body);
  } else {
    s.sphere(26, 40, 3, 5, 'MmmL').rect(26, 44, 3, 1, 'x').set(27, 45, 'x');
    behind(s, body);
  }
  return { rows: finish(s.rows, body, 'drawn'), palette: { ...tones(C.fur), x: C.furLight } };
};

// ---- Wrapunzel: a mummy, whose hair is bandages all the way down ----

/** Her wraps, all over but for a gap round her eyes, so they peek out. */
const WRAPS: Touch = (view, body) => ({
  rows: bandaged(body, 'snbpaewAlf', (r, c) =>
    view === 'back' ? false : r >= 13 && r <= 18 && (view === 'side' ? c >= 18 : c >= 9 && c <= 22),
  ),
  palette: WRAP_TONES,
});

const WRAP_TONES: Palette = { '.': null, W: C.bandageShade, l: C.white };

const WRAPPED_HAIR: Touch = (_view, body, facing) => ({
  rows: bandaged(hairRows(HAIR.long, facing, body), 'hgjJ'),
  palette: WRAP_TONES,
});

/** A loose end of bandage come unwound from her wrist, trailing as she goes. */
const LOOSE_END: Touch = (view, body) => {
  const s = sketch();
  const trail = (x: number, dir: 1 | -1) =>
    s
      .rect(x, 37, 2, 2, 'm')
      .rect(x + dir, 39, 2, 2, 'm')
      .rect(x + dir * 2, 41, 2, 2, 'm')
      .set(x + dir * 2 + (dir > 0 ? 1 : 0), 43, 'm');
  if (view === 'back') trail(23, 1);
  else if (view === 'side') trail(14, -1);
  else trail(6, -1);
  return { rows: finish(s.rows, body, 'drawn'), palette: tones(C.bandage) };
};

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

/** A witch's nose, a touch pointier from the side, and a beauty mark on her cheek. */
const WITCHY = face(
  (view) =>
    view === 'front'
      ? sketch().set(20, 20, 'k')
      : sketch()
          .rect(24, 18, 1, 2, 's')
          .set(25, 19, 's')
          .set(24, 20, 'o')
          .set(25, 20, 'o')
          .set(26, 19, 'o')
          .set(25, 18, 'o')
          .set(21, 20, 'k'),
  { '.': null, k: C.plum, s: C.skinMinty, o: ramp(C.skinMinty)[0] },
);

/** A silver crescent moon on a fine chain. */
const CRESCENT = face(
  (view) => {
    const s = sketch();
    if (view === 'side') return s.set(19, 26, 'c').set(19, 27, 'm');
    for (const [x, y] of [
      [12, 25],
      [13, 26],
      [18, 26],
      [19, 25],
    ] as const) {
      s.set(x, y, 'c');
    }
    return s
      .rect(14, 27, 1, 1, 'c')
      .rect(17, 27, 1, 1, 'c')
      .rect(15, 28, 2, 1, 'm')
      .set(15, 27, 'm')
      .set(14, 28, 'm');
  },
  { '.': null, c: C.silverShade, m: C.silver },
);

// ---- Barty: a skeleton, cheerful to the bone ----

/** His skull: round sockets with a twinkle in each, a little heart of a nose, and a grin. */
const SKULL = face(
  (view) => {
    const s = sketch();
    const socket = (x: number) =>
      s
        .rect(x + 1, 14, 2, 1, 'k')
        .rect(x, 15, 4, 2, 'k')
        .rect(x + 1, 17, 2, 1, 'k')
        .set(x + 1, 15, 'w');
    if (view === 'front') {
      socket(10);
      socket(18);
      s.set(10, 18, 'c').set(21, 18, 'c');
      s.rect(15, 19, 2, 1, 'k').set(14, 19, 'c').set(17, 19, 'c');
      s.set(12, 20, 'k').set(19, 20, 'k').rect(13, 21, 6, 1, 'k');
      for (const x of [14, 16, 18]) s.set(x, 22, 'c');
    } else {
      socket(19);
      s.set(23, 18, 'c').rect(23, 19, 1, 1, 'k');
      s.rect(19, 21, 4, 1, 'k').set(18, 20, 'k').set(20, 22, 'c');
    }
    return s;
  },
  { '.': null, k: C.inkFabric, w: C.white, c: C.boneShade },
);

/**
 * His bones: collarbones, a breastbone and ribs that curve down round his chest, a spine and
 * shoulder blades from behind, a pair of bones down each forearm, a knobbly elbow and knuckles.
 */
const BONES: Touch = (view, body) => ({
  rows: paint(body, (k, r, c) => {
    if (k === 'e' && body[r - 1]?.[c] === 'a') return 'k';
    if (k === 'w' && body[r]?.[c - 1] === 'w' && body[r]?.[c + 1] === 'w') return 'k';
    if (k === 'A' && body[r + 1]?.[c] === 'o' && c % 2 === 1) return 'k';
    if (k !== 'b') return null;
    if (view === 'side') return (r === 27 || r === 29 || r === 31) && c >= 18 ? 'k' : null;
    if (view === 'back') {
      if (c === 15 || c === 16) return r % 2 === 0 ? 'k' : 'l';
      const blade = r >= 27 && r <= 29 && (c === 12 || c === 19);
      return blade || (r === 30 && (c === 13 || c === 18)) ? 'k' : null;
    }
    if (c === 15 || c === 16) return r >= 26 && r <= 31 ? 'l' : null;
    const out = c < 15 ? 14 - c : c - 17;
    if (r === 26) return out <= 3 ? 'k' : null;
    // Each rib runs out from his breastbone and dips a row at its end.
    for (const [rib, reach] of [
      [28, 4],
      [30, 4],
      [32, 3],
    ] as const) {
      if (r === rib && out < reach - 1) return 'k';
      if (r === rib + 1 && out === reach - 1) return 'k';
    }
    return null;
  }),
  palette: { '.': null, k: C.boneShade, l: C.white },
});

/** A daisy tucked in his hat band. */
const DAISY: Touch = (view) => {
  const s = sketch();
  const x = view === 'front' ? 23 : 8;
  s.rect(x - 1, 6, 3, 1, 'w')
    .rect(x, 5, 1, 3, 'w')
    .set(x, 6, 'y');
  return { rows: s.rows, palette: { '.': null, w: C.white, y: C.gold } };
};

// ---- The Moon Pie Man: dark glasses and a hat pulled down, so nobody knows who he is ----

/** Dark glasses, a glint of light on each lens, so nobody knows who he is, and a smile. */
const SHADES = face(
  (view) =>
    view === 'front'
      ? sketch()
          .rect(10, 14, 5, 4, 'k')
          .rect(17, 14, 5, 4, 'k')
          .rect(15, 15, 2, 1, 'k')
          .set(11, 15, 'w')
          .set(18, 15, 'w')
          .rect(14, 21, 4, 1, 'm')
          .set(13, 20, 'm')
          .set(18, 20, 'm')
      : sketch()
          .rect(19, 14, 5, 4, 'k')
          .rect(14, 15, 5, 1, 'k')
          .set(21, 15, 'w')
          .rect(21, 21, 2, 1, 'm')
          .set(20, 20, 'm'),
  { '.': null, k: C.ink, w: C.white, m: C.skinHoneyShade },
);

/** A red bow tie at his collar, smart for the customers. */
const BOW_TIE = face(
  (view) =>
    view === 'front'
      ? sketch().rect(13, 25, 2, 2, 'r').rect(17, 25, 2, 2, 'r').rect(15, 25, 2, 1, 'R')
      : sketch().rect(19, 25, 2, 2, 'r'),
  { '.': null, r: C.scarlet, R: C.scarletShade },
);

/** A little gold crescent pinned to his hat band: his moon pies' own. */
const MOON_PIN: Touch = (view) => {
  if (view === 'back') return null;
  const x = view === 'front' ? 11 : 17;
  return {
    rows: sketch()
      .set(x, 5, 'g')
      .set(x - 1, 6, 'g')
      .set(x, 7, 'g').rows,
    palette: { '.': null, g: C.candleBright },
  };
};

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

/** A big bushy moustache, combed and a shade lighter on top: the whole of his disguise. */
const MOUSTACHE = face(
  (view) =>
    view === 'front'
      ? sketch()
          .rect(12, 19, 8, 2, 'M')
          .rect(13, 19, 2, 1, 'L')
          .rect(17, 19, 2, 1, 'L')
          .set(11, 20, 'M')
          .set(20, 20, 'M')
          .set(10, 21, 'M')
          .set(21, 21, 'M')
      : sketch().rect(19, 19, 4, 2, 'M').rect(20, 19, 2, 1, 'L').set(23, 20, 'M'),
  { '.': null, M: C.hairBrownShade, L: C.hairBrown },
);

/**
 * His trench coat, belted and buckled at the waist, double-breasted, with its collar turned up
 * either side of his neck.
 */
const TRENCH: Touch = (view) => {
  const s = sketch();
  if (view === 'side') {
    s.rect(11, 32, 11, 2, 'b').set(21, 32, 'g');
    s.rect(17, 22, 3, 4, 'c').rect(17, 22, 1, 4, 'C');
  } else {
    s.rect(10, 32, 12, 2, 'b');
    if (view === 'front') {
      s.rect(15, 32, 2, 2, 'g').set(15, 32, 'b');
      for (const [x, y] of [
        [13, 27],
        [18, 27],
        [13, 30],
        [18, 30],
      ] as const) {
        s.set(x, y, 'k');
      }
      s.rect(10, 22, 3, 4, 'c')
        .rect(19, 22, 3, 4, 'c')
        .rect(12, 23, 1, 3, 'C')
        .rect(19, 23, 1, 3, 'C');
    } else s.rect(9, 22, 14, 3, 'c');
  }
  return {
    rows: s.rows,
    palette: {
      '.': null,
      b: C.stoneDark,
      g: C.silver,
      k: C.inkFabric,
      c: C.stoneLight,
      C: C.stone,
    },
  };
};

// ---- Ollie: the postie, in his cap, with his satchel across him ----

/** A postie's flat cap, peaked at the front, with a band round it and a gold badge. */
const POSTIE_CAP = drawn(
  (view) => {
    const s = sketch();
    const cx = view === 'side' ? 15 : 16;
    s.ellipse(cx, 7, 10, 5, 'm').rect(0, 8, DOLL_WIDTH, 40, CLEAR);
    s.rect(cx - 10, 6, 20, 3, 'x');
    if (view === 'front') s.rect(cx - 8, 9, 16, 2, 'M').rect(cx - 1, 3, 2, 2, 'g');
    else if (view === 'side') s.rect(cx + 4, 8, 9, 2, 'M').rect(cx + 5, 3, 1, 2, 'g');
    return s;
  },
  C.navy,
  { x: C.scarlet, g: C.gold },
);

/**
 * His satchel's strap, from one shoulder across to the other hip with a buckle on it, and the bag
 * at his side: its flap buckled down, and a letter peeking out from under it.
 */
const SATCHEL: Touch = (view, body) => {
  const s = sketch();
  const bag = (x: number, y: number, w: number, h: number) => {
    s.rect(x + 1, y - 2, 4, 2, 'w').set(x + 3, y - 1, 'r');
    s.rect(x, y, w, h, 'm')
      .rect(x, y, w, 1, 'L')
      .rect(x, y + 1, w, 2, 'M');
    s.set(x + Math.floor(w / 2), y + 2, 'g');
  };
  if (view === 'front') {
    for (let k = 0; k < 12; k++) s.rect(11 + k, 25 + k, 2, 1, 'm');
    s.rect(15, 29, 2, 1, 'g');
    bag(20, 35, 7, 5);
  } else if (view === 'side') {
    bag(11, 34, 8, 6);
  } else {
    for (let k = 0; k < 12; k++) s.rect(20 - k, 25 + k, 2, 1, 'm');
  }
  return {
    rows: finish(s.rows, body, 'drawn'),
    palette: { ...tones(C.wood), g: C.gold, w: C.white, r: C.scarlet },
  };
};

// ---- Nessa: a lake monster, shy and sea-green, with fins for ears ----

/** Fins either side of her head, fanned and ribbed. */
const FINS: Touch = (view, body) => {
  const s = sketch();
  const fin = (x: number, dir: 1 | -1) => {
    for (let j = 0; j < 7; j++) {
      const reach = 4 - Math.abs(j - 2) + (j < 3 ? 1 : 0);
      for (let k = 0; k < reach; k++) s.set(x + dir * k, 10 + j, j % 2 === 0 ? 'M' : 'm');
    }
  };
  if (view === 'front') {
    fin(4, -1);
    fin(27, 1);
  } else if (view === 'side') fin(10, -1);
  else {
    fin(4, -1);
    fin(27, 1);
  }
  return { rows: finish(s.rows, body, 'drawn'), palette: tones(C.teal) };
};

/** Scales down her arms, each a glint with its shade tucked under it, staggered row to row. */
const SCALES: Touch = (_view, body) => ({
  rows: paint(body, (k, r, c) => {
    if (!'aew'.includes(k) || k === CLEAR) return null;
    const row = Math.floor(r / 2);
    if (r % 2 === 0 && (c + row) % 2 === 0) return 'l';
    return null;
  }),
  palette: { '.': null, l: mix(C.tealLight, C.white, 0.35) },
});

/** A little pink shell clipped in her hair. */
const SHELL: Touch = (view) => {
  const s = sketch();
  const x = view === 'front' ? 8 : view === 'side' ? 12 : 22;
  s.rect(x, 7, 3, 2, 's')
    .set(x + 1, 6, 's')
    .set(x + 1, 7, 'S')
    .set(x + 1, 8, 'S');
  return { rows: s.rows, palette: { '.': null, s: C.roseLight, S: C.rose } };
};

// ---- Gourdon: a carpenter with a pumpkin for a head, lit from inside after dark ----

/**
 * His head: a round pumpkin with ribs curving round it and a curly stalk with a leaf, and a
 * carved face (triangle eyes and nose, a toothy grin) that isn't there behind. The pumpkin's
 * pale flesh shows along the lower edge of each cut, where its wall is seen.
 */
const PUMPKIN_HEAD: Touch = (view, body) => {
  const s = sketch();
  const cx = view === 'side' ? 15 : 16;
  for (const [dx, rx] of [
    [-5, 7],
    [5, 7],
    [0, 8],
  ] as const) {
    s.sphere(cx + dx, 14, rx, 10, 'Mmm' + 'L');
  }
  for (let y = 5; y < 24; y++) {
    const t = (y + 0.5 - 14) / 10;
    const bulge = Math.sqrt(Math.max(0, 1 - t * t));
    for (const side of [-1, 1])
      s.set(cx + side * Math.round(1 + 2.5 * bulge) - (side > 0 ? 1 : 0), y, 'M');
  }
  s.rect(cx - 1, 1, 2, 4, 'g')
    .set(cx + 1, 1, 'g')
    .set(cx + 2, 0, 'g')
    .set(cx + 3, 1, 'g');
  s.rect(cx - 4, 3, 3, 1, 'G')
    .set(cx - 3, 2, 'G')
    .set(cx - 3, 4, 'G');
  if (view !== 'back') {
    const eye = (x: number) =>
      s
        .set(x, 11, 'c')
        .rect(x - 1, 12, 3, 1, 'c')
        .rect(x - 2, 13, 5, 1, 'c');
    const at = view === 'front' ? [cx - 5, cx + 4] : [cx + 6];
    for (const x of at) eye(x);
    const nose = view === 'front' ? cx - 1 : cx + 9;
    s.set(nose, 15, 'c').rect(nose, 16, 2, 1, 'c');
    const [left, w] = view === 'front' ? [cx - 6, 12] : [cx + 3, 8];
    s.set(left, 18, 'c').set(left + w - 1, 18, 'c');
    s.rect(left, 19, w, 1, 'c').rect(left + 1, 20, w - 2, 1, 'c');
    // A tooth hanging from the top, and one standing up from the bottom.
    s.set(left + 3, 19, 'm').set(left + w - 4, 20, 'm');
    for (let y = 22; y > 10; y--) {
      for (let x = 0; x < DOLL_WIDTH; x++) {
        const under = s.get(x, y);
        if (s.get(x, y - 1) === 'c' && under !== 'c' && under !== CLEAR) s.set(x, y, 'f');
      }
    }
  }
  return {
    rows: finish(s.rows, body, 'drawn'),
    palette: {
      ...tones(C.pumpkin),
      g: C.leafDark,
      G: C.leaf,
      c: C.pumpkinDark,
      f: C.pumpkinLight,
    },
  };
};

/** A carpenter's tool belt: a leather band with a buckle, a pouch, and his hammer at his hip. */
const TOOL_BELT: Touch = (view) => {
  const s = sketch();
  if (view === 'side') {
    s.rect(11, 33, 11, 2, 'b').rect(18, 35, 3, 3, 'b');
    s.rect(11, 35, 1, 5, 'h').rect(10, 34, 3, 2, 'i');
  } else {
    s.rect(10, 33, 12, 2, 'b');
    if (view === 'front') {
      s.rect(15, 33, 2, 2, 'g').rect(10, 35, 3, 3, 'b').set(11, 35, 'y');
      s.rect(21, 35, 1, 5, 'h').rect(20, 34, 3, 2, 'i');
    } else s.rect(19, 35, 3, 3, 'b').rect(10, 35, 1, 5, 'h').rect(9, 34, 3, 2, 'i');
  }
  return {
    rows: s.rows,
    palette: {
      '.': null,
      b: C.bark,
      g: C.gold,
      h: C.wood,
      i: C.stoneDark,
      y: C.candle,
    },
  };
};

/** What of Gourdon lights up after dark: his carved face, candlelit from inside. */
export const PUMPKIN_HEAD_GLOW: Palette = { c: C.candle };

/** Gourdon's head from one side and walk frame, for his glow after dark. */
export function pumpkinHead(
  facing: Facing,
  frame: number,
): { rows: readonly string[]; palette: Palette } {
  const view = viewOf(facing);
  return PUMPKIN_HEAD(view, BODY[view][frame % DOLL_FRAMES]!, facing)!;
}

// ---- Hazel: a stargazer, with a star in her hair ----

const STAR_CLIP = face(
  (view) => {
    const x = view === 'side' ? 11 : 22;
    return sketch()
      .set(x, 5, 's')
      .rect(x - 1, 6, 3, 1, 's')
      .set(x, 7, 's')
      .set(x, 6, 'S');
  },
  { '.': null, s: C.gold, S: C.candleBright },
);

/** Stardust caught in her hair: a few tiny twinkles, like the sky she watches. */
const STARDUST: Touch = (view) => {
  const s = sketch();
  const spots: Record<View, readonly (readonly [number, number])[]> = {
    front: [
      [6, 17],
      [25, 24],
      [7, 27],
    ],
    side: [
      [7, 16],
      [11, 25],
    ],
    back: [
      [10, 13],
      [21, 19],
      [13, 26],
    ],
  };
  for (const [x, y] of spots[view])
    s.set(x, y, 'S')
      .set(x - 1, y, 's')
      .set(x + 1, y, 's')
      .set(x, y - 1, 's')
      .set(x, y + 1, 's');
  return { rows: s.rows, palette: { '.': null, s: C.gold, S: C.candleBright } };
};

const FIGURES: Record<Exclude<Figure, 'maude'>, FigureArt> = {
  cody: {
    skin: tone(C.skin, C.skinShade),
    eyes: C.eyeHazel,
    hair: { style: curly(HAIR.long), tones: solidHair(tone(C.hairBrown, C.hairBrownShade)) },
    clothes: [worn('jeans', 'denim'), worn('maroonTee', 'maroon'), worn('sneakers', 'ink')],
    under: [FANGS, CAPE, CLASP],
    over: [worn('roundGlasses', 'ink', tone(C.bark, C.barkDark))],
  },
  rufus: {
    skin: tone(C.fur, C.furShade),
    eyes: C.gold,
    hair: { style: shaggy(HAIR.bob), tones: solidHair(tone(C.furShade, C.bark)) },
    clothes: [worn('jeans', 'denim'), worn('cozyTee', 'moss'), worn('stompyBoots', 'ink')],
    onSkin: [FUR],
    under: [SNOUT, TAIL],
    // His flower crown sits between his ears.
    over: [WOLF_EARS, worn('flowerCrown', 'rose')],
  },
  wrapunzel: {
    skin: tone(C.bandage, C.bandageShade),
    eyes: C.eyePlum,
    face: { lashes: true },
    hair: { style: HAIR.long, tones: solidHair(tone(C.bandage, C.bandageShade)) },
    clothes: [worn('sundressDots', 'rose'), worn('maryJanes', 'ink')],
    onSkin: [WRAPS],
    under: [LOOSE_END],
    over: [WRAPPED_HAIR, TOQUE],
  },
  agatha: {
    skin: tone(C.skinMinty, C.skinMintyShade),
    eyes: C.eyePlum,
    face: { lashes: true },
    lips: C.plum,
    hair: { style: HAIR.long, tones: solidHair(tone(C.hairBlack, C.hairBlackShade)) },
    clothes: [worn('starryDress', 'navy'), worn('maryJanes', 'ink')],
    under: [WITCHY, CRESCENT],
    over: [worn('witchHat', 'plum')],
  },
  barty: {
    skin: tone(C.bone, C.boneShade),
    eyes: null,
    hair: null,
    clothes: [worn('jeans', 'denim'), worn('stompyBoots', 'ink')],
    onSkin: [BONES],
    under: [SKULL],
    over: [worn('strawSunHat', 'gold'), DAISY],
  },
  ollie: {
    skin: tone(C.skinBronze, C.skinBronzeShade),
    eyes: C.eyeBrown,
    hair: { style: HAIR.pixie, tones: solidHair(tone(C.hairBlack, C.hairBlackShade)) },
    clothes: [worn('jeans', 'denim'), worn('postieTee', 'navy'), worn('sneakers', 'scarlet')],
    under: [SATCHEL],
    over: [POSTIE_CAP],
  },
  nessa: {
    skin: tone(C.tealLight, C.teal),
    eyes: C.gold,
    face: { lashes: true },
    hair: { style: HAIR.long, tones: solidHair(tone(C.navy, C.navyShade)) },
    clothes: [worn('bubbleDress', 'navy'), worn('maryJanes', 'ink')],
    onSkin: [SCALES],
    over: [FINS, SHELL],
  },
  gourdon: {
    skin: tone(C.rope, C.wood),
    eyes: null,
    hair: null,
    clothes: [worn('jeans', 'denim'), worn('flannelShirt', 'scarlet'), worn('stompyBoots', 'ink')],
    under: [TOOL_BELT, PUMPKIN_HEAD],
  },
  hazel: {
    skin: tone(C.skinPorcelain, C.skinPorcelainShade),
    eyes: C.eyeGrey,
    face: { lashes: true, freckles: true },
    hair: { style: HAIR.long, tones: solidHair(tone(C.hairAuburn, C.hairAuburnShade)) },
    clothes: [worn('pleatedSkirt', 'plum'), worn('nightSkyTee', 'navy'), worn('maryJanes', 'ink')],
    over: [worn('roundGlasses', 'ink', tone(C.gold, C.goldShade)), STAR_CLIP, STARDUST],
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
    under: [SHADES, BOW_TIE],
    over: [FEDORA, MOON_PIN],
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
    under: [TRENCH, MOUSTACHE],
    over: [LOW_HAT],
  },
};

// ---- In costume, for the Halloween Festival (0.2's J2) ----

/**
 * What each neighbour wears in costume (`NEIGHBOUR_COSTUMES` in `src/data/costumes.ts` says when),
 * in place of their own clothes, touches or hats where it says. Maude's is her hat alone.
 */
const COSTUMES: Record<Exclude<Figure, 'maude' | 'moonPieMan' | 'wes'>, Partial<FigureArt>> = {
  cody: {
    over: [worn('lionMane', 'gold'), worn('roundGlasses', 'ink', tone(C.bark, C.barkDark))],
  },
  barty: {
    clothes: [worn('jeans', 'denim'), worn('flannelShirt', 'scarlet'), worn('stompyBoots', 'ink')],
  },
  // A wolf in sheep's clothing: a woolly hood, his own ears inside it.
  rufus: { over: [worn('lionMane', 'cream', tone(C.white, C.ghost))] },
  // Ears a shade lighter than her hair, so they show against it.
  agatha: {
    clothes: [worn('wednesdayDress', 'ink'), worn('maryJanes', 'ink')],
    over: [worn('catEars', 'ink', tone(C.stoneDark, C.inkFabric))],
  },
  wrapunzel: {
    clothes: [
      worn('butterflyWings', 'pumpkin', tone(C.monarch, C.pumpkinDark)),
      worn('maryJanes', 'ink'),
    ],
    over: [WRAPPED_HAIR, worn('butterflyAntennae', 'ink')],
  },
  ollie: {
    clothes: [worn('jeans', 'ink'), worn('ringmasterCoat', 'scarlet'), worn('sneakers', 'scarlet')],
    under: [],
    over: [worn('ringmasterHat', 'ink')],
  },
  nessa: {
    clothes: [worn('jeans', 'denim'), worn('scaredyTee', 'moss'), worn('maryJanes', 'ink')],
  },
  gourdon: {
    clothes: [worn('jeans', 'denim'), worn('bugCatcherShirt', 'moss'), worn('stompyBoots', 'ink')],
    over: [worn('bugCatcherHat', 'cream')],
  },
  hazel: {
    clothes: [
      worn('pleatedSkirt', 'scarlet'),
      worn('clueTurtleneck', 'pumpkin'),
      worn('maryJanes', 'ink'),
    ],
    over: [worn('clueGlasses', 'ink'), STAR_CLIP],
  },
};

/**
 * Cody at the Halloween finale (0.2's J4): the other half of whatever couple's costume she's in
 * (personal_touches.md, question 44). His own lion is `COSTUMES.cody`.
 */
const CODY_HALVES: Record<Exclude<CodyHalf, 'lion'>, Partial<FigureArt>> = {
  // Wings, not a cape, and his glasses on.
  butterfly: {
    clothes: [
      worn('butterflyWings', 'pumpkin', tone(C.monarch, C.pumpkinDark)),
      worn('stompyBoots', 'ink'),
    ],
    under: [FANGS],
    over: [worn('butterflyAntennae', 'ink'), worn('roundGlasses', 'ink', tone(C.bark, C.barkDark))],
  },
  bugCatcher: {
    clothes: [worn('jeans', 'denim'), worn('bugCatcherShirt', 'moss'), worn('stompyBoots', 'ink')],
    under: [FANGS],
    over: [worn('bugCatcherHat', 'cream'), worn('roundGlasses', 'ink', tone(C.bark, C.barkDark))],
  },
  ringmaster: {
    clothes: [worn('jeans', 'ink'), worn('ringmasterCoat', 'scarlet'), worn('stompyBoots', 'ink')],
    under: [FANGS],
    over: [worn('ringmasterHat', 'ink'), worn('roundGlasses', 'ink', tone(C.bark, C.barkDark))],
  },
  scaredy: {
    clothes: [worn('jeans', 'denim'), worn('scaredyTee', 'moss'), worn('sneakers', 'ink')],
    under: [FANGS],
  },
  clueFinder: {
    clothes: [worn('jeans', 'ink'), worn('clueTurtleneck', 'pumpkin'), worn('maryJanes', 'ink')],
    under: [FANGS],
    over: [worn('clueGlasses', 'ink')],
  },
};

/** Maude's costume: a ghost hunter's hat, on a ghost. */
const MAUDE_HAT: Dressed = worn('bugCatcherHat', 'cream');

// ---- Maude: a ghost in a sheet, with her reading glasses ----

/**
 * A sheet over a round head, flaring to a wavy hem, with eyes behind gold-rimmed glasses on a
 * chain, and a library book held up in front of her.
 */
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
  // A little light on the crown of her head.
  s.rect(cx - 5, 10, 3, 1, 'l').rect(cx - 6, 11, 2, 2, 'l');
  if (view === 'back') return s.rows;
  const lens = (x: number) => {
    s.rect(x, 15, 5, 5, 'g')
      .rect(x + 1, 16, 3, 3, 'w')
      .rect(x + 1, 16, 2, 2, 'e')
      .set(x + 1, 16, 'l');
  };
  if (view === 'front') {
    lens(10);
    lens(17);
    s.set(15, 16, 'g').set(16, 16, 'g');
    s.rect(9, 21, 2, 1, 'c').rect(21, 21, 2, 1, 'c');
    s.rect(15, 22, 2, 1, 'u');
    // Her glasses' chain, looped under her chin.
    for (const [x, y] of [
      [10, 20],
      [10, 22],
      [11, 24],
      [13, 25],
      [15, 26],
      [17, 26],
      [19, 25],
      [20, 24],
      [21, 22],
      [21, 20],
    ] as const) {
      s.set(x, y, 'g');
    }
    // The book, a sheet-covered hand either side of it: its spine, a gold title, its pages.
    s.rect(11, 28, 10, 7, 'B').rect(11, 28, 1, 7, 'b').rect(12, 34, 9, 1, 'p');
    s.rect(14, 30, 5, 1, 'g').rect(15, 32, 3, 1, 'g');
    s.rect(9, 30, 3, 3, 'W').rect(20, 30, 3, 3, 'W').rect(9, 30, 3, 1, 'w').rect(20, 30, 3, 1, 'w');
  } else {
    lens(19);
    s.rect(15, 16, 4, 1, 'g');
    s.rect(22, 21, 2, 1, 'c');
    s.set(23, 22, 'u');
    s.set(19, 21, 'g').set(19, 23, 'g').set(20, 25, 'g');
    // The book held out in front, seen edge on: its cover and pages.
    s.rect(22, 28, 3, 7, 'B').rect(25, 29, 1, 5, 'p');
    s.rect(19, 30, 4, 3, 'W').rect(19, 30, 4, 1, 'w');
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
  l: C.white,
  g: C.gold,
  e: C.ink,
  c: C.cheek,
  u: C.rose,
  B: C.maroon,
  b: C.maroonShade,
  p: C.cream,
};

export const MAUDE_GLOW: Palette = { w: C.ghost, W: C.skinGhostlyShade, l: C.white };

/** Maude from one side, for the bake cache and the gallery. */
export function maudeRows(facing: Facing): readonly string[] {
  return MAUDE[viewOf(facing)];
}

/**
 * A figure in layers, bottom first, for one facing and walk frame: the body in their skin, their
 * face, their clothes, their own touches, their hair, then anything worn over it.
 */
export function figureLayers(
  id: Figure,
  facing: Facing,
  frame: number,
  costume: Costume | null = null,
  wears: BraceletId | null = null,
): Layer[] {
  const costumed = costume !== null;
  const view = viewOf(facing);
  const body = BODY[view][frame % DOLL_FRAMES]!;
  if (id === 'maude') {
    const sheet: Layer = { source: { rows: MAUDE[view] }, palette: MAUDE_PALETTE };
    if (!costumed) return [sheet];
    const hat = MAUDE_HAT.worn;
    return raised([
      sheet,
      { source: { rows: pieceRows(hat, view, body) }, palette: wornPalette(hat) },
    ]);
  }
  const own = FIGURES[id];
  const dressed =
    id === 'cody' && costume !== null && costume !== 'own' && costume !== 'lion'
      ? CODY_HALVES[costume]
      : costumed && id !== 'moonPieMan' && id !== 'wes'
        ? COSTUMES[id]
        : {};
  const art: FigureArt = { ...own, ...dressed };
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
    const palette = facePalette(art.eyes, art.skin);
    const lips: Palette = art.lips ? { U: art.lips, u: mix(art.lips, C.white, 0.25) } : {};
    add(faceRows(view, 'open', art.face ?? {}), { ...palette, ...lips });
  }
  art.clothes.forEach(dress);
  art.under?.forEach(touch);
  // A bracelet she gave them, on their wrist as on hers (0.2's W1).
  if (wears) add(wristRows([wears], body, facing), wristPalette([wears]));
  if (art.hair) add(hairRows(art.hair.style, facing, body), hairPalette(art.hair.tones));
  for (const o of art.over ?? []) {
    if (typeof o === 'function') touch(o);
    else dress(o);
  }
  return raised(layers);
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
