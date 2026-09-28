import { seeded } from '../systems/random';
import type { FurnitureId } from '../types/ids';
import {
  ACCENT,
  ACCENT_TWO,
  darkOf,
  DOOR,
  fillOf,
  finish,
  letters,
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
import {
  ball,
  bat,
  bevelIn,
  candle,
  column,
  FIRE_LIT,
  frame,
  litUp,
  palette,
  pot,
  slab,
  TRINKETS,
  WOOD,
} from './furnish';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * Her home's pieces at 32 (phase J): the first day's, and what Cobweb Corner and the pop-up sell.
 * Each is a shape in the building kit's materials and a palette of a few base colours.
 */

// ---- Her first day's --------------------------------------------------------------------------

const BAT_BED = (() => {
  const s = new Sketch(64, 76);
  // Tall posts with round knobs, and between them a headboard that is a bat, wings spread.
  for (const x of [1, 57]) {
    slab(s, x, 8, 6, 64, TRIM);
    ball(s, x + 3, 7, 4, 4, TRIM);
  }
  for (let x = 7; x < 57; x++) {
    const out = Math.abs(x + 0.5 - 32) / 25;
    const top = Math.round(12 - out * 8 + (out > 0.25 ? Math.abs(Math.sin(out * 9)) * 3 : 0));
    s.rect(x, top, 1, 30 - top, fillOf(TRIM));
  }
  s.ellipse(32, 11, 5, 5, fillOf(TRIM));
  s.rect(28, 3, 2, 5, fillOf(TRIM)).rect(34, 3, 2, 5, fillOf(TRIM));
  bevelIn(s, 7, 0, 50, 30, TRIM);
  for (const side of [-1, 1]) {
    for (const reach of [8, 15, 21]) {
      s.line(32 + side * 5, 16, 32 + side * reach, 8 + Math.round(reach / 5), darkOf(TRIM));
    }
  }
  s.set(30, 10, lightOf(ACCENT_TWO)).set(34, 10, lightOf(ACCENT_TWO));
  // Two plump pillows, the sheet turned down, and the quilt of moons and stars.
  slab(s, 9, 26, 22, 10, WALL);
  slab(s, 33, 26, 22, 10, WALL);
  s.rect(10, 34, 44, 1, shadeOf(WALL));
  slab(s, 7, 36, 50, 30, ACCENT);
  s.rect(7, 36, 50, 5, fillOf(WALL)).rect(7, 36, 50, 1, lightOf(WALL));
  s.rect(7, 40, 50, 1, shadeOf(WALL));
  const random = seeded(4);
  for (let i = 0; i < 9; i++) {
    const x = 10 + Math.floor(random() * 42);
    const y = 44 + Math.floor(random() * 18);
    if (i % 3 === 0) {
      s.ellipse(x + 1, y + 1, 2, 2, fillOf(ACCENT_TWO)).ellipse(
        x + 2,
        y + 0.5,
        1.5,
        1.5,
        fillOf(ACCENT),
      );
    } else {
      s.set(x, y, lightOf(ACCENT_TWO)).set(x - 1, y, fillOf(ACCENT_TWO));
      s.set(x + 1, y, fillOf(ACCENT_TWO)).set(x, y - 1, fillOf(ACCENT_TWO));
      s.set(x, y + 1, fillOf(ACCENT_TWO));
    }
  }
  // The quilt hangs over the foot of the bed, and the footboard in front.
  s.rect(7, 64, 50, 2, shadeOf(ACCENT));
  slab(s, 5, 62, 54, 12, TRIM);
  s.rect(9, 65, 46, 6, darkOf(TRIM)).rect(10, 66, 44, 4, shadeOf(TRIM));
  return finish(s);
})();

const TWO_HEADED_DUCK = (() => {
  const s = new Sketch(32, 46);
  // A bell jar on a wooden plinth, and Duckworth & Duckworth inside.
  s.ellipse(16, 18, 13, 16, GLASS).rect(3, 18, 26, 18, GLASS);
  s.ellipse(16, 1.5, 2, 2, GLASS_DARK);
  // Their body, sitting, and two necks up to two green heads, each looking its own way.
  ball(s, 16, 29, 9, 6, DOOR);
  s.ellipse(18, 30, 5, 3, shadeOf(DOOR)).rect(20, 25, 5, 2, shadeOf(DOOR));
  s.rect(11, 18, 3, 6, fillOf(LEAVES)).rect(19, 20, 3, 5, fillOf(LEAVES));
  s.rect(11, 21, 3, 1, WHITE).rect(19, 23, 3, 1, WHITE);
  ball(s, 11, 14, 4, 4, LEAVES);
  ball(s, 21, 17, 4, 4, LEAVES);
  s.rect(5, 14, 3, 2, fillOf(ACCENT_TWO)).rect(25, 17, 3, 2, fillOf(ACCENT_TWO));
  s.set(9, 13, INK).set(23, 16, INK);
  s.rect(12, 35, 3, 1, fillOf(ACCENT_TWO)).rect(18, 35, 3, 1, fillOf(ACCENT_TWO));
  for (let j = 0; j < 9; j++) s.set(6 + Math.floor(j / 3), 6 + j, GLINT);
  s.set(26, 26, GLINT).set(26, 27, GLINT);
  slab(s, 1, 36, 30, 4, TRIM);
  slab(s, 3, 40, 26, 5, TRIM);
  s.rect(12, 41, 8, 2, fillOf(ACCENT_TWO));
  return finish(s);
})();

/** The pumpkin armchair, from the front, the side (facing right) and the back. */
const PUMPKIN_CHAIR = (() => {
  const s = new Sketch(32, 38);
  ball(s, 16, 14, 14, 12, ACCENT);
  for (const x of [9, 16, 23])
    column(s, x, 4, 20, (j) => (j > 2 && j < 17 ? 1 : 0), shadeOf(ACCENT));
  s.rect(15, 0, 3, 4, fillOf(LEAVES)).set(18, 1, fillOf(LEAVES));
  ball(s, 16, 29, 16, 9, ACCENT);
  for (const x of [8, 24]) s.rect(x, 26, 1, 8, shadeOf(ACCENT));
  ball(s, 16, 23, 11, 4, ACCENT_TWO);
  s.rect(7, 24, 18, 1, shadeOf(ACCENT_TWO));
  ball(s, 4, 23, 4, 6, ACCENT);
  ball(s, 28, 23, 4, 6, ACCENT);
  return finish(s);
})();

const PUMPKIN_CHAIR_SIDE = (() => {
  const s = new Sketch(32, 38);
  ball(s, 9, 14, 8, 12, ACCENT);
  s.rect(9, 5, 1, 17, shadeOf(ACCENT));
  s.rect(8, 0, 3, 4, fillOf(LEAVES)).set(11, 1, fillOf(LEAVES));
  ball(s, 16, 29, 16, 9, ACCENT);
  for (const x of [10, 22]) s.rect(x, 26, 1, 8, shadeOf(ACCENT));
  ball(s, 20, 23, 10, 3.5, ACCENT_TWO);
  ball(s, 16, 23, 7, 5, ACCENT);
  return finish(s);
})();

const PUMPKIN_CHAIR_BACK = (() => {
  const s = new Sketch(32, 38);
  ball(s, 16, 29, 16, 9, ACCENT);
  ball(s, 4, 23, 4, 6, ACCENT);
  ball(s, 28, 23, 4, 6, ACCENT);
  ball(s, 16, 17, 15, 16, ACCENT);
  for (const x of [8, 16, 24]) s.rect(x, 5, 1, 24, shadeOf(ACCENT));
  s.rect(15, 0, 3, 3, fillOf(LEAVES)).set(18, 1, fillOf(LEAVES));
  return finish(s);
})();

const COFFIN_BOOKSHELF = (() => {
  const s = new Sketch(32, 58);
  // A coffin stood on end: widest at the shoulders, narrowing to the head and the foot.
  const widthAt = (j: number) => (j < 14 ? 20 + (j * 10) / 14 : 30 - ((j - 14) * 10) / 44);
  column(s, 16, 0, 58, widthAt, fillOf(TRIM));
  bevelIn(s, 0, 0, 32, 58, TRIM);
  column(s, 16, 4, 50, (j) => widthAt(j + 4) - 6, darkOf(TRIM));
  const random = seeded(12);
  for (const top of [6, 22, 38]) {
    const shelf = top + 14;
    const w = Math.round(widthAt(shelf - 4) - 8);
    let x = 16 - Math.floor(w / 2);
    const end = x + w;
    while (x < end - 1) {
      const bw = 2 + Math.floor(random() * 2);
      const bh = 8 + Math.floor(random() * 5);
      const m = TRINKETS[Math.floor(random() * TRINKETS.length)]!;
      if (x + bw > end) break;
      s.rect(x, shelf - bh, bw, bh, fillOf(m)).rect(x + bw - 1, shelf - bh, 1, bh, shadeOf(m));
      s.set(x, shelf - bh + 2, lightOf(m));
      x += bw + (random() < 0.2 ? 1 : 0);
    }
    column(s, 16, shelf, 2, () => widthAt(shelf) - 4, fillOf(TRIM));
  }
  s.rect(15, 1, 2, 3, lightOf(ACCENT_TWO)).rect(14, 2, 4, 1, lightOf(ACCENT_TWO));
  return finish(s);
})();

const CAULDRON = (() => {
  const s = new Sketch(32, 32);
  // Three stubby feet, the iron pot, its rim, and a green brew with a bubble or two.
  for (const x of [5, 14, 23]) s.rect(x, 26, 4, 5, darkOf(STONE));
  ball(s, 16, 18, 15, 11, STONE);
  s.ellipse(16, 9, 14, 3.5, darkOf(STONE)).ellipse(16, 9, 12, 2.5, fillOf(LEAVES));
  s.ellipse(12, 8.5, 3, 1, lightOf(LEAVES));
  s.ellipse(20, 3, 2, 2, fillOf(LEAVES)).ellipse(13, 1, 1, 1, fillOf(LEAVES));
  s.set(19, 2, WHITE);
  s.rect(3, 12, 26, 1, lightOf(STONE));
  return finish(s);
})();

const BAT_LAMP = (() => {
  const s = new Sketch(32, 58);
  // A round foot, a slim pole, a lavender shade, and a bat perched on top of it.
  s.ellipse(16, 55, 9, 3, fillOf(STONE)).rect(7, 55, 18, 1, shadeOf(STONE));
  s.rect(15, 24, 3, 31, fillOf(STONE)).rect(15, 24, 1, 31, lightOf(STONE));
  column(s, 16, 9, 16, (j) => 14 + j * 0.8, fillOf(ACCENT));
  bevelIn(s, 0, 9, 32, 16, ACCENT);
  s.rect(3, 24, 26, 1, darkOf(ACCENT));
  for (const x of [10, 16, 22]) s.rect(x, 11, 1, 12, shadeOf(ACCENT));
  bat(s, 8, 2);
  return finish(s);
})();

const MARBLE_RUN = (() => {
  const s = new Sketch(32, 50);
  // A wooden frame, ramps zig-zagging down it, marbles on their way, and a cup at the bottom.
  slab(s, 3, 0, 3, 46, TRIM);
  slab(s, 26, 0, 3, 46, TRIM);
  slab(s, 0, 44, 32, 5, TRIM);
  for (let i = 0; i < 5; i++) {
    const y = 4 + i * 8;
    const left = i % 2 === 0;
    for (let k = 0; k < 20; k++) {
      const x = left ? 6 + k : 25 - k;
      s.set(x, y + Math.floor(k / 4), fillOf(ACCENT_TWO)).set(
        x,
        y + 1 + Math.floor(k / 4),
        shadeOf(ACCENT_TWO),
      );
    }
  }
  const marbles: [number, number, Material][] = [
    [9, 2, ACCENT],
    [20, 11, LEAVES],
    [14, 19, ROOF],
    [22, 27, ACCENT],
    [11, 35, DOOR],
  ];
  for (const [x, y, m] of marbles) {
    s.ellipse(x + 1, y + 1, 2, 2, fillOf(m)).set(x, y, WHITE);
  }
  s.ellipse(16, 43, 5, 2, darkOf(ACCENT_TWO)).rect(11, 42, 10, 1, fillOf(ACCENT_TWO));
  return finish(s);
})();

const RECORD_PLAYER = (() => {
  const s = new Sketch(32, 42);
  // A cabinet on little legs, its two speaker grilles, and the turntable on top with a record on.
  s.rect(3, 38, 3, 4, darkOf(TRIM)).rect(26, 38, 3, 4, darkOf(TRIM));
  slab(s, 1, 16, 30, 23, TRIM);
  for (const x of [4, 17]) {
    s.rect(x, 21, 11, 14, darkOf(TRIM));
    for (let j = 0; j < 6; j++) s.rect(x + 1, 22 + j * 2, 9, 1, shadeOf(ACCENT));
  }
  slab(s, 0, 8, 32, 9, TRIM);
  s.ellipse(14, 12, 11, 3.5, INK).ellipse(14, 12, 3, 1.5, fillOf(ACCENT));
  s.rect(9, 11, 3, 1, darkOf(ROOF)).rect(17, 13, 3, 1, darkOf(ROOF));
  s.rect(27, 7, 2, 4, fillOf(STONE)).line(27, 7, 20, 12, lightOf(STONE));
  s.rect(26, 14, 3, 1, fillOf(ACCENT_TWO));
  return finish(s);
})();

const MONSTERA = (() => {
  const s = new Sketch(32, 48);
  // Big split leaves on their stems, fanning up out of a teal pot.
  const leaf = (cx: number, cy: number, rx: number, ry: number, slant: number) => {
    s.ellipse(cx, cy, rx, ry, fillOf(LEAVES));
    s.ellipse(cx - rx / 3, cy - ry / 3, rx / 2, ry / 2, lightOf(LEAVES));
    s.line(
      Math.round(cx - rx + 1),
      Math.round(cy + slant),
      Math.round(cx + rx - 1),
      Math.round(cy - slant),
      shadeOf(LEAVES),
    );
    for (const side of [-1, 1]) {
      for (let k = 0; k < 2; k++) {
        const x = Math.round(cx - rx / 2 + k * rx);
        s.line(x, Math.round(cy), x + side, Math.round(cy + side * (ry - 1)), '.');
      }
    }
  };
  s.line(16, 36, 7, 18, darkOf(LEAVES)).line(16, 36, 25, 14, darkOf(LEAVES));
  s.line(16, 36, 16, 10, darkOf(LEAVES));
  leaf(8, 16, 7, 6, 1);
  leaf(24, 13, 7, 6, -1);
  leaf(16, 8, 8, 6.5, 0);
  leaf(10, 28, 6, 4, 1);
  leaf(23, 27, 6, 4, -1);
  pot(s, 16, 48, 16, 13, ACCENT);
  return finish(s);
})();

const SNAKE_PLANT = (() => {
  const s = new Sketch(32, 50);
  // Tall pointed leaves standing straight up, banded, a cream edge on the lit side of each.
  const blades: [number, number][] = [
    [4, 14],
    [21, 8],
    [9, 2],
    [15, 0],
    [12, 16],
  ];
  for (const [x, top] of blades) {
    const w = 6;
    const h = 40 - top;
    const widthAt = (j: number) => Math.min(w, 1 + Math.floor(j / 2) * 2);
    for (let j = 0; j < h; j++) {
      const bw = widthAt(j);
      const left = x + Math.floor((w - bw) / 2);
      s.rect(left, top + j, bw, 1, j % 6 === 5 ? shadeOf(LEAVES) : fillOf(LEAVES));
      s.set(left, top + j, j > 3 ? fillOf(WALL) : lightOf(LEAVES));
      s.set(left + bw - 1, top + j, darkOf(LEAVES));
    }
    s.rect(x + 2, top + 5, 1, h - 5, lightOf(LEAVES));
  }
  pot(s, 16, 50, 18, 12, ACCENT);
  return finish(s);
})();

const VENUS_FLYTRAP = (() => {
  const s = new Sketch(32, 40);
  // Three traps on their stems, open and grinning, with a few white teeth.
  const trap = (cx: number, cy: number) => {
    s.ellipse(cx, cy - 2, 5, 3, fillOf(LEAVES)).ellipse(cx, cy + 2, 5, 3, fillOf(LEAVES));
    s.ellipse(cx, cy, 4, 2, fillOf(ACCENT)).rect(cx - 3, cy, 6, 1, darkOf(ACCENT));
    for (let i = -3; i <= 2; i += 2) s.set(cx + i, cy - 2, WHITE).set(cx + i + 1, cy + 2, WHITE);
    s.set(cx - 3, cy - 4, lightOf(LEAVES)).set(cx - 2, cy - 4, lightOf(LEAVES));
  };
  s.line(16, 30, 7, 13, darkOf(LEAVES)).line(16, 30, 25, 11, darkOf(LEAVES));
  s.line(16, 30, 16, 6, darkOf(LEAVES));
  trap(7, 12);
  trap(25, 10);
  trap(16, 6);
  s.ellipse(10, 27, 4, 2, fillOf(LEAVES)).ellipse(22, 27, 4, 2, fillOf(LEAVES));
  pot(s, 16, 40, 16, 11, ACCENT_TWO);
  return finish(s);
})();

const SUCCULENTS = (() => {
  const s = new Sketch(32, 26);
  // A low wooden trough with three rosettes, pink at the tips, and a pebble.
  const rosette = (cx: number, cy: number, r: number) => {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const x = cx + Math.cos(a) * r * 0.6;
      const y = cy + Math.sin(a) * r * 0.35;
      s.ellipse(x, y, r * 0.45, r * 0.3, fillOf(LEAVES));
    }
    s.ellipse(cx, cy - 1, r * 0.5, r * 0.35, lightOf(LEAVES));
    s.set(Math.round(cx - r), Math.round(cy), fillOf(ACCENT)).set(
      Math.round(cx + r - 1),
      Math.round(cy),
      fillOf(ACCENT),
    );
    s.set(Math.round(cx), Math.round(cy - r * 0.6), fillOf(ACCENT));
  };
  rosette(8, 11, 7);
  rosette(23, 10, 7);
  rosette(16, 8, 6);
  s.ellipse(27, 14, 2, 1, fillOf(STONE));
  slab(s, 1, 14, 30, 11, TRIM);
  s.rect(2, 19, 28, 1, darkOf(TRIM));
  return finish(s);
})();

const SKELETON_FRIEND = (() => {
  const s = new Sketch(32, 54);
  // A friendly skeleton sitting with his knees up, in a party hat, waving.
  column(s, 16, 0, 11, (j) => 1 + j, fillOf(ACCENT));
  bevelIn(s, 8, 0, 16, 11, ACCENT);
  for (const [x, y] of [
    [14, 5],
    [18, 8],
  ] as const)
    s.set(x, y, lightOf(ACCENT_TWO));
  s.ellipse(16, 0.5, 2, 1.5, fillOf(ACCENT_TWO));
  ball(s, 16, 17, 9, 8, WALL);
  s.ellipse(12.5, 17, 2.5, 3, INK).ellipse(19.5, 17, 2.5, 3, INK);
  s.set(12, 16, WHITE).set(19, 16, WHITE);
  s.rect(14, 21, 4, 1, darkOf(WALL)).set(13, 20, darkOf(WALL)).set(18, 20, darkOf(WALL));
  s.rect(12, 24, 8, 3, fillOf(WALL))
    .rect(14, 25, 1, 2, darkOf(WALL))
    .rect(17, 25, 1, 2, darkOf(WALL));
  // The ribs, and his spine down to the pelvis.
  s.rect(15, 27, 2, 14, fillOf(WALL));
  for (let k = 0; k < 4; k++)
    s.rect(11, 28 + k * 3, 10, 2, fillOf(WALL)).rect(11, 29 + k * 3, 10, 1, shadeOf(WALL));
  s.ellipse(16, 42, 6, 3, fillOf(WALL));
  // One arm resting, one up in a wave.
  s.rect(8, 29, 2, 10, fillOf(WALL)).ellipse(8.5, 40, 2, 2, fillOf(WALL));
  s.line(22, 29, 26, 24, fillOf(WALL)).line(23, 29, 27, 24, fillOf(WALL));
  s.line(26, 24, 26, 18, fillOf(WALL)).line(27, 24, 27, 18, fillOf(WALL));
  s.ellipse(27, 16, 2, 2, fillOf(WALL));
  // Knees up, and his feet flat on the floor.
  s.line(11, 43, 7, 37, fillOf(WALL)).line(12, 43, 8, 37, fillOf(WALL));
  s.line(8, 37, 8, 50, fillOf(WALL)).line(9, 37, 9, 50, fillOf(WALL));
  s.line(20, 43, 24, 37, fillOf(WALL)).line(21, 43, 25, 37, fillOf(WALL));
  s.line(24, 37, 24, 50, fillOf(WALL)).line(25, 37, 25, 50, fillOf(WALL));
  s.rect(5, 51, 5, 2, fillOf(WALL)).rect(23, 51, 5, 2, fillOf(WALL));
  return finish(s);
})();

const CANDELABRA = (() => {
  const s = new Sketch(32, 52);
  // A gold foot and stem, two arms curling up either side, and three candles.
  s.ellipse(16, 49, 8, 3, fillOf(ACCENT_TWO)).rect(8, 49, 16, 1, shadeOf(ACCENT_TWO));
  s.rect(15, 16, 3, 33, fillOf(ACCENT_TWO)).rect(15, 16, 1, 33, lightOf(ACCENT_TWO));
  ball(s, 16, 34, 3, 2, ACCENT_TWO);
  for (let k = 0; k <= 10; k++) {
    const a = (k / 10) * Math.PI;
    const dx = Math.round(Math.cos(a) * 11);
    const dy = Math.round(Math.sin(a) * 8);
    s.set(16 + dx, 18 + dy, fillOf(ACCENT_TWO)).set(16 + dx, 19 + dy, shadeOf(ACCENT_TWO));
  }
  for (const x of [4, 15, 26]) {
    s.rect(x - 1, x === 15 ? 14 : 16, 5, 2, fillOf(ACCENT_TWO));
  }
  candle(s, 4, 4, 12);
  candle(s, 15, 0, 14);
  candle(s, 26, 4, 12);
  return finish(s);
})();

const CRYSTAL_BALL = (() => {
  const s = new Sketch(32, 34);
  // A glowing lavender orb with swirls in it, on a gold stand with little claws.
  s.ellipse(16, 30, 11, 3, fillOf(ACCENT_TWO));
  slab(s, 7, 24, 18, 6, ACCENT_TWO);
  for (const x of [7, 14, 21]) s.rect(x, 22, 4, 3, fillOf(ACCENT_TWO));
  ball(s, 16, 13, 11, 11, ACCENT);
  s.line(10, 14, 14, 10, lightOf(ACCENT)).line(14, 10, 19, 12, lightOf(ACCENT));
  s.line(13, 17, 19, 16, shadeOf(ACCENT));
  s.ellipse(11, 7, 2, 2, GLINT).set(20, 18, GLINT);
  return finish(s);
})();

const TOMBSTONE = (() => {
  const s = new Sketch(32, 38);
  // A rounded headstone reading RIP, moss at its foot, and a little pumpkin keeping it company.
  s.ellipse(15, 11, 12, 11, fillOf(STONE)).rect(3, 11, 24, 24, fillOf(STONE));
  bevelIn(s, 0, 0, 32, 36, STONE);
  s.rect(6, 14, 18, 1, darkOf(STONE));
  letters(s, 'RIP', 9, 6, darkOf(STONE));
  for (const x of [8, 11, 17, 21]) s.rect(x, 19, 3, 1, shadeOf(STONE));
  for (const x of [7, 12, 18]) s.rect(x, 22, 4, 1, shadeOf(STONE));
  s.ellipse(8, 34, 7, 2, fillOf(LEAVES)).ellipse(22, 35, 6, 2, fillOf(LEAVES));
  s.set(5, 32, lightOf(LEAVES)).set(20, 33, lightOf(LEAVES));
  ball(s, 25, 32, 6, 5, ACCENT);
  s.rect(25, 28, 1, 8, shadeOf(ACCENT)).rect(24, 25, 2, 3, fillOf(LEAVES));
  s.rect(0, 36, 32, 2, '.');
  return finish(s);
})();

/** A round rug, woven in rings from the edge in: `rings` are materials' keys, one per band. */
function roundRug(size: number, rings: readonly [key: string, width: number][]): Sketch {
  const s = new Sketch(size, size);
  const r = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let d = r - 1 - Math.hypot(x + 0.5 - r, y + 0.5 - r);
      if (d < 0) continue;
      for (const [key, width] of rings) {
        if (d < width) {
          s.set(x, y, key);
          break;
        }
        d -= width;
      }
    }
  }
  return s;
}

const MOON_RUG = (() => {
  const s = roundRug(64, [
    [shadeOf(ACCENT), 3],
    [fillOf(ACCENT_TWO), 1],
    [fillOf(ACCENT), 99],
  ]);
  // A crescent moon lit along its outer curve, and a scatter of stars.
  const inMoon = (i: number, j: number) =>
    Math.hypot(i + 0.5 - 29, j + 0.5 - 32) < 15 && Math.hypot(i + 0.5 - 36, j + 0.5 - 28) >= 13;
  for (let j = 0; j < 64; j++) {
    for (let i = 0; i < 64; i++) {
      if (!inMoon(i, j)) continue;
      const lit = i + 0.5 - 29 < -6 && j + 0.5 - 32 > 2;
      s.set(i, j, lit ? lightOf(ACCENT_TWO) : fillOf(ACCENT_TWO));
    }
  }
  for (const [x, y] of [
    [44, 18],
    [48, 40],
    [20, 16],
    [40, 50],
    [52, 29],
  ] as const) {
    s.set(x, y, lightOf(ACCENT_TWO)).set(x - 1, y, fillOf(ACCENT_TWO));
    s.set(x + 1, y, fillOf(ACCENT_TWO)).set(x, y - 1, fillOf(ACCENT_TWO));
    s.set(x, y + 1, fillOf(ACCENT_TWO));
  }
  return finish(s);
})();

/** A spiderweb rug: spokes and rings of silver on plum, and a plush little spider in the middle. */
const SPIDERWEB_RUG = (() => {
  const size = 96;
  const s = roundRug(size, [
    [shadeOf(ACCENT), 2],
    [fillOf(ACCENT), 99],
  ]);
  const r = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (s.get(x, y) !== fillOf(ACCENT)) continue;
      const dx = x + 0.5 - r;
      const dy = y + 0.5 - r;
      const d = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const spoke = Math.abs(Math.sin(angle * 4)) * d < 0.8;
      // Each ring sags a little between spokes, as a web does.
      const sag = Math.abs(Math.sin(angle * 4)) * 1.6;
      const ring = Math.abs(((d + sag + 3) % 10) - 5) < 0.6 && d > 8;
      if (spoke || ring) s.set(x, y, fillOf(STONE));
    }
  }
  // The spider: a round fuzzy body, stubby bent legs, two big shiny eyes and a pink bow.
  for (const side of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const y = 44 + k * 3 - 2;
      const x0 = r + side * 5;
      const x1 = r + side * 10;
      s.line(x0, y, x1, y - 2, INK).line(x1, y - 2, x1 + side * 2, y + 2, INK);
    }
  }
  s.ellipse(r, 49, 7, 7, INK);
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    s.set(Math.round(r + Math.cos(a) * 7.5), Math.round(49 + Math.sin(a) * 7.5), INK);
  }
  s.ellipse(r - 3, 47, 2.5, 3, WHITE).ellipse(r + 3, 47, 2.5, 3, WHITE);
  s.rect(r - 3, 47, 2, 2, INK).rect(r + 3, 47, 2, 2, INK);
  s.set(r - 3, 46, WHITE).set(r + 3, 46, WHITE);
  s.ellipse(r - 2, 41, 2, 1.5, fillOf(ACCENT_TWO)).ellipse(r + 2, 41, 2, 1.5, fillOf(ACCENT_TWO));
  s.set(r, 41, darkOf(ACCENT_TWO));
  return finish(s);
})();

/**
 * Her stained-glass lamp (personal_touches.md, "After phase I"): a bronze foot and stem, and a
 * domed shade of glass roses and leaves on honey-gold, in lead lines, that glows after dark.
 */
const FLORAL_LAMP = (() => {
  const s = new Sketch(32, 60);
  s.ellipse(16, 57, 8, 3, fillOf(STONE)).rect(8, 57, 16, 1, shadeOf(STONE));
  s.ellipse(16, 53, 4, 2, fillOf(STONE));
  s.rect(15, 26, 3, 28, fillOf(STONE)).rect(15, 26, 1, 28, lightOf(STONE));
  s.ellipse(16, 38, 2.5, 1.5, fillOf(STONE)).ellipse(16, 46, 2.5, 1.5, fillOf(STONE));
  // The shade: a dome of honey-gold glass, a band of roses round it and leaves under them.
  const inShade = (x: number, y: number) => {
    const dx = (x + 0.5 - 16) / 15;
    const dy = (y + 0.5 - 24) / 20;
    return y <= 25 && dx * dx + dy * dy <= 1;
  };
  for (let y = 3; y < 26; y++) {
    for (let x = 0; x < 32; x++) {
      if (!inShade(x, y)) continue;
      const key = y > 21 ? fillOf(LEAVES) : fillOf(ACCENT_TWO);
      s.set(x, y, key);
    }
  }
  for (const [x, y] of [
    [5, 17],
    [11, 14],
    [17, 13],
    [23, 14],
    [28, 17],
    [14, 19],
    [21, 19],
  ] as const) {
    s.ellipse(x + 0.5, y + 0.5, 3, 2.5, fillOf(ACCENT)).set(x, y, lightOf(ACCENT));
    s.set(x - 1, y + 1, shadeOf(ACCENT)).set(x + 1, y + 1, shadeOf(ACCENT));
    s.set(x + 3, y + 2, fillOf(LEAVES)).set(x - 3, y + 2, fillOf(LEAVES));
  }
  s.ellipse(16, 8, 5, 3, lightOf(ACCENT_TWO)).ellipse(9, 11, 2, 2, lightOf(ACCENT_TWO));
  // The lead between the panes, and the rim and the finial.
  for (const x of [3, 9, 16, 23, 29]) {
    for (let y = 4; y < 26; y++) {
      const lx = Math.round(16 + (x - 16) * (0.3 + (0.7 * (y - 4)) / 21));
      if (inShade(lx, y) && y % 7 !== 3) s.set(lx, y, darkOf(STONE));
    }
  }
  for (let x = 0; x < 32; x++) {
    for (const y of [11, 21]) if (inShade(x, y)) s.set(x, y, darkOf(STONE));
  }
  s.rect(1, 25, 30, 2, fillOf(STONE)).rect(1, 25, 30, 1, lightOf(STONE));
  s.ellipse(16, 2, 2, 2, fillOf(STONE)).set(16, 0, fillOf(STONE));
  return finish(s);
})();

// ---- On the wall -------------------------------------------------------------------------------

/** A picture in a frame filling a 32-pixel wall tile, less a pixel round it for the outline. */
function framed(m: Material, ground: string): Sketch {
  const s = new Sketch(32, 32);
  frame(s, 1, 1, 30, 30, m, 4);
  s.rect(4, 4, 24, 24, ground);
  return s;
}

const GHOST_PORTRAIT = (() => {
  const s = framed(ACCENT_TWO, fillOf(ROOF));
  // Great-Aunt Boo-nice: a ghost with a bun, a pearl choker and a very polite smile.
  s.rect(4, 22, 24, 6, shadeOf(ROOF));
  s.ellipse(16, 8, 4, 3, fillOf(WALL));
  s.ellipse(16, 15, 8, 8, fillOf(WALL)).rect(8, 15, 16, 13, fillOf(WALL));
  for (const x of [8, 13, 18, 23]) s.rect(x, 27, 2, 1, fillOf(ROOF));
  bevelIn(s, 4, 4, 24, 24, WALL);
  s.ellipse(13, 15, 1.5, 2, INK).ellipse(19, 15, 1.5, 2, INK);
  s.rect(15, 19, 2, 1, INK).set(11, 18, fillOf(ACCENT)).set(21, 18, fillOf(ACCENT));
  for (let x = 11; x <= 21; x += 2) s.set(x, 22, WHITE);
  return finish(s);
})();

const CAT_PORTRAIT = (() => {
  const s = framed(ACCENT_TWO, fillOf(LEAVES));
  // A black cat sitting for its portrait in a pink bow, looking pleased with itself.
  s.rect(4, 24, 24, 4, shadeOf(LEAVES));
  s.ellipse(16, 23, 8, 7, INK).ellipse(16, 13, 6, 5, INK);
  s.rect(10, 7, 3, 3, INK).rect(19, 7, 3, 3, INK).set(10, 6, INK).set(21, 6, INK);
  s.set(11, 8, fillOf(ACCENT)).set(20, 8, fillOf(ACCENT));
  s.rect(12, 12, 2, 2, GLASS).rect(18, 12, 2, 2, GLASS);
  s.set(12, 12, WHITE).set(18, 12, WHITE).set(16, 15, fillOf(ACCENT));
  s.ellipse(13.5, 18.5, 2, 1.5, fillOf(ACCENT)).ellipse(18.5, 18.5, 2, 1.5, fillOf(ACCENT));
  s.set(16, 18, darkOf(ACCENT));
  s.line(23, 27, 26, 21, INK).line(24, 27, 27, 21, INK);
  return finish(s);
})();

const MOON_PAINTING = (() => {
  const s = framed(ACCENT_TWO, fillOf(ACCENT));
  // A full moon over rolling hills, a bare tree, and stars.
  s.rect(4, 4, 24, 9, shadeOf(ACCENT));
  s.ellipse(20, 11, 5, 5, lightOf(ACCENT_TWO)).set(19, 9, fillOf(ACCENT_TWO));
  s.set(21, 12, fillOf(ACCENT_TWO));
  for (let x = 4; x < 28; x++) {
    const near = Math.round(22 + Math.cos((x - 4) / 5) * 2);
    const far = Math.round(20 - Math.sin((x - 2) / 6) * 2);
    s.rect(x, far, 1, 28 - far, shadeOf(LEAVES));
    s.rect(x, near, 1, 28 - near, fillOf(LEAVES));
  }
  s.line(9, 22, 9, 14, INK).line(9, 17, 6, 14, INK).line(9, 18, 12, 15, INK);
  for (const [x, y] of [
    [7, 7],
    [12, 9],
    [26, 6],
    [14, 5],
  ] as const)
    s.set(x, y, lightOf(ACCENT_TWO));
  return finish(s);
})();

const BAT_CLOCK = (() => {
  const s = new Sketch(32, 32);
  // A round cream face with bat wings out either side, ears on top, and a swinging tail.
  for (const side of [-1, 1]) {
    for (let k = 0; k < 10; k++) {
      const x = 16 + side * (9 + k);
      const top = 6 + Math.round(k * 0.4);
      const bottom = 20 - Math.round(Math.abs(Math.sin(k * 0.9)) * 4);
      if (x >= 1 && x <= 30) s.rect(x, top, 1, bottom - top, INK);
    }
  }
  s.rect(10, 4, 3, 4, INK).rect(19, 4, 3, 4, INK);
  s.ellipse(16, 15, 10, 10, fillOf(ROOF)).ellipse(16, 15, 8, 8, fillOf(WALL));
  bevelIn(s, 6, 5, 20, 20, ROOF);
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2;
    s.set(Math.round(15.5 + Math.sin(a) * 6.5), Math.round(14.5 - Math.cos(a) * 6.5), darkOf(WALL));
  }
  s.line(16, 15, 16, 10, INK).line(16, 15, 19, 17, INK);
  s.set(16, 15, fillOf(ACCENT));
  s.rect(15, 25, 2, 4, INK).ellipse(16, 29.5, 2, 1.5, fillOf(ACCENT_TWO));
  return finish(s);
})();

const WALL_SHELF = (() => {
  const s = new Sketch(32, 32);
  // A little shelf on two brackets: a potion, a candle stub and a tiny skull.
  slab(s, 2, 20, 28, 4, TRIM);
  for (const x of [5, 24])
    s.line(x, 24, x + 3, 28, darkOf(TRIM)).line(x + 1, 24, x + 3, 27, darkOf(TRIM));
  s.ellipse(8, 16, 4, 4, GLASS).rect(7, 9, 3, 4, GLASS).rect(6, 8, 5, 1, fillOf(TRIM));
  s.ellipse(8, 17, 3, 2, fillOf(LEAVES)).set(6, 14, GLINT);
  candle(s, 14, 9, 8);
  ball(s, 23, 15, 4, 3.5, WALL);
  s.rect(21, 17, 5, 3, fillOf(WALL));
  s.set(21, 15, INK).set(24, 15, INK).set(22, 18, darkOf(WALL)).set(24, 18, darkOf(WALL));
  return finish(s);
})();

const POTHOS = (() => {
  const s = new Sketch(32, 32);
  // A pot hung from a hook on three strings, its heart-shaped leaves trailing down.
  s.set(16, 1, fillOf(STONE)).set(16, 2, fillOf(STONE));
  s.line(16, 3, 8, 12, fillOf(ROOF))
    .line(16, 3, 24, 12, fillOf(ROOF))
    .line(16, 3, 16, 12, fillOf(ROOF));
  pot(s, 16, 20, 18, 9, ACCENT);
  const leaf = (x: number, y: number) => {
    s.set(x, y, fillOf(LEAVES)).set(x + 2, y, fillOf(LEAVES));
    s.rect(x, y + 1, 3, 1, fillOf(LEAVES)).set(x + 1, y + 2, fillOf(LEAVES));
    s.set(x, y + 1, lightOf(LEAVES));
  };
  for (const [x, length] of [
    [7, 9],
    [11, 6],
    [21, 11],
    [25, 7],
  ] as const) {
    s.rect(x + 1, 18, 1, length, darkOf(LEAVES));
    for (let k = 0; k < length; k += 3) leaf(x - (k % 2), 18 + k);
  }
  for (let x = 8; x < 25; x += 3) leaf(x, 10);
  return finish(s);
})();

const GOTHIC_MIRROR = (() => {
  const s = new Sketch(32, 64);
  // A tall mirror with a pointed arch, in a gold frame with a little bat at the peak.
  const archTop = (x: number, inset: number) => {
    const d = Math.abs(x + 0.5 - 16);
    return 6 + inset + Math.round(((d * d) / (14 - inset)) * 0.9);
  };
  for (let x = 3; x < 29; x++) s.rect(x, archTop(x, 0), 1, 60 - archTop(x, 0), fillOf(ACCENT_TWO));
  bevelIn(s, 0, 0, 32, 64, ACCENT_TWO);
  for (let x = 6; x < 26; x++) s.rect(x, archTop(x, 3), 1, 57 - archTop(x, 3), GLASS);
  for (let j = 0; j < 14; j++) s.set(9 + Math.floor(j / 3), 18 + j, GLINT);
  for (let j = 0; j < 6; j++) s.set(20 + Math.floor(j / 3), 40 + j, GLINT);
  s.ellipse(16, 5, 3, 3, fillOf(ACCENT_TWO))
    .set(15, 5, darkOf(ACCENT_TWO))
    .set(17, 5, darkOf(ACCENT_TWO));
  s.rect(10, 60, 12, 2, fillOf(ACCENT_TWO)).rect(10, 61, 12, 1, shadeOf(ACCENT_TWO));
  return finish(s);
})();

const MYSTERY_CORKBOARD = (() => {
  const s = new Sketch(64, 32);
  // A corkboard in a wooden frame: notes, a photo, a question mark, and red string between pins.
  frame(s, 1, 1, 62, 30, TRIM, 3);
  s.rect(4, 4, 56, 24, fillOf(DOOR));
  const random = seeded(8);
  for (let k = 0; k < 40; k++)
    s.set(4 + Math.floor(random() * 56), 4 + Math.floor(random() * 24), shadeOf(DOOR));
  const note = (x: number, y: number, w: number, h: number, m: string) => {
    s.rect(x, y, w, h, m);
    for (let j = y + 2; j < y + h - 1; j += 2) s.rect(x + 1, j, w - 3, 1, darkOf(WALL));
  };
  note(7, 7, 10, 9, fillOf(WALL));
  note(46, 6, 10, 10, fillOf(WALL));
  note(40, 18, 8, 7, lightOf(ACCENT_TWO));
  s.rect(22, 15, 10, 11, WHITE).rect(23, 16, 8, 7, shadeOf(ROOF));
  s.ellipse(27, 20, 2, 2, INK).rect(25, 21, 5, 2, INK);
  for (const [x, y] of [
    [51, 19],
    [52, 19],
    [53, 19],
    [53, 20],
    [52, 21],
    [53, 21],
    [52, 23],
  ] as const)
    s.set(x, y, fillOf(ACCENT));
  s.rect(10, 20, 7, 6, fillOf(WALL)).rect(12, 22, 3, 2, darkOf(WALL));
  const pins: [number, number][] = [
    [12, 7],
    [27, 15],
    [51, 6],
    [44, 18],
    [13, 20],
  ];
  s.line(12, 7, 27, 15, fillOf(ACCENT)).line(27, 15, 51, 6, fillOf(ACCENT));
  s.line(27, 15, 44, 18, fillOf(ACCENT)).line(13, 20, 27, 15, fillOf(ACCENT));
  for (const [x, y] of pins) s.set(x, y, lightOf(ACCENT_TWO)).set(x, y - 1, fillOf(ACCENT));
  return finish(s);
})();

const BAT_GARLAND = (() => {
  const s = new Sketch(64, 32);
  // A string swagged across the wall with little bats and orange pennants hung along it.
  const sagAt = (x: number) => Math.round(3 + Math.sin(((x - 2) / 60) * Math.PI) * 9);
  for (let x = 2; x < 62; x++) s.set(x, sagAt(x), fillOf(ROOF));
  s.ellipse(2.5, 3, 2, 2, fillOf(ACCENT)).ellipse(61.5, 3, 2, 2, fillOf(ACCENT));
  for (const x of [10, 30, 50]) {
    const y = sagAt(x) + 1;
    column(s, x, y, 7, (j) => 7 - j, fillOf(ACCENT));
    s.rect(x - 3, y, 1, 3, lightOf(ACCENT));
  }
  for (const x of [20, 40]) {
    const y = sagAt(x);
    s.set(x, y + 1, INK).set(x, y + 2, INK);
    bat(s, x - 7, y + 3);
  }
  return finish(s);
})();

export const PIECES_ART = {
  batBed: {
    source: BAT_BED,
    palette: palette({
      ...WOOD,
      trim: C.plum,
      wall: C.white,
      accent: C.blueFabric,
      accentTwo: C.gold,
    }),
  },
  twoHeadedDuck: {
    source: TWO_HEADED_DUCK,
    palette: palette({
      ...WOOD,
      wall: C.white,
      door: C.fur,
      leaves: C.hedge,
      accentTwo: C.pumpkin,
      glass: C.lavender,
    }),
  },
  pumpkinChair: {
    source: PUMPKIN_CHAIR,
    side: PUMPKIN_CHAIR_SIDE,
    back: PUMPKIN_CHAIR_BACK,
    palette: palette({ ...WOOD, accent: C.pumpkin, accentTwo: C.plum, leaves: C.leafDark }),
  },
  coffinBookshelf: {
    source: COFFIN_BOOKSHELF,
    palette: palette({
      ...WOOD,
      trim: C.barkDark,
      accent: C.maroon,
      accentTwo: C.gold,
      leaves: C.moss,
      roof: C.plum,
      door: C.blueFabric,
    }),
  },
  cauldron: {
    source: CAULDRON,
    palette: palette({ ...WOOD, stone: C.iron, leaves: C.orbGreen }),
    glow: { [fillOf(LEAVES)]: C.orbGreenLight, [lightOf(LEAVES)]: C.white },
  },
  batLamp: {
    source: BAT_LAMP,
    palette: palette({ ...WOOD, stone: C.iron, accent: C.lavender }),
    glow: litUp(ACCENT),
    lights: [{ x: 16, y: 18, radius: 52 }],
  },
  marbleRun: {
    source: MARBLE_RUN,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      accentTwo: C.bark,
      accent: C.rose,
      leaves: C.sky,
      roof: C.gold,
      door: C.orbGreen,
    }),
  },
  recordPlayer: {
    source: RECORD_PLAYER,
    palette: palette({
      ...WOOD,
      trim: C.maroon,
      accent: C.rose,
      stone: C.silver,
      accentTwo: C.gold,
    }),
  },
  monstera: {
    source: MONSTERA,
    palette: palette({ ...WOOD, leaves: C.leaf, accent: C.teal }),
  },
  snakePlant: {
    source: SNAKE_PLANT,
    palette: palette({ ...WOOD, leaves: C.hedge, wall: C.hostaCream, accent: C.teal }),
  },
  venusFlytrap: {
    source: VENUS_FLYTRAP,
    palette: palette({ ...WOOD, leaves: C.guac, accent: C.rose, accentTwo: C.teal }),
  },
  succulents: {
    source: SUCCULENTS,
    palette: palette({ ...WOOD, trim: C.wood, leaves: C.hostaBlue, accent: C.rose }),
  },
  skeletonFriend: {
    source: SKELETON_FRIEND,
    palette: palette({ ...WOOD, wall: C.bone, accent: C.rose, accentTwo: C.gold }),
  },
  candelabra: {
    source: CANDELABRA,
    palette: palette({ ...WOOD, roof: C.cream, accentTwo: C.gold }),
    glow: FIRE_LIT,
    lights: [
      { x: 5, y: 5, radius: 28 },
      { x: 16, y: 1, radius: 36 },
      { x: 27, y: 5, radius: 28 },
    ],
  },
  crystalBall: {
    source: CRYSTAL_BALL,
    palette: palette({ ...WOOD, accent: C.lavender, accentTwo: C.gold, glass: C.lavender }),
    glow: {
      [shadeOf(ACCENT)]: C.lavender,
      [fillOf(ACCENT)]: C.lavender,
      [lightOf(ACCENT)]: C.ghost,
      [GLINT]: C.candleBright,
    },
    lights: [{ x: 16, y: 13, radius: 32 }],
  },
  tombstone: {
    source: TOMBSTONE,
    palette: palette({ ...WOOD, stone: C.stone, leaves: C.moss, accent: C.pumpkin }),
  },
  moonRug: {
    source: MOON_RUG,
    palette: palette({ ...WOOD, accent: C.blueFabric, accentTwo: C.gold }),
  },
  spiderwebRug: {
    source: SPIDERWEB_RUG,
    palette: palette({ ...WOOD, accent: C.plum, stone: C.silver, accentTwo: C.rose }),
  },
  ghostPortrait: {
    source: GHOST_PORTRAIT,
    palette: palette({
      ...WOOD,
      wall: C.ghost,
      roof: C.plumLight,
      accent: C.rose,
      accentTwo: C.gold,
    }),
  },
  catPortrait: {
    source: CAT_PORTRAIT,
    palette: palette({
      ...WOOD,
      leaves: C.teal,
      accent: C.rose,
      accentTwo: C.gold,
      glass: C.orbGreen,
    }),
  },
  moonPainting: {
    source: MOON_PAINTING,
    palette: palette({ ...WOOD, accent: C.navy, accentTwo: C.gold, leaves: C.hedgeDark }),
  },
  batClock: {
    source: BAT_CLOCK,
    palette: palette({ ...WOOD, roof: C.plum, accent: C.pumpkin, accentTwo: C.gold }),
  },
  wallShelf: {
    source: WALL_SHELF,
    palette: palette({
      ...WOOD,
      trim: C.wood,
      wall: C.bone,
      leaves: C.orbGreen,
      glass: C.lavender,
    }),
  },
  pothos: {
    source: POTHOS,
    palette: palette({ ...WOOD, roof: C.cream, accent: C.cream, leaves: C.leaf, stone: C.gold }),
  },
  gothicMirror: {
    source: GOTHIC_MIRROR,
    palette: palette({ ...WOOD, accentTwo: C.gold, glass: C.sky }),
  },
  mysteryCorkboard: {
    source: MYSTERY_CORKBOARD,
    palette: palette({
      ...WOOD,
      door: C.wood,
      wall: C.cream,
      roof: C.sky,
      accent: C.scarlet,
      accentTwo: C.candle,
    }),
  },
  batGarland: {
    source: BAT_GARLAND,
    palette: palette({ ...WOOD, roof: C.cream, accent: C.pumpkin }),
  },
  floralLamp: {
    source: FLORAL_LAMP,
    palette: palette({
      ...WOOD,
      stone: C.goldShade,
      accent: C.rose,
      accentTwo: C.candle,
      leaves: C.leaf,
    }),
    glow: {
      [fillOf(ACCENT_TWO)]: C.candleBright,
      [lightOf(ACCENT_TWO)]: C.white,
      [fillOf(ACCENT)]: C.roseLight,
      [lightOf(ACCENT)]: C.white,
      [shadeOf(ACCENT)]: C.rose,
      [fillOf(LEAVES)]: C.leafLight,
    },
    lights: [{ x: 16, y: 18, radius: 56 }],
  },
} satisfies Partial<Record<FurnitureId, FurnitureArt>>;
