import type { SuitePiece } from '../types/ids';
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
  LAMP,
  LEAVES,
  letters,
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
import {
  ball,
  bat,
  bevelIn,
  column,
  FIRE,
  FIRE_LIGHT,
  FIRE_LIT,
  litUp,
  palette,
  slab,
  WOOD,
} from './furnish';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * The furniture sets (0.3's S3), at 32, in the building kit's materials. A set shares its woods and
 * one or two colours, so its pieces read as one room: the kitchen's sage cupboards and copper, the
 * bedroom's rose and lavender, the library's teal, oak and brass, the witch's corner's plum and
 * moss. A kitchen piece's worktop is the same height from the floor on every one of them, so a
 * counter, the sink and the stove stand in a row as one run of cupboards; the tables' tops are a
 * band seen from above over their front edge, as H3's are (`SURFACES` says how high).
 */

/** A heart, `w` wide and `h` tall from its top left: two lobes and a point. */
function heart(s: Sketch, x: number, y: number, w: number, h: number, key: string): void {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const u = ((i + 0.5) / w) * 2.4 - 1.2;
      const v = 1.25 - ((j + 0.5) / h) * 2.5;
      const a = u * u + v * v - 1;
      if (a * a * a - u * u * v * v * v <= 0) s.set(x + i, y + j, key);
    }
  }
}

/** A five-pixel star, a plus with its centre lit. */
function star(s: Sketch, x: number, y: number, key: string, centre = key): void {
  s.set(x, y - 1, key)
    .set(x - 1, y, key)
    .set(x + 1, y, key)
    .set(x, y + 1, key);
  s.set(x, y, centre);
}

/** A crescent moon of `r`, its dark side to the right, in `key`. */
function crescent(s: Sketch, cx: number, cy: number, r: number, key: string): void {
  const keep = new Sketch(s.width, s.height);
  keep.ellipse(cx, cy, r, r, 'x').ellipse(cx + r * 0.55, cy - r * 0.25, r * 0.85, r * 0.85, '.');
  keep.rows.forEach((row, j) => [...row].forEach((k, i) => k === 'x' && s.set(i, j, key)));
}

// ---- The cosy kitchen ---------------------------------------------------------------------------

/**
 * The worktop every kitchen piece shares: its rows counted up from the bottom of the sprite, so a
 * counter, the sink and the stove meet in one line; a small piece stands 30 up (`SURFACES`).
 */
const WORKTOP_FROM = 34;
const WORKTOP_TO = 28;

/** The sage cupboard under a worktop, `top` being the worktop's front edge. */
function cupboard(s: Sketch, top: number, doors: 'hearts' | 'curtain'): void {
  const bottom = s.height - 3;
  slab(s, 1, top, 30, bottom - top, DOOR);
  if (doors === 'hearts') {
    // A drawer across the top, and two doors with a heart cut out of each.
    slab(s, 3, top + 2, 26, 5, DOOR);
    s.rect(14, top + 4, 4, 1, LAMP).set(14, top + 4, GLINT);
    for (const x of [3, 17]) {
      slab(s, x, top + 9, 12, bottom - top - 11, DOOR);
      s.rect(x + 1, top + 10, 10, 1, lightOf(DOOR));
      heart(s, x + 2, top + 11, 8, 7, shadeOf(DOOR));
      s.set(x === 3 ? x + 10 : x + 1, top + 19, LAMP);
    }
  }
  // A dark toe-kick under it, as fitted cupboards have.
  s.rect(2, bottom, 28, 3, darkOf(TRIM)).rect(2, bottom, 28, 1, shadeOf(TRIM));
}

/** A butcher-block worktop seen from above: strips of oak, and its front edge. */
function worktop(s: Sketch): number {
  const y = s.height - WORKTOP_FROM;
  const deep = WORKTOP_FROM - WORKTOP_TO - 1;
  s.rect(0, y, 32, deep, fillOf(TRIM)).rect(0, y, 32, 1, lightOf(TRIM));
  for (let x = 3; x < 32; x += 7) s.rect(x, y + 1, 1, deep - 1, shadeOf(TRIM));
  for (let x = 6; x < 32; x += 7) s.set(x, y + 2, lightOf(TRIM));
  s.rect(0, y + deep, 32, 1, shadeOf(TRIM)).rect(0, y + deep + 1, 32, 1, darkOf(TRIM));
  return y + deep + 2;
}

/** A sage cupboard with heart cut-outs, under a butcher-block top. */
const COSY_COUNTER = (() => {
  const s = new Sketch(32, 40);
  cupboard(s, worktop(s), 'hearts');
  return finish(s);
})();

/** A deep white sink in the worktop, a curly brass tap, and a gingham curtain under it. */
const COSY_SINK = (() => {
  const s = new Sketch(32, 46);
  const front = worktop(s);
  const y = s.height - WORKTOP_FROM;
  // The basin, seen from above, with water in the bottom.
  s.rect(5, y + 1, 22, 4, fillOf(WALL)).rect(6, y + 2, 20, 2, shadeOf(WALL));
  s.rect(9, y + 3, 14, 1, GLASS).set(10, y + 3, GLINT);
  // The tap: a gooseneck of brass, its two little cross handles either side.
  s.rect(15, y - 9, 2, 10, LAMP)
    .rect(15, y - 10, 6, 2, LAMP)
    .rect(19, y - 8, 2, 3, LAMP);
  s.set(15, y - 9, GLINT).set(16, y - 10, GLINT);
  for (const x of [11, 20])
    s.rect(x, y - 1, 2, 2, LAMP)
      .set(x, y - 2, LAMP)
      .set(x + 1, y - 2, LAMP);
  // The sink's white apron, proud of the cupboard.
  slab(s, 3, front, 26, 8, WALL);
  s.rect(4, front + 6, 24, 1, shadeOf(WALL));
  // Sage sides, and the gingham curtain between them on a little rod.
  const bottom = s.height - 3;
  slab(s, 1, front, 2, bottom - front, DOOR);
  slab(s, 29, front, 2, bottom - front, DOOR);
  const top = front + 8;
  for (let j = top; j < bottom; j++) {
    for (let i = 3; i < 29; i++) {
      const dark = Math.floor((i - 3) / 2) % 2 === 0;
      const band = Math.floor((j - top) / 2) % 2 === 0;
      s.set(i, j, dark && band ? shadeOf(ACCENT) : dark || band ? fillOf(ACCENT) : lightOf(ACCENT));
    }
  }
  // Gathered in folds, and parted a little in the middle.
  for (const x of [8, 22]) s.rect(x, top + 1, 1, bottom - top - 1, shadeOf(ACCENT));
  s.rect(15, top + 3, 2, bottom - top - 3, darkOf(ACCENT));
  s.rect(3, top, 26, 1, LAMP);
  s.rect(2, bottom, 28, 3, darkOf(TRIM)).rect(2, bottom, 28, 1, shadeOf(TRIM));
  return finish(s);
})();

/** An iron range with a fire in its belly and a cauldron bubbling on the hob. */
const CAULDRON_STOVE = (() => {
  const s = new Sketch(32, 52);
  const y = s.height - WORKTOP_FROM;
  // The hob, an iron top seen from above, and the range's front.
  s.rect(0, y, 32, 5, fillOf(STONE)).rect(0, y, 32, 1, lightOf(STONE));
  s.rect(0, y + 5, 32, 1, shadeOf(STONE)).rect(0, y + 6, 32, 1, darkOf(STONE));
  const front = y + 7;
  const bottom = s.height - 4;
  slab(s, 1, front, 30, bottom - front, STONE);
  // A brass rail along the top of the front, and two knobs.
  s.rect(2, front + 1, 28, 1, LAMP).set(2, front + 1, GLINT);
  for (const x of [5, 25]) s.rect(x, front + 4, 3, 3, LAMP).set(x, front + 4, GLINT);
  // The oven door, and the fire through its round window.
  slab(s, 9, front + 3, 14, bottom - front - 5, STONE);
  s.ellipse(16, front + 9, 4, 3.5, darkOf(STONE));
  s.ellipse(16, front + 10, 3, 2.5, FIRE).rect(15, front + 9, 2, 2, FIRE_LIGHT);
  s.rect(11, bottom - 5, 10, 1, LAMP);
  // Stout feet.
  for (const x of [2, 26]) s.rect(x, bottom, 4, 4, darkOf(STONE));
  // The cauldron, sat on the hob: a round iron pot, its rim, and pumpkin soup with a bubble.
  for (const x of [8, 22]) s.rect(x, y, 3, 3, darkOf(ROOF));
  ball(s, 16, y - 5, 12, 8, ROOF);
  s.ellipse(16, y - 12, 12, 2.5, shadeOf(ROOF)).rect(4, y - 13, 24, 1, lightOf(ROOF));
  s.ellipse(16, y - 12, 10, 1.5, fillOf(ACCENT)).rect(9, y - 13, 5, 1, lightOf(ACCENT));
  s.ellipse(20, y - 15, 1.5, 1.5, fillOf(ACCENT)).set(19, y - 16, lightOf(ACCENT));
  s.set(12, y - 16, fillOf(ACCENT));
  // A curl of steam.
  s.set(15, y - 18, WHITE)
    .set(16, y - 19, WHITE)
    .set(15, y - 20, WHITE)
    .set(16, y - 21, WHITE);
  return finish(s);
})();

/** A round-shouldered icebox in sage, a bat magnet holding up the shopping list. */
const BAT_FRIDGE = (() => {
  const s = new Sketch(32, 64);
  const top = 2;
  const bottom = 59;
  // The body, its shoulders rounded.
  s.rect(3, top + 4, 26, bottom - top - 4, fillOf(WALL));
  s.ellipse(16, top + 6, 13, 6, fillOf(WALL));
  bevelIn(s, 0, 0, 32, 64, WALL);
  s.rect(4, top + 2, 1, bottom - top - 3, lightOf(WALL)).rect(5, top + 1, 6, 1, lightOf(WALL));
  // The freezer door over the big one, and a chrome handle on each.
  s.rect(4, top + 18, 24, 1, darkOf(WALL)).rect(4, top + 19, 24, 1, lightOf(WALL));
  for (const [y, h] of [
    [top + 8, 7],
    [top + 23, 12],
  ] as const) {
    s.rect(24, y, 2, h, fillOf(STONE)).rect(24, y, 1, h, lightOf(STONE));
    s.set(25, y + h - 1, shadeOf(STONE));
  }
  // A little badge of a name, in brass.
  s.rect(12, top + 13, 8, 2, LAMP).set(12, top + 13, GLINT);
  // The list under the magnet, and the magnet: a bat.
  s.rect(8, top + 28, 11, 14, WHITE);
  for (const y of [top + 32, top + 35, top + 38]) s.rect(10, y, 6 + (y % 3), 1, shadeOf(STONE));
  s.rect(10, top + 32, 2, 1, fillOf(ACCENT));
  bat(s, 6, top + 25);
  // The plinth and two little feet.
  s.rect(3, bottom, 26, 2, darkOf(WALL));
  for (const x of [5, 23]) s.rect(x, bottom + 2, 4, 3, darkOf(STONE));
  return finish(s);
})();

/** A shelf of teapots and kettles on brackets, mugs hung on hooks underneath. */
const KETTLE_SHELF = (() => {
  const s = new Sketch(32, 32);
  // The shelf and its curly brackets.
  slab(s, 1, 15, 30, 3, TRIM);
  for (const x of [4, 25]) {
    s.rect(x, 18, 3, 2, fillOf(TRIM))
      .rect(x + 1, 20, 2, 2, fillOf(TRIM))
      .set(x + 1, 22, fillOf(TRIM));
  }
  // A pumpkin teapot, a copper kettle and a little sage jar.
  ball(s, 8, 10, 5, 5, ACCENT);
  s.rect(7, 4, 3, 2, fillOf(LEAVES));
  s.rect(2, 9, 2, 2, fillOf(ACCENT)).set(1, 8, fillOf(ACCENT));
  s.rect(12, 8, 2, 3, darkOf(ACCENT));
  ball(s, 20, 11, 4.5, 4, ACCENT_TWO);
  s.rect(18, 6, 4, 1, darkOf(ACCENT_TWO))
    .set(19, 5, darkOf(ACCENT_TWO))
    .set(20, 5, darkOf(ACCENT_TWO));
  s.rect(24, 9, 2, 1, fillOf(ACCENT_TWO)).set(26, 8, fillOf(ACCENT_TWO));
  slab(s, 26, 9, 4, 6, DOOR);
  s.rect(26, 8, 4, 1, fillOf(TRIM));
  // Two mugs on hooks under the shelf, one pumpkin, one cream.
  for (const [x, m] of [
    [10, ACCENT],
    [18, WALL],
  ] as const) {
    s.set(x + 3, 18, LAMP).set(x + 3, 19, LAMP);
    slab(s, x, 20, 7, 7, m);
    s.rect(x + 7, 21, 2, 1, fillOf(m))
      .rect(x + 8, 22, 1, 3, fillOf(m))
      .rect(x + 7, 25, 2, 1, fillOf(m));
  }
  return finish(s);
})();

/** A round copper kettle, its handle arched over, and a whistle on the spout. */
const COPPER_KETTLE = (() => {
  const s = new Sketch(32, 26);
  // The spout, out to the right.
  s.line(22, 16, 27, 10, fillOf(ACCENT_TWO)).line(22, 17, 28, 11, fillOf(ACCENT_TWO));
  s.line(23, 18, 28, 12, shadeOf(ACCENT_TWO));
  s.rect(27, 9, 3, 2, LAMP);
  ball(s, 15, 17, 10, 7, ACCENT_TWO);
  s.rect(5, 23, 20, 2, darkOf(ACCENT_TWO));
  // The lid and its knob, and the handle arching over.
  s.ellipse(15, 10.5, 5, 1.5, shadeOf(ACCENT_TWO));
  s.rect(14, 8, 3, 2, fillOf(TRIM));
  for (let x = 6; x <= 24; x++) {
    const t = (x - 15) / 9;
    s.set(x, Math.round(10 - 6 * (1 - t * t)), fillOf(TRIM));
  }
  s.set(6, 11, fillOf(TRIM)).set(24, 11, fillOf(TRIM));
  // Steam.
  s.set(29, 7, WHITE).set(30, 6, WHITE).set(29, 5, WHITE).set(30, 4, WHITE);
  return finish(s);
})();

/** A cookie jar that's a little ghost, its lid its head, blushing. */
const GHOST_COOKIE_JAR = (() => {
  const s = new Sketch(32, 30);
  // The body, a wavy hem at the bottom, and two stubby arms.
  s.rect(8, 14, 16, 12, fillOf(WALL));
  for (let x = 8; x < 24; x++) if (Math.floor((x - 8) / 2) % 2 === 0) s.set(x, 26, fillOf(WALL));
  s.ellipse(6.5, 18, 2, 2.5, fillOf(WALL)).ellipse(25.5, 18, 2, 2.5, fillOf(WALL));
  bevelIn(s, 0, 13, 32, 17, WALL);
  // The lid: its round head, with a seam, a little face and a blush.
  s.ellipse(16, 10, 9, 8, fillOf(WALL));
  ball(s, 16, 10, 9, 8, WALL);
  s.rect(7, 14, 18, 1, shadeOf(WALL));
  s.rect(12, 8, 2, 3, INK).rect(18, 8, 2, 3, INK);
  s.set(12, 8, WHITE).set(18, 8, WHITE);
  s.rect(10, 11, 2, 1, fillOf(ACCENT)).rect(20, 11, 2, 1, fillOf(ACCENT));
  s.rect(15, 12, 2, 1, INK);
  // A cookie peeking out from under the lid.
  s.rect(21, 13, 4, 2, fillOf(ACCENT_TWO)).set(22, 13, darkOf(ACCENT_TWO));
  return finish(s);
})();

// ---- The bedroom --------------------------------------------------------------------------------

/** A big soft bed under a rose canopy, its curtains tied back with bows. */
const CANOPY_BED = (() => {
  const s = new Sketch(64, 100);
  // The curtains behind the headboard, gathered and tied back either side.
  for (const [x, dir] of [
    [3, 1],
    [61, -1],
  ] as const) {
    for (let j = 10; j < 64; j++) {
      const tied = j > 36 && j < 42 ? 3 : j < 36 ? 9 - (j - 10) / 4.5 : 3 + (j - 42) / 5;
      const w = Math.max(2, Math.round(tied));
      s.rect(dir > 0 ? x : x - w + 1, j, w, 1, fillOf(ACCENT));
    }
    s.rect(dir > 0 ? x + 5 : x - 5, 14, 1, 18, shadeOf(ACCENT));
    s.rect(dir > 0 ? x + 3 : x - 3, 44, 1, 18, shadeOf(ACCENT));
  }
  // The posts, slim and turned, with a knob on each.
  for (const x of [1, 59]) {
    slab(s, x, 6, 4, 92, TRIM);
    ball(s, x + 2, 66, 3, 3, TRIM);
  }
  // The canopy across the top, a scalloped valance and a bow in the middle.
  slab(s, 0, 2, 64, 6, TRIM);
  s.rect(1, 8, 62, 6, fillOf(ACCENT)).rect(1, 8, 62, 1, lightOf(ACCENT));
  for (let x = 1; x < 63; x += 6) {
    s.rect(x + 1, 14, 4, 1, fillOf(ACCENT)).rect(x + 2, 15, 2, 1, fillOf(ACCENT));
    s.set(x, 9, shadeOf(ACCENT)).set(x, 10, shadeOf(ACCENT));
  }
  s.rect(28, 7, 8, 5, fillOf(ACCENT_TWO)).rect(31, 8, 2, 3, darkOf(ACCENT_TWO));
  s.rect(27, 12, 2, 4, fillOf(ACCENT_TWO)).rect(35, 12, 2, 4, fillOf(ACCENT_TWO));
  // The bows tying the curtains back.
  for (const x of [5, 57]) {
    s.rect(x - 1, 38, 4, 3, fillOf(ACCENT_TWO)).set(x, 39, darkOf(ACCENT_TWO));
    s.set(x - 1, 41, fillOf(ACCENT_TWO)).set(x + 2, 41, fillOf(ACCENT_TWO));
  }
  // The headboard, arched and padded, buttoned in rose.
  for (let x = 7; x < 57; x++) {
    const out = Math.abs(x + 0.5 - 32) / 25;
    const top = Math.round(26 - 8 * Math.cos(out * Math.PI * 0.5));
    s.rect(x, top, 1, 52 - top, fillOf(TRIM));
  }
  bevelIn(s, 7, 16, 50, 36, TRIM);
  for (let x = 10; x < 55; x++) {
    const out = Math.abs(x + 0.5 - 32) / 22;
    const top = Math.round(29 - 8 * Math.cos(out * Math.PI * 0.5));
    s.rect(x, top, 1, 50 - top, fillOf(DOOR));
  }
  bevelIn(s, 10, 19, 45, 31, DOOR);
  for (const [x, y] of [
    [20, 30],
    [32, 26],
    [44, 30],
    [26, 38],
    [38, 38],
  ] as const) {
    s.set(x, y, darkOf(DOOR)).set(x + 1, y + 1, lightOf(DOOR));
  }
  // Two plump pillows, the sheet turned down, and the quilt of little hearts.
  slab(s, 9, 46, 22, 10, WALL);
  slab(s, 33, 46, 22, 10, WALL);
  s.rect(10, 54, 44, 1, shadeOf(WALL));
  slab(s, 7, 56, 50, 30, ROOF);
  s.rect(7, 56, 50, 5, fillOf(WALL)).rect(7, 56, 50, 1, lightOf(WALL));
  s.rect(7, 60, 50, 1, shadeOf(WALL));
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const x = 10 + col * 10 + (row % 2) * 5;
      if (x > 49) continue;
      heart(s, x, 63 + row * 7, 7, 6, row % 2 ? lightOf(ACCENT) : fillOf(ACCENT));
    }
  }
  // The quilt hangs over the foot, and the footboard in front.
  s.rect(7, 84, 50, 2, shadeOf(ROOF));
  slab(s, 5, 84, 54, 12, TRIM);
  s.rect(9, 87, 46, 6, darkOf(TRIM)).rect(10, 88, 44, 4, shadeOf(TRIM));
  heart(s, 29, 88, 6, 4, fillOf(ACCENT));
  for (const x of [1, 59]) s.rect(x, 96, 4, 3, darkOf(TRIM));
  return finish(s);
})();

/** A tall wardrobe of two doors, painted with a moon and stars across both. */
const WARDROBE = (() => {
  const s = new Sketch(64, 74);
  // The crown along the top, a crescent at its peak.
  slab(s, 0, 10, 64, 4, TRIM);
  for (let x = 6; x < 58; x++) {
    const out = Math.abs(x + 0.5 - 32) / 26;
    const top = Math.round(4 + out * out * 6);
    s.rect(x, top, 1, 10 - top, fillOf(TRIM));
  }
  bevelIn(s, 0, 0, 64, 14, TRIM);
  crescent(s, 32, 3, 3, LAMP);
  // The body and its two doors, painted night blue.
  slab(s, 2, 14, 60, 54, TRIM);
  for (const x of [5, 33]) {
    slab(s, x, 17, 26, 38, ROOF);
    s.rect(x + 2, 19, 22, 34, fillOf(ROOF)).rect(x + 2, 19, 22, 1, shadeOf(ROOF));
  }
  // The moon and stars across both doors, as one picture.
  ball(s, 22, 30, 7, 7, ACCENT_TWO);
  s.rect(31, 17, 2, 38, darkOf(TRIM));
  for (const [x, y] of [
    [42, 24],
    [52, 36],
    [10, 45],
    [38, 46],
    [27, 49],
  ] as const) {
    star(s, x, y, lightOf(ROOF), WHITE);
  }
  for (const [x, y] of [
    [12, 22],
    [47, 30],
    [17, 50],
    [56, 47],
    [36, 21],
  ] as const) {
    s.set(x, y, WHITE);
  }
  // The knobs, and a drawer under the doors.
  s.rect(28, 35, 2, 3, LAMP).rect(34, 35, 2, 3, LAMP);
  slab(s, 5, 57, 54, 9, TRIM);
  s.rect(28, 60, 8, 2, LAMP).set(28, 60, GLINT);
  // Bun feet.
  for (const x of [4, 54]) ball(s, x + 3, 70, 3.5, 3, TRIM);
  return finish(s);
})();

/** A skirted vanity, its oval mirror ringed with little bulbs. */
const VANITY = (() => {
  const s = new Sketch(64, 58);
  // The mirror on a stand behind the top, framed and ringed with bulbs.
  s.rect(30, 26, 4, 6, fillOf(TRIM));
  s.ellipse(32, 15, 15, 13, fillOf(TRIM));
  bevelIn(s, 0, 0, 64, 30, TRIM);
  s.ellipse(32, 15, 12, 10, GLASS);
  s.ellipse(32, 18, 10, 6, GLASS_DARK).ellipse(32, 15, 12, 8.5, GLASS);
  s.line(25, 10, 28, 7, GLINT).line(26, 12, 30, 8, GLINT);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const x = Math.round(32 + Math.cos(a) * 14 - 0.5);
    const y = Math.round(15 + Math.sin(a) * 12 - 0.5);
    s.rect(x, y, 2, 2, LAMP);
  }
  // The top, a cream band seen from above.
  s.rect(1, 30, 62, 4, fillOf(WALL)).rect(1, 30, 62, 1, lightOf(WALL));
  s.rect(0, 34, 64, 1, shadeOf(WALL));
  // The skirt, gathered in pleats, with a scalloped hem and a bow.
  s.rect(1, 35, 62, 18, fillOf(ACCENT));
  for (let x = 4; x < 62; x += 5) s.rect(x, 36, 1, 16, shadeOf(ACCENT));
  for (let x = 2; x < 62; x += 5) s.rect(x, 36, 1, 15, lightOf(ACCENT));
  for (let x = 1; x < 63; x += 4) s.rect(x + 1, 53, 2, 1, fillOf(ACCENT));
  s.rect(1, 35, 62, 1, darkOf(ACCENT));
  for (const dir of [-1, 1]) {
    const x = dir < 0 ? 26 : 34;
    s.rect(x, 36, 4, 4, fillOf(ACCENT_TWO)).set(dir < 0 ? x : x + 3, 36, '.');
    s.set(dir < 0 ? x + 1 : x + 2, 37, darkOf(ACCENT_TWO));
    s.rect(dir < 0 ? 29 : 33, 40, 2, 4, fillOf(ACCENT_TWO)).set(
      dir < 0 ? 28 : 35,
      43,
      fillOf(ACCENT_TWO),
    );
  }
  s.rect(30, 36, 4, 4, shadeOf(ACCENT_TWO)).rect(31, 37, 2, 2, fillOf(ACCENT_TWO));
  // Gold feet peeking out under the hem.
  for (const x of [4, 57]) s.rect(x, 54, 3, 3, LAMP);
  return finish(s);
})();

/** A little bedside cupboard on curly legs, a moon on its drawer. */
const NIGHTSTAND = (() => {
  const s = new Sketch(32, 40);
  // The top, seen from above, and its front edge.
  s.rect(1, 12, 30, 4, fillOf(TRIM)).rect(1, 12, 30, 1, lightOf(TRIM));
  s.rect(0, 16, 32, 1, shadeOf(TRIM)).rect(0, 17, 32, 1, darkOf(TRIM));
  // The cupboard: a drawer with a moon on it, and an open shelf with a book.
  slab(s, 3, 18, 26, 13, ROOF);
  slab(s, 5, 19, 22, 5, ROOF);
  crescent(s, 16, 21.5, 2, LAMP);
  s.rect(5, 25, 22, 5, darkOf(ROOF));
  s.rect(8, 27, 12, 3, fillOf(ACCENT)).rect(8, 27, 12, 1, WHITE);
  // Curly legs.
  for (const [x, dir] of [
    [4, -1],
    [26, 1],
  ] as const) {
    s.rect(x, 31, 2, 5, fillOf(TRIM))
      .set(x + dir, 36, fillOf(TRIM))
      .set(x + dir * 2, 37, fillOf(TRIM));
    s.set(x + dir * 2, 36, fillOf(TRIM));
  }
  return finish(s);
})();

/** A little lamp with a rose shade trimmed in gold tassels. */
const TASSEL_LAMP = (() => {
  const s = new Sketch(32, 38);
  // The base: a round lavender pot on a little foot.
  ball(s, 16, 30, 6, 5, ACCENT_TWO);
  s.rect(12, 35, 8, 2, darkOf(ACCENT_TWO));
  s.rect(15, 18, 2, 8, LAMP);
  // The shade, a bell flaring at the bottom, and its tassels.
  column(s, 16, 4, 14, (j) => 10 + j * 1.1, fillOf(ACCENT));
  bevelIn(s, 0, 4, 32, 14, ACCENT);
  s.rect(8, 17, 16, 1, darkOf(ACCENT));
  for (let x = 8; x < 25; x += 3) s.set(x, 18, LAMP).set(x, 19, LAMP);
  s.rect(15, 2, 2, 2, LAMP);
  return finish(s);
})();

/** A heart-shaped rug, fluffy all round. */
const HEART_RUG = (() => {
  const s = new Sketch(64, 32);
  heart(s, 8, 1, 48, 30, fillOf(ACCENT));
  // Fluff along its edge, a lighter heart inside, and a few tufts.
  heart(s, 14, 5, 36, 21, lightOf(ACCENT));
  heart(s, 22, 9, 20, 12, fillOf(ACCENT));
  s.bevel(ACCENT.slice(3, 5), null, shadeOf(ACCENT));
  for (const [x, y] of [
    [16, 6],
    [44, 6],
    [30, 22],
    [24, 14],
    [40, 14],
  ] as const) {
    s.set(x, y, WHITE);
  }
  return finish(s);
})();

/** An embroidery hoop stitched with DREAM, a sleepy moon and a few stars. */
const DREAM_SAMPLER = (() => {
  const s = new Sketch(32, 32);
  // A ribbon bow at the top, then the wooden hoop round the cream cloth.
  s.rect(13, 1, 6, 3, fillOf(ACCENT)).rect(15, 2, 2, 1, darkOf(ACCENT));
  s.ellipse(16, 17, 14, 13.5, fillOf(TRIM));
  bevelIn(s, 0, 0, 32, 32, TRIM);
  s.ellipse(16, 17, 12, 11.5, fillOf(WALL));
  s.rect(14, 3, 4, 2, LAMP);
  // A sleepy moon, closed eye and all, and stars round it.
  crescent(s, 13, 11, 4, LAMP);
  s.set(12, 11, darkOf(ACCENT_TWO));
  star(s, 21, 9, fillOf(ACCENT_TWO));
  s.set(24, 13, fillOf(ACCENT_TWO)).set(8, 15, fillOf(ACCENT_TWO));
  letters(s, 'DREAM', 7, 17, fillOf(ROOF));
  // A little vine stitched under the word.
  for (let x = 9; x < 24; x += 3) s.set(x, 24, fillOf(LEAVES)).set(x + 1, 25, fillOf(LEAVES));
  return finish(s);
})();

// ---- The library --------------------------------------------------------------------------------

/** Books along a shelf from `x0` to `x1`, standing on `shelf`, some leaning, from a seed. */
function books(s: Sketch, x0: number, x1: number, shelf: number, tall: number, seed: number): void {
  const spines: Material[] = [ROOF, DOOR, LEAVES, ACCENT, ACCENT_TWO];
  let x = x0;
  let k = seed;
  while (x < x1) {
    const m = spines[(k * 3 + seed) % spines.length]!;
    if (k % 9 === 4 && x + tall - 2 <= x1) {
      // A few lying down, the next one leaning on them.
      const long = tall - 3;
      for (const [y, b] of [
        [shelf - 3, m],
        [shelf - 6, spines[(k + 2) % spines.length]!],
      ] as const) {
        s.rect(x, y, long, 3, fillOf(b))
          .rect(x, y, long, 1, lightOf(b))
          .set(x + 2, y + 1, LAMP);
      }
      x += long;
    } else {
      const w = Math.min([2, 3, 2, 2, 3][k % 5]!, x1 - x);
      const h = tall - [0, 2, 1, 3, 0, 1][k % 6]!;
      s.rect(x, shelf - h, w, h, fillOf(m)).rect(x + w - 1, shelf - h, 1, h, shadeOf(m));
      if (w > 2) s.rect(x, shelf - h + 2, w - 1, 1, LAMP);
      x += w;
    }
    k += 1;
  }
}

/** A tall bookcase with an arched top, full to the brim. */
const TALL_BOOKCASE = (() => {
  const s = new Sketch(32, 82);
  // The case, its arched top and a plinth.
  for (let x = 1; x < 31; x++) {
    const out = Math.abs(x + 0.5 - 16) / 15;
    const top = Math.round(8 - 6 * Math.sqrt(1 - out * out));
    s.rect(x, top, 1, 78 - top, fillOf(TRIM));
  }
  bevelIn(s, 0, 0, 32, 78, TRIM);
  s.rect(0, 76, 32, 5, fillOf(TRIM)).rect(0, 76, 32, 1, lightOf(TRIM));
  s.rect(0, 80, 32, 1, shadeOf(TRIM));
  // The inside, dark, in four shelves of books, and a little arch window of a carving at the top.
  s.rect(4, 10, 24, 64, darkOf(TRIM));
  s.ellipse(16, 6, 3, 3, darkOf(TRIM)).rect(15, 3, 2, 1, LAMP);
  for (const [i, shelf] of [25, 41, 57, 73].entries()) {
    books(s, 5, 27, shelf, 12 - (i % 2), i * 5 + 1);
    s.rect(3, shelf, 26, 2, fillOf(TRIM)).rect(3, shelf, 26, 1, lightOf(TRIM));
  }
  // A skull bookend, smiling, on the second shelf.
  s.rect(22, 34, 5, 7, '.').rect(21, 34, 6, 7, darkOf(TRIM));
  s.ellipse(24, 37, 3, 3, WHITE).rect(22, 38, 4, 3, WHITE);
  s.set(23, 37, INK).set(25, 37, INK).set(24, 40, shadeOf(STONE));
  return finish(s);
})();

/** A deep teal chair, buttoned and squashy, with rolled arms. */
const READING_CHAIR = (() => {
  const s = new Sketch(32, 44);
  // The tall back, rounded at the top, with its buttons.
  s.rect(5, 6, 22, 24, fillOf(DOOR));
  s.ellipse(16, 7, 11, 5, fillOf(DOOR));
  bevelIn(s, 0, 0, 32, 30, DOOR);
  for (const [x, y] of [
    [11, 9],
    [16, 8],
    [21, 9],
    [13, 15],
    [19, 15],
    [16, 21],
  ] as const) {
    s.set(x, y, darkOf(DOOR))
      .set(x - 1, y - 1, shadeOf(DOOR))
      .set(x + 1, y + 1, lightOf(DOOR));
  }
  // The seat cushion, then the rolled arms either side.
  slab(s, 6, 26, 20, 6, DOOR);
  s.rect(7, 27, 18, 1, lightOf(DOOR));
  for (const x of [0, 24]) {
    slab(s, x + 1, 22, 7, 16, DOOR);
    ball(s, x + 4, 22, 4, 3, DOOR);
  }
  // The front of the seat, a gold trim, and turned wooden legs.
  slab(s, 6, 32, 20, 6, DOOR);
  s.rect(1, 37, 30, 1, LAMP);
  for (const x of [3, 26]) s.rect(x, 38, 3, 5, fillOf(TRIM)).rect(x, 38, 1, 5, lightOf(TRIM));
  return finish(s);
})();

/** A globe in a brass ring, on a little wooden stand. */
const BRASS_GLOBE = (() => {
  const s = new Sketch(32, 36);
  // The stand: a round foot and a short stem.
  s.ellipse(16, 32, 8, 2.5, fillOf(TRIM)).rect(8, 33, 16, 1, darkOf(TRIM));
  s.rect(15, 24, 3, 8, fillOf(TRIM)).rect(15, 24, 1, 8, lightOf(TRIM));
  // The globe: teal seas and mossy lands.
  ball(s, 16, 13, 10, 10, DOOR);
  for (const [x, y, w, h] of [
    [9, 8, 6, 4],
    [11, 12, 3, 6],
    [18, 6, 5, 3],
    [19, 10, 4, 7],
    [22, 17, 2, 2],
  ] as const) {
    s.rect(x, y, w, h, fillOf(LEAVES));
  }
  s.set(9, 8, lightOf(LEAVES)).set(18, 6, lightOf(LEAVES));
  // The brass meridian round it, top to bottom.
  for (let j = 0; j <= 24; j++) {
    const a = (j / 24) * Math.PI;
    s.set(Math.round(16 + Math.sin(a) * 12) - 1, Math.round(13 - Math.cos(a) * 12), LAMP);
  }
  s.set(15, 1, GLINT).rect(15, 0, 2, 1, LAMP);
  return finish(s);
})();

/** A rolling ladder for the top shelves, its little wheels at the bottom. */
const LIBRARY_LADDER = (() => {
  const s = new Sketch(32, 76);
  // Two rails from the wheels up to a brass hook, leaning a little.
  for (const x of [6, 22]) {
    s.line(x, 70, x + 4, 3, fillOf(TRIM)).line(x + 1, 70, x + 5, 3, fillOf(TRIM));
    s.line(x + 2, 70, x + 6, 3, shadeOf(TRIM));
  }
  for (let y = 10; y < 68; y += 8) {
    const lean = Math.round(((70 - y) / 67) * 4);
    s.rect(8 + lean, y, 15, 2, fillOf(TRIM)).rect(8 + lean, y, 15, 1, lightOf(TRIM));
  }
  for (const x of [10, 26]) s.rect(x, 1, 3, 3, LAMP).set(x + 2, 4, LAMP);
  for (const x of [7, 23]) {
    s.ellipse(x + 1, 72.5, 3, 3, fillOf(STONE)).set(x + 1, 72, LAMP);
  }
  return finish(s);
})();

/** A wide desk with a green leather top and brass handles. */
const LIBRARY_DESK = (() => {
  const s = new Sketch(64, 44);
  // The top, seen from above: an oak border round green leather.
  s.rect(0, 8, 64, 7, fillOf(TRIM)).rect(0, 8, 64, 1, lightOf(TRIM));
  s.rect(3, 9, 58, 4, fillOf(LEAVES)).rect(3, 9, 58, 1, lightOf(LEAVES));
  s.rect(3, 12, 58, 1, shadeOf(LEAVES));
  s.rect(0, 15, 64, 1, shadeOf(TRIM)).rect(0, 16, 64, 1, darkOf(TRIM));
  // Two pedestals of drawers, a drawer between, and the dark kneehole.
  slab(s, 1, 17, 62, 6, TRIM);
  s.rect(28, 19, 8, 1, LAMP);
  s.rect(21, 23, 22, 18, darkOf(TRIM));
  for (const x of [1, 43]) {
    slab(s, x, 23, 20, 18, TRIM);
    for (const y of [24, 32]) {
      slab(s, x + 2, y, 16, 7, TRIM);
      s.rect(x + 7, y + 3, 6, 1, LAMP).set(x + 7, y + 3, GLINT);
    }
  }
  for (const x of [2, 58]) s.rect(x, 41, 4, 3, darkOf(TRIM));
  return finish(s);
})();

/** A brass desk lamp with a green glass shade. */
const BANKERS_LAMP = (() => {
  const s = new Sketch(32, 34);
  // The brass foot and stem.
  s.ellipse(16, 30, 9, 3, fillOf(STONE)).ellipse(16, 29.5, 7, 1.5, lightOf(STONE));
  s.rect(8, 31, 16, 1, shadeOf(STONE));
  s.rect(15, 15, 2, 14, fillOf(STONE)).set(15, 15, lightOf(STONE));
  // The shade: a long half-round of green glass.
  s.ellipse(16, 13, 12, 6, fillOf(LEAVES)).rect(4, 13, 24, 4, '.');
  s.rect(4, 12, 24, 3, fillOf(LEAVES));
  ball(s, 16, 12, 12, 5, LEAVES);
  s.rect(4, 13, 24, 2, fillOf(LEAVES)).rect(4, 15, 24, 1, darkOf(LEAVES));
  s.rect(6, 9, 6, 1, lightOf(LEAVES));
  // The pull chain.
  s.set(23, 16, LAMP).set(23, 17, LAMP).set(23, 18, LAMP).rect(22, 19, 2, 2, LAMP);
  return finish(s);
})();

/** An old map of the town in a gold frame, with an X where nobody remembers why. */
const TOWN_MAP = (() => {
  const s = new Sketch(64, 32);
  slab(s, 1, 2, 62, 28, STONE);
  s.rect(4, 5, 56, 22, fillOf(WALL));
  s.rect(4, 5, 56, 1, shadeOf(WALL)).rect(4, 5, 1, 22, shadeOf(WALL));
  // The pond, the woods, the square and the path between, and her little house.
  s.ellipse(47, 20, 7, 4, GLASS).set(44, 18, GLINT);
  for (const [x, y] of [
    [9, 8],
    [13, 10],
    [8, 13],
    [52, 8],
    [56, 11],
    [50, 12],
  ] as const) {
    s.rect(x, y, 3, 3, fillOf(LEAVES)).set(x, y, lightOf(LEAVES));
  }
  s.rect(28, 13, 7, 7, shadeOf(WALL)).rect(30, 15, 3, 3, GLASS);
  for (let x = 12; x < 28; x += 2) s.set(x, 20 - Math.round((x - 12) / 4), darkOf(ROOF));
  for (let x = 35; x < 42; x += 2) s.set(x, 17 + Math.round((x - 35) / 3), darkOf(ROOF));
  s.rect(9, 19, 4, 3, fillOf(ROOF)).set(10, 18, fillOf(ROOF)).set(11, 18, fillOf(ROOF));
  s.set(10, 17, fillOf(ROOF));
  // The X, and a compass rose.
  s.line(52, 15, 55, 18, fillOf(ACCENT)).line(55, 15, 52, 18, fillOf(ACCENT));
  star(s, 20, 9, darkOf(ROOF), fillOf(ACCENT));
  s.set(20, 7, darkOf(ROOF));
  return finish(s);
})();

// ---- The witch's corner -------------------------------------------------------------------------

/** One potion bottle of a shape, its cork and a label, standing on `shelf`. */
function bottle(s: Sketch, x: number, shelf: number, shape: number, m: Material): void {
  if (shape === 0) {
    // A round flask with a long neck.
    ball(s, x + 3, shelf - 4, 3.5, 3.5, m);
    s.rect(x + 2, shelf - 10, 2, 4, fillOf(m)).rect(x + 2, shelf - 11, 2, 1, lightOf(TRIM));
  } else if (shape === 1) {
    // A tall thin one.
    s.rect(x + 1, shelf - 10, 4, 10, fillOf(m)).rect(x + 1, shelf - 10, 1, 10, lightOf(m));
    s.rect(x + 2, shelf - 12, 2, 2, lightOf(TRIM));
    s.rect(x + 1, shelf - 6, 4, 2, WHITE);
  } else {
    // A squat square jar.
    s.rect(x, shelf - 6, 6, 6, fillOf(m)).rect(x, shelf - 6, 6, 1, lightOf(m));
    s.rect(x + 1, shelf - 8, 4, 2, lightOf(TRIM));
    s.rect(x + 1, shelf - 4, 4, 2, WHITE);
  }
}

/** A tall rack of potions, corked and labelled, under a pointed top. */
const POTION_RACK = (() => {
  const s = new Sketch(32, 66);
  // The rack, its top pointed like a hat, and its dark inside.
  for (let x = 1; x < 31; x++) {
    const out = Math.abs(x + 0.5 - 16) / 15;
    s.rect(x, Math.round(2 + out * 8), 1, 60, fillOf(TRIM));
  }
  bevelIn(s, 0, 0, 32, 62, TRIM);
  s.rect(4, 12, 24, 47, darkOf(TRIM));
  s.rect(15, 5, 2, 2, LAMP);
  // Four shelves of bottles, every one different.
  const colours: Material[] = [LEAVES, ACCENT, ACCENT_TWO, DOOR];
  for (const [i, shelf] of [23, 35, 47, 58].entries()) {
    for (let k = 0; k < 3; k++) {
      bottle(s, 5 + k * 8, shelf, (i + k) % 3, colours[(i * 2 + k) % colours.length]!);
    }
    s.rect(3, shelf, 26, 2, fillOf(TRIM)).rect(3, shelf, 26, 1, lightOf(TRIM));
  }
  for (const x of [2, 26]) s.rect(x, 61, 4, 4, darkOf(TRIM));
  return finish(s);
})();

/** A crystal ball on a velvet cushion, held up by a little brass bat. */
const SEEING_STONE = (() => {
  const s = new Sketch(32, 34);
  // The brass bat: wings out either side of a round foot.
  s.ellipse(16, 30, 7, 2.5, fillOf(STONE)).rect(10, 31, 12, 1, shadeOf(STONE));
  for (const dir of [-1, 1]) {
    const x = dir < 0 ? 3 : 22;
    s.rect(x, 22, 7, 3, fillOf(STONE)).rect(dir < 0 ? x : x + 3, 20, 4, 2, fillOf(STONE));
    s.set(dir < 0 ? x : x + 6, 25, fillOf(STONE)).set(dir < 0 ? x + 3 : x + 3, 25, fillOf(STONE));
  }
  s.rect(12, 23, 8, 6, fillOf(STONE)).rect(12, 23, 8, 1, lightOf(STONE));
  // The plum cushion, with gold tassels, and the ball on it.
  s.rect(8, 19, 16, 4, fillOf(ROOF)).rect(8, 19, 16, 1, lightOf(ROOF));
  s.set(7, 22, LAMP).set(24, 22, LAMP);
  ball(s, 16, 10, 9, 9, ACCENT);
  s.ellipse(17, 12, 4, 3, lightOf(ACCENT)).set(16, 11, WHITE).set(19, 13, WHITE);
  s.set(11, 5, GLINT).set(12, 4, GLINT).set(11, 6, GLINT);
  return finish(s);
})();

/** A twisty wooden stand with a witch hat on top and a stripy scarf on a peg. */
const HAT_STAND = (() => {
  const s = new Sketch(32, 68);
  // Three curly feet, and the twisted pole.
  s.line(15, 60, 7, 66, fillOf(TRIM)).line(16, 60, 24, 66, fillOf(TRIM));
  s.rect(14, 62, 4, 5, fillOf(TRIM));
  for (let y = 12; y < 63; y++) {
    s.rect(14, y, 4, 1, fillOf(TRIM));
    s.set(14 + (Math.floor(y / 2) % 4), y, (y >> 1) % 2 ? lightOf(TRIM) : shadeOf(TRIM));
  }
  // The pegs either side.
  s.rect(9, 20, 5, 2, fillOf(TRIM)).rect(18, 24, 5, 2, fillOf(TRIM));
  // The witch hat on top: a crooked cone over a wide brim, a band and a buckle.
  s.ellipse(16, 14, 12, 3, fillOf(ROOF));
  column(s, 15, 0, 14, (j) => 2 + j * 0.85, fillOf(ROOF));
  s.rect(17, 0, 3, 2, fillOf(ROOF)).set(20, 1, fillOf(ROOF));
  bevelIn(s, 0, 0, 32, 18, ROOF);
  s.rect(10, 10, 11, 2, fillOf(ACCENT_TWO));
  s.rect(14, 10, 3, 2, LAMP);
  // The stripy scarf over the left peg, hanging in two tails.
  for (let y = 21; y < 46; y++) {
    const m = Math.floor((y - 21) / 3) % 2 ? WALL : ACCENT;
    s.rect(7, y, 4, 1, fillOf(m)).set(7, y, lightOf(m));
    if (y < 40) s.rect(11, y + 2, 3, 1, fillOf(m));
  }
  for (const x of [7, 9]) s.set(x, 46, fillOf(ACCENT)).set(x, 47, fillOf(ACCENT));
  return finish(s);
})();

/** A peg on the wall with a spare broom hung up, and a little star charm. */
const BROOM_HOOK = (() => {
  const s = new Sketch(32, 32);
  // The peg rail and its two pegs.
  slab(s, 2, 3, 28, 3, TRIM);
  for (const x of [7, 23]) s.rect(x, 6, 2, 2, fillOf(TRIM)).set(x, 6, lightOf(TRIM));
  // The broom hung by its handle across both pegs, its bristles tied with a band.
  s.line(3, 8, 20, 19, fillOf(TRIM))
    .line(4, 8, 21, 19, lightOf(TRIM))
    .line(3, 9, 20, 20, shadeOf(TRIM));
  for (let k = 0; k < 12; k++) {
    s.line(19 + Math.floor(k / 4), 18 + (k % 4), 18 + k, 30, fillOf(ACCENT_TWO));
  }
  for (const k of [1, 5, 9]) s.line(19 + Math.floor(k / 4), 19, 19 + k, 30, shadeOf(ACCENT_TWO));
  s.line(21, 18, 29, 27, lightOf(ACCENT_TWO));
  s.rect(18, 18, 4, 3, fillOf(ACCENT)).set(18, 18, lightOf(ACCENT));
  // A star charm tied to the handle with a ribbon.
  s.rect(10, 13, 1, 4, fillOf(ACCENT));
  star(s, 10, 18, LAMP, GLINT);
  return finish(s);
})();

/** A carved stand with a big spellbook open on it, glowing a little. */
const SPELL_LECTERN = (() => {
  const s = new Sketch(32, 54);
  // The feet, the carved column and the slanted top.
  s.rect(6, 49, 20, 4, fillOf(TRIM)).rect(6, 49, 20, 1, lightOf(TRIM));
  s.rect(4, 51, 4, 3, darkOf(TRIM)).rect(24, 51, 4, 3, darkOf(TRIM));
  slab(s, 12, 24, 8, 25, TRIM);
  crescent(s, 16, 34, 2.5, LAMP);
  s.rect(10, 22, 12, 3, fillOf(TRIM));
  slab(s, 2, 18, 28, 5, TRIM);
  // The open book: its plum cover, two pages, and lines of spells.
  s.rect(2, 10, 28, 9, fillOf(ROOF)).rect(2, 18, 28, 1, darkOf(ROOF));
  s.rect(3, 8, 12, 9, fillOf(WALL)).rect(17, 8, 12, 9, fillOf(WALL));
  s.rect(3, 8, 12, 1, lightOf(WALL)).rect(17, 8, 12, 1, lightOf(WALL));
  s.rect(15, 8, 2, 10, shadeOf(WALL));
  for (const y of [10, 12, 14]) {
    s.rect(5, y, 8 - (y % 4), 1, fillOf(ACCENT_TWO));
    s.rect(19, y, 7 + (y % 3) - 1, 1, fillOf(ACCENT_TWO));
  }
  s.set(22, 13, lightOf(ACCENT_TWO));
  // A ribbon hanging, and sparkles over the page.
  s.rect(20, 17, 2, 6, fillOf(ACCENT)).set(20, 23, fillOf(ACCENT));
  star(s, 9, 4, lightOf(ACCENT_TWO), WHITE);
  s.set(23, 3, WHITE).set(26, 5, lightOf(ACCENT_TWO));
  return finish(s);
})();

/** Bundles of lavender, sage and rosemary hung from a rod to dry. */
const HERB_BUNDLES = (() => {
  const s = new Sketch(32, 32);
  // The rod on two pegs.
  s.rect(1, 4, 30, 2, fillOf(TRIM)).rect(1, 4, 30, 1, lightOf(TRIM));
  s.rect(3, 2, 2, 5, darkOf(TRIM)).rect(27, 2, 2, 5, darkOf(TRIM));
  // Each bundle hangs upside down: stems tied at the top, the heads loose and ragged below, with
  // a leaf or two poking out.
  const bundles: [number, Material, number][] = [
    [7, ACCENT, 26],
    [13, LEAVES, 22],
    [19, ACCENT_TWO, 27],
    [25, LEAVES, 23],
  ];
  bundles.forEach(([x, m, long], b) => {
    s.rect(x - 1, 6, 2, 6, darkOf(LEAVES)).rect(x - 2, 8, 4, 2, fillOf(TRIM));
    for (let i = -3; i <= 3; i++) {
      const end = long - Math.abs(i) * 2 - ((i + b + 7) % 3);
      s.rect(x + i, 12 + Math.abs(i), 1, end - 12 - Math.abs(i), fillOf(m));
      if ((i + b) % 2 === 0) s.set(x + i, end - 1, lightOf(m));
    }
    s.rect(x - 3, 13, 1, 6, lightOf(m)).rect(x + 3, 14, 1, 6, shadeOf(m));
    s.set(x - 4, 16 + b, fillOf(LEAVES)).set(x + 4, 19 - b, fillOf(LEAVES));
  });
  return finish(s);
})();

/** A plum rug woven with the moon in all its shapes, fringed at either end. */
const MOON_PHASE_RUG = (() => {
  const s = new Sketch(64, 32);
  slab(s, 4, 2, 56, 28, ROOF);
  s.rect(6, 4, 52, 24, shadeOf(ROOF)).rect(7, 5, 50, 22, fillOf(ROOF));
  // A gold border stitched round, and the fringe.
  for (let x = 7; x < 57; x += 2) s.set(x, 5, LAMP).set(x + 1, 26, LAMP);
  for (let y = 4; y < 28; y += 2) {
    s.rect(1, y, 3, 1, fillOf(WALL)).rect(60, y, 3, 1, fillOf(WALL));
  }
  // The moon's phases along the middle, new to full and back.
  const phases = [0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25];
  phases.forEach((lit, i) => {
    const cx = 11 + i * 7;
    s.ellipse(cx, 16, 3, 3, darkOf(ROOF));
    const keep = new Sketch(64, 32);
    keep.ellipse(cx, 16, 3, 3, 'x');
    const side = i < 3 ? 1 : -1;
    if (lit < 1) keep.ellipse(cx - side * (lit * 6), 16, 3, 3, '.');
    keep.rows.forEach((row, j) =>
      [...row].forEach((k, x) => k === 'x' && s.set(x, j, lit === 1 ? WHITE : LAMP)),
    );
  });
  for (const [x, y] of [
    [12, 9],
    [26, 23],
    [39, 9],
    [52, 22],
    [20, 22],
    [46, 10],
  ] as const) {
    s.set(x, y, lightOf(ROOF));
  }
  return finish(s);
})();

// ---- Every piece --------------------------------------------------------------------------------

const lit = (x: number, y: number, radius: number) => [{ x, y, radius }];

/** The kitchen's woods: oak tops, sage cupboards, a cream icebox, copper and pumpkin. */
const KITCHEN = { ...WOOD, trim: C.wood, door: C.sage, wall: C.cream, accent: C.rose } as const;

/** The bedroom's: pale wood, rose fabric, a lavender quilt, gold. */
const BEDROOM = {
  ...WOOD,
  trim: C.creamShade,
  wall: C.white,
  roof: C.lavender,
  accent: C.rose,
  accentTwo: C.gold,
} as const;

/** The library's: dark oak, teal, moss and brass. */
const LIBRARY = {
  ...WOOD,
  trim: C.bark,
  door: C.teal,
  roof: C.berry,
  leaves: C.mossLight,
  accent: C.navy,
  accentTwo: C.gold,
  stone: C.goldShade,
} as const;

/** The witch's corner's: dark wood, plum, moss and glowing green. */
const WITCH = {
  ...WOOD,
  trim: C.barkDark,
  roof: C.plum,
  leaves: C.orbGreen,
  accent: C.lavender,
  accentTwo: C.pumpkin,
  door: C.rose,
  wall: C.cream,
  stone: C.goldShade,
} as const;

export const SET_ART: Record<SuitePiece, FurnitureArt> = {
  cosyCounter: { source: COSY_COUNTER, palette: palette(KITCHEN) },
  cosySink: {
    source: COSY_SINK,
    palette: palette({ ...KITCHEN, wall: C.white, accent: C.rose, glass: C.sky }),
  },
  cauldronStove: {
    source: CAULDRON_STOVE,
    palette: palette({ ...KITCHEN, stone: C.furBlackLight, roof: C.iron, accent: C.pumpkin }),
    glow: FIRE_LIT,
    lights: lit(16, 31, 30),
  },
  batFridge: {
    source: BAT_FRIDGE,
    palette: palette({ ...KITCHEN, wall: C.sage, stone: C.silver, accent: C.rose }),
  },
  kettleShelf: {
    source: KETTLE_SHELF,
    palette: palette({ ...KITCHEN, accent: C.pumpkin, accentTwo: C.copper, leaves: C.leaf }),
  },
  copperKettle: { source: COPPER_KETTLE, palette: palette({ ...KITCHEN, accentTwo: C.copper }) },
  ghostCookieJar: {
    source: GHOST_COOKIE_JAR,
    palette: palette({ ...KITCHEN, wall: C.ghost, accent: C.rose, accentTwo: C.wood }),
  },
  canopyBed: { source: CANOPY_BED, palette: palette({ ...BEDROOM, door: C.snap }) },
  wardrobe: {
    source: WARDROBE,
    palette: palette({ ...BEDROOM, trim: C.lavenderShade, roof: C.navy, accentTwo: C.candle }),
  },
  vanity: {
    source: VANITY,
    palette: palette({ ...BEDROOM, wall: C.cream, glass: C.sky }),
    glow: { [LAMP]: C.candleBright },
    lights: lit(32, 15, 44),
  },
  nightstand: {
    source: NIGHTSTAND,
    palette: palette({ ...BEDROOM, trim: C.lavenderShade, roof: C.lavender, accent: C.rose }),
  },
  tasselLamp: {
    source: TASSEL_LAMP,
    palette: palette({ ...BEDROOM, accentTwo: C.lavender }),
    glow: litUp(ACCENT),
    lights: lit(16, 12, 48),
  },
  heartRug: { source: HEART_RUG, palette: palette({ ...BEDROOM, accent: C.snap }) },
  dreamSampler: {
    source: DREAM_SAMPLER,
    palette: palette({ ...BEDROOM, trim: C.wood, wall: C.cream, roof: C.plum, leaves: C.leaf }),
  },
  tallBookcase: {
    source: TALL_BOOKCASE,
    palette: palette({
      ...LIBRARY,
      roof: C.rose,
      door: C.tealLight,
      leaves: C.leaf,
      accent: C.blueFabric,
    }),
  },
  readingChair: { source: READING_CHAIR, palette: palette(LIBRARY) },
  brassGlobe: { source: BRASS_GLOBE, palette: palette({ ...LIBRARY, door: C.tealLight }) },
  libraryLadder: { source: LIBRARY_LADDER, palette: palette(LIBRARY) },
  libraryDesk: { source: LIBRARY_DESK, palette: palette({ ...LIBRARY, leaves: C.moss }) },
  bankersLamp: {
    source: BANKERS_LAMP,
    palette: palette({ ...LIBRARY, leaves: C.leaf, stone: C.gold }),
    glow: { [fillOf(LEAVES)]: C.orbGreen, [lightOf(LEAVES)]: C.orbGreenLight },
    lights: lit(16, 16, 40),
  },
  townMap: {
    source: TOWN_MAP,
    palette: palette({ ...LIBRARY, wall: C.cream, roof: C.bark, accent: C.scarlet, glass: C.sky }),
  },
  potionRack: {
    source: POTION_RACK,
    palette: palette(WITCH),
    glow: { [fillOf(LEAVES)]: C.orbGreenLight, [lightOf(LEAVES)]: C.white },
    lights: lit(16, 30, 36),
  },
  seeingStone: {
    source: SEEING_STONE,
    palette: palette(WITCH),
    glow: { [fillOf(ACCENT)]: C.lavender, [lightOf(ACCENT)]: C.ghost, [GLINT]: C.candleBright },
    lights: lit(16, 10, 34),
  },
  hatStand: { source: HAT_STAND, palette: palette(WITCH) },
  broomHook: {
    source: BROOM_HOOK,
    palette: palette({ ...WITCH, trim: C.wood, accentTwo: C.rope, accent: C.plumLight }),
  },
  spellLectern: {
    source: SPELL_LECTERN,
    palette: palette(WITCH),
    glow: { [fillOf(WALL)]: C.candleBright, [fillOf(ACCENT_TWO)]: C.pumpkinLight },
    lights: lit(16, 12, 36),
  },
  herbBundles: {
    source: HERB_BUNDLES,
    palette: palette({ ...WITCH, leaves: C.mossLight, accentTwo: C.lavender, accent: C.plumLight }),
  },
  moonPhaseRug: { source: MOON_PHASE_RUG, palette: palette(WITCH) },
};
