import type { Feeling } from '../../types/mood';
import { FEELING_EYES, feelingBrows, feelingCheeks, feelingMouth, stitchMouth } from '../faces';
import type { Tone } from '../lookColours';
import { PALETTE as C, mix } from '../palette';
import { CLEAR, Sketch } from '../sketch';
import type { Palette } from '../sprite';
import { DOLL_HEIGHT, DOLL_WIDTH, EMPTY, type Grid, type View } from './body';
import { remember } from './paint';

/*
 * Her face, drawn by hand (decision 152): eyes, brows, cheeks and lips, how she feels (V1's L7),
 * freckles, a nose stud and her gauges.
 */

/**
 * How her face looks: as usual, down at her phone, eyes shut tight, or mouth open, rocking; and
 * for a moment, blinking (V1's E2); or how she feels about a line or a moment (V1's L7).
 */
export type Mood = 'open' | 'down' | 'shut' | 'rock' | 'wink' | 'blink' | Feeling;

function isFeeling(mood: Mood): mood is Feeling {
  return mood in FEELING_EYES;
}

/**
 * An eye four wide and round, her right one as the viewer sees it (the outer corner on the left):
 * a tall highlight, and her iris lightening toward the bottom. The other is mirrored.
 */
const EYE_OPEN: Grid = ['.EE.', 'EwEE', 'EweE', 'EeiE', '.EE.'];

const EYE_DOWN: Grid = ['....', '....', 'EEEE', 'EeeE', '.EE.'];

const EYE_SHUT: Grid = ['....', '....', '.EE.', 'E..E', '....'];

/** Her lid down for a blink: the curve of her lashes where the bottom of her eye was. */
const EYE_BLINK: Grid = ['....', '....', '....', 'EEEE', '.EE.'];

function mirrored(grid: Grid): Grid {
  return grid.map((row) => [...row].reverse().join(''));
}

/** What a face has beyond eyes, cheeks and a mouth. */
export interface FaceTouches {
  lashes?: boolean;
  freckles?: boolean;
  nosePiercing?: boolean;
  /** A stitched smile, whatever its shape (Scarah's, V1's L7). */
  stitched?: boolean;
}

/**
 * Eyes, cheeks and a mouth, low on the face, and freckles and a nose stud for whoever has them.
 * From the side only the near eye shows. `blink` shuts the eyes of a feeling for a moment and
 * leaves its brows and mouth (V1's L7).
 */
export function faceRows(
  view: Exclude<View, 'back'>,
  mood: Mood,
  look: FaceTouches,
  blink = false,
): readonly string[] {
  const key = [view, mood, look.lashes, look.freckles, look.nosePiercing, look.stitched, blink];
  return remember(EMPTY, `face:${key.join(':')}`, () => drawFace(view, mood, look, blink));
}

function drawFace(
  view: Exclude<View, 'back'>,
  mood: Mood,
  look: FaceTouches,
  blink = false,
): string[] {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const feeling = isFeeling(mood) ? mood : null;
  const felt = feeling ? FEELING_EYES[feeling] : null;
  const shutEyes = blink && feeling !== 'laugh';
  const eye = shutEyes
    ? EYE_BLINK
    : felt
      ? felt.rows
      : mood === 'down'
        ? EYE_DOWN
        : mood === 'shut'
          ? EYE_SHUT
          : mood === 'blink'
            ? EYE_BLINK
            : EYE_OPEN;
  const top = felt && !shutEyes ? felt.top : 14;
  const open =
    mood === 'open' ||
    mood === 'rock' ||
    mood === 'wink' ||
    (!shutEyes && (feeling === 'happy' || feeling === 'surprised' || feeling === 'cross'));
  const lashes = look.lashes === true && open;
  const lips = (x: number, wide: boolean) => {
    if (feeling) feelingMouth(s, view === 'front' ? 'front' : 'side', feeling);
    else if (mood === 'rock' || mood === 'shut') {
      s.rect(x, 20, wide ? 3 : 2, 2, 'U').rect(x, 21, wide ? 3 : 2, 1, 'u');
      if (wide) s.set(x + 1, 20, 'U');
    } else if (wide) {
      // Her lips: the parting line, and the fuller lower lip under it.
      s.rect(x, 20, 2, 1, 'U').rect(x, 21, 2, 1, 'u');
    } else s.set(x, 20, 'U').set(x, 21, 'u');
  };
  if (view === 'front') {
    s.stamp({ rows: eye }, 10, top);
    s.stamp({ rows: mood === 'wink' ? EYE_SHUT : mirrored(eye) }, 18, top);
    // Brows, where her fringe lets them show; a flick of lashes at each outer corner.
    if (feeling) feelingBrows(s, 'front', feeling);
    else s.rect(10, 12, 3, 1, 'b').rect(19, 12, 3, 1, 'b');
    if (mood === 'rock') s.set(12, 11, 'b').set(19, 11, 'b');
    if (lashes) s.set(9, top, 'E').set(9, top - 1, 'E');
    if (lashes && mood !== 'wink') s.set(22, top, 'E').set(22, top - 1, 'E');
    s.rect(8, 19, 3, 1, 'c').set(9, 20, 'c').rect(21, 19, 3, 1, 'c').set(22, 20, 'c');
    s.set(9, 19, 'C').set(22, 19, 'C');
    if (feeling) feelingCheeks(s, 'front', feeling);
    s.set(16, 18, 'n');
    lips(15, true);
    // Under a feeling's mouth, where one reaches them.
    if (look.freckles)
      for (const [x, y] of FRECKLES_FRONT) if (s.get(x, y) === CLEAR) s.set(x, y, 'r');
    if (look.nosePiercing) s.set(17, 19, 'x');
  } else {
    s.stamp({ rows: eye.map((row) => row.slice(0, 3)) }, 20, top);
    if (feeling) feelingBrows(s, 'side', feeling);
    else s.rect(20, 12, 3, 1, 'b');
    if (lashes) s.set(23, top, 'E').set(23, top - 1, 'E');
    s.rect(19, 19, 3, 1, 'c').set(20, 19, 'C');
    if (feeling) feelingCheeks(s, 'side', feeling);
    s.set(24, 18, 'n');
    lips(22, false);
    // Under a feeling's mouth, where one reaches them.
    if (look.freckles)
      for (const [x, y] of FRECKLES_SIDE) if (s.get(x, y) === CLEAR) s.set(x, y, 'r');
    if (look.nosePiercing) s.set(24, 19, 'x');
  }
  if (look.stitched) stitchMouth(s);
  return s.rows;
}

/** A dusting across the bridge of her nose and under her eyes. */
const FRECKLES_FRONT: readonly (readonly [number, number])[] = [
  [11, 20],
  [13, 19],
  [14, 20],
  [18, 20],
  [19, 19],
  [21, 20],
];

const FRECKLES_SIDE: readonly (readonly [number, number])[] = [
  [18, 19],
  [19, 20],
  [22, 19],
];

/** A little heart through each earlobe (personal_touches.md): her gauges, over any hair. */
export function gaugeRows(view: Exclude<View, 'back'>): readonly string[] {
  return remember(EMPTY, `gauges:${view}`, () => drawGauges(view));
}

function drawGauges(view: Exclude<View, 'back'>): string[] {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  const heart = { rows: ['k.k', 'kKk', '.k.'] };
  if (view === 'front') s.stamp(heart, 6, 20).stamp(heart, 23, 20);
  else s.stamp(heart, 11, 20);
  return s.rows;
}

export function facePalette(iris: string, skin: Tone): Palette {
  return {
    '.': null,
    E: C.ink,
    w: C.white,
    e: iris,
    i: mix(iris, C.white, 0.45),
    b: mix(skin.shade, C.barkDark, 0.6),
    n: skin.shade,
    c: mix(skin.main, C.cheek, 0.7),
    C: mix(skin.main, C.cheek, 0.45),
    u: C.berryLight,
    U: C.berry,
    m: mix(C.berry, C.ink, 0.55),
    r: mix(skin.shade, C.barkDark, 0.35),
    x: C.silver,
  };
}
