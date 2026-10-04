import type { SurfacePiece, TrinketPiece } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  DOOR,
  fillOf,
  finish,
  GLASS,
  GLINT,
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
} from './buildings';
import type { FurnitureArt } from './furniture';
import {
  ball,
  bat,
  candle,
  column,
  FIRE,
  FIRE_LIGHT,
  FIRE_LIT,
  palette,
  slab,
  WOOD,
} from './furnish';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

// Things on tables (0.3's H3), at 32. A surface's flat top is drawn as a band of its top seen from
// above over its front edge, and `SURFACES` in `src/data/tabletop.ts` says how high that band
// is; a trinket is small, centred on its tile and standing on its bottom rows, the same picture
// on a table as on the floor.

// ---- The surfaces -----------------------------------------------------------------------------

/** A round plum top on three curly legs, with a bat tucked under it. */
const SIDE_TABLE = (() => {
  const s = new Sketch(32, 32);
  for (const [x0, x1] of [
    [8, 5],
    [24, 27],
  ] as const) {
    s.line(x0, 15, x1, 27, fillOf(TRIM)).line(x0 + 1, 15, x1 + 1, 27, shadeOf(TRIM));
    s.rect(x1 - 1, 28, 4, 2, darkOf(TRIM));
  }
  s.rect(15, 15, 3, 13, fillOf(TRIM)).rect(15, 15, 1, 13, lightOf(TRIM));
  s.rect(14, 28, 5, 2, darkOf(TRIM));
  bat(s, 9, 16);
  s.ellipse(16, 11, 14, 4, fillOf(ROOF));
  s.ellipse(16, 10, 12, 2.5, lightOf(ROOF));
  s.rect(3, 13, 26, 2, darkOf(ROOF)).rect(5, 15, 22, 1, darkOf(ROOF));
  return finish(s);
})();

/** A long table under a plum cloth with a lace edge, on wooden legs. */
const TEA_TABLE = (() => {
  const s = new Sketch(64, 34);
  for (const x of [5, 55]) slab(s, x, 22, 4, 11, TRIM);
  s.rect(1, 8, 62, 6, lightOf(ROOF)).rect(2, 9, 60, 4, fillOf(ROOF));
  s.rect(1, 14, 62, 7, shadeOf(ROOF)).rect(1, 14, 62, 1, darkOf(ROOF));
  for (let x = 2; x < 62; x += 5) s.line(x + 2, 15, x + 2, 19, fillOf(ROOF));
  // Lace along the hem, in little scallops.
  s.rect(1, 21, 62, 1, WHITE);
  for (let x = 1; x < 63; x += 4) s.rect(x + 1, 22, 2, 1, WHITE);
  for (let x = 4; x < 62; x += 10) s.set(x, 11, darkOf(ROOF)).set(x + 5, 10, darkOf(ROOF));
  return finish(s);
})();

/** A chest of drawers, two by three, with a little brass moon on every knob. */
const DRESSER = (() => {
  const s = new Sketch(64, 44);
  slab(s, 2, 10, 60, 30, TRIM);
  s.rect(0, 5, 64, 5, lightOf(TRIM)).rect(1, 6, 62, 3, fillOf(TRIM));
  s.rect(0, 9, 64, 1, darkOf(TRIM));
  for (const y of [13, 22, 31]) {
    for (const x of [5, 33]) {
      s.rect(x, y, 26, 8, shadeOf(TRIM)).rect(x + 1, y + 1, 24, 6, fillOf(TRIM));
      s.rect(x + 1, y + 1, 24, 1, lightOf(TRIM));
      // A crescent moon of a knob.
      const cx = x + 12;
      s.rect(cx, y + 3, 2, 3, LAMP)
        .set(cx + 2, y + 3, LAMP)
        .set(cx + 2, y + 5, LAMP);
      s.set(cx, y + 3, GLINT);
    }
  }
  for (const x of [3, 57]) s.rect(x, 40, 4, 3, darkOf(TRIM));
  return finish(s);
})();

/** A cream cupboard under a chequered tile top. */
const KITCHEN_COUNTER = (() => {
  const s = new Sketch(32, 40);
  slab(s, 2, 12, 28, 25, WALL);
  s.rect(3, 37, 26, 2, darkOf(WALL));
  slab(s, 6, 15, 20, 19, WALL);
  s.rect(21, 23, 2, 4, LAMP).set(21, 23, GLINT);
  // The tiles: a checker seen from above, then the counter's front edge.
  for (let y = 6; y < 11; y++) {
    for (let x = 0; x < 32; x++) {
      const dark = (Math.floor(x / 4) + Math.floor((y - 6) / 2)) % 2 === 0;
      s.set(x, y, dark ? fillOf(ROOF) : WHITE);
    }
  }
  s.rect(0, 11, 32, 2, darkOf(ROOF)).rect(0, 6, 32, 1, lightOf(ROOF));
  return finish(s);
})();

/** A long, low shelf of books, two shelves deep, with a flat top. */
const LOW_SHELF = (() => {
  const s = new Sketch(64, 36);
  slab(s, 1, 8, 62, 26, TRIM);
  s.rect(0, 5, 64, 4, lightOf(TRIM))
    .rect(1, 6, 62, 2, fillOf(TRIM))
    .rect(0, 8, 64, 1, darkOf(TRIM));
  const spines = [fillOf(ROOF), fillOf(DOOR), fillOf(LEAVES), fillOf(ACCENT), fillOf(ACCENT_TWO)];
  for (const [y, h] of [
    [11, 9],
    [22, 9],
  ] as const) {
    s.rect(4, y, 56, h, darkOf(TRIM));
    let x = 5;
    let k = y;
    while (x < 58) {
      const w = 2 + (k % 3);
      const tall = h - 1 - (k % 2) * 2;
      if (k % 7 !== 3) s.rect(x, y + h - tall, w, tall, spines[k % spines.length]!);
      x += w + (k % 5 === 0 ? 3 : 0);
      k += 1;
    }
  }
  for (const x of [3, 57]) s.rect(x, 34, 4, 2, darkOf(TRIM));
  return finish(s);
})();

// ---- The trinkets -----------------------------------------------------------------------------

/** A mug that's a grinning skull, cocoa in the top and a curl of steam. */
const SKULL_MUG = (() => {
  const s = new Sketch(32, 24);
  s.rect(21, 9, 4, 2, fillOf(WALL))
    .rect(23, 11, 2, 5, fillOf(WALL))
    .rect(21, 16, 4, 2, fillOf(WALL));
  s.rect(9, 6, 13, 14, fillOf(WALL)).rect(10, 20, 11, 2, fillOf(WALL));
  s.rect(9, 6, 1, 14, lightOf(WALL)).rect(21, 7, 1, 14, shadeOf(WALL));
  s.rect(9, 6, 13, 2, darkOf(TRIM)).rect(10, 6, 11, 1, fillOf(TRIM));
  s.rect(11, 11, 3, 3, INK).rect(17, 11, 3, 3, INK).set(15, 15, INK);
  for (let x = 12; x < 20; x += 2) s.rect(x, 17, 1, 2, shadeOf(WALL));
  s.set(14, 3, WHITE).set(15, 2, WHITE).set(16, 1, WHITE).set(17, 4, WHITE).set(16, 3, WHITE);
  return finish(s);
})();

/** Three spellbooks stacked, their spines to her, a ribbon hanging from the top one. */
const SPELLBOOKS = (() => {
  const s = new Sketch(32, 24);
  const book = (x: number, y: number, w: number, h: number, key: string, band: string) => {
    s.rect(x, y, w, h, key).rect(x, y, w, 1, WHITE);
    s.rect(x + 3, y + 1, 1, h - 1, band).rect(x + w - 4, y + 1, 1, h - 1, band);
  };
  book(5, 16, 22, 6, fillOf(ROOF), LAMP);
  book(8, 11, 18, 5, fillOf(DOOR), LAMP);
  book(6, 6, 19, 5, fillOf(LEAVES), LAMP);
  s.rect(14, 8, 3, 2, LAMP).set(14, 8, GLINT);
  s.rect(20, 11, 1, 5, fillOf(ACCENT));
  return finish(s);
})();

/** Three candles of three heights on a little pewter dish, dripping. */
const DRIP_CANDLES = (() => {
  const s = new Sketch(32, 32);
  candle(s, 13, 2, 21, 5);
  candle(s, 6, 9, 14, 4);
  candle(s, 21, 13, 10, 4);
  for (const [x, y, h] of [
    [13, 6, 4],
    [17, 5, 7],
    [6, 12, 3],
    [24, 16, 3],
  ] as const) {
    s.rect(x, y, 1, h, WHITE);
  }
  slab(s, 3, 26, 26, 3, STONE);
  s.rect(5, 29, 22, 1, darkOf(STONE));
  return finish(s);
})();

/** A red-capped toadstool with a glow under its cap, on a tuft of moss. */
const TOADSTOOL_LAMP = (() => {
  const s = new Sketch(32, 30);
  ball(s, 16, 13, 13, 10, ROOF);
  s.rect(0, 13, 32, 17, '.');
  s.ellipse(16, 26, 10, 2.5, fillOf(LEAVES)).rect(7, 25, 18, 1, lightOf(LEAVES));
  column(s, 16, 14, 12, (j) => 7 + j / 6, fillOf(WALL));
  s.rect(13, 15, 1, 10, lightOf(WALL)).rect(19, 16, 1, 9, shadeOf(WALL));
  s.rect(5, 13, 22, 1, FIRE).rect(9, 14, 14, 1, FIRE_LIGHT);
  for (const [x, y, r] of [
    [10, 7, 2],
    [18, 5, 1.5],
    [22, 10, 1.5],
    [14, 11, 1],
  ] as const) {
    s.ellipse(x, y, r, r, WHITE);
  }
  return finish(s);
})();

/** Three bottles of potion: a round pink one, a tall green one and a squat purple one. */
const POTION_BOTTLES = (() => {
  const s = new Sketch(32, 28);
  // The tall one at the back.
  s.rect(14, 3, 4, 3, fillOf(TRIM)).rect(15, 6, 2, 3, GLASS);
  s.rect(12, 9, 8, 15, fillOf(LEAVES)).rect(12, 9, 8, 2, GLASS).rect(13, 9, 1, 15, lightOf(LEAVES));
  s.rect(13, 15, 6, 4, WHITE).rect(14, 16, 4, 1, darkOf(LEAVES));
  // The round one.
  s.rect(7, 9, 3, 2, fillOf(TRIM)).rect(7, 11, 3, 3, GLASS);
  ball(s, 8.5, 19, 5.5, 6, ACCENT);
  s.rect(4, 15, 9, 1, GLASS);
  // The squat one.
  s.rect(23, 13, 3, 2, fillOf(TRIM)).rect(23, 15, 3, 2, GLASS);
  slab(s, 20, 17, 9, 8, ACCENT_TWO);
  s.rect(21, 17, 7, 1, GLASS);
  s.set(6, 17, WHITE).set(21, 19, WHITE).set(13, 11, WHITE);
  return finish(s);
})();

/** A snow globe on a wooden base, a little haunted house and its ghost inside. */
const SNOW_GLOBE = (() => {
  const s = new Sketch(32, 32);
  slab(s, 7, 23, 18, 6, TRIM);
  s.rect(6, 22, 20, 2, lightOf(TRIM));
  s.ellipse(16, 13, 10, 10, GLASS);
  s.rect(7, 19, 18, 3, WHITE);
  // The house: plum walls, a pointed roof, a lit window and a ghost at it.
  s.rect(12, 13, 8, 6, fillOf(ROOF)).rect(12, 13, 1, 6, lightOf(ROOF));
  for (let k = 0; k < 5; k++) s.rect(11 + k, 12 - k, 10 - 2 * k, 1, darkOf(ROOF));
  s.rect(15, 15, 2, 2, LAMP);
  s.rect(17, 8, 3, 3, WHITE).set(18, 9, INK);
  for (const [x, y] of [
    [9, 8],
    [21, 6],
    [11, 4],
    [23, 13],
    [14, 6],
    [8, 14],
  ] as const) {
    s.set(x, y, WHITE);
  }
  s.line(10, 6, 12, 4, GLINT).set(9, 8, GLINT);
  return finish(s);
})();

/** An hourglass of purple sand between two wooden ends. */
const HOURGLASS = (() => {
  const s = new Sketch(32, 32);
  column(s, 16, 5, 10, (j) => 12 - j * 1.1, GLASS);
  column(s, 16, 15, 10, (j) => 2 + j * 1.1, GLASS);
  // What's left at the top, the trickle, and the heap at the bottom.
  column(s, 16, 9, 5, (j) => 7 - j * 1.2, fillOf(ACCENT_TWO));
  s.rect(16, 14, 1, 7, fillOf(ACCENT_TWO));
  column(s, 16, 20, 5, (j) => 3 + j * 2, fillOf(ACCENT_TWO));
  s.rect(15, 20, 2, 1, lightOf(ACCENT_TWO));
  for (const x of [8, 22]) s.rect(x, 4, 2, 22, fillOf(TRIM)).rect(x, 4, 1, 22, lightOf(TRIM));
  slab(s, 6, 2, 20, 3, TRIM);
  slab(s, 6, 25, 20, 3, TRIM);
  s.set(12, 7, GLINT).set(12, 8, GLINT);
  return finish(s);
})();

/** A pumpkin pail with a happy face, a handle and sweets heaped over the brim. */
const CANDY_PAIL = (() => {
  const s = new Sketch(32, 28);
  s.line(6, 10, 9, 3, INK).line(9, 3, 16, 1, INK).line(16, 1, 23, 3, INK).line(23, 3, 26, 10, INK);
  ball(s, 16, 17, 11, 8.5, ACCENT, { dither: true });
  for (const x of [11, 16, 21]) s.rect(x, 10, 1, 14, shadeOf(ACCENT));
  s.rect(7, 9, 18, 2, darkOf(ACCENT));
  for (const [x, y, key] of [
    [8, 7, fillOf(ROOF)],
    [11, 6, WHITE],
    [14, 7, fillOf(LEAVES)],
    [17, 6, fillOf(DOOR)],
    [20, 7, fillOf(ROOF)],
    [22, 8, WHITE],
    [12, 8, fillOf(DOOR)],
    [18, 8, LAMP],
  ] as const) {
    s.rect(x, y, 2, 2, key);
  }
  // A happy face: triangle eyes and a smile.
  for (const x of [11, 19]) s.rect(x, 14, 3, 1, INK).set(x + 1, 13, INK);
  s.rect(12, 19, 9, 1, INK).set(11, 18, INK).set(21, 18, INK).set(15, 20, INK).set(17, 20, INK);
  return finish(s);
})();

/** A little black cat sitting up, one paw raised to wave, with a bell on its collar. */
const LUCKY_CAT = (() => {
  const s = new Sketch(32, 32);
  ball(s, 15, 21, 8, 8, WALL);
  s.rect(7, 26, 16, 3, fillOf(WALL));
  s.line(23, 26, 27, 21, fillOf(WALL)).line(27, 21, 26, 18, fillOf(WALL));
  // The waving paw, up beside its head.
  s.rect(21, 7, 4, 8, fillOf(WALL)).rect(21, 6, 4, 2, lightOf(WALL));
  ball(s, 15, 11, 7, 6, WALL);
  for (const side of [-1, 1]) {
    const x = 15 + side * 5;
    s.rect(x - 1, 4, 3, 2, fillOf(WALL))
      .set(x, 3, fillOf(WALL))
      .set(x, 5, fillOf(ACCENT));
  }
  s.rect(11, 10, 2, 2, LAMP).rect(17, 10, 2, 2, LAMP).set(12, 11, INK).set(18, 11, INK);
  s.set(15, 13, fillOf(ACCENT));
  s.rect(9, 16, 13, 1, fillOf(ROOF)).rect(14, 17, 3, 2, LAMP).set(14, 17, GLINT);
  s.rect(10, 26, 4, 2, lightOf(WALL)).rect(16, 26, 4, 2, lightOf(WALL));
  return finish(s);
})();

/** A shy little ghost of a vase, blushing, with a sprig of lavender in it. */
const GHOST_VASE = (() => {
  const s = new Sketch(32, 32);
  for (const [x0, x1] of [
    [15, 13],
    [16, 17],
    [17, 20],
  ] as const) {
    s.line(x0, 13, x1, 4, fillOf(LEAVES));
  }
  for (const [x, y] of [
    [13, 3],
    [13, 6],
    [17, 3],
    [17, 6],
    [20, 3],
    [19, 6],
    [14, 1],
    [21, 1],
  ] as const) {
    s.rect(x, y, 2, 2, fillOf(ACCENT_TWO)).set(x, y, lightOf(ACCENT_TWO));
  }
  ball(s, 16, 18, 8, 7, WALL);
  s.rect(8, 18, 16, 8, fillOf(WALL))
    .rect(8, 18, 1, 8, lightOf(WALL))
    .rect(23, 18, 1, 8, shadeOf(WALL));
  for (let x = 8; x < 24; x += 4) s.rect(x + 2, 26, 2, 2, fillOf(WALL));
  s.rect(13, 12, 6, 2, darkOf(WALL));
  s.rect(12, 17, 2, 3, INK).rect(18, 17, 2, 3, INK);
  s.rect(10, 21, 2, 1, fillOf(ACCENT)).rect(20, 21, 2, 1, fillOf(ACCENT));
  return finish(s);
})();

/** Half a geode, cut face out: grey rock round a heart of purple crystals. */
const AMETHYST = (() => {
  const s = new Sketch(32, 24);
  ball(s, 16, 13, 12, 9, STONE);
  s.rect(4, 19, 24, 3, '.');
  s.rect(5, 18, 22, 2, shadeOf(STONE));
  s.ellipse(16, 12, 8.5, 6, darkOf(ACCENT_TWO));
  for (const [x, y, h] of [
    [10, 11, 4],
    [13, 8, 7],
    [16, 9, 8],
    [19, 10, 6],
    [22, 12, 3],
    [12, 14, 3],
    [18, 15, 2],
  ] as const) {
    s.rect(x, y, 2, h, fillOf(ACCENT_TWO)).set(x, y, lightOf(ACCENT_TWO));
  }
  s.set(14, 9, WHITE).set(17, 10, WHITE).set(11, 12, WHITE);
  return finish(s);
})();

/** A jar of fireflies on a tuft of grass, a cloth tied over its top. */
const FIREFLY_JAR = (() => {
  const s = new Sketch(32, 32);
  s.rect(10, 22, 12, 6, fillOf(LEAVES));
  for (let x = 10; x < 22; x += 2) s.set(x, 21, lightOf(LEAVES)).set(x + 1, 20, fillOf(LEAVES));
  for (const [x, y] of [
    [13, 11],
    [18, 9],
    [15, 15],
    [20, 16],
    [11, 18],
    [17, 20],
  ] as const) {
    s.rect(x, y, 2, 2, FIRE).set(x, y, FIRE_LIGHT);
  }
  s.rect(9, 7, 14, 1, GLASS).rect(8, 8, 1, 21, GLASS).rect(23, 8, 1, 21, GLASS);
  s.rect(9, 28, 14, 1, GLASS);
  s.line(10, 10, 10, 16, GLINT);
  // The cloth lid, tied with string.
  s.rect(8, 3, 16, 4, fillOf(ROOF)).rect(8, 3, 16, 1, lightOf(ROOF));
  s.rect(7, 6, 3, 2, fillOf(ROOF)).rect(22, 6, 3, 2, fillOf(ROOF));
  s.rect(8, 6, 16, 1, LAMP);
  return finish(s);
})();

// ---- Every piece ------------------------------------------------------------------------------

const lit = (x: number, y: number, radius: number) => [{ x, y, radius }];

export const TABLETOP_ART: Record<SurfacePiece | TrinketPiece, FurnitureArt> = {
  sideTable: { source: SIDE_TABLE, palette: palette({ ...WOOD, trim: C.bark }) },
  teaTable: { source: TEA_TABLE, palette: palette({ ...WOOD, roof: C.plum, trim: C.barkDark }) },
  dresser: { source: DRESSER, palette: palette({ ...WOOD, trim: C.wood }) },
  kitchenCounter: {
    source: KITCHEN_COUNTER,
    palette: palette({ ...WOOD, wall: C.cream, roof: C.ink }),
  },
  lowShelf: {
    source: LOW_SHELF,
    palette: palette({ ...WOOD, trim: C.bark, roof: C.berry, door: C.teal, accentTwo: C.lavender }),
  },
  skullMug: { source: SKULL_MUG, palette: palette({ ...WOOD, wall: C.bone, trim: C.barkDark }) },
  spellbooks: {
    source: SPELLBOOKS,
    palette: palette({ ...WOOD, roof: C.plum, door: C.teal, leaves: C.mossDark, accent: C.berry }),
  },
  dripCandles: {
    source: DRIP_CANDLES,
    palette: palette({ ...WOOD, stone: C.silver }),
    glow: FIRE_LIT,
    lights: [...lit(15, 3, 40), ...lit(8, 10, 28)],
  },
  toadstoolLamp: {
    source: TOADSTOOL_LAMP,
    palette: palette({ ...WOOD, roof: C.scarlet, wall: C.cream, leaves: C.moss }),
    glow: FIRE_LIT,
    lights: lit(16, 14, 44),
  },
  potionBottles: {
    source: POTION_BOTTLES,
    palette: palette({
      ...WOOD,
      leaves: C.orbGreen,
      accent: C.rose,
      accentTwo: C.lavender,
      glass: C.ghost,
    }),
  },
  snowGlobe: {
    source: SNOW_GLOBE,
    palette: palette({ ...WOOD, trim: C.bark, roof: C.plum, glass: C.sky }),
  },
  hourglass: {
    source: HOURGLASS,
    palette: palette({ ...WOOD, trim: C.wood, accentTwo: C.lavender, glass: C.ghost }),
  },
  candyPail: { source: CANDY_PAIL, palette: palette({ ...WOOD, accent: C.pumpkin, door: C.teal }) },
  luckyCat: {
    source: LUCKY_CAT,
    palette: palette({ ...WOOD, wall: C.furBlack, accent: C.rose, roof: C.scarlet }),
  },
  ghostVase: {
    source: GHOST_VASE,
    palette: palette({
      ...WOOD,
      wall: C.ghost,
      leaves: C.leaf,
      accent: C.rose,
      accentTwo: C.lavender,
    }),
  },
  amethyst: {
    source: AMETHYST,
    palette: palette({ ...WOOD, stone: C.stone, accentTwo: C.lavender }),
  },
  fireflyJar: {
    source: FIREFLY_JAR,
    palette: palette({ ...WOOD, roof: C.berry, leaves: C.moss, glass: C.ghost }),
    glow: FIRE_LIT,
    lights: lit(16, 15, 36),
  },
};
