import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';
import {
  ACCENT,
  ACCENT_TWO,
  awning,
  buildingPalette,
  chimney,
  darkOf,
  door,
  type Drawn,
  fillOf,
  finish,
  footing,
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
  ROOF,
  shadeOf,
  signBoard,
  slopedRoof,
  STONE,
  step,
  TRIM,
  wall,
  WALL,
  wallLamp,
  WHITE,
  window,
} from './buildings';

/*
 * The town's shops at 32 pixels a tile (phase G): Cobweb Corner, the Muse Hair Salon (her dream
 * business, decision 18), Crumbs & Curios with Wrapunzel's museum beside it, the Spirit
 * Halloweenie pop-up, and the Moon Pie Man's cart. Each wears what it sells in its windows.
 */

/** A sign's words, centred on `cx`. */
function sign(s: Sketch, text: string, cx: number, y: number, key: string): void {
  letters(s, text, Math.round(cx - lettersWidth(text) / 2), y, key);
}

/**
 * A lacy cobweb tucked into a corner, spun from the corner out: spokes and sagging threads, in a
 * pale key. `dir` is which way it opens: 1 into the right, -1 into the left.
 */
function cobweb(s: Sketch, x: number, y: number, size: number, dir: 1 | -1, key: string): void {
  const spokes = [0, 0.3, 0.6, 0.9].map((t) => (t * Math.PI) / 2);
  for (const a of spokes) {
    for (let r = 0; r < size; r++) {
      s.set(x + dir * Math.round(Math.cos(a) * r), y + Math.round(Math.sin(a) * r), key);
    }
  }
  for (const ring of [size * 0.4, size * 0.7, size * 0.95]) {
    for (let k = 0; k < spokes.length - 1; k++) {
      const [a0, a1] = [spokes[k]!, spokes[k + 1]!];
      for (let t = 0; t <= 1; t += 0.08) {
        const a = a0 + (a1 - a0) * t;
        // Each thread sags a little between its spokes.
        const r = ring - Math.sin(t * Math.PI) * 1.5;
        s.set(x + dir * Math.round(Math.cos(a) * r), y + Math.round(Math.sin(a) * r), key);
      }
    }
  }
}

/**
 * A spiderling at home in its web, drawn gently (`docs/art_style.md`, "Spiders"): a round fuzzy
 * body, two big shiny eyes, and short bent legs, four a side.
 */
function spiderling(s: Sketch, cx: number, cy: number): void {
  for (const side of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const y = cy - 2 + k * 1.5;
      s.set(cx + side * 4, Math.round(y), INK).set(cx + side * 5, Math.round(y) + 1, INK);
    }
  }
  s.ellipse(cx + 0.5, cy + 0.5, 4, 3.5, INK);
  s.set(cx - 1, cy, WHITE).set(cx + 2, cy, WHITE);
}

/** A round clipped topiary in a pot, standing either side of a door. */
function topiary(s: Sketch, cx: number, bottom: number): void {
  s.rect(cx - 5, bottom - 9, 10, 9, fillOf(STONE)).rect(cx - 6, bottom - 10, 12, 2, lightOf(STONE));
  s.rect(cx, bottom - 18, 1, 8, darkOf(TRIM));
  s.sphere(
    cx + 0.5,
    bottom - 22,
    7,
    7,
    `${darkOf(LEAVES)}${shadeOf(LEAVES)}${fillOf(LEAVES)}${lightOf(LEAVES)}`,
  );
}

// ---- Cobweb Corner ---------------------------------------------------------------------------

export const SHOP_W = 176;
export const SHOP_H = 184;

/**
 * Cobweb Corner, the general store: a teal clapboard shop with a curly false front carrying its
 * sign, a striped awning over two display windows (a pumpkin, jars of sweets, a hat, a pair of
 * fancy shoes), and a lacy cobweb in each top corner with a spiderling at home in one.
 */
function drawCobwebCorner(): Drawn {
  const s = new Sketch(SHOP_W, SHOP_H);
  const cx = SHOP_W / 2;
  const floor = SHOP_H - 6;
  // The roof behind the false front, then the front itself: a curved gable over square walls.
  slopedRoof(s, cx, 34, 60, 120, 164, 'shingles');
  const front = (x: number, y: number) => {
    if (y >= 60) return x >= 16 && x < SHOP_W - 16;
    const half = Math.round(34 + 38 * Math.sqrt((y - 22) / 38));
    return x >= cx - half && x < cx + half;
  };
  wall(s, 16, 22, SHOP_W - 32, floor - 22, 'boards', WALL, 1, front);
  // The false front's cap, following its curve.
  for (let x = 16; x < SHOP_W - 16; x++) {
    for (let y = 22; y < 62; y++) {
      if (!front(x, y)) continue;
      s.set(x, y, fillOf(TRIM))
        .set(x, y + 1, fillOf(TRIM))
        .set(x, y - 1, lightOf(TRIM));
      break;
    }
  }
  lightWall(s, 16, 60, SHOP_W - 32, floor - 60, 2);
  signBoard(s, cx - 32, 30, 64, 20);
  sign(s, 'COBWEB', cx, 33, darkOf(WALL));
  sign(s, 'CORNER', cx, 41, darkOf(WALL));
  // Upstairs: two little windows with their curtains drawn back.
  window(s, 34, 66, 22, 22, { panes: [2, 2], sill: true, curtains: true });
  window(s, SHOP_W - 56, 66, 22, 22, { panes: [2, 2], sill: true, curtains: true });
  // The shop floor: an awning over display windows either side of the door.
  window(s, 24, 118, 44, 40, { panes: [2, 1] });
  window(s, SHOP_W - 68, 118, 44, 40, { panes: [2, 1] });
  goods(s);
  const entrance = door(s, cx, floor, 32, 60, { light: true });
  awning(s, 18, 100, SHOP_W - 36, 12);
  footing(s, 14, floor - 6, SHOP_W - 28, 6);
  step(s, cx, SHOP_H, 42, 6);
  // Cobwebs in the top corners of the front, and a spiderling at home in the left one.
  cobweb(s, 17, 61, 16, 1, WHITE);
  cobweb(s, SHOP_W - 18, 61, 16, -1, WHITE);
  spiderling(s, 27, 71);
  return { source: finish(s), door: entrance };
}

/** What's in Cobweb Corner's windows: a pumpkin, jars of sweets, a witch's hat and shoes. */
function goods(s: Sketch): void {
  // Left window: a pumpkin on a crate and two jars.
  s.rect(30, 148, 18, 8, fillOf(TRIM)).rect(30, 148, 18, 1, lightOf(TRIM));
  s.sphere(
    38.5,
    142,
    7,
    6,
    `${darkOf(ACCENT)}${shadeOf(ACCENT)}${fillOf(ACCENT)}${lightOf(ACCENT)}`,
  );
  s.rect(38, 134, 2, 3, fillOf(LEAVES));
  for (const [x, key] of [
    [52, ACCENT_TWO],
    [59, ACCENT],
  ] as const) {
    s.rect(x, 144, 6, 12, fillOf(key))
      .rect(x, 142, 6, 2, lightOf(TRIM))
      .rect(x + 1, 146, 1, 6, lightOf(key));
  }
  // Right window: a witch's hat on a stand and a pair of shoes.
  const hx = SHOP_W - 50;
  s.rect(hx - 10, 146, 20, 3, darkOf(ROOF));
  for (let k = 0; k < 18; k++)
    s.rect(
      hx - Math.max(1, 6 - Math.floor(k / 3)),
      146 - k,
      Math.max(2, 12 - Math.floor(k / 1.5)),
      1,
      darkOf(ROOF),
    );
  s.rect(hx - 6, 143, 12, 2, fillOf(ACCENT));
  s.rect(hx - 1, 149, 2, 7, darkOf(TRIM));
  for (const x of [SHOP_W - 34, SHOP_W - 28])
    s.rect(x, 151, 5, 4, fillOf(ACCENT_TWO)).rect(x + 3, 148, 2, 3, fillOf(ACCENT_TWO));
}

export const COBWEB_CORNER: Drawn = drawCobwebCorner();

export const COBWEB_CORNER_PALETTE: Palette = buildingPalette({
  wall: C.teal,
  roof: C.plum,
  trim: C.cream,
  door: C.wood,
  accent: C.pumpkin,
  accentTwo: C.candle,
  leaves: C.leaf,
});

// ---- The Muse Hair Salon --------------------------------------------------------------------

/**
 * The Muse Hair Salon, her dream business: a pink plaster salon under a slate mansard roof with
 * round dormers, two tall arched windows (a salon chair at a mirror, and a hood dryer), little
 * scalloped awnings, its name over the door, and clipped topiaries either side.
 */
function drawMuse(): Drawn {
  const s = new Sketch(SHOP_W, SHOP_H);
  const cx = SHOP_W / 2;
  const floor = SHOP_H - 6;
  slopedRoof(s, cx, 20, 80, 132, SHOP_W - 4, 'slate');
  // Round dormers set into the mansard, each under a little hood.
  for (const x of [48, cx, SHOP_W - 48]) {
    s.ellipse(x, 42, 11, 9, fillOf(ROOF));
    window(s, x - 7, 38, 14, 16, { shape: 'arch', panes: [2, 1] });
    for (let k = 0; k < 11; k++)
      s.set(x - 10 + k * 2, 34 - Math.round(Math.sin((k / 10) * Math.PI) * 3), lightOf(ROOF));
  }
  wall(s, 16, 83, SHOP_W - 32, floor - 83, 'plaster', WALL, 11);
  lightWall(s, 16, 83, SHOP_W - 32, floor - 83, 4);
  footing(s, 14, floor - 8, SHOP_W - 28, 8);
  // Tall arched windows, each under a scalloped awning of its own.
  window(s, 26, 106, 36, 56, { shape: 'arch', panes: [1, 1] });
  window(s, SHOP_W - 62, 106, 36, 56, { shape: 'arch', panes: [1, 1] });
  salonChair(s, 44, 158);
  hoodDryer(s, SHOP_W - 44, 158);
  awning(s, 24, 96, 40, 8, [ACCENT, ACCENT_TWO], 5);
  awning(s, SHOP_W - 64, 96, 40, 8, [ACCENT, ACCENT_TWO], 5);
  // Her name over the door, on a board with a pair of scissors.
  signBoard(s, cx - 24, 88, 48, 12);
  sign(s, 'THE MUSE', cx, 92, fillOf(ACCENT));
  const front = door(s, cx, floor, 32, 62, { shape: 'arch', light: true, knob: 'left' });
  topiary(s, cx - 28, floor);
  topiary(s, cx + 28, floor);
  wallLamp(s, cx - 24, 118);
  wallLamp(s, cx + 20, 118);
  step(s, cx, SHOP_H, 40, 6);
  return { source: finish(s), door: front };
}

/** A salon chair at a mirror, seen through the window. */
function salonChair(s: Sketch, cx: number, bottom: number): void {
  s.ellipse(cx + 0.5, bottom - 40, 7, 9, fillOf(TRIM)).ellipse(cx + 0.5, bottom - 40, 5, 7, GLINT);
  s.rect(cx - 6, bottom - 24, 13, 12, fillOf(ACCENT)).rect(
    cx - 6,
    bottom - 24,
    13,
    2,
    lightOf(ACCENT),
  );
  s.rect(cx - 8, bottom - 16, 17, 4, shadeOf(ACCENT));
  s.rect(cx, bottom - 12, 1, 8, darkOf(TRIM)).rect(cx - 5, bottom - 4, 11, 2, darkOf(TRIM));
}

/** A hood dryer on its stand, seen through the window. */
function hoodDryer(s: Sketch, cx: number, bottom: number): void {
  s.ellipse(cx + 0.5, bottom - 36, 9, 7, fillOf(TRIM)).rect(
    cx - 9,
    bottom - 36,
    19,
    4,
    shadeOf(TRIM),
  );
  s.rect(cx, bottom - 30, 1, 26, darkOf(TRIM)).rect(cx - 5, bottom - 4, 11, 2, darkOf(TRIM));
  s.rect(cx - 7, bottom - 16, 14, 4, fillOf(ACCENT)).rect(
    cx - 7,
    bottom - 16,
    14,
    1,
    lightOf(ACCENT),
  );
}

export const MUSE: Drawn = drawMuse();

export const MUSE_PALETTE: Palette = buildingPalette({
  wall: C.roseLight,
  roof: C.berry,
  trim: C.ghost,
  door: C.plumLight,
  accent: C.rose,
  accentTwo: C.ghost,
  leaves: C.leafDark,
});

// ---- Crumbs & Curios ------------------------------------------------------------------------

export const BAKERY_W = 208;
export const BAKERY_H = 188;

/**
 * Crumbs & Curios, Wrapunzel's bakery with her museum beside it: a warm brick bakery with a
 * bandage-striped awning, loaves and a cake in the window and a chimney, and a little stone
 * museum wing with columns under a pediment, a butterfly frame in its window. One long sign runs
 * over both.
 */
function drawCrumbsAndCurios(): Drawn {
  const s = new Sketch(BAKERY_W, BAKERY_H);
  const floor = BAKERY_H - 6;
  const bake = 136;
  // The bakery: a roof with a chimney, and brick walls.
  chimney(s, 30, 14, 14, 56);
  slopedRoof(s, bake / 2 + 2, 30, 86, 88, bake + 8, 'tiles');
  wall(s, 12, 88, bake - 12, floor - 88, 'brick', WALL, 5);
  lightWall(s, 12, 88, bake - 12, floor - 88, 4);
  footing(s, 10, floor - 6, bake - 8, 6);
  // The museum wing: a pediment on an entablature, over columns, all in stone.
  for (let y = 44; y < 70; y++) {
    const half = Math.round(((y - 44) / 26) * 38);
    s.rect(bake + 32 - half, y, half * 2, 1, fillOf(STONE));
  }
  for (let y = 50; y < 70; y++) {
    const half = Math.round(((y - 50) / 20) * 26);
    if (half > 1) s.rect(bake + 32 - half + 1, y, half * 2 - 2, 1, shadeOf(STONE));
  }
  s.rect(bake - 8, 70, 80, 8, fillOf(STONE)).rect(bake - 8, 70, 80, 1, lightOf(STONE));
  s.rect(bake - 8, 77, 80, 1, darkOf(STONE));
  wall(s, bake, 78, 64, floor - 78, 'stone', STONE, 9);
  for (const x of [bake + 2, bake + 52]) {
    s.rect(x, 80, 10, floor - 86, fillOf(STONE));
    s.rect(x, 80, 2, floor - 86, lightOf(STONE)).rect(x + 8, 80, 2, floor - 86, shadeOf(STONE));
    for (let y = 84; y < floor - 8; y += 5) s.set(x + 5, y, shadeOf(STONE));
    s.rect(x - 2, 78, 14, 3, lightOf(STONE)).rect(x - 2, floor - 8, 14, 3, fillOf(STONE));
  }
  window(s, bake + 18, 100, 28, 50, { shape: 'arch', panes: [1, 1], sill: true });
  butterflyFrame(s, bake + 32, 128);
  footing(s, bake - 2, floor - 6, 70, 6);
  // One long sign over both, and the bakery's front.
  signBoard(s, 38, 90, 132, 13);
  sign(s, 'CRUMBS & CURIOS', 104, 94, WHITE);
  awning(s, 16, 108, 112, 10, [ACCENT, ACCENT_TWO], 6);
  window(s, 22, 124, 46, 36, { panes: [2, 1] });
  loaves(s, 45, 158);
  const front = door(s, 88, floor, 32, 60, { light: true });
  menuBoard(s, 108, floor - 2);
  step(s, 88, BAKERY_H, 40, 6);
  return { source: finish(s), door: front };
}

/** Loaves and a layer cake in the bakery window. */
function loaves(s: Sketch, cx: number, bottom: number): void {
  s.rect(cx - 20, bottom - 5, 40, 3, fillOf(TRIM)).rect(cx - 20, bottom - 5, 40, 1, lightOf(TRIM));
  for (const x of [cx - 15, cx - 6]) {
    s.ellipse(x + 0.5, bottom - 8, 5, 3.5, lightOf(TRIM));
    s.set(x - 2, bottom - 10, fillOf(TRIM)).set(x + 1, bottom - 10, fillOf(TRIM));
    s.set(x - 1, bottom - 11, WHITE);
  }
  // The cake: two tiers, icing dripping, a candle.
  s.rect(cx + 4, bottom - 14, 14, 9, fillOf(ACCENT)).rect(
    cx + 6,
    bottom - 20,
    10,
    6,
    fillOf(ACCENT),
  );
  s.rect(cx + 4, bottom - 14, 14, 2, WHITE).rect(cx + 6, bottom - 20, 10, 2, WHITE);
  s.set(cx + 7, bottom - 12, WHITE)
    .set(cx + 12, bottom - 12, WHITE)
    .set(cx + 9, bottom - 18, WHITE);
  s.rect(cx + 10, bottom - 24, 2, 4, lightOf(ACCENT)).set(cx + 10, bottom - 25, LAMP);
}

/** A little chalk board by the bakery door. */
function menuBoard(s: Sketch, x: number, bottom: number): void {
  s.line(x, bottom, x + 5, bottom - 26, darkOf(TRIM)).line(
    x + 18,
    bottom,
    x + 13,
    bottom - 26,
    darkOf(TRIM),
  );
  s.rect(x + 2, bottom - 26, 16, 18, darkOf(TRIM)).rect(x + 3, bottom - 25, 14, 16, INK);
  for (const y of [bottom - 22, bottom - 18, bottom - 14])
    s.rect(x + 5, y, 6 + (y % 3) * 2, 1, WHITE);
}

/** A butterfly pinned in a frame, in the museum's window. */
function butterflyFrame(s: Sketch, cx: number, cy: number): void {
  s.rect(cx - 9, cy - 8, 18, 16, fillOf(TRIM)).rect(cx - 7, cy - 6, 14, 12, WHITE);
  for (const side of [-1, 1]) {
    s.ellipse(cx + side * 3 + 0.5, cy - 1.5, 3, 3, fillOf(ACCENT));
    s.ellipse(cx + side * 3 + 0.5, cy + 2.5, 2, 2, darkOf(ACCENT));
  }
  s.rect(cx, cy - 4, 1, 8, INK);
}

export const CRUMBS_AND_CURIOS: Drawn = drawCrumbsAndCurios();

export const CRUMBS_AND_CURIOS_PALETTE: Palette = buildingPalette({
  wall: C.bandageShade,
  roof: C.lavenderShade,
  trim: C.wood,
  door: C.plumLight,
  stone: C.stoneLight,
  accent: C.lavender,
  accentTwo: C.bandage,
  leaves: C.leaf,
});

// ---- The Spirit Halloweenie pop-up -----------------------------------------------------------

export const POP_UP_W = 112;
export const POP_UP_H = 116;

/**
 * Spirit Halloweenie, the parody pop-up: a boxy black store that turned up overnight under a big
 * orange banner with a ghost on it, "NOW OPEN!" taped in one window and a mask in the other, and
 * glass doors that glow a spooky purple after dark.
 */
function drawPopUp(): Drawn {
  const s = new Sketch(POP_UP_W, POP_UP_H);
  const cx = POP_UP_W / 2;
  const floor = POP_UP_H - 4;
  wall(s, 8, 30, POP_UP_W - 16, floor - 30, 'boards');
  lightWall(s, 8, 30, POP_UP_W - 16, floor - 30, 3);
  s.rect(6, 26, POP_UP_W - 12, 4, fillOf(TRIM)).rect(6, 26, POP_UP_W - 12, 1, lightOf(TRIM));
  // The banner, draped a little between its ties, with a ghost and the shop's name.
  for (let x = 2; x < POP_UP_W - 2; x++) {
    const sag = Math.round(Math.sin(((x - 2) / (POP_UP_W - 4)) * Math.PI) * 3);
    s.rect(x, 6 + sag, 1, 20, fillOf(ACCENT));
    s.set(x, 6 + sag, lightOf(ACCENT)).set(x, 25 + sag, shadeOf(ACCENT));
  }
  for (const x of [3, POP_UP_W - 4]) s.rect(x, 4, 1, 4, darkOf(TRIM));
  s.ellipse(18.5, 15, 6, 6, WHITE).rect(13, 15, 12, 7, WHITE);
  for (const x of [13, 17, 21]) s.set(x + 1, 22, fillOf(ACCENT));
  s.set(16, 14, INK).set(20, 14, INK);
  letters(s, 'SPIRIT', 32, 9, INK);
  letters(s, 'HALLOWEENIE', 32, 17, darkOf(ACCENT));
  // Windows either side of the doors: "NOW OPEN!" in one, a mask in the other.
  window(s, 14, 50, 26, 34, { panes: [1, 1], sill: true });
  window(s, POP_UP_W - 40, 50, 26, 34, { panes: [1, 1], sill: true });
  signBoard(s, 14, 57, 26, 15, ACCENT);
  letters(s, 'NOW', 21, 59, INK);
  letters(s, 'OPEN!', 17, 65, INK);
  mask(s, POP_UP_W - 27, 67);
  const front = door(s, cx, floor, 30, 56, { light: true });
  s.rect(cx, floor - 56 + 3, 1, 53, darkOf(TRIM));
  step(s, cx, POP_UP_H, 36, 4);
  return { source: finish(s), door: front };
}

/** A friendly monster mask on a stand, in the pop-up's window. */
function mask(s: Sketch, cx: number, cy: number): void {
  s.ellipse(cx + 0.5, cy, 7, 8, fillOf(LEAVES)).ellipse(cx - 2.5, cy - 2, 2, 2, WHITE);
  s.ellipse(cx + 3.5, cy - 2, 2, 2, WHITE)
    .set(cx - 3, cy - 2, INK)
    .set(cx + 3, cy - 2, INK);
  s.rect(cx - 3, cy + 3, 7, 1, INK)
    .set(cx - 2, cy + 4, WHITE)
    .set(cx + 2, cy + 4, WHITE);
  s.rect(cx, cy + 8, 1, 7, darkOf(TRIM));
}

export const POP_UP: Drawn = drawPopUp();

export const POP_UP_PALETTE: Palette = buildingPalette({
  wall: C.inkFabric,
  roof: C.plum,
  trim: C.pumpkinShade,
  door: C.plum,
  accent: C.pumpkin,
  accentTwo: C.lavender,
  leaves: C.guac,
  glass: C.dusk,
});

/** After dark its glass glows a spooky purple, and its sign lamp is lit. */
export const POP_UP_LIT: Palette = {
  [GLASS]: C.lavender,
  [GLASS_DARK]: C.lavenderShade,
  [GLINT]: C.ghost,
  [LAMP]: C.candleBright,
};

// ---- The Moon Pie Man's cart -----------------------------------------------------------------

export const CART_W = 72;
export const CART_H = 84;

/**
 * The Chocolate Banana Watermelon Moon Pie Man's cart: a striped canopy on two poles with a
 * lantern swinging from it, a counter stacked with moon pies (he stands behind it), a sign, and
 * two big wheels.
 */
function drawCart(): SpriteSource {
  const s = new Sketch(CART_W, CART_H);
  // Poles, then the canopy over them.
  for (const x of [8, CART_W - 10]) s.rect(x, 14, 2, 40, darkOf(TRIM));
  awning(s, 5, 6, CART_W - 10, 9, [ACCENT, ACCENT_TWO], 6);
  s.rect(3, 4, CART_W - 6, 2, fillOf(ACCENT));
  // A lantern hung from the canopy.
  s.rect(CART_W - 18, 18, 1, 4, darkOf(TRIM));
  s.rect(CART_W - 20, 22, 5, 7, darkOf(TRIM)).rect(CART_W - 19, 23, 3, 5, LAMP);
  // The cart's body, the counter on top, and stacks of moon pies at either end.
  s.rect(4, 50, CART_W - 8, 20, fillOf(WALL));
  for (let x = 4; x < CART_W - 4; x += 8) s.rect(x, 50, 4, 20, fillOf(ACCENT_TWO));
  s.rect(2, 46, CART_W - 4, 4, fillOf(TRIM)).rect(2, 46, CART_W - 4, 1, lightOf(TRIM));
  signBoard(s, 14, 54, 44, 11);
  letters(s, 'MOON PIES', 17, 57, fillOf(ACCENT));
  for (const x of [8, CART_W - 16]) {
    for (let k = 0; k < 3; k++) {
      s.ellipse(x + 4, 44 - k * 3, 5, 2, k % 2 ? shadeOf(WALL) : darkOf(WALL));
      s.rect(x, 43 - k * 3, 8, 1, lightOf(ACCENT_TWO));
    }
  }
  // Two wheels, spoked.
  for (const x of [16, CART_W - 16]) {
    s.ellipse(x, 72, 10, 10, darkOf(TRIM)).ellipse(x, 72, 8, 8, 'C');
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [0.7, 0.7],
      [0.7, -0.7],
    ] as const) {
      s.line(
        Math.round(x - dx * 7),
        Math.round(72 - dy * 7),
        Math.round(x + dx * 7) - 1,
        Math.round(72 + dy * 7) - 1,
        darkOf(TRIM),
      );
    }
    s.replace('C', CLEAR);
    s.rect(x - 2, 70, 3, 3, fillOf(TRIM));
  }
  return finish(s);
}

export const CART: SpriteSource = drawCart();

export const CART_PALETTE: Palette = buildingPalette({
  wall: C.bark,
  roof: C.plum,
  trim: C.iron,
  door: C.wood,
  accent: C.roseLight,
  accentTwo: C.cream,
});
