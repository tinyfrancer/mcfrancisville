import type { FixtureId } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  awning,
  buildingPalette,
  darkOf,
  DOOR,
  type DoorRect,
  type Drawn,
  fillOf,
  finish,
  INK,
  LAMP,
  letters,
  lettersWidth,
  lightOf,
  type Material,
  ROOF,
  shadeOf,
  signBoard,
  STONE,
  TRIM,
  WALL,
  WHITE,
  WINDOWS_LIT,
} from './buildings';
import { ball, FIRE, FIRE_LIGHT, frame, palette, slab, WOOD } from './furnish';
import type { FixtureArt } from './interiors';
import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The Hollow Fairground (0.2's M1), drawn at 32 from the building kit: the stage, the ring of
 * stalls (each one stall drawn with its own sign and wares), the fortune teller's tent, the big
 * wheel, and the poles its string lights hang between. Bulbs are the keys `0` to `3`, never
 * outlined, and lit after dark in `BULBS_LIT`.
 */

/** The string lights' bulbs, by key: gold, scarlet, blue and green, as the festival's are. */
const BULB_KEYS = ['0', '1', '2', '3'] as const;

const BULBS: Palette = { 0: C.gold, 1: C.scarlet, 2: C.orbBlue, 3: C.orbGreen };

const BULBS_LIT: Palette = {
  0: C.candleBright,
  1: C.roseLight,
  2: C.orbBlueLight,
  3: C.orbGreenLight,
};

/** A string of bulbs along a sagging wire from (x0, y) to (x1, y), dipping `sag` in the middle. */
function swag(s: Sketch, x0: number, x1: number, y: number, sag: number, first = 0): void {
  const span = x1 - x0;
  let bulb = first;
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / span;
    const dy = Math.round(sag * 4 * t * (1 - t));
    s.set(x, y + dy, INK);
    if ((x - x0) % 6 === 3) {
      const key = BULB_KEYS[bulb++ % BULB_KEYS.length]!;
      s.rect(x, y + dy + 1, 2, 2, key).set(x, y + dy + 3, key);
    }
  }
}

// ---- The light pole ------------------------------------------------------------------------------

/**
 * A striped pole with a lamp on top and string lights swagged out to either side, half way to the
 * next pole: three tiles apart in a row, so the strings meet and run unbroken along a path.
 */
function drawLightPole(): SpriteSource {
  const s = new Sketch(128, 72);
  const cx = 64;
  for (let y = 10; y < 70; y++) {
    const key = Math.floor(y / 6) % 2 === 0 ? fillOf(ACCENT) : fillOf(WALL);
    s.rect(cx - 1, y, 3, 1, key).set(cx - 1, y, lightOf(WALL));
  }
  slab(s, cx - 4, 66, 9, 6, TRIM);
  // A round lamp atop it, in its little cage.
  s.rect(cx - 3, 4, 7, 7, darkOf(TRIM)).rect(cx - 2, 5, 5, 5, LAMP);
  s.rect(cx - 4, 2, 9, 2, fillOf(TRIM)).rect(cx, 0, 1, 2, fillOf(TRIM));
  swag(s, 0, cx - 2, 13, 10, 1);
  swag(s, cx + 2, 127, 13, 10, 2);
  return finish(s);
}

export const LIGHT_POLE: SpriteSource = drawLightPole();

export const LIGHT_POLE_PALETTE: Palette = {
  ...buildingPalette({
    wall: C.cream,
    roof: C.plum,
    trim: C.iron,
    door: C.berry,
    accent: C.scarlet,
  }),
  ...BULBS,
};

export const LIGHT_POLE_LIT: Palette = { ...WINDOWS_LIT, ...BULBS_LIT };

// ---- The stage -----------------------------------------------------------------------------------

/**
 * The fairground's stage, six tiles wide: a raised platform of boards on a skirt of bunting, a
 * plum backdrop scattered with stars and a moon, maroon curtains drawn back to gold ties, a
 * scalloped canopy along the top, footlights along the front and a string of bulbs over it all.
 */
function drawStage(): SpriteSource {
  const W = 192;
  const H = 128;
  const s = new Sketch(W, H);
  const deck = 88;
  // The posts, and the backdrop between them.
  for (const x of [6, W - 12]) slab(s, x, 18, 6, deck - 18, TRIM);
  s.rect(12, 26, W - 24, deck - 26, darkOf(ROOF));
  for (const [x, y] of [
    [36, 40],
    [60, 56],
    [84, 36],
    [118, 62],
    [140, 42],
    [160, 58],
    [50, 70],
    [104, 48],
  ] as const) {
    s.set(x, y, fillOf(ACCENT_TWO))
      .set(x - 1, y, shadeOf(ACCENT_TWO))
      .set(x + 1, y, shadeOf(ACCENT_TWO))
      .set(x, y - 1, shadeOf(ACCENT_TWO))
      .set(x, y + 1, shadeOf(ACCENT_TWO));
  }
  s.ellipse(96, 44, 9, 9, fillOf(ACCENT_TWO)).ellipse(99, 41, 8, 8, darkOf(ROOF));
  // The curtains, drawn back, folded, tied in gold.
  for (const [x, dir] of [
    [12, 1],
    [W - 12, -1],
  ] as const) {
    for (let y = 26; y < deck; y++) {
      const bulge = y < 56 ? Math.round(24 - (y - 26) * 0.45) : Math.round(10 + (y - 56) * 0.4);
      const from = dir === 1 ? x : x - bulge;
      s.rect(from, y, bulge, 1, fillOf(DOOR));
      for (let f = 4; f < bulge; f += 5) s.set(dir === 1 ? x + f : x - f - 1, y, shadeOf(DOOR));
      s.set(dir === 1 ? from + bulge - 1 : from, y, shadeOf(DOOR));
    }
    s.rect(dir === 1 ? x : x - 13, 55, 13, 3, fillOf(ACCENT_TWO));
  }
  // The canopy: a band of the two accents, scalloped below.
  s.rect(2, 12, W - 4, 12, fillOf(ROOF)).rect(2, 12, W - 4, 1, lightOf(ROOF));
  letters(s, 'THE HOLLOW STAGE', Math.round((W - lettersWidth('THE HOLLOW STAGE')) / 2), 15, WHITE);
  awning(s, 4, 24, W - 8, 4, [ACCENT, ACCENT_TWO], 12);
  swag(s, 4, W - 5, 4, 6);
  // The deck, its boards, and footlights along its lip.
  s.rect(0, deck, W, 6, fillOf(TRIM)).rect(0, deck, W, 1, lightOf(TRIM));
  for (let x = 10; x < W; x += 16) s.rect(x, deck + 1, 1, 5, shadeOf(TRIM));
  for (let x = 14; x < W - 8; x += 22)
    s.rect(x, deck - 3, 4, 3, LAMP).rect(x, deck - 1, 4, 1, darkOf(TRIM));
  // The skirt: bunting in triangles on a dark front.
  s.rect(0, deck + 6, W, H - deck - 10, darkOf(TRIM));
  for (let x = 0; x < W; x += 12) {
    const m: Material = (x / 12) % 2 === 0 ? ACCENT : ACCENT_TWO;
    for (let j = 0; j < 8; j++) s.rect(x + j / 2 + 1, deck + 6 + j, 11 - j, 1, fillOf(m));
  }
  // Steps up at the right side.
  for (let k = 0; k < 3; k++) slab(s, W - 30 + k * 0, deck + 8 + k * 9, 22, 9, STONE);
  return finish(s);
}

export const FAIR_STAGE: SpriteSource = drawStage();

export const FAIR_STAGE_PALETTE: Palette = {
  ...buildingPalette({
    wall: C.cream,
    roof: C.plum,
    trim: C.wood,
    door: C.maroon,
    stone: C.stone,
    accent: C.pumpkin,
    accentTwo: C.gold,
  }),
  ...BULBS,
};

// ---- The stalls ----------------------------------------------------------------------------------

/** What a stall sells, set out on its counter. */
type Wares = (s: Sketch, x: number, y: number, w: number) => void;

/**
 * A stall, three tiles wide: a wooden counter on a skirt of the stall's colour, two posts up to a
 * striped awning, and a sign board over it saying what it is. `wares` sets out what's on show.
 */
function drawStall(sign: string, wares: Wares): SpriteSource {
  const W = 96;
  const H = 104;
  const s = new Sketch(W, H);
  const counter = 68;
  // The back of the booth, in shadow under the awning.
  s.rect(8, 36, W - 16, counter - 36, shadeOf(WALL));
  for (let x = 8; x < W - 8; x += 8) s.rect(x, 36, 1, counter - 36, darkOf(WALL));
  for (const x of [4, W - 10]) slab(s, x, 24, 6, H - 26, TRIM);
  awning(s, 2, 26, W - 4, 10, [ACCENT, ACCENT_TWO], 8);
  // The sign along the top.
  const w = lettersWidth(sign) + 10;
  signBoard(s, Math.round((W - w) / 2), 6, w, 13, WALL);
  letters(s, sign, Math.round((W - lettersWidth(sign)) / 2), 10, fillOf(DOOR));
  s.rect(W / 2 - 1, 18, 2, 8, darkOf(TRIM));
  swag(s, 4, W - 5, 1, 4);
  wares(s, 12, counter, W - 24);
  // The counter, and the skirt below it.
  slab(s, 6, counter, W - 12, 6, TRIM);
  s.rect(8, counter + 6, W - 16, H - counter - 8, fillOf(ACCENT));
  for (let x = 8; x < W - 8; x += 10)
    s.rect(x, counter + 6, 5, H - counter - 8, fillOf(ACCENT_TWO));
  s.rect(8, counter + 6, W - 16, 1, darkOf(TRIM));
  return finish(s);
}

/** Ring toss: bottles in a pyramid with rings on two of them, and prizes hung along the back. */
const ringToss: Wares = (s, x, y, w) => {
  for (let i = 0; i < 6; i++) {
    const px = x + 4 + i * Math.floor((w - 8) / 6);
    s.ellipse(px + 3, 42, 4, 4, fillOf(i % 2 === 0 ? ROOF : DOOR));
    s.set(px + 2, 41, INK)
      .set(px + 4, 41, INK)
      .rect(px + 3, 36, 1, 3, darkOf(TRIM));
  }
  for (const [row, n] of [
    [0, 4],
    [1, 3],
    [2, 2],
  ] as const) {
    for (let i = 0; i < n; i++) {
      const bx = x + 20 + row * 5 + i * 10;
      const by = y - 10 - row * 11;
      s.rect(bx, by, 6, 10, fillOf(STONE)).rect(bx + 2, by - 4, 2, 4, fillOf(STONE));
      s.rect(bx, by, 1, 10, lightOf(STONE));
    }
  }
  s.rect(37, y - 31, 10, 2, fillOf(ACCENT_TWO)).rect(52, y - 20, 10, 2, fillOf(ACCENT));
};

/** Corn dogs standing in a rack, a mustard and a ketchup bottle, and a paper boat of fries. */
const cornDogs: Wares = (s, x, y, w) => {
  slab(s, x + 4, y - 6, 34, 6, TRIM);
  for (let i = 0; i < 5; i++) {
    const cx = x + 8 + i * 7;
    s.rect(cx + 1, y - 10, 1, 4, WHITE);
    s.ellipse(cx + 1.5, y - 17, 3, 7, fillOf(STONE));
    s.set(cx, y - 21, lightOf(STONE)).set(cx + 2, y - 14, shadeOf(STONE));
  }
  s.rect(x + 46, y - 16, 6, 16, fillOf(ACCENT)).rect(x + 48, y - 20, 2, 4, fillOf(ACCENT));
  s.rect(x + 55, y - 16, 6, 16, fillOf(DOOR)).rect(x + 57, y - 20, 2, 4, fillOf(DOOR));
  s.rect(x + w - 14, y - 6, 12, 6, WHITE).rect(x + w - 14, y - 6, 12, 1, fillOf(ACCENT));
  for (let i = 0; i < 5; i++) s.rect(x + w - 13 + i * 2, y - 10 + (i % 2), 1, 4, fillOf(ACCENT));
};

/** A tub of water with little ghost ducks bobbing in it, and a hooked rod leant by it. */
const hookAGhost: Wares = (s, x, y, w) => {
  s.ellipse(x + w / 2, y - 4, w / 2 - 2, 6, fillOf(STONE));
  s.ellipse(x + w / 2, y - 6, w / 2 - 5, 3, fillOf(ROOF));
  for (let i = 0; i < 5; i++) {
    const gx = x + 10 + i * 11;
    s.ellipse(gx, y - 10, 3.5, 4, WHITE).rect(gx - 3, y - 9, 7, 3, WHITE);
    s.set(gx - 1, y - 11, INK)
      .set(gx + 1, y - 11, INK)
      .set(gx + 4, y - 9, fillOf(ACCENT_TWO));
  }
  s.line(x + w - 2, y - 32, x + w - 8, y, darkOf(TRIM));
  s.line(x + w - 2, y - 32, x + w + 2, y - 26, INK);
};

/** Toffee apples on sticks in rows, glossy, and a stack of paper bags. */
const toffeeApples: Wares = (s, x, y, w) => {
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 6; i++) {
      const ax = x + 6 + i * 9 + row * 4;
      const ay = y - 6 - row * 12;
      s.rect(ax, ay - 12, 1, 6, WHITE);
      s.sphere(
        ax,
        ay - 3,
        4,
        4,
        darkOf(ACCENT) + shadeOf(ACCENT) + fillOf(ACCENT) + lightOf(ACCENT),
      );
      s.set(ax - 2, ay - 5, WHITE);
    }
  }
  slab(s, x + w - 10, y - 14, 9, 14, WALL);
};

export const RING_TOSS_STALL = drawStall('RING TOSS', ringToss);
export const CORN_DOG_STALL = drawStall('CORN DOGS', cornDogs);
export const HOOK_A_GHOST_STALL = drawStall('HOOK A GHOST', hookAGhost);
export const TOFFEE_APPLE_STALL = drawStall('TOFFEE APPLES', toffeeApples);

/** A stall's colours: its awning and skirt in two of its own, the rest shared. */
function stallPalette(accent: string, accentTwo: string, stone: string = C.silver): Palette {
  return {
    ...buildingPalette({
      wall: C.cream,
      roof: C.teal,
      trim: C.wood,
      door: C.scarlet,
      stone,
      accent,
      accentTwo,
    }),
    ...BULBS,
  };
}

export const RING_TOSS_PALETTE = stallPalette(C.scarlet, C.cream);
// Its stone is the corn dogs' golden batter.
export const CORN_DOG_PALETTE = stallPalette(C.gold, C.scarlet, C.pumpkinLight);
export const HOOK_A_GHOST_PALETTE = stallPalette(C.orbBlue, C.cream);
export const TOFFEE_APPLE_PALETTE = stallPalette(C.scarlet, C.gold);

export const STALL_LIT: Palette = { ...WINDOWS_LIT, ...BULBS_LIT };

// ---- The fortune tent ----------------------------------------------------------------------------

/**
 * The fortune teller's tent, three tiles wide: a round pavilion in plum and gold stripes under a
 * peaked top with a crescent moon on its pole, scalloped round the eaves, its flap tied back on a
 * dark, lamplit doorway, and an eye painted over it.
 */
function drawTent(): Drawn {
  const W = 96;
  const H = 128;
  const s = new Sketch(W, H);
  const floor = H - 2;
  const cx = 48;
  // The moon on its pole.
  s.rect(cx, 2, 1, 22, darkOf(TRIM));
  s.ellipse(cx, 6, 5, 5, fillOf(ACCENT_TWO)).ellipse(cx + 3, 4, 4, 4, CLEAR);
  // The peaked top: a cone from the pole out to the eaves, in stripes.
  for (let y = 20; y < 58; y++) {
    const half = Math.round(((y - 20) / 38) * 46);
    for (let x = cx - half; x <= cx + half; x++) {
      // Eight panels, narrowing up to the pole.
      const which = Math.floor(((x - cx) / Math.max(half, 1) + 1) * 4) % 2 === 0;
      s.set(x, y, which ? fillOf(ROOF) : fillOf(ACCENT_TWO));
    }
    s.set(cx - half, y, lightOf(ROOF)).set(cx + half, y, darkOf(ROOF));
  }
  // The walls, in wide stripes, darker toward the sides.
  for (let y = 58; y < floor; y++) {
    for (let x = 4; x < W - 4; x++) {
      const band = Math.floor((x - 4) / 11) % 2 === 0;
      const edge = x < 10 || x > W - 11;
      const key = band
        ? edge
          ? shadeOf(ROOF)
          : fillOf(ROOF)
        : edge
          ? shadeOf(ACCENT_TWO)
          : fillOf(ACCENT_TWO);
      s.set(x, y, key);
    }
  }
  // The scalloped eaves.
  for (let x = 2; x < W - 2; x++) {
    const phase = (x - 2) % 12;
    const drop = phase > 1 && phase < 10 ? (phase > 3 && phase < 8 ? 6 : 4) : 1;
    for (let k = 0; k < drop; k++)
      s.set(x, 56 + k, k === drop - 1 ? darkOf(ACCENT) : fillOf(ACCENT));
  }
  // The doorway, the flaps tied back either side, and a lamp hung inside.
  const dw = 30;
  const dh = 54;
  const dx = cx - dw / 2;
  for (let y = floor - dh; y < floor; y++) {
    const inset = Math.max(0, Math.round((floor - dh + 10 - y) * 0.9));
    s.rect(dx + inset, y, dw - inset * 2, 1, darkOf(DOOR));
  }
  for (const [x, dir] of [
    [dx, 1],
    [dx + dw - 1, -1],
  ] as const) {
    for (let y = floor - dh + 4; y < floor; y++) {
      const fold =
        y < floor - 24
          ? Math.round((y - floor + dh) * 0.25)
          : Math.round(6 - (y - floor + 24) * 0.2);
      for (let k = 0; k < Math.max(1, fold); k++) s.set(x + dir * k, y, fillOf(DOOR));
    }
    s.rect(dir === 1 ? x : x - 4, floor - 26, 5, 2, fillOf(ACCENT_TWO));
  }
  s.rect(cx, floor - dh + 8, 1, 6, darkOf(TRIM)).rect(cx - 2, floor - dh + 14, 5, 5, LAMP);
  // The eye over the door.
  s.ellipse(cx, 66, 7, 3.5, WHITE).ellipse(cx, 66, 2.5, 2.5, fillOf(ACCENT)).set(cx, 66, INK);
  // Stars on the walls.
  for (const [x, y] of [
    [14, 80],
    [78, 92],
    [20, 108],
    [74, 70],
  ] as const) {
    s.set(x, y, WHITE)
      .set(x - 1, y, lightOf(ACCENT_TWO))
      .set(x + 1, y, lightOf(ACCENT_TWO));
    s.set(x, y - 1, lightOf(ACCENT_TWO)).set(x, y + 1, lightOf(ACCENT_TWO));
  }
  const door: DoorRect = { x: dx, y: floor - dh, w: dw, h: dh };
  return { source: finish(s), door };
}

export const FORTUNE_TENT: Drawn = drawTent();

export const FORTUNE_TENT_PALETTE: Palette = buildingPalette({
  wall: C.cream,
  roof: C.plum,
  trim: C.bark,
  door: C.maroon,
  accent: C.lavender,
  accentTwo: C.gold,
});

// ---- The big wheel -------------------------------------------------------------------------------

/**
 * The big wheel, five tiles wide: a rim of bulbs on spokes from a hub, on two A-frame legs, with
 * eight little cars hanging from it in the stall's colours, and a ticket booth at its foot.
 */
function drawWheel(): SpriteSource {
  const W = 160;
  const H = 208;
  const s = new Sketch(W, H);
  const cx = 80;
  const cy = 76;
  const r = 66;
  // The legs, behind the wheel.
  for (const dir of [-1, 1]) {
    s.line(cx, cy, cx + dir * 54, H - 8, darkOf(TRIM));
    s.line(cx + dir, cy, cx + dir * 55, H - 8, fillOf(TRIM));
    s.line(cx + dir * 2, cy, cx + dir * 56, H - 8, fillOf(TRIM));
  }
  // The spokes, and the rim, a double ring.
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    s.line(
      cx,
      cy,
      Math.round(cx + Math.cos(a) * r),
      Math.round(cy + Math.sin(a) * r),
      fillOf(STONE),
    );
  }
  for (let t = 0; t < 720; t++) {
    const a = (t / 720) * Math.PI * 2;
    for (const rr of [r, r - 5]) {
      s.set(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr), fillOf(WALL));
    }
  }
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    const bx = Math.round(cx + Math.cos(a) * (r - 2.5));
    const by = Math.round(cy + Math.sin(a) * (r - 2.5));
    s.rect(bx - 1, by - 1, 2, 2, BULB_KEYS[k % BULB_KEYS.length]!);
  }
  // The hub.
  s.ellipse(cx, cy, 7, 7, fillOf(ACCENT_TWO)).ellipse(cx, cy, 3, 3, darkOf(ACCENT_TWO));
  s.set(cx - 3, cy - 4, lightOf(ACCENT_TWO));
  // The cars, hanging below each of eight points of the rim.
  const cars: Material[] = [ACCENT, ACCENT_TWO, DOOR, ROOF];
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    const px = Math.round(cx + Math.cos(a) * r);
    const py = Math.round(cy + Math.sin(a) * r);
    const m = cars[k % cars.length]!;
    s.rect(px, py, 1, 5, darkOf(TRIM));
    s.rect(px - 7, py + 5, 15, 3, fillOf(m)).rect(px - 7, py + 5, 15, 1, lightOf(m));
    s.rect(px - 6, py + 8, 13, 7, fillOf(m)).rect(px - 6, py + 14, 13, 1, shadeOf(m));
    s.rect(px - 4, py + 9, 9, 2, darkOf(m));
  }
  // The ticket booth at the foot.
  slab(s, cx - 18, H - 40, 36, 36, WALL);
  s.rect(cx - 12, H - 32, 24, 12, darkOf(ROOF)).rect(cx - 2, H - 30, 4, 4, LAMP);
  awning(s, cx - 20, H - 46, 40, 6, [ACCENT, WALL], 6);
  letters(s, 'RIDE', cx - Math.round(lettersWidth('RIDE') / 2), H - 16, darkOf(TRIM));
  return finish(s);
}

export const FERRIS_WHEEL: SpriteSource = drawWheel();

export const FERRIS_WHEEL_PALETTE: Palette = {
  ...buildingPalette({
    wall: C.cream,
    roof: C.plum,
    trim: C.iron,
    door: C.teal,
    stone: C.silver,
    accent: C.scarlet,
    accentTwo: C.gold,
  }),
  ...BULBS,
};

// ---- Inside the fortune tent ---------------------------------------------------------------------

/**
 * Her table: round, under a fringed cloth of stars, with a great crystal ball on a brass stand,
 * a candle either side, and a fan of cards laid out.
 */
const FORTUNE_TABLE = (() => {
  const s = new Sketch(64, 64);
  s.ellipse(32, 40, 30, 7, fillOf(ROOF));
  s.rect(2, 40, 60, 16, fillOf(ROOF));
  for (let x = 3; x < 61; x += 3) s.rect(x, 56, 1, 3, fillOf(ACCENT_TWO));
  s.rect(2, 55, 60, 1, fillOf(ACCENT_TWO));
  for (const [x, y] of [
    [10, 46],
    [22, 50],
    [44, 48],
    [54, 44],
  ] as const) {
    s.set(x, y, lightOf(ACCENT_TWO));
  }
  s.bevel(fillOf(ROOF), lightOf(ROOF), shadeOf(ROOF));
  // The stand and the ball.
  s.rect(26, 32, 12, 4, fillOf(ACCENT_TWO)).rect(26, 32, 12, 1, lightOf(ACCENT_TWO));
  s.sphere(32, 20, 12, 12, darkOf(ACCENT) + shadeOf(ACCENT) + fillOf(ACCENT) + lightOf(ACCENT));
  s.rect(26, 13, 3, 2, WHITE).set(27, 16, WHITE);
  // The cards.
  for (let i = 0; i < 3; i++)
    s.rect(12 + i * 5, 36 - (i % 2), 4, 6, WHITE).set(13 + i * 5, 38, fillOf(DOOR));
  for (const x of [6, 54]) {
    s.rect(x, 28, 3, 9, WHITE)
      .set(x + 1, 26, FIRE_LIGHT)
      .set(x + 1, 27, FIRE);
  }
  return finish(s);
})();

/** A hanging of the stars and the moon's faces, on the tent's back wall. */
const STAR_CHARTS = (() => {
  const s = new Sketch(64, 64);
  frame(s, 2, 4, 60, 56, TRIM, 3);
  s.rect(5, 7, 54, 50, fillOf(ROOF));
  for (let k = 0; k < 4; k++) {
    const x = 12 + k * 13;
    const lit = k === 1 ? 6 : k === 2 ? -6 : k === 0 ? 10 : -10;
    s.ellipse(x, 18, 5, 5, fillOf(WALL));
    if (k !== 3) s.ellipse(x + lit * 0.6, 18, 5, 5, fillOf(ROOF));
  }
  for (const [x, y] of [
    [12, 34],
    [22, 42],
    [32, 32],
    [42, 46],
    [52, 36],
  ] as const) {
    ball(s, x, y, 1.5, 1.5, ACCENT_TWO);
  }
  s.line(12, 34, 22, 42, shadeOf(ACCENT_TWO)).line(22, 42, 32, 32, shadeOf(ACCENT_TWO));
  s.line(32, 32, 42, 46, shadeOf(ACCENT_TWO)).line(42, 46, 52, 36, shadeOf(ACCENT_TWO));
  return finish(s);
})();

export const FAIRGROUND_FIXTURE_ART: Pick<
  Record<FixtureId, FixtureArt>,
  'fortuneTable' | 'starCharts'
> = {
  fortuneTable: {
    source: FORTUNE_TABLE,
    palette: palette({ ...WOOD, roof: C.plum, accent: C.lavender, accentTwo: C.gold }),
    glow: { [FIRE_LIGHT]: C.candleBright, [FIRE]: C.candle, [fillOf(ACCENT)]: C.ghost },
    lights: [
      { x: 32, y: 20, radius: 30 },
      { x: 7, y: 26, radius: 14 },
      { x: 55, y: 26, radius: 14 },
    ],
  },
  starCharts: {
    source: STAR_CHARTS,
    palette: palette({ ...WOOD, roof: C.navy, wall: C.cream, accentTwo: C.gold }),
  },
};
