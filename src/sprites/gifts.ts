import type { FurnitureId } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  DOOR,
  fillOf,
  finish,
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
import { ball, bevelIn, candle, column, FIRE_LIT, frame, palette, slab, WOOD } from './furnish';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * What her neighbours give her at hearts and on special days (phase 9), at 32 (phase J).
 */

/** A book lying flat, its pages showing on the right, `h` pixels thick. */
function book(s: Sketch, x: number, y: number, w: number, h: number, m: Material): void {
  slab(s, x, y, w, h, m);
  s.rect(x + w - 3, y + 1, 2, h - 2, fillOf(WALL));
  s.rect(x + 2, y + Math.floor(h / 2), w - 6, 1, lightOf(ACCENT_TWO));
}

const GHOST_STORIES = (() => {
  const s = new Sketch(32, 42);
  // A pile of ghost stories with a candle stuck on top, dripping a little.
  book(s, 3, 34, 26, 7, DOOR);
  book(s, 5, 27, 23, 7, ROOF);
  book(s, 2, 21, 25, 6, ACCENT);
  book(s, 6, 15, 20, 6, LEAVES);
  s.ellipse(16, 14, 5, 1.5, WHITE);
  candle(s, 14, 0, 12, 4);
  s.set(13, 13, WHITE).set(18, 12, WHITE).set(18, 13, WHITE);
  // A little ghost on the top book's cover.
  s.ellipse(11, 18, 2, 2, WHITE).rect(9, 18, 4, 2, WHITE);
  return finish(s);
})();

const MOON_BOUQUET = (() => {
  const s = new Sketch(32, 42);
  // Pale moonflowers and a rose or two in a blue vase, glowing softly after dark.
  for (const [x, y] of [
    [8, 10],
    [16, 5],
    [24, 10],
    [11, 17],
    [21, 17],
  ] as const)
    s.line(16, 26, x, y, darkOf(LEAVES));
  s.ellipse(7, 20, 4, 1.5, fillOf(LEAVES)).ellipse(25, 20, 4, 1.5, fillOf(LEAVES));
  const bloom = (x: number, y: number) => {
    s.ellipse(x, y, 4.5, 4, fillOf(WALL)).ellipse(x - 1, y - 1, 2, 2, lightOf(WALL));
    s.set(x, y, lightOf(ACCENT_TWO));
  };
  bloom(8, 10);
  bloom(16, 5);
  bloom(24, 10);
  ball(s, 11, 17, 3.5, 3, ACCENT);
  ball(s, 21, 17, 3.5, 3, ACCENT);
  column(
    s,
    16,
    24,
    18,
    (j) => (j < 3 ? 10 : j < 6 ? 8 : 12 + Math.sin((j - 6) / 4) * 4),
    fillOf(ROOF),
  );
  bevelIn(s, 0, 24, 32, 18, ROOF);
  s.rect(10, 23, 12, 2, lightOf(ROOF));
  s.set(12, 30, GLINT).set(12, 31, GLINT);
  return finish(s);
})();

const COFFIN_CAKE = (() => {
  const s = new Sketch(32, 34);
  // A coffin-shaped cake in lavender icing, piped round its edge, on a silver board.
  s.ellipse(16, 29, 15, 4, fillOf(STONE)).ellipse(16, 28, 13, 3, lightOf(STONE));
  const widthAt = (j: number) => (j < 6 ? 16 + j * 1.6 : 26 - (j - 6) * 0.7);
  column(s, 16, 4, 16, widthAt, fillOf(ACCENT));
  column(s, 16, 20, 7, (j) => widthAt(15) - j * 0.2, shadeOf(ACCENT));
  bevelIn(s, 0, 4, 32, 16, ACCENT);
  for (let j = 0; j < 16; j += 2) {
    const w = Math.round(widthAt(j));
    s.set(16 - Math.floor(w / 2), 4 + j, WHITE).set(15 + Math.ceil(w / 2), 4 + j, WHITE);
  }
  s.rect(15, 7, 2, 8, WHITE).rect(13, 9, 6, 2, WHITE);
  for (let x = 6; x < 27; x += 3) s.set(x, 20, WHITE);
  return finish(s);
})();

const BROOMSTICK = (() => {
  const s = new Sketch(32, 44);
  // Agatha's spare broom, leaning, with a plum ribbon and a sparkle of leftover magic.
  s.line(7, 2, 19, 30, fillOf(TRIM))
    .line(8, 2, 20, 30, fillOf(TRIM))
    .line(9, 2, 21, 30, shadeOf(TRIM));
  for (let k = 0; k < 14; k++) {
    const x = 12 + k;
    const top = 29 + Math.round(Math.abs(k - 7) * 0.3);
    s.rect(x, top, 1, 43 - top - (k % 3 === 0 ? 1 : 0), k % 2 === 0 ? fillOf(DOOR) : shadeOf(DOOR));
  }
  s.rect(14, 29, 10, 3, fillOf(ROOF)).rect(14, 29, 10, 1, lightOf(ROOF));
  s.line(24, 31, 27, 36, fillOf(ROOF)).line(14, 31, 12, 36, fillOf(ROOF));
  for (const [x, y] of [
    [4, 8],
    [26, 16],
    [2, 20],
  ] as const) {
    s.set(x, y, lightOf(ACCENT_TWO))
      .set(x - 1, y, fillOf(ACCENT_TWO))
      .set(x + 1, y, fillOf(ACCENT_TWO));
    s.set(x, y - 1, fillOf(ACCENT_TWO)).set(x, y + 1, fillOf(ACCENT_TWO));
  }
  return finish(s);
})();

const BONE_GNOME = (() => {
  const s = new Sketch(32, 44);
  // A garden gnome made of bones: a tall red hat, a skull face, a bony beard, on a mossy rock.
  ball(s, 16, 39, 12, 5, LEAVES);
  column(s, 16, 0, 16, (j) => 2 + j * 1.1, fillOf(ACCENT));
  s.set(18, 0, fillOf(ACCENT)).set(19, 1, fillOf(ACCENT));
  bevelIn(s, 0, 0, 32, 16, ACCENT);
  s.rect(6, 15, 20, 3, shadeOf(ACCENT));
  ball(s, 16, 21, 8, 5, WALL);
  s.ellipse(13, 21, 2, 2, INK).ellipse(19, 21, 2, 2, INK).set(16, 24, darkOf(WALL));
  s.set(12, 20, WHITE).set(18, 20, WHITE);
  column(s, 16, 25, 9, (j) => 14 - j * 1.3, fillOf(WALL));
  for (let j = 26; j < 33; j += 2) s.rect(12, j, 9, 1, shadeOf(WALL));
  s.rect(6, 28, 4, 8, fillOf(ACCENT)).rect(22, 28, 4, 8, fillOf(ACCENT));
  s.rect(10, 33, 12, 3, fillOf(ACCENT))
    .rect(10, 36, 4, 2, darkOf(WALL))
    .rect(18, 36, 4, 2, darkOf(WALL));
  return finish(s);
})();

const CODY_PORTRAIT = (() => {
  const s = new Sketch(32, 32);
  frame(s, 1, 1, 30, 30, ACCENT_TWO, 4);
  s.rect(4, 4, 24, 24, fillOf(ROOF));
  // Cody: brown curls, round glasses, a little grin with his fangs, his cape's high collar.
  s.rect(4, 22, 24, 6, INK).line(4, 18, 9, 23, fillOf(ACCENT)).line(27, 18, 22, 23, fillOf(ACCENT));
  s.rect(12, 22, 8, 6, fillOf(ACCENT)).rect(15, 22, 2, 2, fillOf(WALL));
  s.ellipse(16, 14, 7, 7, fillOf(WALL));
  s.ellipse(16, 8, 8, 4, fillOf(DOOR))
    .ellipse(9, 13, 2.5, 5, fillOf(DOOR))
    .ellipse(23, 13, 2.5, 5, fillOf(DOOR));
  for (const x of [11, 15, 19]) s.ellipse(x + 1, 6, 2, 2, lightOf(DOOR));
  for (const x of [11, 18]) {
    s.rect(x, 13, 4, 1, fillOf(STONE)).rect(x, 16, 4, 1, fillOf(STONE));
    s.rect(x, 13, 1, 4, fillOf(STONE)).rect(x + 3, 13, 1, 4, fillOf(STONE));
    s.set(x + 1, 15, INK).set(x + 2, 15, INK);
  }
  s.rect(15, 14, 2, 1, fillOf(STONE));
  s.rect(14, 19, 4, 1, darkOf(WALL)).set(14, 20, WHITE).set(17, 20, WHITE);
  s.set(10, 18, shadeOf(ACCENT)).set(22, 18, shadeOf(ACCENT));
  return finish(s);
})();

const BIRTHDAY_CAKE = (() => {
  const s = new Sketch(32, 44);
  // Three tiers of white cake with pink and blue icing, on a silver stand, candles lit.
  s.ellipse(16, 41, 13, 3, fillOf(STONE)).rect(14, 36, 4, 5, fillOf(STONE));
  const tier = (y: number, w: number, h: number, m: Material) => {
    slab(s, 16 - w / 2, y, w, h, WALL);
    s.rect(16 - w / 2, y, w, 2, fillOf(m));
    for (let x = 16 - w / 2 + 1; x < 16 + w / 2; x += 3) s.set(x, y + 2, fillOf(m));
  };
  tier(26, 28, 10, ACCENT);
  tier(18, 20, 8, ROOF);
  tier(11, 12, 7, ACCENT);
  for (const x of [11, 15, 19]) candle(s, x, 1, 7, 2);
  for (const [x, y] of [
    [8, 31],
    [22, 30],
    [13, 22],
  ] as const)
    s.set(x, y, fillOf(ACCENT)).set(x + 1, y, fillOf(ROOF));
  return finish(s);
})();

export const GIFT_ART: Record<
  Extract<
    FurnitureId,
    | 'ghostStories'
    | 'moonBouquet'
    | 'coffinCake'
    | 'broomstick'
    | 'boneGnome'
    | 'codyPortrait'
    | 'birthdayCake'
  >,
  FurnitureArt
> = {
  ghostStories: {
    source: GHOST_STORIES,
    palette: palette({
      ...WOOD,
      wall: C.cream,
      door: C.plum,
      roof: C.teal,
      accent: C.rose,
      leaves: C.blueFabric,
      accentTwo: C.gold,
    }),
    glow: FIRE_LIT,
    lights: [{ x: 16, y: 1, radius: 28 }],
  },
  moonBouquet: {
    source: MOON_BOUQUET,
    palette: palette({
      ...WOOD,
      wall: C.ghost,
      roof: C.blueFabric,
      accent: C.rose,
      leaves: C.leaf,
      accentTwo: C.candle,
      glass: C.sky,
    }),
    glow: { [fillOf(WALL)]: C.ghost, [lightOf(WALL)]: C.candleBright },
  },
  coffinCake: {
    source: COFFIN_CAKE,
    palette: palette({ ...WOOD, accent: C.lavender, stone: C.silver }),
  },
  broomstick: {
    source: BROOMSTICK,
    palette: palette({ ...WOOD, trim: C.wood, door: C.rope, roof: C.plum, accentTwo: C.candle }),
    glow: { [lightOf(ACCENT_TWO)]: C.candleBright, [fillOf(ACCENT_TWO)]: C.candle },
  },
  boneGnome: {
    source: BONE_GNOME,
    palette: palette({ ...WOOD, accent: C.scarlet, wall: C.bone, leaves: C.moss }),
  },
  codyPortrait: {
    source: CODY_PORTRAIT,
    palette: palette({
      ...WOOD,
      wall: C.skin,
      door: C.hairBrown,
      roof: C.plum,
      accent: C.maroon,
      accentTwo: C.gold,
      stone: C.bark,
    }),
  },
  birthdayCake: {
    source: BIRTHDAY_CAKE,
    palette: palette({ ...WOOD, wall: C.white, accent: C.roseLight, roof: C.sky, stone: C.silver }),
    glow: FIRE_LIT,
    lights: [{ x: 16, y: 1, radius: 32 }],
  },
};
