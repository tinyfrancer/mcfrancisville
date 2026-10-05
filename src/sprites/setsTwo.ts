import type { SecondSuitePiece } from '../types/ids';
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
  candle,
  column,
  FIRE_LIGHT,
  FIRE_LIT,
  frame,
  palette,
  pot,
  slab,
  WOOD,
} from './furnish';
import { clumpsOf, paintCrown, type Crown } from './nature';
import { PALETTE as C } from './palette';
import { crescent, heart, star } from './sets';
import { CLEAR, Sketch } from './sketch';
import type { SpriteSource } from './sprite';

/*
 * The second four furniture sets (0.3's S4), at 32, drawn as S3's are (`sets.ts`): a bathroom in
 * white enamel, mint and brass; a garden room of wicker, terracotta and things growing; a music
 * corner in black, cherry red and chrome; and a haunted lounge of dark wood, crimson velvet and
 * old silver. The washstand, the potting bench and the claw-foot table are surfaces, their tops a
 * band seen from above over their front edge (`SURFACES` says how high).
 */

/** The leaf tones `paintCrown` paints, as the kit's `LEAVES`, so `finish` outlines them. */
function leafy(s: Sketch): void {
  const keys: Record<string, string> = {
    0: darkOf(LEAVES),
    1: shadeOf(LEAVES),
    2: fillOf(LEAVES),
    3: fillOf(LEAVES),
    4: lightOf(LEAVES),
    5: lightOf(LEAVES),
  };
  for (const [from, to] of Object.entries(keys)) s.replace(from, to);
}

/** A frond of fern from `(x, y)` arching out to `(tx, ty)`, its leaflets either side. */
function frond(s: Sketch, x: number, y: number, tx: number, ty: number, lift: number): void {
  const steps = Math.ceil(Math.hypot(tx - x, ty - y));
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const px = Math.round(x + (tx - x) * t);
    const py = Math.round(y + (ty - y) * t - lift * 4 * t * (1 - t));
    s.set(px, py, shadeOf(LEAVES));
    if (k % 2 === 0 && k > 1 && k < steps) {
      const long = t < 0.75 ? 2 : 1;
      for (let d = 1; d <= long; d++) {
        s.set(px, py - d, d === 1 ? fillOf(LEAVES) : lightOf(LEAVES));
        s.set(px, py + d, fillOf(LEAVES));
      }
    }
  }
}

// ---- The bathroom -------------------------------------------------------------------------------

/** A roll-top tub on brass paws, painted mint outside, heaped with bubbles. */
const CLAW_TUB = (() => {
  const s = new Sketch(64, 46);
  // The tap at its head: a brass gooseneck over the rim, and its two little handles.
  s.rect(55, 5, 2, 12, fillOf(ACCENT_TWO)).rect(55, 5, 1, 12, lightOf(ACCENT_TWO));
  s.rect(50, 3, 7, 2, fillOf(ACCENT_TWO)).rect(50, 3, 7, 1, lightOf(ACCENT_TWO));
  s.rect(50, 5, 2, 2, fillOf(ACCENT_TWO));
  for (const x of [52, 58]) s.rect(x, 10, 3, 1, fillOf(ACCENT_TWO)).set(x + 1, 9, LAMP);
  // The bubbles, heaped over the rim.
  const bubbles: [number, number, number][] = [
    [11, 14, 4],
    [19, 11, 6],
    [29, 8, 6],
    [39, 10, 5],
    [46, 13, 4],
    [24, 4, 3],
    [35, 3, 3],
    [14, 6, 2],
  ];
  for (const [x, y, r] of bubbles) {
    ball(s, x, y, r, r, STONE);
    s.set(x - Math.ceil(r / 2), y - Math.ceil(r / 2), WHITE);
  }
  // The body, its ends curving up into the roll top.
  for (let x = 2; x < 62; x++) {
    const out = Math.abs(x + 0.5 - 32) / 30;
    const bottom = Math.round(38 - 8 * out ** 3);
    s.rect(x, 17, 1, bottom - 17, fillOf(DOOR));
  }
  bevelIn(s, 0, 17, 64, 24, DOOR);
  s.rect(6, 21, 50, 1, LAMP);
  s.rect(6, 22, 18, 1, lightOf(DOOR));
  // The white roll top.
  s.rect(2, 15, 60, 3, fillOf(WALL)).rect(3, 15, 58, 1, lightOf(WALL));
  s.rect(2, 17, 60, 1, shadeOf(WALL));
  s.set(2, 15, CLEAR).set(61, 15, CLEAR);
  s.rect(1, 16, 1, 1, fillOf(WALL)).rect(62, 16, 1, 1, fillOf(WALL));
  // Brass paws at either end.
  for (const x of [6, 52]) {
    s.rect(x + 1, 35, 4, 5, fillOf(ACCENT_TWO));
    s.rect(x + 1, 35, 1, 5, lightOf(ACCENT_TWO));
    ball(s, x + 3, 41, 3.5, 2.5, ACCENT_TWO);
    s.rect(x, 43, 7, 1, fillOf(ACCENT_TWO));
    s.set(x + 2, 43, darkOf(ACCENT_TWO)).set(x + 4, 43, darkOf(ACCENT_TWO));
  }
  return finish(s);
})();

/** The washstand's top: a marble band seen from above, from `y`, with a vein or two. */
const WASH_TOP = 21;

/** A marble-topped washstand, a basin set in its left half, a mint cupboard beneath. */
const WASHSTAND = (() => {
  const s = new Sketch(64, 50);
  const y = WASH_TOP;
  // The splashback behind the top, tiled, and the tap rising from it over the basin.
  slab(s, 3, y - 9, 58, 9, WALL);
  for (let x = 7; x < 60; x += 6) s.rect(x, y - 8, 1, 8, shadeOf(WALL));
  s.rect(4, y - 5, 56, 1, shadeOf(WALL));
  s.rect(15, y - 14, 2, 13, fillOf(ACCENT_TWO)).rect(15, y - 14, 1, 13, lightOf(ACCENT_TWO));
  s.rect(15, y - 15, 6, 2, fillOf(ACCENT_TWO)).rect(19, y - 13, 2, 3, fillOf(ACCENT_TWO));
  s.set(15, y - 15, LAMP).set(16, y - 15, LAMP);
  for (const x of [10, 20]) s.rect(x, y - 3, 3, 2, fillOf(ACCENT_TWO)).set(x + 1, y - 4, LAMP);
  // The marble top, the basin sunk in it, and its front edge.
  s.rect(0, y, 64, 6, fillOf(STONE)).rect(0, y, 64, 1, lightOf(STONE));
  s.line(36, y + 1, 44, y + 4, shadeOf(STONE)).line(52, y + 1, 58, y + 3, shadeOf(STONE));
  s.ellipse(16, y + 3, 12, 3, shadeOf(WALL));
  s.ellipse(16, y + 3, 11, 2.5, fillOf(WALL));
  s.ellipse(16, y + 3.5, 8.5, 1.8, shadeOf(WALL)).rect(10, y + 3, 12, 1, darkOf(WALL));
  s.rect(11, y + 4, 10, 1, GLASS).set(12, y + 4, GLINT);
  s.rect(0, y + 6, 64, 2, shadeOf(STONE)).rect(0, y + 8, 64, 1, darkOf(STONE));
  // The basin's white belly under the top, and the mint cupboard either side of it.
  const front = y + 9;
  const bottom = s.height - 4;
  slab(s, 2, front, 60, bottom - front, DOOR);
  for (const x of [5, 33]) {
    slab(s, x, front + 3, 26, bottom - front - 6, DOOR);
    s.rect(x + 3, front + 6, 20, 1, lightOf(DOOR)).rect(x + 3, bottom - 6, 20, 1, shadeOf(DOOR));
    s.rect(x === 5 ? x + 22 : x + 2, front + 11, 2, 3, LAMP);
  }
  // A pink hand towel hung over the front edge on the right.
  s.rect(46, y + 6, 9, 13, fillOf(ACCENT)).rect(46, y + 6, 9, 2, lightOf(ACCENT));
  s.rect(46, y + 15, 9, 1, WHITE).rect(54, y + 8, 1, 11, shadeOf(ACCENT));
  // A plinth and two brass feet.
  s.rect(2, bottom, 60, 2, darkOf(DOOR));
  for (const x of [4, 55]) s.rect(x, bottom + 2, 5, 2, fillOf(ACCENT_TWO));
  return finish(s);
})();

/** A round mirror in a frame of little brass scallop shells. */
const BATH_MIRROR = (() => {
  const s = new Sketch(32, 32);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
    ball(s, 16 + Math.cos(a) * 11.5, 16 + Math.sin(a) * 11.5, 3.5, 3.5, ACCENT_TWO);
  }
  s.ellipse(16, 16, 12, 12, fillOf(ACCENT_TWO));
  bevelIn(s, 0, 0, 32, 32, ACCENT_TWO);
  // A shell at the top, bigger than the rest, its ribs fanning.
  ball(s, 16, 4, 5, 3.5, ACCENT_TWO);
  for (const x of [13, 16, 19]) s.line(16, 7, x, 2, shadeOf(ACCENT_TWO));
  // The glass, a soft sky with the light across it.
  s.ellipse(16, 17, 9.5, 9.5, GLASS);
  s.ellipse(16, 17, 9.5, 9.5, GLASS).rect(8, 9, 16, 2, GLASS_DARK);
  s.ellipse(16, 17, 9.5, 9.5, GLASS);
  for (let j = 0; j < 9; j++) {
    const t = j - 4;
    s.set(11 + j, 14 + t, GLINT);
    if (j < 6) s.set(14 + j, 15 + t, GLINT);
  }
  return finish(s);
})();

/** A brass rail of two fluffy towels, a mint and a pink, with bats for finials. */
const TOWEL_RAIL = (() => {
  const s = new Sketch(32, 32);
  // The towels, each folded over the rail: its fold, its stripe and a fringe.
  for (const [x, w, long, m] of [
    [3, 12, 25, DOOR],
    [16, 13, 27, ACCENT],
  ] as const) {
    slab(s, x, 6, w, long - 6, m);
    s.rect(x, 6, w, 4, lightOf(m)).rect(x, 10, w, 1, shadeOf(m));
    s.rect(x + 1, long - 7, w - 2, 2, WHITE);
    for (let i = x; i < x + w; i += 2) s.set(i, long, fillOf(m));
  }
  // The rail across, and its little bat finials at either end.
  s.rect(1, 6, 30, 2, fillOf(ACCENT_TWO)).rect(1, 6, 30, 1, lightOf(ACCENT_TWO));
  for (const x of [1, 29]) {
    s.rect(x, 2, 2, 4, darkOf(ACCENT_TWO));
    s.rect(x - 1, 3, 4, 1, INK)
      .set(x, 2, INK)
      .set(x + 1, 2, INK);
  }
  return finish(s);
})();

/** A yellow rubber duck in a little witch hat. */
const RUBBER_DUCK = (() => {
  const s = new Sketch(32, 30);
  // The body, its tail up behind, a wing tucked in.
  ball(s, 17, 22, 10, 6.5, ACCENT_TWO);
  s.rect(25, 15, 3, 4, fillOf(ACCENT_TWO)).set(27, 14, fillOf(ACCENT_TWO));
  s.rect(17, 21, 6, 1, shadeOf(ACCENT_TWO)).rect(19, 22, 5, 1, shadeOf(ACCENT_TWO));
  // The head, the beak, an eye and a blush.
  ball(s, 11, 14, 6, 5.5, ACCENT_TWO);
  s.rect(3, 14, 4, 3, fillOf(ACCENT)).rect(3, 14, 4, 1, lightOf(ACCENT));
  s.rect(4, 17, 3, 1, shadeOf(ACCENT));
  s.rect(9, 12, 2, 3, INK).set(9, 12, WHITE);
  s.rect(12, 16, 2, 1, fillOf(ACCENT));
  // The hat: a brim and a crooked cone, with a band.
  s.rect(4, 8, 15, 2, fillOf(ROOF)).rect(4, 8, 15, 1, lightOf(ROOF));
  column(s, 11, 0, 8, (j) => 1 + j * 0.85, fillOf(ROOF));
  s.rect(12, 0, 3, 1, fillOf(ROOF)).set(15, 1, fillOf(ROOF));
  s.rect(8, 6, 7, 2, fillOf(DOOR));
  return finish(s);
})();

/** A soft mint bath mat with a scalloped edge and a little ghost in its corner. */
const BATH_MAT = (() => {
  const s = new Sketch(64, 32);
  s.rect(4, 5, 56, 22, fillOf(DOOR));
  for (let x = 5; x < 60; x += 4) {
    s.ellipse(x + 1, 5, 2, 2, fillOf(DOOR)).ellipse(x + 1, 26, 2, 2, fillOf(DOOR));
  }
  for (let y = 7; y < 26; y += 4) {
    s.ellipse(4, y + 1, 2, 2, fillOf(DOOR)).ellipse(59, y + 1, 2, 2, fillOf(DOOR));
  }
  s.bevel(DOOR.slice(3, 4), lightOf(DOOR), shadeOf(DOOR));
  // A lighter band stitched inside, and tufts.
  s.rect(9, 9, 46, 1, lightOf(DOOR))
    .rect(9, 22, 46, 1, lightOf(DOOR))
    .rect(9, 9, 1, 14, lightOf(DOOR))
    .rect(54, 9, 1, 14, lightOf(DOOR));
  for (const [x, y] of [
    [27, 13],
    [37, 15],
    [47, 12],
  ] as const) {
    heart(s, x, y, 5, 4, lightOf(DOOR));
  }
  // The ghost, waving from the corner.
  s.ellipse(15, 15, 3.5, 3.5, WHITE).rect(12, 15, 7, 4, WHITE);
  s.set(12, 19, WHITE).set(15, 19, WHITE).set(18, 19, WHITE);
  s.set(19, 14, WHITE).set(20, 13, WHITE);
  s.set(14, 15, INK).set(16, 15, INK);
  return finish(s);
})();

// ---- The garden room ----------------------------------------------------------------------------

/** The potting bench's top, seen from above, from this row. */
const BENCH_TOP = 21;

/** A wooden potting bench: a back board of tools, a slatted top, and clay pots on the shelf. */
const POTTING_TABLE = (() => {
  const s = new Sketch(64, 52);
  const y = BENCH_TOP;
  // The back board, its tools on pegs: a trowel, a fork and a ball of twine.
  slab(s, 4, 2, 56, y - 1, TRIM);
  for (let x = 8; x < 58; x += 8) s.rect(x, 3, 1, y - 4, shadeOf(TRIM));
  s.rect(12, 5, 2, 6, fillOf(ROOF)).rect(11, 11, 4, 5, fillOf(STONE)).set(12, 15, lightOf(STONE));
  s.rect(26, 5, 2, 6, fillOf(ROOF));
  for (const x of [24, 26, 28]) s.rect(x, 11, 1, 5, fillOf(STONE));
  s.rect(24, 11, 5, 1, fillOf(STONE));
  ball(s, 44, 10, 4, 4, WALL);
  s.line(41, 9, 47, 12, shadeOf(WALL)).line(42, 12, 46, 7, shadeOf(WALL));
  s.rect(48, 12, 1, 4, fillOf(WALL)).set(49, 16, fillOf(WALL));
  // The slatted top, and its front edge.
  s.rect(0, y, 64, 6, fillOf(TRIM)).rect(0, y, 64, 1, lightOf(TRIM));
  for (const j of [y + 2, y + 4]) s.rect(0, j, 64, 1, shadeOf(TRIM));
  s.rect(0, y + 6, 64, 2, shadeOf(TRIM)).rect(0, y + 8, 64, 1, darkOf(TRIM));
  // The legs, the shelf low between them, and three clay pots on it, one upside down.
  const bottom = s.height - 2;
  for (const x of [2, 57]) slab(s, x, y + 9, 5, bottom - y - 9, TRIM);
  slab(s, 7, bottom - 9, 50, 3, TRIM);
  pot(s, 16, bottom - 9, 11, 10, ROOF);
  pot(s, 29, bottom - 9, 9, 8, ROOF);
  column(s, 45, bottom - 17, 8, (j) => 7 + j * 0.5, fillOf(ROOF));
  bevelIn(s, 40, bottom - 17, 12, 8, ROOF);
  s.rect(40, bottom - 11, 11, 2, fillOf(ROOF)).rect(40, bottom - 11, 11, 1, lightOf(ROOF));
  // A seedling in the little pot, and a cross brace at the back.
  s.rect(29, bottom - 21, 1, 4, fillOf(LEAVES)).rect(27, bottom - 21, 2, 1, lightOf(LEAVES));
  s.rect(30, bottom - 20, 2, 1, fillOf(LEAVES));
  return finish(s);
})();

/** Two trailing plants in macramé hangers, spilling down the wall. */
const HANGING_PLANTS = (() => {
  const s = new Sketch(32, 32);
  for (const [x, drop, seed] of [
    [8, 9, 1],
    [23, 5, 2],
  ] as const) {
    // The cords from a hook, knotted, and the pot they cradle.
    s.set(x, 0, LAMP).set(x, 1, LAMP);
    for (let j = 2; j < drop; j++) {
      const spread = Math.round(((j - 2) / (drop - 2)) * 4);
      s.set(x - spread, j, fillOf(STONE)).set(x + spread, j, fillOf(STONE));
    }
    s.rect(x - 1, 2, 3, 2, lightOf(STONE));
    slab(s, x - 5, drop, 11, 5, ROOF);
    s.rect(x - 5, drop, 11, 1, lightOf(ROOF));
    s.rect(x - 4, drop + 2, 9, 1, fillOf(STONE));
    // Leaves over the rim, and strands trailing down.
    for (let i = -5; i <= 5; i += 2) ball(s, x + i, drop - 1, 2, 1.5, LEAVES);
    for (const [dx, long] of [
      [-5, 14 + seed * 3],
      [-1, 20 - seed * 2],
      [3, 16 + seed],
      [5, 11],
    ] as const) {
      for (let j = 0; j < long && drop + 4 + j < 32; j++) {
        const sx = x + dx + (Math.floor((j + seed) / 4) % 2);
        s.set(sx, drop + 4 + j, j % 3 === 0 ? lightOf(LEAVES) : fillOf(LEAVES));
        if (j % 3 === 1) s.set(sx + (j % 2 ? 1 : -1), drop + 4 + j, fillOf(LEAVES));
      }
    }
  }
  return finish(s);
})();

/** A mint watering can with a long spout and a painted daisy. */
const WATERING_CAN = (() => {
  const s = new Sketch(32, 28);
  // The spout, out to the left, and its rose.
  s.line(10, 21, 3, 9, fillOf(DOOR)).line(10, 22, 4, 10, fillOf(DOOR));
  s.line(10, 23, 5, 13, shadeOf(DOOR));
  s.rect(1, 6, 4, 4, fillOf(DOOR)).rect(1, 6, 1, 4, lightOf(DOOR)).set(2, 7, darkOf(DOOR));
  // The body, a rounded drum, and the handle arched over its back.
  slab(s, 9, 12, 17, 14, DOOR);
  s.rect(9, 12, 17, 2, lightOf(DOOR)).rect(10, 14, 2, 10, lightOf(DOOR));
  for (let x = 13; x <= 29; x++) {
    const t = (x - 21) / 8;
    const yy = Math.round(11 - 7 * (1 - t * t));
    s.set(x, yy, fillOf(DOOR)).set(x, yy + 1, shadeOf(DOOR));
  }
  s.rect(28, 11, 2, 9, fillOf(DOOR)).rect(25, 19, 4, 2, fillOf(DOOR));
  // The daisy.
  for (const [dx, dy] of [
    [0, -2],
    [2, 0],
    [0, 2],
    [-2, 0],
  ] as const) {
    s.set(17 + dx, 19 + dy, WHITE);
  }
  s.set(17, 19, LAMP);
  return finish(s);
})();

/** A grand wicker peacock chair: a fan of a back, a plump cushion, and an hourglass base. */
const WICKER_CHAIR = (() => {
  const s = new Sketch(32, 62);
  // The fan of the back: round at the top, drawn in toward the seat.
  const fan = (x: number, y: number) => {
    const dx = x + 0.5 - 16;
    if (y < 17) return dx * dx + (y + 0.5 - 17) ** 2 <= 15.5 ** 2;
    const half = 15.5 - ((y - 17) / 27) ** 2 * 5;
    return Math.abs(dx) <= half;
  };
  for (let y = 1; y < 45; y++)
    for (let x = 0; x < 32; x++) if (fan(x, y)) s.set(x, y, fillOf(STONE));
  // Woven in spokes from the seat out, and arcs across them, the rim rolled.
  for (let y = 1; y < 45; y++) {
    for (let x = 0; x < 32; x++) {
      if (!fan(x, y)) continue;
      const dx = x + 0.5 - 16;
      const dy = y + 0.5 - 44;
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      const spoke = Math.abs(Math.sin(a * 8)) < 0.16;
      if (Math.round(r) % 7 === 0) s.set(x, y, shadeOf(STONE));
      else if (spoke) s.set(x, y, shadeOf(STONE));
      else if (Math.round(r) % 7 === 1) s.set(x, y, lightOf(STONE));
    }
  }
  for (let y = 1; y < 45; y++) {
    for (let x = 0; x < 32; x++) {
      if (!fan(x, y)) continue;
      const edge = !fan(x - 1, y) || !fan(x + 1, y) || !fan(x, y - 1);
      if (edge) s.set(x, y, x < 16 || y < 6 ? lightOf(STONE) : darkOf(STONE));
    }
  }
  // Its arms, curling round the seat, and the cushion.
  for (const x of [1, 27]) slab(s, x, 34, 4, 12, STONE);
  slab(s, 5, 40, 22, 7, ACCENT);
  s.rect(6, 41, 20, 1, lightOf(ACCENT)).set(16, 43, shadeOf(ACCENT));
  // The base: wicker drawn in at the waist, flaring to the floor.
  for (let y = 47; y < 61; y++) {
    const t = (y - 47) / 13;
    const w = Math.round(22 - 14 * Math.sin(t * Math.PI) * 0.6);
    s.rect(16 - Math.floor(w / 2), y, w, 1, (y - 47) % 3 === 2 ? shadeOf(STONE) : fillOf(STONE));
  }
  bevelIn(s, 0, 47, 32, 14, STONE);
  return finish(s);
})();

/** A big feathery fern in a terracotta pot, on a tall wooden stand. */
const FERN_STAND = (() => {
  const s = new Sketch(32, 66);
  // The stand: a round top, three slender legs splaying out, and a little shelf low down.
  const top = 34;
  s.rect(3, top, 26, 3, fillOf(TRIM)).rect(3, top, 26, 1, lightOf(TRIM));
  s.rect(4, top + 3, 24, 1, darkOf(TRIM));
  s.line(6, top + 4, 3, 63, fillOf(TRIM)).line(7, top + 4, 4, 63, fillOf(TRIM));
  s.line(25, top + 4, 28, 63, fillOf(TRIM)).line(24, top + 4, 27, 63, shadeOf(TRIM));
  s.rect(15, top + 4, 2, 26, shadeOf(TRIM));
  s.rect(6, 54, 20, 2, fillOf(TRIM)).rect(6, 54, 20, 1, lightOf(TRIM));
  // The pot on top.
  pot(s, 16, top, 14, 11, ROOF);
  // The fronds arching up and over every way, the front ones last.
  for (const [tx, ty, lift] of [
    [5, 8, 4],
    [27, 8, 4],
    [16, 1, 2],
    [10, 3, 3],
    [22, 3, 3],
    [1, 22, 5],
    [31, 22, 5],
    [3, 36, 6],
    [29, 36, 6],
    [9, 33, 4],
    [23, 33, 4],
  ] as const) {
    frond(s, 16, top - 11, tx, ty, lift);
  }
  return finish(s);
})();

/** A little lemon tree in a big terracotta pot: three lemons and a lot of blossom. */
const LEMON_TREE = (() => {
  const s = new Sketch(32, 66);
  const crown: Crown = { x: 16, y: 18, rx: 14, ry: 15 };
  paintCrown(s, crown, clumpsOf(crown, 13, { count: 8, r: 5 }), 23, 12);
  leafy(s);
  // The trunk, a little crooked, into the crown's shade.
  s.rect(15, 32, 3, 18, fillOf(TRIM)).rect(15, 32, 1, 18, lightOf(TRIM));
  s.set(14, 34, fillOf(TRIM)).set(18, 38, shadeOf(TRIM));
  // Lemons, and blossom.
  for (const [x, y] of [
    [8, 20],
    [21, 13],
    [19, 26],
  ] as const) {
    ball(s, x, y, 2.5, 2, ACCENT_TWO);
    s.set(x, y - 2, darkOf(LEAVES));
  }
  for (const [x, y] of [
    [11, 9],
    [24, 21],
    [6, 14],
    [14, 25],
    [26, 10],
    [16, 5],
    [10, 28],
  ] as const) {
    s.set(x, y, WHITE).set(x + 1, y, fillOf(ACCENT));
  }
  // The pot, with a band round its rim.
  pot(s, 16, 64, 22, 16, ROOF);
  s.rect(7, 52, 18, 1, lightOf(ROOF));
  return finish(s);
})();

// ---- The music corner ---------------------------------------------------------------------------

/** A stack of an amp: a head of knobs on a cab of grille cloth, a pumpkin badge in its corner. */
const BIG_AMP = (() => {
  const s = new Sketch(32, 52);
  // The head: black, a cream panel of knobs, a red light.
  slab(s, 2, 4, 28, 13, TRIM);
  s.rect(4, 7, 24, 6, fillOf(WALL)).rect(4, 7, 24, 1, lightOf(WALL));
  for (let x = 6; x < 26; x += 4) s.rect(x, 9, 2, 2, darkOf(TRIM)).set(x, 9, fillOf(STONE));
  s.set(26, 9, fillOf(DOOR)).set(26, 10, lightOf(DOOR));
  s.rect(13, 2, 6, 2, fillOf(STONE));
  // The cab under it: grille cloth woven in a basket of two tones, framed in black.
  slab(s, 1, 17, 30, 31, TRIM);
  for (let y = 20; y < 45; y++) {
    for (let x = 4; x < 28; x++) {
      s.set(x, y, (x + y) % 2 === 0 ? fillOf(ROOF) : shadeOf(ROOF));
    }
  }
  s.rect(4, 20, 24, 1, darkOf(TRIM)).rect(4, 20, 1, 25, darkOf(TRIM));
  // The pumpkin badge.
  ball(s, 24, 41, 2.5, 2, ACCENT);
  s.set(24, 38, fillOf(LEAVES));
  // Chrome corners, and little feet.
  for (const [x, y] of [
    [1, 17],
    [28, 17],
    [1, 45],
    [28, 45],
  ] as const) {
    s.rect(x, y, 3, 3, fillOf(STONE)).set(x, y, lightOf(STONE));
  }
  for (const x of [3, 25]) s.rect(x, 48, 4, 3, darkOf(TRIM));
  return finish(s);
})();

/** A slatted wooden crate full of records, a bat on the sleeve at the front. */
const RECORD_CRATE = (() => {
  const s = new Sketch(32, 34);
  // The sleeves, standing in a row, a little out of line.
  const sleeves: [number, number, Material][] = [
    [4, 3, ACCENT_TWO],
    [6, 1, DOOR],
    [8, 4, LEAVES],
    [10, 2, ACCENT],
    [12, 5, WALL],
  ];
  for (const [x, y, m] of sleeves) {
    slab(s, x, y, 18, 16, m);
  }
  // The one at the front: plum, with a bat on it and the record peeking out.
  s.ellipse(22, 11, 6, 6, INK).ellipse(22, 11, 2, 2, fillOf(ACCENT));
  slab(s, 4, 6, 18, 16, ROOF);
  bat(s, 6, 9);
  s.set(15, 16, WHITE).set(17, 17, WHITE).set(8, 18, WHITE);
  // The crate: slats, a handle hole, and its corners.
  slab(s, 1, 15, 30, 17, TRIM);
  for (const y of [20, 26]) s.rect(2, y, 28, 1, shadeOf(TRIM));
  s.rect(12, 17, 8, 2, darkOf(TRIM));
  for (const x of [1, 28]) s.rect(x, 15, 3, 17, shadeOf(TRIM)).rect(x, 15, 1, 17, lightOf(TRIM));
  return finish(s);
})();

/** An old chrome microphone on a little desk stand. */
const MICROPHONE = (() => {
  const s = new Sketch(32, 36);
  // The round foot, the stem and its cable curling away.
  s.ellipse(16, 32, 8, 2.5, fillOf(STONE)).ellipse(15, 31.5, 6, 1.2, lightOf(STONE));
  s.rect(8, 33, 16, 1, shadeOf(STONE));
  s.rect(15, 19, 2, 13, fillOf(STONE)).rect(15, 19, 1, 13, lightOf(STONE));
  s.line(24, 33, 28, 33, darkOf(TRIM)).line(28, 33, 30, 31, darkOf(TRIM));
  // The yoke and the capsule: a rounded head of grille, banded in gold.
  s.rect(9, 12, 2, 7, fillOf(STONE)).rect(21, 12, 2, 7, fillOf(STONE));
  s.rect(9, 18, 14, 2, fillOf(STONE));
  ball(s, 16, 10, 6, 9, STONE);
  for (let y = 4; y < 18; y += 2) {
    for (let x = 11; x < 22; x++) if (s.get(x, y) !== CLEAR) s.set(x, y, shadeOf(STONE));
  }
  s.rect(10, 10, 12, 2, LAMP).set(10, 10, GLINT);
  s.set(13, 3, WHITE).set(12, 5, WHITE);
  return finish(s);
})();

/** A bass drum with a pumpkin on its head, and a cymbal on a stand over it. */
const BASS_DRUM = (() => {
  const s = new Sketch(32, 48);
  // The cymbal's stand behind, and the cymbal tilted over the drum.
  s.line(27, 46, 25, 8, shadeOf(STONE)).line(28, 46, 26, 8, fillOf(STONE));
  s.ellipse(22, 7, 9, 2.5, fillOf(ACCENT_TWO));
  s.rect(14, 6, 13, 1, lightOf(ACCENT_TWO)).rect(16, 9, 12, 1, shadeOf(ACCENT_TWO));
  s.rect(21, 5, 2, 2, darkOf(ACCENT_TWO));
  // The shell and its hoops, cherry red, and the cream head with a jack-o'-lantern painted on.
  ball(s, 15, 29, 14, 14, DOOR);
  s.ellipse(15, 29, 11.5, 11.5, fillOf(WALL));
  ball(s, 15, 29, 11.5, 11.5, WALL);
  ball(s, 15, 30, 7, 6, ACCENT);
  s.rect(14, 22, 2, 3, fillOf(LEAVES));
  for (const x of [11, 17]) s.rect(x, 28, 3, 2, darkOf(ACCENT)).set(x + 1, 27, darkOf(ACCENT));
  s.rect(11, 32, 9, 1, darkOf(ACCENT)).set(12, 33, darkOf(ACCENT)).set(18, 33, darkOf(ACCENT));
  // Chrome lugs round the hoop, and the little spurs it stands on.
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const x = Math.round(15 + Math.cos(a) * 13 - 0.5);
    const y = Math.round(29 + Math.sin(a) * 13 - 0.5);
    s.rect(x, y, 2, 2, fillOf(STONE)).set(x, y, lightOf(STONE));
  }
  s.line(5, 39, 2, 46, fillOf(STONE)).line(25, 39, 28, 46, fillOf(STONE));
  return finish(s);
})();

/** A cherry-red guitar standing on its little stand, a bat on its scratchplate. */
const GUITAR_STAND = (() => {
  const s = new Sketch(32, 64);
  // The neck up from the body, the headstock and its pegs.
  s.rect(15, 8, 3, 34, fillOf(ROOF)).rect(15, 8, 1, 34, lightOf(ROOF));
  for (let y = 12; y < 40; y += 5) s.rect(15, y, 3, 1, fillOf(STONE));
  slab(s, 13, 1, 7, 8, TRIM);
  for (const y of [2, 5]) s.set(12, y, fillOf(STONE)).set(20, y, fillOf(STONE));
  // The body: two rounded lobes, the lower bigger, with a waist between.
  s.ellipse(16, 52, 11, 8.5, fillOf(DOOR));
  s.ellipse(16, 40, 8.5, 7, fillOf(DOOR));
  s.rect(9, 44, 14, 4, fillOf(DOOR));
  bevelIn(s, 0, 33, 32, 28, DOOR);
  s.rect(9, 37, 2, 4, lightOf(DOOR)).rect(6, 49, 2, 5, lightOf(DOOR));
  // The scratchplate and its little bat, the pickups, the strings and the knobs.
  s.ellipse(19, 52, 5, 4, WHITE);
  s.rect(17, 52, 5, 1, INK).set(19, 51, INK).set(19, 53, INK).set(16, 51, INK).set(22, 51, INK);
  for (const y of [43, 49]) s.rect(13, y, 7, 2, darkOf(TRIM)).rect(13, y, 7, 1, fillOf(STONE));
  s.rect(16, 9, 1, 46, lightOf(STONE));
  s.rect(13, 55, 7, 1, fillOf(STONE));
  for (const [x, y] of [
    [8, 53],
    [10, 57],
  ] as const) {
    s.rect(x, y, 2, 2, LAMP);
  }
  // The stand: a black frame cradling the body, its legs out to either side.
  s.line(6, 50, 3, 62, fillOf(TRIM)).line(26, 50, 29, 62, fillOf(TRIM));
  s.rect(7, 59, 18, 2, fillOf(TRIM)).rect(7, 59, 18, 1, lightOf(TRIM));
  return finish(s);
})();

/** A gig poster for the Skeleton Crew, taped up: a grinning skull and LIVE in gold. */
const GIG_POSTER = (() => {
  const s = new Sketch(32, 32);
  slab(s, 5, 1, 22, 30, ROOF);
  s.rect(7, 3, 18, 26, fillOf(ROOF));
  // The skull, grinning, with stars round it.
  ball(s, 16, 11, 6.5, 6, WALL);
  s.rect(12, 14, 9, 4, fillOf(WALL)).rect(12, 17, 9, 1, shadeOf(WALL));
  s.rect(12, 10, 3, 3, INK).rect(18, 10, 3, 3, INK);
  s.set(16, 14, INK);
  for (const x of [13, 15, 17, 19]) s.set(x, 16, shadeOf(WALL));
  star(s, 9, 5, fillOf(ACCENT_TWO));
  star(s, 23, 7, fillOf(ACCENT_TWO));
  s.set(8, 15, lightOf(ACCENT_TWO)).set(24, 14, lightOf(ACCENT_TWO));
  // LIVE across the bottom, and a scribbled signature.
  letters(s, 'LIVE', 9, 20, fillOf(ACCENT_TWO));
  s.line(10, 27, 14, 26, fillOf(DOOR)).line(14, 26, 17, 27, fillOf(DOOR));
  s.line(17, 27, 21, 25, fillOf(DOOR));
  // Tape at the corners.
  for (const [x, y] of [
    [3, 0],
    [25, 0],
    [3, 28],
    [25, 28],
  ] as const) {
    s.rect(x, y, 4, 3, fillOf(WALL));
  }
  return finish(s);
})();

// ---- The haunted lounge -------------------------------------------------------------------------

/** A coffin of a sofa, lid off and plumped with crimson velvet, silver handles on its front. */
const COFFIN_SOFA = (() => {
  const s = new Sketch(64, 50);
  // The back: a coffin laid on its side, narrow at its head, broad at the shoulders, then tapering.
  const half = (x: number) => (x < 18 ? 7 + ((x - 2) / 16) * 9 : 16 - ((x - 18) / 43) * 9);
  for (let x = 2; x < 62; x++) {
    const h = Math.round(half(x));
    s.rect(x, 19 - h, 1, h * 2, fillOf(TRIM));
  }
  bevelIn(s, 0, 0, 64, 40, TRIM);
  // Its velvet lining, tufted with buttons.
  for (let x = 5; x < 59; x++) {
    const h = Math.round(half(x)) - 3;
    s.rect(x, 19 - h, 1, h * 2, fillOf(DOOR));
  }
  for (let y = 8; y < 30; y += 5) {
    for (let x = 8 + ((y / 5) % 2) * 4; x < 58; x += 8) {
      if (s.get(x, y) !== fillOf(DOOR)) continue;
      s.set(x, y, darkOf(DOOR)).set(x - 1, y - 1, lightOf(DOOR));
      s.set(x + 1, y + 1, shadeOf(DOOR)).set(x - 2, y + 2, shadeOf(DOOR));
    }
  }
  // Two plump cushions on the seat, and the seat's dark wooden front with its silver handles.
  for (const x of [5, 32]) {
    slab(s, x, 27, 27, 8, DOOR);
    s.rect(x + 1, 28, 25, 1, lightOf(DOOR)).set(x + 13, 31, shadeOf(DOOR));
  }
  slab(s, 2, 34, 60, 11, TRIM);
  s.rect(3, 35, 58, 1, lightOf(TRIM));
  for (const x of [10, 28, 46]) {
    s.rect(x, 38, 8, 1, fillOf(STONE)).rect(x, 39, 1, 2, fillOf(STONE));
    s.rect(x + 7, 39, 1, 2, fillOf(STONE)).set(x, 38, lightOf(STONE));
  }
  // Silver claw feet.
  for (const x of [3, 56]) {
    s.rect(x, 45, 5, 3, fillOf(STONE)).set(x, 45, lightOf(STONE));
    s.set(x + 1, 47, darkOf(STONE)).set(x + 3, 47, darkOf(STONE));
  }
  return finish(s);
})();

/** Five little candles on a curly silver stand. */
const LOUNGE_CANDELABRA = (() => {
  const s = new Sketch(32, 42);
  // The foot, the stem and its knops.
  s.ellipse(16, 38, 7, 2.5, fillOf(STONE)).rect(9, 39, 14, 1, darkOf(STONE));
  s.rect(15, 22, 3, 16, fillOf(STONE)).rect(15, 22, 1, 16, lightOf(STONE));
  ball(s, 16, 30, 3, 2, STONE);
  // The arms, curling up from the stem to a cup under each candle.
  for (const dir of [-1, 1]) {
    for (let k = 0; k <= 10; k++) {
      const a = (k / 10) * Math.PI;
      s.set(
        Math.round(16 + dir * (5 - Math.cos(a) * 5)),
        Math.round(24 - Math.sin(a) * 4),
        fillOf(STONE),
      );
    }
    for (let k = 0; k <= 12; k++) {
      const a = (k / 12) * Math.PI;
      s.set(
        Math.round(16 + dir * (8 - Math.cos(a) * 8)),
        Math.round(23 - Math.sin(a) * 2),
        shadeOf(STONE),
      );
    }
  }
  for (const [x, top, tall] of [
    [3, 13, 6],
    [26, 13, 6],
    [8, 9, 9],
    [21, 9, 9],
    [15, 3, 12],
  ] as const) {
    candle(s, x, top, tall);
    s.rect(x - 1, top + 3 + tall, 5, 1, fillOf(STONE)).set(x - 1, top + 3 + tall, lightOf(STONE));
  }
  return finish(s);
})();

/** A suit of armour with a red plume, holding a feather duster, two kind eyes in its visor. */
const SUIT_OF_ARMOUR = (() => {
  const s = new Sketch(32, 66);
  // A plinth of dark wood.
  slab(s, 4, 58, 24, 7, TRIM);
  s.rect(5, 59, 22, 1, lightOf(TRIM));
  // Legs: greaves and sabatons.
  for (const x of [9, 17]) {
    slab(s, x, 40, 6, 16, STONE);
    ball(s, x + 3, 46, 3, 2, STONE);
    s.rect(x - 1, 55, 8, 3, fillOf(STONE)).rect(x - 1, 55, 8, 1, lightOf(STONE));
  }
  // The body: a round breastplate, a skirt of plates, and the belt.
  ball(s, 16, 29, 9, 10, STONE);
  for (const y of [36, 39]) slab(s, 8, y, 16, 3, STONE);
  s.rect(8, 35, 16, 1, fillOf(ACCENT)).set(15, 35, LAMP).set(16, 35, LAMP);
  // Arms: pauldrons, and the right one up holding the duster, the left at its side.
  ball(s, 6, 22, 4, 3.5, STONE);
  ball(s, 26, 22, 4, 3.5, STONE);
  slab(s, 3, 24, 5, 13, STONE);
  ball(s, 5, 38, 2.5, 2.5, STONE);
  slab(s, 25, 15, 4, 8, STONE);
  ball(s, 27, 14, 2.5, 2.5, STONE);
  // The feather duster: a stick, and pink feathers fanned at the top.
  s.rect(27, 3, 1, 11, fillOf(TRIM));
  for (const [dx, dy] of [
    [-3, -1],
    [-2, -3],
    [0, -4],
    [2, -3],
    [3, -1],
  ] as const) {
    s.line(27, 4, 27 + dx, 3 + dy, fillOf(ACCENT_TWO));
  }
  ball(s, 27, 2, 3, 2, ACCENT_TWO);
  // The helmet, its visor a slit with two warm eyes, and the plume.
  ball(s, 16, 12, 7, 7.5, STONE);
  s.rect(10, 13, 12, 3, darkOf(STONE));
  s.set(13, 14, FIRE_LIGHT).set(18, 14, FIRE_LIGHT);
  s.rect(16, 5, 1, 14, shadeOf(STONE));
  for (let k = 0; k <= 10; k++) {
    const a = Math.PI * (0.15 + (k / 10) * 0.85);
    const x = Math.round(13 + Math.cos(a) * 6);
    const yy = Math.round(6 - Math.sin(a) * 5);
    s.rect(x, yy, 2, 2, k % 3 === 0 ? lightOf(ACCENT) : fillOf(ACCENT));
  }
  s.rect(15, 4, 2, 2, LAMP);
  return finish(s);
})();

/** Which way a portrait's eyes look: at her left, straight down at her, or at her right. */
export type Glance = 'left' | 'ahead' | 'right';

/** An old gentleman ghost in a gilt frame, his eyes (`glance`) on her wherever she stands. */
function eyePortrait(glance: Glance): SpriteSource {
  const s = new Sketch(32, 64);
  frame(s, 1, 1, 30, 62, ACCENT_TWO, 4);
  // A little crest at the top of the frame, and corner rosettes.
  for (const [x, y] of [
    [3, 3],
    [27, 3],
    [3, 59],
    [27, 59],
  ] as const) {
    s.rect(x, y, 2, 2, lightOf(ACCENT_TWO));
  }
  // The dusky background, lighter round his head.
  s.rect(5, 5, 22, 54, fillOf(ROOF));
  s.ellipse(16, 22, 9, 10, lightOf(ROOF));
  // His body, a ghostly coat with a ruffled cravat, fading to the frame.
  ball(s, 16, 50, 10, 12, WALL);
  s.rect(6, 50, 21, 9, fillOf(WALL));
  s.rect(14, 38, 5, 8, WHITE).set(13, 40, WHITE).set(19, 40, WHITE).set(15, 44, shadeOf(WALL));
  s.rect(10, 44, 1, 15, shadeOf(WALL)).rect(22, 44, 1, 15, shadeOf(WALL));
  // His round head, side-whiskers, and a little top hat.
  ball(s, 16, 27, 8, 9, WALL);
  s.rect(8, 28, 2, 6, shadeOf(WALL)).rect(23, 28, 2, 6, shadeOf(WALL));
  s.rect(9, 15, 15, 2, fillOf(DOOR)).rect(9, 15, 15, 1, lightOf(DOOR));
  slab(s, 11, 7, 11, 8, DOOR);
  s.rect(11, 12, 11, 2, fillOf(ACCENT));
  // Eyes: two whites, pupils looking her way, a monocle, a smile and a blush.
  const at = { left: -1, ahead: 0, right: 1 }[glance];
  for (const x of [11, 18]) {
    s.rect(x - 1, 23, 6, 6, shadeOf(WALL));
    s.rect(x, 24, 4, 4, WHITE);
    s.rect(x + 1 + at, glance === 'ahead' ? 25 : 24, 2, 3, INK);
    s.set(x + 1 + at, glance === 'ahead' ? 25 : 24, darkOf(ROOF));
  }
  s.rect(14, 31, 4, 1, shadeOf(WALL)).set(13, 30, shadeOf(WALL)).set(18, 30, shadeOf(WALL));
  s.rect(10, 29, 2, 1, fillOf(ACCENT)).rect(21, 29, 2, 1, fillOf(ACCENT));
  return finish(s);
}

/** The portrait as it hangs, and its eyes each way she might be standing. */
export const PORTRAIT_GLANCES: Record<Glance, SpriteSource> = {
  left: eyePortrait('left'),
  ahead: eyePortrait('ahead'),
  right: eyePortrait('right'),
};

/** A tall clock with a moon on its face, a little ghost swinging for a pendulum. */
const GRAND_CLOCK = (() => {
  const s = new Sketch(32, 86);
  // The hood, its arched top and a finial.
  for (let x = 2; x < 30; x++) {
    const out = Math.abs(x + 0.5 - 16) / 14;
    const top = Math.round(9 - 6 * Math.sqrt(1 - out * out));
    s.rect(x, top, 1, 30 - top, fillOf(TRIM));
  }
  bevelIn(s, 0, 0, 32, 30, TRIM);
  ball(s, 16, 2, 2, 2, STONE);
  // The face: ivory, with numerals as ticks, the moon in its arch and two hands.
  s.ellipse(16, 18, 9, 9, fillOf(WALL));
  ball(s, 16, 18, 9, 9, WALL);
  s.ellipse(16, 18, 9.5, 9.5, fillOf(WALL));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    s.set(
      Math.round(16 + Math.cos(a) * 7.5 - 0.5),
      Math.round(18 + Math.sin(a) * 7.5 - 0.5),
      darkOf(TRIM),
    );
  }
  crescent(s, 16, 13, 2.5, LAMP);
  s.line(16, 18, 16, 21, INK).line(16, 18, 19, 17, INK);
  // The trunk, and its window on the pendulum: a little ghost on a rod, swinging.
  slab(s, 5, 30, 22, 36, TRIM);
  s.rect(9, 33, 14, 29, darkOf(TRIM)).rect(10, 34, 12, 27, fillOf(ROOF));
  s.rect(10, 34, 12, 1, GLASS_DARK).set(11, 35, GLINT).set(12, 35, GLINT).set(11, 36, GLINT);
  s.line(16, 34, 18, 50, LAMP);
  s.ellipse(18.5, 52, 3.5, 3.5, WHITE).rect(15, 52, 7, 4, WHITE);
  s.set(15, 56, WHITE).set(18, 56, WHITE).set(21, 56, WHITE);
  s.set(17, 52, INK).set(20, 52, INK);
  // The base and its feet.
  slab(s, 3, 66, 26, 16, TRIM);
  slab(s, 6, 69, 20, 10, TRIM);
  s.rect(3, 66, 26, 1, darkOf(TRIM));
  for (const x of [3, 25]) s.rect(x, 82, 4, 3, darkOf(TRIM));
  return finish(s);
})();

/** The claw-foot table's top, seen from above, from this row. */
const CLAW_TOP = 12;

/** A round side table of dark wood on three silver claws. */
const CLAW_TABLE = (() => {
  const s = new Sketch(32, 36);
  const y = CLAW_TOP;
  // The round top, and its edge.
  s.ellipse(16, y + 3, 15, 3.5, fillOf(TRIM));
  s.rect(4, y + 1, 18, 1, lightOf(TRIM)).set(3, y + 2, lightOf(TRIM));
  s.rect(1, y + 4, 30, 2, shadeOf(TRIM)).rect(2, y + 6, 28, 1, darkOf(TRIM));
  s.rect(1, y + 3, 30, 1, fillOf(TRIM));
  // The pedestal, turned, and three legs curving out to silver claws.
  s.rect(14, y + 7, 4, 10, fillOf(TRIM)).rect(14, y + 7, 1, 10, lightOf(TRIM));
  ball(s, 16, y + 12, 3, 2, TRIM);
  for (const [tx, dir] of [
    [4, -1],
    [28, 1],
    [16, 0],
  ] as const) {
    s.line(16, y + 16, tx, 32, fillOf(TRIM)).line(16 + dir, y + 16, tx + dir, 32, fillOf(TRIM));
    s.rect(tx - 1, 32, 3, 2, fillOf(STONE)).set(tx - 1, 32, lightOf(STONE));
  }
  return finish(s);
})();

// ---- Every piece --------------------------------------------------------------------------------

const lit = (x: number, y: number, radius: number) => [{ x, y, radius }];

/** The bathroom's: white enamel, mint, marble, brass and a pink towel. */
const BATHROOM = {
  ...WOOD,
  wall: C.white,
  door: C.mint,
  stone: C.ghost,
  accent: C.rose,
  accentTwo: C.gold,
  glass: C.sky,
} as const;

/** The garden room's: oak, wicker, terracotta, leaves, lemons and blossom. */
const GARDEN = {
  ...WOOD,
  trim: C.wood,
  roof: C.terracotta,
  stone: C.rope,
  door: C.mint,
  wall: C.cream,
  accent: C.snap,
  accentTwo: C.gold,
  leaves: C.leaf,
} as const;

/** The music corner's: black, cherry red, chrome and a pumpkin badge. */
const MUSIC = {
  ...WOOD,
  trim: C.furBlack,
  door: C.scarlet,
  roof: C.wood,
  wall: C.cream,
  stone: C.silver,
  accent: C.pumpkin,
  accentTwo: C.gold,
} as const;

/** The haunted lounge's: dark wood, crimson velvet, old silver and ghostly white. */
const LOUNGE = {
  ...WOOD,
  trim: C.barkDark,
  door: C.scarlet,
  roof: C.plum,
  wall: C.ghost,
  stone: C.silver,
  accent: C.rose,
  accentTwo: C.gold,
} as const;

/** Pieces whose eyes follow her round the room, by which way they look (0.3's S4). */
export const WATCHERS: Partial<Record<SecondSuitePiece, Record<Glance, SpriteSource>>> = {
  eyePortrait: PORTRAIT_GLANCES,
};

export const SET_TWO_ART: Record<SecondSuitePiece, FurnitureArt> = {
  clawTub: { source: CLAW_TUB, palette: palette(BATHROOM) },
  washstand: { source: WASHSTAND, palette: palette({ ...BATHROOM, wall: C.white }) },
  bathMirror: { source: BATH_MIRROR, palette: palette(BATHROOM) },
  towelRail: { source: TOWEL_RAIL, palette: palette(BATHROOM) },
  rubberDuck: {
    source: RUBBER_DUCK,
    palette: palette({ ...BATHROOM, accentTwo: C.candle, accent: C.pumpkin, roof: C.plum }),
  },
  bathMat: { source: BATH_MAT, palette: palette(BATHROOM) },
  pottingTable: { source: POTTING_TABLE, palette: palette(GARDEN) },
  hangingPlants: { source: HANGING_PLANTS, palette: palette(GARDEN) },
  wateringCan: { source: WATERING_CAN, palette: palette(GARDEN) },
  wickerChair: { source: WICKER_CHAIR, palette: palette(GARDEN) },
  fernStand: { source: FERN_STAND, palette: palette(GARDEN) },
  lemonTree: { source: LEMON_TREE, palette: palette({ ...GARDEN, accent: C.snapLight }) },
  bigAmp: { source: BIG_AMP, palette: palette({ ...MUSIC, roof: C.creamShade }) },
  recordCrate: {
    source: RECORD_CRATE,
    palette: palette({ ...MUSIC, trim: C.wood, roof: C.plum, leaves: C.teal }),
  },
  microphone: { source: MICROPHONE, palette: palette(MUSIC) },
  bassDrum: { source: BASS_DRUM, palette: palette(MUSIC) },
  guitarStand: { source: GUITAR_STAND, palette: palette(MUSIC) },
  gigPoster: { source: GIG_POSTER, palette: palette({ ...MUSIC, roof: C.navy }) },
  coffinSofa: { source: COFFIN_SOFA, palette: palette(LOUNGE) },
  loungeCandelabra: {
    source: LOUNGE_CANDELABRA,
    palette: palette(LOUNGE),
    glow: FIRE_LIT,
    lights: lit(16, 8, 36),
  },
  suitOfArmour: {
    source: SUIT_OF_ARMOUR,
    palette: palette({ ...LOUNGE, accent: C.scarlet, accentTwo: C.snap }),
    glow: { [FIRE_LIGHT]: C.candleBright },
  },
  eyePortrait: {
    source: PORTRAIT_GLANCES.ahead,
    palette: palette({ ...LOUNGE, door: C.furBlack }),
  },
  grandClock: { source: GRAND_CLOCK, palette: palette({ ...LOUNGE, roof: C.navy, glass: C.dusk }) },
  clawTable: { source: CLAW_TABLE, palette: palette(LOUNGE) },
};
