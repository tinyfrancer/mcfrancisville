import { Sketch } from '../sketch';
import type { Measure, Parts, View } from './body';

/*
 * The stout build (1.1's A5a, decision 354): broad in the shoulders and round in the middle, a
 * thick neck, thick arms and sturdy legs, in her 32×48 on the same rows as hers, so the head,
 * face, hair and hats are hers and every cut paints onto it as onto her. Each part is hers drawn
 * wider: the torso two pixels out each side, the arms a pixel thicker and hung out past it.
 */

/** How much wider than hers the stout body is each side, at the shoulders. */
export const STOUT_SPREAD = 2;

function trunk(s: Sketch, view: View): void {
  s.rect(13, 24, 6, 1, 'n');
  if (view === 'side') {
    // Facing right: a broad back, and a tummy a pixel out in front under the chest.
    s.rect(11, 25, 10, 1, 'b').rect(10, 26, 12, 3, 'b').rect(10, 29, 13, 5, 'b');
    s.rect(10, 34, 12, 3, 'p');
  } else {
    s.rect(10, 25, 12, 1, 'b').rect(8, 26, 16, 8, 'b').rect(9, 34, 14, 3, 'p');
  }
}

/** Legs a pixel thicker than hers on the outside, one foot lifted mid-step. */
function frontLegs(s: Sketch, lift: -1 | 0 | 1): void {
  const legs: [number, number, boolean][] = [
    [9, 8, lift === -1],
    [17, 17, lift === 1],
  ];
  for (const [x, footX, lifted] of legs) {
    const up = lifted ? 2 : 0;
    s.rect(x, 37, 6, 8 - up, 'l').rect(footX, 45 - up, 7, 2, 'f');
  }
}

function sideLegs(s: Sketch, stride: boolean): void {
  if (!stride) {
    s.rect(12, 37, 7, 8, 'l').rect(12, 45, 9, 2, 'f');
    return;
  }
  for (let y = 37; y < 45; y++) {
    const d = Math.round((y - 37) * 0.5);
    s.rect(10 - d, y, 6, 1, 'l').rect(16 + d, y, 6, 1, 'l');
  }
  s.rect(6, 45, 8, 2, 'f').rect(20, 45, 8, 2, 'f');
}

/** One upper arm, five wide from a rounded shoulder, `side` -1 for the viewer's left. */
function upperArm(s: Sketch, side: -1 | 1): void {
  if (side === -1) s.rect(4, 26, 4, 1, 'a').rect(3, 27, 5, 2, 'a');
  else s.rect(24, 26, 4, 1, 'a').rect(24, 27, 5, 2, 'a');
}

/** One forearm hanging below it: thick to the elbow, four wide at the wrist, a big hand. */
function hangingForearm(s: Sketch, side: -1 | 1): void {
  const at = (x: number) => (side === -1 ? x : 31 - x);
  const run = (from: number, to: number, y: number, h: number, key: string) =>
    s.rect(Math.min(at(from), at(to)), y, Math.abs(to - from) + 1, h, key);
  run(3, 7, 29, 2, 'e');
  run(4, 7, 31, 3, 'w');
  run(3, 7, 34, 2, 'A');
  run(4, 7, 36, 1, 'A');
}

/** The near arm from the side, four wide, over the torso. */
function sideArm(s: Sketch, swing: number): void {
  const keys = 'aaaeewwwAAA';
  [...keys].forEach((key, i) => s.rect(13 + Math.round((swing * i) / 10), 26 + i, 4, 1, key));
}

/**
 * A limb four pixels thick from one point to another: four across where it runs up and down, the
 * extra pixel on the outside of the arm (away from the middle of the body), and four deep where it
 * runs across, the extra pixel underneath.
 */
function limb(
  s: Sketch,
  from: readonly [number, number],
  to: readonly [number, number],
  keys: string,
): void {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  const across = Math.abs(dx) > Math.abs(dy);
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(from[0] + dx * t);
    const y = Math.round(from[1] + dy * t);
    const key = keys[Math.min(keys.length - 1, Math.floor(t * keys.length))]!;
    if (across) s.rect(x - 1, y - 1, 3, 4, key);
    else s.rect(x < 16 ? x - 2 : x - 1, y - 1, 4, 3, key);
  }
}

export const STOUT_PARTS: Parts = {
  trunk,
  frontLegs,
  sideLegs,
  upperArm,
  hangingForearm,
  sideArm,
  limb,
};

export const STOUT_MEASURE: Measure = {
  left: 8,
  right: 23,
  back: 10,
  front: 21,
  hips: [9, 22],
  neck: [13, 18],
  legs: [
    [9, 14],
    [17, 22],
  ],
  spread: STOUT_SPREAD,
};

/**
 * Where a point of an arm drawn for her lands on the stout body: from the front and behind, out
 * past the broader shoulders on its own side, but never so far that the thicker arm loses its
 * outline at the edge of the picture; from the side, where it was.
 */
export function stoutReach(p: readonly [number, number], view: View): readonly [number, number] {
  if (view === 'side') return p;
  const [x, y] = p;
  return [x < 16 ? Math.max(3, x - STOUT_SPREAD) : Math.min(28, x + STOUT_SPREAD), y];
}
