import type { FixtureId } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  buildingPalette,
  darkOf,
  DOOR,
  fillOf,
  finish,
  GLASS,
  GLASS_DARK,
  GLINT,
  INK,
  LAMP,
  LEAVES,
  lightOf,
  ROOF,
  seeded,
  shadeOf,
  STONE,
  TRIM,
  wall,
  WALL,
  WHITE,
  type Colours,
  type Material,
} from './buildings';
import { PALETTE as C } from './palette';
import type { PropLight } from './props';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * What stands in the town's buildings for good (phase H), drawn at 32 from the building kit's
 * materials, so each fixture is a shape and a palette of a few base colours, outlined softly as the
 * buildings are. A floor fixture stands with its bottom row on the front edge of its footprint and
 * rises over the wall behind it; a wall fixture fills the wall tiles it hangs on.
 */

export interface FixtureArt {
  source: SpriteSource;
  palette: Palette;
  /** Its keys that light up after dark, in their lit colours. */
  glow?: Palette;
  lights?: readonly PropLight[];
  /** For a museum case: the boxes, in its own pixels, where its critters are shown. */
  nooks?: readonly { x: number; y: number }[];
}

/** Fire, and its brightest heart: never outlined, and lit after dark. */
const FIRE = 'O';
const FIRE_LIGHT = 'N';

/** A block of a material, lit on its top-left edges and shaded on its bottom-right ones. */
function slab(s: Sketch, x: number, y: number, w: number, h: number, m: Material): void {
  s.rect(x, y, w, h, fillOf(m));
  s.bevel(fillOf(m), lightOf(m), shadeOf(m));
}

/** A palette from the kit, with fire in it. */
function palette(colours: Colours): Palette {
  return { ...buildingPalette(colours), [FIRE]: C.pumpkin, [FIRE_LIGHT]: C.candle };
}

const FIRE_LIT: Palette = { [FIRE]: C.candle, [FIRE_LIGHT]: C.candleBright };

/** Keys a fixture's many small things are painted from, fill and shade, in turn. */
const TRINKETS: readonly Material[] = [ACCENT, ACCENT_TWO, LEAVES, ROOF, DOOR];

// ---- Cobweb Corner ------------------------------------------------------------------------------

const SHOP_COUNTER = (() => {
  const s = new Sketch(96, 50);
  // The top, seen from above a little, then the panelled front.
  slab(s, 0, 18, 96, 8, TRIM);
  wall(s, 2, 26, 92, 24, 'boards', WALL, 4);
  for (const x of [2, 32, 62])
    s.rect(x + 3, 30, 24, 16, shadeOf(WALL)).rect(x + 4, 31, 22, 14, fillOf(WALL));
  s.rect(2, 26, 92, 1, darkOf(TRIM));
  // A jar of eyeball gumballs, the till, and the bell.
  s.rect(10, 4, 14, 15, GLASS).rect(10, 4, 14, 2, fillOf(STONE)).rect(12, 2, 10, 2, fillOf(STONE));
  s.set(12, 7, GLINT).set(12, 8, GLINT).set(13, 7, GLINT);
  for (const [x, y] of [
    [14, 12],
    [19, 10],
    [16, 15],
    [20, 15],
  ] as const) {
    s.rect(x, y, 3, 3, WHITE).set(x + 1, y + 1, INK);
  }
  slab(s, 40, 6, 24, 13, STONE);
  s.rect(43, 9, 18, 4, GLASS_DARK).rect(44, 10, 4, 2, fillOf(ACCENT_TWO));
  for (const x of [43, 49, 55]) s.rect(x, 15, 4, 2, lightOf(STONE));
  s.ellipse(80, 15, 5, 4, LAMP).rect(75, 17, 10, 2, fillOf(TRIM)).set(80, 10, LAMP);
  s.set(78, 13, WHITE);
  return finish(s);
})();

const GOODS_SHELF = (() => {
  const s = new Sketch(64, 80);
  slab(s, 0, 0, 64, 80, TRIM);
  const random = seeded(7);
  for (const top of [6, 30, 54]) {
    s.rect(4, top, 56, 20, darkOf(TRIM));
    slab(s, 2, top + 20, 60, 4, TRIM);
    // Jars and tins and boxes along the shelf, no two alike.
    let x = 6;
    while (x < 56) {
      const w = 6 + Math.floor(random() * 6);
      const h = 8 + Math.floor(random() * 10);
      const m = TRINKETS[Math.floor(random() * TRINKETS.length)]!;
      if (x + w > 58) break;
      if (random() < 0.35) {
        s.rect(x, top + 20 - h, w, h, GLASS).rect(x, top + 20 - h, w, 2, fillOf(m));
        s.set(x + 1, top + 23 - h, GLINT);
      } else {
        slab(s, x, top + 20 - h, w, h, m);
      }
      x += w + 1 + Math.floor(random() * 3);
    }
  }
  return finish(s);
})();

const CLOTHES_RACK = (() => {
  const s = new Sketch(64, 60);
  // Two stands and the rail between, then the clothes hung along it.
  s.rect(4, 6, 3, 50, fillOf(STONE)).rect(57, 6, 3, 50, fillOf(STONE));
  s.rect(0, 55, 12, 3, shadeOf(STONE)).rect(52, 55, 12, 3, shadeOf(STONE));
  s.rect(4, 6, 56, 3, lightOf(STONE));
  const random = seeded(11);
  for (let i = 0; i < 6; i++) {
    const x = 9 + i * 8;
    const m = TRINKETS[i % TRINKETS.length]!;
    const long = 26 + Math.floor(random() * 16);
    s.set(x + 3, 9, darkOf(STONE)).set(x + 3, 10, darkOf(STONE));
    s.rect(x, 11, 7, long, fillOf(m)).rect(x - 1, 12, 9, 5, fillOf(m));
    s.rect(x + 6, 11, 1, long, shadeOf(m)).rect(x, 11, 1, long, lightOf(m));
  }
  return finish(s);
})();

// ---- The Muse ----------------------------------------------------------------------------------

const SALON_CHAIR = (() => {
  const s = new Sketch(32, 52);
  // A chrome foot and pole, the seat, a tall rounded back, and arms.
  s.ellipse(16, 48, 10, 3, fillOf(STONE)).rect(14, 36, 4, 12, fillOf(STONE));
  s.rect(14, 36, 1, 12, lightOf(STONE));
  s.ellipse(16, 8, 9, 7, fillOf(ACCENT)).rect(7, 8, 18, 22, fillOf(ACCENT));
  s.bevel(fillOf(ACCENT), lightOf(ACCENT), shadeOf(ACCENT));
  slab(s, 4, 24, 24, 10, ACCENT);
  s.rect(2, 20, 5, 4, fillOf(STONE)).rect(25, 20, 5, 4, fillOf(STONE));
  s.rect(8, 12, 16, 1, shadeOf(ACCENT)).rect(8, 18, 16, 1, shadeOf(ACCENT));
  return finish(s);
})();

const SALON_MIRROR = (() => {
  const s = new Sketch(32, 64);
  // An oval glass in a gold frame, a shelf below with her bottles and a brush.
  s.ellipse(16, 24, 13, 20, fillOf(ACCENT_TWO)).ellipse(16, 24, 10, 17, GLASS);
  s.bevel(fillOf(ACCENT_TWO), lightOf(ACCENT_TWO), shadeOf(ACCENT_TWO));
  for (let j = 0; j < 8; j++) s.set(10 + Math.floor(j / 2), 12 + j, GLINT);
  s.set(16, 3, lightOf(ACCENT_TWO)).set(15, 3, lightOf(ACCENT_TWO));
  slab(s, 2, 50, 28, 4, TRIM);
  s.rect(5, 42, 4, 8, fillOf(ACCENT)).rect(6, 40, 2, 2, fillOf(STONE));
  s.rect(11, 44, 5, 6, fillOf(LEAVES)).rect(12, 42, 3, 2, WHITE);
  s.rect(20, 46, 9, 3, fillOf(DOOR)).rect(20, 45, 3, 1, darkOf(DOOR));
  return finish(s);
})();

const HOOD_DRYER = (() => {
  const s = new Sketch(32, 60);
  // A little chair, and over it the dryer's dome on its arm.
  slab(s, 6, 36, 20, 10, ACCENT);
  s.rect(8, 46, 3, 10, fillOf(STONE)).rect(21, 46, 3, 10, fillOf(STONE));
  s.rect(24, 12, 3, 26, fillOf(STONE)).rect(24, 12, 1, 26, lightOf(STONE));
  s.ellipse(15, 14, 12, 11, fillOf(WALL));
  s.sphere(15, 14, 12, 11, [...WALL].slice(1).join(''));
  s.rect(3, 18, 24, 7, fillOf(WALL)).rect(3, 23, 24, 2, shadeOf(WALL));
  s.rect(5, 25, 20, 3, darkOf(WALL));
  s.set(10, 8, WHITE).set(11, 8, WHITE).set(10, 9, WHITE);
  return finish(s);
})();

const WASH_BASIN = (() => {
  const s = new Sketch(32, 48);
  s.rect(12, 22, 8, 22, fillOf(STONE)).rect(12, 22, 2, 22, lightOf(STONE));
  s.ellipse(16, 20, 14, 7, fillOf(WALL)).ellipse(16, 19, 11, 4, GLASS);
  s.bevel(fillOf(WALL), lightOf(WALL), shadeOf(WALL));
  s.rect(15, 4, 3, 12, fillOf(STONE)).rect(15, 4, 8, 3, fillOf(STONE));
  s.rect(22, 7, 1, 3, lightOf(STONE));
  s.rect(4, 42, 24, 4, shadeOf(STONE));
  return finish(s);
})();

// ---- Crumbs & Curios ---------------------------------------------------------------------------

const BAKERY_COUNTER = (() => {
  const s = new Sketch(96, 56);
  // A glass case of cakes on a wooden base, a sign of prices, and a cake stand on top.
  slab(s, 0, 36, 96, 20, TRIM);
  for (const x of [4, 36, 68])
    s.rect(x, 40, 24, 12, shadeOf(TRIM)).rect(x + 1, 41, 22, 10, fillOf(TRIM));
  s.rect(2, 14, 92, 22, fillOf(STONE));
  s.rect(4, 16, 88, 18, GLASS);
  s.rect(4, 25, 88, 1, fillOf(STONE));
  for (let j = 0; j < 6; j++) s.set(6 + j, 17 + j, GLINT);
  const cakes: [number, number, Material][] = [
    [10, 19, ACCENT],
    [26, 19, ACCENT_TWO],
    [46, 19, LEAVES],
    [66, 19, ACCENT],
    [14, 28, ROOF],
    [34, 28, ACCENT],
    [58, 28, ACCENT_TWO],
    [78, 28, DOOR],
  ];
  for (const [x, y, m] of cakes) {
    s.rect(x, y + 2, 10, 4, fillOf(DOOR))
      .rect(x, y, 10, 3, fillOf(m))
      .set(x + 5, y - 1, WHITE);
    s.rect(x, y, 10, 1, lightOf(m));
  }
  s.rect(2, 13, 92, 1, lightOf(STONE));
  // A tall cake on its stand on top.
  s.rect(40, 11, 16, 2, WHITE).rect(47, 13, 2, 1, WHITE);
  s.rect(42, 2, 12, 9, fillOf(ACCENT)).rect(42, 2, 12, 2, WHITE).set(48, 0, LAMP).set(48, 1, LAMP);
  return finish(s);
})();

const BAKERY_OVEN = (() => {
  const s = new Sketch(64, 72);
  // A brick oven with a chimney up the wall, an arched mouth and the fire inside.
  wall(s, 2, 16, 60, 56, 'brick', STONE, 5);
  s.ellipse(32, 20, 30, 10, fillOf(STONE));
  wall(s, 22, 0, 20, 18, 'brick', STONE, 9);
  s.bevel(fillOf(STONE), lightOf(STONE), shadeOf(STONE));
  s.ellipse(32, 44, 16, 13, darkOf(STONE)).rect(16, 44, 32, 14, darkOf(STONE));
  s.ellipse(32, 46, 13, 10, INK).rect(19, 46, 26, 12, INK);
  s.ellipse(32, 54, 11, 4, FIRE).ellipse(32, 55, 6, 2, FIRE_LIGHT);
  s.set(26, 50, FIRE).set(38, 49, FIRE).set(31, 48, FIRE).set(32, 47, FIRE_LIGHT);
  slab(s, 12, 58, 40, 4, TRIM);
  s.rect(40, 30, 16, 3, fillOf(TRIM)).rect(52, 30, 2, 14, fillOf(TRIM));
  return finish(s);
})();

const MUSEUM_CASE = (() => {
  const s = new Sketch(64, 64);
  // A wooden cabinet with a glass front and two shelves, a label along the bottom.
  slab(s, 0, 0, 64, 64, TRIM);
  s.rect(2, 0, 60, 3, lightOf(TRIM));
  s.rect(5, 6, 54, 44, GLASS);
  s.rect(5, 27, 54, 2, fillOf(TRIM));
  for (let j = 0; j < 8; j++) s.set(7 + j, 7 + j, GLINT);
  for (let j = 0; j < 6; j++) s.set(40 + j, 30 + j, GLINT);
  s.rect(22, 54, 20, 5, fillOf(ACCENT_TWO)).rect(24, 56, 16, 1, darkOf(ACCENT_TWO));
  return finish(s);
})();

/** Where a museum case shows its critters: two a shelf, bottom-left of each 16-pixel box. */
const MUSEUM_NOOKS = [
  { x: 11, y: 10 },
  { x: 37, y: 10 },
  { x: 11, y: 32 },
  { x: 37, y: 32 },
] as const;

// ---- The neighbours' houses --------------------------------------------------------------------

const LIBRARY_SHELF = (() => {
  const s = new Sketch(64, 92);
  slab(s, 0, 0, 64, 92, TRIM);
  s.rect(0, 0, 64, 4, darkOf(TRIM)).rect(0, 2, 64, 1, lightOf(TRIM));
  const random = seeded(3);
  for (const top of [8, 30, 52, 72]) {
    s.rect(4, top, 56, 18, darkOf(TRIM));
    slab(s, 2, top + 18, 60, 3, TRIM);
    let x = 5;
    while (x < 58) {
      const w = 2 + Math.floor(random() * 3);
      const h = 11 + Math.floor(random() * 7);
      const m = TRINKETS[Math.floor(random() * TRINKETS.length)]!;
      if (x + w > 59) break;
      const leaning = random() < 0.08 && x > 8;
      if (leaning) {
        for (let k = 0; k < h; k++)
          s.rect(x + Math.floor(k / 4), top + 18 - h + k, w, 1, fillOf(m));
      } else {
        s.rect(x, top + 18 - h, w, h, fillOf(m)).rect(x + w - 1, top + 18 - h, 1, h, shadeOf(m));
        s.set(x, top + 20 - h, lightOf(m));
      }
      x += w + (leaning ? 4 : random() < 0.15 ? 2 : 0);
    }
  }
  return finish(s);
})();

const FLOWER_BUCKETS = (() => {
  const s = new Sketch(64, 48);
  // A two-step stand, a row of tin buckets on each step, and the flowers standing up out of them.
  slab(s, 0, 36, 64, 12, TRIM);
  slab(s, 4, 26, 56, 10, TRIM);
  const random = seeded(5);
  const bucket = (x: number, bottom: number, m: Material) => {
    for (let k = 0; k < 6; k++) {
      const fx = x + 1 + Math.floor(random() * 8);
      const fy = bottom - 14 - Math.floor(random() * 8);
      s.rect(fx, fy + 2, 1, bottom - fy - 4, fillOf(LEAVES));
      s.ellipse(fx + 0.5, fy + 1, 2, 2, random() < 0.5 ? fillOf(m) : lightOf(m));
    }
    slab(s, x, bottom - 8, 10, 8, STONE);
  };
  bucket(8, 26, ACCENT);
  bucket(22, 26, ACCENT_TWO);
  bucket(36, 26, ROOF);
  bucket(2, 36, ACCENT_TWO);
  bucket(18, 36, ACCENT);
  bucket(34, 36, DOOR);
  bucket(50, 36, ACCENT);
  return finish(s);
})();

const BIG_CAULDRON = (() => {
  const s = new Sketch(64, 50);
  // A fire of logs under a great iron pot, and its brew bubbling over the brim.
  s.ellipse(32, 45, 18, 4, FIRE).ellipse(32, 46, 10, 2, FIRE_LIGHT);
  s.rect(16, 45, 32, 3, fillOf(TRIM)).rect(20, 47, 24, 2, shadeOf(TRIM));
  s.sphere(32, 28, 26, 18, [...STONE].slice(1).join(''));
  s.ellipse(32, 14, 26, 6, darkOf(STONE)).ellipse(32, 14, 22, 4, fillOf(LEAVES));
  s.ellipse(28, 13, 3, 2, lightOf(LEAVES)).ellipse(38, 15, 2, 1.5, lightOf(LEAVES));
  s.ellipse(34, 6, 3, 3, fillOf(LEAVES)).ellipse(24, 3, 2, 2, fillOf(LEAVES));
  s.set(33, 5, WHITE).set(24, 2, WHITE);
  return finish(s);
})();

const POTTING_BENCH = (() => {
  const s = new Sketch(64, 56);
  // A slatted bench on legs with a shelf under, pots and seedlings on top, a trowel.
  wall(s, 0, 24, 64, 6, 'boards', TRIM, 2);
  s.rect(0, 24, 64, 1, lightOf(TRIM));
  s.rect(3, 30, 4, 24, fillOf(TRIM)).rect(57, 30, 4, 24, fillOf(TRIM));
  slab(s, 3, 42, 58, 3, TRIM);
  const random = seeded(9);
  for (let i = 0; i < 5; i++) {
    const x = 4 + i * 12;
    const h = 7 + Math.floor(random() * 3);
    slab(s, x, 24 - h, 9, h, ACCENT);
    s.rect(x - 1, 24 - h, 11, 2, lightOf(ACCENT));
    const top = 24 - h;
    s.rect(x + 4, top - 7, 1, 7, fillOf(LEAVES));
    s.ellipse(x + 2.5, top - 5, 2.5, 1.5, fillOf(LEAVES)).ellipse(
      x + 6.5,
      top - 8,
      2.5,
      1.5,
      lightOf(LEAVES),
    );
  }
  for (let i = 0; i < 3; i++) slab(s, 10 + i * 16, 34, 10, 8, ACCENT);
  s.rect(46, 48, 10, 2, fillOf(STONE)).rect(40, 48, 6, 2, fillOf(DOOR));
  return finish(s);
})();

const PIPE_ORGAN = (() => {
  const s = new Sketch(96, 100);
  // A case of dark wood, its pipes rising in a fan, and the keys with a candle either side.
  slab(s, 4, 40, 88, 60, TRIM);
  const lengths = [22, 27, 32, 36, 39, 40, 39, 36, 32, 27, 22];
  lengths.forEach((length, i) => {
    const x = 8 + i * 7 + (i > 5 ? 2 : 0);
    const top = 42 - length;
    s.rect(x, top, 5, length, fillOf(STONE));
    s.rect(x, top, 1, length, lightOf(STONE)).rect(x + 4, top, 1, length, shadeOf(STONE));
    s.ellipse(x + 2.5, top, 2.5, 1.5, darkOf(STONE));
    s.rect(x + 1, top + length - 12, 3, 2, INK);
  });
  s.rect(10, 70, 76, 8, WHITE);
  for (let x = 12; x < 84; x += 5) s.rect(x, 70, 3, 4, INK);
  s.rect(8, 78, 80, 3, fillOf(TRIM)).rect(8, 78, 80, 1, lightOf(TRIM));
  s.rect(10, 84, 76, 12, shadeOf(TRIM)).rect(12, 86, 72, 8, fillOf(ACCENT));
  s.rect(2, 60, 3, 10, WHITE).set(3, 58, FIRE_LIGHT).set(3, 59, FIRE);
  s.rect(91, 60, 3, 10, WHITE).set(92, 58, FIRE_LIGHT).set(92, 59, FIRE);
  return finish(s);
})();

const WOOD = { wall: C.cream, roof: C.plum, trim: C.bark, door: C.berry } as const;

export const FIXTURE_ART: Record<FixtureId, FixtureArt> = {
  shopCounter: {
    source: SHOP_COUNTER,
    palette: palette({
      ...WOOD,
      wall: C.teal,
      trim: C.wood,
      accentTwo: C.orbGreen,
      glass: C.ghost,
    }),
  },
  goodsShelf: {
    source: GOODS_SHELF,
    palette: palette({ ...WOOD, trim: C.wood, accent: C.pumpkin, accentTwo: C.lavender }),
  },
  clothesRack: {
    source: CLOTHES_RACK,
    palette: palette({ ...WOOD, stone: C.silver, accent: C.rose, accentTwo: C.sky }),
  },
  salonChair: {
    source: SALON_CHAIR,
    palette: palette({ ...WOOD, stone: C.silver, accent: C.rose }),
  },
  salonMirror: {
    source: SALON_MIRROR,
    palette: palette({
      ...WOOD,
      trim: C.cream,
      accent: C.rose,
      accentTwo: C.gold,
      leaves: C.teal,
      glass: C.sky,
    }),
  },
  hoodDryer: {
    source: HOOD_DRYER,
    palette: palette({ ...WOOD, wall: C.roseLight, stone: C.silver, accent: C.rose }),
  },
  washBasin: {
    source: WASH_BASIN,
    palette: palette({ ...WOOD, wall: C.white, stone: C.silver, glass: C.sky }),
  },
  bakeryCounter: {
    source: BAKERY_COUNTER,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      stone: C.silver,
      door: C.cream,
      accent: C.rose,
      accentTwo: C.lavender,
      leaves: C.orbGreenLight,
      glass: C.sky,
    }),
  },
  bakeryOven: {
    source: BAKERY_OVEN,
    palette: palette({ ...WOOD, stone: C.berry, trim: C.iron }),
    glow: FIRE_LIT,
    lights: [{ x: 32, y: 52, radius: 40 }],
  },
  museumCase: {
    source: MUSEUM_CASE,
    palette: palette({ ...WOOD, trim: C.bark, accentTwo: C.gold, glass: C.ghost }),
    nooks: MUSEUM_NOOKS,
  },
  libraryShelf: {
    source: LIBRARY_SHELF,
    palette: palette({
      ...WOOD,
      trim: C.bark,
      accent: C.blueFabric,
      accentTwo: C.maroon,
      leaves: C.moss,
      roof: C.plum,
      door: C.gold,
    }),
  },
  flowerBuckets: {
    source: FLOWER_BUCKETS,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      stone: C.silver,
      accent: C.scarlet,
      accentTwo: C.rose,
      roof: C.lavender,
      door: C.cream,
    }),
  },
  bigCauldron: {
    source: BIG_CAULDRON,
    palette: palette({ ...WOOD, stone: C.iron, trim: C.bark, leaves: C.orbGreen }),
    glow: { [FIRE]: C.candle, [fillOf(LEAVES)]: C.orbGreenLight, [lightOf(LEAVES)]: C.white },
    lights: [{ x: 32, y: 14, radius: 36 }],
  },
  pottingBench: {
    source: POTTING_BENCH,
    palette: palette({ ...WOOD, trim: C.wood, accent: C.pumpkinDark, stone: C.silver }),
  },
  pipeOrgan: {
    source: PIPE_ORGAN,
    palette: palette({ ...WOOD, trim: C.barkDark, stone: C.gold, accent: C.maroon }),
    glow: FIRE_LIT,
    lights: [
      { x: 3, y: 58, radius: 20 },
      { x: 92, y: 58, radius: 20 },
    ],
  },
};
