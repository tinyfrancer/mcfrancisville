import type { CropId } from '../types/ids';
import { PALETTE as C } from './palette';
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

/** Empty rows on top, so a low plant can grow up into a taller picture. */
function tall(source: SpriteSource, height: number): SpriteSource {
  const width = source.rows[0]?.length ?? 0;
  const blank = '.'.repeat(width);
  return { rows: [...Array<string>(height - source.rows.length).fill(blank), ...source.rows] };
}

/** A bed once it's tilled: three furrows, with a seam of the wild bed showing round it. */
export const SOIL: SpriteSource = {
  rows: [
    '................',
    '.LLLLLLLLLLLLLL.',
    '.ssssssssssssss.',
    '.ssssssssssssss.',
    '.dddddddddddddd.',
    '.LLLLLLLLLLLLLL.',
    '.ssssssssssssss.',
    '.ssssssssssssss.',
    '.dddddddddddddd.',
    '.LLLLLLLLLLLLLL.',
    '.ssssssssssssss.',
    '.ssssssssssssss.',
    '.dddddddddddddd.',
    '.LLLLLLLLLLLLLL.',
    '.ssssssssssssss.',
    '................',
  ],
};

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
export const SEEDED: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '......k..k......',
    '.....mmmmmm.....',
    '....mmMkMMMm....',
    '....MMMMMMMM....',
    '................',
    '................',
  ],
};

export const SPROUT: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...oo......oo...',
    '..oLlo....olLo..',
    '..olllo..olllo..',
    '...olldoodllo...',
    '....oddssddo....',
    '.....oossoo.....',
    '....mmmssmmm....',
    '....MMMMMMMM....',
    '................',
  ],
};

/** A leafy clump, for what grows low. */
const LOW: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '.......oo.......',
    '..ooo.oLlo.ooo..',
    '.oLllooLlloLllo.',
    'oLllllldllldlllo',
    'olllldlllldllldo',
    '.olldllldlllddo.',
    '..oddlddlddddo..',
    '...oddddddddo...',
    '....oooooooo....',
    '....mmmmmmmm....',
    '....MMMMMMMM....',
    '................',
  ],
};

/** A stem with leaves up it, for what grows tall. */
const TALL: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.......oo.......',
    '......oLlo......',
    '......olldo.....',
    '.......ss.......',
    '...ooo.ss.......',
    '..oLlllss.......',
    '...oddoss.......',
    '.......ss.ooo...',
    '.......sslllLo..',
    '.......ssoddo...',
    '.......ss.......',
    '...ooo.ss.......',
    '..oLlllss.......',
    '...oddoss.......',
    '.......ss.ooo...',
    '.......sslllLo..',
    '.......ssoddo...',
    '.......ss.......',
    '....mmmssmmm....',
    '....MMMMMMMM....',
    '................',
  ],
};

const MOUND = { m: C.soilLight, M: C.soil, k: C.cream };

const GREENS: Palette = {
  '.': null,
  o: C.ink,
  L: C.leafLight,
  l: C.leaf,
  d: C.leafDark,
  s: C.leafDark,
  ...MOUND,
};

/** A hosta's broad leaves, in the three colours hers come in. */
export const HOSTA_LEAVES: readonly Palette[] = [
  GREENS,
  { ...GREENS, L: C.hostaBlueLight, l: C.hostaBlue, d: C.hostaBlueDark, s: C.hostaBlueDark },
  { ...GREENS, L: C.hostaCream, l: C.leaf, d: C.leafDark },
];

/** A big clump of heart-shaped leaves with pale edges, the way hostas grow along a shady fence. */
export const HOSTA: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '......oooo......',
    '..oooLLLLLLooo..',
    '.oLLLolllloLLLo.',
    'oLlllolddlolllLo',
    'oLlldoldllodllLo',
    '.oLdlloddollldo.',
    'oLLlldlllldllLLo',
    'oLlllddlldlllllo',
    '.oLllldddllllLo.',
    '..ooldddddllooo.',
    '....oooooooo....',
    '................',
  ],
};

const PUMPKIN: Part = {
  x: 0,
  y: 3,
  rows: [
    '.......ss.......',
    '..ooooossoooo...',
    '.oppPppppPpppo..',
    'oppPppppppPpppo.',
    'opPpppppppppPpo.',
    'opPpppppppppPpo.',
    'opPpppppppppPpo.',
    'oppPppppppPpppo.',
    '.oppPppppPpppo..',
    '..ooooooooooo...',
  ],
};

const pepper = (x: number, y: number): Part => ({
  x,
  y,
  rows: ['.WWW.', 'WWWWW', 'WoWoW', 'WWWWw', '.WwW.', '..w..'],
});

const cob = (x: number, y: number): Part => ({
  x,
  y,
  rows: ['.w.', 'www', 'ppp', 'ppp', 'yyy', 'yyy', 'LyL'],
});

const pod = (x: number, y: number): Part => ({
  x,
  y,
  rows: ['bbb', 'bBb', 'bBb', 'bbb', 'b.b'],
});

const rose = (x: number, y: number): Part => ({
  x,
  y,
  rows: ['.rr.', 'rRRr', 'rRrr', '.rr.'],
});

const moonflower = (x: number, y: number): Part => ({
  x,
  y,
  rows: ['.www.', 'wwcww', '.www.'],
});

/** A spire of snapdragons, pink florets all the way up a stem. */
const spire = (x: number, y: number): Part => ({
  x,
  y,
  rows: ['.p.', 'pPp', '.p.', 'pPp', 'pp.', 'pPp', '.pp', 'pPp', '.s.', '.s.', '.s.', '.s.'],
});

const lily = (x: number, y: number): Part => ({
  x,
  y,
  rows: [
    'r.r.r.r',
    '.rrRrr.',
    'rrRRRrr',
    '.rrRrr.',
    'r..s..r',
    '...s...',
    '...s...',
    '...s...',
    '...s...',
  ],
});

const batFlower = (x: number, y: number): Part => ({
  x,
  y,
  rows: ['B.....B', 'bB.k.Bb', 'bbbkbbb', '.bbbbb.', '.w.w.w.', 'w..s..w', '...s...', '...s...'],
});

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

const ROSE_PALETTE: Palette = { ...GREENS, r: C.rose, R: C.roseLight };

export const CROP_ART: Record<CropId, CropArt> = {
  pumpkin: {
    growing: LOW,
    greens: GREENS,
    ripe: overlay(LOW, [PUMPKIN]),
    ripePalette: { ...GREENS, p: C.pumpkin, P: C.pumpkinLight },
  },
  ghostPepper: {
    growing: LOW,
    greens: GREENS,
    ripe: overlay(LOW, [pepper(0, 5), pepper(10, 4), pepper(5, 8)]),
    ripePalette: { ...GREENS, W: C.ghost, w: C.silver },
  },
  candyCorn: {
    growing: TALL,
    greens: GREENS,
    ripe: overlay(TALL, [cob(3, 9), cob(10, 13), cob(2, 19)]),
    ripePalette: { ...GREENS, w: C.white, p: C.pumpkin, y: C.gold },
  },
  batWingBeans: {
    growing: TALL,
    greens: GREENS,
    ripe: overlay(TALL, [pod(3, 18), pod(11, 21), pod(3, 25), pod(10, 14)]),
    ripePalette: { ...GREENS, b: C.plum, B: C.plumLight },
  },
  rose: {
    growing: LOW,
    greens: GREENS,
    ripe: overlay(LOW, [rose(1, 5), rose(10, 5), rose(6, 2), rose(5, 8)]),
    ripePalette: ROSE_PALETTE,
    rarePalette: { ...ROSE_PALETTE, r: C.blueFabric, R: C.sky },
  },
  moonflower: {
    growing: TALL,
    greens: GREENS,
    ripe: overlay(TALL, [
      moonflower(5, 9),
      moonflower(1, 14),
      moonflower(10, 18),
      moonflower(1, 21),
    ]),
    ripePalette: { ...GREENS, w: C.ghost, c: C.candle },
    glow: { w: C.ghost, c: C.candleBright },
  },
  snapdragon: {
    growing: tall(LOW, 32),
    greens: GREENS,
    ripe: overlay(tall(LOW, 32), [spire(2, 10), spire(7, 7), spire(11, 11)]),
    ripePalette: { ...GREENS, p: C.snap, P: C.snapLight },
  },
  spiderLily: {
    growing: tall(LOW, 32),
    greens: GREENS,
    ripe: overlay(tall(LOW, 32), [lily(0, 9), lily(8, 12)]),
    ripePalette: { ...GREENS, r: C.lily, R: C.lilyLight },
  },
  batFlower: {
    growing: tall(LOW, 32),
    greens: GREENS,
    ripe: overlay(tall(LOW, 32), [batFlower(1, 11), batFlower(8, 8)]),
    ripePalette: { ...GREENS, b: C.plum, B: C.plumLight, k: C.ink, w: C.stoneLight },
  },
  hosta: {
    growing: LOW,
    greens: GREENS,
    ripe: HOSTA,
    ripePalette: GREENS,
  },
};

/** Her rose bush, as it is on a day she's picked it: green, with buds for tomorrow. */
export const ROSE_BUSH_BARE: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....oooooo.....',
    '...ooLLlllloo...',
    '..oLLllllllldo..',
    '.oLlllllbllldlo.',
    '.olllldlllllldo.',
    'oLllbllllldllldo',
    'olllllldlllllldo',
    'olldlllllllbdldo',
    'olllldlllldlllo.',
    '.oLlllllblllldo.',
    '.olldllllllldlo.',
    'oLllllldllllldo.',
    'olllbllllldllldo',
    '.olllllldlllldo.',
    '..olldllllllddo.',
    '...oddllddddoo..',
    '....oodddddo....',
    '......oTTo......',
    '......oTTo......',
    '.....ooTToo.....',
    '................',
    '................',
  ],
};

/** The same bush in bloom. */
export const ROSE_BUSH: SpriteSource = overlay(ROSE_BUSH_BARE, [
  rose(2, 12),
  rose(9, 11),
  rose(5, 15),
  rose(11, 16),
  rose(1, 19),
  rose(7, 20),
  rose(11, 22),
]);

export const ROSE_BUSH_PALETTE: Palette = {
  ...ROSE_PALETTE,
  b: C.berry,
  T: C.bark,
};

/**
 * The sign at the farm gate. It is too small to spell out Hosta La Vista Farm, so it carries a
 * hosta leaf and a line of writing, and says its name when she walks up to it.
 */
export const FARM_SIGN: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    'oooooooooooooooo',
    'oWWWWWWWWWWWWWWo',
    'oWwwwwwwwwwwwwwo',
    'oWwoowtwtwwtwwwo',
    'oWoLlowwwwwwwwwo',
    'oWollDotwttwtwwo',
    'oWwoDowwwwwwwwwo',
    'oWwwwwwtwwtwttwo',
    'oWwwwwwwwwwwwwwo',
    'oddddddddddddddo',
    'oooooooooooooooo',
    '...oWo....oWo...',
    '...oWo....oWo...',
    '...oWo....oWo...',
    '...oWo....oWo...',
    '...oWo....oWo...',
    '...oWo....oWo...',
    '...oWo....oWo...',
    '...oWo....oWo...',
    '..ooWoo..ooWoo..',
    '................',
    '................',
  ],
};

export const FARM_SIGN_PALETTE: Palette = {
  '.': null,
  o: C.ink,
  W: C.rope,
  w: C.wood,
  d: C.bark,
  t: C.cream,
  L: C.hostaBlueLight,
  l: C.hostaBlue,
  D: C.hostaBlueDark,
};
