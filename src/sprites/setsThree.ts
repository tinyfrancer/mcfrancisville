import type { ThirdSuitePiece } from '../types/ids';
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
  type Material,
} from './buildings';
import type { Frames } from './frames';
import type { FurnitureArt } from './furniture';
import {
  ball,
  bevelIn,
  candle,
  FIRE,
  FIRE_LIGHT,
  FIRE_LIT,
  frame,
  palette,
  slab,
  WOOD,
} from './furnish';
import { flame, flames } from './motion';
import { PALETTE as C } from './palette';
import { crescent, heart, star } from './sets';
import { Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The two winter sets (1.4's G2, decision 371), at 32, drawn as the others are (`sets.ts`,
 * `setsTwo.ts`): Cosy Cabin in round logs, red plaid, cream and moss, warm by its stove; and
 * Midnight Observatory in navy, brass and plum velvet, with stars on everything. Knitting and fur
 * at 32 are a texture of their own tones in rows or rings, never a dither: a braid's ring a stitch
 * at a time, a patchwork's squares with a running stitch along the seams.
 */

/** Round logs laid along, `h` tall, their grain in lines and an end ring at each end. */
function log(s: Sketch, x: number, y: number, w: number, h: number, m: Material): void {
  s.rect(x, y, w, h, fillOf(m)).rect(x, y, w, 1, lightOf(m));
  s.rect(x, y + h - 1, w, 1, shadeOf(m));
  for (let i = x + 3; i < x + w - 3; i += 7) s.rect(i, y + Math.floor(h / 2), 3, 1, shadeOf(m));
  for (const ex of [x, x + w - 1]) {
    s.rect(ex, y, 1, h, lightOf(m));
    s.set(ex, y + Math.floor(h / 2), shadeOf(m));
  }
}

/** A run of plaid: squares of a material crossed by bands of its shade and lines of cream. */
function plaid(s: Sketch, x: number, y: number, w: number, h: number, m: Material): void {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      const across = (j - y) % 4 === 1;
      const down = (i - x) % 4 === 1;
      const key =
        across && down
          ? darkOf(m)
          : across || down
            ? shadeOf(m)
            : (i - x) % 8 === 3 || (j - y) % 8 === 3
              ? fillOf(WALL)
              : fillOf(m);
      s.set(i, j, key);
    }
  }
}

// ---- Cosy Cabin ---------------------------------------------------------------------------------

/** A pot-bellied stove on four legs, its fire behind a grated window, its pipe to the ceiling. */
function drawLogStove(beat: number | null = null): SpriteSource {
  const s = new Sketch(32, 64);
  // The pipe, up and over the wall, two collars round it.
  s.rect(13, 0, 6, 26, fillOf(STONE)).rect(13, 0, 1, 26, lightOf(STONE));
  s.rect(18, 0, 1, 26, shadeOf(STONE));
  for (const y of [7, 18]) s.rect(12, y, 8, 2, shadeOf(STONE)).rect(12, y, 8, 1, fillOf(STONE));
  // The top plate, the round belly and a brass rail round it.
  slab(s, 6, 25, 20, 4, STONE);
  ball(s, 16, 40, 12, 12, STONE);
  s.rect(4, 32, 24, 1, LAMP).set(5, 32, GLINT);
  // The door, its round window and the fire inside, behind three bars.
  s.ellipse(16, 43, 6.5, 5.5, darkOf(STONE));
  if (beat === null) {
    s.ellipse(16, 44.5, 4.5, 3, FIRE).rect(14, 44, 4, 2, FIRE_LIGHT);
  } else {
    flames(s, 16, 45, 4.5, 3, FIRE, FIRE_LIGHT, beat, new Set([darkOf(STONE)]));
  }
  for (const x of [12, 16, 20]) s.rect(x, 39, 1, 9, shadeOf(STONE));
  s.rect(9, 42, 1, 3, LAMP).set(9, 42, GLINT);
  // The base, and four stout curled legs.
  slab(s, 5, 52, 22, 4, STONE);
  for (const x of [6, 23]) {
    s.rect(x, 56, 3, 5, darkOf(STONE)).rect(x - 1, 60, 2, 2, darkOf(STONE));
  }
  return finish(s);
}

const LOG_STOVE = drawLogStove();

/** An oval rug braided round and round in red, cream and moss, each ring a stitch at a time. */
const KNIT_RUG = (() => {
  const s = new Sketch(64, 32);
  const rings: Material[] = [ACCENT, WALL, DOOR, ACCENT, WALL, DOOR];
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 64; x++) {
      const d = Math.hypot((x + 0.5 - 32) / 30, (y + 0.5 - 16) / 14);
      if (d > 1) continue;
      const ring = Math.min(rings.length - 1, Math.floor((1 - d) * rings.length * 1.15));
      const m = rings[ring]!;
      // A braid: every third stitch along a ring a little lighter, every third darker.
      const along = Math.round(Math.atan2(y + 0.5 - 16, (x + 0.5 - 32) / 2.1) * 9);
      const stitch = ((along % 3) + 3) % 3;
      s.set(x, y, stitch === 0 ? lightOf(m) : stitch === 1 ? fillOf(m) : shadeOf(m));
    }
  }
  return finish(s);
})();

/**
 * A patchwork rug sewn in the shape of a bear: round head, round ears, a body and four paws, in
 * squares of red, cream and moss with a running stitch along every seam and round its edge, two
 * button eyes and a stitched smile. A rug, and plainly one.
 */
const BEAR_RUG = (() => {
  const s = new Sketch(64, 64);
  const inside = (x: number, y: number) => {
    const blob = (cx: number, cy: number, rx: number, ry: number) =>
      ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
    return (
      blob(32, 15, 11, 10) ||
      blob(22.5, 6, 4, 4) ||
      blob(41.5, 6, 4, 4) ||
      blob(32, 40, 20, 17) ||
      blob(13, 29, 6, 5) ||
      blob(51, 29, 6, 5) ||
      blob(15, 56, 6, 5) ||
      blob(49, 56, 6, 5)
    );
  };
  const patches: Material[] = [ACCENT, WALL, DOOR];
  // The head is one cream patch, so the face reads; the ears are lined in red.
  const head = (x: number, y: number) =>
    ((x + 0.5 - 32) / 11) ** 2 + ((y + 0.5 - 15) / 10) ** 2 <= 1 || y < 10;
  for (let y = 1; y < 63; y++) {
    for (let x = 1; x < 63; x++) {
      if (!inside(x, y)) continue;
      if (head(x, y)) {
        const ear = Math.hypot(x + 0.5 - (x < 32 ? 22.5 : 41.5), y + 0.5 - 6) < 2.2;
        s.set(x, y, ear ? fillOf(ACCENT) : fillOf(WALL));
        continue;
      }
      const m = patches[(Math.floor((x - 2) / 8) + Math.floor((y - 3) / 8)) % 3]!;
      s.set(x, y, fillOf(m));
      // A seam: the patch's edge, a running stitch every other pixel.
      const seam = (x - 2) % 8 === 0 || (y - 3) % 8 === 0;
      if (seam) s.set(x, y, (x + y) % 2 ? shadeOf(m) : lightOf(m));
    }
  }
  // A running stitch round the edge, a pixel in.
  for (let y = 1; y < 63; y++) {
    for (let x = 1; x < 63; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x + 2, y) || !inside(x - 2, y) || !inside(x, y + 2) || !inside(x, y - 2);
      const rim = !inside(x + 1, y) || !inside(x - 1, y) || !inside(x, y + 1) || !inside(x, y - 1);
      if (edge && !rim && (x + y) % 3 === 0) s.set(x, y, WHITE);
    }
  }
  // The face: two button eyes, a nose patch and a stitched smile.
  for (const x of [26, 36]) {
    s.rect(x, 12, 3, 3, INK)
      .set(x, 12, darkOf(STONE))
      .set(x + 1, 13, darkOf(STONE));
  }
  heart(s, 30, 17, 5, 3, fillOf(ACCENT_TWO));
  for (const [x, y] of [
    [28, 21],
    [30, 22],
    [32, 22],
    [34, 22],
    [36, 21],
  ] as const) {
    s.set(x, y, INK);
  }
  return finish(s);
})();

/** A wooden rocking chair: a spindle back with a plaid cushion, a throw over one arm, rockers. */
const ROCKING_CHAIR = (() => {
  const s = new Sketch(32, 48);
  // The back: two posts with knobs, a curved top rail and spindles between.
  for (const x of [4, 25]) {
    slab(s, x, 2, 3, 30, TRIM);
    ball(s, x + 1, 2, 2, 2, TRIM);
  }
  for (let x = 6; x < 26; x++)
    s.set(x, 5 - Math.round(Math.sin(((x - 6) / 19) * Math.PI) * 2), fillOf(TRIM));
  s.rect(6, 5, 20, 3, fillOf(TRIM)).rect(6, 5, 20, 1, lightOf(TRIM));
  for (const x of [9, 13, 17, 21])
    s.rect(x, 8, 2, 20, fillOf(TRIM)).rect(x, 8, 1, 20, lightOf(TRIM));
  // The plaid cushion tied to the back, and the one on the seat.
  plaid(s, 8, 11, 16, 14, ROOF);
  bevelIn(s, 8, 11, 16, 14, ROOF);
  slab(s, 3, 27, 26, 4, TRIM);
  plaid(s, 5, 25, 22, 4, ROOF);
  // The arms, and the throw over the left one, knitted in rows.
  for (const x of [1, 27]) slab(s, x, 20, 4, 3, TRIM);
  for (let y = 18; y < 38; y++) {
    for (let x = 0; x < 6; x++) {
      if (y > 30 && x > 4 - (y - 30) / 3) continue;
      s.set(x, y, y % 2 ? fillOf(DOOR) : (x + y) % 4 === 0 ? lightOf(DOOR) : shadeOf(DOOR));
    }
  }
  s.set(1, 38, fillOf(DOOR)).set(3, 38, fillOf(DOOR));
  // The front of the seat, the legs, and the rockers curving under them.
  slab(s, 4, 31, 24, 3, TRIM);
  for (const x of [6, 23]) s.rect(x, 34, 3, 8, fillOf(TRIM)).rect(x, 34, 1, 8, lightOf(TRIM));
  for (let x = 1; x < 31; x++) {
    const y = Math.round(44 - Math.cos(((x - 16) / 15) * 1.2) * 2);
    s.rect(x, y, 1, 2, x < 4 || x > 27 ? shadeOf(TRIM) : fillOf(TRIM));
  }
  return finish(s);
})();

/** A bed of round logs under a patchwork quilt, a plaid blanket folded at its foot. */
const QUILT_BED = (() => {
  const s = new Sketch(64, 92);
  // The headboard: two log posts with sawn tops, and logs laid across between them.
  for (const x of [1, 56]) {
    slab(s, x, 6, 7, 84, TRIM);
    s.ellipse(x + 3.5, 6, 3.5, 2, lightOf(TRIM)).set(x + 3, 6, shadeOf(TRIM));
  }
  for (const y of [12, 20, 28, 36]) log(s, 8, y, 48, 7, TRIM);
  // Two pillows, plump and white, and the quilt in squares of the cabin's colours.
  slab(s, 9, 40, 22, 11, WALL);
  slab(s, 33, 40, 22, 11, WALL);
  s.rect(10, 49, 44, 1, shadeOf(WALL));
  const patches: Material[] = [ACCENT, WALL, DOOR, ROOF];
  for (let y = 50; y < 80; y++) {
    for (let x = 8; x < 56; x++) {
      const m = patches[(Math.floor((x - 8) / 8) + 2 * Math.floor((y - 50) / 8)) % patches.length]!;
      const seam = (x - 8) % 8 === 0 || (y - 50) % 8 === 0;
      s.set(x, y, seam ? ((x + y) % 2 ? shadeOf(m) : lightOf(m)) : fillOf(m));
    }
  }
  s.rect(8, 50, 48, 2, fillOf(WALL)).rect(8, 50, 48, 1, lightOf(WALL));
  // The folded plaid blanket across the foot, and the log footboard.
  plaid(s, 8, 72, 48, 8, ROOF);
  s.rect(8, 72, 48, 1, lightOf(ROOF)).rect(8, 79, 48, 1, darkOf(ROOF));
  log(s, 4, 80, 56, 8, TRIM);
  for (const x of [1, 56]) s.rect(x, 88, 7, 3, darkOf(TRIM));
  return finish(s);
})();

/** A little wooden mug tree on a round foot, three fat mugs hung from its branches. */
const MUG_TREE = (() => {
  const s = new Sketch(32, 32);
  // The foot and the trunk, a knob on top.
  s.ellipse(16, 29, 9, 2.5, fillOf(TRIM)).rect(8, 30, 17, 1, darkOf(TRIM));
  s.rect(15, 4, 3, 25, fillOf(TRIM)).rect(15, 4, 1, 25, lightOf(TRIM));
  ball(s, 16, 3, 2, 2, TRIM);
  // Three branches and a mug on each: red, cream and moss, each with its handle on the peg.
  const mugs: [number, number, Material, 1 | -1][] = [
    [5, 9, ACCENT, -1],
    [21, 13, WALL, 1],
    [6, 19, DOOR, -1],
  ];
  for (const [x, y, m, side] of mugs) {
    const peg = side < 0 ? x + 7 : x;
    s.line(16, y - 2, peg, y, fillOf(TRIM));
    slab(s, x, y, 7, 8, m);
    s.rect(x + 1, y + 1, 5, 1, lightOf(m));
    s.rect(side < 0 ? x + 7 : x - 1, y + 2, 1, 4, fillOf(m));
  }
  // A heart on the cream one.
  heart(s, 23, 15, 3, 3, fillOf(ACCENT));
  return finish(s);
})();

/** Each bulb's key, never outlined, lit after dark: gold, red, blue and green, as the fair's. */
const BULBS = ['1', '2', '3', '4'] as const;

/** A swag of pine across the wall in two dips, a string of little lights along it. */
const TWINKLE_LIGHTS = (() => {
  const s = new Sketch(64, 32);
  const sag = (x: number) => 6 + Math.round(Math.sin(((x % 32) / 32) * Math.PI) * 9);
  // The pine: needle tufts along the swag, dark under and lit on top.
  for (let x = 1; x < 63; x++) {
    const y = sag(x);
    s.rect(x, y - 2, 1, 5, fillOf(LEAVES));
    s.set(x, y - 2, x % 2 ? lightOf(LEAVES) : fillOf(LEAVES)).set(x, y + 2, shadeOf(LEAVES));
    if (x % 3 === 0) s.set(x, y - 3, fillOf(LEAVES)).set(x, y + 3, shadeOf(LEAVES));
  }
  // The hooks it hangs from, with a red bow on each.
  for (const x of [1, 31, 62]) {
    s.rect(x - 1, 1, 3, 3, fillOf(ACCENT))
      .set(x - 2, 2, fillOf(ACCENT))
      .set(x + 2, 2, fillOf(ACCENT));
    s.set(x, 4, shadeOf(ACCENT))
      .set(x - 1, 5, fillOf(ACCENT))
      .set(x + 1, 5, fillOf(ACCENT));
  }
  // The bulbs, hung under the pine every five pixels, each a colour in turn.
  for (let x = 4, i = 0; x < 61; x += 5, i++) {
    const y = sag(x) + 4;
    s.set(x, y - 1, INK);
    s.rect(x, y, 2, 2, BULBS[i % BULBS.length]!).set(x, y + 2, BULBS[i % BULBS.length]!);
  }
  return finish(s);
})();

/** The bulbs by day, softly coloured. */
const BULBS_BY_DAY: Palette = { 1: C.gold, 2: C.scarlet, 3: C.sky, 4: C.leaf };

/** The bulbs lit, and lit with every other one dimmed, for a slow twinkle. */
const BULBS_LIT: Palette = { 1: C.candleBright, 2: C.roseLight, 3: C.iceLight, 4: C.leafLight };

/** A slow twinkle: now the gold and blue bulbs dip, now the red and green. */
const TWINKLE: Frames = {
  glows: [
    BULBS_LIT,
    { ...BULBS_LIT, 1: C.candle, 3: C.sky },
    { ...BULBS_LIT, 2: C.rose, 4: C.leaf },
  ],
  period: 4800,
  order: [0, 1, 0, 2],
};

// ---- Midnight Observatory -----------------------------------------------------------------------

/** A brass telescope on a wooden tripod, pointing up at the sky over her left shoulder. */
const BRASS_TELESCOPE = (() => {
  const s = new Sketch(32, 64);
  // The tripod: three legs from the head to the floor, the middle one behind.
  const head: [number, number] = [18, 34];
  for (const [fx, key] of [
    [17, shadeOf(TRIM)],
    [5, fillOf(TRIM)],
    [29, fillOf(TRIM)],
  ] as const) {
    s.line(head[0], head[1], fx, 61, key).line(head[0] + 1, head[1], fx + 1, 61, key);
    s.rect(fx, 61, 3, 2, darkOf(TRIM));
  }
  s.line(9, 52, 26, 52, shadeOf(TRIM));
  slab(s, 15, 32, 7, 5, TRIM);
  // The tube: brass, wider at the far end, banded, its glass catching the light.
  const from: [number, number] = [24, 31];
  const to: [number, number] = [4, 7];
  const steps = Math.hypot(to[0] - from[0], to[1] - from[1]);
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const x = from[0] + (to[0] - from[0]) * t;
    const y = from[1] + (to[1] - from[1]) * t;
    const r = 2 + t * 2.2;
    s.ellipse(x, y, r, r, fillOf(ACCENT_TWO));
  }
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const x = Math.round(from[0] + (to[0] - from[0]) * t - (2 + t * 2.2) * 0.6);
    const y = Math.round(from[1] + (to[1] - from[1]) * t - (2 + t * 2.2) * 0.6);
    s.set(x, y, lightOf(ACCENT_TWO));
  }
  for (const t of [0.25, 0.55, 0.85]) {
    const x = from[0] + (to[0] - from[0]) * t;
    const y = from[1] + (to[1] - from[1]) * t;
    const r = 2.2 + t * 2.2;
    s.line(
      Math.round(x - r * 0.7),
      Math.round(y + r * 0.7),
      Math.round(x + r * 0.7),
      Math.round(y - r * 0.7),
      darkOf(ACCENT_TWO),
    );
  }
  s.ellipse(3.5, 6.5, 3, 3, GLASS).set(3, 5, GLINT).set(2, 6, GLINT);
  // The eyepiece, and a little star stamped on the tube.
  s.rect(24, 30, 4, 4, darkOf(ACCENT_TWO)).rect(27, 32, 2, 3, darkOf(ACCENT_TWO));
  star(s, 13, 18, LAMP, WHITE);
  return finish(s);
})();

/** A chart of the night sky in a dark wood frame, constellations joined in gold, a moon. */
const CELESTIAL_CHART = (() => {
  const s = new Sketch(64, 32);
  frame(s, 1, 1, 62, 30, TRIM, 3);
  s.rect(4, 4, 56, 24, fillOf(ROOF));
  // A ring round the sky, like a planisphere's.
  for (let a = 0; a < 80; a++) {
    const t = (a / 80) * Math.PI * 2;
    s.set(
      Math.round(32 + Math.cos(t) * 26),
      Math.round(16 + Math.sin(t) * 11),
      shadeOf(ACCENT_TWO),
    );
  }
  // Three constellations: a cat, a cauldron and a bat, each joined up in gold.
  const shapes: (readonly [number, number])[][] = [
    [
      [10, 9],
      [14, 12],
      [19, 11],
      [22, 15],
      [17, 19],
    ],
    [
      [27, 18],
      [31, 21],
      [36, 21],
      [40, 18],
      [27, 18],
    ],
    [
      [42, 9],
      [47, 12],
      [50, 8],
      [53, 12],
      [57, 9],
    ],
  ];
  for (const shape of shapes) {
    shape.forEach(([x, y], i) => {
      const next = shape[i + 1];
      if (next) s.line(x, y, next[0], next[1], darkOf(ACCENT_TWO));
    });
    for (const [x, y] of shape) star(s, x, y, LAMP, WHITE);
  }
  for (const [x, y] of [
    [7, 24],
    [33, 7],
    [45, 24],
    [24, 6],
    [55, 22],
  ] as const) {
    s.set(x, y, WHITE);
  }
  crescent(s, 52, 20, 3.5, fillOf(WALL));
  return finish(s);
})();

/** The little moon in its brass crescent on a wooden foot, a crater or three on its face. */
const LUNAR_GLOBE = (() => {
  const s = new Sketch(32, 36);
  s.ellipse(16, 32, 8, 2.5, fillOf(TRIM)).rect(8, 33, 17, 1, darkOf(TRIM));
  s.rect(15, 26, 3, 6, fillOf(ACCENT_TWO)).rect(15, 26, 1, 6, lightOf(ACCENT_TWO));
  // The brass crescent cradling it, open at the top.
  for (let a = 0; a <= 30; a++) {
    const t = Math.PI * (0.15 + (a / 30) * 0.7);
    const x = Math.round(16 + Math.cos(t) * 11);
    const y = Math.round(14 + Math.sin(t) * 11);
    s.rect(x, y, 2, 2, fillOf(ACCENT_TWO));
  }
  ball(s, 16, 14, 9, 9, STONE);
  for (const [x, y, r] of [
    [12, 11, 2],
    [19, 16, 2.5],
    [14, 19, 1.5],
    [20, 9, 1.2],
  ] as const) {
    s.ellipse(x, y, r, r, shadeOf(STONE)).set(
      Math.round(x - r / 2),
      Math.round(y - r / 2),
      darkOf(STONE),
    );
  }
  return finish(s);
})();

/** A long chaise in plum velvet: a scrolled end, buttoned, brass feet and a star cushion. */
const VELVET_CHAISE = (() => {
  const s = new Sketch(64, 44);
  // The scrolled back at its head, rising and curling over.
  for (let x = 2; x < 22; x++) {
    const top = Math.round(6 + ((x - 2) / 20) ** 1.6 * 16);
    s.rect(x, top, 1, 34 - top, fillOf(DOOR));
  }
  s.ellipse(6, 7, 5, 4, fillOf(DOOR)).ellipse(6, 7, 2, 1.5, shadeOf(DOOR));
  bevelIn(s, 0, 0, 24, 34, DOOR);
  // The long seat, buttoned, and its front.
  slab(s, 2, 22, 60, 9, DOOR);
  s.rect(3, 23, 58, 1, lightOf(DOOR));
  for (let x = 12; x < 60; x += 8) s.set(x, 26, darkOf(DOOR)).set(x - 1, 25, lightOf(DOOR));
  slab(s, 2, 30, 60, 8, DOOR);
  s.rect(2, 30, 60, 1, LAMP);
  // The star cushion at the head.
  slab(s, 6, 15, 12, 10, ROOF);
  star(s, 12, 20, LAMP, WHITE);
  s.set(10, 18, LAMP).set(14, 22, LAMP);
  // Brass feet.
  for (const x of [3, 30, 57])
    s.rect(x, 38, 4, 4, fillOf(ACCENT_TWO)).set(x, 38, lightOf(ACCENT_TWO));
  return finish(s);
})();

/** Three candles on a brass tray, tall, middling and wee, wax dripping down them. */
const CANDLE_CLUSTER = (() => {
  const s = new Sketch(32, 30);
  s.ellipse(16, 26, 13, 3, fillOf(ACCENT_TWO));
  s.rect(4, 26, 25, 1, lightOf(ACCENT_TWO)).rect(4, 28, 25, 1, darkOf(ACCENT_TWO));
  for (const [x, top, tall] of [
    [7, 13, 10],
    [14, 4, 19],
    [21, 9, 14],
  ] as const) {
    candle(s, x, top, tall, 4);
    s.set(x, top + 4, WHITE)
      .set(x, top + 5, WHITE)
      .set(x + 3, top + 6, shadeOf(WALL));
  }
  return finish(s);
})();

/** A deep blue rug with a gold border, its stars joined into constellations. */
const CONSTELLATION_RUG = (() => {
  const s = new Sketch(64, 32);
  slab(s, 2, 2, 60, 28, ROOF);
  s.rect(4, 4, 56, 24, darkOf(ACCENT_TWO)).rect(5, 5, 54, 22, fillOf(ROOF));
  const sky: (readonly [number, number])[][] = [
    [
      [10, 10],
      [15, 13],
      [21, 11],
      [26, 15],
    ],
    [
      [34, 20],
      [38, 16],
      [44, 18],
      [49, 13],
      [54, 15],
    ],
  ];
  for (const shape of sky) {
    shape.forEach(([x, y], i) => {
      const next = shape[i + 1];
      if (next) s.line(x, y, next[0], next[1], shadeOf(ACCENT_TWO));
    });
    for (const [x, y] of shape) star(s, x, y, LAMP, WHITE);
  }
  for (const [x, y] of [
    [8, 22],
    [30, 8],
    [42, 9],
    [56, 23],
    [20, 22],
  ] as const) {
    s.set(x, y, LAMP);
  }
  crescent(s, 17, 20, 3, fillOf(WALL));
  return finish(s);
})();

// ---- Every piece --------------------------------------------------------------------------------

const lit = (x: number, y: number, radius: number) => [{ x, y, radius }];

/** Cosy Cabin's: honey logs, red plaid, cream, moss, an iron stove and pine. */
const CABIN = {
  ...WOOD,
  trim: C.wood,
  roof: C.scarlet,
  wall: C.cream,
  door: C.moss,
  stone: C.iron,
  accent: C.scarlet,
  accentTwo: C.gold,
  leaves: C.hedge,
} as const;

/** Midnight Observatory's: dark wood, navy, brass, plum velvet and a silver moon. */
const OBSERVATORY = {
  ...WOOD,
  trim: C.barkDark,
  roof: C.navy,
  door: C.plum,
  wall: C.cream,
  stone: C.ghost,
  accent: C.lavender,
  accentTwo: C.gold,
  glass: C.sky,
} as const;

/** The stove's fire burning (V1's E5's frames), four beats round. */
export const SET_THREE_FRAMES = {
  logStove: () => [0, 1, 2, 3].map((beat) => drawLogStove(beat)),
} as const;

export const SET_THREE_ART: Record<ThirdSuitePiece, FurnitureArt> = {
  logStove: {
    source: LOG_STOVE,
    palette: palette(CABIN),
    glow: FIRE_LIT,
    lights: lit(16, 44, 52),
    frames: { sources: SET_THREE_FRAMES.logStove, period: 900 },
  },
  knitRug: { source: KNIT_RUG, palette: palette(CABIN) },
  bearRug: { source: BEAR_RUG, palette: palette({ ...CABIN, stone: C.creamShade }) },
  rockingChair: { source: ROCKING_CHAIR, palette: palette(CABIN) },
  quiltBed: { source: QUILT_BED, palette: palette({ ...CABIN, roof: C.navy }) },
  mugTree: { source: MUG_TREE, palette: palette(CABIN) },
  twinkleLights: {
    source: TWINKLE_LIGHTS,
    palette: { ...palette(CABIN), ...BULBS_BY_DAY },
    glow: BULBS_LIT,
    lights: lit(32, 14, 40),
    frames: TWINKLE,
  },
  brassTelescope: { source: BRASS_TELESCOPE, palette: palette(OBSERVATORY) },
  celestialChart: { source: CELESTIAL_CHART, palette: palette(OBSERVATORY) },
  lunarGlobe: {
    source: LUNAR_GLOBE,
    palette: palette(OBSERVATORY),
    glow: {
      [shadeOf(STONE)]: C.moonRim,
      [fillOf(STONE)]: C.white,
      [lightOf(STONE)]: C.white,
    },
    lights: lit(16, 14, 30),
  },
  velvetChaise: { source: VELVET_CHAISE, palette: palette(OBSERVATORY) },
  candleCluster: {
    source: CANDLE_CLUSTER,
    palette: palette(OBSERVATORY),
    glow: FIRE_LIT,
    lights: lit(16, 6, 40),
    frames: flame(FIRE_LIT, 3600),
  },
  constellationRug: { source: CONSTELLATION_RUG, palette: palette(OBSERVATORY) },
};
