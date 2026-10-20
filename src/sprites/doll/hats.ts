import type { CutId } from '../../types/ids';
import { CLEAR, Sketch } from '../sketch';
import { DOLL_HEIGHT, DOLL_WIDTH, type View } from './body';

/*
 * Hats and glasses, drawn by hand over her head and outlined all round; a tall one rises
 * `HAT_ROOM` rows above her (decision 131).
 */

/** A hat, one sketch for each way she faces; drawn over her hair and outlined all round. */
type HatStyle = (view: View) => Sketch;

/** Her pumpkin beanie: a ribbed dome with a stalk on top. */
const BEANIE: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const cx = view === 'side' ? 15 : 16;
  s.ellipse(cx, 10.5, 12.5, 9.5, 'm').rect(0, 11, DOLL_WIDTH, 40, CLEAR);
  s.rect(cx - 12, 9, 25, 2, 'M');
  for (let x = cx - 12; x <= cx + 12; x += 2) s.set(x, 10, 'm');
  for (const dx of [-6, 0, 6]) for (let y = 3; y < 9; y++) s.set(cx + dx, y, 'M');
  s.rect(cx - 1, 1, 2, 2, 'x');
  return s;
};

/**
 * How many rows a tall hat rises above her head, where her hair already reaches the top of her
 * 32×48 (phase V: squashed to fit, the witch hat lost its point and her hair showed round it).
 * Wearing one, every layer of her is lifted by this much, so her feet stay where they were.
 */
export const HAT_ROOM = 12;

/**
 * A witch hat: a brim just above her fringe, and a cone that covers the crown of her head and
 * rises above it, its tip flopped over the way they always are, with a candlelit band.
 */
const WITCH_HAT: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT + HAT_ROOM);
  const cx = view === 'side' ? 15 : 16;
  const at = (x: number) => (view === 'back' ? 31 - x : x);
  const base = HAT_ROOM + 6;
  for (let y = 1; y <= base; y++) {
    const half = (12 * y) / base;
    // The top of the cone leans over, a pixel more each row up.
    const lean = y < 6 ? Math.round((6 - y) ** 1.4 * 0.7) : 0;
    for (let x = Math.round(cx - half); x < Math.round(cx + half); x++) {
      s.set(at(x + lean), y, 'm');
    }
  }
  for (let x = cx - 11; x < cx + 11; x++) s.set(at(x), base - 2, 'x').set(at(x), base - 1, 'x');
  s.ellipse(cx, base + 1.5, 15, 2.2, 'm');
  return s;
};

/** Cat ears on a headband, pink inside where they face her way. */
const CAT_EARS: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const ears = view === 'side' ? [11, 17] : [7, 20];
  for (const left of ears) {
    for (let y = 0; y < 6; y++) {
      const w = 1 + Math.floor(y / 1.2);
      for (let x = left + 2 - Math.floor(w / 2); x < left + 2 - Math.floor(w / 2) + w; x++) {
        s.set(x, y, 'm');
      }
    }
    if (view !== 'back') s.rect(left + 1, 3, 2, 2, 'x').set(left + 2, 2, 'x');
  }
  for (let x = 5; x <= 26; x++) {
    const y = Math.round(3 + ((x - 15.5) / 11) ** 2 * 6);
    s.set(x, y, 'M').set(x, y + 1, 'M');
  }
  return s;
};

/** A ring of little flowers with leaves between them, over the top of her head. */
const FLOWER_CROWN: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const arc = (x: number) => Math.round(4 + ((x - 15.5) / 11) ** 2 * 5);
  for (let x = 5; x <= 26; x++) s.set(x, arc(x), 'y').set(x, arc(x) + 1, 'y');
  const flowers = view === 'side' ? [15, 20, 25] : [7, 12, 17, 22];
  for (const x of flowers) {
    const y = arc(x + 1) - 1;
    s.rect(x, y, 3, 3, 'm')
      .set(x, y, CLEAR)
      .set(x + 2, y, CLEAR)
      .set(x + 1, y + 1, 'x');
  }
  return s;
};

/** A wide-brimmed straw hat with a ribbon round it, for a day in the garden. */
const SUN_HAT: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const cx = view === 'side' ? 15 : 16;
  s.ellipse(cx, 8, 9, 7, 'm').rect(0, 8, DOLL_WIDTH, 40, CLEAR);
  s.rect(cx - 9, 6, 18, 2, 'y');
  s.ellipse(16, 9, 16, 2.5, 'm');
  return s;
};

/**
 * A bug catcher's pith helmet (0.2's J2): a round dome with a band, and a narrow brim all round.
 */
const EXPLORER_HAT: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const cx = view === 'side' ? 15 : 16;
  s.ellipse(cx, 9, 10, 8, 'm').rect(0, 9, DOLL_WIDTH, 40, CLEAR);
  s.rect(cx - 10, 6, 20, 2, 'x');
  s.ellipse(16, 9.5, 14, 2, 'm');
  s.set(cx, 1, 'M');
  return s;
};

/** How many rows a butterfly's antennae rise above her head. */
const ANTENNAE_ROOM = 6;

/** A butterfly's antennae on a headband, curling out, a bobble on the end of each. */
const ANTENNAE: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT + ANTENNAE_ROOM);
  const top = ANTENNAE_ROOM;
  for (let x = 5; x <= 26; x++) {
    const y = top + Math.round(3 + ((x - 15.5) / 11) ** 2 * 6);
    s.set(x, y, 'M').set(x, y + 1, 'M');
  }
  const roots =
    view === 'side'
      ? [[13, -1]]
      : [
          [12, -1],
          [19, 1],
        ];
  for (const [root, way] of roots as [number, number][]) {
    for (let i = 0; i < 7; i++) {
      const x = root + way * Math.round(i * 0.6 + (i > 4 ? i - 4 : 0));
      s.set(x, top + 3 - i, 'm');
    }
    const tip = root + way * (Math.round(6 * 0.6) + 2);
    s.rect(tip - 1, top - 5, 3, 2, 'x').rect(tip, top - 6, 1, 4, 'x');
  }
  return s;
};

/** A ringmaster's top hat (0.2's J2): a tall crown with a gold band, on a curled brim. */
const TOP_HAT: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT + HAT_ROOM);
  const cx = view === 'side' ? 15 : 16;
  const base = HAT_ROOM + 6;
  s.rect(cx - 7, 5, 14, base - 5, 'm');
  s.rect(cx - 7, base - 4, 14, 2, 'x');
  s.ellipse(cx, 5, 7, 1.2, 'M');
  s.ellipse(cx, base + 1.5, 12.5, 2, 'm');
  return s;
};

/**
 * A lion's mane (0.2's J2): a shaggy ring of fur all round her face, tufted at the edge, and two
 * round ears on top. From behind it's all mane.
 */
const MANE: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const cx = view === 'side' ? 13 : 16;
  s.ellipse(cx, 15, 13, 12.5, 'm');
  for (let a = 0; a < 24; a++) {
    const t = (a / 24) * Math.PI * 2;
    s.ellipse(cx + Math.cos(t) * 12.5, 15 + Math.sin(t) * 12, 2, 2, a % 2 ? 'm' : 'M');
  }
  for (let a = 0; a < 12; a++) {
    const t = (a / 12) * Math.PI * 2 + 0.2;
    s.set(Math.round(cx + Math.cos(t) * 9), Math.round(15 + Math.sin(t) * 9), 'M');
  }
  const ears = view === 'side' ? [cx + 3] : [cx - 8, cx + 8];
  for (const x of ears) s.ellipse(x, 3.5, 3, 3, 'm').ellipse(x, 4, 1.5, 1.5, 'x');
  if (view === 'front') s.ellipse(16, 17, 8, 8.5, CLEAR);
  if (view === 'side') s.ellipse(20, 17, 6.5, 8, CLEAR);
  return s;
};

/** How many rows a bobble rises above her head. */
const BOBBLE_ROOM = 3;

/** A knit beanie (0.2's W2): a turned-up, ribbed cuff and a fluffy bobble on top. */
const POM_BEANIE: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT + BOBBLE_ROOM);
  const cx = view === 'side' ? 15 : 16;
  const top = BOBBLE_ROOM;
  s.ellipse(cx, top + 10.5, 12.5, 9.5, 'm').rect(0, top + 11, DOLL_WIDTH, 40, CLEAR);
  s.rect(cx - 12, top + 7, 25, 4, 'M');
  for (let x = cx - 11; x <= cx + 11; x += 2) s.rect(x, top + 7, 1, 4, 'm');
  s.ellipse(cx, 3, 3.5, 3, 'x');
  return s;
};

/** A big floppy bow (0.2's W2), clipped at the side of her head, its tails hanging down. */
const HAIR_BOW: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  // On her left: the viewer's right from the front, and left from behind.
  const cx = view === 'front' ? 22 : view === 'back' ? 10 : 11;
  s.ellipse(cx - 3, 5, 3, 2.5, 'm').ellipse(cx + 3, 5, 3, 2.5, 'm');
  s.rect(cx - 5, 7, 2, 1, 'm').rect(cx + 3, 7, 2, 1, 'm');
  s.set(cx - 1, 9, 'm')
    .set(cx - 2, 10, 'm')
    .set(cx, 9, 'm')
    .set(cx + 1, 10, 'm');
  s.rect(cx - 1, 4, 2, 3, 'M');
  return s;
};

/** A tiara (0.2's W3): a band over the front of her hair and five points, a jewel in the middle. */
const TIARA: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'back') return s.rect(10, 4, 12, 1, 'm');
  const cx = view === 'side' ? 14 : 16;
  s.rect(cx - 6, 4, 12, 1, 'm');
  for (const dx of [-6, -4, 3, 5]) s.set(cx + dx, 3, 'm');
  for (const dx of [-3, 2]) s.set(cx + dx, 3, 'm').set(cx + dx, 2, 'm');
  s.rect(cx - 1, 1, 2, 3, 'm')
    .set(cx - 1, 0, 'm')
    .rect(cx - 1, 2, 2, 1, 'x');
  return s;
};

/** How many rows the bubble helmet rises above her hair, which reaches the top of her 32×48. */
const HELMET_ROOM = 3;

/**
 * A bubble helmet (0.2's W3): a round glass bowl right over her head and hair, its rim catching
 * the light at the top left, on a ring at her neck. Glass is see-through, so it's only a rim.
 */
const HELMET: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT + HELMET_ROOM);
  const top = HELMET_ROOM;
  const glass = new Sketch(DOLL_WIDTH, DOLL_HEIGHT + HELMET_ROOM)
    .ellipse(16, top + 11.5, 15.5, 13.5, 'M')
    .ellipse(16, top + 11.5, 14.5, 12.5, CLEAR)
    .rect(0, top + 22, DOLL_WIDTH, 10, CLEAR);
  s.stamp(glass, 0, 0);
  for (const [x, y] of [
    [5, 7],
    [6, 6],
    [7, 5],
    [8, 4],
    [5, 9],
  ] as const) {
    s.set(x, top + y, 'x');
  }
  const [from, to] = view === 'side' ? [10, 21] : [9, 23];
  s.rect(from, top + 22, to - from, 2, 'm').rect(from, top + 24, to - from, 1, 'M');
  return s;
};

/** Little devil horns (0.2's W3) on a headband, each leaning out from her crown. */
const HORNS: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const horns =
    view === 'side' ? [[12, -1] as const, [19, 1] as const] : [[10, -1] as const, [21, 1] as const];
  for (const [x, out] of horns) {
    s.rect(x - 1, 4, 3, 2, 'm')
      .rect(x - (out < 0 ? 1 : 0), 2, 2, 2, 'm')
      .set(x + out, 1, 'm');
  }
  return s;
};

/**
 * A farmer's straw hat (0.3's F3): a round crown with a dent in the top, a band, a patch sewn on,
 * and a wide floppy brim that dips at the ends, a few straws poking out of its edge.
 */
const FARM_HAT: HatStyle = (view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const cx = view === 'side' ? 15 : 16;
  s.ellipse(cx, 8, 8.5, 7, 'm').rect(0, 8, DOLL_WIDTH, 40, CLEAR);
  s.rect(cx - 1, 1, 3, 1, 'M').set(cx, 2, 'M');
  s.rect(cx - 8, 6, 17, 2, 'y');
  if (view !== 'back') s.rect(cx - 6, 3, 3, 3, 'x').set(cx - 5, 4, 'M');
  s.ellipse(16, 9, 16, 2.5, 'm');
  // The brim's ends droop a row, and straws poke out under them.
  s.rect(0, 10, 4, 2, 'm').rect(28, 10, 4, 2, 'm');
  for (const [x, y] of [
    [1, 12],
    [3, 12],
    [29, 12],
    [30, 13],
    [8, 11],
    [24, 11],
  ] as const) {
    s.set(x, y, 'M');
  }
  return s;
};

export const HATS: Partial<Record<CutId, HatStyle>> = {
  beanie: BEANIE,
  witchHat: WITCH_HAT,
  catEars: CAT_EARS,
  flowerCrown: FLOWER_CROWN,
  sunHat: SUN_HAT,
  explorerHat: EXPLORER_HAT,
  antennae: ANTENNAE,
  topHat: TOP_HAT,
  mane: MANE,
  pomBeanie: POM_BEANIE,
  hairBow: HAIR_BOW,
  tiara: TIARA,
  helmet: HELMET,
  horns: HORNS,
  farmHat: FARM_HAT,
};

type Glasses = 'roundGlasses' | 'catEyeGlasses' | 'squareGlasses';

/** Frames round her eyes; cat-eyes flick up at the outer corners, and square ones are thick. */
export function glassesRows(cut: Glasses, view: View): string[] {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'back') return s.rows;
  if (cut === 'squareGlasses') {
    const lens = (x: number) => s.rect(x, 14, 7, 5, 'm').rect(x + 1, 15, 5, 3, CLEAR);
    if (view === 'front') {
      lens(8);
      lens(17);
      s.rect(15, 15, 2, 1, 'm');
    } else {
      lens(19);
      s.rect(13, 15, 6, 1, 'm');
    }
    return s.rows;
  }
  const lens = (cx: number) => {
    const ring = new Sketch(DOLL_WIDTH, DOLL_HEIGHT)
      .ellipse(cx, 16.5, 3.5, 3.5, 'm')
      .ellipse(cx, 16.5, 2.5, 2.5, CLEAR);
    s.stamp(ring, 0, 0);
  };
  if (view === 'front') {
    lens(12);
    lens(20);
    s.rect(15, 15, 2, 1, 'm');
    if (cut === 'catEyeGlasses') s.rect(7, 13, 2, 1, 'm').rect(23, 13, 2, 1, 'm');
  } else {
    lens(21.5);
    s.rect(13, 15, 5, 1, 'm');
    if (cut === 'catEyeGlasses') s.rect(24, 13, 2, 1, 'm');
  }
  return s.rows;
}
