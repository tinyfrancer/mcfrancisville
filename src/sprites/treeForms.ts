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

/** The conifer, the dead tree and the birch, after the town tree's three. */
export const MORE_TREE_FORMS: readonly SpriteSource[] = [
  drawConifer(),
  drawDeadTree(),
  drawBirch(),
];
