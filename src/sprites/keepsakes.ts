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
  shadeOf,
  STONE,
  TRIM,
  WALL,
  WHITE,
  type Material,
} from './buildings';
import type { FurnitureArt } from './furniture';
import { ball, bat, bevelIn, candle, column, FIRE_LIT, palette, slab, WOOD } from './furnish';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * The keepsakes in her neighbours' houses (phase H), two in each, at 32 (phase J): Maude's candles
 * and reading chair, Rufus's roses and rug, Agatha's potions and lamp, Barty's seedlings and
 * skull, Cody's settee and window, and Wrapunzel's cupcakes and teapot.
 */

type Keepsake = Extract<
  FurnitureId,
  | 'floatingCandles'
  | 'wingbackChair'
  | 'roseBucket'
  | 'pawPrintRug'
  | 'potionShelf'
  | 'witchHatLamp'
  | 'seedlingTray'
  | 'skullPlanter'
  | 'velvetSettee'
  | 'stainedGlass'
  | 'cupcakeTower'
  | 'mummyTeapot'
>;

const FLOATING_CANDLES = (() => {
  const s = new Sketch(32, 32);
  // Three candles hanging in the air at their own heights, a drip down each.
  candle(s, 4, 3, 14, 4);
  candle(s, 14, 9, 14, 4);
  candle(s, 24, 5, 12, 4);
  s.set(4, 13, WHITE).set(4, 14, WHITE).set(17, 18, WHITE).set(27, 14, WHITE);
  return finish(s);
})();

const WINGBACK_CHAIR = (() => {
  const s = new Sketch(32, 44);
  // A tall buttoned back with its wings, a deep seat, rolled arms, and turned wooden feet.
  s.ellipse(16, 8, 11, 7, fillOf(ACCENT)).rect(5, 8, 22, 22, fillOf(ACCENT));
  bevelIn(s, 0, 0, 32, 30, ACCENT);
  for (const [x, y] of [
    [11, 10],
    [16, 8],
    [21, 10],
    [11, 17],
    [16, 15],
    [21, 17],
  ] as const)
    s.set(x, y, darkOf(ACCENT));
  s.rect(2, 12, 5, 16, fillOf(ACCENT)).rect(25, 12, 5, 16, fillOf(ACCENT));
  s.rect(2, 12, 5, 1, lightOf(ACCENT)).rect(25, 12, 5, 1, lightOf(ACCENT));
  s.rect(6, 12, 1, 16, shadeOf(ACCENT)).rect(25, 12, 1, 16, shadeOf(ACCENT));
  slab(s, 6, 25, 20, 5, ACCENT);
  s.ellipse(4.5, 26, 3.5, 3, fillOf(ACCENT)).ellipse(27.5, 26, 3.5, 3, fillOf(ACCENT));
  s.ellipse(4, 25, 1.5, 1.5, lightOf(ACCENT)).ellipse(27, 25, 1.5, 1.5, lightOf(ACCENT));
  slab(s, 2, 30, 28, 8, ACCENT);
  s.rect(3, 37, 26, 1, darkOf(ACCENT));
  for (const x of [4, 25]) s.rect(x, 38, 3, 5, fillOf(TRIM)).set(x, 38, lightOf(TRIM));
  return finish(s);
})();

const ROSE_BUCKET = (() => {
  const s = new Sketch(32, 38);
  // A tin bucket with its handle, full to the brim with red and pink roses.
  s.line(5, 18, 9, 6, fillOf(STONE))
    .line(27, 18, 23, 6, fillOf(STONE))
    .rect(9, 5, 15, 1, fillOf(STONE));
  const rose = (cx: number, cy: number, m: Material) => {
    s.ellipse(cx, cy, 4, 3.5, fillOf(m)).ellipse(cx - 1, cy - 1, 2, 1.5, lightOf(m));
    s.set(cx - 1, cy, shadeOf(m))
      .set(cx, cy - 1, shadeOf(m))
      .set(cx + 1, cy, shadeOf(m));
  };
  for (const [x, y] of [
    [6, 17],
    [26, 16],
    [16, 9],
  ] as const)
    s.ellipse(x, y, 3.5, 2, fillOf(LEAVES));
  rose(10, 12, ACCENT);
  rose(22, 12, ACCENT_TWO);
  rose(16, 15, ACCENT);
  rose(7, 19, ACCENT_TWO);
  rose(25, 19, ACCENT);
  rose(16, 7, ACCENT_TWO);
  column(s, 16, 20, 17, (j) => 24 - j * 0.35, fillOf(STONE));
  bevelIn(s, 0, 20, 32, 17, STONE);
  s.rect(4, 20, 24, 2, lightOf(STONE));
  for (const y of [25, 31]) column(s, 16, y, 1, () => 22 - (y - 20) * 0.35, shadeOf(STONE));
  return finish(s);
})();

const PAW_PRINT_RUG = (() => {
  const s = new Sketch(64, 32);
  // An oval rug of cream with a border, and paw prints wandering across it.
  s.ellipse(32, 16, 31, 15, fillOf(TRIM)).ellipse(32, 16, 28, 12, fillOf(WALL));
  s.ellipse(32, 16, 26, 10, lightOf(WALL)).ellipse(32, 16.5, 25.5, 9.5, fillOf(WALL));
  const paw = (x: number, y: number) => {
    s.ellipse(x + 0.5, y + 1, 2.5, 2, fillOf(TRIM));
    for (const [dx, dy] of [
      [-2, -2],
      [0, -3],
      [2, -2],
    ] as const)
      s.set(x + dx, y + dy, fillOf(TRIM)).set(x + dx + 1, y + dy, fillOf(TRIM));
  };
  for (const [x, y] of [
    [12, 17],
    [20, 12],
    [28, 19],
    [36, 13],
    [44, 20],
    [52, 14],
  ] as const)
    paw(x, y);
  return finish(s);
})();

const POTION_SHELF = (() => {
  const s = new Sketch(32, 32);
  // A little shelf of three potions, each its own glowing colour, corked.
  slab(s, 1, 24, 30, 4, TRIM);
  for (const x of [4, 26])
    s.line(x, 28, x + 2, 30, darkOf(TRIM)).line(x + 1, 28, x + 2, 29, darkOf(TRIM));
  const bottle = (x: number, w: number, h: number, m: Material, round: boolean) => {
    const bottom = 24;
    if (round) s.ellipse(x + w / 2, bottom - h / 2 + 1, w / 2, h / 2, GLASS);
    else s.rect(x, bottom - h + 3, w, h - 3, GLASS);
    s.rect(x + w / 2 - 1, bottom - h - 2, 3, 5, GLASS).rect(
      x + w / 2 - 1,
      bottom - h - 4,
      3,
      2,
      fillOf(TRIM),
    );
    s.rect(x + 1, bottom - Math.floor(h * 0.6), w - 2, Math.floor(h * 0.6) - 1, fillOf(m));
    s.set(x + 1, bottom - h + 4, GLINT);
  };
  bottle(3, 8, 11, ACCENT, true);
  bottle(13, 6, 15, LEAVES, false);
  bottle(21, 8, 10, ROOF, true);
  return finish(s);
})();

const WITCH_HAT_LAMP = (() => {
  const s = new Sketch(32, 58);
  // A lamp whose shade is a witch's hat, bent at the tip, with a gold buckle and a glow beneath.
  s.ellipse(16, 55, 9, 3, fillOf(STONE)).rect(7, 55, 18, 1, shadeOf(STONE));
  s.rect(15, 28, 3, 27, fillOf(STONE)).rect(15, 28, 1, 27, lightOf(STONE));
  s.ellipse(16, 28, 7, 2, lightOf(ACCENT_TWO));
  column(s, 14, 4, 22, (j) => 2 + j * 0.75, fillOf(ROOF));
  s.line(12, 4, 16, 1, fillOf(ROOF))
    .line(13, 4, 17, 1, fillOf(ROOF))
    .rect(17, 1, 3, 2, fillOf(ROOF));
  bevelIn(s, 0, 0, 32, 26, ROOF);
  s.ellipse(15, 26, 15, 3, fillOf(ROOF)).rect(1, 26, 29, 1, shadeOf(ROOF));
  s.rect(6, 21, 17, 3, fillOf(ACCENT))
    .rect(12, 20, 5, 5, fillOf(ACCENT_TWO))
    .rect(13, 21, 3, 3, fillOf(ACCENT));
  return finish(s);
})();

const SEEDLING_TRAY = (() => {
  const s = new Sketch(32, 26);
  // A wooden tray of soil, and rows of seedlings each with its two first leaves.
  slab(s, 1, 14, 30, 11, TRIM);
  s.rect(3, 14, 26, 4, fillOf(DOOR)).rect(3, 17, 26, 1, darkOf(DOOR));
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 5; i++) {
      const x = 5 + i * 5 + row * 2;
      const y = 15 - row * 5;
      s.rect(x, y - 4, 1, 4, fillOf(LEAVES));
      s.set(x - 1, y - 5, fillOf(LEAVES)).set(x - 2, y - 5, lightOf(LEAVES));
      s.set(x + 1, y - 5, fillOf(LEAVES)).set(x + 2, y - 6, fillOf(LEAVES));
    }
  }
  s.rect(4, 19, 24, 1, darkOf(TRIM));
  return finish(s);
})();

const SKULL_PLANTER = (() => {
  const s = new Sketch(32, 38);
  // A skull with its top off for a pot, and a succulent growing out of it.
  for (let k = 0; k < 9; k++) {
    const a = (k / 8) * Math.PI - Math.PI;
    const tipX = Math.round(16 + Math.cos(a) * 11);
    const tipY = Math.round(12 + Math.sin(a) * 10);
    s.line(15, 12, tipX, tipY, fillOf(LEAVES)).line(17, 12, tipX, tipY, fillOf(LEAVES));
    s.line(16, 12, tipX, tipY, k % 2 === 0 ? lightOf(LEAVES) : shadeOf(LEAVES));
  }
  ball(s, 16, 22, 12, 10, WALL);
  s.rect(4, 12, 24, 3, darkOf(DOOR)).rect(5, 12, 22, 2, fillOf(DOOR));
  s.rect(9, 31, 14, 6, fillOf(WALL));
  bevelIn(s, 0, 24, 32, 14, WALL);
  s.ellipse(11, 22, 3, 3.5, INK).ellipse(21, 22, 3, 3.5, INK);
  s.set(10, 21, WHITE).set(20, 21, WHITE);
  s.set(15, 27, INK).set(16, 28, INK).set(17, 27, INK);
  for (const x of [12, 15, 18]) s.rect(x, 33, 1, 3, darkOf(WALL));
  return finish(s);
})();

const VELVET_SETTEE = (() => {
  const s = new Sketch(64, 44);
  // A curvy camelback of maroon velvet, buttoned, with a carved gold rail and little gold feet.
  for (let x = 4; x < 60; x++) {
    const hump = Math.round(
      Math.sin(((x - 4) / 56) * Math.PI) * 6 + Math.sin(((x - 4) / 28) * Math.PI) * 2,
    );
    s.rect(x, 12 - hump, 1, 20 + hump, fillOf(ACCENT));
  }
  bevelIn(s, 0, 0, 64, 32, ACCENT);
  for (let x = 4; x < 60; x++) {
    const hump = Math.round(
      Math.sin(((x - 4) / 56) * Math.PI) * 6 + Math.sin(((x - 4) / 28) * Math.PI) * 2,
    );
    s.set(x, 11 - hump, fillOf(ACCENT_TWO));
  }
  for (const [x, y] of [
    [16, 12],
    [26, 9],
    [38, 9],
    [48, 12],
    [21, 19],
    [32, 18],
    [43, 19],
  ] as const)
    s.set(x, y, darkOf(ACCENT));
  slab(s, 8, 26, 48, 8, ACCENT);
  s.rect(32, 26, 1, 8, shadeOf(ACCENT));
  for (const x of [5, 59]) s.ellipse(x, 26, 5, 6, fillOf(ACCENT));
  s.ellipse(4, 24, 2, 2, lightOf(ACCENT)).ellipse(58, 24, 2, 2, lightOf(ACCENT));
  slab(s, 2, 33, 60, 5, ACCENT);
  s.rect(2, 37, 60, 1, fillOf(ACCENT_TWO));
  for (const x of [5, 56]) s.rect(x, 38, 3, 5, fillOf(ACCENT_TWO)).set(x, 38, lightOf(ACCENT_TWO));
  return finish(s);
})();

const STAINED_GLASS = (() => {
  const s = new Sketch(32, 32);
  // A round window of coloured panes in leading, with a bat flying across the moon.
  s.ellipse(16, 16, 15, 15, fillOf(STONE)).ellipse(16, 16, 13, 13, darkOf(STONE));
  const panes: string[] = [GLASS, GLASS_DARK, fillOf(ROOF)];
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const dx = x + 0.5 - 16;
      const dy = y + 0.5 - 16;
      const d = Math.hypot(dx, dy);
      if (d > 12) continue;
      const wedge = Math.floor(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 8);
      const ring = d < 7 ? 0 : 1;
      const edge =
        Math.abs(
          ((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 8 -
            Math.round(((Math.atan2(dy, dx) + Math.PI) / (2 * Math.PI)) * 8),
        ) *
          d <
        0.6;
      if (edge || Math.abs(d - 7) < 0.5) s.set(x, y, darkOf(STONE));
      else s.set(x, y, ring === 0 ? GLINT : panes[(wedge + ring) % panes.length]!);
    }
  }
  bat(s, 9, 13);
  return finish(s);
})();

const CUPCAKE_TOWER = (() => {
  const s = new Sketch(32, 48);
  // A three-tier stand of cupcakes, each with a swirl of icing, and a cherry on the top one.
  s.rect(15, 4, 2, 42, fillOf(STONE)).set(15, 4, lightOf(STONE));
  const cupcake = (cx: number, bottom: number, m: Material) => {
    column(s, cx, bottom - 5, 5, (j) => 6 - j * 0.4, fillOf(DOOR));
    for (let x = cx - 2; x < cx + 3; x += 2) s.rect(x, bottom - 5, 1, 5, shadeOf(DOOR));
    s.ellipse(cx, bottom - 6.5, 4, 2.5, fillOf(m)).ellipse(cx, bottom - 9, 2.5, 1.5, fillOf(m));
    s.set(cx - 1, bottom - 7, lightOf(m)).set(cx, bottom - 10, lightOf(m));
  };
  const plate = (y: number, w: number) => {
    s.ellipse(16, y, w / 2, 1.5, fillOf(STONE));
    s.rect(16 - w / 2, y, w, 1, lightOf(STONE));
  };
  plate(45, 30);
  plate(32, 22);
  plate(19, 14);
  cupcake(6, 44, ACCENT);
  cupcake(16, 44, ROOF);
  cupcake(26, 44, ACCENT_TWO);
  cupcake(10, 31, ACCENT_TWO);
  cupcake(22, 31, ACCENT);
  cupcake(16, 18, ROOF);
  s.ellipse(16, 6.5, 1.5, 1.5, fillOf(ACCENT)).set(17, 4, fillOf(LEAVES));
  return finish(s);
})();

const MUMMY_TEAPOT = (() => {
  const s = new Sketch(32, 32);
  // A round teapot wrapped in bandages, two eyes peeking out between them, steam from the spout.
  ball(s, 16, 20, 11, 9, WALL);
  for (let k = 0; k < 5; k++) s.line(5, 14 + k * 4, 27, 12 + k * 4, shadeOf(WALL));
  s.ellipse(16, 11, 5, 2, fillOf(WALL)).ellipse(16, 8, 2, 1.5, fillOf(ACCENT));
  s.line(26, 20, 30, 13, fillOf(WALL)).line(26, 21, 30, 14, fillOf(WALL));
  s.ellipse(4, 20, 3, 5, fillOf(WALL)).ellipse(4, 20, 1.5, 3, '.');
  s.rect(10, 18, 12, 3, darkOf(WALL));
  s.ellipse(12.5, 19.5, 1.5, 1.5, WHITE).ellipse(19.5, 19.5, 1.5, 1.5, WHITE);
  s.set(13, 20, INK).set(20, 20, INK);
  s.set(29, 10, WHITE).set(30, 8, WHITE).set(29, 6, WHITE);
  s.ellipse(16, 29, 8, 1.5, shadeOf(WALL));
  return finish(s);
})();

export const KEEPSAKE_ART: Record<Keepsake, FurnitureArt> = {
  floatingCandles: {
    source: FLOATING_CANDLES,
    palette: palette({ ...WOOD, roof: C.cream }),
    glow: FIRE_LIT,
    lights: [
      { x: 5, y: 4, radius: 24 },
      { x: 15, y: 10, radius: 24 },
      { x: 25, y: 6, radius: 24 },
    ],
  },
  wingbackChair: {
    source: WINGBACK_CHAIR,
    palette: palette({ ...WOOD, accent: C.blueFabric, trim: C.bark }),
  },
  roseBucket: {
    source: ROSE_BUCKET,
    palette: palette({
      ...WOOD,
      stone: C.silver,
      accent: C.scarlet,
      accentTwo: C.rose,
      leaves: C.leaf,
    }),
  },
  pawPrintRug: {
    source: PAW_PRINT_RUG,
    palette: palette({ ...WOOD, wall: C.cream, trim: C.bark }),
  },
  potionShelf: {
    source: POTION_SHELF,
    palette: palette({
      ...WOOD,
      trim: C.bark,
      accent: C.rose,
      leaves: C.orbGreen,
      roof: C.orbBlue,
      glass: C.lavender,
    }),
    glow: {
      [fillOf(ACCENT)]: C.roseLight,
      [fillOf(LEAVES)]: C.orbGreenLight,
      [fillOf(ROOF)]: C.orbBlueLight,
    },
    lights: [{ x: 16, y: 16, radius: 28 }],
  },
  witchHatLamp: {
    source: WITCH_HAT_LAMP,
    palette: palette({
      ...WOOD,
      roof: C.plum,
      accent: C.orbGreen,
      accentTwo: C.gold,
      stone: C.iron,
    }),
    glow: { [lightOf(ACCENT_TWO)]: C.candleBright },
    lights: [{ x: 16, y: 28, radius: 40 }],
  },
  seedlingTray: {
    source: SEEDLING_TRAY,
    palette: palette({ ...WOOD, trim: C.wood, door: C.soil, leaves: C.leafLight }),
  },
  skullPlanter: {
    source: SKULL_PLANTER,
    palette: palette({ ...WOOD, wall: C.bone, door: C.soil, leaves: C.leaf }),
  },
  velvetSettee: {
    source: VELVET_SETTEE,
    palette: palette({ ...WOOD, accent: C.maroon, accentTwo: C.gold }),
  },
  stainedGlass: {
    source: STAINED_GLASS,
    palette: palette({ ...WOOD, stone: C.iron, roof: C.plum, glass: C.pumpkin }),
    glow: {
      [GLASS]: C.candle,
      [GLASS_DARK]: C.pumpkinLight,
      [GLINT]: C.candleBright,
      [fillOf(ROOF)]: C.plumLight,
    },
    lights: [{ x: 16, y: 16, radius: 32 }],
  },
  cupcakeTower: {
    source: CUPCAKE_TOWER,
    palette: palette({
      ...WOOD,
      stone: C.silver,
      door: C.wood,
      accent: C.rose,
      accentTwo: C.lavender,
      roof: C.cream,
      leaves: C.leaf,
    }),
  },
  mummyTeapot: {
    source: MUMMY_TEAPOT,
    palette: palette({ ...WOOD, wall: C.bandage, accent: C.bark }),
  },
};
