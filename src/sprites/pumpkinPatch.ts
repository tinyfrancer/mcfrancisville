import type { PatchStage } from '../data/pumpkinPatch';
import { PALETTE as C, ramp } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The pumpkin patch on the farm (0.2's J3): a raised bed of soil three tiles by two, resting
 * under straw most of the year, and through October vines, then flowers and little green
 * pumpkins, then a crop of orange ones to pick, one very big. A little sign stands at the back.
 */

const WIDTH = 96;
const HEIGHT = 70;
/** Where the bed's top edge is: the leaves and pumpkins rise a little above it. */
const TOP = 16;

/** The bed of soil, raised and rounded, with furrows across it. */
function bed(s: Sketch): void {
  s.rect(6, TOP, 84, 53, 'M')
    .rect(3, TOP + 1, 90, 51, 'M')
    .rect(1, TOP + 3, 94, 47, 'M');
  s.bevel('M', 'm', 'D');
  for (const y of [TOP + 14, TOP + 24, TOP + 34, TOP + 44]) {
    for (let x = 8; x < 88; x++) if (s.get(x, y) === 'M') s.set(x, y, 'D');
    for (let x = 9; x < 87; x += 7) if (s.get(x, y - 1) === 'M') s.set(x, y - 1, 'm');
  }
}

/** Straw laid over the resting bed, in little crossed tufts. */
function straw(s: Sketch): void {
  const tufts: readonly [number, number][] = [
    [14, 26],
    [30, 34],
    [48, 24],
    [64, 32],
    [80, 26],
    [20, 46],
    [40, 52],
    [58, 46],
    [76, 50],
    [30, 60],
    [66, 60],
  ];
  for (const [x, y] of tufts) {
    s.line(x - 3, y + 1, x + 3, y - 1, 'y').line(x - 2, y - 1, x + 2, y + 1, 'Y');
    s.set(x, y, 'y');
  }
}

/** The vines, curling across the bed from where each was sown. */
function vines(s: Sketch): void {
  const runs: readonly (readonly [number, number])[][] = [
    [
      [12, 30],
      [26, 26],
      [38, 32],
      [50, 28],
    ],
    [
      [50, 44],
      [62, 40],
      [74, 46],
      [86, 40],
    ],
    [
      [14, 54],
      [28, 50],
      [40, 56],
    ],
    [
      [56, 58],
      [70, 62],
      [84, 56],
    ],
  ];
  for (const run of runs) {
    for (let i = 1; i < run.length; i++) {
      const [x0, y0] = run[i - 1]!;
      const [x1, y1] = run[i]!;
      s.line(x0, y0, x1, y1, 'v');
    }
  }
}

/** A pumpkin leaf: a round clump, lit from the top left. */
function leaf(s: Sketch, x: number, y: number, r: number): void {
  s.sphere(x, y, r, r * 0.8, 'dlL');
}

const LEAVES: readonly [number, number][] = [
  [18, 28],
  [33, 30],
  [45, 26],
  [57, 42],
  [70, 43],
  [82, 40],
  [22, 51],
  [36, 54],
  [64, 60],
  [78, 58],
];

/** A pumpkin of three lobes and a curly stem, `r` across the middle lobe's half, in `keys`. */
function pumpkin(s: Sketch, x: number, y: number, r: number, keys: string): void {
  const side = r * 0.72;
  s.sphere(x - r * 0.62, y, side, r * 0.8, keys).sphere(x + r * 0.62, y, side, r * 0.8, keys);
  s.sphere(x, y, r * 0.75, r * 0.85, keys);
  if (r >= 5) {
    for (const gx of [Math.round(x - r * 0.45), Math.round(x + r * 0.45)]) {
      for (let gy = Math.round(y - r * 0.5); gy <= Math.round(y + r * 0.5); gy++) {
        s.set(gx, gy, keys[0]!);
      }
    }
  }
  const top = Math.round(y - r * 0.85);
  s.rect(Math.round(x) - 1, top - 2, 2, 3, 'S').set(Math.round(x) + 1, top - 3, 'S');
}

/** The little sign at the back of the bed: a stake and a board with a pumpkin painted on. */
function sign(s: Sketch): void {
  s.rect(88, 8, 2, 16, 'w').rect(88, 8, 1, 16, 'W');
  s.rect(81, 2, 15, 10, 'w').rect(81, 2, 15, 1, 'W').rect(81, 11, 15, 1, 'b');
  s.ellipse(88.5, 7, 3, 2.5, 'p').set(87, 6, 'P').set(88, 3, 'v').set(89, 3, 'v');
}

function draw(stage: PatchStage): SpriteSource {
  const s = new Sketch(WIDTH, HEIGHT);
  bed(s);
  if (stage === 'resting') straw(s);
  else vines(s);
  if (stage === 'sprouting') for (const [x, y] of LEAVES) leaf(s, x, y, 3);
  if (stage === 'flowering') {
    for (const [x, y] of LEAVES) leaf(s, x, y, 4.5);
    for (const [x, y] of [
      [27, 24],
      [52, 38],
      [74, 38],
      [30, 48],
      [70, 56],
    ] as const) {
      s.set(x, y - 1, 'f')
        .set(x - 1, y, 'f')
        .set(x + 1, y, 'f')
        .set(x, y + 1, 'f');
      s.set(x, y, 'F');
    }
    for (const [x, y] of [
      [40, 36],
      [62, 50],
      [26, 60],
      [84, 48],
    ] as const) {
      pumpkin(s, x, y, 4, 'gGGH');
    }
  }
  if (stage === 'ripe') {
    for (const [x, y] of LEAVES) leaf(s, x, y, 5);
    for (const [x, y, r] of [
      [28, 38, 6],
      [66, 30, 5],
      [84, 52, 5],
      [16, 60, 5],
      [52, 58, 6],
      [44, 44, 9],
    ] as const) {
      pumpkin(s, x, y, r, 'qppPh');
    }
  }
  sign(s);
  s.outline({
    M: 'o',
    m: 'o',
    D: 'o',
    d: 'e',
    l: 'e',
    L: 'e',
    q: 'q',
    p: 'q',
    P: 'q',
    h: 'q',
    g: 'e',
    G: 'e',
    H: 'e',
    w: 'b',
    W: 'b',
  });
  return s.toSource();
}

export const PUMPKIN_PATCH_ART: Record<PatchStage, SpriteSource> = {
  resting: draw('resting'),
  sprouting: draw('sprouting'),
  flowering: draw('flowering'),
  ripe: draw('ripe'),
};

export const PUMPKIN_PATCH_PALETTE: Palette = {
  '.': null,
  o: C.soilDark,
  D: ramp(C.soil)[1]!,
  M: C.soil,
  m: C.soilLight,
  y: C.rope,
  Y: C.goldShade,
  v: C.leafDark,
  e: ramp(C.leafDark)[0]!,
  d: C.leafDark,
  l: C.leaf,
  L: C.leafLight,
  f: C.gold,
  F: C.candle,
  g: C.leaf,
  G: C.leafLight,
  H: C.gold,
  q: C.pumpkinDark,
  p: C.pumpkin,
  P: C.pumpkinLight,
  h: ramp(C.pumpkinLight)[3]!,
  S: C.bark,
  w: C.wood,
  W: C.rope,
  b: C.bark,
};
