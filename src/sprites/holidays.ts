import type { DecorId } from '../data/holidays';
import type { FurnitureId, PropId } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  DOOR,
  fillOf,
  finish,
  INK,
  LAMP,
  LEAVES,
  lightOf,
  ROOF,
  shadeOf,
  STONE,
  TRIM,
  WALL,
  WHITE,
  type Colours,
  type Material,
} from './buildings';
import type { FurnitureArt } from './furniture';
import { ball, bat, candle, column, FIRE, FIRE_LIGHT, FIRE_LIT, palette, slab } from './furnish';
import { SKELLY, SKELLY_PALETTE } from './houses';
import { PALETTE as C, ramp } from './palette';
import type { PropArt } from './props';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The holidays in town (phase U), drawn at 32 from the building kit's materials: what stands in the
 * square while a holiday's decorations are up, what hangs on every front door, what Skelly wears,
 * the colours of the garlands strung between the square's lamps, Easter's hidden eggs, and the
 * little tree the town sends her for Christmas.
 */

/** Fairy lights: four colours of bulb, each lit up after dark. Never outlined. */
const BULBS = ['1', '2', '3', '4'] as const;

const BULB_COLOURS: Palette = {
  '1': C.scarlet,
  '2': C.gold,
  '3': C.orbBlue,
  '4': C.orbGreen,
};

const BULBS_LIT: Palette = {
  '1': C.roseLight,
  '2': C.candleBright,
  '3': C.orbBlueLight,
  '4': C.orbGreenLight,
};

/** Every holiday piece's palette: the kit's, with fire and fairy lights in it. */
function holidayPalette(colours: Colours): Palette {
  return { ...palette(colours), ...BULB_COLOURS };
}

/** A jack-o'-lantern's carved face by day: dark, as the town's pumpkins' are, lit after dark. */
const CARVED: Palette = { [FIRE]: C.pumpkinDark, [FIRE_LIGHT]: ramp(C.pumpkinDark)[1]! };

/** A little heart, `size` across (odd sizes look best), centred on `cx`, its top at `y`. */
function heart(s: Sketch, cx: number, y: number, size: number, key: string): void {
  const r = size / 4;
  s.ellipse(cx - r, y + r, r + 0.3, r + 0.3, key).ellipse(cx + r, y + r, r + 0.3, r + 0.3, key);
  column(
    s,
    cx,
    y + Math.round(r),
    Math.ceil(size * 0.7),
    (j) => size - (j * size) / (size * 0.7),
    key,
  );
}

// ---- What stands in the square -----------------------------------------------------------------

/**
 * The town's Christmas tree: a tall, dark fir in four tiers, strung with fairy lights, hung with
 * baubles, and a little grinning skull on top (it's an angel, Cody says), in a wooden tub.
 */
const SPOOKY_TREE = (() => {
  const s = new Sketch(56, 104);
  const cx = 28;
  slab(s, cx - 10, 90, 20, 12, TRIM);
  s.rect(cx - 10, 94, 20, 1, darkOf(TRIM));
  s.rect(cx - 3, 82, 6, 9, fillOf(DOOR));
  const tiers = [
    [16, 22, 20],
    [30, 22, 32],
    [46, 22, 42],
    [62, 24, 52],
  ] as const;
  for (const [top, h, w] of tiers) {
    column(s, cx, top, h, (j) => 6 + ((w - 6) * j) / h, fillOf(LEAVES));
    // A scalloped hem, each tier's boughs drooping a little.
    for (let x = cx - w / 2 + 2; x < cx + w / 2 - 2; x += 5) {
      s.ellipse(x + 2.5, top + h, 3, 2, fillOf(LEAVES));
    }
  }
  s.bevel(fillOf(LEAVES), lightOf(LEAVES), shadeOf(LEAVES));
  // Needles: little flicks of shade across each tier.
  for (let y = 22; y < 84; y += 4) {
    for (let x = cx - 24 + (y % 8); x < cx + 24; x += 7) {
      if (s.get(x, y) === fillOf(LEAVES)) s.set(x, y, shadeOf(LEAVES));
    }
  }
  // A string of lights looping down round it, and baubles between.
  let n = 0;
  for (const [top, h, w] of tiers) {
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const x = Math.round(cx - w / 2 + 3 + t * (w - 6));
      const y = Math.round(top + h - 4 - Math.sin(t * Math.PI) * 4);
      if (s.get(x, y) !== CLEAR) s.set(x, y, BULBS[n++ % 4]!);
    }
  }
  for (const [x, y, m] of [
    [cx - 6, 32, ACCENT],
    [cx + 7, 44, ROOF],
    [cx - 12, 56, ACCENT_TWO],
    [cx + 12, 60, ACCENT],
    [cx - 3, 72, ROOF],
    [cx + 16, 80, ACCENT_TWO],
    [cx - 18, 82, ROOF],
  ] as const) {
    ball(s, x, y, 2.5, 2.5, m);
  }
  // The skull on top, and a gold star behind it.
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    s.line(cx, 8, Math.round(cx + Math.cos(a) * 8), Math.round(8 + Math.sin(a) * 8), LAMP);
  }
  s.ellipse(cx, 9, 5, 5, WHITE).rect(cx - 3, 12, 6, 3, WHITE);
  s.set(cx - 2, 9, INK)
    .set(cx + 1, 9, INK)
    .set(cx, 12, INK);
  return finish(s);
})();

/** An arch of roses and hearts, two white posts wound with leaves, a big heart at the top. */
const HEART_ARCH = (() => {
  const s = new Sketch(64, 84);
  for (const x of [6, 52]) {
    slab(s, x, 40, 6, 42, WALL);
    for (let y = 44; y < 80; y += 6) s.ellipse(x + 3, y, 4, 2, fillOf(LEAVES));
  }
  // The arch itself: a band of leaves with roses and little hearts all along it.
  for (let a = Math.PI; a <= Math.PI * 2 + 0.001; a += 0.02) {
    const x = 32 + Math.cos(a) * 23;
    const y = 42 + Math.sin(a) * 26;
    s.ellipse(x, y, 4, 4, fillOf(LEAVES));
  }
  s.bevel(fillOf(LEAVES), lightOf(LEAVES), shadeOf(LEAVES));
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    const x = Math.round(32 + Math.cos(a) * 23);
    const y = Math.round(42 + Math.sin(a) * 26);
    if (i % 2 === 0) ball(s, x, y, 2.5, 2.5, ACCENT);
    else heart(s, x, y - 2, 5, fillOf(ACCENT_TWO));
  }
  heart(s, 32, 4, 15, fillOf(ACCENT));
  s.bevel(fillOf(ACCENT), lightOf(ACCENT), shadeOf(ACCENT));
  s.set(28, 7, WHITE).set(27, 8, WHITE);
  return finish(s);
})();

/** A pot of gold at the end of a little rainbow, coins spilling over its rim. */
const POT_OF_GOLD = (() => {
  const s = new Sketch(56, 64);
  // The rainbow, arching in from the left into the pot.
  const bands = [ACCENT, ACCENT_TWO, LEAVES, ROOF, DOOR];
  bands.forEach((m, i) => {
    for (let a = Math.PI; a <= Math.PI * 1.55; a += 0.01) {
      const r = 26 - i * 2;
      s.rect(Math.round(30 + Math.cos(a) * r), Math.round(44 + Math.sin(a) * r), 2, 2, fillOf(m));
    }
  });
  // A puff of cloud where the rainbow begins.
  for (const [x, y, r] of [
    [4, 42, 4],
    [9, 40, 5],
    [13, 44, 4],
  ] as const) {
    s.ellipse(x, y, r, r - 1, WHITE);
  }
  // The pot: round iron, a thick rim, and three stubby feet.
  s.ellipse(38, 50, 13, 11, fillOf(STONE));
  s.bevel(fillOf(STONE), lightOf(STONE), shadeOf(STONE));
  slab(s, 24, 36, 28, 5, STONE);
  for (const x of [28, 37, 46]) s.rect(x, 60, 3, 3, shadeOf(STONE));
  // The gold heaped over the rim.
  s.ellipse(38, 35, 12, 5, fillOf(ACCENT_TWO));
  for (const [x, y] of [
    [30, 33],
    [35, 31],
    [41, 32],
    [46, 34],
    [38, 29],
  ] as const) {
    s.ellipse(x, y, 3, 2, lightOf(ACCENT_TWO)).set(x, y, shadeOf(ACCENT_TWO));
  }
  s.set(36, 28, WHITE).set(45, 32, WHITE);
  return finish(s);
})();

/** A little bare tree in a tub, its branches hung with painted eggs. */
const EGG_TREE = (() => {
  const s = new Sketch(48, 80);
  slab(s, 14, 66, 20, 12, WALL);
  s.rect(14, 69, 20, 1, darkOf(WALL));
  s.rect(22, 34, 4, 33, fillOf(TRIM)).rect(22, 34, 1, 33, lightOf(TRIM));
  const branches = [
    [23, 50, 8, 34],
    [24, 46, 40, 28],
    [23, 40, 12, 18],
    [24, 36, 34, 14],
    [24, 36, 24, 6],
  ] as const;
  for (const [x0, y0, x1, y1] of branches) {
    s.line(x0, y0, x1, y1, fillOf(TRIM)).line(x0 + 1, y0, x1 + 1, y1, fillOf(TRIM));
  }
  // Blossom here and there, and the eggs hanging on threads.
  for (const [x, y] of [
    [10, 33],
    [38, 27],
    [14, 18],
    [33, 14],
    [25, 6],
  ] as const) {
    s.ellipse(x, y, 2.5, 2, lightOf(ACCENT)).set(x, y, fillOf(ACCENT_TWO));
  }
  const eggs = [
    [8, 38, ACCENT],
    [18, 30, ROOF],
    [38, 33, LEAVES],
    [30, 22, ACCENT_TWO],
    [13, 24, DOOR],
    [36, 18, ACCENT],
  ] as const;
  for (const [x, y, m] of eggs) {
    s.rect(x, y - 4, 1, 3, darkOf(TRIM));
    ball(s, x + 0.5, y + 2, 3, 4, m);
    s.rect(x - 2, y + 2, 5, 1, WHITE);
  }
  return finish(s);
})();

/** A tall white flagpole with a gold ball on top, and a flag in a stiff breeze. */
const FLAG_POLE = (() => {
  const s = new Sketch(48, 104);
  slab(s, 8, 96, 16, 7, STONE);
  s.rect(14, 8, 3, 89, fillOf(WALL)).rect(14, 8, 1, 89, lightOf(WALL));
  ball(s, 15.5, 6, 3, 3, ACCENT_TWO);
  // The flag, rippling: stripes of red and white, and a blue corner with white dots.
  const wave = (i: number) => Math.round(Math.sin(i / 5) * 2);
  for (let i = 0; i < 28; i++) {
    const x = 17 + i;
    const top = 11 + wave(i);
    for (let j = 0; j < 18; j++) {
      const stripe = Math.floor(j / 2.6) % 2 === 0 ? fillOf(ACCENT) : WHITE;
      s.set(x, top + j, stripe);
    }
    if (i < 12) {
      for (let j = 0; j < 10; j++) s.set(x, top + j, fillOf(ROOF));
      if (i % 3 === 1) for (let j = 1; j < 10; j += 3) s.set(x, top + j, WHITE);
    }
  }
  return finish(s);
})();

/** Three jack-o'-lanterns stacked up, grinning, a little witch's hat on the top one. */
const PUMPKIN_TOWER = (() => {
  const s = new Sketch(48, 84);
  const pumpkins = [
    [24, 70, 20, 12],
    [24, 50, 16, 10],
    [24, 34, 12, 8],
  ] as const;
  for (const [cx, cy, rx, ry] of pumpkins) {
    ball(s, cx, cy, rx, ry, ACCENT);
    // Ribs.
    for (const dx of [-rx / 2, 0, rx / 2]) {
      for (let j = -ry + 3; j < ry - 2; j++) {
        if (s.get(Math.round(cx + dx), cy + j) !== CLEAR)
          s.set(Math.round(cx + dx), cy + j, shadeOf(ACCENT));
      }
    }
    // A carved grin, candlelit.
    const e = Math.max(2, Math.round(rx / 5));
    s.rect(cx - rx / 2 - 1, cy - 3, e, e, FIRE).rect(cx + rx / 2 - e + 1, cy - 3, e, e, FIRE);
    s.rect(cx - rx / 2, cy + 2, rx, 2, FIRE).rect(cx - rx / 2 + 2, cy + 4, rx - 4, 1, FIRE);
    s.set(cx - 1, cy + 3, FIRE_LIGHT).set(cx + 1, cy + 3, FIRE_LIGHT);
  }
  s.rect(22, 22, 4, 5, fillOf(LEAVES));
  // The hat: a wide brim and a crooked point.
  s.rect(12, 24, 24, 3, fillOf(DOOR)).rect(12, 24, 24, 1, lightOf(DOOR));
  column(s, 25, 6, 18, (j) => 3 + j * 0.6, fillOf(DOOR));
  s.rect(19, 21, 12, 2, fillOf(ACCENT_TWO));
  s.set(28, 4, fillOf(DOOR)).set(29, 3, fillOf(DOOR)).set(30, 3, fillOf(DOOR));
  return finish(s);
})();

/**
 * The long table for Thanksgiving dinner: a white cloth, pies, a golden roast, candles, corn and
 * little gourds all the way along.
 */
const HARVEST_TABLE = (() => {
  const s = new Sketch(96, 56);
  // Legs, the top seen a little from above, and the cloth hanging over the front.
  for (const x of [6, 86]) s.rect(x, 36, 4, 18, fillOf(TRIM));
  slab(s, 2, 26, 92, 10, TRIM);
  s.rect(4, 27, 88, 8, fillOf(WALL)).rect(4, 27, 88, 1, lightOf(WALL));
  s.rect(4, 35, 88, 6, fillOf(WALL));
  for (let x = 6; x < 92; x += 6) s.rect(x, 35, 1, 6, shadeOf(WALL));
  s.rect(4, 40, 88, 1, shadeOf(WALL));
  // The roast in the middle, pies either side, candles and the harvest in between.
  s.ellipse(48, 24, 11, 7, fillOf(ACCENT_TWO));
  s.bevel(fillOf(ACCENT_TWO), lightOf(ACCENT_TWO), shadeOf(ACCENT_TWO));
  s.rect(37, 28, 22, 2, fillOf(STONE));
  for (const cx of [22, 74]) {
    s.ellipse(cx, 27, 8, 3, fillOf(ACCENT));
    s.ellipse(cx, 26, 7, 2, lightOf(ACCENT));
    for (let x = cx - 6; x < cx + 6; x += 3) s.set(x, 26, shadeOf(ACCENT));
  }
  for (const x of [34, 62]) candle(s, x, 10, 16);
  for (const [x, m] of [
    [10, ACCENT],
    [30, LEAVES],
    [66, ACCENT],
    [86, LEAVES],
  ] as const) {
    ball(s, x, 27, 3, 2.5, m);
  }
  // Corn cobs, leaning.
  for (const x of [13, 83]) {
    s.ellipse(x, 22, 2, 5, fillOf(ACCENT_TWO));
    s.line(x - 3, 27, x - 1, 20, fillOf(LEAVES)).line(x + 3, 27, x + 1, 20, fillOf(LEAVES));
  }
  return finish(s);
})();

/** A glitter ball high on a pole, gold streamers fluttering from under it. */
const GLITTER_BALL = (() => {
  const s = new Sketch(40, 104);
  slab(s, 12, 96, 16, 7, STONE);
  s.rect(19, 28, 3, 69, fillOf(TRIM)).rect(19, 28, 1, 69, lightOf(TRIM));
  s.ellipse(20.5, 16, 12, 12, fillOf(STONE));
  // Facets: a grid of little mirrors, the lit ones catching the light.
  for (let y = 5; y < 28; y += 3) {
    for (let x = 9; x < 33; x += 3) {
      if (s.get(x, y) !== fillOf(STONE)) continue;
      const lit = x + y < 30;
      s.set(x, y, lit ? LAMP : shadeOf(STONE));
      if (lit && (x + y) % 2 === 0) s.set(x + 1, y, WHITE);
    }
  }
  s.rect(18, 1, 5, 4, fillOf(TRIM));
  // Streamers hanging from under the ball.
  [ACCENT_TWO, ACCENT, ROOF, ACCENT_TWO].forEach((m, i) => {
    const x = 12 + i * 5;
    for (let j = 0; j < 22; j++)
      s.set(x + Math.round(Math.sin(j / 3 + i) * 1.5), 28 + j, fillOf(m));
  });
  return finish(s);
})();

const WOODEN = { wall: C.cream, roof: C.plum, trim: C.bark, door: C.berry } as const;

/** What stands in the square while each holiday's decorations are up. */
export const HOLIDAY_PROP_ART: Record<
  Extract<
    PropId,
    | 'spookyTree'
    | 'heartArch'
    | 'potOfGold'
    | 'eggTree'
    | 'flagPole'
    | 'pumpkinTower'
    | 'harvestTable'
    | 'glitterBall'
  >,
  PropArt
> = {
  spookyTree: {
    source: SPOOKY_TREE,
    palette: holidayPalette({
      ...WOODEN,
      leaves: C.hedge,
      trim: C.wood,
      door: C.bark,
      accent: C.scarlet,
      accentTwo: C.gold,
      roof: C.lavender,
    }),
    glow: { ...BULBS_LIT, [LAMP]: C.candleBright },
    lights: [{ x: 28, y: 56, radius: 44 }],
    shadow: { w: 40, h: 10 },
  },
  heartArch: {
    source: HEART_ARCH,
    palette: holidayPalette({ ...WOODEN, wall: C.white, accent: C.roseLight, accentTwo: C.snap }),
    shadow: { w: 56, h: 8 },
  },
  potOfGold: {
    source: POT_OF_GOLD,
    palette: holidayPalette({
      ...WOODEN,
      stone: C.iron,
      accent: C.scarlet,
      accentTwo: C.gold,
      leaves: C.leafLight,
      roof: C.sky,
      door: C.lavender,
    }),
    shadow: { w: 30, h: 7 },
  },
  eggTree: {
    source: EGG_TREE,
    palette: holidayPalette({
      ...WOODEN,
      wall: C.cream,
      trim: C.bark,
      accent: C.snapLight,
      accentTwo: C.gold,
      leaves: C.luna,
      roof: C.sky,
      door: C.lavender,
    }),
    shadow: { w: 24, h: 7 },
  },
  flagPole: {
    source: FLAG_POLE,
    palette: holidayPalette({
      ...WOODEN,
      wall: C.silver,
      accent: C.scarlet,
      accentTwo: C.gold,
      roof: C.navy,
    }),
    shadow: { w: 18, h: 6 },
  },
  pumpkinTower: {
    source: PUMPKIN_TOWER,
    palette: holidayPalette({
      ...WOODEN,
      accent: C.pumpkin,
      door: C.inkFabric,
      accentTwo: C.lavender,
    }),
    glow: FIRE_LIT,
    lights: [
      { x: 24, y: 70, radius: 34 },
      { x: 24, y: 40, radius: 26 },
    ],
    shadow: { w: 40, h: 9 },
  },
  harvestTable: {
    source: HARVEST_TABLE,
    palette: holidayPalette({
      ...WOODEN,
      wall: C.cream,
      trim: C.wood,
      accent: C.pumpkin,
      accentTwo: C.gold,
      stone: C.silver,
    }),
    glow: FIRE_LIT,
    lights: [
      { x: 35, y: 12, radius: 30 },
      { x: 63, y: 12, radius: 30 },
    ],
    shadow: { w: 92, h: 10 },
  },
  glitterBall: {
    source: GLITTER_BALL,
    palette: holidayPalette({
      ...WOODEN,
      stone: C.silver,
      trim: C.iron,
      accent: C.roseLight,
      accentTwo: C.gold,
      roof: C.lavender,
    }),
    glow: { [LAMP]: C.candleBright },
    lights: [{ x: 20, y: 16, radius: 36 }],
    shadow: { w: 18, h: 6 },
  },
};

// ---- On every front door ---------------------------------------------------------------------

/** A wreath: a ring of a material's blobs, `r` across, round an open middle. */
function ring(s: Sketch, cx: number, cy: number, r: number, m: Material, blob = 3): void {
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    s.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, blob, blob, fillOf(m));
  }
  s.bevel(fillOf(m), lightOf(m), shadeOf(m));
}

/** A bow at the foot of a wreath, two loops and two tails. */
function bow(s: Sketch, cx: number, y: number, m: Material): void {
  s.ellipse(cx - 3, y, 3, 2, fillOf(m)).ellipse(cx + 3, y, 3, 2, fillOf(m));
  s.rect(cx - 1, y - 1, 2, 3, shadeOf(m));
  s.line(cx - 1, y + 1, cx - 3, y + 5, fillOf(m)).line(cx, y + 1, cx + 2, y + 5, fillOf(m));
}

/** What hangs on a door, drawn about 24 pixels across, centred in its grid. */
interface Dressing {
  source: SpriteSource;
  palette: Palette;
  glow?: Palette;
}

const DOOR_SIZE = 26;

function dressing(draw: (s: Sketch, c: number) => void): SpriteSource {
  const s = new Sketch(DOOR_SIZE, DOOR_SIZE);
  draw(s, DOOR_SIZE / 2);
  return finish(s);
}

const DRESSING_COLOURS: Colours = {
  ...WOODEN,
  leaves: C.hedgeLight,
  accent: C.scarlet,
  accentTwo: C.gold,
  roof: C.sky,
  door: C.lavender,
};

/** What hangs on every front door while each holiday's decorations are up. */
export const DOOR_DRESSINGS: Record<DecorId, Dressing> = {
  newYear: {
    // A gold star, with streamers curling down from it.
    source: dressing((s, c) => {
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI / 2 + (k / 5) * Math.PI * 2;
        s.line(
          c,
          10,
          Math.round(c + Math.cos(a) * 8),
          Math.round(10 + Math.sin(a) * 8),
          fillOf(ACCENT_TWO),
        );
      }
      s.ellipse(c, 10, 4, 4, fillOf(ACCENT_TWO)).set(c - 1, 8, lightOf(ACCENT_TWO));
      [ACCENT, ROOF, DOOR].forEach((m, i) => {
        for (let j = 0; j < 8; j++)
          s.set(c - 5 + i * 5 + Math.round(Math.sin(j / 1.5) * 1), 17 + j, fillOf(m));
      });
    }),
    palette: holidayPalette(DRESSING_COLOURS),
  },
  valentines: {
    source: dressing((s, c) => {
      heart(s, c, 3, 19, fillOf(ACCENT));
      s.bevel(fillOf(ACCENT), lightOf(ACCENT), shadeOf(ACCENT));
      heart(s, c, 8, 7, WHITE);
    }),
    palette: holidayPalette({ ...DRESSING_COLOURS, accent: C.roseLight }),
  },
  stPatricks: {
    source: dressing((s, c) => {
      for (const [dx, dy] of [
        [0, -5],
        [-5, 2],
        [5, 2],
      ] as const) {
        heart(s, c + dx, 7 + dy, 9, fillOf(LEAVES));
      }
      s.bevel(fillOf(LEAVES), lightOf(LEAVES), shadeOf(LEAVES));
      s.line(c, 14, c + 3, 23, darkOf(LEAVES));
    }),
    palette: holidayPalette({ ...DRESSING_COLOURS, leaves: C.leaf }),
  },
  easter: {
    // A wreath of painted eggs.
    source: dressing((s, c) => {
      ring(s, c, c, 8, LEAVES, 2);
      [ACCENT, ACCENT_TWO, ROOF, DOOR, ACCENT, ROOF].forEach((m, i) => {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        ball(s, c + Math.cos(a) * 8, c + Math.sin(a) * 8, 2.5, 3.2, m);
      });
    }),
    palette: holidayPalette({ ...DRESSING_COLOURS, accent: C.snapLight, leaves: C.luna }),
  },
  fourthOfJuly: {
    // A rosette of red, white and blue, with two ribbon tails.
    source: dressing((s, c) => {
      s.rect(c - 4, 14, 3, 11, fillOf(ACCENT)).rect(c + 1, 14, 3, 11, fillOf(ROOF));
      s.ellipse(c, 11, 10, 10, fillOf(ACCENT)).ellipse(c, 11, 7, 7, WHITE);
      s.ellipse(c, 11, 4.5, 4.5, fillOf(ROOF)).set(c, 11, WHITE);
    }),
    palette: holidayPalette({ ...DRESSING_COLOURS, roof: C.navy }),
  },
  halloween: {
    // Autumn leaves round a tiny grinning jack-o'-lantern.
    source: dressing((s, c) => {
      ring(s, c, c, 8, ACCENT_TWO, 3);
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2;
        s.ellipse(c + Math.cos(a) * 9, c + Math.sin(a) * 9, 2, 2, fillOf(DOOR));
      }
      ball(s, c, c + 1, 5, 4, ACCENT);
      s.set(c - 2, c, FIRE)
        .set(c + 2, c, FIRE)
        .rect(c - 2, c + 2, 5, 1, FIRE);
    }),
    palette: {
      ...holidayPalette({
        ...DRESSING_COLOURS,
        accent: C.pumpkin,
        accentTwo: C.pumpkinDark,
        door: C.scarlet,
      }),
      ...CARVED,
    },
    glow: FIRE_LIT,
  },
  thanksgiving: {
    // A wreath of corn husks and wheat, with a plum bow.
    source: dressing((s, c) => {
      ring(s, c, c, 8, ACCENT_TWO, 3);
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2 + 0.3;
        s.ellipse(c + Math.cos(a) * 8, c + Math.sin(a) * 8, 1.5, 1.5, fillOf(ACCENT));
      }
      bow(s, c, c + 8, DOOR);
    }),
    palette: holidayPalette({
      ...DRESSING_COLOURS,
      accentTwo: C.gold,
      accent: C.pumpkin,
      door: C.plum,
    }),
  },
  christmas: {
    // An evergreen wreath with red berries, a red bow and a few fairy lights.
    source: dressing((s, c) => {
      ring(s, c, c - 1, 8, LEAVES, 3);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        s.set(Math.round(c + Math.cos(a) * 9), Math.round(c - 1 + Math.sin(a) * 9), BULBS[k % 4]!);
      }
      for (const [x, y] of [
        [c - 6, c - 6],
        [c + 7, c - 3],
        [c - 8, c + 2],
      ] as const) {
        s.rect(x, y, 2, 2, fillOf(ACCENT));
      }
      bow(s, c, c + 7, ACCENT);
    }),
    palette: holidayPalette(DRESSING_COLOURS),
    glow: BULBS_LIT,
  },
};

// ---- Skelly, dressed up ----------------------------------------------------------------------

/** How much room over Skelly's skull his hats need. */
const HAT_ROOM = 26;

/** Skelly's own keys, moved out of the kit's way so the two palettes can share a sprite. */
const SKELLY_KEYS: Record<string, string> = { o: '0', B: '8', b: '6', l: '9', w: '5' };

/** Where his skull's middle and top are, in the sprite with room for a hat. */
const SKULL = { cx: 58, top: 6 + HAT_ROOM };

function skellyWith(dress: (s: Sketch) => void): SpriteSource {
  const width = SKELLY.rows[0]!.length;
  const s = new Sketch(width, SKELLY.rows.length + HAT_ROOM);
  const moved: SpriteSource = {
    rows: SKELLY.rows.map((row) => [...row].map((k) => SKELLY_KEYS[k] ?? k).join('')),
  };
  s.stamp(moved, 0, HAT_ROOM);
  dress(s);
  return finish(s);
}

/** A hat on his skull: a brim `brim` wide and a crown `crown` wide and `tall` tall, of a material. */
function topHat(s: Sketch, m: Material, band: Material, tall = 18, brim = 30, crown = 20): void {
  const { cx, top } = SKULL;
  s.rect(cx - brim / 2, top + 2, brim, 3, fillOf(m)).rect(
    cx - brim / 2,
    top + 2,
    brim,
    1,
    lightOf(m),
  );
  slab(s, cx - crown / 2, top + 2 - tall, crown, tall, m);
  s.rect(cx - crown / 2, top - 3, crown, 3, fillOf(band));
}

/** A string of fairy lights looped round him: across his ribs, down his arms. */
function lightsOn(s: Sketch): void {
  const { cx } = SKULL;
  const y0 = HAT_ROOM;
  let n = 0;
  const loop = (x0: number, ya: number, x1: number, yb: number, sag: number) => {
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const x = Math.round(x0 + (x1 - x0) * t);
      const y = Math.round(ya + (yb - ya) * t + Math.sin(t * Math.PI) * sag);
      s.set(x, y, darkOf(TRIM));
      if (i % 2 === 0) s.rect(x, y + 1, 2, 2, BULBS[n++ % 4]!);
    }
  };
  loop(cx - 15, y0 + 50, cx + 15, y0 + 50, 5);
  loop(cx - 13, y0 + 64, cx + 13, y0 + 64, 4);
  loop(cx - 46, y0 + 52, cx - 16, y0 + 48, 4);
  loop(cx - 12, y0 + 86, cx + 12, y0 + 86, 3);
}

const SKELLY_GET_UPS: Record<DecorId, (s: Sketch) => void> = {
  newYear: (s) => {
    // A striped party hat, a little askew, with a pompom.
    const { cx, top } = SKULL;
    column(s, cx + 3, top - 18, 22, (j) => 2 + j * 0.7, fillOf(ACCENT_TWO));
    for (let j = 3; j < 22; j += 5) {
      s.replace(
        fillOf(ACCENT_TWO),
        fillOf(ROOF),
        (_, y) => y === top - 18 + j || y === top - 17 + j,
      );
    }
    s.ellipse(cx + 3, top - 19, 3, 3, fillOf(ACCENT));
  },
  valentines: (s) => {
    // A heart balloon tied to his hand.
    const { cx } = SKULL;
    s.line(cx - 49, HAT_ROOM + 51, cx - 40, HAT_ROOM + 10, darkOf(TRIM));
    heart(s, cx - 40, HAT_ROOM - 16, 21, fillOf(ACCENT));
    s.bevel(fillOf(ACCENT), lightOf(ACCENT), shadeOf(ACCENT));
    s.set(cx - 45, HAT_ROOM - 12, WHITE).set(cx - 44, HAT_ROOM - 13, WHITE);
  },
  stPatricks: (s) => {
    topHat(s, LEAVES, ACCENT_TWO);
    const { cx, top } = SKULL;
    s.rect(cx - 3, top - 4, 6, 5, fillOf(ACCENT_TWO)).rect(cx - 1, top - 3, 2, 3, fillOf(LEAVES));
  },
  easter: (s) => {
    // Bunny ears, pink inside, one a little floppy.
    const { cx, top } = SKULL;
    s.ellipse(cx - 7, top - 10, 4, 13, WHITE).ellipse(cx - 7, top - 9, 2, 10, fillOf(ACCENT));
    s.ellipse(cx + 9, top - 6, 4, 11, WHITE).ellipse(cx + 9, top - 5, 2, 8, fillOf(ACCENT));
    s.ellipse(cx + 12, top - 16, 4, 4, WHITE);
    s.rect(cx - 12, top + 1, 26, 3, fillOf(ACCENT));
  },
  fourthOfJuly: (s) => {
    // A tall hat striped red and white, a blue band with white stars.
    topHat(s, WALL, ROOF, 22);
    const { cx, top } = SKULL;
    for (let x = cx - 9; x < cx + 10; x += 4) s.rect(x, top - 19, 2, 16, fillOf(ACCENT));
    for (let x = cx - 8; x < cx + 9; x += 4) s.set(x, top - 2, WHITE);
  },
  halloween: (s) => {
    // A witch's hat, wide in the brim, its point flopped over.
    const { cx, top } = SKULL;
    s.ellipse(cx, top + 3, 19, 3.5, fillOf(DOOR));
    column(s, cx, top - 20, 22, (j) => 3 + j * 0.8, fillOf(DOOR));
    s.rect(cx - 9, top - 3, 18, 3, fillOf(ACCENT));
    s.rect(cx + 1, top - 23, 4, 3, fillOf(DOOR)).rect(cx + 4, top - 22, 3, 3, fillOf(DOOR));
    s.bevel(fillOf(DOOR), lightOf(DOOR), shadeOf(DOOR));
  },
  thanksgiving: (s) => {
    // A pilgrim's hat, black with a gold buckle.
    topHat(s, TRIM, WALL, 16, 32, 22);
    const { cx, top } = SKULL;
    s.rect(cx - 4, top - 5, 8, 6, fillOf(ACCENT_TWO)).rect(cx - 2, top - 3, 4, 2, fillOf(TRIM));
  },
  christmas: (s) => {
    // A Santa hat flopped over to one side with a white pompom, and fairy lights all over him.
    lightsOn(s);
    const { cx, top } = SKULL;
    column(s, cx, top - 12, 16, (j) => 6 + j * 1.3, fillOf(ACCENT));
    s.rect(cx + 2, top - 16, 8, 6, fillOf(ACCENT)).rect(cx + 8, top - 14, 6, 5, fillOf(ACCENT));
    s.bevel(fillOf(ACCENT), lightOf(ACCENT), shadeOf(ACCENT));
    s.rect(cx - 14, top + 1, 28, 5, WHITE);
    s.ellipse(cx + 16, top - 10, 4, 4, WHITE);
  },
};

/** Skelly in each holiday's get-up: taller than he is plain, so drawn from his feet up. */
export const SKELLY_DRESSED: Record<DecorId, SpriteSource> = Object.fromEntries(
  (Object.keys(SKELLY_GET_UPS) as DecorId[]).map((id) => [id, skellyWith(SKELLY_GET_UPS[id])]),
) as Record<DecorId, SpriteSource>;

const moved = (p: Palette) =>
  Object.fromEntries(Object.entries(p).map(([k, v]) => [SKELLY_KEYS[k] ?? k, v]));

const SKELLY_COLOURS: Colours = {
  ...WOODEN,
  wall: C.white,
  trim: C.ink,
  accent: C.scarlet,
  accentTwo: C.gold,
  leaves: C.leaf,
  roof: C.navy,
  door: C.plum,
};

/** Skelly's palette in each get-up: his bones, and the colours of what he's wearing. */
export const SKELLY_DRESSED_PALETTES: Record<DecorId, Palette> = Object.fromEntries(
  (Object.keys(SKELLY_GET_UPS) as DecorId[]).map((id) => [
    id,
    {
      ...holidayPalette({ ...SKELLY_COLOURS, ...(id === 'easter' ? { accent: C.snapLight } : {}) }),
      ...moved(SKELLY_PALETTE),
    },
  ]),
) as Record<DecorId, Palette>;

/** His fairy lights, lit after dark. */
export const SKELLY_DRESSED_GLOW: Palette = BULBS_LIT;

// ---- The garlands ------------------------------------------------------------------------------

/** A garland strung between two lamps: fairy lights that light up after dark, or pennants. */
export interface GarlandStyle {
  kind: 'bulbs' | 'bunting';
  colours: readonly string[];
}

export const GARLAND_STYLES: Record<DecorId, GarlandStyle> = {
  newYear: { kind: 'bunting', colours: [C.gold, C.silver, C.lavender] },
  valentines: { kind: 'bunting', colours: [C.roseLight, C.white, C.snap] },
  stPatricks: { kind: 'bunting', colours: [C.leaf, C.white, C.gold] },
  easter: { kind: 'bunting', colours: [C.snapLight, C.luna, C.sky, C.gold] },
  fourthOfJuly: { kind: 'bunting', colours: [C.scarlet, C.white, C.navy] },
  halloween: { kind: 'bulbs', colours: [C.pumpkin, C.lavender, C.orbGreen] },
  thanksgiving: { kind: 'bunting', colours: [C.pumpkin, C.gold, C.berry] },
  christmas: { kind: 'bulbs', colours: [C.scarlet, C.gold, C.orbBlue, C.orbGreen] },
};

/** What a bulb of a colour looks like lit, after dark. */
export const LIT_BULB: Readonly<Record<string, string>> = {
  [C.scarlet]: C.roseLight,
  [C.gold]: C.candleBright,
  [C.orbBlue]: C.orbBlueLight,
  [C.orbGreen]: C.orbGreenLight,
  [C.pumpkin]: C.candle,
  [C.lavender]: C.ghost,
};

// ---- Easter's hidden eggs ----------------------------------------------------------------------

/** A painted egg nestled in the grass, a band round its middle. */
export const HIDDEN_EGG: SpriteSource = (() => {
  const s = new Sketch(14, 16);
  ball(s, 7, 8, 5, 6.5, ACCENT);
  s.rect(2, 8, 10, 2, fillOf(ACCENT_TWO));
  for (let x = 3; x < 12; x += 3) s.set(x, 5, WHITE);
  for (const x of [1, 4, 10, 12]) s.rect(x, 12, 1, 3, fillOf(LEAVES));
  return finish(s);
})();

/** The eggs' colours, one picked for each by where it's hidden. */
export const HIDDEN_EGG_PALETTES: readonly Palette[] = [
  [C.snapLight, C.gold],
  [C.sky, C.white],
  [C.luna, C.lavender],
  [C.gold, C.roseLight],
  [C.lavender, C.luna],
].map(([egg, band]) =>
  holidayPalette({ ...WOODEN, accent: egg!, accentTwo: band!, leaves: C.leafLight }),
);

// ---- Her little tree -------------------------------------------------------------------------

/**
 * The little tree the town sends her for Christmas: black as midnight, hung with bats and baubles,
 * a skull on top, and lights that twinkle after dark, in a plum pot.
 */
const HOLIDAY_TREE = (() => {
  const s = new Sketch(32, 60);
  const cx = 16;
  slab(s, cx - 7, 50, 14, 9, ROOF);
  s.rect(cx - 7, 52, 14, 1, darkOf(ROOF));
  s.rect(cx - 2, 44, 4, 7, fillOf(TRIM));
  for (const [top, h, w] of [
    [10, 14, 12],
    [20, 14, 20],
    [30, 16, 28],
  ] as const) {
    column(s, cx, top, h, (j) => 4 + ((w - 4) * j) / h, fillOf(LEAVES));
  }
  s.bevel(fillOf(LEAVES), lightOf(LEAVES), shadeOf(LEAVES));
  let n = 0;
  for (const [y, w] of [
    [21, 10],
    [31, 18],
    [42, 24],
  ] as const) {
    for (let x = cx - w / 2; x <= cx + w / 2; x += 3) {
      if (s.get(x, y) !== CLEAR) s.set(x, y, BULBS[n++ % 4]!);
    }
  }
  ball(s, cx - 5, 36, 2, 2, ACCENT);
  ball(s, cx + 6, 27, 2, 2, ACCENT_TWO);
  ball(s, cx + 3, 44, 2, 2, ACCENT);
  bat(s, cx - 13, 38);
  s.ellipse(cx, 6, 4, 4, WHITE).rect(cx - 2, 8, 4, 3, WHITE);
  s.set(cx - 2, 6, INK).set(cx + 1, 6, INK);
  return finish(s);
})();

export const HOLIDAY_FURNITURE_ART: Record<Extract<FurnitureId, 'holidayTree'>, FurnitureArt> = {
  holidayTree: {
    source: HOLIDAY_TREE,
    palette: holidayPalette({
      ...WOODEN,
      leaves: C.furBlackLight,
      trim: C.bark,
      roof: C.plum,
      accent: C.scarlet,
      accentTwo: C.gold,
    }),
    glow: BULBS_LIT,
    lights: [{ x: 16, y: 32, radius: 30 }],
  },
};
