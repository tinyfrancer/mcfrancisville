import type { PatchId } from '../types/ids';
import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * What grows and lies about outdoors, drawn at 32 pixels a tile (phase F): trees, the big willow,
 * rocks and wildflower patches. Each is a grid of keys and a palette (decision 2); a tree's
 * leaves recolour by palette, so a wood of one grid is several trees.
 */

/**
 * Keys for a ramp's five tones, darkest first; `_` skips a tone. `tones('oLlh_', leaf)` makes `o`
 * the outline, `L` the shade, `l` the fill and `h` the highlight.
 */
function tones(keys: string, base: string): Record<string, string> {
  const colours = ramp(base);
  const palette: Record<string, string> = {};
  [...keys].forEach((key, i) => {
    if (key !== '_') palette[key] = colours[i]!;
  });
  return palette;
}

// ---- Trees ------------------------------------------------------------------------------------

/**
 * A tree three tiles wide and nearly four tall on a trunk a tile wide: a twisty trunk with its
 * roots, a knot hole, and a soft round canopy of three puffs, dithered between five tones of `0`–`4`
 * with a `5` for the brightest leaves.
 */
function drawTree(): SpriteSource {
  const s = new Sketch(96, 120);
  for (let y = 62; y < 112; y++) {
    const lean = Math.round(Math.sin((y - 62) / 11) * 3);
    s.rect(42 + lean, y, 12, 1, 'w');
  }
  s.ellipse(48, 114, 14, 4, 'w').rect(36, 110, 24, 4, 'w');
  s.bevel('w', 'W', 'v');
  s.ellipse(47, 76, 2.5, 3.5, 'x');
  s.sphere(27, 50, 23, 19, '01234', { dither: true });
  s.sphere(69, 50, 23, 19, '01234', { dither: true });
  s.sphere(48, 33, 31, 28, '012345', { dither: true });
  s.outline({ 0: 'o', 1: 'o', 2: 'o', 3: 'o', 4: 'o', 5: 'o', w: 'u', W: 'u', v: 'u', x: 'u' });
  return s.toSource();
}

export const TREE: SpriteSource = drawTree();

function leaves(base: string, light: string): Palette {
  const dark = ramp(base);
  return {
    [CLEAR]: null,
    o: dark[0],
    0: dark[1],
    1: mix(dark[1], base, 0.5),
    2: base,
    3: light,
    4: ramp(light)[3],
    5: ramp(light)[4],
    ...tones('uvwW_', C.bark),
    x: C.ink,
  };
}

/**
 * The town's trees in three leaf colours, chosen by where each stands: the usual teal-green, a
 * pumpkin-orange autumn one and a dusky plum one, since it is always October here.
 */
export const TREE_LEAVES: readonly Palette[] = [
  leaves(C.canopy, C.canopyLight),
  leaves(mix(C.pumpkinShade, C.canopyDark, 0.3), mix(C.pumpkin, C.canopyLight, 0.25)),
  leaves(C.plum, C.plumLight),
];

// ---- The willow -------------------------------------------------------------------------------

/**
 * The big willow (personal_touches.md, "After phase E"): five tiles wide on a trunk two tiles
 * across, a dome of leaves with long strands hanging from it nearly to the grass, parted in the
 * middle so its trunk shows.
 */
function drawWillow(): SpriteSource {
  const W = 168;
  const H = 168;
  const s = new Sketch(W, H);
  const mid = W / 2;
  // The trunk, flaring into its roots.
  for (let y = 70; y < 160; y++) {
    const flare = y > 138 ? Math.round(((y - 138) / 22) ** 2 * 16) : 0;
    const lean = Math.round(Math.sin((y - 70) / 17) * 2);
    s.rect(mid - 12 - flare + lean, y, 24 + flare * 2, 1, 'w');
  }
  s.ellipse(mid, 161, 30, 4, 'w');
  s.bevel('w', 'W', 'v');
  for (const [x, y] of [
    [mid - 4, 100],
    [mid + 3, 122],
    [mid - 6, 140],
  ] as const) {
    s.rect(x, y, 1, 7, 'v').set(x + 1, y + 2, 'v');
  }
  // A lumpy dome of leaves, then fronds hanging over it and down nearly to the grass, longest at
  // the sides and parted in the middle, each swaying out a little as it falls.
  s.sphere(mid - 42, 58, 38, 28, '01234', { dither: true });
  s.sphere(mid + 42, 58, 38, 28, '01234', { dither: true });
  s.sphere(mid, 42, 62, 36, '012345', { dither: true });
  for (let i = 0; i < 30; i++) {
    const x0 = 12 + i * 5 + ((i * 7) % 3);
    const side = (x0 - mid) / mid;
    const top = Math.round(46 + Math.abs(side) * 18 + ((i * 5) % 7));
    const length =
      Math.abs(side) < 0.2 ? 30 + ((i * 3) % 9) : 62 + Math.abs(side) * 40 + ((i * 13) % 17);
    const bottom = Math.min(H - 8, top + Math.round(length));
    const tone = side < -0.3 ? '3' : side > 0.3 ? '1' : '2';
    const alt = i % 3 === 0 ? (tone === '1' ? '2' : tone === '3' ? '4' : '3') : tone;
    for (let y = top; y < bottom; y++) {
      const sway = Math.round(side * ((y - top) / 18));
      const x = x0 + sway;
      const key = y > bottom - 3 ? '4' : (y >> 2) % 2 === 0 ? tone : alt;
      s.rect(x, y, 3, 1, key);
      if ((y + i) % 6 === 0) s.set(x - 1, y, key);
      if ((y + i) % 6 === 3) s.set(x + 3, y, key);
    }
  }
  s.outline({ 0: 'o', 1: 'o', 2: 'o', 3: 'o', 4: 'o', 5: 'o', w: 'u', W: 'u', v: 'u' });
  return s.toSource();
}

export const WILLOW: SpriteSource = drawWillow();

export const WILLOW_PALETTE: Palette = leaves(C.leaf, C.leafLight);

// ---- Rocks ------------------------------------------------------------------------------------

/** A boulder sitting on the grass, lit from the top left, with a crack and a tuft at its foot. */
function drawRock(): SpriteSource {
  const s = new Sketch(32, 32);
  s.sphere(15, 18, 13, 12, 'kaaAL');
  s.sphere(16, 22, 14, 8, 'kaaAL');
  s.sphere(25, 24, 6, 5, 'kaAL');
  s.line(11, 11, 13, 16, 'k').line(13, 16, 12, 19, 'k');
  s.outline({ k: 'o', a: 'o', A: 'o', L: 'o' });
  s.set(4, 29, 'g').set(5, 28, 'G').set(6, 29, 'g').set(27, 30, 'g').set(28, 29, 'G');
  return s.toSource();
}

/** A rock once it's been chipped for the day: a few pebbles, whole again tomorrow. */
function drawPebbles(): SpriteSource {
  const s = new Sketch(32, 32);
  s.sphere(11, 25, 4, 3, 'kaAL').sphere(19, 27, 3, 2.5, 'kaAL').sphere(22, 23, 2.5, 2, 'kaA');
  s.outline({ k: 'o', a: 'o', A: 'o', L: 'o' });
  return s.toSource();
}

export const ROCK: SpriteSource = drawRock();
export const PEBBLES: SpriteSource = drawPebbles();

export const ROCK_PALETTE: Palette = {
  [CLEAR]: null,
  ...tones('okaAL', C.stone),
  g: C.moss,
  G: C.mossLight,
};

// ---- Wildflower patches -----------------------------------------------------------------------

/** Where each bloom sits in a patch: its centre, and whether it's a big one. */
const BLOOM_AT: readonly (readonly [number, number, boolean])[] = [
  [6, 6, true],
  [17, 4, false],
  [26, 9, true],
  [12, 14, true],
  [22, 19, false],
  [4, 20, false],
  [28, 23, true],
  [14, 26, true],
  [6, 29, false],
];

/**
 * A patch of wildflowers lying flat on the grass: leaves, and a scatter of five-petalled blooms
 * (`f`, lit `F`, shaded `s`) round a candle-yellow middle.
 */
function drawBlooms(): SpriteSource {
  const s = new Sketch(32, 32);
  for (const [x, y] of BLOOM_AT) {
    s.line(x - 1, y + 2, x - 4, y + 3, 'e').line(x + 1, y + 2, x + 3, y + 4, 'E');
    s.set(x - 3, y + 2, 'e').set(x + 3, y + 3, 'E');
  }
  for (const [x, y, big] of BLOOM_AT) {
    if (big) {
      s.rect(x - 1, y - 2, 3, 5, 'f').rect(x - 2, y - 1, 5, 3, 'f');
      s.set(x - 1, y - 2, 'F')
        .set(x - 2, y - 1, 'F')
        .set(x - 1, y - 1, 'F');
      s.set(x + 1, y + 2, 's').set(x + 2, y + 1, 's');
    } else {
      s.rect(x, y - 1, 1, 3, 'f')
        .rect(x - 1, y, 3, 1, 'f')
        .set(x - 1, y, 'F');
    }
    s.set(x, y, 'c');
  }
  return s.toSource();
}

/** A patch once it's been picked: a few green shoots, in bloom again tomorrow. */
function drawShoots(): SpriteSource {
  const s = new Sketch(32, 32);
  for (const [x, y] of BLOOM_AT)
    s.set(x - 1, y, 'e')
      .set(x + 1, y, 'e')
      .set(x, y + 1, 'e');
  return s.toSource();
}

export const BLOOMS: SpriteSource = drawBlooms();
export const SHOOTS: SpriteSource = drawShoots();
export const SHOOTS_PALETTE: Palette = { [CLEAR]: null, e: C.mossLight };

export interface PatchArt {
  source: SpriteSource;
  palette: Palette;
  /** Blooms that glow after dark, as moonpetals do. */
  glows?: true;
}

function blooms(petal: string, glows?: true): PatchArt {
  const art: PatchArt = {
    source: BLOOMS,
    palette: {
      [CLEAR]: null,
      f: petal,
      F: ramp(petal)[4],
      s: ramp(petal)[1],
      c: C.candle,
      e: C.mossLight,
      E: C.leafLight,
    },
  };
  if (glows) art.glows = true;
  return art;
}

export const PATCH_ART: Record<PatchId, PatchArt> = {
  moonpetals: blooms(C.lavender, true),
  forgetMeBoos: blooms(C.sky),
  ghostDaisies: blooms(C.white),
};
