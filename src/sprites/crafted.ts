import type { FurnitureId } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  DOOR,
  fillOf,
  finish,
  GLASS,
  GLASS_DARK,
  GLINT,
  INK,
  LEAVES,
  lightOf,
  ROOF,
  seeded,
  shadeOf,
  STONE,
  TRIM,
  WALL,
  WHITE,
  type Material,
} from './buildings';
import type { FurnitureArt } from './furniture';
import {
  ball,
  bevelIn,
  column,
  FIRE,
  FIRE_LIGHT,
  FIRE_LIT,
  frame,
  palette,
  slab,
  WOOD,
} from './furnish';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * The workbench, and what she makes at it (phase 8), at 32 (phase J). Nothing here turns but by
 * mirroring, so each is drawn once, facing her.
 */

const WORKBENCH = (() => {
  const s = new Sketch(64, 46);
  // A pegboard of tools behind, a thick top, legs, a shelf of planks, and her bits on top.
  slab(s, 6, 0, 52, 16, TRIM);
  for (let j = 3; j < 14; j += 4) for (let i = 9; i < 56; i += 4) s.set(i, j, darkOf(TRIM));
  s.rect(12, 3, 2, 9, fillOf(STONE)).rect(10, 3, 6, 3, fillOf(STONE));
  s.rect(22, 4, 2, 9, fillOf(TRIM)).rect(21, 3, 4, 2, darkOf(STONE));
  s.rect(44, 3, 10, 2, fillOf(STONE)).rect(44, 5, 2, 6, fillOf(DOOR));
  for (let k = 0; k < 8; k++) s.set(46 + k, 5, darkOf(STONE));
  s.ellipse(33, 8, 4, 4, fillOf(ROOF)).ellipse(33, 8, 1.5, 1.5, darkOf(ROOF));
  slab(s, 0, 20, 64, 6, TRIM);
  s.rect(0, 20, 64, 1, lightOf(TRIM));
  for (const x of [3, 56]) slab(s, x, 26, 5, 20, TRIM);
  slab(s, 8, 36, 48, 3, TRIM);
  for (const [x, w] of [
    [10, 14],
    [26, 18],
  ] as const)
    slab(s, x, 32, w, 4, DOOR);
  // A jar of beads, a spool of thread, and a bracelet she's halfway through.
  s.rect(8, 10, 10, 10, GLASS).rect(8, 9, 10, 2, fillOf(STONE));
  const beads: Material[] = [ACCENT, ACCENT_TWO, LEAVES, ROOF];
  const random = seeded(6);
  for (let k = 0; k < 9; k++) {
    s.set(9 + Math.floor(random() * 8), 13 + Math.floor(random() * 6), fillOf(beads[k % 4]!));
  }
  s.set(9, 12, GLINT);
  slab(s, 40, 14, 7, 6, ACCENT);
  s.rect(39, 14, 9, 1, darkOf(TRIM)).rect(39, 19, 9, 1, darkOf(TRIM));
  for (let k = 0; k < 7; k++) {
    s.set(24 + k * 2, 18 - Math.round(Math.sin(k / 2) * 1), fillOf(beads[k % 4]!));
    s.set(25 + k * 2, 18 - Math.round(Math.sin(k / 2) * 1), fillOf(STONE));
  }
  s.rect(52, 17, 8, 3, fillOf(STONE)).rect(56, 15, 2, 2, fillOf(DOOR));
  return finish(s);
})();

const STUMP_STOOL = (() => {
  const s = new Sketch(32, 30);
  // A stump with its rings on top, bark down its sides and roots at its foot.
  s.rect(4, 8, 24, 16, fillOf(TRIM));
  for (let x = 5; x < 28; x += 3) s.rect(x, 12, 1, 12, shadeOf(TRIM));
  s.rect(4, 8, 2, 16, lightOf(TRIM)).rect(26, 8, 2, 16, darkOf(TRIM));
  s.ellipse(8, 25, 5, 3, fillOf(TRIM)).ellipse(24, 25, 5, 3, shadeOf(TRIM));
  s.ellipse(16, 26, 7, 3, fillOf(TRIM));
  s.ellipse(16, 8, 12, 5, fillOf(DOOR)).ellipse(16, 8, 8, 3, lightOf(DOOR));
  s.ellipse(16, 8, 5, 2, fillOf(DOOR)).ellipse(16, 8, 2, 1, shadeOf(DOOR));
  return finish(s);
})();

const JACK_O_LANTERN = (() => {
  const s = new Sketch(32, 32);
  // A pumpkin she grew, carved with a friendly face that lights up after dark.
  ball(s, 16, 19, 15, 12, ACCENT);
  for (const x of [9, 16, 23])
    column(s, x, 9, 20, (j) => (j > 1 && j < 18 ? 1 : 0), shadeOf(ACCENT));
  s.rect(15, 3, 3, 6, fillOf(LEAVES)).line(18, 4, 21, 2, fillOf(LEAVES));
  for (const x of [9, 20]) {
    s.set(x + 1, 13, INK);
    s.rect(x, 14, 3, 1, INK).rect(x - 1, 15, 5, 2, INK);
  }
  s.rect(10, 21, 12, 3, INK).rect(12, 24, 8, 1, INK);
  s.set(13, 21, fillOf(ACCENT)).set(18, 21, fillOf(ACCENT)).set(15, 24, fillOf(ACCENT));
  return finish(s);
})();

const ROSE_VASE = (() => {
  const s = new Sketch(32, 42);
  // A round stone vase, and roses standing up out of it among their leaves.
  const rose = (cx: number, cy: number) => {
    ball(s, cx, cy, 3.5, 3, ACCENT);
    s.set(cx - 1, cy - 1, darkOf(ACCENT))
      .set(cx, cy, darkOf(ACCENT))
      .set(cx + 1, cy - 1, darkOf(ACCENT));
  };
  for (const [x, y] of [
    [9, 10],
    [16, 4],
    [23, 9],
    [12, 16],
    [21, 17],
  ] as const) {
    s.line(16, 28, x, y, darkOf(LEAVES));
  }
  for (const [x, y] of [
    [7, 18],
    [25, 14],
    [11, 23],
    [22, 23],
  ] as const) {
    s.ellipse(x, y, 3, 1.5, fillOf(LEAVES)).set(x - 1, y - 1, lightOf(LEAVES));
  }
  rose(9, 10);
  rose(16, 4);
  rose(23, 9);
  rose(12, 16);
  rose(21, 17);
  ball(s, 16, 34, 9, 8, STONE);
  s.rect(11, 25, 10, 3, fillOf(STONE)).rect(10, 25, 12, 1, lightOf(STONE));
  s.rect(12, 40, 8, 2, shadeOf(STONE));
  return finish(s);
})();

const PRESSED_FLOWERS = (() => {
  const s = new Sketch(32, 32);
  // Flowers pressed flat on cream paper, in a plain wooden frame.
  frame(s, 1, 1, 30, 30, TRIM, 3);
  s.rect(4, 4, 24, 24, fillOf(WALL));
  const flower = (x: number, y: number, m: Material, stem: number) => {
    s.line(x, y + 2, x + (stem > 0 ? 1 : -1), y + 2 + Math.abs(stem), fillOf(LEAVES));
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ] as const)
      s.set(x + dx, y + dy, fillOf(m));
    s.set(x, y, lightOf(ACCENT_TWO));
  };
  flower(9, 8, ROOF, 12);
  flower(16, 11, ACCENT, -9);
  flower(22, 7, DOOR, 14);
  flower(12, 17, WALL, 6);
  s.set(12, 17, lightOf(ACCENT_TWO)).set(11, 17, WHITE).set(13, 17, WHITE);
  s.set(12, 16, WHITE).set(12, 18, WHITE);
  s.ellipse(20, 21, 2, 1, fillOf(LEAVES)).ellipse(8, 22, 2, 1, fillOf(LEAVES));
  return finish(s);
})();

const STONE_HEARTH = (() => {
  const s = new Sketch(64, 50);
  // A fireplace of round stones, a wooden mantel along its top, logs and a fire in its mouth.
  s.rect(4, 8, 56, 42, fillOf(STONE));
  const random = seeded(2);
  for (let y = 9; y < 50; y += 6) {
    let x = 4 + ((y / 6) % 2) * 4;
    while (x < 60) {
      const w = 6 + Math.floor(random() * 5);
      s.ellipse(x + w / 2, y + 2.5, w / 2, 3, random() < 0.3 ? lightOf(STONE) : fillOf(STONE));
      s.rect(x, y + 5, w, 1, shadeOf(STONE));
      x += w + 1;
    }
  }
  bevelIn(s, 4, 8, 56, 42, STONE);
  slab(s, 0, 4, 64, 6, TRIM);
  s.rect(2, 10, 60, 1, darkOf(TRIM));
  // The mouth, dark inside, then the logs and the fire.
  s.ellipse(32, 30, 17, 12, darkOf(STONE)).rect(15, 30, 34, 18, darkOf(STONE));
  s.ellipse(32, 31, 15, 10, INK).rect(17, 31, 30, 17, INK);
  s.ellipse(32, 38, 10, 7, FIRE).ellipse(32, 41, 6, 4, FIRE_LIGHT);
  s.set(26, 32, FIRE).set(37, 31, FIRE).set(31, 29, FIRE).set(33, 34, FIRE_LIGHT);
  slab(s, 20, 44, 24, 4, DOOR);
  s.rect(22, 42, 20, 2, fillOf(DOOR)).set(22, 42, lightOf(DOOR));
  // A little candle and a pumpkin on the mantel.
  ball(s, 12, 1, 4, 3, ACCENT);
  s.rect(50, 0, 3, 4, WHITE);
  return finish(s);
})();

const MOONFLOWER_LAMP = (() => {
  const s = new Sketch(32, 46);
  // A stone foot, a green stem with a leaf, and a moonflower bloom for a shade.
  s.ellipse(16, 43, 8, 3, fillOf(STONE)).rect(8, 43, 16, 1, shadeOf(STONE));
  s.rect(15, 16, 3, 27, fillOf(LEAVES)).rect(15, 16, 1, 27, lightOf(LEAVES));
  s.ellipse(22, 28, 5, 2, fillOf(LEAVES)).line(18, 29, 25, 27, darkOf(LEAVES));
  s.ellipse(10, 34, 4, 1.5, fillOf(LEAVES));
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    s.ellipse(16 + Math.cos(a) * 7, 10 + Math.sin(a) * 5, 6, 5, fillOf(WALL));
  }
  bevelIn(s, 0, 0, 32, 18, WALL);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    s.line(
      16,
      10,
      Math.round(16 + Math.cos(a) * 10),
      Math.round(10 + Math.sin(a) * 7),
      shadeOf(WALL),
    );
  }
  s.ellipse(16, 10, 3, 2.5, lightOf(ACCENT_TWO));
  return finish(s);
})();

const CANDY_CORN_WREATH = (() => {
  const s = new Sketch(32, 32);
  // A ring of candy corn, tips out, with a plum bow at the bottom.
  s.ellipse(16, 16, 13, 13, fillOf(TRIM)).ellipse(16, 16, 7, 7, '.');
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const cx = 16 + Math.cos(a) * 10;
    const cy = 16 + Math.sin(a) * 10;
    for (let t = 0; t < 7; t++) {
      const r = 3 - t * 0.4;
      const x = Math.round(cx + Math.cos(a) * (t - 3));
      const y = Math.round(cy + Math.sin(a) * (t - 3));
      const key = t < 2 ? fillOf(ACCENT_TWO) : t < 5 ? fillOf(ACCENT) : WHITE;
      s.ellipse(x + 0.5, y + 0.5, Math.max(0.8, r), Math.max(0.8, r), key);
    }
  }
  s.ellipse(12, 27, 3, 2.5, fillOf(ROOF)).ellipse(20, 27, 3, 2.5, fillOf(ROOF));
  s.rect(15, 26, 3, 3, shadeOf(ROOF))
    .line(14, 29, 12, 31, fillOf(ROOF))
    .line(18, 29, 20, 31, fillOf(ROOF));
  return finish(s);
})();

const HOSTA_PLANTER = (() => {
  const s = new Sketch(32, 36);
  // A wooden planter of hostas, broad blue leaves with cream edges fanning up and out.
  const leaf = (cx: number, cy: number, rx: number, ry: number) => {
    s.ellipse(cx, cy, rx, ry, fillOf(WALL));
    s.ellipse(cx, cy, rx - 1, ry - 1, fillOf(LEAVES));
    s.ellipse(cx - 1, cy - 1, rx / 2, ry / 2, lightOf(LEAVES));
    s.line(
      Math.round(cx),
      Math.round(cy - ry + 2),
      Math.round(cx),
      Math.round(cy + ry - 1),
      shadeOf(LEAVES),
    );
  };
  leaf(8, 14, 6, 8);
  leaf(24, 14, 6, 8);
  leaf(12, 8, 5, 7);
  leaf(21, 7, 5, 7);
  leaf(16, 14, 6, 9);
  slab(s, 3, 22, 26, 13, TRIM);
  for (const y of [26, 30]) s.rect(4, y, 24, 1, darkOf(TRIM));
  return finish(s);
})();

const LITTLE_GARGOYLE = (() => {
  const s = new Sketch(32, 44);
  // A little stone gargoyle sitting up on a plinth, wings folded, horns, and a big-eyed grin.
  slab(s, 3, 34, 26, 9, STONE);
  s.rect(3, 34, 26, 2, lightOf(STONE));
  for (const side of [-1, 1]) {
    for (let k = 0; k < 6; k++)
      s.rect(16 + side * (8 + k) - (side < 0 ? 0 : 0), 12 + k * 2, 1, 16 - k * 2, fillOf(DOOR));
  }
  ball(s, 16, 26, 8, 8, DOOR);
  s.rect(10, 30, 4, 4, fillOf(DOOR)).rect(18, 30, 4, 4, fillOf(DOOR));
  ball(s, 16, 13, 9, 8, DOOR);
  s.line(9, 7, 7, 1, fillOf(DOOR)).line(10, 6, 8, 2, fillOf(DOOR));
  s.line(23, 7, 25, 1, fillOf(DOOR)).line(22, 6, 24, 2, fillOf(DOOR));
  s.ellipse(12.5, 13, 2.5, 2.5, WHITE).ellipse(19.5, 13, 2.5, 2.5, WHITE);
  s.rect(13, 13, 2, 2, INK).rect(19, 13, 2, 2, INK);
  s.rect(12, 18, 8, 1, darkOf(DOOR)).set(13, 19, WHITE).set(18, 19, WHITE);
  return finish(s);
})();

const BLUE_ROSE_DOME = (() => {
  const s = new Sketch(32, 44);
  // A glass dome on a wooden base, and under it a single blue rose that glows after dark.
  s.ellipse(16, 17, 11, 15, GLASS).rect(5, 17, 22, 18, GLASS);
  s.ellipse(16, 1.5, 2, 2, GLASS_DARK);
  s.rect(15, 16, 2, 18, fillOf(LEAVES));
  s.ellipse(11, 24, 4, 1.5, fillOf(LEAVES)).ellipse(21, 20, 4, 1.5, fillOf(LEAVES));
  s.ellipse(20, 32, 3, 1, fillOf(LEAVES));
  ball(s, 16, 12, 6, 5.5, ACCENT);
  s.line(13, 11, 16, 9, darkOf(ACCENT)).line(16, 9, 19, 12, darkOf(ACCENT));
  s.set(16, 13, darkOf(ACCENT)).set(15, 12, darkOf(ACCENT));
  for (let j = 0; j < 9; j++) s.set(8 + Math.floor(j / 3), 8 + j, GLINT);
  slab(s, 2, 34, 28, 4, TRIM);
  slab(s, 4, 38, 24, 5, TRIM);
  return finish(s);
})();

const PEPPER_GARLAND = (() => {
  const s = new Sketch(64, 32);
  // Ghost peppers strung along a rope, pale and smiling, glowing a little after dark.
  const sagAt = (x: number) => Math.round(3 + Math.sin(((x - 2) / 60) * Math.PI) * 8);
  for (let x = 2; x < 62; x++) s.set(x, sagAt(x), fillOf(TRIM));
  for (const [x, drop] of [
    [9, 0],
    [20, 2],
    [32, 1],
    [44, 2],
    [55, 0],
  ] as const) {
    const y = sagAt(x) + 1;
    s.rect(x - 1, y, 3, 2, fillOf(LEAVES));
    column(
      s,
      x,
      y + 2,
      13 + drop,
      (j) => (j < 9 + drop ? 6 : 6 - (j - 9 - drop) * 1.5),
      fillOf(WALL),
    );
    bevelIn(s, x - 4, y + 2, 8, 14 + drop, WALL);
    s.set(x - 1, y + 6, INK)
      .set(x + 1, y + 6, INK)
      .set(x, y + 8, INK);
  }
  return finish(s);
})();

export const CRAFTED_ART: Record<
  Extract<
    FurnitureId,
    | 'workbench'
    | 'stumpStool'
    | 'jackOLantern'
    | 'roseVase'
    | 'pressedFlowers'
    | 'stoneHearth'
    | 'moonflowerLamp'
    | 'candyCornWreath'
    | 'hostaPlanter'
    | 'littleGargoyle'
    | 'blueRoseDome'
    | 'pepperGarland'
  >,
  FurnitureArt
> = {
  workbench: {
    source: WORKBENCH,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      door: C.bark,
      stone: C.iron,
      roof: C.rope,
      accent: C.rose,
      accentTwo: C.gold,
      leaves: C.sky,
      glass: C.ghost,
    }),
  },
  stumpStool: {
    source: STUMP_STOOL,
    palette: palette({ ...WOOD, trim: C.bark, door: C.wood }),
  },
  jackOLantern: {
    source: JACK_O_LANTERN,
    palette: palette({ ...WOOD, accent: C.pumpkin, leaves: C.moss }),
    glow: { [INK]: C.candle },
    lights: [{ x: 16, y: 19, radius: 32 }],
  },
  roseVase: {
    source: ROSE_VASE,
    palette: palette({ ...WOOD, accent: C.scarlet, leaves: C.leaf, stone: C.stone }),
  },
  pressedFlowers: {
    source: PRESSED_FLOWERS,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      wall: C.cream,
      roof: C.lavender,
      accent: C.sky,
      door: C.rose,
      accentTwo: C.candle,
      leaves: C.leaf,
    }),
  },
  stoneHearth: {
    source: STONE_HEARTH,
    palette: palette({ ...WOOD, stone: C.stone, trim: C.wood, door: C.bark, accent: C.pumpkin }),
    glow: FIRE_LIT,
    lights: [{ x: 32, y: 36, radius: 68 }],
  },
  moonflowerLamp: {
    source: MOONFLOWER_LAMP,
    palette: palette({
      ...WOOD,
      wall: C.ghost,
      leaves: C.leaf,
      stone: C.stone,
      accentTwo: C.candle,
    }),
    glow: {
      [shadeOf(WALL)]: C.ghost,
      [fillOf(WALL)]: C.ghost,
      [lightOf(WALL)]: C.white,
      [lightOf(ACCENT_TWO)]: C.candleBright,
    },
    lights: [{ x: 16, y: 10, radius: 48 }],
  },
  candyCornWreath: {
    source: CANDY_CORN_WREATH,
    palette: palette({
      ...WOOD,
      trim: C.leafDark,
      accent: C.pumpkin,
      accentTwo: C.gold,
      roof: C.plumLight,
    }),
  },
  hostaPlanter: {
    source: HOSTA_PLANTER,
    palette: palette({ ...WOOD, trim: C.wood, wall: C.hostaCream, leaves: C.hostaBlue }),
  },
  littleGargoyle: {
    source: LITTLE_GARGOYLE,
    palette: palette({ ...WOOD, door: C.stone, stone: C.stoneDark }),
  },
  blueRoseDome: {
    source: BLUE_ROSE_DOME,
    palette: palette({
      ...WOOD,
      accent: C.blueFabric,
      leaves: C.leaf,
      trim: C.wood,
      glass: C.lavender,
    }),
    glow: {
      [shadeOf(ACCENT)]: C.blueFabric,
      [fillOf(ACCENT)]: C.sky,
      [lightOf(ACCENT)]: C.ghost,
    },
    lights: [{ x: 16, y: 12, radius: 28 }],
  },
  pepperGarland: {
    source: PEPPER_GARLAND,
    palette: palette({ ...WOOD, trim: C.rope, wall: C.silver, leaves: C.leaf }),
    glow: { [fillOf(WALL)]: C.ghost, [lightOf(WALL)]: C.candleBright },
    lights: [
      { x: 9, y: 10, radius: 20 },
      { x: 32, y: 14, radius: 20 },
      { x: 55, y: 10, radius: 20 },
    ],
  },
};
