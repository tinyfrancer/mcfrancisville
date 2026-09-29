import type { FixtureId } from '../types/ids';
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
  LEAVES,
  lightOf,
  ROOF,
  shadeOf,
  STONE,
  TRIM,
  WALL,
  WHITE,
} from './buildings';
import { ball, column, frame, palette, slab, WOOD } from './furnish';
import type { FixtureArt } from './interiors';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * Castle Mac-A-Boo's great hall (phase U), set for their anniversary: the cake, a portrait of the
 * two of them, a music box and windows of monarchs in stained glass. Drawn at 32 in the kit's
 * materials, like every fixture. Question 30 may yet say what should be in it.
 */

/** A monarch, wings open: 7 wide and 5 tall from its top left, orange veined in ink. */
function monarch(s: Sketch, x: number, y: number, m = ACCENT): void {
  s.rect(x, y, 3, 2, fillOf(m)).rect(x + 4, y, 3, 2, fillOf(m));
  s.rect(x + 1, y + 2, 2, 2, fillOf(m)).rect(x + 4, y + 2, 2, 2, fillOf(m));
  s.rect(x + 3, y, 1, 5, INK);
  s.set(x, y, INK)
    .set(x + 6, y, INK)
    .set(x + 1, y + 1, WHITE)
    .set(x + 5, y + 1, WHITE);
}

/** Their wedding cake: three white tiers trimmed with roses, two little figures on top. */
const WEDDING_CAKE = (() => {
  const s = new Sketch(32, 64);
  // A round table under a cloth, then the tiers.
  s.rect(9, 54, 3, 9, fillOf(TRIM)).rect(20, 54, 3, 9, fillOf(TRIM));
  s.ellipse(16, 53, 15, 4, fillOf(WALL));
  s.rect(1, 53, 30, 4, fillOf(WALL));
  s.bevel(fillOf(WALL), lightOf(WALL), shadeOf(WALL));
  for (const [y, w, h] of [
    [40, 26, 12],
    [29, 20, 11],
    [19, 14, 10],
  ] as const) {
    slab(s, 16 - w / 2, y, w, h, STONE);
    // Piped icing along the top edge, and roses round the foot.
    for (let x = 16 - w / 2 + 1; x < 16 + w / 2 - 1; x += 2) s.set(x, y + 1, WHITE);
    for (let x = 16 - w / 2 + 2; x < 16 + w / 2 - 1; x += 5)
      ball(s, x, y + h - 2, 1.6, 1.6, ACCENT);
  }
  // The two of them on top: her in white, him in black, holding hands.
  s.rect(12, 9, 3, 6, WHITE).rect(11, 13, 5, 6, WHITE);
  s.ellipse(13.5, 7, 2, 2, fillOf(ACCENT_TWO));
  s.rect(17, 9, 3, 10, fillOf(TRIM)).ellipse(18.5, 7, 2, 2, fillOf(TRIM));
  s.rect(15, 12, 2, 1, WHITE);
  return finish(s);
})();

/**
 * The two of them in a gilt frame, a sky full of monarchs behind them and roses along the foot.
 * They're painted in over it from how they look now (`couple`), as her pin-up is.
 */
const WEDDING_PORTRAIT = (() => {
  const s = new Sketch(96, 64);
  frame(s, 0, 0, 96, 64, ACCENT_TWO, 4);
  // A dusky sky, lighter toward the bottom, like the hour the photos were taken.
  for (let y = 4; y < 60; y++) {
    const key = y < 22 ? darkOf(ROOF) : y < 42 ? shadeOf(ROOF) : fillOf(ROOF);
    s.rect(4, y, 88, 1, key);
  }
  for (const [x, y] of [
    [9, 8],
    [80, 10],
    [12, 30],
    [78, 34],
    [44, 6],
    [62, 16],
  ] as const) {
    monarch(s, x, y);
  }
  // Roses along the foot.
  for (let x = 6; x < 90; x += 6) {
    s.ellipse(x + 2, 58, 3, 2, fillOf(LEAVES));
    ball(s, x + 2, 56, 2, 2, DOOR);
  }
  // The corners of the frame, carved.
  for (const [x, y] of [
    [0, 0],
    [90, 0],
    [0, 58],
    [90, 58],
  ] as const) {
    s.rect(x, y, 6, 6, lightOf(ACCENT_TWO)).rect(x + 2, y + 2, 2, 2, darkOf(ACCENT_TWO));
  }
  return finish(s);
})();

/** A little music box with its lid up, two tiny dancers turning on top. */
const MUSIC_BOX = (() => {
  const s = new Sketch(32, 44);
  // A little table, then the box.
  s.rect(8, 34, 3, 10, fillOf(TRIM)).rect(21, 34, 3, 10, fillOf(TRIM));
  slab(s, 4, 30, 24, 5, TRIM);
  slab(s, 7, 20, 18, 10, DOOR);
  s.rect(9, 23, 14, 1, fillOf(ACCENT_TWO)).rect(15, 25, 2, 2, fillOf(ACCENT_TWO));
  // The lid, open behind, lined with a mirror.
  slab(s, 7, 6, 18, 14, DOOR);
  s.rect(9, 8, 14, 10, GLASS).set(10, 9, GLINT).set(11, 9, GLINT);
  // The dancers.
  s.rect(14, 12, 2, 6, WHITE).ellipse(15, 11, 1.5, 1.5, WHITE);
  s.rect(17, 12, 2, 6, fillOf(TRIM)).ellipse(18, 11, 1.5, 1.5, fillOf(TRIM));
  s.rect(13, 18, 7, 2, fillOf(ACCENT_TWO));
  return finish(s);
})();

/** A tall arched window of stained glass: monarchs among roses, lit gold after dark. */
const HALL_WINDOW = (() => {
  const s = new Sketch(64, 64);
  const inside = (x: number, y: number) => {
    if (x < 10 || x >= 54 || y >= 62) return false;
    if (y >= 24) return true;
    const dx = (x + 0.5 - 32) / 22;
    const dy = (y + 0.5 - 24) / 20;
    return dx * dx + dy * dy <= 1;
  };
  // Stone round it, then panes of glass in lead.
  for (let y = 0; y < 64; y++) {
    for (let x = 6; x < 58; x++) {
      const dx = (x + 0.5 - 32) / 26;
      const dy = (y + 0.5 - 24) / 24;
      if (y >= 24 || dx * dx + dy * dy <= 1) s.set(x, y, fillOf(STONE));
    }
  }
  s.bevel(fillOf(STONE), lightOf(STONE), shadeOf(STONE));
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      if (!inside(x, y)) continue;
      const pane = (Math.floor(x / 6) + Math.floor(y / 7)) % 3;
      s.set(x, y, pane === 0 ? GLASS : pane === 1 ? fillOf(ROOF) : lightOf(ROOF));
      if (x % 6 === 0 || y % 7 === 0) s.set(x, y, darkOf(STONE));
    }
  }
  s.rect(31, 6, 2, 56, darkOf(STONE));
  for (const [x, y] of [
    [15, 28],
    [38, 18],
    [20, 44],
    [40, 48],
    [28, 34],
  ] as const) {
    monarch(s, x, y);
  }
  for (const [x, y] of [
    [14, 56],
    [24, 56],
    [40, 56],
    [50, 56],
  ] as const) {
    ball(s, x, y, 3, 3, DOOR);
  }
  column(s, 32, 2, 4, (j) => 2 + j, fillOf(STONE));
  return finish(s);
})();

const HALL_WOOD = { ...WOOD, trim: C.barkDark } as const;

export const HALL_FIXTURE_ART: Pick<
  Record<FixtureId, FixtureArt>,
  'weddingCake' | 'weddingPortrait' | 'musicBox' | 'hallWindow'
> = {
  weddingCake: {
    source: WEDDING_CAKE,
    palette: palette({
      ...HALL_WOOD,
      wall: C.white,
      stone: C.cream,
      accent: C.roseLight,
      accentTwo: C.hairPink,
    }),
  },
  weddingPortrait: {
    source: WEDDING_PORTRAIT,
    palette: palette({
      ...HALL_WOOD,
      accentTwo: C.gold,
      roof: C.skyDusk,
      accent: C.monarch,
      door: C.rose,
    }),
    couple: { her: { x: 18, y: 10 }, him: { x: 46, y: 10 } },
  },
  musicBox: {
    source: MUSIC_BOX,
    palette: palette({ ...HALL_WOOD, door: C.berry, accentTwo: C.gold, glass: C.sky }),
  },
  hallWindow: {
    source: HALL_WINDOW,
    palette: palette({
      ...HALL_WOOD,
      stone: C.stone,
      roof: C.sky,
      accent: C.monarch,
      door: C.rose,
      glass: C.luna,
    }),
  },
};
