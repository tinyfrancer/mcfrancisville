import type { FlooringId, WallpaperId } from '../types/ids';
import { bat } from './furnish';
import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * What a room's walls are papered with and its floor laid in, and the mat inside her door, at 32
 * (phase J). A surface is one tile, repeated edge to edge, so anything drawn over its edge has to
 * come back on the other side; `tile` folds a drawing onto the tile to make sure it does. Like the
 * ground outside, surfaces are calmer than what stands on them: low contrast, sparse detail.
 */

/** A wall or floor pattern: one 32×32 tile, repeated. */
export interface SurfaceArt {
  source: SpriteSource;
  palette: Palette;
}

const SIZE = 32;

/**
 * A tile filled with `ground`, and whatever `draw` paints on a sketch three tiles across, folded
 * onto the middle tile, so a motif drawn across an edge wraps round to the other side.
 */
function tile(ground: string, draw: (s: Sketch) => void): SpriteSource {
  const big = new Sketch(SIZE * 3, SIZE * 3);
  draw(big);
  const s = new Sketch(SIZE, SIZE, ground);
  for (let y = 0; y < SIZE * 3; y++) {
    for (let x = 0; x < SIZE * 3; x++) {
      const key = big.get(x, y)!;
      if (key !== CLEAR) s.set(x % SIZE, y % SIZE, key);
    }
  }
  return s.toSource();
}

/** Draws `motif` at a point in the tile and again half a tile over and down: a half-drop repeat. */
function halfDrop(x: number, y: number, motif: (x: number, y: number) => void): void {
  motif(SIZE + x, SIZE + y);
  motif(SIZE + x + SIZE / 2, SIZE + y + SIZE / 2);
  motif(x + SIZE / 2, y + SIZE / 2);
}

// ---- Walls -------------------------------------------------------------------------------------

const PLUM_STRIPES = tile('a', (s) => {
  s.rect(SIZE + 6, SIZE, 4, SIZE, 'b').rect(SIZE + 22, SIZE, 1, SIZE, 'b');
  s.rect(SIZE + 10, SIZE, 1, SIZE, 'c');
});

const BAT_DAMASK = tile('a', (s) => {
  halfDrop(1, 4, (x, y) => {
    bat(s, x, y);
    s.replace('E', 'o');
    s.set(x + 7, y + 10, 'o')
      .rect(x + 5, y + 11, 5, 1, 'o')
      .set(x + 7, y + 12, 'o');
  });
  s.replace('o', 'b');
});

const GOLD_DAMASK = tile('a', (s) => {
  halfDrop(8, 0, (x, y) => {
    // A lozenge with a bud at its heart, and curls off its sides.
    for (let k = 0; k <= 7; k++) {
      s.set(x + 8 - k, y + k, 'b').set(x + 8 + k, y + k, 'b');
      s.set(x + 8 - k, y + 14 - k, 'b').set(x + 8 + k, y + 14 - k, 'b');
    }
    s.rect(x + 7, y + 6, 3, 3, 'c')
      .set(x + 8, y + 5, 'c')
      .set(x + 8, y + 9, 'c');
    s.set(x, y + 6, 'b')
      .set(x - 1, y + 5, 'b')
      .set(x + 16, y + 6, 'b')
      .set(x + 17, y + 5, 'b');
  });
});

const GHOST_POLKA = tile('a', (s) => {
  halfDrop(4, 4, (x, y) => {
    s.ellipse(x + 4.5, y + 4, 4.5, 4, 'b').rect(x, y + 4, 9, 5, 'b');
    s.set(x + 1, y + 9, 'b')
      .set(x + 4, y + 9, 'b')
      .set(x + 7, y + 9, 'b');
    s.set(x + 3, y + 4, 'k')
      .set(x + 6, y + 4, 'k')
      .set(x + 3, y + 3, 'k')
      .set(x + 6, y + 3, 'k');
  });
});

const MOONLIT_BLUE = tile('a', (s) => {
  const moon = (x: number, y: number) => {
    s.ellipse(x + 4, y + 4, 4, 4, 'b').ellipse(x + 6, y + 3, 3.5, 3.5, CLEAR);
  };
  moon(SIZE + 3, SIZE + 3);
  moon(SIZE + 19, SIZE + 19);
  for (const [x, y] of [
    [22, 6],
    [8, 22],
    [28, 14],
    [14, 13],
  ] as const) {
    s.set(SIZE + x, SIZE + y, 'c');
    if (x % 2 === 0) s.set(SIZE + x - 1, SIZE + y, 'c').set(SIZE + x + 1, SIZE + y, 'c');
  }
});

const MOSS_PANELS = tile('a', (s) => {
  for (const x of [0, 16]) {
    s.rect(SIZE + x, SIZE, 1, SIZE, 'b').rect(SIZE + x + 15, SIZE, 1, SIZE, 'c');
    s.rect(SIZE + x + 3, SIZE + 4, 10, 1, 'c').rect(SIZE + x + 3, SIZE + 4, 1, 24, 'c');
    s.rect(SIZE + x + 3, SIZE + 27, 10, 1, 'b').rect(SIZE + x + 12, SIZE + 4, 1, 24, 'b');
  }
});

export const WALLPAPER_ART: Record<WallpaperId, SurfaceArt> = {
  plumStripes: { source: PLUM_STRIPES, palette: { a: C.plum, b: C.plumLight, c: C.dusk } },
  batDamask: { source: BAT_DAMASK, palette: { a: C.teal, b: C.tealShade } },
  goldDamask: { source: GOLD_DAMASK, palette: { a: C.ink, b: C.goldShade, c: C.gold } },
  ghostPolka: { source: GHOST_POLKA, palette: { a: C.lavender, b: C.ghost, k: C.plum } },
  moonlitBlue: { source: MOONLIT_BLUE, palette: { a: C.navy, b: C.candleBright, c: C.sky } },
  mossPanels: { source: MOSS_PANELS, palette: { a: C.moss, b: C.mossLight, c: C.mossDark } },
};

// ---- Floors ------------------------------------------------------------------------------------

/** Boards eight pixels wide running across, their ends staggered, a little grain in each. */
const BOARDS = tile('a', (s) => {
  const ends = [9, 25, 3, 17];
  for (let row = 0; row < 4; row++) {
    const y = SIZE + row * 8;
    s.rect(SIZE, y + 7, SIZE, 1, 'c');
    s.rect(SIZE, y, SIZE, 1, 'd');
    s.rect(SIZE + ends[row]!, y, 1, 7, 'c');
    const grain = (ends[row]! + 11) % SIZE;
    s.rect(SIZE + grain, y + 3, 6, 1, 'b').rect(SIZE + ((grain + 14) % SIZE), y + 5, 4, 1, 'b');
  }
});

const CHECKERBOARD = tile('a', (s) => {
  s.rect(SIZE + 16, SIZE, 16, 16, 'b').rect(SIZE, SIZE + 16, 16, 16, 'b');
  s.rect(SIZE, SIZE, 16, 1, 'A').rect(SIZE + 16, SIZE + 16, 16, 1, 'A');
  s.rect(SIZE + 16, SIZE, 16, 1, 'B').rect(SIZE, SIZE + 16, 16, 1, 'B');
});

const MOSS_CARPET = tile('a', (s) => {
  for (const [x, y] of [
    [3, 2],
    [20, 5],
    [11, 10],
    [28, 13],
    [6, 18],
    [17, 21],
    [25, 26],
    [9, 28],
    [30, 30],
    [14, 1],
  ] as const) {
    s.set(SIZE + x, SIZE + y, 'b').set(SIZE + x + 1, SIZE + y, 'b');
  }
  for (const [x, y] of [
    [15, 15],
    [2, 9],
    [23, 19],
  ] as const)
    s.set(SIZE + x, SIZE + y, 'c');
});

/** Rounded stones set in mortar, two rows a tile, each a shade of its own. */
const COBBLES = tile('c', (s) => {
  const rows: [number, readonly number[]][] = [
    [0, [0, 10, 21]],
    [8, [5, 16, 26]],
    [16, [0, 11, 22]],
    [24, [6, 15, 26]],
  ];
  let k = 0;
  for (const [y, starts] of rows) {
    starts.forEach((x, i) => {
      const w = (starts[i + 1] ?? starts[0]! + SIZE) - x - 1;
      const key = k++ % 3 === 0 ? 'b' : 'a';
      s.ellipse(SIZE + x + w / 2, SIZE + y + 3.5, w / 2, 3.5, key);
      s.rect(SIZE + x + 2, SIZE + y + 1, Math.max(1, w - 5), 1, 'b');
    });
  }
});

export const FLOORING_ART: Record<FlooringId, SurfaceArt> = {
  oakBoards: { source: BOARDS, palette: { a: C.wood, b: C.bark, c: C.barkDark, d: C.wood } },
  checkerboard: {
    source: CHECKERBOARD,
    palette: { a: C.cream, b: C.plum, A: C.white, B: C.plumLight },
  },
  bluePlanks: {
    source: BOARDS,
    palette: { a: C.blueFabric, b: C.blueFabricShade, c: C.navy, d: C.sky },
  },
  mossCarpet: { source: MOSS_CARPET, palette: { a: C.moss, b: C.mossLight, c: C.mossDark } },
  cobblestone: { source: COBBLES, palette: { a: C.stone, b: C.stoneLight, c: C.stoneDark } },
};

/** The mat inside her front door, which she walks onto to go out: a bat on berry, edged in orange. */
export const DOOR_MAT_ART: SurfaceArt = {
  source: (() => {
    const s = new Sketch(SIZE, SIZE);
    s.rect(2, 6, 28, 21, 'r').rect(3, 7, 26, 19, 'p').rect(5, 9, 22, 15, 'm');
    s.rect(5, 9, 22, 1, 'M');
    for (let x = 3; x < 29; x += 2) s.set(x, 27, 'p');
    bat(s, 8, 13);
    s.replace('o', 'k').replace('E', 'M');
    return s.toSource();
  })(),
  palette: {
    [CLEAR]: null,
    r: C.pumpkinDark,
    k: C.ink,
    p: C.pumpkin,
    m: C.berry,
    M: C.berryLight,
  },
};
