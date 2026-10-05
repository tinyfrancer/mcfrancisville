import type { PropId } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  awning,
  buildingPalette,
  chimney,
  darkOf,
  DOOR,
  door,
  type Drawn,
  fillOf,
  finish,
  footing,
  gableRoof,
  GLASS,
  GLASS_DARK,
  GLINT,
  INK,
  LAMP,
  LEAVES,
  letters,
  lettersWidth,
  lightOf,
  lightWall,
  type Material,
  ROOF,
  shadeOf,
  signBoard,
  slopedRoof,
  STONE,
  step,
  TRIM,
  WALL,
  wall,
  wallLamp,
  WHITE,
  window,
  WINDOWS_LIT,
} from './buildings';
import { slab } from './furnish';
import { clumpsOf, type Crown, leaves, paintCrown } from './nature';
import { mix, PALETTE as C, ramp } from './palette';
import type { PropArt } from './props';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * Boo Acres (0.3's F1, decision 241), drawn at 32 from the building kit like the town: Scarah's
 * farmhouse, the big barn with the place's name over its doors, the greenhouse, the seed cart, the
 * farm's well and the orchard's four kinds of fruit tree.
 */

/** Writes a word centred on `cx`. */
function centred(s: Sketch, text: string, cx: number, y: number, key: string): void {
  letters(s, text, Math.round(cx - lettersWidth(text) / 2), y, key);
}

// ---- Scarah's farmhouse -----------------------------------------------------------------------

/**
 * The farmhouse, five tiles wide: cream clapboard under a mossy shingled gable, a round window up
 * in the gable, a porch roof along the front on two posts, sunflowers in the window boxes, a stone
 * chimney, and a little crow on the weather vane, as there's one on her shoulder (F3).
 */
function drawFarmhouse(): Drawn {
  const W = 176;
  const H = 188;
  const s = new Sketch(W, H);
  const floor = H - 6;
  const cx = W / 2;
  chimney(s, 126, 30, 14, 80);
  gableRoof(s, cx, 22, 82, W - 6, 12, 'shingles', 'boards');
  // The weather vane on the gable's peak, and the crow on it.
  s.rect(cx, 4, 1, 20, darkOf(TRIM));
  s.rect(cx - 6, 14, 13, 1, darkOf(TRIM));
  s.rect(cx - 3, 5, 6, 4, INK)
    .rect(cx - 5, 6, 2, 2, INK)
    .rect(cx + 3, 7, 3, 1, INK);
  s.rect(cx - 1, 9, 1, 2, INK)
    .set(cx + 6, 6, fillOf(ACCENT_TWO))
    .set(cx - 2, 6, WHITE);
  wall(s, 16, 82, W - 32, floor - 82, 'boards', WALL, 9);
  lightWall(s, 16, 82, W - 32, floor - 82, 4);
  footing(s, 14, floor - 6, W - 28, 6);
  window(s, cx - 11, 42, 22, 22, { shape: 'round', panes: [2, 2] });
  // The porch: a shingled lean-to along the front, on two posts.
  slopedRoof(s, cx, 98, 110, W - 40, W - 16, 'shingles');
  for (const x of [14, W - 20]) slab(s, x, 113, 6, floor - 119, TRIM);
  const front = door(s, cx, floor - 6, 30, 54, { light: true, knob: 'right' });
  for (const x of [34, W - 58]) window(s, x, 128, 24, 24, { panes: [2, 2], box: true });
  wallLamp(s, cx + 20, 130);
  step(s, cx, H, 40, 6);
  return { source: finish(s), door: front };
}

export const FARMHOUSE: Drawn = drawFarmhouse();

export const FARMHOUSE_PALETTE: Palette = buildingPalette({
  wall: C.cream,
  roof: C.moss,
  trim: C.wood,
  door: C.pumpkinShade,
  accent: C.gold,
  accentTwo: C.pumpkin,
  leaves: C.leaf,
});

// ---- The barn ---------------------------------------------------------------------------------

/** A big door's leaf: boards in its fill, framed in trim with a cross brace corner to corner. */
function barnLeaf(s: Sketch, x: number, y: number, w: number, h: number): void {
  s.rect(x, y, w, h, fillOf(DOOR));
  for (let i = x + 5; i < x + w - 2; i += 6) s.rect(i, y, 1, h, shadeOf(DOOR));
  const t = fillOf(TRIM);
  s.rect(x, y, w, 3, t)
    .rect(x, y + h - 3, w, 3, t)
    .rect(x, y, 3, h, t)
    .rect(x + w - 3, y, 3, h, t);
  for (let k = 0; k < h; k++) {
    const a = Math.round(x + (k / h) * (w - 3));
    const b = Math.round(x + w - 3 - (k / h) * (w - 3));
    s.rect(a, y + k, 3, 1, t).rect(b, y + k, 3, 1, t);
  }
  s.rect(x, y, w, 1, lightOf(TRIM));
}

/**
 * The barn, six tiles wide: red boards under a big gable, white trim, a hay loft door up in the
 * gable with straw spilling out and a hoist beam over it, two great braced doors standing a little
 * open, and BOO ACRES on a board over them.
 */
function drawBarn(): SpriteSource {
  const W = 200;
  const H = 180;
  const s = new Sketch(W, H);
  const floor = H - 2;
  const cx = W / 2;
  gableRoof(s, cx, 4, 74, W - 2, 13, 'shingles', 'boards');
  wall(s, 12, 74, W - 24, floor - 74, 'boards', WALL, 4);
  lightWall(s, 12, 74, W - 24, floor - 74, 5);
  // The loft door, open on the dark, with straw in it, and the hoist beam over it.
  s.rect(cx - 15, 32, 30, 28, fillOf(TRIM)).rect(cx - 12, 35, 24, 25, darkOf(DOOR));
  for (let i = 0; i < 24; i++) {
    const top = 50 + ((i * 7) % 5);
    s.rect(cx - 12 + i, top, 1, 60 - top, i % 3 === 0 ? shadeOf(ACCENT_TWO) : fillOf(ACCENT_TWO));
  }
  s.rect(cx - 2, 22, 4, 10, fillOf(TRIM)).rect(cx - 2, 22, 4, 1, lightOf(TRIM));
  s.rect(cx, 32, 1, 6, darkOf(TRIM));
  // The great doors, one leaf ajar onto the dark inside.
  const dw = 34;
  const dh = 64;
  const top = floor - dh;
  s.rect(cx - dw - 3, top - 3, dw * 2 + 6, 3, fillOf(TRIM));
  s.rect(cx - dw, top, dw * 2, dh, darkOf(DOOR));
  barnLeaf(s, cx - dw, top, dw, dh);
  barnLeaf(s, cx + 6, top, dw - 6, dh);
  // A bale of straw inside, glimpsed through the gap.
  s.rect(cx, floor - 14, 6, 14, shadeOf(ACCENT_TWO));
  // The name over the doors.
  const word = 'BOO ACRES';
  const bw = lettersWidth(word) + 12;
  signBoard(s, Math.round(cx - bw / 2), top - 19, bw, 13);
  centred(s, word, cx, top - 15, darkOf(DOOR));
  for (const x of [26, W - 50]) window(s, x, 102, 24, 22, { panes: [2, 2], shutters: false });
  for (const x of [26, W - 50]) s.rect(x - 2, 124, 28, 3, fillOf(TRIM));
  footing(s, 10, floor - 5, cx - dw - 13, 5);
  footing(s, cx + dw + 3, floor - 5, W - 13 - cx - dw, 5);
  return finish(s);
}

export const BARN: SpriteSource = drawBarn();

export const BARN_PALETTE: Palette = buildingPalette({
  wall: C.berry,
  roof: C.plum,
  trim: C.cream,
  door: C.maroon,
  accentTwo: C.gold,
});

// ---- The greenhouse ---------------------------------------------------------------------------

/**
 * The greenhouse, five tiles wide: panes of glass in white frames, walls and a pitched roof, on a
 * low brick wall, with leaves and tomatoes pressed up against the glass inside and a glass door in
 * the middle. After dark it glows like a lantern.
 */
function drawGreenhouse(): Drawn {
  const W = 168;
  const H = 132;
  const s = new Sketch(W, H);
  const floor = H - 2;
  const cx = W / 2;
  const eave = 54;
  const sill = floor - 18;
  const t = fillOf(TRIM);
  // The roof, glass from the ridge down to the eaves, and the walls under it.
  for (let y = 14; y < eave; y++) {
    const half = Math.round(30 + ((W / 2 - 4 - 30) * (y - 14)) / (eave - 15));
    s.rect(cx - half, y, half * 2, 1, GLASS);
  }
  s.rect(10, eave, W - 20, sill - eave, GLASS);
  // What's growing inside, against the glass: leafy plants, tomatoes, and a hanging pot.
  for (let x = 12; x < W - 12; x++) {
    const h = 18 + Math.round(6 * Math.sin(x * 0.45) + 4 * Math.sin(x * 0.13));
    for (let y = sill - h; y < sill; y++) {
      const key =
        y < sill - h + 2 ? lightOf(LEAVES) : (x + y) % 7 === 0 ? shadeOf(LEAVES) : fillOf(LEAVES);
      s.set(x, y, key);
    }
  }
  for (const [x, y] of [
    [22, 98],
    [40, 92],
    [118, 96],
    [140, 90],
    [130, 102],
    [30, 104],
  ] as const) {
    s.rect(x, y, 3, 3, fillOf(ACCENT)).set(x, y, lightOf(ACCENT));
  }
  for (const x of [46, 122]) {
    s.rect(x, eave, 1, 10, darkOf(TRIM));
    s.rect(x - 4, eave + 10, 9, 6, fillOf(STONE)).rect(x - 4, eave + 10, 9, 1, lightOf(STONE));
    s.rect(x - 6, eave + 6, 4, 4, fillOf(LEAVES)).rect(x + 3, eave + 6, 4, 4, fillOf(LEAVES));
  }
  // The frames: the ridge, the eaves, the corners, and the glazing bars.
  s.rect(cx - 32, 12, 64, 3, t).rect(cx - 32, 12, 64, 1, lightOf(TRIM));
  s.rect(4, eave - 1, W - 8, 3, t);
  for (let x = 10; x < W - 10; x += 16) {
    s.rect(x, eave, 2, sill - eave, t);
    for (let y = 14; y < eave; y++) {
      const along = (x - cx) * ((y - 14) / (eave - 15)) * 0.45 + (x - cx) * 0.55;
      const bar = Math.round(cx + along);
      if (s.get(bar, y) === GLASS || s.get(bar, y) === t) s.rect(bar, y, 2, 1, t);
    }
  }
  s.rect(W - 12, eave, 2, sill - eave, t).rect(10, eave + 26, W - 20, 2, t);
  // The light on the glass, a pale stroke across each pane.
  for (let x = 13; x < W - 16; x += 16) {
    for (let k = 0; k < 7; k++) {
      if (s.get(x + k, eave + 12 - k) === GLASS) s.set(x + k, eave + 12 - k, GLINT);
    }
  }
  for (let y = 14; y < eave; y++) {
    for (let x = 0; x < W; x++) {
      if (s.get(x, y) === GLASS && s.get(x, y - 1) !== GLASS) s.set(x, y, GLASS_DARK);
    }
  }
  wall(s, 8, sill, W - 16, floor - sill, 'brick', STONE, 5);
  s.rect(6, sill - 2, W - 12, 3, fillOf(STONE)).rect(6, sill - 2, W - 12, 1, lightOf(STONE));
  const front = door(s, cx, floor, 30, 54, { light: true, knob: 'right' });
  // The door's own glass, top to bottom bar the frame.
  s.rect(front.x + 5, front.y + 6, front.w - 10, 26, GLASS).rect(
    front.x + 5,
    front.y + 6,
    front.w - 10,
    1,
    GLASS_DARK,
  );
  s.rect(cx - 1, front.y + 6, 2, 26, t).set(front.x + 6, front.y + 8, GLINT);
  return { source: finish(s), door: front };
}

export const GREENHOUSE: Drawn = drawGreenhouse();

export const GREENHOUSE_PALETTE: Palette = buildingPalette({
  wall: C.cream,
  roof: C.plum,
  trim: C.white,
  door: C.moss,
  stone: mix(C.pumpkinShade, C.stone, 0.45),
  accent: C.scarlet,
  leaves: C.leaf,
  glass: mix(C.tealLight, C.skyDay, 0.4),
});

// ---- The seed cart ----------------------------------------------------------------------------

/**
 * The seed cart, two tiles wide: a wooden barrow on a big spoked wheel with a handle, a striped
 * awning on two posts, SEEDS on a board, and packets in every colour standing in rows in its tray.
 */
function drawSeedCart(): SpriteSource {
  const W = 72;
  const H = 86;
  const s = new Sketch(W, H);
  for (const x of [6, W - 10]) slab(s, x, 22, 4, 40, TRIM);
  awning(s, 3, 18, W - 6, 9, [ACCENT, ACCENT_TWO], 8);
  const bw = lettersWidth('SEEDS') + 10;
  signBoard(s, Math.round((W - bw) / 2), 4, bw, 12, WALL);
  centred(s, 'SEEDS', W / 2, 8, fillOf(DOOR));
  s.rect(W / 2 - 1, 15, 2, 3, darkOf(TRIM));
  // The packets, in rows, in the tray.
  const colours: readonly Material[] = [ACCENT, ROOF, DOOR, ACCENT_TWO, LEAVES];
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 7; i++) {
      const m = colours[(i + row * 2) % colours.length]!;
      const x = 10 + i * 8 + row * 3;
      const y = 40 + row * 6;
      s.rect(x, y, 6, 9, WHITE)
        .rect(x + 1, y + 2, 4, 5, fillOf(m))
        .set(x + 1, y + 2, lightOf(m));
    }
  }
  slab(s, 4, 54, W - 8, 14, TRIM);
  for (let x = 10; x < W - 8; x += 12) s.rect(x, 56, 1, 11, shadeOf(TRIM));
  // The handle, out to the right, and its leg.
  s.rect(W - 6, 58, 6, 2, fillOf(TRIM)).rect(W - 9, 68, 2, 16, fillOf(TRIM));
  // The wheel, with its spokes.
  const wx = 22;
  const wy = 72;
  for (let dy = -12; dy <= 12; dy++) {
    for (let dx = -12; dx <= 12; dx++) {
      const d = Math.hypot(dx, dy);
      if (d <= 12 && d > 9.5) s.set(wx + dx, wy + dy, dy < -3 ? fillOf(DOOR) : shadeOf(DOOR));
    }
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI + 0.3;
    s.line(
      wx - Math.round(Math.cos(a) * 9),
      wy - Math.round(Math.sin(a) * 9),
      wx + Math.round(Math.cos(a) * 9),
      wy + Math.round(Math.sin(a) * 9),
      darkOf(DOOR),
    );
  }
  s.rect(wx - 2, wy - 2, 4, 4, LAMP);
  return finish(s);
}

export const SEED_CART: SpriteSource = drawSeedCart();

export const SEED_CART_PALETTE: Palette = buildingPalette({
  wall: C.cream,
  roof: C.plum,
  trim: C.wood,
  door: C.scarlet,
  accent: C.moss,
  accentTwo: C.cream,
  leaves: C.leaf,
});

// ---- The well ---------------------------------------------------------------------------------

/**
 * The farm's well, two tiles wide: a round stone well under a little shingled roof on two posts,
 * a crank across it and a bucket on its rope.
 */
function drawFarmWell(): SpriteSource {
  const W = 64;
  const H = 82;
  const s = new Sketch(W, H);
  const cx = W / 2;
  for (const x of [12, W - 16]) slab(s, x, 18, 4, 40, TRIM);
  slopedRoof(s, cx, 2, 18, 10, W - 4, 'shingles');
  // The crank and its handle, and the bucket hanging off the rope.
  s.rect(14, 28, W - 28, 3, fillOf(TRIM)).rect(14, 28, W - 28, 1, lightOf(TRIM));
  s.rect(W - 14, 28, 2, 8, darkOf(TRIM)).rect(W - 14, 35, 6, 2, darkOf(TRIM));
  s.rect(cx, 31, 1, 12, darkOf(TRIM));
  slab(s, cx - 4, 42, 9, 8, DOOR);
  s.rect(cx - 4, 44, 9, 1, darkOf(DOOR));
  // The well itself, round, its dark inside showing over the rim.
  wall(s, 8, 56, W - 16, 24, 'stone', STONE, 9);
  s.ellipse(cx, 56, 25, 6, fillOf(STONE)).ellipse(cx, 56, 20, 4, darkOf(DOOR));
  for (let x = 8; x < W - 8; x++) s.set(x, 79, darkOf(STONE));
  s.bevel(fillOf(STONE), lightOf(STONE), null);
  return finish(s);
}

export const FARM_WELL: SpriteSource = drawFarmWell();

export const FARM_WELL_PALETTE: Palette = buildingPalette({
  wall: C.cream,
  roof: C.berry,
  trim: C.wood,
  door: C.bark,
  stone: C.stone,
});

// ---- The orchard ------------------------------------------------------------------------------

/** The kinds of fruit tree, each its own prop for what it gives (F2). */
type FruitTreeId = Extract<PropId, 'appleTree' | 'pearTree' | 'plumTree' | 'persimmonTree'>;

/** Where fruit hangs in a crown, by its top-left. */
const FRUIT_AT: readonly (readonly [number, number])[] = [
  [14, 22],
  [36, 16],
  [46, 30],
  [24, 36],
  [8, 40],
  [40, 42],
  [28, 12],
  [52, 44],
  [18, 50],
];

/** A fruit: round, or a pear's narrower top. Its tones are `k` (shade), `K` (fill) and `l`. */
function fruit(s: Sketch, x: number, y: number, pear: boolean): void {
  if (pear) {
    s.rect(x + 1, y, 2, 2, 'K')
      .rect(x, y + 2, 4, 3, 'K')
      .rect(x + 1, y + 5, 2, 1, 'k');
    s.set(x + 1, y + 1, 'l').set(x + 3, y + 4, 'k');
  } else {
    s.rect(x + 1, y, 2, 1, 'K')
      .rect(x, y + 1, 4, 2, 'K')
      .rect(x + 1, y + 3, 2, 1, 'k');
    s.set(x + 1, y + 1, 'l').set(x + 3, y + 2, 'k');
  }
  s.set(x + 2, y - 1, 'u');
}

/**
 * An orchard tree, two tiles wide and nearly three tall, lower and rounder than the woods' trees,
 * on a short trunk: its crown of leafy clumps (`paintCrown`), hung with fruit, or bare of it once
 * picked for the day.
 */
function drawFruitTree(seed: number, fruited: boolean, pear = false): SpriteSource {
  const s = new Sketch(64, 92);
  const crown: Crown = { x: 32, y: 34, rx: 29, ry: 26 };
  const foot = 88;
  for (let y = 50; y <= foot; y++) {
    const half = 4 + Math.max(0, y - (foot - 4));
    s.rect(32 - half, y, half * 2, 1, 'w');
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) s.rect(32 + side * (2 + i) - 1, 54 - i, 3, 1, 'w');
  }
  s.bevel('w', 'W', 'v');
  paintCrown(s, crown, clumpsOf(crown, seed, { count: 9, r: 10 }), seed * 5 + 1, 26);
  s.outline({ 0: 'o', 1: 'o', 2: 'o', 3: 'o', 4: 'o', 5: 'o', w: 'u', W: 'u', v: 'u' });
  if (fruited) for (const [x, y] of FRUIT_AT) fruit(s, x, y, pear);
  return s.toSource();
}

/** A fruit tree's palette: its leaves, its bark, and its fruit's three tones. */
function fruitPalette(leaf: string, light: string, fruitColour: string): Palette {
  const r = ramp(fruitColour);
  return { ...leaves(leaf, light), k: r[1], K: r[2], l: r[3] };
}

const FRUIT_TREES: Record<FruitTreeId, { seed: number; palette: Palette; pear?: true }> = {
  appleTree: { seed: 41, palette: fruitPalette(C.canopy, C.canopyLight, C.scarlet) },
  pearTree: {
    seed: 53,
    palette: fruitPalette(C.leaf, C.leafLight, mix(C.gold, C.mossLight, 0.35)),
    pear: true,
  },
  plumTree: { seed: 67, palette: fruitPalette(C.canopyDark, C.canopy, C.lavender) },
  persimmonTree: { seed: 79, palette: fruitPalette(C.moss, C.mossLight, C.pumpkin) },
};

// ---- Their art --------------------------------------------------------------------------------

const ORCHARD_ART = Object.fromEntries(
  Object.entries(FRUIT_TREES).map(([id, tree]) => [
    id,
    {
      source: drawFruitTree(tree.seed, true, tree.pear),
      spent: drawFruitTree(tree.seed, false),
      palette: tree.palette,
      shadow: { w: 40, h: 10 },
    },
  ]),
) as Record<FruitTreeId, PropArt>;

/** Everything that stands at Boo Acres, lit after dark where it has windows. */
export const FARM_PROP_ART: Record<
  Extract<PropId, 'farmhouse' | 'barn' | 'greenhouse' | 'seedCart' | 'farmWell'> | FruitTreeId,
  PropArt
> = {
  farmhouse: {
    ...FARMHOUSE,
    palette: FARMHOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 46, y: 140, radius: 30 },
      { x: 130, y: 140, radius: 30 },
      { x: 108, y: 134, radius: 22 },
    ],
    smoke: [{ x: 133, y: 30 }],
    shadow: { w: 168, h: 16 },
  },
  barn: {
    source: BARN,
    palette: BARN_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 38, y: 112, radius: 26 },
      { x: 162, y: 112, radius: 26 },
    ],
    shadow: { w: 196, h: 16 },
  },
  greenhouse: {
    ...GREENHOUSE,
    palette: GREENHOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [{ x: 84, y: 80, radius: 60 }],
    // Its roof is glass, with no eaves to string the festival's lights from.
    noEaves: true,
    shadow: { w: 164, h: 14 },
  },
  seedCart: { source: SEED_CART, palette: SEED_CART_PALETTE, shadow: { w: 64, h: 10 } },
  farmWell: { source: FARM_WELL, palette: FARM_WELL_PALETTE, shadow: { w: 56, h: 10 } },
  ...ORCHARD_ART,
};
