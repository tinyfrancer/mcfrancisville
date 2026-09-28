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

/** A little mound of earth at the foot of what's growing, as tall as the picture it's in. */
function mound(s: Sketch): Sketch {
  const y = s.height - 4;
  return s.ellipse(16, y + 1, 9, 2.5, 'M').ellipse(16, y + 0.5, 8, 1.5, 'm');
}

const LEAF_LINE = { d: 'o', l: 'o', L: 'o', s: 'o' } as const;

/** A bed once it's tilled: four ridges of turned earth, lit along their tops. */
function drawSoil(): SpriteSource {
  const s = new Sketch(SIZE, SIZE);
  for (let row = 0; row < 4; row++) {
    const y = 5 + row * 6;
    s.rect(5, y, 22, 1, 'L')
      .rect(4, y + 1, 24, 3, 's')
      .rect(5, y + 4, 22, 1, 'd');
  }
  return s.toSource();
}

export const SOIL: SpriteSource = drawSoil();

export const TILLED_PALETTE: Palette = {
  '.': null,
  L: C.soilLight,
  s: C.soil,
  d: C.soilDark,
};

/** The same bed after she's watered it today: darker, and back to dry tomorrow. */
export const WATERED_PALETTE: Palette = {
  '.': null,
  L: C.soilWetLight,
  s: C.soilWet,
  d: C.soilWetDark,
};

/** Just planted: a little mound, with the seeds peeking out. */
export const SEEDED: SpriteSource = mound(new Sketch(SIZE, SIZE))
  .set(13, 26, 'k')
  .set(16, 25, 'k')
  .set(19, 26, 'k')
  .toSource();

function drawSprout(): SpriteSource {
  const s = mound(new Sketch(SIZE, SIZE));
  s.rect(15, 18, 2, 9, 's');
  s.sphere(11, 17, 5, 3, 'dlL').sphere(21, 16, 5, 3, 'dlL');
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
  s.rect(15, 10, 2, 43, 's');
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
