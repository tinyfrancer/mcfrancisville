import type { CropId } from '../types/ids';
import { PALETTE as C, ramp } from './palette';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/** A small picture stamped onto a bigger one, its top-left at (x, y). */
export interface Part {
  x: number;
  y: number;
  rows: readonly string[];
}

/**
 * A grid with parts stamped over it, every key but `.` covering what's below. How a ripe crop is
 * its growing leaves with the fruit hung on, so the two can't drift apart.
 */
export function overlay(base: SpriteSource, parts: readonly Part[]): SpriteSource {
  const rows = base.rows.map((r) => [...r]);
  for (const part of parts) {
    part.rows.forEach((row, dy) => {
      const line = rows[part.y + dy];
      if (!line) return;
      [...row].forEach((key, dx) => {
        if (key !== '.' && part.x + dx >= 0 && part.x + dx < line.length) line[part.x + dx] = key;
      });
    });
  }
  return { rows: rows.map((r) => r.join('')) };
}

/*
 * The garden at 32 pixels a tile (phase F): tilled soil, each stage of a crop, and the fruit and
 * blooms hung on its leaves once it's ripe, so the leaves and the ripe crop can't drift apart.
 * Her hostas, her rose bush and the farm sign are here too.
 */

const SIZE = 32;
/** How tall a tall crop stands: a tile and three quarters. */
const TALL_HEIGHT = 56;

/** Empty rows on top, so a low plant can grow up into a taller picture. */
function tall(source: SpriteSource, height: number): SpriteSource {
  const width = source.rows[0]?.length ?? 0;
  const blank = '.'.repeat(width);
  return { rows: [...Array<string>(height - source.rows.length).fill(blank), ...source.rows] };
}

/** A part drawn with `Sketch`, to be hung on a crop with its top left at (x, y). */
function part(sketch: Sketch, x: number, y: number): Part {
  return { x, y, rows: sketch.rows };
}

/**
 * A little mound of earth, its middle on row `y`: at the foot of what's growing, on the bed's last
 * furrow (the soil's rows end at 27), or in the middle of the bed while what's in it is small.
 */
function mound(s: Sketch, y = s.height - 7): Sketch {
  s.ellipse(16, y + 1, 9, 2.5, 'D');
  return s.ellipse(16, y, 9, 2.5, 'M').ellipse(16, y - 0.5, 8, 1.5, 'm');
}

/** The middle of the tilled soil, top to bottom: its furrows run from row 5 to row 27. */
const BED_MIDDLE = 16.5;

/**
 * How much higher a seed's and a sprout's mound sits in its art than a grown crop's: they're drawn
 * in the middle of a bed's soil, a grown one at its foot (`mound`'s own row). A planter, whose soil
 * is under a grown crop's mound, sets them this much lower (decision 320).
 */
export const EARLY_MOUND_RISE = Math.floor(SIZE - 7 - BED_MIDDLE);

const LEAF_LINE = { d: 'o', l: 'o', L: 'o', s: 'o' } as const;

/** Pale, dusty flecks on the ridges of a dry bed (`c`), hidden once it's watered. */
const DUST: readonly [number, number][] = [
  [8, 7],
  [14, 6],
  [21, 8],
  [25, 7],
  [10, 13],
  [18, 12],
  [25, 14],
  [6, 19],
  [17, 19],
  [22, 20],
  [12, 25],
  [23, 24],
  [9, 26],
];
/** Where water pools and catches the light on a watered bed (`w`), hidden while it's dry. */
const GLINTS: readonly [number, number][] = [
  [9, 5],
  [10, 5],
  [19, 11],
  [20, 11],
  [7, 17],
  [8, 17],
  [15, 17],
  [24, 23],
  [25, 23],
  [13, 23],
];

/**
 * A bed once it's tilled: four ridges of turned earth, lit along their tops (phase P: dry and
 * watered read apart at a glance, flecked with dust or glinting wet, from the one grid).
 */
function drawSoil(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  for (let row = 0; row < 4; row++) {
    const y = 5 + row * 6;
    s.rect(5, y, 22, 1, 'L')
      .rect(4, y + 1, 24, 3, 's')
      .rect(5, y + 4, 22, 1, 'd');
  }
  for (const [x, y] of DUST) s.set(x, y, 'c');
  for (const [x, y] of GLINTS) s.set(x, y, 'w');
  return s.toSource();
}

export const SOIL: SpriteSource = drawSoil();

export const TILLED_PALETTE: Palette = {
  '.': null,
  L: C.soilLight,
  s: C.soil,
  d: C.soilDark,
  c: C.soilDust,
  w: C.soilLight,
};

/** The same bed after she's watered it today: darker, and back to dry tomorrow. */
export const WATERED_PALETTE: Palette = {
  '.': null,
  L: C.soilWetLight,
  s: C.soilWet,
  d: C.soilWetDark,
  c: C.soilWet,
  w: C.waterLight,
};

/**
 * Her sprinkler in a bed's back corner (phase P): a little brass bat's head, tall ears and wings
 * spread (phase V, so it isn't a cat), on an iron stake.
 */
export const SPRINKLER: SpriteSource = {
  rows: [
    '....o......o....',
    '...oGo....oGo...',
    '...oGGo..oGGo...',
    'o..oGGGooGGGo..o',
    'oo.oGHHGGGGGo.oo',
    'oWooGHkGGkGGooWo',
    'oWWoGGGGGGGgoWWo',
    '.oWWoggggggoWWo.',
    '..o.oooooooo.o..',
    '......oIIo......',
    '......oIIo......',
    '......oIio......',
    '......oIio......',
    '.....oIIiio.....',
    '......oooo......',
  ],
};

export const SPRINKLER_PALETTE: Palette = {
  '.': null,
  o: C.ink,
  G: C.gold,
  g: C.goldShade,
  W: C.goldShade,
  H: C.candleBright,
  k: C.ink,
  I: C.iron,
  i: C.stoneDark,
};

/** Just planted: a little mound, with the seeds peeking out. */
export const SEEDED: SpriteSource = mound(new Sketch(SIZE, SIZE), BED_MIDDLE)
  .set(11, 15, 'k')
  .set(14, 14, 'k')
  .set(17, 14, 'k')
  .set(20, 15, 'k')
  .toSource();

function drawSprout(): SpriteSource {
  const s = mound(new Sketch(SIZE, SIZE), BED_MIDDLE);
  s.rect(15, 8, 2, 8, 's');
  s.sphere(11, 7, 5, 3, 'dlL').sphere(21, 6, 5, 3, 'dlL');
  s.outline(LEAF_LINE);
  return s.toSource();
}

export const SPROUT: SpriteSource = drawSprout();

/** A leafy clump, for what grows low. */
function drawLow(): SpriteSource {
  const s = mound(new Sketch(SIZE, SIZE));
  s.sphere(16, 12, 8, 7, 'dllL', { dither: true });
  s.sphere(9, 18, 7, 6, 'dllL', { dither: true }).sphere(23, 18, 7, 6, 'dllL', { dither: true });
  s.sphere(16, 21, 9, 5, 'dllL', { dither: true });
  s.line(16, 9, 16, 14, 'd').line(9, 16, 11, 20, 'd').line(23, 16, 21, 20, 'd');
  s.outline(LEAF_LINE);
  return s.toSource();
}

const LOW: SpriteSource = drawLow();

/** A stem with leaves up it, for what grows tall. */
function drawTall(): SpriteSource {
  const s = mound(new Sketch(SIZE, TALL_HEIGHT));
  s.rect(15, 10, 2, 39, 's');
  for (const [y, side] of [
    [45, -1],
    [38, 1],
    [30, -1],
    [23, 1],
    [16, -1],
  ] as const) {
    s.sphere(16 + side * 7, y, 6, 2.5, 'dlL');
  }
  s.sphere(16, 9, 3.5, 4, 'dlL');
  s.outline(LEAF_LINE);
  return s.toSource();
}

const TALL: SpriteSource = drawTall();

const GREENS: Palette = {
  '.': null,
  o: ramp(C.leafDark)[0],
  L: C.leafLight,
  l: C.leaf,
  d: C.leafDark,
  s: C.leafDark,
  m: C.soilLight,
  M: C.soil,
  D: C.soilDark,
  k: C.cream,
};

/** A pumpkin of three lobes on a curly stem. */
function pumpkin(): Sketch {
  const s = new Sketch(24, 18);
  s.sphere(6.5, 11, 6.5, 6, 'qppPh').sphere(17.5, 11, 6.5, 6, 'qppPh');
  s.sphere(12, 11, 6, 6.5, 'qppPh');
  s.rect(11, 1, 2, 4, 'S').set(13, 1, 'S').set(14, 2, 'S');
  s.outline({ p: 'q', P: 'q', h: 'q', S: 'o' });
  return s;
}

/** A ghost pepper: a little white ghost of a pepper, with a face. */
function pepper(): Sketch {
  const s = new Sketch(9, 11);
  s.sphere(4.5, 4.5, 4, 4, 'wWW').rect(2, 5, 5, 3, 'W').rect(3, 8, 3, 1, 'W').set(4, 9, 'W');
  s.bevel('W', null, 'w');
  s.set(3, 4, 'k').set(5, 4, 'k');
  s.outline({ W: 'q', w: 'q' });
  return s;
}

/** Candy corn on the cob: a white tip, orange, then yellow, in its green husk. */
function cob(): Sketch {
  const s = new Sketch(7, 14);
  s.rect(2, 1, 3, 3, 'w').rect(1, 4, 5, 4, 'p').rect(1, 8, 5, 3, 'y');
  s.rect(1, 11, 1, 2, 'L').rect(5, 11, 1, 2, 'L').rect(2, 11, 3, 1, 'y');
  s.outline({ w: 'q', p: 'q', y: 'q', L: 'o' });
  return s;
}

/** A bat-wing bean pod, scalloped along one edge like a wing. */
function pod(): Sketch {
  const s = new Sketch(7, 12);
  s.rect(2, 1, 3, 9, 'b').rect(1, 3, 1, 2, 'b').rect(1, 6, 1, 2, 'b');
  s.rect(3, 2, 1, 7, 'B').set(3, 10, 'b');
  s.outline({ b: 'q', B: 'q' });
  return s;
}

/** A rose in bloom, its petals curling round a darker heart. */
function rose(): Sketch {
  const s = new Sketch(8, 8);
  s.sphere(4, 4, 3.5, 3.5, 'rrRh');
  s.set(4, 3, 'r').set(3, 4, 'r').set(4, 5, 'q');
  s.outline({ r: 'q', R: 'q', h: 'q' });
  return s;
}

/** A moonflower: five pale petals round a candle-yellow heart, glowing after dark. */
function moonflower(): Sketch {
  const s = new Sketch(9, 9);
  s.ellipse(4.5, 2.5, 2, 2, 'w').ellipse(2, 4.5, 2, 2, 'w').ellipse(7, 4.5, 2, 2, 'w');
  s.ellipse(3, 7, 2, 1.5, 'w').ellipse(6, 7, 2, 1.5, 'w');
  s.ellipse(4.5, 4.5, 1.5, 1.5, 'c');
  return s;
}

/** A spire of snapdragons, pink florets all the way up a stem. */
function spire(): Sketch {
  const s = new Sketch(6, 24);
  s.rect(2, 14, 2, 10, 's');
  for (let y = 1; y < 15; y += 3) {
    const shift = (y / 3) % 2 < 1 ? 0 : 1;
    s.rect(1 + shift, y, 3, 2, 'p').set(1 + shift, y, 'P');
  }
  s.outline({ p: 'q', P: 'q' });
  return s;
}

/** A red spider lily: petals curling back from the middle, with long stamens reaching out. */
function lily(): Sketch {
  const s = new Sketch(15, 17);
  s.rect(7, 7, 1, 10, 's');
  for (const [dx, dy] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
    [0, -1],
  ] as const) {
    s.line(7, 5, 7 + dx * 3, 5 + dy * 2, 'r');
    s.line(7 + dx * 3, 5 + dy * 2, 7 + dx * 6, 5 + dy * 4 - 1, 'R');
    s.set(7 + dx * 7, 5 + dy * 4 - 2, 'R');
  }
  s.ellipse(7.5, 5.5, 2, 2, 'r').set(7, 5, 'R');
  return s;
}

/** A bat flower: two dark wings round a little face, and long whiskers trailing down. */
function batFlower(): Sketch {
  const s = Sketch.from({
    rows: [
      '.b.............b.',
      '.bbB.........Bbb.',
      '.bbbbB.kkk.Bbbbb.',
      '..bbbbbkekbbbbb..',
      '...bbbbkkkbbbb...',
      '....bbb.k.bbb....',
      '.....w..w..w.....',
      '....w...w...w....',
      '....w...w...w....',
      '...w....w....w...',
      '...w.........w...',
      '.................',
    ],
  });
  s.outline({ b: 'q', B: 'q', k: 'q' });
  return s;
}

/** Long strap leaves fanning up from the mound, for bulbs: garlic, tulips and irises (0.2's N2). */
function drawStraps(): SpriteSource {
  const s = mound(new Sketch(SIZE, TALL_HEIGHT));
  for (const [x, y] of [
    [7, 26],
    [12, 18],
    [17, 14],
    [22, 20],
    [26, 28],
  ] as const) {
    s.line(16, 48, x, y, 'l').line(17, 48, x + 1, y, 'd');
    s.set(x, y, 'L');
  }
  s.outline(LEAF_LINE);
  return s.toSource();
}

const STRAPS: SpriteSource = drawStraps();

/** A round tomato, its green star on top. */
function tomato(): Sketch {
  const s = new Sketch(8, 8);
  s.sphere(4, 4.5, 3.5, 3.5, 'qrrRh');
  s.set(3, 1, 'g').set(4, 1, 'g').set(5, 1, 'g').set(4, 0, 'g');
  s.outline({ r: 'q', R: 'q', h: 'q', g: 'o' });
  return s;
}

/** A bulb of garlic sitting on the earth, its papery cloves and its little point. */
function bulb(): Sketch {
  const s = new Sketch(9, 9);
  s.sphere(4.5, 5.5, 4, 3.5, 'Wwwh').rect(4, 1, 1, 2, 'w').set(4, 0, 'W');
  s.line(3, 3, 2, 7, 'W').line(6, 3, 7, 7, 'W');
  s.outline({ w: 'q', W: 'q', h: 'q' });
  return s;
}

/** A sprig of bright, cupped basil leaves with a little white flower spike. */
function basil(): Sketch {
  const s = new Sketch(10, 10);
  s.ellipse(3, 6, 3, 2.5, 'b').ellipse(7, 6, 3, 2.5, 'b').ellipse(5, 3.5, 2.5, 2.5, 'b');
  s.bevel('b', 'B', null);
  s.set(5, 6, 'v').set(5, 7, 'v').set(5, 0, 'w').set(5, 1, 'w');
  s.outline({ b: 'q', B: 'q', w: null });
  return s;
}

/** An avocado: dark, pear-shaped and bumpy, hanging by its stalk. */
function avocado(): Sketch {
  const s = new Sketch(7, 10);
  s.ellipse(3.5, 6.5, 3, 3, 'a').ellipse(3.5, 3.5, 2, 2, 'a');
  s.bevel('a', 'A', null);
  s.set(4, 7, 'A').set(2, 5, 'A');
  s.set(3, 0, 'S').set(3, 1, 'S');
  s.outline({ a: 'q', A: 'q', S: null });
  return s;
}

/** An ear of sweetcorn: golden kernels in rows, its husk peeled back, its silk at the tip. */
function ear(): Sketch {
  const s = new Sketch(7, 14);
  s.rect(2, 2, 3, 8, 'y');
  for (let y = 2; y < 10; y++) s.set(2 + (y % 2) * 2, y, 'Y');
  s.set(3, 0, 'c').set(2, 1, 'c').set(4, 1, 'c');
  s.rect(1, 6, 1, 6, 'g').rect(5, 6, 1, 6, 'g').rect(2, 10, 3, 2, 'g');
  s.outline({ y: 'q', Y: 'q', g: 'o', c: null });
  return s;
}

/** A glow gourd: a little bottle-shaped gourd that shines after dark. */
function gourd(): Sketch {
  const s = new Sketch(9, 12);
  s.sphere(4.5, 8, 4, 3.5, 'qgGh').sphere(4.5, 3.5, 2.5, 2.5, 'qgGh');
  s.set(4, 0, 'S').set(5, 0, 'S');
  s.outline({ g: 'q', G: 'q', h: 'q', S: null });
  return s;
}

/** A sunflower's big head: golden petals round a dark, seedy middle. */
function sunflower(): Sketch {
  const s = new Sketch(17, 17);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    s.ellipse(8.5 + Math.cos(a) * 5, 8.5 + Math.sin(a) * 5, 2.2, 2.2, 'y');
  }
  s.bevel('y', 'Y', null);
  s.sphere(8.5, 8.5, 4, 4, 'bbcC');
  s.set(7, 7, 'b').set(10, 9, 'b').set(8, 10, 'c');
  s.outline({ y: 'q', Y: 'q', b: 'q', c: 'q', C: 'q' });
  return s;
}

/** A tulip's cup on its stem, three points at its top. */
function tulip(): Sketch {
  const s = Sketch.from({
    rows: [
      't.T.t',
      'tTttt',
      'tTttt',
      'tTttt',
      '.ttt.',
      '..s..',
      '..s..',
      '..s..',
      '..s..',
      '..s..',
    ],
  });
  s.outline({ t: 'q', T: 'q' });
  return s;
}

/** A spike of lavender: buds up a thin stem. */
function spike(): Sketch {
  const s = new Sketch(3, 15);
  s.rect(1, 9, 1, 6, 's');
  for (let y = 0; y < 10; y += 2)
    s.set(0, y + 1, 'v')
      .set(1, y, 'V')
      .set(2, y + 1, 'v');
  s.set(1, 1, 'v').set(1, 3, 'v').set(1, 5, 'v').set(1, 7, 'v');
  return s;
}

/** A marigold: a round, frilly orange pompom. */
function marigold(): Sketch {
  const s = new Sketch(8, 8);
  s.sphere(4, 4, 3.5, 3.5, 'qnNh', { dither: true });
  s.set(2, 2, 'n').set(5, 3, 'n').set(3, 5, 'N');
  s.outline({ n: 'q', N: 'q', h: 'q' });
  return s;
}

/** A Christmas rose: five white petals round a gold heart, blushing pink at the edges. */
function hellebore(): Sketch {
  const s = new Sketch(9, 9);
  s.ellipse(4.5, 2.5, 2, 2, 'w').ellipse(2, 4.5, 2, 2, 'w').ellipse(7, 4.5, 2, 2, 'w');
  s.ellipse(3, 7, 2, 1.5, 'w').ellipse(6, 7, 2, 1.5, 'w');
  s.bevel('w', null, 'p');
  s.ellipse(4.5, 4.5, 1.5, 1.5, 'c');
  s.outline({ w: 'q', p: 'q' });
  return s;
}

/** An iris: three petals standing up, three falling, a gold stripe down the middle. */
function iris(): Sketch {
  const s = Sketch.from({
    rows: [
      '...bBb...',
      '...bBb...',
      '.b.bbb.b.',
      'bBb.y.bBb',
      'bbbbybbbb',
      '.bbbybbb.',
      '..b.s.b..',
      '....s....',
      '....s....',
      '....s....',
      '....s....',
    ],
  });
  s.outline({ b: 'q', B: 'q', y: 'q' });
  return s;
}

export interface CropArt {
  /** Its leaves while it grows, low or tall. */
  growing: SpriteSource;
  greens: Palette;
  ripe: SpriteSource;
  ripePalette: Palette;
  /** A rare harvest's look, once it's ripe (a blue rose). */
  rarePalette?: Palette;
  /** The keys of its bloom that glow after dark. */
  glow?: Palette;
}

const ROSE_PALETTE: Palette = {
  ...GREENS,
  q: ramp(C.rose)[0],
  r: C.rose,
  R: C.roseLight,
  h: ramp(C.roseLight)[4],
};

const LOW_TALL = tall(LOW, TALL_HEIGHT);

export const CROP_ART: Record<CropId, CropArt> = {
  pumpkin: {
    growing: LOW,
    greens: GREENS,
    ripe: overlay(LOW, [part(pumpkin(), 4, 12)]),
    ripePalette: {
      ...GREENS,
      q: C.pumpkinDark,
      p: C.pumpkin,
      P: C.pumpkinLight,
      h: ramp(C.pumpkinLight)[3],
      S: C.bark,
    },
  },
  ghostPepper: {
    growing: LOW,
    greens: GREENS,
    ripe: overlay(LOW, [part(pepper(), 2, 8), part(pepper(), 20, 7), part(pepper(), 11, 14)]),
    ripePalette: { ...GREENS, W: C.ghost, w: C.silver, q: C.silverShade, k: C.ink },
  },
  candyCorn: {
    growing: TALL,
    greens: GREENS,
    ripe: overlay(TALL, [part(cob(), 5, 17), part(cob(), 20, 26), part(cob(), 4, 34)]),
    ripePalette: { ...GREENS, w: C.white, p: C.pumpkin, y: C.gold, q: C.goldShade },
  },
  batWingBeans: {
    growing: TALL,
    greens: GREENS,
    ripe: overlay(TALL, [
      part(pod(), 6, 24),
      part(pod(), 20, 30),
      part(pod(), 5, 38),
      part(pod(), 19, 16),
    ]),
    ripePalette: { ...GREENS, b: C.plum, B: C.plumLight, q: ramp(C.plum)[0] },
  },
  rose: {
    growing: LOW,
    greens: GREENS,
    ripe: overlay(LOW, [
      part(rose(), 3, 9),
      part(rose(), 20, 9),
      part(rose(), 12, 3),
      part(rose(), 11, 15),
    ]),
    ripePalette: ROSE_PALETTE,
    rarePalette: {
      ...ROSE_PALETTE,
      q: ramp(C.blueFabric)[0],
      r: C.blueFabric,
      R: C.sky,
      h: ramp(C.sky)[4],
    },
  },
  moonflower: {
    growing: TALL,
    greens: GREENS,
    ripe: overlay(TALL, [
      part(moonflower(), 12, 4),
      part(moonflower(), 3, 20),
      part(moonflower(), 20, 26),
      part(moonflower(), 4, 36),
    ]),
    ripePalette: { ...GREENS, w: C.ghost, c: C.candle },
    glow: { w: C.ghost, c: C.candleBright },
  },
  snapdragon: {
    growing: LOW_TALL,
    greens: GREENS,
    ripe: overlay(LOW_TALL, [part(spire(), 4, 20), part(spire(), 13, 14), part(spire(), 22, 21)]),
    ripePalette: { ...GREENS, p: C.snap, P: C.snapLight, q: ramp(C.snap)[0] },
  },
  spiderLily: {
    growing: LOW_TALL,
    greens: GREENS,
    ripe: overlay(LOW_TALL, [part(lily(), 0, 18), part(lily(), 16, 23)]),
    ripePalette: { ...GREENS, r: C.lily, R: C.lilyLight },
  },
  batFlower: {
    growing: LOW_TALL,
    greens: GREENS,
    ripe: overlay(LOW_TALL, [part(batFlower(), 0, 23), part(batFlower(), 15, 18)]),
    ripePalette: {
      ...GREENS,
      b: C.plum,
      B: C.plumLight,
      k: C.ink,
      e: C.candle,
      w: C.stoneLight,
      q: ramp(C.plum)[0],
    },
  },
  hosta: {
    growing: LOW,
    greens: GREENS,
    ripe: drawHosta(),
    ripePalette: GREENS,
  },
  // 0.2's N2.
  tomato: {
    growing: TALL,
    greens: GREENS,
    ripe: overlay(TALL, [
      part(tomato(), 5, 17),
      part(tomato(), 19, 24),
      part(tomato(), 4, 32),
      part(tomato(), 20, 39),
      part(tomato(), 12, 4),
    ]),
    ripePalette: {
      ...GREENS,
      q: ramp(C.scarlet)[0],
      r: C.scarlet,
      R: ramp(C.scarlet)[3],
      h: ramp(C.scarlet)[4],
      g: C.leafDark,
    },
  },
  garlic: {
    growing: STRAPS,
    greens: GREENS,
    ripe: overlay(STRAPS, [part(bulb(), 3, 40), part(bulb(), 20, 40), part(bulb(), 11, 42)]),
    ripePalette: { ...GREENS, w: C.cream, W: C.creamShade, h: C.white, q: ramp(C.creamShade)[0] },
  },
  basil: {
    growing: LOW,
    greens: GREENS,
    ripe: overlay(LOW, [
      part(basil(), 3, 7),
      part(basil(), 19, 7),
      part(basil(), 11, 2),
      part(basil(), 11, 14),
    ]),
    ripePalette: {
      ...GREENS,
      b: ramp(C.leafLight)[3],
      B: ramp(C.leafLight)[4],
      v: C.moss,
      w: C.white,
      q: C.leafDark,
    },
  },
  avocado: {
    growing: TALL,
    greens: GREENS,
    ripe: overlay(TALL, [
      part(avocado(), 5, 18),
      part(avocado(), 20, 25),
      part(avocado(), 4, 33),
      part(avocado(), 21, 11),
    ]),
    ripePalette: {
      ...GREENS,
      a: C.mossDark,
      A: C.moss,
      S: C.bark,
      q: ramp(C.mossDark)[0],
    },
  },
  sweetcorn: {
    growing: TALL,
    greens: GREENS,
    ripe: overlay(TALL, [part(ear(), 5, 18), part(ear(), 20, 27), part(ear(), 4, 34)]),
    ripePalette: {
      ...GREENS,
      y: C.gold,
      Y: C.candle,
      g: C.leafLight,
      c: C.wood,
      q: C.goldShade,
    },
  },
  glowGourd: {
    growing: LOW,
    greens: GREENS,
    ripe: overlay(LOW, [part(gourd(), 2, 10), part(gourd(), 20, 9), part(gourd(), 11, 15)]),
    ripePalette: {
      ...GREENS,
      q: C.orbGreenDark,
      g: C.orbGreen,
      G: C.orbGreenLight,
      h: C.ghost,
      S: C.bark,
    },
    glow: { g: C.orbGreenLight, G: C.ghost, h: C.white },
  },
  sunflower: {
    growing: TALL,
    greens: GREENS,
    ripe: overlay(TALL, [part(sunflower(), 8, 0)]),
    ripePalette: {
      ...GREENS,
      y: C.gold,
      Y: C.candle,
      b: C.barkDark,
      c: C.bark,
      C: C.wood,
      q: C.goldShade,
    },
  },
  blackTulip: {
    growing: STRAPS,
    greens: GREENS,
    ripe: overlay(STRAPS, [part(tulip(), 5, 17), part(tulip(), 14, 10), part(tulip(), 23, 19)]),
    ripePalette: { ...GREENS, t: ramp(C.plum)[1], T: C.plum, q: ramp(C.plum)[0] },
  },
  lavender: {
    growing: LOW_TALL,
    greens: GREENS,
    ripe: overlay(LOW_TALL, [
      part(spike(), 4, 20),
      part(spike(), 9, 16),
      part(spike(), 14, 13),
      part(spike(), 19, 16),
      part(spike(), 24, 21),
    ]),
    ripePalette: { ...GREENS, v: C.lavenderShade, V: C.lavender },
  },
  marigold: {
    growing: LOW,
    greens: GREENS,
    ripe: overlay(LOW, [
      part(marigold(), 3, 9),
      part(marigold(), 20, 10),
      part(marigold(), 12, 3),
      part(marigold(), 12, 15),
    ]),
    ripePalette: {
      ...GREENS,
      n: C.monarch,
      N: C.pumpkinLight,
      h: C.gold,
      q: C.pumpkinDark,
    },
  },
  christmasRose: {
    growing: LOW,
    greens: GREENS,
    ripe: overlay(LOW, [
      part(hellebore(), 2, 9),
      part(hellebore(), 20, 9),
      part(hellebore(), 11, 3),
      part(hellebore(), 11, 15),
    ]),
    ripePalette: {
      ...GREENS,
      w: C.white,
      p: C.roseLight,
      c: C.gold,
      q: C.silverShade,
    },
  },
  iris: {
    growing: STRAPS,
    greens: GREENS,
    ripe: overlay(STRAPS, [part(iris(), 3, 14), part(iris(), 12, 6), part(iris(), 21, 16)]),
    ripePalette: { ...GREENS, b: C.blueFabric, B: C.sky, y: C.gold, q: C.navy },
  },
};

/** A hosta's broad leaves, in the three colours hers come in. */
export const HOSTA_LEAVES: readonly Palette[] = [
  GREENS,
  {
    ...GREENS,
    o: ramp(C.hostaBlueDark)[0],
    L: C.hostaBlueLight,
    l: C.hostaBlue,
    d: C.hostaBlueDark,
    s: C.hostaBlueDark,
  },
  { ...GREENS, L: C.hostaCream, l: C.leaf, d: C.leafDark },
];

/**
 * A big clump of heart-shaped leaves with pale edges, fanning up from the ground, the way hostas
 * grow along a shady fence.
 */
function drawHosta(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  for (const [cx, cy, rx, ry] of [
    [16, 9, 6, 5],
    [8, 14, 7, 5],
    [24, 14, 7, 5],
    [5, 22, 5, 4],
    [27, 22, 5, 4],
    [11, 21, 7, 5],
    [21, 21, 7, 5],
    [16, 25, 8, 4],
  ] as const) {
    s.ellipse(cx, cy, rx, ry, 'L').ellipse(cx, cy + 0.5, rx - 1, ry - 1, 'l');
    s.line(Math.round(cx), Math.round(cy - ry / 2), 16, 29, 'd');
  }
  s.outline({ L: 'o', l: 'o', d: 'o' });
  return s.toSource();
}

export const HOSTA: SpriteSource = CROP_ART.hosta.ripe;

/**
 * The sign at the farm gate: a board on two posts with a hosta leaf painted on it and a line of
 * writing, which says its name when she walks up to it.
 */
function drawFarmSign(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  s.rect(6, 17, 3, 14, 'W').rect(23, 17, 3, 14, 'W');
  s.rect(1, 5, 30, 15, 'w');
  s.bevel('w', 'W', 'd');
  s.ellipse(8, 12, 4, 4, 'L').ellipse(8, 12.5, 3, 3, 'l').line(8, 10, 8, 16, 'D');
  for (const [x, y, w] of [
    [14, 9, 13],
    [14, 13, 9],
    [14, 16, 11],
  ] as const) {
    for (let i = 0; i < w; i++) if ((i + y) % 4 !== 0) s.set(x + i, y, 't');
  }
  s.outline({ w: 'o', W: 'o', d: 'o', L: 'o' });
  return s.toSource();
}

export const FARM_SIGN: SpriteSource = drawFarmSign();

export const FARM_SIGN_PALETTE: Palette = {
  '.': null,
  o: ramp(C.bark)[0],
  W: ramp(C.wood)[3],
  w: C.wood,
  d: C.bark,
  t: C.cream,
  L: C.hostaBlueLight,
  l: C.hostaBlue,
  D: C.hostaBlueDark,
};
