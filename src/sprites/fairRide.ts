import { hashString, seeded } from '../systems/random';
import type { ItemArt } from './items';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * A ride on the big wheel up close (1.6's X2, decision 381), for the stage on its sheet: the view
 * from her car, painted in three bands the stage slides past each other as she rises (the hills
 * and the castle far off, the town's roofs, the fair right below), and her car, from behind. Drawn
 * in daylight at the world's own pixels; the hour's light, the lit windows and bulbs and the sky are
 * the view's (`render/fairRide.ts`), as they are in the world. Only that file puts them together.
 */

/** The stage, in the art's own pixels, and each band's width: wider, so the view can sway. */
export const RIDE_W = 96;
export const RIDE_H = 112;
export const BAND_W = 128;

/** Where the horizon is in the far band, and how tall each band is. */
export const FAR_HORIZON = 30;
export const FAR_H = 44;
export const TOWN_H = 104;
export const FAIR_H = 84;
/** The fair's ground, where her pet waits, down the near band. */
export const FAIR_GROUND = 76;

/** Where her car hangs from the wheel's rim on the stage, and where its tub begins. */
export const HANGER = { x: 48, y: 16 } as const;
export const TUB = { x: 18, y: 86, w: 60, h: 24 } as const;

/** Every key the view's bands and car are painted in, by day. */
export const RIDE_PALETTE: Palette = {
  '.': null,
  // The far hills, the castle and the lake.
  k: C.canopyDark,
  K: C.hedge,
  h: C.hedgeDark,
  H: C.hedgeLight,
  c: C.stone,
  C: C.stoneDark,
  r: C.plum,
  R: C.ink,
  w: C.water,
  W: C.waterLight,
  z: C.gold,
  Z: C.goldShade,
  // The town: grass, trees, paths, walls and roofs in its colours.
  g: C.moss,
  G: C.mossDark,
  l: C.mossLight,
  e: C.canopy,
  E: C.canopyDark,
  L: C.canopyLight,
  s: C.stoneLight,
  a: C.cream,
  A: C.creamShade,
  d: C.wood,
  D: C.bark,
  t: C.teal,
  T: C.tealShade,
  m: C.maroon,
  M: C.maroonShade,
  p: C.pumpkin,
  P: C.pumpkinShade,
  v: C.lavender,
  V: C.lavenderShade,
  u: C.navy,
  U: C.navyShade,
  // The fair: its stripes, poles, wire and the bulbs strung between.
  x: C.scarlet,
  X: C.scarletShade,
  y: C.white,
  q: C.white,
  i: C.iron,
  o: C.plumLight,
  // What lights up after dark: windows, lanterns, and four colours of bulb.
  N: C.night,
  Q: C.pumpkinDark,
  '0': C.gold,
  '1': C.scarlet,
  '2': C.orbBlue,
  '3': C.orbGreen,
};

/** The same keys lit after dark: only what glows has a colour. */
export const RIDE_GLOW: Palette = {
  ...Object.fromEntries(Object.keys(RIDE_PALETTE).map((k) => [k, null])),
  N: C.candle,
  Q: C.candleBright,
  '0': C.candleBright,
  '1': C.roseLight,
  '2': C.orbBlueLight,
  '3': C.orbGreenLight,
};

/** The bulbs' keys, round the wheel's rim and along the fair's strings. */
export const RIDE_BULBS = ['0', '1', '2', '3'] as const;

/** A roof's colour and its shade, round the town. */
const ROOFS: readonly (readonly [string, string])[] = [
  ['r', 'R'],
  ['t', 'T'],
  ['m', 'M'],
  ['v', 'V'],
  ['u', 'U'],
  ['p', 'P'],
];

/** A little house seen from up the wheel: a gable of roof over a front with a lit window or two. */
function house(s: Sketch, x: number, base: number, w: number, roof: readonly [string, string]) {
  const walls = Math.max(3, Math.round(w * 0.55));
  const rise = Math.ceil(w / 2);
  s.rect(x, base - walls, w, walls, 'a').rect(x + w - 1, base - walls, 1, walls, 'A');
  for (let k = 0; k < rise; k++) {
    s.rect(x - 1 + k, base - walls - 1 - k, w + 2 - k * 2, 1, roof[0]);
    s.set(x + w - k, base - walls - 1 - k, roof[1]);
  }
  s.rect(x - 1, base - walls - 1, w + 2, 1, roof[1]);
  // A window or two, lit after dark, and a door on the bigger ones.
  if (w >= 9) {
    s.set(x + 2, base - walls + 1, 'N').set(x + w - 3, base - walls + 1, 'N');
    s.rect(x + Math.floor(w / 2), base - 2, 1, 2, 'D');
  } else s.set(x + Math.floor(w / 2), base - walls + 1, 'N');
  if (w >= 7) s.rect(x + w - 3, base - walls - rise + 1, 1, 2, 'C');
}

/** A tree from up high: a round crown lit from the top left. */
function tree(s: Sketch, cx: number, cy: number, r: number) {
  s.ellipse(cx, cy, r, r, 'E');
  s.ellipse(cx - 0.5, cy - 0.5, r - 0.8, r - 0.8, 'e');
  s.set(Math.round(cx - r / 2), Math.round(cy - r / 2), 'L');
}

/** The far band: two ranges of hills, Castle Mac-A-Boo on its hill, and the lake catching the sky. */
export const RIDE_FAR: SpriteSource = (() => {
  const s = new Sketch(BAND_W, FAR_H);
  const H = FAR_HORIZON;
  // The back range, bluish and soft.
  for (let x = 0; x < BAND_W; x++) {
    const top = Math.round(H - 9 - 4 * Math.sin(x / 11) - 3 * Math.sin(x / 5 + 2));
    s.rect(x, top, 1, FAR_H - top, 'k').set(x, top, 'K');
  }
  // The castle on its hill, at the left.
  s.ellipse(30, H - 9, 18, 8, 'k');
  s.rect(22, H - 22, 16, 12, 'c').rect(37, H - 22, 1, 12, 'C');
  for (const tx of [18, 38]) {
    s.rect(tx, H - 26, 5, 16, 'c').rect(tx + 4, H - 26, 1, 16, 'C');
    for (let k = 0; k < 3; k++) s.rect(tx + k, H - 27 - k, 5 - k * 2, 1, 'r');
    s.set(tx + 2, H - 22, 'N').set(tx + 2, H - 17, 'N');
  }
  for (let k = 0; k < 5; k++) s.rect(24 + k, H - 23 - k, 12 - k * 2, 1, 'r');
  s.rect(29, H - 31, 1, 4, 'C').rect(30, H - 31, 3, 2, 'z');
  s.set(26, H - 18, 'N')
    .set(30, H - 18, 'N')
    .set(33, H - 18, 'N');
  s.rect(28, H - 14, 4, 4, 'R');
  // The front range, darker, with the lake lying in its dip on the right.
  for (let x = 0; x < BAND_W; x++) {
    const dip = Math.max(0, 1 - Math.abs(x - 96) / 22);
    const top = Math.round(H - 3 - 3 * Math.sin(x / 9 + 1) - 2 * Math.sin(x / 4) + dip * 6);
    s.rect(x, top, 1, FAR_H - top, 'h').set(x, top, 'H');
  }
  s.ellipse(96, H + 1, 20, 3, 'w');
  for (const [x, w] of [
    [84, 4],
    [93, 6],
    [104, 3],
  ] as const) {
    s.rect(x, H + 1, w, 1, 'W');
  }
  // Lantern Shore's floating lanterns, lit after dark.
  for (const x of [88, 99, 107]) s.set(x, H, 'Q');
  // Woods along the front range.
  const random = seeded(hashString('ride:far'));
  for (let x = 2; x < BAND_W; x += 5 + Math.floor(random() * 4)) {
    if (Math.abs(x - 96) < 20) continue;
    const top = s.get(x, H - 4) === 'h' ? H - 4 : H - 2;
    s.rect(x, top - 2, 3, 3, 'E')
      .set(x + 1, top - 3, 'E')
      .set(x, top - 2, 'e');
  }
  return s.toSource();
})();

/**
 * The town from up the wheel: rows of little houses in the town's roof colours going back to the
 * hills, the clock tower over the square, the pond, trees between, and the road down to the fair.
 */
export const RIDE_TOWN: SpriteSource = (() => {
  const s = new Sketch(BAND_W, TOWN_H);
  s.rect(0, 7, BAND_W, TOWN_H - 7, 'g');
  for (let x = 0; x < BAND_W; x += 2) s.set(x, 7, 'l');
  const random = seeded(hashString('ride:town'));
  // A lane in front of each row.
  for (const y of [15, 31, 51]) {
    s.rect(0, y, BAND_W, y > 40 ? 3 : 2, 's');
    for (let x = 1; x < BAND_W; x += 4) s.set(x, y + 1, 'c');
  }
  // The pond, by the square.
  s.ellipse(70, 24, 11, 4, 'w');
  s.rect(63, 23, 4, 1, 'W').rect(72, 25, 3, 1, 'W').rect(76, 22, 2, 1, 'W');
  // Rows of houses, smaller further back, with trees between.
  const rows = [
    { base: 14, w: 6, gap: 4 },
    { base: 30, w: 8, gap: 5 },
    { base: 50, w: 11, gap: 6 },
  ];
  let roof = 0;
  rows.forEach((row, r) => {
    let x = 1 + r * 3;
    while (x < BAND_W - 2) {
      if (r === 1 && x > 56 && x < 84) {
        x = 84;
        continue;
      }
      if (random() < 0.22) {
        tree(s, x + row.w / 2, row.base - row.w / 2, row.w / 2 + 0.5);
      } else {
        const w = row.w + Math.floor(random() * 3) - 1;
        house(s, x, row.base, w, ROOFS[roof++ % ROOFS.length]!);
      }
      x += row.w + row.gap + Math.floor(random() * 3);
    }
  });
  // The clock tower over the square, poking up over the back row.
  s.rect(50, 0, 6, 14, 'c').rect(55, 0, 1, 14, 'C');
  s.ellipse(53, 5, 2, 2, 'a').set(53, 4, 'D').set(53, 5, 'D');
  for (let k = 0; k < 3; k++) s.rect(50 + k, -1 - k + 2, 6 - k * 2, 1, 'r');
  s.set(52, 10, 'N');
  // Trees along the road down to the fair, and the road itself.
  for (let y = 54; y < TOWN_H; y++) s.rect(58 + Math.round((y - 54) / 6), y, 6, 1, 's');
  for (const [x, y, r] of [
    [8, 62, 4],
    [24, 70, 5],
    [42, 60, 4],
    [80, 64, 5],
    [100, 58, 4],
    [116, 70, 5],
    [12, 78, 5],
    [96, 78, 4],
    [36, 88, 5],
    [76, 92, 4],
    [110, 96, 5],
    [4, 98, 4],
  ] as const) {
    tree(s, x, y, r);
  }
  for (let k = 0; k < 70; k++) {
    const x = Math.floor(random() * BAND_W);
    const y = 56 + Math.floor(random() * (TOWN_H - 56));
    if (s.get(x, y) === 'g') s.set(x, y, random() < 0.5 ? 'G' : 'l');
  }
  return s.toSource();
})();

/** A stall: a counter under an awning striped in two keys, its scallops along the front. */
function stall(s: Sketch, x: number, base: number, w: number, a: string, b: string) {
  s.rect(x + 1, base - 12, w - 2, 12, 'D').rect(x + 2, base - 11, w - 4, 6, 'R');
  s.rect(x + 1, base - 5, w - 2, 5, 'd').rect(x + 1, base - 5, w - 2, 1, 'a');
  for (let k = 0; k < w; k += 3) s.rect(x + k, base - 18, 3, 6, (k / 3) % 2 === 0 ? a : b);
  for (let k = 1; k < w; k += 3) s.set(x + k, base - 12, Math.floor(k / 3) % 2 === 0 ? a : b);
  s.rect(x, base - 19, w, 1, 'X');
}

/** A striped pole with a ball on top. */
function pole(s: Sketch, x: number, top: number, base: number) {
  s.rect(x, top, 2, base - top, 'q');
  for (let y = top + 2; y < base; y += 4) s.rect(x, y, 2, 2, 'x');
  s.rect(x, top - 1, 2, 1, 'z');
}

/** A string of bulbs sagging from one pole to the next. */
function swag(s: Sketch, x0: number, x1: number, y: number, sag: number, first: number) {
  let bulb = first;
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / (x1 - x0);
    const dy = Math.round(sag * 4 * t * (1 - t));
    s.set(x, y + dy, 'i');
    if ((x - x0) % 3 === 1) s.set(x, y + dy + 1, RIDE_BULBS[bulb++ % RIDE_BULBS.length]!);
  }
}

/**
 * The fair right below: two stalls and the stage, the fortune tent and another stall, strung with
 * bulbs between striped poles, on its grass with the cobbled path and a pumpkin or two.
 */
export const RIDE_FAIR: SpriteSource = (() => {
  const s = new Sketch(BAND_W, FAIR_H);
  const base = 44;
  s.rect(0, base - 2, BAND_W, FAIR_H - base + 2, 'g');
  for (let x = 1; x < BAND_W; x += 3) s.set(x, base - 2, 'l');
  // The cobbled path across, and the grass round the wheel's foot.
  s.rect(0, base + 8, BAND_W, 8, 'c');
  for (let y = base + 9; y < base + 16; y += 2)
    for (let x = y % 4 === 1 ? 0 : 2; x < BAND_W; x += 4) s.set(x, y, 'C');
  s.rect(0, base + 8, BAND_W, 1, 's');
  const random = seeded(hashString('ride:fair'));
  for (let k = 0; k < 60; k++) {
    const x = Math.floor(random() * BAND_W);
    const y = base + 17 + Math.floor(random() * (FAIR_H - base - 17));
    s.set(x, y, random() < 0.5 ? 'G' : 'l');
  }
  // Two stalls on the left.
  stall(s, 1, base, 19, 'x', 'y');
  stall(s, 23, base, 16, 'u', 'y');
  // The stage: boards, a plum backdrop with a moon, maroon curtains and a gold scalloped canopy.
  s.rect(43, base - 8, 40, 8, 'd')
    .rect(43, base - 8, 40, 1, 'a')
    .rect(43, base - 1, 40, 1, 'D');
  s.rect(45, base - 30, 36, 22, 'r');
  s.rect(45, base - 30, 7, 22, 'm').rect(74, base - 30, 7, 22, 'm');
  s.rect(51, base - 30, 1, 22, 'M').rect(74, base - 30, 1, 22, 'M');
  s.ellipse(63, base - 21, 3, 3, 'z').ellipse(64.5, base - 22, 2.5, 2.5, 'r');
  s.set(57, base - 25, 'y')
    .set(70, base - 18, 'y')
    .set(60, base - 14, 'y');
  s.rect(43, base - 33, 40, 3, 'z').rect(43, base - 30, 40, 1, 'Z');
  for (let x = 44; x < 83; x += 4) s.set(x, base - 29, 'z').set(x + 1, base - 29, 'z');
  // The fortune tent, striped lavender and gold, coming to a point with a flag.
  for (let y = 0; y < 26; y++) {
    const half = Math.round(1 + y * 0.45);
    for (let x = -half; x <= half; x++) {
      const stripe = Math.floor((x + 20) / 3) % 2 === 0 ? 'v' : 'z';
      s.set(97 + x, base - 26 + y, x === half ? (stripe === 'v' ? 'V' : 'Z') : stripe);
    }
  }
  s.rect(95, base - 9, 5, 9, 'R');
  s.rect(97, base - 30, 1, 4, 'D').rect(98, base - 30, 3, 2, 'x');
  stall(s, 110, base, 17, 'z', 'u');
  // The poles and their strings of bulbs.
  const poles = [20, 41, 85, 108];
  for (const x of poles) pole(s, x, base - 26, base);
  swag(s, 0, 20, base - 25, 3, 0);
  swag(s, 21, 41, base - 25, 4, 1);
  swag(s, 42, 85, base - 36, 5, 2);
  swag(s, 86, 108, base - 25, 4, 3);
  swag(s, 109, BAND_W - 1, base - 25, 3, 0);
  // Pumpkins by the path.
  for (const x of [8, 36, 90, 120]) {
    s.ellipse(x, base + 4, 2.5, 2, 'p')
      .set(x - 1, base + 3, 'P')
      .set(x, base + 2, 'G');
  }
  return s.toSource();
})();

/** The car's yoke, from where it hangs on the rim down to the tub's sides, behind who rides. */
export const RIDE_YOKE: SpriteSource = (() => {
  const s = new Sketch(RIDE_W, RIDE_H);
  for (const [x, dx] of [
    [TUB.x + 3, 0],
    [TUB.x + TUB.w - 4, 1],
  ] as const) {
    s.line(HANGER.x, HANGER.y, x, TUB.y, 'D').line(HANGER.x + 1, HANGER.y, x + dx, TUB.y, 'i');
  }
  s.ellipse(HANGER.x + 0.5, HANGER.y + 0.5, 2, 2, 'z').set(HANGER.x, HANGER.y, 'Z');
  return s.toSource();
})();

/** The tub, from behind: rounded, scarlet, a cream band and a row of rivets, its lip lit. */
export const RIDE_TUB: SpriteSource = (() => {
  const s = new Sketch(TUB.w, TUB.h);
  s.rect(1, 1, TUB.w - 2, TUB.h - 5, 'x');
  s.rect(3, TUB.h - 4, TUB.w - 6, 2, 'x').rect(6, TUB.h - 2, TUB.w - 12, 1, 'X');
  s.rect(1, TUB.h - 7, TUB.w - 2, 3, 'X');
  s.rect(0, 0, TUB.w, 2, 'a').rect(0, 1, TUB.w, 1, 'A');
  s.rect(1, 7, TUB.w - 2, 4, 'a').rect(1, 10, TUB.w - 2, 1, 'A');
  for (let x = 4; x < TUB.w - 3; x += 6) s.set(x, 4, 'z').set(x, 13, 'z');
  s.rect(TUB.w - 3, 2, 2, TUB.h - 8, 'X');
  // Its number, a little plaque in the middle.
  s.rect(TUB.w / 2 - 3, 3, 6, 3, 'z')
    .set(TUB.w / 2 - 1, 4, 'R')
    .set(TUB.w / 2, 4, 'R');
  s.outline((key) => (key === 'x' || key === 'X' || key === 'a' || key === 'A' ? 'M' : null));
  return s.toSource();
})();

/** Her ticket stub: a striped ticket torn along its dotted line, the wheel printed on it. */
export const TICKET_STUB_ART: ItemArt = (() => {
  const s = new Sketch(16, 16);
  s.rect(1, 4, 14, 8, 'p');
  s.rect(1, 4, 14, 1, 'r').rect(1, 11, 14, 1, 'r');
  s.rect(1, 5, 1, 6, 'q');
  for (let y = 5; y < 11; y += 2) s.set(11, y, 'q');
  // The torn end, ragged.
  for (const [y, x] of [
    [4, 14],
    [6, 14],
    [8, 14],
    [10, 14],
  ] as const) {
    s.set(x, y, '.');
  }
  // The wheel, a ring with a hub and two spokes.
  s.ellipse(6.5, 8, 2.5, 2.5, 'g').ellipse(6.5, 8, 1.5, 1.5, 'p');
  s.set(6, 7, 'g').set(6, 8, 'G').set(5, 8, 'g').set(7, 8, 'g').set(6, 9, 'g');
  s.set(9, 6, 'g').set(9, 9, 'g');
  s.outline({ p: 'o', r: 'R', q: 'o', g: 'o', G: 'o' });
  return {
    source: s.toSource(),
    palette: {
      '.': null,
      o: C.maroon,
      p: C.cream,
      q: C.creamShade,
      r: C.scarlet,
      R: C.maroon,
      g: C.gold,
      G: C.goldShade,
    },
  };
})();
