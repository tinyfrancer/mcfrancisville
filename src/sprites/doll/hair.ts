import type { Facing, HairStyleId } from '../../types/ids';
import type { HairTones } from '../lookColours';
import { PALETTE as C, ramp } from '../palette';
import { CLEAR, Sketch } from '../sketch';
import type { Palette } from '../sprite';
import { DOLL_HEIGHT, DOLL_WIDTH, type Grid, type View, viewOf } from './body';
import { bodyId, finish, remember } from './paint';

/*
 * Her hair: each style a mask per view, groomed from its own shape (decision 152) and split down
 * the middle for split dye (decision 153).
 */

/**
 * Hair is drawn as a mask in `h`, its shine in `j`, and finished like any piece: shaded, lit and
 * outlined. `hairRows` then splits it into her left half and her right half, which is how split
 * dye works on every style. Every style leaves her eyes and cheeks clear.
 */
type HairStyle = Record<View, Grid>;

/**
 * Leaves the face showing under a fringe: an arch from `top` at the middle down to `sides` at
 * its edges, `across` either side of the middle, down to the chin.
 */
function showFace(s: Sketch, top: number, sides: number, across: number): void {
  for (let y = top; y <= 23; y++) {
    for (let x = 0; x < DOLL_WIDTH; x++) {
      const off = Math.abs(x + 0.5 - 16);
      if (off > across) continue;
      if (y >= top + off * ((sides - top) / across)) s.set(x, y, CLEAR);
    }
  }
}

/** From the side: the face shows in front of the hair from `from` across, below `top`. */
function showProfile(s: Sketch, from: number, top: number): void {
  for (let y = top; y <= 23; y++) for (let x = from; x < DOLL_WIDTH; x++) s.set(x, y, CLEAR);
}

/** The crown of every style: a round cap over her head. */
function crown(s: Sketch, side = false): Sketch {
  return side ? s.ellipse(14.5, 11.5, 11, 10.5, 'h') : s.ellipse(16, 11.5, 12, 10.5, 'h');
}

function style(draw: (view: View) => Sketch): HairStyle {
  return { front: draw('front').rows, back: draw('back').rows, side: draw('side').rows };
}

/** Her split bob: blunt at her jaw all round, parted down the middle (like Sia's). */
const SPLIT_BOB = style((view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'side') {
    crown(s, true).rect(3, 11, 16, 12, 'h');
    showProfile(s, 17, 9);
    return s;
  }
  crown(s).rect(4, 11, 24, 12, 'h');
  if (view === 'front') {
    showFace(s, 7, 12, 6);
  } else {
    s.rect(15, 1, 2, 7, 'H');
  }
  return s;
});

/** Long and straight, past her shoulders, with a soft fringe. */
const LONG = style((view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'side') {
    crown(s, true).rect(3, 11, 13, 17, 'h').ellipse(9, 28, 6, 3, 'h');
    showProfile(s, 17, 8);
    return s;
  }
  crown(s).rect(4, 11, 24, 12, 'h');
  if (view === 'front') {
    s.rect(4, 22, 6, 7, 'h').rect(22, 22, 6, 7, 'h');
    s.ellipse(7, 29, 3, 2, 'h').ellipse(25, 29, 3, 2, 'h');
    showFace(s, 8, 11, 7);
  } else {
    s.rect(4, 22, 24, 7, 'h').ellipse(16, 29, 12, 3, 'h');
  }
  return s;
});

/** A rounded bob with a straight fringe, curling in under her chin. */
const BOB = style((view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'side') {
    crown(s, true).rect(3, 11, 15, 9, 'h').ellipse(10, 20, 7, 2.5, 'h');
    showProfile(s, 17, 10);
    return s;
  }
  crown(s).rect(4, 11, 24, 9, 'h').ellipse(16, 20, 12, 2.5, 'h');
  if (view === 'front') {
    showFace(s, 10, 10, 7);
  }
  return s;
});

/** Two bunches, one each side, with a fringe. */
const BUNCHES = style((view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'side') {
    crown(s, true).rect(4, 11, 13, 6, 'h').ellipse(4, 18, 3.5, 6, 'h');
    s.rect(3, 11, 3, 2, 'x');
    showProfile(s, 17, 10);
    return s;
  }
  crown(s).rect(4, 11, 24, 5, 'h');
  s.ellipse(3.5, 18, 3.5, 6.5, 'h').ellipse(28.5, 18, 3.5, 6.5, 'h');
  s.rect(3, 10, 3, 2, 'x').rect(26, 10, 3, 2, 'x');
  if (view === 'front') {
    showFace(s, 9, 11, 7);
  }
  return s;
});

/** A pixie cut, swept to one side and short at the back. */
const PIXIE = style((view) => {
  const s = new Sketch(DOLL_WIDTH, DOLL_HEIGHT);
  if (view === 'side') {
    s.ellipse(15, 11, 10.5, 9.5, 'h').rect(6, 11, 10, 6, 'h');
    showProfile(s, 17, 8);
    return s;
  }
  s.ellipse(16, 11, 10.5, 9.5, 'h').rect(6, 11, 20, 5, 'h');
  if (view === 'front') {
    // The fringe sweeps down to her left.
    for (let x = 9; x <= 22; x++) {
      const top = Math.round(7 + (x - 9) * 0.25);
      for (let y = top; y <= 23; y++) if (x >= 9 && x <= 22) s.set(x, y, CLEAR);
    }
  } else {
    s.ellipse(16, 17, 9, 3, 'h');
  }
  return s;
});

export const HAIR: Record<HairStyleId, HairStyle> = {
  splitBob: SPLIT_BOB,
  long: LONG,
  bob: BOB,
  bunches: BUNCHES,
  pixie: PIXIE,
};

/**
 * Hair in her left and right halves' keys. From the front her left is on the viewer's right;
 * from behind it's on the left. From the side only the near half shows.
 */
export function hairRows(style: HairStyle, facing: Facing, body: Grid): readonly string[] {
  return remember(style, `${facing}:${bodyId(body)}`, () => drawHair(style, facing, body));
}

/**
 * Where a style's shine and strands go, worked out from its shape so they follow any style: a band
 * of light two rows in from the top of the hair on the side the light comes from, and strands
 * of shade fanning out from the parting down to the ends.
 */
function groom(drawn: Grid, view: View): (x: number, y: number) => 'shine' | 'strand' | null {
  const isHair = (x: number, y: number) => 'hjH'.includes(drawn[y]?.[x] ?? CLEAR);
  const depth = (x: number, y: number) => {
    let d = 0;
    while (isHair(x, y - d - 1)) d++;
    return d;
  };
  const cols = [...Array(DOLL_WIDTH).keys()].filter((x) => drawn.some((_, y) => isHair(x, y)));
  const left = Math.min(...cols);
  const right = Math.max(...cols);
  const part = view === 'side' ? left + (right - left) * 0.45 : 15.5;
  return (x, y) => {
    if (!isHair(x, y)) return null;
    const d = depth(x, y);
    // The shine: all along the lit side, and just a glint past the parting.
    const lit = view === 'side' ? x < right - 3 : x < 15 || (x > 17 && x < 21);
    if (lit && x > left && (d === 2 || (d === 3 && x < part - 3))) return 'shine';
    if (d < 5) return null;
    const dx = x + 0.5 - part;
    const dy = y + 0.5;
    const angle = Math.atan2(dx, dy);
    const spread = Math.round(angle * 3.2);
    const off = Math.abs(angle - spread / 3.2) * Math.hypot(dx, dy);
    // A strand now and then broken, so they read as locks rather than stripes.
    if (off < 0.5 && (spread + Math.floor(d / 4)) % 3 !== 0) return 'strand';
    return null;
  };
}

function drawHair(style: HairStyle, facing: Facing, body: Grid): string[] {
  const view = viewOf(facing);
  const mask = style[view].map((row) => row.replace(/[hjH]/g, 'm'));
  const groomed = groom(style[view], view);
  const finished = finish(mask, body, 'painted').map((row, y) =>
    [...row]
      .map((k, x) => {
        const drawn = style[view][y]![x]!;
        if (drawn === 'j' || drawn === 'H') return drawn;
        if (k === 'm') {
          const touch = groomed(x, y);
          return touch === 'shine' ? 'j' : touch === 'strand' ? 'H' : 'h';
        }
        return k === 'M' ? 'H' : k === 'L' ? 'j' : k === 'O' ? 'q' : k;
      })
      .join(''),
  );
  const leftHalf = (c: number): boolean => {
    if (facing === 'down') return c >= 16;
    if (facing === 'up') return c < 16;
    return facing === 'left';
  };
  const other: Record<string, string> = { h: 'g', H: 'G', j: 'J', q: 'Q' };
  return finished.map((line) =>
    [...line].map((ch, c) => (leftHalf(c) ? ch : (other[ch] ?? ch))).join(''),
  );
}

export function hairPalette(hair: HairTones): Palette {
  const left = ramp(hair.left.main);
  const right = ramp(hair.right.main);
  return {
    '.': null,
    q: left[0],
    H: left[1],
    h: hair.left.main,
    j: left[3],
    Q: right[0],
    G: right[1],
    g: hair.right.main,
    J: right[3],
    x: C.roseLight,
  };
}
