import { Sketch } from '../sketch';
import type { Measure, Parts, View } from './body';

/*
 * The slight build (1.1's A5b, decision 355): narrow in the shoulders and hips, a thin neck, and
 * arms and legs a pixel thinner than hers, in her 32×48 on the same rows as hers, so the head,
 * face, hair and hats are hers and every cut paints onto it as onto her. Each part is hers drawn
 * narrower: the torso a pixel in each side, the arms a pixel thinner and hung in with it.
 */

/** How much narrower than hers the slight body is each side, at the shoulders. */
export const SLIGHT_SPREAD = -1;

function trunk(s: Sketch, view: View): void {
  s.rect(15, 24, 2, 1, 'n');
  if (view === 'side') {
    // Facing right: a flat back and front, two pixels shallower than hers.
    s.rect(13, 25, 6, 1, 'b').rect(12, 26, 8, 8, 'b').rect(12, 34, 8, 3, 'p');
  } else {
    s.rect(12, 25, 8, 1, 'b').rect(11, 26, 10, 8, 'b').rect(11, 34, 10, 3, 'p');
  }
}

/** Legs a pixel thinner than hers on the inside, one foot lifted mid-step. */
function frontLegs(s: Sketch, lift: -1 | 0 | 1): void {
  const legs: [number, number, boolean][] = [
    [11, 10, lift === -1],
    [17, 17, lift === 1],
  ];
  for (const [x, footX, lifted] of legs) {
    const up = lifted ? 2 : 0;
    s.rect(x, 37, 4, 8 - up, 'l').rect(footX, 45 - up, 5, 2, 'f');
  }
}

function sideLegs(s: Sketch, stride: boolean): void {
  if (!stride) {
    s.rect(14, 37, 5, 8, 'l').rect(14, 45, 7, 2, 'f');
    return;
  }
  for (let y = 37; y < 45; y++) {
    const d = Math.round((y - 37) * 0.5);
    s.rect(12 - d, y, 4, 1, 'l').rect(16 + d, y, 4, 1, 'l');
  }
  s.rect(8, 45, 6, 2, 'f').rect(20, 45, 6, 2, 'f');
}

/** One upper arm, three wide from a rounded shoulder, `side` -1 for the viewer's left. */
function upperArm(s: Sketch, side: -1 | 1): void {
  if (side === -1) s.rect(9, 26, 2, 1, 'a').rect(8, 27, 3, 2, 'a');
  else s.rect(21, 26, 2, 1, 'a').rect(21, 27, 3, 2, 'a');
}

/** One forearm hanging below it: three wide to the elbow, two at the wrist, a small hand. */
function hangingForearm(s: Sketch, side: -1 | 1): void {
  const at = (x: number) => (side === -1 ? x : 31 - x);
  const run = (from: number, to: number, y: number, h: number, key: string) =>
    s.rect(Math.min(at(from), at(to)), y, Math.abs(to - from) + 1, h, key);
  run(8, 10, 29, 2, 'e');
  run(9, 10, 31, 3, 'w');
  run(8, 10, 34, 2, 'A');
  run(9, 10, 36, 1, 'A');
}

/** The near arm from the side, two wide, over the torso, and a hand three wide. */
function sideArm(s: Sketch, swing: number): void {
  const keys = 'aaaeewwwAAA';
  [...keys].forEach((key, i) => {
    const x = 15 + Math.round((swing * i) / 10);
    s.rect(key === 'A' ? x - 1 : x, 26 + i, key === 'A' ? 3 : 2, 1, key);
  });
}

/**
 * A limb two pixels thick from one point to another: two across where it runs up and down, the
 * pixel on the inside of the arm (toward the middle of the body) left off, and two deep where it
 * runs across, the pixel underneath left off, so it mirrors as hers does.
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
    if (across) s.rect(x - 1, y - 1, 3, 2, key);
    else s.rect(x < 16 ? x - 1 : x, y - 1, 2, 3, key);
  }
}

export const SLIGHT_PARTS: Parts = {
  trunk,
  frontLegs,
  sideLegs,
  upperArm,
  hangingForearm,
  sideArm,
  limb,
};

export const SLIGHT_MEASURE: Measure = {
  left: 11,
  right: 20,
  back: 12,
  front: 19,
  hips: [11, 20],
  neck: [15, 16],
  legs: [
    [11, 14],
    [17, 20],
  ],
  spread: SLIGHT_SPREAD,
};

/**
 * Where a point of an arm drawn for her lands on the slight body: from the front and behind, in a
 * pixel with the narrower shoulders on its own side; from the side, where it was.
 */
export function slightReach(p: readonly [number, number], view: View): readonly [number, number] {
  if (view === 'side') return p;
  const [x, y] = p;
  return [x < 16 ? x - SLIGHT_SPREAD : x + SLIGHT_SPREAD, y];
}
