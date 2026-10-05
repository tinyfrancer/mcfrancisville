import type { YardPiece } from '../types/ids';
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
  pot,
  slab,
  WOOD,
} from './furnish';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { Palette } from './sprite';

// Her yard's pieces (0.3's H5), at 32, drawn as the furniture is so they come indoors too: a piece
// stands on the front edge of its footprint and rises over the grass behind it. What lights up
// after dark is its `glow`; the time of day is the light map's, never painted in.

/** A curly iron bench with wooden slats, a little bat cut out of its back. */
const GARDEN_BENCH = (() => {
  const s = new Sketch(64, 42);
  // The back: an iron rail arching over three slats, the bat in the middle of the top.
  for (const y of [11, 16]) slab(s, 7, y, 50, 4, DOOR);
  s.rect(6, 8, 52, 2, fillOf(ROOF)).rect(6, 8, 52, 1, lightOf(ROOF));
  for (let x = 6; x < 58; x++) {
    const t = (x - 32) / 26;
    const up = Math.round(4 * (1 - t * t));
    s.rect(x, 8 - up, 1, up, '.');
    s.set(x, 7 - up, fillOf(ROOF));
  }
  bat(s, 24, 3);
  // The seat, two slats seen a little from above, and its front edge.
  slab(s, 4, 22, 56, 4, DOOR);
  slab(s, 4, 26, 56, 3, DOOR);
  s.rect(4, 29, 56, 1, darkOf(DOOR));
  // The iron ends: a leg, an arm curling forward, and little scrolled feet.
  for (const x of [4, 56]) {
    s.rect(x, 6, 4, 34, fillOf(ROOF)).rect(x, 6, 1, 34, lightOf(ROOF));
    s.rect(x - 2, 19, 8, 2, fillOf(ROOF)).set(x - 2, 18, lightOf(ROOF));
    s.set(x + 5, 18, fillOf(ROOF)).set(x + 6, 19, fillOf(ROOF));
    s.rect(x - 1, 39, 6, 2, fillOf(ROOF))
      .set(x - 1, 38, fillOf(ROOF))
      .set(x + 4, 38, fillOf(ROOF));
  }
  s.rect(10, 30, 1, 10, fillOf(ROOF)).rect(53, 30, 1, 10, fillOf(ROOF));
  return finish(s);
})();

/** A little iron lantern with a peaked cap and a ring on top, a candle burning behind its glass. */
const YARD_LANTERN = (() => {
  const s = new Sketch(32, 32);
  s.rect(15, 1, 2, 1, fillOf(ROOF)).set(14, 2, fillOf(ROOF)).set(17, 2, fillOf(ROOF));
  s.rect(15, 3, 2, 2, fillOf(ROOF));
  column(s, 16, 5, 5, (j) => 4 + j * 3, fillOf(ROOF));
  s.rect(9, 9, 14, 1, lightOf(ROOF)).rect(8, 10, 16, 2, fillOf(ROOF));
  // The glass, framed at its corners, and the candle in the middle of it.
  s.rect(10, 12, 12, 13, GLASS);
  for (const x of [10, 21]) s.rect(x, 12, 1, 13, fillOf(ROOF));
  candle(s, 15, 15, 7, 3);
  s.line(12, 13, 12, 16, GLINT);
  slab(s, 8, 25, 16, 3, ROOF);
  s.rect(10, 28, 12, 2, darkOf(ROOF));
  return finish(s);
})();

/** A garden gnome in a spotty toadstool hat, with a white beard and a tiny lantern. */
const TOADSTOOL_GNOME = (() => {
  const s = new Sketch(32, 40);
  // His coat and boots.
  ball(s, 16, 30, 8, 7, DOOR);
  s.rect(9, 34, 14, 3, fillOf(DOOR));
  s.rect(9, 37, 6, 2, fillOf(TRIM)).rect(17, 37, 6, 2, fillOf(TRIM));
  s.rect(9, 37, 6, 1, lightOf(TRIM)).rect(17, 37, 6, 1, lightOf(TRIM));
  // His face and beard.
  ball(s, 16, 18, 6, 5, WALL);
  column(s, 16, 20, 11, (j) => 12 - j * 0.9, WHITE);
  s.rect(13, 17, 1, 2, INK).rect(18, 17, 1, 2, INK);
  s.rect(15, 19, 2, 2, shadeOf(WALL));
  s.set(12, 20, fillOf(ACCENT)).set(19, 20, fillOf(ACCENT));
  // The hat: a red toadstool cap with white spots.
  ball(s, 16, 11, 12, 7, ROOF);
  s.rect(4, 12, 24, 1, darkOf(ROOF)).rect(3, 13, 26, 2, '.');
  for (const [x, y, r] of [
    [10, 8, 1.5],
    [17, 6, 2],
    [23, 10, 1.5],
    [14, 11, 1],
  ] as const) {
    s.ellipse(x, y, r, r, WHITE);
  }
  // A tiny lantern held at his side.
  s.rect(24, 27, 1, 2, INK);
  s.rect(23, 29, 4, 5, LAMP).rect(24, 30, 2, 3, FIRE).set(24, 30, FIRE_LIGHT);
  s.rect(22, 29, 6, 1, fillOf(ROOF)).rect(22, 34, 6, 1, fillOf(ROOF));
  return finish(s);
})();

/** Three clay pots of flowers: marigolds, asters, and something purple that smells of jam. */
const FLOWER_POTS = (() => {
  const s = new Sketch(32, 30);
  const flowers = (cx: number, top: number, m: string, n: number) => {
    for (let k = 0; k < n; k++) {
      const x = cx - 4 + ((k * 5) % 9);
      const y = top + ((k * 3) % 4);
      s.line(x, y + 2, cx, top + 8, fillOf(LEAVES));
      s.rect(x - 1, y, 3, 3, fillOf(m))
        .set(x, y, lightOf(m))
        .set(x, y + 1, LAMP);
    }
  };
  // The tall one at the back, then two in front.
  flowers(16, 2, ACCENT_TWO, 4);
  pot(s, 16, 18, 12, 9, TRIM);
  flowers(8, 9, ACCENT, 3);
  pot(s, 8, 28, 12, 10, TRIM);
  flowers(24, 10, ROOF, 3);
  pot(s, 24, 28, 11, 9, TRIM);
  return finish(s);
})();

/** A stone birdbath on a fluted stand, its water catching the sky, and a little bat at the rim. */
const BIRDBATH = (() => {
  const s = new Sketch(32, 44);
  // The foot and the fluted column.
  slab(s, 8, 38, 16, 4, STONE);
  s.rect(7, 37, 18, 2, lightOf(STONE));
  column(s, 16, 16, 21, (j) => 8 - Math.sin((j / 20) * Math.PI) * 3, fillOf(STONE));
  for (const x of [14, 18]) s.rect(x, 18, 1, 18, shadeOf(STONE));
  s.rect(13, 18, 1, 18, lightOf(STONE));
  // The basin, its rim and its water.
  ball(s, 16, 14, 13, 5, STONE);
  s.ellipse(16, 11, 13, 3, lightOf(STONE));
  s.ellipse(16, 11, 11, 2, GLASS);
  s.rect(9, 11, 4, 1, GLINT).rect(20, 10, 2, 1, GLINT);
  // The bat, perched on the rim with its wings folded.
  s.ellipse(25, 7, 2.5, 3, INK);
  s.set(24, 3, INK).set(26, 3, INK).rect(22, 6, 2, 3, INK).rect(27, 6, 2, 3, INK);
  s.set(24, 6, WHITE).set(26, 6, WHITE);
  return finish(s);
})();

/** A long wooden picnic table under a gingham cloth, with a bench along its front. */
const PICNIC_TABLE = (() => {
  const s = new Sketch(64, 34);
  // Its legs, crossed under each end.
  for (const x of [8, 52]) {
    s.line(x, 16, x + 4, 30, fillOf(TRIM)).line(x + 1, 16, x + 5, 30, fillOf(TRIM));
    s.line(x + 4, 16, x, 30, shadeOf(TRIM)).line(x + 5, 16, x + 1, 30, shadeOf(TRIM));
  }
  // The top: a red and white gingham cloth seen from above, its front edge hanging down.
  for (let y = 7; y < 15; y++) {
    for (let x = 1; x < 63; x++) {
      const across = Math.floor(x / 4) % 2 === 0;
      const down = Math.floor((y - 7) / 2) % 2 === 0;
      s.set(x, y, across && down ? fillOf(ACCENT) : across || down ? lightOf(ACCENT) : WHITE);
    }
  }
  s.rect(1, 15, 62, 3, shadeOf(ACCENT));
  for (let x = 2; x < 62; x += 4) s.rect(x, 15, 2, 3, fillOf(ACCENT));
  s.rect(1, 18, 62, 1, darkOf(ACCENT));
  // The bench along its front.
  slab(s, 3, 23, 58, 3, TRIM);
  s.rect(3, 26, 58, 1, darkOf(TRIM));
  for (const x of [6, 55]) s.rect(x, 27, 3, 6, fillOf(TRIM)).rect(x, 27, 1, 6, lightOf(TRIM));
  return finish(s);
})();

/** Three pumpkins in a heap, the littlest on top, each with its own curly stalk. */
const PUMPKIN_PILE = (() => {
  const s = new Sketch(32, 36);
  const pumpkin = (cx: number, cy: number, rx: number, ry: number) => {
    ball(s, cx, cy, rx, ry, ACCENT, { dither: true });
    for (const dx of [-rx / 2, 0, rx / 2]) {
      s.rect(
        Math.round(cx + dx),
        Math.round(cy - ry + 2),
        1,
        Math.round(ry * 2 - 3),
        shadeOf(ACCENT),
      );
    }
    s.rect(Math.round(cx), Math.round(cy - ry - 2), 2, 3, fillOf(LEAVES));
    s.set(Math.round(cx) + 2, Math.round(cy - ry - 3), fillOf(LEAVES));
  };
  pumpkin(9, 27, 8, 7);
  pumpkin(23, 28, 8, 6);
  pumpkin(16, 15, 6, 5);
  return finish(s);
})();

const BULB_KEYS = ['0', '1', '2', '3'] as const;
const BULBS: Palette = { 0: C.gold, 1: C.scarlet, 2: C.orbBlue, 3: C.orbGreen };
const BULBS_LIT: Palette = {
  0: C.candleBright,
  1: C.roseLight,
  2: C.orbBlueLight,
  3: C.orbGreenLight,
};

/** A string of little bulbs swagged between two posts, as the fairground's are, but hers. */
const FAIRY_LIGHTS = (() => {
  const s = new Sketch(64, 44);
  for (const x of [4, 57]) {
    slab(s, x, 6, 3, 37, TRIM);
    s.rect(x - 1, 4, 5, 2, fillOf(TRIM)).set(x + 1, 3, fillOf(TRIM));
  }
  let bulb = 0;
  for (const [x0, x1, y, sag] of [
    [7, 56, 8, 12],
    [7, 56, 18, 8],
  ] as const) {
    for (let x = x0; x <= x1; x++) {
      const t = (x - x0) / (x1 - x0);
      const dy = Math.round(sag * 4 * t * (1 - t));
      s.set(x, y + dy, INK);
      if ((x - x0) % 5 === 3) {
        const key = BULB_KEYS[bulb++ % BULB_KEYS.length]!;
        s.rect(x, y + dy + 1, 2, 2, key).set(x, y + dy + 3, key);
      }
    }
  }
  s.rect(2, 41, 7, 2, fillOf(LEAVES)).rect(55, 41, 7, 2, fillOf(LEAVES));
  return finish(s);
})();

/** A bit of picket fence with pointy tops, its rails running edge to edge so a row joins up. */
const PICKET_FENCE = (() => {
  const s = new Sketch(32, 32);
  for (const y of [14, 24]) slab(s, 0, y, 32, 3, WALL);
  for (const x of [2, 10, 18, 26]) {
    slab(s, x, 8, 5, 23, WALL);
    s.set(x, 8, '.')
      .set(x + 4, 8, '.')
      .rect(x + 1, 6, 3, 2, fillOf(WALL))
      .set(x + 2, 5, lightOf(WALL));
  }
  return finish(s);
})();

/** A friendly little scarecrow in a witch hat and a patched coat, a crow on one arm. */
const YARD_SCARECROW = (() => {
  const s = new Sketch(32, 48);
  // The post and the cross-arm.
  s.rect(15, 26, 3, 21, fillOf(TRIM)).rect(15, 26, 1, 21, lightOf(TRIM));
  s.rect(2, 24, 28, 3, fillOf(TRIM)).rect(2, 24, 28, 1, lightOf(TRIM));
  // The coat, with a patch, and straw at the cuffs.
  s.rect(9, 22, 14, 14, fillOf(DOOR));
  s.rect(3, 23, 7, 5, fillOf(DOOR)).rect(22, 23, 7, 5, fillOf(DOOR));
  s.rect(9, 22, 1, 14, lightOf(DOOR)).rect(22, 23, 1, 13, shadeOf(DOOR));
  s.rect(17, 28, 4, 4, fillOf(ACCENT_TWO)).set(17, 28, lightOf(ACCENT_TWO));
  for (const x of [1, 3, 27, 29]) s.rect(x, 25, 1, 4, LAMP);
  for (let x = 10; x < 22; x += 2) s.rect(x, 36, 1, 3, LAMP);
  // The burlap face, stitched smile.
  ball(s, 16, 16, 7, 6, WALL);
  s.rect(13, 15, 2, 2, INK).rect(18, 15, 2, 2, INK);
  s.rect(13, 19, 7, 1, darkOf(WALL));
  for (const x of [13, 15, 17, 19]) s.set(x, 20, darkOf(WALL));
  s.set(11, 18, fillOf(ACCENT)).set(21, 18, fillOf(ACCENT));
  // The witch hat, its brim wide and its point bent.
  s.rect(5, 10, 22, 2, fillOf(ROOF)).rect(5, 10, 22, 1, lightOf(ROOF));
  column(s, 16, 2, 8, (j) => 3 + j * 1.3, fillOf(ROOF));
  s.rect(19, 1, 3, 2, fillOf(ROOF)).rect(10, 8, 12, 2, LAMP);
  // The crow on the arm, beak out.
  ball(s, 27, 20, 3, 3, STONE);
  s.set(29, 19, INK).rect(30, 20, 2, 1, LAMP);
  return finish(s);
})();

// ---- Every piece ------------------------------------------------------------------------------

const lit = (x: number, y: number, radius: number) => [{ x, y, radius }];

export const YARD_ART: Record<YardPiece, FurnitureArt> = {
  gardenBench: {
    source: GARDEN_BENCH,
    palette: palette({ ...WOOD, roof: C.iron, door: C.wood }),
  },
  yardLantern: {
    source: YARD_LANTERN,
    palette: palette({ ...WOOD, roof: C.iron, glass: C.dusk }),
    glow: { ...FIRE_LIT, [GLASS]: C.candle },
    lights: lit(16, 19, 48),
  },
  toadstoolGnome: {
    source: TOADSTOOL_GNOME,
    palette: palette({
      ...WOOD,
      wall: C.skin,
      roof: C.scarlet,
      door: C.teal,
      trim: C.bark,
      accent: C.cheek,
    }),
    glow: FIRE_LIT,
    lights: lit(25, 31, 24),
  },
  flowerPots: {
    source: FLOWER_POTS,
    palette: palette({
      ...WOOD,
      trim: C.pumpkinDark,
      accent: C.pumpkin,
      accentTwo: C.lavender,
      roof: C.plumLight,
      leaves: C.leaf,
    }),
  },
  birdbath: {
    source: BIRDBATH,
    palette: palette({ ...WOOD, stone: C.stoneLight, glass: C.sky }),
  },
  picnicTable: {
    source: PICNIC_TABLE,
    palette: palette({ ...WOOD, trim: C.wood, accent: C.scarlet }),
  },
  pumpkinPile: {
    source: PUMPKIN_PILE,
    palette: palette({ ...WOOD, accent: C.pumpkin, leaves: C.leafDark }),
  },
  fairyLights: {
    source: FAIRY_LIGHTS,
    palette: { ...palette({ ...WOOD, trim: C.bark, leaves: C.moss }), ...BULBS },
    glow: BULBS_LIT,
    lights: [...lit(18, 15, 28), ...lit(32, 20, 28), ...lit(46, 15, 28)],
  },
  picketFence: {
    source: PICKET_FENCE,
    palette: palette({ ...WOOD, wall: C.bone }),
  },
  yardScarecrow: {
    source: YARD_SCARECROW,
    palette: palette({
      ...WOOD,
      wall: C.rope,
      roof: C.plum,
      door: C.berry,
      trim: C.bark,
      accent: C.cheek,
      accentTwo: C.teal,
      stone: C.furBlack,
    }),
  },
};
