import type { Feeling } from '../types/mood';
import type { Sketch } from './sketch';

/*
 * How a face feels (V1's L7, decision 296), drawn into the doll's face where its eyes, brows,
 * cheeks and lips are (`drawFace` in `doll.ts`): eyes 4 wide at rows 14–18 (10 and 18 across from
 * the front, 20 from the side), brows at row 12, a blush at 19–20, lips at 15–16 on rows 20–21
 * (22 from the side). Tomodachi Life's rule (docs/art_style.md): a mood at a glance from big eyes,
 * small mouths and blush, every one a face you'd wave at.
 */

type Grid = readonly string[];
type FaceView = 'front' | 'side';

/**
 * Her right eye as the viewer sees it, outer corner on the left, for each feeling (mirrored for
 * the other, and its first three columns from the side), and the row its top sits on.
 */
export const FEELING_EYES: Record<Feeling, { rows: Grid; top: number }> = {
  // The lower lid pushed up by a smile.
  happy: { rows: ['.EE.', 'EwEE', 'EeiE', 'E..E', '....'], top: 14 },
  // Shut in two little arcs.
  laugh: { rows: ['....', '.EE.', 'E..E', '....', '....'], top: 14 },
  // Wide open, a row taller.
  surprised: { rows: ['.EE.', 'EwwE', 'EweE', 'EeeE', 'EeiE', '.EE.'], top: 13 },
  // Drooping at the outer corner.
  sad: { rows: ['....', '.EEE', 'EweE', 'EeiE', '.EE.'], top: 14 },
  // Looking down.
  shy: { rows: ['....', '....', 'EEEE', 'EeeE', '.EE.'], top: 14 },
  // The lid low at the inner corner: a glare, but a soft one.
  cross: { rows: ['....', 'EE..', 'EwEE', 'EeiE', '.EE.'], top: 14 },
};

/** Her brows as pixels from the front, the viewer's left one; the other is mirrored round 15.5. */
const BROWS: Record<Feeling, readonly (readonly [number, number])[]> = {
  happy: [
    [10, 12],
    [11, 12],
    [12, 12],
  ],
  laugh: [
    [10, 12],
    [11, 11],
    [12, 11],
  ],
  surprised: [
    [10, 11],
    [11, 11],
    [12, 11],
  ],
  // The inner end raised.
  sad: [
    [10, 12],
    [11, 12],
    [12, 11],
  ],
  shy: [
    [10, 12],
    [11, 12],
    [12, 12],
  ],
  // The inner end lowered, toward her nose.
  cross: [
    [10, 12],
    [11, 12],
    [12, 13],
  ],
};

/** Brows for a feeling. From the side, the near brow's inner end is toward her nose (x 22). */
export function feelingBrows(s: Sketch, view: FaceView, feeling: Feeling): void {
  for (const [x, y] of BROWS[feeling]) {
    if (view === 'front') s.set(x, y, 'b').set(31 - x, y, 'b');
    else s.set(x + 10, y, 'b');
  }
}

/** A deeper blush for a smile, a laugh and bashfulness, over the usual one. */
export function feelingCheeks(s: Sketch, view: FaceView, feeling: Feeling): void {
  if (feeling === 'shy') {
    if (view === 'front') {
      s.rect(7, 19, 5, 2, 'c').rect(8, 19, 3, 1, 'C');
      s.rect(20, 19, 5, 2, 'c').rect(21, 19, 3, 1, 'C');
    } else s.rect(18, 19, 5, 2, 'c').rect(19, 19, 3, 1, 'C');
    return;
  }
  if (feeling !== 'happy' && feeling !== 'laugh') return;
  if (view === 'front') s.set(8, 20, 'c').set(10, 20, 'c').set(21, 20, 'c').set(23, 20, 'c');
  else s.set(19, 20, 'c').set(21, 20, 'c');
}

/**
 * Each feeling's mouth, in lip keys (`U` its line, `u` the lower lip, `m` inside an open mouth),
 * from the front (centred on 15.5) and from the side (from 21, her lips' column the second).
 */
const MOUTHS: Record<Feeling, Record<FaceView, Grid>> = {
  happy: {
    front: ['U..U', '.UU.'],
    side: ['.U', 'U.'],
  },
  laugh: {
    front: ['UUUU', 'UmmU', '.uu.'],
    side: ['UU', 'mU', 'u.'],
  },
  surprised: {
    front: ['.UU.', 'UmmU', '.UU.'],
    side: ['U.', 'mU', 'U.'],
  },
  sad: {
    front: ['.UU.', 'U..U'],
    side: ['U.', '.U'],
  },
  shy: {
    front: ['....', '.UU.'],
    side: ['..', 'U.'],
  },
  cross: {
    front: ['...U', 'UUU.'],
    side: ['.U', 'UU'],
  },
};

/** A feeling's mouth, where her lips are: its grid's top left at (14, 20), or (21, 20) side on. */
export function feelingMouth(s: Sketch, view: FaceView, feeling: Feeling): void {
  s.stamp({ rows: MOUTHS[feeling][view] }, view === 'front' ? 14 : 21, 20);
}

/**
 * A stitched smile (Scarah's, 0.3's F3): a stitch across the line of her mouth at each end, in
 * her brows' thread, whatever shape it's in.
 */
export function stitchMouth(s: Sketch): void {
  const cols: number[] = [];
  for (let y = 20; y <= 22; y++) {
    for (let x = 10; x < 26; x++) if (s.get(x, y) === 'U') cols.push(x);
  }
  if (cols.length === 0) return;
  for (const x of [Math.min(...cols) - 1, Math.max(...cols) + 1]) {
    let row = 20;
    for (let y = 20; y <= 22; y++) if (s.get(x - 1, y) === 'U' || s.get(x + 1, y) === 'U') row = y;
    s.set(x, row - 1, 'b').set(x, row + 1, 'b');
  }
}
