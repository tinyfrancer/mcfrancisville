import type { FixtureId, FurnitureId } from '../types/ids';
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
} from './buildings';
import type { FurnitureArt } from './furniture';
import { ball, candle, FIRE, FIRE_LIT, frame, palette, slab, WOOD } from './furnish';
import type { FixtureArt } from './interiors';
import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';

/*
 * What stands in the newcomers' homes (phase T): the piece most like each of them (Ollie's sorting
 * table, Nessa's lantern rack, Gourdon's bench, Hazel's great telescope), their keepsakes, what
 * each teaches her to make, and what each gives her. Drawn at 32, as the rest of the furniture is.
 */

/** Legs under a top: `x` and `w` the top's, standing on `bottom`. */
function legs(s: Sketch, x: number, w: number, top: number, bottom: number): void {
  s.rect(x + 2, top, 3, bottom - top, fillOf(TRIM)).rect(
    x + w - 5,
    top,
    3,
    bottom - top,
    fillOf(TRIM),
  );
  s.rect(x + 2, top, 1, bottom - top, lightOf(TRIM));
}

/** A sealed envelope, `w` by `h`, its flap in the ink of a stamp. */
function envelope(s: Sketch, x: number, y: number, w: number, h: number): void {
  s.rect(x, y, w, h, WHITE);
  for (let k = 0; k < Math.floor(w / 2); k++) {
    s.set(x + k, y + Math.min(k, h - 1), shadeOf(WALL));
    s.set(x + w - 1 - k, y + Math.min(k, h - 1), shadeOf(WALL));
  }
  s.set(x + w - 2, y + 1, fillOf(ACCENT));
}

// ---- Their fixtures ----------------------------------------------------------------------------

const SORTING_TABLE = (() => {
  const s = new Sketch(64, 46);
  // A table of letters in three piles, each with its label, and a sack of post underneath.
  slab(s, 0, 22, 64, 5, TRIM);
  legs(s, 0, 64, 27, 46);
  for (const [x, n] of [
    [4, 5],
    [24, 7],
    [44, 3],
  ] as const) {
    for (let k = 0; k < n; k++) envelope(s, x + (k % 2), 20 - k * 2, 14, 4);
    slab(s, x + 2, 12 - n * 2, 10, 4, ACCENT_TWO);
  }
  s.ellipse(32, 38, 10, 7, fillOf(STONE)).ellipse(30, 36, 6, 3, lightOf(STONE));
  envelope(s, 28, 30, 8, 4);
  return finish(s);
})();

const LANTERN_RACK = (() => {
  const s = new Sketch(64, 52);
  // A wooden rack, lanterns hung from its bar waiting for the evening, and more on the shelf.
  s.rect(3, 4, 4, 48, fillOf(TRIM)).rect(57, 4, 4, 48, fillOf(TRIM));
  slab(s, 0, 2, 64, 4, TRIM);
  slab(s, 3, 38, 58, 4, TRIM);
  const lantern = (cx: number, top: number) => {
    s.rect(cx, top - 4, 1, 4, darkOf(TRIM));
    ball(s, cx + 0.5, top + 6, 5, 6, ACCENT);
    for (let j = top + 1; j < top + 12; j += 3) s.rect(cx - 4, j, 9, 1, shadeOf(ACCENT));
    s.rect(cx - 2, top, 5, 1, darkOf(TRIM)).rect(cx - 2, top + 12, 5, 1, darkOf(TRIM));
    s.set(cx, top + 6, FIRE);
  };
  for (const cx of [14, 26, 38, 50]) lantern(cx, 10);
  for (const cx of [16, 32, 48]) {
    s.ellipse(cx, 32, 5, 5, fillOf(ACCENT_TWO)).rect(cx - 5, 32, 11, 5, fillOf(ACCENT_TWO));
    s.rect(cx - 5, 32, 11, 1, lightOf(ACCENT_TWO));
  }
  return finish(s);
})();

const CARPENTERS_BENCH = (() => {
  const s = new Sketch(64, 50);
  // A thick bench with a vice at one end, a plane and curls of sawdust, and a little chair on top
  // that is very nearly finished.
  slab(s, 0, 26, 64, 6, TRIM);
  legs(s, 0, 64, 32, 50);
  slab(s, 4, 42, 56, 3, TRIM);
  slab(s, 52, 20, 10, 8, STONE);
  s.rect(55, 16, 4, 4, darkOf(STONE));
  // The chair: a back, a seat and legs, one leg still to go.
  slab(s, 12, 4, 3, 22, DOOR);
  slab(s, 12, 14, 18, 3, DOOR);
  s.rect(26, 17, 2, 9, fillOf(DOOR));
  // The plane, and curls of shavings.
  slab(s, 34, 21, 12, 5, DOOR);
  s.rect(38, 18, 3, 3, fillOf(STONE));
  for (const [x, y] of [
    [48, 24],
    [8, 24],
    [20, 47],
    [40, 47],
  ] as const) {
    s.set(x, y, lightOf(TRIM))
      .set(x + 1, y - 1, lightOf(TRIM))
      .set(x + 2, y, lightOf(TRIM));
  }
  return finish(s);
})();

/** A brass telescope on a tripod, its tube reaching up to the right. */
function telescope(s: Sketch, x: number, bottom: number, length: number, thick: number): void {
  const footX = x + 8;
  const hub = bottom - Math.round(length * 0.45);
  for (const dx of [-8, 0, 8]) {
    for (let j = hub; j < bottom; j++) {
      const t = (j - hub) / (bottom - hub);
      s.set(footX + Math.round(dx * t), j, fillOf(TRIM));
    }
  }
  for (let k = 0; k < length; k++) {
    const cx = footX - 6 + k;
    const cy = hub + 3 - Math.round(k * 0.7);
    s.rect(cx, cy - Math.floor(thick / 2), 1, thick, fillOf(ACCENT_TWO));
    s.set(cx, cy - Math.floor(thick / 2), lightOf(ACCENT_TWO));
  }
  const endX = footX - 6 + length;
  const endY = hub + 3 - Math.round(length * 0.7);
  s.rect(endX - 2, endY - thick, 3, thick * 2, darkOf(ACCENT_TWO));
  s.rect(footX - 8, hub + 1, 4, 4, darkOf(ACCENT_TWO));
}

const BIG_TELESCOPE = (() => {
  const s = new Sketch(64, 60);
  telescope(s, 8, 60, 50, 7);
  // A little stool to stand on, and a notebook of stars.
  slab(s, 40, 48, 18, 4, TRIM);
  s.rect(42, 52, 3, 8, fillOf(TRIM)).rect(53, 52, 3, 8, fillOf(TRIM));
  s.rect(43, 44, 12, 4, WHITE).set(46, 45, fillOf(ACCENT_TWO)).set(51, 46, fillOf(ACCENT_TWO));
  return finish(s);
})();

export const NEWCOMER_FIXTURE_ART: Pick<
  Record<FixtureId, FixtureArt>,
  'sortingTable' | 'lanternRack' | 'carpentersBench' | 'bigTelescope'
> = {
  sortingTable: {
    source: SORTING_TABLE,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      accent: C.scarlet,
      accentTwo: C.cream,
      stone: C.rope,
    }),
  },
  lanternRack: {
    source: LANTERN_RACK,
    palette: palette({ ...WOOD, trim: C.bark, accent: C.lavender, accentTwo: C.orbGreen }),
    glow: { [FIRE]: C.candle, [fillOf(ACCENT)]: C.candle, [lightOf(ACCENT)]: C.candleBright },
    lights: [{ x: 32, y: 16, radius: 34 }],
  },
  carpentersBench: {
    source: CARPENTERS_BENCH,
    palette: palette({ ...WOOD, trim: C.wood, door: C.bark, stone: C.iron }),
  },
  bigTelescope: {
    source: BIG_TELESCOPE,
    palette: palette({ ...WOOD, trim: C.bark, accentTwo: C.gold }),
  },
};

// ---- Ollie's ------------------------------------------------------------------------------------

const STAMP_ALBUM = (() => {
  const s = new Sketch(32, 34);
  // An album open on a little lectern, a page of stamps each side.
  s.rect(14, 20, 4, 14, fillOf(TRIM)).rect(8, 31, 16, 3, fillOf(TRIM));
  for (let j = 0; j < 10; j++) {
    s.rect(2 + Math.floor(j / 3), 8 + j, 13, 1, WHITE).rect(
      17,
      8 + j,
      13 - Math.floor(j / 3),
      1,
      WHITE,
    );
  }
  s.rect(15, 8, 2, 12, shadeOf(DOOR)).rect(1, 18, 30, 3, fillOf(DOOR));
  const stamps = [ACCENT, ACCENT_TWO, LEAVES, ROOF];
  let n = 0;
  for (const [x, y] of [
    [4, 10],
    [9, 10],
    [4, 14],
    [9, 14],
    [19, 10],
    [24, 10],
    [19, 14],
  ] as const) {
    s.rect(x, y, 4, 3, fillOf(stamps[n++ % stamps.length]!));
  }
  return finish(s);
})();

const PARCEL_STACK = (() => {
  const s = new Sketch(32, 36);
  // Brown-paper parcels tied with string, the smallest on top with a tag.
  const parcel = (x: number, y: number, w: number, h: number) => {
    slab(s, x, y, w, h, TRIM);
    s.rect(x + Math.floor(w / 2), y, 1, h, WHITE).rect(x, y + Math.floor(h / 2), w, 1, WHITE);
  };
  parcel(2, 20, 28, 16);
  parcel(6, 9, 20, 11);
  parcel(10, 1, 12, 8);
  s.rect(22, 3, 5, 4, fillOf(ACCENT_TWO)).set(21, 4, WHITE);
  return finish(s);
})();

const PIGEONHOLES = (() => {
  const s = new Sketch(32, 32);
  // A board of cubbies, three by three, letters tucked into most of them.
  slab(s, 1, 1, 30, 30, TRIM);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = 3 + c * 9;
      const y = 3 + r * 9;
      s.rect(x, y, 8, 8, darkOf(TRIM));
      if ((r * 3 + c) % 4 !== 3) envelope(s, x + 1, y + 3, 6, 5);
    }
  }
  return finish(s);
})();

const WRITING_DESK = (() => {
  const s = new Sketch(64, 40);
  // A little desk with a drawer each side, a quill in a pot of plum ink, and envelopes ready.
  slab(s, 0, 16, 64, 5, TRIM);
  slab(s, 2, 21, 16, 19, TRIM);
  slab(s, 46, 21, 16, 19, TRIM);
  for (const x of [5, 49])
    s.rect(x, 26, 10, 1, darkOf(TRIM)).rect(x + 4, 28, 2, 2, fillOf(ACCENT_TWO));
  s.rect(24, 10, 7, 6, INK).rect(25, 9, 5, 1, INK).set(26, 11, fillOf(ROOF));
  for (let k = 0; k < 12; k++) s.set(29 + Math.floor(k / 3), 9 - k, WHITE);
  s.rect(31, 0, 3, 4, WHITE);
  envelope(s, 38, 10, 12, 6);
  envelope(s, 40, 6, 12, 6);
  s.rect(8, 11, 12, 5, WHITE).rect(9, 12, 8, 1, shadeOf(WALL)).rect(9, 14, 6, 1, shadeOf(WALL));
  return finish(s);
})();

// ---- Nessa's ------------------------------------------------------------------------------------

const SMOOTH_STONES = (() => {
  const s = new Sketch(32, 24);
  // A low bowl piled with pebbles, each one smooth and different.
  for (const [x, y, rx] of [
    [10, 9, 5],
    [20, 8, 6],
    [15, 5, 5],
    [24, 12, 4],
    [8, 13, 4],
  ] as const) {
    ball(s, x, y, rx, rx - 1, STONE);
  }
  s.ellipse(16, 16, 15, 6, fillOf(ACCENT)).rect(1, 12, 30, 4, fillOf(ACCENT));
  s.rect(1, 12, 30, 1, lightOf(ACCENT)).rect(4, 20, 24, 2, shadeOf(ACCENT));
  return finish(s);
})();

const CROSSED_OARS = (() => {
  const s = new Sketch(32, 32);
  // Two oars crossed, blades down, and a little lantern hung where they meet.
  for (const dir of [1, -1]) {
    for (let k = 0; k < 24; k++) {
      const x = dir > 0 ? 3 + k : 28 - k;
      s.rect(x, 2 + k, 2, 1, fillOf(TRIM));
    }
    const bx = dir > 0 ? 26 : 5;
    s.ellipse(bx, 27, 3.5, 4.5, fillOf(ACCENT)).ellipse(bx - 1, 26, 1.5, 2, lightOf(ACCENT));
  }
  s.rect(13, 14, 6, 8, darkOf(TRIM)).rect(14, 15, 4, 6, GLASS).set(15, 17, FIRE);
  return finish(s);
})();

const LILY_LANTERN = (() => {
  const s = new Sketch(32, 30);
  // A lily pad with a notch, a candle in a jar on it, and a moonflower tucked in beside.
  s.ellipse(16, 24, 15, 6, fillOf(LEAVES)).ellipse(13, 23, 9, 3, lightOf(LEAVES));
  for (let k = 0; k < 6; k++) s.set(16 + Math.floor(k / 2), 24 + k, CLEAR);
  s.rect(11, 8, 10, 15, GLASS).rect(11, 8, 10, 1, GLASS_DARK).set(12, 10, GLINT);
  candle(s, 14, 10, 8, 4);
  for (const [x, y] of [
    [24, 17],
    [27, 18],
    [25, 20],
    [22, 19],
  ] as const) {
    s.rect(x, y, 3, 2, WHITE);
  }
  s.set(25, 19, fillOf(ACCENT_TWO));
  return finish(s);
})();

const BUBBLE_TANK = (() => {
  const s = new Sketch(32, 46);
  // A tall tank on a little stand: lake water, weed, and the lantern fish with its light.
  slab(s, 3, 38, 26, 8, TRIM);
  s.rect(4, 4, 24, 34, GLASS).rect(4, 4, 24, 3, GLASS_DARK);
  s.rect(3, 2, 26, 2, darkOf(TRIM));
  for (let j = 18; j < 38; j++) s.set(8 + ((j >> 2) % 2), j, fillOf(LEAVES));
  for (let j = 24; j < 38; j++) s.set(23 - ((j >> 2) % 2), j, lightOf(LEAVES));
  s.ellipse(16, 20, 5, 3, fillOf(ACCENT_TWO)).set(20, 20, fillOf(ACCENT_TWO));
  s.rect(21, 18, 2, 5, fillOf(ACCENT_TWO)).set(14, 19, INK);
  s.rect(17, 12, 1, 5, darkOf(ACCENT_TWO)).set(17, 11, FIRE);
  for (const [x, y] of [
    [12, 14],
    [11, 10],
    [13, 7],
    [24, 12],
  ] as const) {
    s.set(x, y, WHITE);
  }
  return finish(s);
})();

// ---- Gourdon's ----------------------------------------------------------------------------------

const TOOL_RACK = (() => {
  const s = new Sketch(32, 32);
  // A board of pegs with a saw, a hammer and a chisel, and one hook left empty.
  slab(s, 1, 2, 30, 28, TRIM);
  for (const x of [6, 16, 25]) s.rect(x, 5, 2, 2, darkOf(TRIM));
  s.rect(3, 8, 9, 14, fillOf(STONE)).rect(3, 8, 9, 1, lightOf(STONE));
  for (let x = 3; x < 12; x += 2) s.set(x, 22, darkOf(STONE));
  s.rect(3, 22, 9, 5, fillOf(DOOR));
  s.rect(16, 7, 2, 18, fillOf(DOOR)).rect(13, 7, 8, 4, fillOf(STONE));
  s.rect(24, 7, 3, 14, fillOf(DOOR)).rect(25, 21, 1, 6, lightOf(STONE));
  return finish(s);
})();

const CARVED_OWL = (() => {
  const s = new Sketch(32, 36);
  // An owl whittled from one block: a round body, ear tufts, big eyes and folded wings.
  ball(s, 16, 23, 11, 12, TRIM);
  ball(s, 16, 11, 9, 8, TRIM);
  s.rect(8, 2, 3, 4, fillOf(TRIM)).rect(21, 2, 3, 4, fillOf(TRIM));
  for (const x of [12, 20]) s.ellipse(x, 11, 3.5, 3.5, WHITE).rect(x - 1, 10, 2, 3, INK);
  s.rect(15, 14, 2, 3, fillOf(ACCENT_TWO));
  for (let j = 20; j < 32; j += 3) s.rect(12, j, 8, 1, shadeOf(TRIM));
  s.rect(10, 34, 12, 2, darkOf(TRIM));
  return finish(s);
})();

const PUMPKIN_STOOL = (() => {
  const s = new Sketch(32, 30);
  // A pumpkin for a seat on three stout legs, smiling up at whoever sits.
  for (const x of [5, 15, 25]) s.rect(x, 16, 3, 14, fillOf(TRIM)).rect(x, 16, 1, 14, lightOf(TRIM));
  ball(s, 16, 11, 14, 9, ACCENT);
  for (const x of [9, 16, 23])
    for (let j = 4; j < 19; j++) if (s.get(x, j) !== CLEAR) s.set(x, j, shadeOf(ACCENT));
  s.rect(14, 0, 3, 4, fillOf(LEAVES));
  // A carved face, dark against the orange so it reads (0.2's K2): triangle eyes, and a wide grin
  // with two teeth left in.
  for (const x of [12, 20]) s.set(x, 7, INK).rect(x - 1, 8, 3, 1, INK);
  s.set(10, 11, INK).set(22, 11, INK);
  s.rect(11, 12, 11, 1, INK).rect(13, 13, 7, 1, INK);
  s.set(14, 12, fillOf(ACCENT)).set(18, 12, fillOf(ACCENT));
  return finish(s);
})();

const PUMPKIN_CLOCK = (() => {
  const s = new Sketch(32, 64);
  // A tall oak case: a round face up top, and through the glass a little pumpkin pendulum.
  slab(s, 4, 6, 24, 58, TRIM);
  s.rect(2, 4, 28, 4, fillOf(TRIM)).rect(2, 4, 28, 1, lightOf(TRIM));
  s.ellipse(16, 17, 8, 8, WHITE).ellipse(16, 17, 8, 8, WHITE);
  s.rect(16, 11, 1, 6, INK).rect(16, 17, 4, 1, INK);
  for (const [x, y] of [
    [16, 10],
    [23, 17],
    [16, 24],
    [9, 17],
  ] as const) {
    s.set(x, y, darkOf(TRIM));
  }
  s.rect(9, 29, 14, 28, GLASS).rect(9, 29, 14, 1, GLASS_DARK);
  s.rect(16, 29, 1, 18, fillOf(ACCENT_TWO));
  ball(s, 16.5, 49, 4, 3, ACCENT);
  s.rect(16, 45, 1, 2, fillOf(LEAVES));
  return finish(s);
})();

// ---- Hazel's ------------------------------------------------------------------------------------

const ORRERY = (() => {
  const s = new Sketch(32, 34);
  // Brass arms round a golden sun, a planet on each, on a round wooden foot.
  s.ellipse(16, 31, 10, 3, fillOf(TRIM)).rect(15, 16, 2, 15, fillOf(ACCENT_TWO));
  s.rect(2, 14, 28, 1, darkOf(ACCENT_TWO)).rect(6, 10, 1, 5, darkOf(ACCENT_TWO));
  s.rect(26, 7, 1, 8, darkOf(ACCENT_TWO));
  ball(s, 16, 13, 5, 5, ACCENT_TWO);
  ball(s, 3, 13, 2.5, 2.5, ACCENT);
  ball(s, 6, 8, 3, 3, LEAVES);
  ball(s, 26, 5, 3.5, 3.5, ROOF);
  ball(s, 29, 13, 2, 2, STONE);
  return finish(s);
})();

const MOON_GLOBE = (() => {
  const s = new Sketch(32, 36);
  // The moon on a stand, craters and all, in a brass half-ring.
  s.rect(15, 26, 2, 7, fillOf(ACCENT_TWO)).ellipse(16, 33, 8, 2.5, fillOf(TRIM));
  ball(s, 16, 14, 11, 11, STONE);
  for (const [x, y, r] of [
    [12, 10, 2.5],
    [19, 16, 3],
    [13, 19, 1.5],
    [21, 9, 1.5],
  ] as const) {
    s.ellipse(x, y, r, r, shadeOf(STONE)).set(x - 1, y - 1, darkOf(STONE));
  }
  for (let k = -10; k <= 10; k++) {
    const y = 14 + Math.round(Math.sqrt(Math.max(0, 144 - k * k)));
    s.set(16 + k, Math.min(y, 26), darkOf(ACCENT_TWO));
  }
  return finish(s);
})();

const STAR_CHART = (() => {
  const s = new Sketch(32, 32);
  // A framed chart of the night: stars joined into shapes, and one small bright one.
  frame(s, 1, 1, 30, 30, TRIM, 3);
  s.rect(4, 4, 24, 24, fillOf(ROOF));
  const stars: [number, number][] = [
    [7, 8],
    [12, 6],
    [17, 10],
    [22, 7],
    [9, 18],
    [15, 22],
    [23, 20],
  ];
  for (let k = 0; k + 1 < 4; k++) {
    const [ax, ay] = stars[k]!;
    const [bx, by] = stars[k + 1]!;
    for (let t = 0; t <= 8; t++) {
      s.set(
        Math.round(ax + ((bx - ax) * t) / 8),
        Math.round(ay + ((by - ay) * t) / 8),
        lightOf(ROOF),
      );
    }
  }
  for (const [x, y] of stars) s.set(x, y, fillOf(ACCENT_TWO));
  s.rect(19, 24, 1, 1, WHITE).set(18, 24, lightOf(ACCENT_TWO)).set(20, 24, lightOf(ACCENT_TWO));
  s.set(19, 23, lightOf(ACCENT_TWO)).set(19, 25, lightOf(ACCENT_TWO));
  return finish(s);
})();

const TELESCOPE = (() => {
  const s = new Sketch(32, 44);
  telescope(s, 0, 44, 26, 4);
  return finish(s);
})();

export const NEWCOMER_PIECES_ART: Pick<
  Record<FurnitureId, FurnitureArt>,
  | 'stampAlbum'
  | 'parcelStack'
  | 'smoothStones'
  | 'crossedOars'
  | 'toolRack'
  | 'carvedOwl'
  | 'orrery'
  | 'moonGlobe'
  | 'pigeonholes'
  | 'lilyLantern'
  | 'pumpkinStool'
  | 'starChart'
  | 'writingDesk'
  | 'bubbleTank'
  | 'pumpkinClock'
  | 'telescope'
> = {
  stampAlbum: {
    source: STAMP_ALBUM,
    palette: palette({
      ...WOOD,
      door: C.maroon,
      accent: C.scarlet,
      accentTwo: C.gold,
      roof: C.navy,
    }),
  },
  parcelStack: {
    source: PARCEL_STACK,
    palette: palette({ ...WOOD, trim: C.rope, accentTwo: C.cream }),
  },
  smoothStones: {
    source: SMOOTH_STONES,
    palette: palette({ ...WOOD, stone: C.stoneLight, accent: C.teal }),
  },
  crossedOars: {
    source: CROSSED_OARS,
    palette: palette({ ...WOOD, trim: C.wood, accent: C.teal, glass: C.dusk }),
    glow: { [FIRE]: C.candle, [GLASS]: C.candle },
    lights: [{ x: 16, y: 18, radius: 18 }],
  },
  toolRack: {
    source: TOOL_RACK,
    palette: palette({ ...WOOD, trim: C.wood, door: C.bark, stone: C.silver }),
  },
  carvedOwl: {
    source: CARVED_OWL,
    palette: palette({ ...WOOD, trim: C.wood, accentTwo: C.gold }),
  },
  orrery: {
    source: ORRERY,
    palette: palette({
      ...WOOD,
      accentTwo: C.gold,
      accent: C.scarlet,
      roof: C.lavender,
      stone: C.silver,
    }),
  },
  moonGlobe: {
    source: MOON_GLOBE,
    palette: palette({ ...WOOD, stone: C.stoneLight, accentTwo: C.gold }),
  },
  pigeonholes: {
    source: PIGEONHOLES,
    palette: palette({ ...WOOD, trim: C.wood, accent: C.scarlet }),
  },
  lilyLantern: {
    source: LILY_LANTERN,
    palette: palette({ ...WOOD, leaves: C.leaf, accentTwo: C.gold, glass: C.orbGreen }),
    glow: { ...FIRE_LIT, [GLASS]: C.orbGreenLight },
    lights: [{ x: 16, y: 14, radius: 22 }],
  },
  pumpkinStool: {
    source: PUMPKIN_STOOL,
    palette: palette({ ...WOOD, trim: C.wood, accent: C.pumpkin, leaves: C.leafDark }),
  },
  starChart: {
    source: STAR_CHART,
    palette: palette({ ...WOOD, trim: C.gold, roof: C.navy, accentTwo: C.candle }),
  },
  writingDesk: {
    source: WRITING_DESK,
    palette: palette({ ...WOOD, trim: C.wood, roof: C.plum, accent: C.scarlet, accentTwo: C.gold }),
  },
  bubbleTank: {
    source: BUBBLE_TANK,
    palette: palette({ ...WOOD, trim: C.bark, leaves: C.leaf, accentTwo: C.gold, glass: C.water }),
    glow: { [FIRE]: C.candle, [fillOf(ACCENT_TWO)]: C.candle },
    lights: [{ x: 16, y: 18, radius: 22 }],
  },
  pumpkinClock: {
    source: PUMPKIN_CLOCK,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      accent: C.pumpkin,
      accentTwo: C.gold,
      leaves: C.leafDark,
    }),
  },
  telescope: {
    source: TELESCOPE,
    palette: palette({ ...WOOD, trim: C.bark, accentTwo: C.gold }),
  },
};
