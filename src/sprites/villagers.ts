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
  raised,
  skinPalette,
  skinRows,
  viewOf,
  wornPalette,
  type FaceTouches,
  type Grid,
  type View,
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

// ---- Ollie: the postie, in his cap, with his satchel across him ----

/** A postie's flat cap, peaked at the front, with a band round it. */
const POSTIE_CAP = drawn(
  (view) => {
    const s = sketch();
    const cx = view === 'side' ? 15 : 16;
    s.ellipse(cx, 7, 10, 5, 'm').rect(0, 8, DOLL_WIDTH, 40, CLEAR);
    s.rect(cx - 10, 6, 20, 3, 'x');
    if (view === 'front') s.rect(cx - 8, 9, 16, 2, 'M');
    else if (view === 'side') s.rect(cx + 4, 8, 9, 2, 'M');
    return s;
  },
  C.navy,
  { x: C.scarlet },
);

/** His satchel's strap, from one shoulder across to the other hip, and the bag at his side. */
const SATCHEL: Touch = (view, body) => {
  const s = sketch();
  if (view === 'front') {
    for (let k = 0; k < 12; k++) s.rect(11 + k, 25 + k, 2, 1, 'm');
    s.rect(20, 35, 7, 5, 'm').rect(20, 35, 7, 1, 'L');
  } else if (view === 'side') {
    s.rect(11, 34, 8, 6, 'm').rect(11, 34, 8, 1, 'L');
  } else {
    for (let k = 0; k < 12; k++) s.rect(20 - k, 25 + k, 2, 1, 'm');
  }
  return { rows: finish(s.rows, body, 'drawn'), palette: tones(C.wood) };
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

// ---- Gourdon: a carpenter with a pumpkin for a head, lit from inside after dark ----

/** His head: a round ribbed pumpkin with a stalk, and a carved face that isn't there behind. */
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
  for (const dx of [-3, 3]) for (let j = 6; j < 23; j++) s.set(cx + dx, j, 'M');
  s.rect(cx - 1, 1, 3, 4, 'g').rect(cx + 2, 1, 2, 1, 'g');
  if (view !== 'back') {
    const eye = (x: number) => s.set(x, 12, 'c').rect(x - 1, 13, 3, 2, 'c');
    const at = view === 'front' ? [cx - 5, cx + 5] : [cx + 6];
    for (const x of at) eye(x);
    const mouth = view === 'front' ? [cx - 5, 10] : [cx + 3, 7];
    s.rect(mouth[0]!, 18, mouth[1]!, 2, 'c').set(mouth[0]!, 17, 'c');
    s.set(mouth[0]! + mouth[1]! - 1, 17, 'c').set(mouth[0]! + 3, 19, 'm');
  }
  return {
    rows: finish(s.rows, body, 'drawn'),
    palette: { ...tones(C.pumpkin), g: C.leafDark, c: C.pumpkinDark },
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
    over: [FINS],
  },
  gourdon: {
    skin: tone(C.rope, C.wood),
    eyes: null,
    hair: null,
    clothes: [worn('jeans', 'denim'), worn('flannelShirt', 'scarlet'), worn('stompyBoots', 'ink')],
    under: [PUMPKIN_HEAD],
  },
  hazel: {
    skin: tone(C.skinPorcelain, C.skinPorcelainShade),
    eyes: C.eyeGrey,
    face: { lashes: true, freckles: true },
    hair: { style: HAIR.long, tones: solidHair(tone(C.hairAuburn, C.hairAuburnShade)) },
    clothes: [worn('pleatedSkirt', 'plum'), worn('nightSkyTee', 'navy'), worn('maryJanes', 'ink')],
    over: [worn('roundGlasses', 'ink', tone(C.gold, C.goldShade)), STAR_CLIP],
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
export function figureLayers(id: Figure, facing: Facing, frame: number, costumed = false): Layer[] {
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
  const costume = costumed && id !== 'moonPieMan' && id !== 'wes' ? COSTUMES[id] : {};
  const art: FigureArt = { ...own, ...costume };
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
