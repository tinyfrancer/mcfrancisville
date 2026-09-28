import { PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { Palette } from './sprite';
import {
  ACCENT,
  ACCENT_TWO,
  buildingPalette,
  chimney,
  darkOf,
  door,
  type Drawn,
  fillOf,
  finish,
  flowerBox,
  footing,
  gableRoof,
  GLASS,
  GLASS_DARK,
  INK,
  LEAVES,
  letters,
  lettersWidth,
  lightOf,
  lightWall,
  ROOF,
  shadeOf,
  signBoard,
  slopedRoof,
  STONE,
  step,
  TRIM,
  wall,
  wallLamp,
  WHITE,
  window,
} from './buildings';

/*
 * Her neighbours' houses at 32 pixels a tile (phase G), each after its owner: Maude's library,
 * Rufus's florist's cottage, Agatha's witch-hat cottage, Barty's potting cottage with its
 * greenhouse, and Cody's gothic manor. Wrapunzel lives over her bakery. Their insides are
 * phase H's; for now their doors stay shut.
 */

function sign(s: Sketch, text: string, cx: number, y: number, key: string): void {
  letters(s, text, Math.round(cx - lettersWidth(text) / 2), y, key);
}

/** The ramp of a material, lightest last, for `Sketch.sphere`. */
function sphereRamp(keys: string): string {
  return `${darkOf(keys)}${shadeOf(keys)}${fillOf(keys)}${lightOf(keys)}`;
}

// ---- Maude's library -------------------------------------------------------------------------

/**
 * Maude's library, which she haunts: a tall, narrow gothic house in pale ghostly shingles under a
 * steep slate gable with a rose window, a pointed window full of books, and more books stacked by
 * the door she's always meaning to put away.
 */
function drawMaude(): Drawn {
  const W = 144;
  const H = 168;
  const s = new Sketch(W, H);
  const floor = H - 6;
  gableRoof(s, 72, 6, 70, W, 9, 'slate', 'shingles');
  wall(s, 12, 70, W - 24, floor - 70, 'shingles', undefined, 4);
  lightWall(s, 12, 70, W - 24, floor - 70, 4);
  footing(s, 10, floor - 6, W - 20, 6);
  window(s, 62, 30, 20, 20, { shape: 'round', panes: [2, 2] });
  window(s, 22, 88, 28, 56, { shape: 'pointed', panes: [1, 1], sill: true });
  bookshelf(s, 24, 106, 24, 36);
  window(s, 114, 100, 16, 36, { shape: 'pointed', panes: [1, 2] });
  signBoard(s, 70, 80, 36, 11);
  sign(s, 'LIBRARY', 88, 83, darkOf(TRIM));
  const front = door(s, 88, floor, 30, 58, { shape: 'pointed', knob: 'left' });
  wallLamp(s, 60, 108);
  // Books she'll put back tomorrow, stacked by the step.
  let y = floor;
  for (const [w, key] of [
    [12, ACCENT],
    [10, ACCENT_TWO],
    [11, LEAVES],
    [8, ACCENT],
  ] as const) {
    s.rect(110 - Math.floor(w / 2), y - 3, w, 3, fillOf(key)).rect(
      110 - Math.floor(w / 2),
      y - 3,
      2,
      3,
      WHITE,
    );
    y -= 3;
  }
  step(s, 88, H, 38, 6);
  return { source: finish(s), door: front };
}

/** Shelves of books seen through a window, spines in every colour the building has. */
function bookshelf(s: Sketch, x: number, y: number, w: number, h: number): void {
  const spines = [ACCENT, ACCENT_TWO, LEAVES, TRIM, ACCENT_TWO, ACCENT, LEAVES];
  for (let shelf = y + 10; shelf <= y + h; shelf += 12) {
    for (let i = x, n = 0; i < x + w - 1; n++) {
      const width = 2 + (n % 3 === 0 ? 1 : 0);
      const tall = 7 + ((n * 5) % 3);
      const key = spines[n % spines.length]!;
      for (let k = 0; k < width; k++) {
        for (let j = shelf - tall; j < shelf; j++) {
          if (s.get(i + k, j) === GLASS || s.get(i + k, j) === GLASS_DARK)
            s.set(i + k, j, fillOf(key));
        }
      }
      i += width;
    }
    for (let i = x; i < x + w; i++) if (s.get(i, shelf) === GLASS) s.set(i, shelf, fillOf(TRIM));
  }
}

export const MAUDE_HOUSE: Drawn = drawMaude();

export const MAUDE_HOUSE_PALETTE: Palette = buildingPalette({
  wall: C.skinGhostly,
  roof: C.navy,
  trim: C.plumLight,
  door: C.navy,
  accent: C.orbBlue,
  accentTwo: C.gold,
  leaves: C.leaf,
});

// ---- Rufus's cottage --------------------------------------------------------------------------

/**
 * Rufus's cottage, the florist's: a log cabin under a shaggy thatched gable with a moon window,
 * flower boxes overflowing at every window, and buckets of cut flowers by the door with a sign.
 */
function drawRufus(): Drawn {
  const W = 176;
  const H = 156;
  const s = new Sketch(W, H);
  const floor = H - 6;
  gableRoof(s, 88, 6, 74, W, 12, 'thatch', 'boards');
  wall(s, 16, 74, W - 32, floor - 74, 'logs');
  lightWall(s, 16, 74, W - 32, floor - 74, 3);
  footing(s, 14, floor - 6, W - 28, 6);
  window(s, 79, 30, 18, 18, { shape: 'round', panes: [1, 1] });
  // A crescent moon in the round window, as a werewolf would want.
  s.ellipse(88, 39, 5, 5, fillOf(ACCENT_TWO)).ellipse(90, 38, 4, 4, GLASS);
  window(s, 26, 90, 30, 26, { panes: [2, 2], box: true });
  window(s, W - 56, 90, 30, 26, { panes: [2, 2], box: true });
  const front = door(s, 88, floor, 32, 58, { shape: 'arch', light: true });
  signBoard(s, W - 58, 124, 38, 11, ACCENT_TWO);
  sign(s, 'FLOWERS', W - 39, 127, darkOf(TRIM));
  for (const x of [28, 44, W - 54, W - 38]) bucket(s, x, floor);
  wallLamp(s, 62, 100);
  step(s, 88, H, 40, 6);
  return { source: finish(s), door: front };
}

/** A tin bucket of cut flowers. */
function bucket(s: Sketch, x: number, bottom: number): void {
  for (let j = 0; j < 9; j++)
    s.rect(x + (j > 6 ? 1 : 0), bottom - 9 + j, 12 - (j > 6 ? 2 : 0), 1, fillOf(STONE));
  s.rect(x, bottom - 9, 12, 1, lightOf(STONE)).rect(x + 10, bottom - 8, 2, 6, shadeOf(STONE));
  flowerBox(s, x - 1, bottom - 17, 14, x);
  s.rect(x - 1, bottom - 12, 14, 3, fillOf(STONE));
}

export const RUFUS_HOUSE: Drawn = drawRufus();

export const RUFUS_HOUSE_PALETTE: Palette = buildingPalette({
  wall: C.wood,
  roof: C.rope,
  trim: C.bark,
  door: C.teal,
  accent: C.rose,
  accentTwo: C.gold,
  leaves: C.leaf,
});

// ---- Agatha's cottage -------------------------------------------------------------------------

/**
 * Agatha's cottage: a round stone cottage wearing its roof like a witch's hat, tall and pointed
 * with its tip bent over, a lavender band round it and a brim for eaves, a round window up in the
 * hat, and a cauldron bubbling green by the door.
 */
function drawAgatha(): Drawn {
  const W = 144;
  const H = 180;
  const s = new Sketch(W, H);
  const floor = H - 6;
  const cx = 72;
  wall(s, 18, 96, W - 36, floor - 96, 'stone', undefined, 12);
  lightWall(s, 18, 96, W - 36, floor - 96, 6);
  // The hat: a cone that leans over at the top, its band, and a brim for eaves.
  for (let y = 2; y < 90; y++) {
    const t = (y - 2) / 88;
    const half = Math.round(3 + 57 * Math.pow(t, 1.15));
    const lean = Math.round(20 * Math.pow(1 - t, 2.2));
    s.rect(cx + lean - half, y, half * 2, 1, fillOf(ROOF));
  }
  for (let y = 10; y < 90; y += 7) {
    for (let x = 0; x < W; x++) {
      if (s.get(x, y) === fillOf(ROOF) && (x + y) % 9 !== 0) s.set(x, y, shadeOf(ROOF));
    }
  }
  s.bevel(fillOf(ROOF) + shadeOf(ROOF), lightOf(ROOF), null);
  for (let y = 74; y < 84; y++) {
    for (let x = 0; x < W; x++) {
      if ('mrRL'.includes(s.get(x, y) ?? '.'))
        s.set(
          x,
          y,
          y === 74 ? lightOf(ACCENT_TWO) : y === 83 ? shadeOf(ACCENT_TWO) : fillOf(ACCENT_TWO),
        );
    }
  }
  s.rect(cx - 6, 75, 12, 8, lightOf(STONE)).rect(cx - 4, 77, 8, 4, fillOf(ACCENT_TWO));
  s.ellipse(cx, 93, W / 2 - 1, 6, fillOf(ROOF)).ellipse(cx, 92, W / 2 - 4, 3, lightOf(ROOF));
  s.rect(4, 96, W - 8, 2, darkOf(ROOF));
  window(s, cx - 8, 46, 16, 16, { shape: 'round', panes: [2, 2] });
  const front = door(s, 56, floor, 30, 56, { shape: 'arch', knob: 'right' });
  window(s, 92, 112, 22, 26, { panes: [2, 2], shutters: true, box: true });
  cauldron(s, 106, floor);
  step(s, 56, H, 36, 6);
  footing(s, 16, floor - 5, W - 32, 5);
  return { source: finish(s), door: front };
}

/** A round black cauldron on stubby legs, brewing something green and friendly. */
function cauldron(s: Sketch, cx: number, bottom: number): void {
  s.rect(cx - 8, bottom - 3, 2, 3, darkOf(TRIM)).rect(cx + 6, bottom - 3, 2, 3, darkOf(TRIM));
  s.ellipse(cx + 0.5, bottom - 11, 11, 9, INK);
  s.ellipse(cx - 3.5, bottom - 14, 3, 4, darkOf(ROOF));
  s.ellipse(cx + 0.5, bottom - 18, 10, 3, fillOf(ACCENT)).rect(cx - 10, bottom - 18, 21, 1, INK);
  for (const [x, y] of [
    [cx - 3, bottom - 21],
    [cx + 4, bottom - 24],
    [cx + 1, bottom - 27],
  ] as const) {
    s.rect(x, y, 2, 2, lightOf(ACCENT));
  }
}

export const AGATHA_HOUSE: Drawn = drawAgatha();

export const AGATHA_HOUSE_PALETTE: Palette = buildingPalette({
  wall: C.stone,
  roof: C.inkFabric,
  trim: C.bark,
  door: C.plum,
  accent: C.guac,
  accentTwo: C.lavender,
  leaves: C.leafDark,
});

// ---- Barty's cottage --------------------------------------------------------------------------

/**
 * Barty's cottage, the gardener's: a sage-green potting cottage with bone-white trim and a
 * stovepipe, a greenhouse built on at the side with seedlings inside, and terracotta pots and a
 * watering can by the door.
 */
function drawBarty(): Drawn {
  const W = 144;
  const H = 156;
  const s = new Sketch(W, H);
  const floor = H - 6;
  chimney(s, 22, 16, 8, 50);
  slopedRoof(s, 50, 30, 80, 44, 100, 'shingles');
  wall(s, 10, 80, 80, floor - 80, 'boards', undefined, 8);
  lightWall(s, 10, 80, 80, floor - 80, 4);
  footing(s, 8, floor - 6, 84, 6);
  // The greenhouse: glass walls and a glass roof on a trim frame, seedlings inside.
  window(s, 90, 64, 46, 16, { panes: [3, 1] });
  window(s, 90, 80, 46, floor - 80, { panes: [3, 3] });
  // A bench of seedlings in pots, and a tall tomato plant climbing a cane at the back.
  s.rect(92, floor - 22, 42, 2, fillOf(TRIM)).rect(94, floor - 20, 1, 12, fillOf(TRIM));
  s.rect(131, floor - 20, 1, 12, fillOf(TRIM));
  for (let x = 94; x < 132; x += 7) {
    s.rect(x, floor - 27, 5, 5, fillOf(ACCENT)).rect(x, floor - 27, 5, 1, lightOf(ACCENT));
    s.ellipse(x + 2.5, floor - 30, 3.5, 2.5, fillOf(LEAVES)).set(
      x + 1,
      floor - 32,
      lightOf(LEAVES),
    );
  }
  s.rect(120, 86, 1, 30, darkOf(TRIM));
  for (let y = 88; y < 116; y += 5) {
    s.ellipse(118.5 + ((y / 5) % 2) * 4, y, 3, 2.5, fillOf(LEAVES));
    if (y % 10 === 3) s.rect(117, y + 2, 2, 2, fillOf(ACCENT_TWO));
  }
  window(s, 18, 96, 22, 22, { panes: [2, 2], box: true });
  const front = door(s, 56, floor, 30, 56, { light: true, knob: 'right' });
  for (const [x, w] of [
    [74, 8],
    [82, 6],
  ] as const) {
    s.rect(x, floor - 6, w, 6, fillOf(ACCENT)).rect(x - 1, floor - 7, w + 2, 2, lightOf(ACCENT));
    s.rect(x + 2, floor - 11, 2, 4, fillOf(LEAVES)).set(x + 1, floor - 12, lightOf(LEAVES));
  }
  wateringCan(s, 14, floor);
  step(s, 56, H, 36, 6);
  return { source: finish(s), door: front };
}

/** A watering can by the door. */
function wateringCan(s: Sketch, x: number, bottom: number): void {
  s.rect(x, bottom - 9, 11, 9, fillOf(STONE)).rect(x, bottom - 9, 11, 1, lightOf(STONE));
  s.line(x + 11, bottom - 6, x + 17, bottom - 11, fillOf(STONE)).rect(
    x + 16,
    bottom - 12,
    3,
    2,
    fillOf(STONE),
  );
  s.rect(x + 2, bottom - 13, 7, 1, shadeOf(STONE)).rect(x + 2, bottom - 13, 1, 4, shadeOf(STONE));
  s.rect(x + 8, bottom - 13, 1, 4, shadeOf(STONE));
}

export const BARTY_HOUSE: Drawn = drawBarty();

export const BARTY_HOUSE_PALETTE: Palette = buildingPalette({
  wall: C.hostaBlueDark,
  roof: C.berry,
  trim: C.bone,
  door: C.wood,
  accent: C.pumpkinShade,
  accentTwo: C.lily,
  leaves: C.leafLight,
});

// ---- Cody's manor -----------------------------------------------------------------------------

/** The bat on the weathervane over Cody's gable. */
const WEATHER_BAT = [
  'o..........o',
  'oo..o..o..oo',
  'ooo.oooo.ooo',
  'oooooooooooo',
  '.oooooooooo.',
  '..o..oo..o..',
];

/**
 * Cody's manor: a little gothic house in dark red brick under slate, with a steep cross gable and
 * its rose window, a bat on the weathervane, pointed windows with red velvet curtains, twin
 * chimneys, a pointed door between iron lamps, and red roses along the front.
 */
function drawCody(): Drawn {
  const W = 176;
  const H = 192;
  const s = new Sketch(W, H);
  const floor = H - 6;
  const cx = 88;
  chimney(s, 26, 20, 12, 60);
  chimney(s, W - 38, 20, 12, 60);
  slopedRoof(s, cx, 34, 92, 110, W - 4, 'slate');
  wall(s, 16, 92, W - 32, floor - 92, 'brick', undefined, 2);
  lightWall(s, 16, 92, W - 32, floor - 92, 5);
  gableRoof(s, cx, 14, 94, 76, 8, 'slate', 'brick');
  s.rect(cx, 2, 1, 12, darkOf(TRIM));
  s.stamp({ rows: WEATHER_BAT }, cx - 6, 0);
  footing(s, 14, floor - 8, W - 28, 8);
  window(s, cx - 9, 46, 18, 18, { shape: 'round', panes: [2, 2] });
  for (const x of [26, W - 50]) {
    window(s, x, 104, 24, 50, { shape: 'pointed', panes: [1, 2], sill: true, curtains: true });
  }
  const front = door(s, cx, floor, 34, 66, { shape: 'pointed', knob: 'right' });
  wallLamp(s, cx - 28, 124);
  wallLamp(s, cx + 24, 124);
  for (const x of [cx - 40, cx + 40]) roseBush(s, x, floor);
  step(s, cx, H, 44, 6);
  return { source: finish(s), door: front };
}

/** A small rose bush in bloom against the wall. */
function roseBush(s: Sketch, cx: number, bottom: number): void {
  s.sphere(cx + 0.5, bottom - 8, 9, 7, sphereRamp(LEAVES));
  for (const [dx, dy] of [
    [-5, -10],
    [2, -12],
    [5, -7],
    [-2, -6],
  ] as const) {
    s.rect(cx + dx, bottom + dy, 2, 2, fillOf(ACCENT)).set(cx + dx, bottom + dy, lightOf(ACCENT));
  }
}

export const CODY_HOUSE: Drawn = drawCody();

export const CODY_HOUSE_PALETTE: Palette = buildingPalette({
  wall: C.berry,
  roof: C.inkFabric,
  trim: C.stoneLight,
  door: C.maroon,
  stone: C.stoneDark,
  accent: C.scarlet,
  accentTwo: C.scarlet,
  leaves: C.leafDark,
});
