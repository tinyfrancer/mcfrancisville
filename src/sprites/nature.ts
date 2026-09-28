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

/** A small seeded random, so a drawing comes out the same every time. */
function seeded(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** A 4×4 ordered-dither threshold, as `Sketch.sphere` uses. */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);

/** One round clump of leaves in a canopy. */
interface Clump {
  x: number;
  y: number;
  r: number;
}

/** What makes one tree's shape: its crown, and how its trunk stands under it. */
interface TreeForm {
  seed: number;
  /** The crown's centre and half-width and half-height, in the sprite's pixels. */
  crown: { x: number; y: number; rx: number; ry: number };
  /** How far the trunk leans over its height, in pixels, + to the right. */
  lean: number;
  /** A tuft of leaves on top, for a taller tree. */
  tuft?: true;
}

const TREE_W = 96;
const TREE_H = 120;
/** Where the trunk meets the grass: the sprite's bottom, on the tile's centre. */
const TREE_FOOT = { x: 48, y: 116 };

/**
 * The clumps a crown is built from: a ring of them round its edge, which makes the scalloped
 * silhouette, and a few big ones inside to fill it. Lower clumps are drawn later, so each one
 * overlaps the one above it, the way leaves hang.
 */
function clumpsOf(form: TreeForm): Clump[] {
  const rand = seeded(form.seed);
  const { crown } = form;
  const inner: Clump[] = [
    { x: crown.x - crown.rx * 0.28, y: crown.y - crown.ry * 0.25, r: crown.ry * 0.62 },
    { x: crown.x + crown.rx * 0.28, y: crown.y - crown.ry * 0.2, r: crown.ry * 0.62 },
    { x: crown.x, y: crown.y + crown.ry * 0.15, r: crown.ry * 0.66 },
  ];
  const ring: Clump[] = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand() * 0.35;
    const r = 13 + rand() * 5;
    ring.push({
      x: crown.x + Math.cos(angle) * (crown.rx - r * 0.8),
      y: crown.y + Math.sin(angle) * (crown.ry - r * 0.8),
      r,
    });
  }
  if (form.tuft) ring.push({ x: crown.x - 3, y: crown.y - crown.ry - 1, r: 12 });
  ring.sort((a, b) => a.y - b.y);
  return [...inner, ...ring];
}

/** Whether a pixel is inside a clump, whose edge is scalloped into leafy lobes. */
function inClump(c: Clump, x: number, y: number, lobes: number): boolean {
  const dx = x + 0.5 - c.x;
  const dy = y + 0.5 - c.y;
  const angle = Math.atan2(dy, dx);
  const edge = c.r * (1 + 0.07 * Math.cos(angle * lobes + c.x));
  return dx * dx + dy * dy <= edge * edge;
}

/**
 * A tree three tiles wide and nearly four tall (`docs/art_style.md`): a trunk that tapers up from
 * its roots and forks into the leaves, under a round crown of leafy clumps. The leaves are five
 * flat tones `0`–`4` (`5` for the brightest flecks), lit from the top left across the whole crown,
 * with shade tucked under each clump that hangs over another; the bark is `u`–`W`.
 */
function drawTree(form: TreeForm): SpriteSource {
  const s = new Sketch(TREE_W, TREE_H);
  const rand = seeded(form.seed * 7 + 3);
  const { crown } = form;
  const trunkTop = Math.round(crown.y + crown.ry * 0.3);
  const leanAt = (y: number) =>
    Math.round(form.lean * Math.sin(((TREE_FOOT.y - y) / (TREE_FOOT.y - trunkTop)) * 1.4));

  // The trunk: tapering up from a gentle flare at the foot.
  for (let y = trunkTop; y <= TREE_FOOT.y; y++) {
    const up = (TREE_FOOT.y - y) / (TREE_FOOT.y - trunkTop);
    const flare = y > TREE_FOOT.y - 6 ? Math.round(((y - (TREE_FOOT.y - 6)) / 6) ** 2 * 4) : 0;
    const half = Math.round(8 - up * 3) + flare;
    s.rect(TREE_FOOT.x - half + leanAt(y), y, half * 2, 1, 'w');
  }
  // Roots creeping out over the grass either side.
  for (const [side, length] of [
    [-1, 9],
    [1, 7],
  ] as const) {
    for (let i = 0; i < length; i++) {
      const x = TREE_FOOT.x + side * (10 + i);
      s.rect(
        side < 0 ? x - 1 : x,
        TREE_FOOT.y - 2 + Math.floor(i / 4),
        2,
        2 - Math.floor(i / 5),
        'w',
      );
    }
  }
  // Two branches forking up into the leaves.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 18; i++) {
      const y = trunkTop - i;
      const x = TREE_FOOT.x + leanAt(trunkTop) + side * (1 + Math.round(i * 0.8));
      s.rect(x - 2, y, 5 - Math.floor(i / 7), 1, 'w');
    }
  }
  s.bevel('w', 'W', 'v');
  // Grooves in the bark, running up the trunk.
  for (const [dx, from, to] of [
    [-3, 6, 24],
    [2, 14, 40],
    [-1, 30, 50],
  ] as const) {
    for (let y = trunkTop + from; y < trunkTop + to && y < TREE_FOOT.y - 3; y++) {
      if ((y * 3 + dx) % 11 !== 0) s.set(TREE_FOOT.x + dx + leanAt(y), y, 'v');
    }
  }

  // The crown: which clump is in front at each pixel, then its light.
  const clumps = clumpsOf(form);
  const owner = new Map<number, number>();
  clumps.forEach((c, k) => {
    for (let y = Math.floor(c.y - c.r * 1.1); y < Math.ceil(c.y + c.r * 1.1); y++) {
      for (let x = Math.floor(c.x - c.r * 1.1); x < Math.ceil(c.x + c.r * 1.1); x++) {
        const onGrid = x >= 0 && y >= 0 && x < TREE_W && y < TREE_H;
        if (onGrid && inClump(c, x, y, 5 + (k % 3))) owner.set(y * TREE_W + x, k);
      }
    }
  });
  const ownerAt = (x: number, y: number) => owner.get(y * TREE_W + x);
  for (const [at, k] of owner) {
    const x = at % TREE_W;
    const y = Math.floor(at / TREE_W);
    const c = clumps[k]!;
    const gx = (x - crown.x) / crown.rx;
    const gy = (y - crown.y) / crown.ry;
    const lx = (x + 0.5 - c.x) / c.r;
    const ly = (y + 0.5 - c.y) / c.r;
    let light = 0.62 - 0.24 * gx - 0.36 * gy - 0.22 * (lx * 0.6 + ly * 0.8);
    // In the shade of a clump hanging over this one from just below-front of it.
    for (const [dx, dy] of [
      [0, 1],
      [0, 2],
      [1, 2],
      [0, 3],
    ] as const) {
      const other = ownerAt(x + dx, y + dy);
      if (other !== undefined && other > k) {
        light -= dy === 1 ? 0.3 : 0.18;
        break;
      }
    }
    // The top edge of a clump in front catches the light.
    const above = ownerAt(x, y - 1);
    if (above !== undefined && above < k && light > 0.35) light += 0.2;
    // Band edges are dithered a little, so the light doesn't fall in stripes.
    const step = Math.floor(light * 5 + (BAYER4[(y % 4) * 4 + (x % 4)]! - 0.5) * 0.4);
    s.set(x, y, String(Math.max(0, Math.min(4, step))));
  }
  // Leaf flecks: little bright ticks on the lit side, and dark ones in the shade.
  for (let i = 0; i < 44; i++) {
    const x = Math.round(crown.x + (rand() * 2 - 1) * crown.rx);
    const y = Math.round(crown.y + (rand() * 2 - 1) * crown.ry);
    const key = s.get(x, y);
    if (key === '4') s.set(x, y, '5').set(x + 1, y, '5');
    else if (key === '3') s.set(x, y, '4').set(x - 1, y + 1, '4');
    else if (key === '1' || key === '2') s.set(x, y, '0').set(x + 1, y + 1, '0');
  }
  // The crown's shade falls across the top of the trunk and its branches.
  for (let x = 0; x < TREE_W; x++) {
    let bottom = -1;
    for (let y = 0; y < TREE_H; y++) if (ownerAt(x, y) !== undefined) bottom = y;
    if (bottom < 0) continue;
    for (let y = bottom + 1; y < bottom + 9; y++) {
      const key = s.get(x, y);
      if (key !== 'w' && key !== 'W') continue;
      if (y < bottom + 5 || (x + y) % 2 === 0) s.set(x, y, 'v');
    }
  }
  // No lone specks of leaf off the crown's edge.
  for (const [at] of owner) {
    const x = at % TREE_W;
    const y = Math.floor(at / TREE_W);
    const around = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].filter(([dx, dy]) => ownerAt(x + dx!, y + dy!) !== undefined).length;
    if (around < 2) s.set(x, y, CLEAR);
  }
  s.outline({ 0: 'o', 1: 'o', 2: 'o', 3: 'o', 4: 'o', 5: 'o', w: 'u', W: 'u', v: 'u' });
  return s.toSource();
}

/** The town's tree shapes: a round one, a tall one with a tuft, and a wide one leaning right. */
export const TREE_FORMS: readonly SpriteSource[] = [
  drawTree({ seed: 11, crown: { x: 48, y: 42, rx: 44, ry: 36 }, lean: 0 }),
  drawTree({ seed: 23, crown: { x: 46, y: 40, rx: 36, ry: 37 }, lean: -3, tuft: true }),
  drawTree({ seed: 37, crown: { x: 50, y: 46, rx: 45, ry: 32 }, lean: 4 }),
];

export const TREE: SpriteSource = TREE_FORMS[0]!;

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
