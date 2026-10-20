import { seeded } from '../systems/random';
import { clumpsOf, paintCrown, type Crown } from './nature';
import { CLEAR, Sketch } from './sketch';
import type { SpriteSource } from './sprite';

/*
 * Three more shapes for the town's tree (V1's L2, decision 293), so a wood isn't a wall of three
 * trees: a conifer in tiers of drooping boughs, a dead spooky tree of curling bare branches with a
 * few last leaves, and a birch, slim and pale with dark marks under an airy crown.
 * Each is the tree's size (96×120, its foot at the middle of the bottom) and in the tree's keys, so
 * it takes the same leaf colours by where it stands (`TREE_LEAVES`); a birch's bark is `i`–`J`
 * and a hollow `k`, which `leaves` in `sprites/nature.ts` colours for every tree.
 */

const W = 96;
const H = 120;
const FOOT = { x: 48, y: 116 };

const LEAF_OUTLINE = { 0: 'o', 1: 'o', 2: 'o', 3: 'o', 4: 'o', 5: 'o' } as const;

/** A trunk tapering up from a flare at its foot to `top`, `base` pixels across at the bottom. */
function trunk(s: Sketch, top: number, base: number, key = 'w', lean = 0): void {
  for (let y = top; y <= FOOT.y; y++) {
    const up = (FOOT.y - y) / (FOOT.y - top);
    const flare = y > FOOT.y - 5 ? Math.round(((y - (FOOT.y - 5)) / 5) ** 2 * 3) : 0;
    const half = Math.max(1, Math.round(base / 2 - up * (base / 5))) + flare;
    s.rect(FOOT.x - half + Math.round(lean * up), y, half * 2, 1, key);
  }
}

/**
 * A conifer: tiers of boughs, each a row of leafy clumps wider than the one above, lit as one mass
 * from the top left with the shade of each tier tucked under the next, on a short trunk.
 */
function drawConifer(): SpriteSource {
  const s = new Sketch(W, H);
  trunk(s, 84, 10);
  s.bevel('w', 'W', 'v');
  const crown: Crown = { x: 48, y: 52, rx: 34, ry: 46 };
  const rand = seeded(83);
  const clumps = [{ x: 48, y: 9, r: 5 }];
  const tiers = 6;
  for (let i = 0; i < tiers; i++) {
    const y = 18 + i * 12;
    const half = 7 + i * 5.2;
    const count = 2 + i;
    for (let k = 0; k < count; k++) {
      const x = 48 - half + (half * 2 * (k + 0.5)) / count + (rand() - 0.5) * 3;
      clumps.push({ x, y: y + (rand() - 0.5) * 2, r: 6.5 + i * 0.6 + rand() * 1.5 });
    }
    // The tier's middle, so it reads solid down the tree.
    clumps.push({ x: 48 + (rand() - 0.5) * 4, y: y - 4, r: 6 + i * 0.8 });
  }
  clumps.sort((a, b) => a.y - b.y);
  const ownerAt = paintCrown(s, crown, clumps, 29, 40);
  shadeUnder(s, ownerAt, 6);
  s.outline({ ...LEAF_OUTLINE, w: 'u', W: 'u', v: 'u' });
  return s.toSource();
}

/** The crown's shade across the top of the trunk beneath it. */
function shadeUnder(
  s: Sketch,
  ownerAt: (x: number, y: number) => number | undefined,
  depth: number,
  bark: readonly string[] = ['w', 'W'],
  shade = 'v',
): void {
  for (let x = 0; x < W; x++) {
    let bottom = -1;
    for (let y = 0; y < H; y++) if (ownerAt(x, y) !== undefined) bottom = y;
    if (bottom < 0) continue;
    for (let y = bottom + 1; y < bottom + depth; y++) {
      if (bark.includes(s.get(x, y) ?? CLEAR)) s.set(x, y, shade);
    }
  }
}

/** A bare branch from (x, y) for `length` pixels at `angle`, thinning out, with a curl at its tip. */
function branch(
  s: Sketch,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  curl: number,
  rand: () => number,
  depth: number,
  tips: { x: number; y: number }[],
): void {
  let px = x;
  let py = y;
  let a = angle;
  for (let i = 0; i < length; i++) {
    const w = Math.max(1, Math.round(width * (1 - i / length)));
    s.rect(Math.round(px - w / 2), Math.round(py), w, w > 1 ? 2 : 1, 'w');
    // The last third curls gently over, as a spooky tree's twigs do.
    if (i > length * 0.65) a += curl;
    px += Math.cos(a);
    py += Math.sin(a);
    if (depth > 0 && i === Math.round(length * 0.45)) {
      const side = rand() < 0.5 ? -1 : 1;
      const twig = a + side * (0.55 + rand() * 0.3);
      branch(s, px, py, twig, length * 0.5, w, -side * 0.08, rand, depth - 1, tips);
    }
  }
  tips.push({ x: Math.round(px), y: Math.round(py) });
}

/**
 * A dead spooky tree: a gnarled trunk splitting into long bare branches that curl over at their
 * tips, a knot-hole, and a few last leaves hanging on at the ends of its twigs. Spooky-cute, not
 * sinister: its boughs curl like a fiddlehead, not a claw.
 */
function drawDeadTree(): SpriteSource {
  const s = new Sketch(W, H);
  trunk(s, 64, 18, 'w', -2);
  const rand = seeded(61);
  const tips: { x: number; y: number }[] = [];
  for (const [angle, length, curl] of [
    [-2.65, 40, 0.05],
    [-2.05, 46, -0.06],
    [-1.5, 50, 0.05],
    [-0.95, 44, -0.06],
    [-0.45, 38, 0.06],
  ] as const) {
    branch(s, 47, 67, angle, length, 7, curl, rand, 1, tips);
  }
  // Two roots over the grass.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const x = FOOT.x + side * (10 + i) - (side < 0 ? 1 : 0);
      s.rect(x, FOOT.y - 1 + (i >> 2), 2, 2 - (i >> 2), 'w');
    }
  }
  s.bevel('w', 'W', 'v');
  for (const [dx, from, to] of [
    [-3, 70, 106],
    [3, 78, 110],
  ] as const) {
    for (let y = from; y < to; y++) {
      if (y % 5 !== 0) s.set(FOOT.x + dx + Math.round(Math.sin(y / 6)), y, 'v');
    }
  }
  // The knot-hole, round and dark, a little way up.
  s.ellipse(FOOT.x + 2, 90, 3, 4, 'v').ellipse(FOOT.x + 2, 91, 2, 2.5, 'k');
  s.outline({ w: 'u', W: 'u', v: 'u', k: 'u' });
  // A few last leaves, hanging from the ends of the twigs, in the tree's own colour.
  tips.forEach((t, i) => {
    if (i % 2 === 1) return;
    s.rect(t.x - 1, t.y + 1, 3, 2, '3')
      .set(t.x, t.y + 3, '2')
      .set(t.x + 1, t.y + 2, '2')
      .set(t.x, t.y, 'u');
  });
  return s.toSource();
}

/**
 * A birch: two slim pale stems with dark marks across them, leaning a little, rising into a
 * narrow, airy crown of smaller clumps than the town's tree.
 */
function drawBirch(): SpriteSource {
  const s = new Sketch(W, H);
  const stem = (from: number, base: number, sway: number, lean: number) => {
    for (let y = from; y <= FOOT.y; y++) {
      const up = (FOOT.y - y) / (FOOT.y - from);
      const half = Math.max(1, Math.round(base - up * (base - 1.5)));
      const x = FOOT.x + Math.round(Math.sin(up * 2.4) * sway + up * lean);
      s.rect(x - half, y, half * 2, 1, 'i');
    }
  };
  stem(26, 4, 2, -3);
  stem(40, 3, 1.5, 9);
  s.bevel('i', 'I', 'j');
  const rand = seeded(97);
  for (let y = 30; y < FOOT.y - 2; y += 4 + Math.floor(rand() * 4)) {
    for (let x = 0; x < W; x++) {
      if (s.get(x, y) === CLEAR || rand() < 0.45) continue;
      s.set(x, y, 'J');
    }
  }
  const crown: Crown = { x: 48, y: 40, rx: 27, ry: 36 };
  const ownerAt = paintCrown(s, crown, clumpsOf(crown, 53, { count: 13, r: 7 }), 59, 46);
  shadeUnder(s, ownerAt, 5, ['i', 'I'], 'j');
  s.outline({ ...LEAF_OUTLINE, i: 'J', I: 'J', j: 'J' });
  return s.toSource();
}

/*
 * Three more for the woods' edges (1.1's A2, decision 351), so the trees round a place read as a
 * wood stepping in and out rather than a hedge of one round crown: a tall thin one, a leaning one
 * and an old broken one. Each is the tree's size, in its keys and lit as one mass by `paintCrown`,
 * so it takes every leaf colour and every season's swap as the others do.
 */

/**
 * A tall thin tree, a poplar: a narrow column of leafy clumps from a rounded point at the top,
 * widest a little below the middle, over a short trunk.
 */
function drawPoplar(): SpriteSource {
  const s = new Sketch(W, H);
  trunk(s, 86, 9);
  s.bevel('w', 'W', 'v');
  const crown: Crown = { x: 48, y: 50, rx: 21, ry: 45 };
  const rand = seeded(131);
  const clumps = [{ x: 47, y: 12, r: 7 }];
  for (let y = 20; y <= 84; y += 11) {
    const t = (y - 6) / 84;
    const half = 5 + 12 * Math.sin(Math.PI * Math.pow(t, 0.8));
    const r = 7 + half * 0.3 + rand() * 2;
    const side = (y / 11) % 2 < 1 ? -1 : 1;
    clumps.push({ x: 48 + side * half * 0.45, y: y + (rand() - 0.5) * 2, r });
    clumps.push({ x: 48 - side * half * 0.4, y: y + 5 + (rand() - 0.5) * 2, r: r - 1 });
  }
  clumps.sort((a, b) => a.y - b.y);
  const ownerAt = paintCrown(s, crown, clumps, 137, 34);
  shadeUnder(s, ownerAt, 6);
  s.outline({ ...LEAF_OUTLINE, w: 'u', W: 'u', v: 'u' });
  return s.toSource();
}

/**
 * A leaning tree: its trunk bowed over to the left from its foot, holding a lopsided crown out
 * over the grass, with one bough reaching back to the right under a little crown of its own.
 */
function drawLeaning(): SpriteSource {
  const s = new Sketch(W, H);
  const top = 50;
  const bowAt = (y: number) => -21 * ((FOOT.y - y) / (FOOT.y - top)) ** 1.6;
  for (let y = top; y <= FOOT.y; y++) {
    const up = (FOOT.y - y) / (FOOT.y - top);
    const flare = y > FOOT.y - 5 ? Math.round(((y - (FOOT.y - 5)) / 5) ** 2 * 3) : 0;
    const half = Math.round(6 - up * 2.5) + flare;
    s.rect(FOOT.x - half + Math.round(bowAt(y)), y, half * 2, 1, 'w');
  }
  // The bough back to the right, rising as it goes.
  for (let i = 0; i < 24; i++) {
    const x = FOOT.x - 6 + i;
    const y = 74 - Math.round(i * 0.55);
    s.rect(x, y, 2, i < 14 ? 3 : 2, 'w');
  }
  // Roots braced against the lean, longer on the right.
  for (const [side, length] of [
    [-1, 6],
    [1, 10],
  ] as const) {
    for (let i = 0; i < length; i++) {
      const x = FOOT.x + side * (8 + i);
      s.rect(side < 0 ? x - 1 : x, FOOT.y - 2 + Math.floor(i / 4), 2, 2 - Math.floor(i / 6), 'w');
    }
  }
  s.bevel('w', 'W', 'v');
  for (let y = 70; y < FOOT.y - 3; y++) {
    if (y % 6 !== 0) s.set(FOOT.x + 2 + Math.round(bowAt(y)), y, 'v');
  }
  const crown: Crown = { x: 33, y: 38, rx: 31, ry: 27 };
  const bough: Crown = { x: 70, y: 54, rx: 14, ry: 11 };
  const clumps = [
    ...clumpsOf(crown, 149, { count: 9, r: 10 }),
    ...clumpsOf(bough, 151, { count: 5, r: 5 }),
  ];
  const ownerAt = paintCrown(s, crown, clumps, 157, 40);
  shadeUnder(s, ownerAt, 6);
  s.outline({ ...LEAF_OUTLINE, w: 'u', W: 'u', v: 'u' });
  return s.toSource();
}

/**
 * An old broken tree: a stout trunk snapped off at the top in a jagged crown of pale heartwood
 * (`x`, which winter caps with snow), a round hollow, two little shelves of fungus, and one bough
 * still in leaf off its side. Old and gentle, never dead.
 */
function drawBroken(): SpriteSource {
  const s = new Sketch(W, H);
  const snap = 52;
  // The trunk, broad and barely tapering, up to the break.
  for (let y = snap; y <= FOOT.y; y++) {
    const up = (FOOT.y - y) / (FOOT.y - snap);
    const flare = y > FOOT.y - 6 ? Math.round(((y - (FOOT.y - 6)) / 6) ** 2 * 5) : 0;
    const half = Math.round(11 - up * 2) + flare;
    s.rect(FOOT.x - half, y, half * 2, 1, 'w');
  }
  // Splinters standing up round the back of the break, tallest on the left.
  for (const [x, w, h] of [
    [FOOT.x - 10, 5, 10],
    [FOOT.x - 5, 4, 5],
    [FOOT.x - 1, 5, 8],
    [FOOT.x + 4, 5, 4],
  ] as const) {
    for (let i = 0; i < h; i++) {
      const across = Math.max(1, Math.round(w * (1 - i / h)));
      s.rect(x, snap - i, across, 1, 'w');
    }
  }
  for (const [side, length] of [
    [-1, 10],
    [1, 8],
  ] as const) {
    for (let i = 0; i < length; i++) {
      const x = FOOT.x + side * (12 + i);
      s.rect(side < 0 ? x - 1 : x, FOOT.y - 2 + Math.floor(i / 4), 2, 2 - Math.floor(i / 5), 'w');
    }
  }
  // The living bough, out to the right and up.
  for (let i = 0; i < 26; i++) {
    const x = FOOT.x + 8 + i;
    const y = 70 - Math.round(i * 0.9);
    s.rect(x, y, 3, i < 12 ? 4 : 3, 'w');
  }
  s.bevel('w', 'W', 'v');
  // The break's face, seen from a little above: pale heartwood with a ring in it.
  s.ellipse(FOOT.x, snap + 2, 9, 3, 'x')
    .ellipse(FOOT.x + 1, snap + 2, 5.5, 2, 'X')
    .ellipse(FOOT.x + 1, snap + 2, 4.5, 1.2, 'x');
  for (const [dx, from, to] of [
    [-6, 60, 104],
    [5, 66, 110],
    [-1, 84, 112],
  ] as const) {
    for (let y = from; y < to; y++) if (y % 7 !== 0) s.set(FOOT.x + dx, y, 'v');
  }
  // The hollow, round and dark with a lit lip, a little way up.
  s.ellipse(FOOT.x - 2, 84, 5, 7, 'v').ellipse(FOOT.x - 2, 85, 4, 5.5, 'k');
  // Two shelves of fungus on the shaded side.
  for (const [x, y, w] of [
    [FOOT.x + 6, 94, 7],
    [FOOT.x + 4, 100, 5],
  ] as const) {
    s.rect(x + 1, y - 1, w - 3, 1, 'f')
      .rect(x, y, w, 1, 'f')
      .rect(x + 1, y + 1, w - 2, 1, 'F');
  }
  s.outline({ w: 'u', W: 'u', v: 'u', k: 'u', x: 'u', X: 'u', f: 'u', F: 'u' });
  const crown: Crown = { x: 72, y: 41, rx: 19, ry: 16 };
  paintCrown(s, crown, clumpsOf(crown, 163, { count: 8, r: 6 }), 173, 26);
  s.outline(LEAF_OUTLINE);
  return s.toSource();
}

/**
 * The conifer, the dead tree and the birch, after the town tree's three, then the woods' edge
 * trees: the poplar, the leaning tree and the broken one.
 */
export const MORE_TREE_FORMS: readonly SpriteSource[] = [
  drawConifer(),
  drawDeadTree(),
  drawBirch(),
  drawPoplar(),
  drawLeaning(),
  drawBroken(),
];
