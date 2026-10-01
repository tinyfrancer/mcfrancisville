import { seeded } from '../systems/random';
import type { PatchId } from '../types/ids';
import type { TreeLook } from '../data/passive';
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
  crown: Crown;
  /** How far the trunk leans over its height, in pixels, + to the right. */
  lean: number;
  /** A tuft of leaves on top, for a taller tree. */
  tuft?: true;
}

const TREE_W = 96;
const TREE_H = 120;
/** Where the trunk meets the grass: the sprite's bottom, on the tile's centre. */
const TREE_FOOT = { x: 48, y: 116 };

/** A crown's centre and half-width and half-height, in the sprite's pixels. */
interface Crown {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

/**
 * The clumps a crown is built from: a ring of `count` round its edge, which makes the scalloped
 * silhouette, and a few big ones inside to fill it. Lower clumps are drawn later, so each one
 * overlaps the one above it, the way leaves hang.
 */
function clumpsOf(
  crown: Crown,
  seed: number,
  ring: { count: number; r: number; tuft?: true },
): Clump[] {
  const rand = seeded(seed);
  const inner: Clump[] = [
    { x: crown.x - crown.rx * 0.28, y: crown.y - crown.ry * 0.25, r: crown.ry * 0.62 },
    { x: crown.x + crown.rx * 0.28, y: crown.y - crown.ry * 0.2, r: crown.ry * 0.62 },
    { x: crown.x, y: crown.y + crown.ry * 0.15, r: crown.ry * 0.66 },
  ];
  const edge: Clump[] = [];
  for (let i = 0; i < ring.count; i++) {
    const angle = (i / ring.count) * Math.PI * 2 + rand() * 0.35;
    const r = ring.r + rand() * 5;
    edge.push({
      x: crown.x + Math.cos(angle) * (crown.rx - r * 0.8),
      y: crown.y + Math.sin(angle) * (crown.ry - r * 0.8),
      r,
    });
  }
  if (ring.tuft) edge.push({ x: crown.x - 3, y: crown.y - crown.ry - 1, r: 12 });
  edge.sort((a, b) => a.y - b.y);
  return [...inner, ...edge];
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
 * Paints a crown of leafy clumps onto `s` in the leaf tones `0`–`5`: which clump is in front at
 * each pixel, then its light, from the top left across the whole crown and over each clump, with
 * shade tucked under each clump that overlaps another, and `flecks` leaf ticks. Returns which
 * clump is at a pixel, if any.
 */
function paintCrown(
  s: Sketch,
  crown: Crown,
  clumps: readonly Clump[],
  seed: number,
  flecks: number,
): (x: number, y: number) => number | undefined {
  const rand = seeded(seed);
  // The crown: which clump is in front at each pixel, then its light.
  const owner = new Map<number, number>();
  clumps.forEach((c, k) => {
    for (let y = Math.floor(c.y - c.r * 1.1); y < Math.ceil(c.y + c.r * 1.1); y++) {
      for (let x = Math.floor(c.x - c.r * 1.1); x < Math.ceil(c.x + c.r * 1.1); x++) {
        const onGrid = x >= 0 && y >= 0 && x < s.width && y < s.height;
        if (onGrid && inClump(c, x, y, 5 + (k % 3))) owner.set(y * s.width + x, k);
      }
    }
  });
  const ownerAt = (x: number, y: number) => owner.get(y * s.width + x);
  for (const [at, k] of owner) {
    const x = at % s.width;
    const y = Math.floor(at / s.width);
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
  for (let i = 0; i < flecks; i++) {
    const x = Math.round(crown.x + (rand() * 2 - 1) * crown.rx);
    const y = Math.round(crown.y + (rand() * 2 - 1) * crown.ry);
    const key = s.get(x, y);
    if (key === '4') s.set(x, y, '5').set(x + 1, y, '5');
    else if (key === '3') s.set(x, y, '4').set(x - 1, y + 1, '4');
    else if (key === '1' || key === '2') s.set(x, y, '0').set(x + 1, y + 1, '0');
  }
  // No lone specks of leaf off the crown's edge.
  for (const [at] of owner) {
    const x = at % s.width;
    const y = Math.floor(at / s.width);
    const around = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].filter(([dx, dy]) => ownerAt(x + dx!, y + dy!) !== undefined).length;
    if (around < 2) s.set(x, y, CLEAR);
  }
  return ownerAt;
}

/**
 * A tree three tiles wide and nearly four tall (`docs/art_style.md`): a trunk that tapers up from
 * its roots and forks into the leaves, under a round crown of leafy clumps. The leaves are five
 * flat tones `0`–`4` (`5` for the brightest flecks), lit from the top left across the whole crown,
 * with shade tucked under each clump that hangs over another; the bark is `u`–`W`.
 */
function drawTree(form: TreeForm): SpriteSource {
  const s = new Sketch(TREE_W, TREE_H);
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

  const ownerAt = paintCrown(
    s,
    crown,
    clumpsOf(crown, form.seed, { count: 9, r: 13, ...(form.tuft && { tuft: true as const }) }),
    form.seed * 7 + 3,
    44,
  );
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

// ---- The candy tree (phase O) ---------------------------------------------------------------

const CANDY_W = 64;
const CANDY_H = 92;
const CANDY_FOOT = { x: 32, y: 88 };

/** A wrapped sweet hanging by a thread: a round middle, and its wrapper twisted either side. */
function wrappedSweet(s: Sketch, x: number, y: number, keys: string): void {
  const [dark, fill, light] = [...keys] as [string, string, string];
  s.rect(x + 5, y - 3, 1, 3, 'o');
  s.ellipse(x + 5.5, y + 2.5, 3, 2.5, fill);
  s.rect(x + 4, y + 1, 2, 1, light).rect(x + 4, y + 4, 4, 1, dark);
  for (const [at, step] of [
    [x + 2, -1],
    [x + 8, 1],
  ] as const) {
    s.rect(at, y + 2, 1, 1, dark);
    s.rect(at + step, y + 1, 1, 3, fill);
    s.rect(at + step * 2, y, 1, 5, fill).set(at + step * 2, y, light);
  }
}

/** A round lollipop on a little white stick, with a curl of light in its swirl. */
function lollipop(s: Sketch, x: number, y: number, keys: string): void {
  const [dark, fill, light] = [...keys] as [string, string, string];
  s.rect(x + 3, y - 3, 1, 3, 'o');
  s.ellipse(x + 3.5, y + 3.5, 3.5, 3.5, fill);
  s.rect(x + 2, y + 1, 2, 1, light)
    .set(x + 1, y + 2, light)
    .set(x + 4, y + 3, light);
  s.rect(x + 2, y + 5, 3, 1, dark).set(x + 5, y + 4, dark);
  s.rect(x + 3, y + 7, 1, 4, 'x');
}

/** A kernel of candy corn: yellow at the wide end, orange in the middle, a white tip. */
function candyCorn(s: Sketch, x: number, y: number): void {
  s.rect(x + 2, y - 3, 1, 3, 'o');
  s.rect(x + 2, y, 1, 1, 'x').rect(x + 1, y + 1, 3, 1, 'x');
  s.rect(x + 1, y + 2, 3, 1, 'k')
    .rect(x, y + 3, 5, 1, 'k')
    .set(x + 1, y + 2, 'K');
  s.rect(x, y + 4, 5, 2, 'g').rect(x, y + 5, 5, 1, 'h');
}

/** Where the sweets hang, in the order they come as the tree fills. */
const SWEETS: readonly {
  x: number;
  y: number;
  kind: 'wrapped' | 'lolly' | 'corn';
  keys: string;
}[] = [
  { x: 10, y: 38, kind: 'wrapped', keys: 'qpP' },
  { x: 40, y: 42, kind: 'lolly', keys: 'nkK' },
  { x: 26, y: 48, kind: 'corn', keys: '' },
  { x: 38, y: 22, kind: 'wrapped', keys: 'hgG' },
  { x: 6, y: 22, kind: 'lolly', keys: 'qpP' },
  { x: 22, y: 30, kind: 'wrapped', keys: 'nkK' },
  { x: 30, y: 12, kind: 'corn', keys: '' },
  { x: 52, y: 32, kind: 'corn', keys: '' },
  { x: 14, y: 10, kind: 'wrapped', keys: 'hgG' },
  { x: 32, y: 34, kind: 'lolly', keys: 'hgG' },
  { x: 4, y: 44, kind: 'corn', keys: '' },
  { x: 46, y: 50, kind: 'wrapped', keys: 'qpP' },
];

/** How many sweets hang on the tree for each look. */
const SWEETS_SHOWN: Record<TreeLook, number> = { bare: 0, few: 4, laden: SWEETS.length };

/**
 * The candy tree in her front yard (phase O, decisions.md 82): a little round tree two tiles
 * wide on a candy-cane trunk, its minty crown hung with wrapped sweets, lollipops and candy corn,
 * more of them the longer it has been since she last shook it.
 */
function drawCandyTree(look: TreeLook): SpriteSource {
  const s = new Sketch(CANDY_W, CANDY_H);
  const crown: Crown = { x: 32, y: 34, rx: 30, ry: 28 };
  const trunkTop = 50;
  for (let y = trunkTop; y <= CANDY_FOOT.y; y++) {
    const half = 4 + Math.max(0, y - (CANDY_FOOT.y - 4));
    s.rect(CANDY_FOOT.x - half, y, half * 2, 1, 'w');
  }
  s.bevel('w', 'W', 'v');
  // The candy-cane stripes, climbing the trunk on the slant.
  for (let y = trunkTop; y <= CANDY_FOOT.y; y++) {
    for (let x = CANDY_FOOT.x - 6; x < CANDY_FOOT.x + 6; x++) {
      if (!s.filled(x, y) || (x + y) % 8 >= 3) continue;
      s.set(x, y, s.get(x, y) === 'W' ? 'Y' : 'y');
    }
  }
  paintCrown(s, crown, clumpsOf(crown, 71, { count: 9, r: 10 }), 17, 26);
  s.outline({
    0: 'o',
    1: 'o',
    2: 'o',
    3: 'o',
    4: 'o',
    5: 'o',
    w: 'u',
    W: 'u',
    v: 'u',
    y: 'u',
    Y: 'u',
  });
  for (const sweet of SWEETS.slice(0, SWEETS_SHOWN[look])) {
    if (sweet.kind === 'wrapped') wrappedSweet(s, sweet.x, sweet.y, sweet.keys);
    else if (sweet.kind === 'lolly') lollipop(s, sweet.x, sweet.y, sweet.keys);
    else candyCorn(s, sweet.x, sweet.y);
  }
  return s.toSource();
}

/** The candy tree as it looks bare, with a few sweets, and laden. */
export const CANDY_TREE: Record<TreeLook, SpriteSource> = {
  bare: drawCandyTree('bare'),
  few: drawCandyTree('few'),
  laden: drawCandyTree('laden'),
};

/** Mint leaves, a pink-and-white candy-cane trunk, and sweets in pink, orange and gold. */
export const CANDY_TREE_PALETTE: Palette = {
  ...leaves(C.teal, C.tealLight),
  ...tones('uvwW_', C.cream),
  y: C.rose,
  Y: C.roseLight,
  ...tones('_qpP_', C.rose),
  ...tones('_nkK_', C.pumpkin),
  ...tones('_hgG_', C.gold),
  x: C.white,
};

// ---- Whisperwood's old trees ------------------------------------------------------------------

const OLD_W = 144;
const OLD_H = 176;
const OLD_FOOT = 170;

/**
 * One of Whisperwood's old trees (phase I), standing on two tiles by two: a great gnarled trunk
 * flaring into roots, a knot-hole, and a sleepy old face in the bark (two shut eyes and a small
 * smile, since the trees murmur to each other), under a broad crown with moss hanging from it.
 * Leaves in `0`–`5` as any tree's, the bark `u`–`W`, the moss `m`/`M`, the hollow `k`.
 */
function drawOldTree(): SpriteSource {
  const s = new Sketch(OLD_W, OLD_H);
  const mid = OLD_W / 2;
  const crown: Crown = { x: mid, y: 50, rx: 68, ry: 44 };
  const trunkTop = 70;
  for (let y = trunkTop; y <= OLD_FOOT; y++) {
    const up = (OLD_FOOT - y) / (OLD_FOOT - trunkTop);
    const flare = y > OLD_FOOT - 16 ? Math.round(((y - (OLD_FOOT - 16)) / 16) ** 2 * 14) : 0;
    const half = Math.round(22 - up * 6 + Math.sin(y / 9) * 1.5) + flare;
    const sway = Math.round(Math.sin(up * 2.2) * 3);
    s.rect(mid - half + sway, y, half * 2, 1, 'w');
  }
  // Roots over the grass, three a side, and boughs up into the leaves.
  for (const [side, length, drop] of [
    [-1, 16, 0],
    [1, 14, 1],
    [-1, 10, 4],
    [1, 9, 5],
  ] as const) {
    for (let i = 0; i < length; i++) {
      const x = mid + side * (30 + i);
      s.rect(
        side < 0 ? x - 2 : x,
        OLD_FOOT - 4 + drop + Math.floor(i / 5),
        3,
        3 - Math.floor(i / 6),
        'w',
      );
    }
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 26; i++) {
      const y = trunkTop - i;
      const x = mid + side * (4 + Math.round(i * 1.1));
      s.rect(x - 4, y, 9 - Math.floor(i / 5), 1, 'w');
    }
  }
  s.bevel('w', 'W', 'v');
  // Grooves in the bark.
  for (const [dx, from, to] of [
    [-15, 20, 80],
    [-6, 8, 40],
    [12, 30, 96],
    [17, 10, 50],
  ] as const) {
    for (let y = trunkTop + from; y < trunkTop + to && y < OLD_FOOT - 4; y++) {
      if ((y * 5 + dx) % 13 > 1) s.set(mid + dx + Math.round(Math.sin(y / 7)), y, 'v');
    }
  }
  // The face: two shut eyes, a nose of a knot, and a small smile, halfway up.
  const fy = 118;
  for (const ex of [mid - 11, mid + 5]) {
    s.set(ex, fy, 'u')
      .set(ex + 1, fy + 1, 'u')
      .set(ex + 2, fy + 1, 'u')
      .set(ex + 3, fy + 1, 'u');
    s.set(ex + 4, fy, 'u');
  }
  s.ellipse(mid, fy + 7, 2.5, 2, 'v').set(mid - 1, fy + 6, 'W');
  s.line(mid - 4, fy + 13, mid - 2, fy + 14, 'u').line(mid - 1, fy + 14, mid + 1, fy + 14, 'u');
  s.line(mid + 2, fy + 14, mid + 4, fy + 13, 'u');
  s.set(mid - 14, fy + 5, 'c')
    .set(mid - 13, fy + 5, 'c')
    .set(mid + 10, fy + 5, 'c')
    .set(mid + 11, fy + 5, 'c');
  // A knot-hole lower down, to one side.
  s.ellipse(mid + 12, 146, 4, 5.5, 'k').ellipse(mid + 12, 147, 2.5, 3.5, 'u');
  const ownerAt = paintCrown(s, crown, clumpsOf(crown, 57, { count: 13, r: 16 }), 91, 90);
  // The crown's shade across the top of the trunk, and moss hanging from under the leaves.
  const rand = seeded(19);
  for (let x = 0; x < OLD_W; x++) {
    let bottom = -1;
    for (let y = 0; y < OLD_H; y++) if (ownerAt(x, y) !== undefined) bottom = y;
    if (bottom < 0) continue;
    for (let y = bottom + 1; y < bottom + 12; y++) {
      const key = s.get(x, y);
      if (key !== 'w' && key !== 'W') continue;
      if (y < bottom + 7 || (x + y) % 2 === 0) s.set(x, y, 'v');
    }
    if (x % 7 === 3 && rand() < 0.7) {
      const length = 5 + Math.floor(rand() * 12);
      for (let i = 0; i < length; i++)
        s.set(x + (i % 4 === 3 ? 1 : 0), bottom + 1 + i, i < 3 ? 'M' : 'm');
    }
  }
  s.outline({
    0: 'o',
    1: 'o',
    2: 'o',
    3: 'o',
    4: 'o',
    5: 'o',
    w: 'u',
    W: 'u',
    v: 'u',
    m: 'o',
    M: 'o',
  });
  return s.toSource();
}

export const OLD_TREE: SpriteSource = drawOldTree();

/** An old tree's leaves: a deep old green, or a dusky teal. Its cheeks blush, a little. */
export const OLD_TREE_LEAVES: readonly Palette[] = [
  {
    ...leaves(C.hedge, C.hedgeLight),
    m: C.leafDark,
    M: C.mossLight,
    k: C.ink,
    c: mix(C.cheek, C.bark, 0.5),
  },
  {
    ...leaves(C.canopyDark, C.canopy),
    m: C.leafDark,
    M: C.mossLight,
    k: C.ink,
    c: mix(C.cheek, C.bark, 0.5),
  },
];

// ---- The willow -------------------------------------------------------------------------------

/**
 * The big willow (personal_touches.md, "After phase E"): a dome of leafy clumps on a trunk two
 * tiles across, with long fronds falling from under its edge nearly to the grass. Revised in 0.2's
 * K1 (she said it needed it): the dome is smaller, and the fronds are single strands, thinner and
 * fewer, each arching out from the dome and falling, so the tree reads as a willow and not a wall
 * of leaves. The ones behind the trunk are in shade and the ones in front lit, parted in the
 * middle so the trunk shows. They aren't outlined: a strand is its own darker edge.
 */
function drawWillow(): SpriteSource {
  const W = 168;
  const H = 168;
  const s = new Sketch(W, H);
  const mid = W / 2;
  const foot = 161;
  const crown: Crown = { x: mid, y: 44, rx: 60, ry: 30 };
  const rand = seeded(41);

  /** One strand of little leaves, arching out from under the dome and falling, to a fine tip. */
  const strand = (x0: number, top: number, length: number, lit: boolean) => {
    const side = (x0 - mid) / mid;
    const sway = rand() * 6;
    for (let i = 0; i < length; i++) {
      const y = top + i;
      const arch = Math.round(side * 9 * Math.min(1, Math.sqrt(i / 22)));
      const x = x0 + arch + Math.round(Math.sin(i / 13 + sway) * 0.8);
      const tone = lit ? (i % 7 < 4 ? '3' : '2') : i % 6 === 0 ? '0' : '1';
      put(x, y, tone);
      put(x + 1, y, lit ? '1' : 'o');
      // A leaf now on one side, now on the other, fewer toward the tip.
      const leafy = i < length - 4 && (i < length * 0.6 ? 3 : 5);
      if (leafy && i % leafy === 0) put(x + ((i / leafy) % 2 === 0 ? -1 : 2), y, lit ? '2' : '0');
      if (lit && i % 9 === 4 && i < length - 6) put(x - 1, y, '4');
    }
    if (lit) put(x0 + Math.round(side * 9), top + length, '1');
  };
  // The fronds behind go only where nothing else is, drawn last of all but the ones in front.
  let put = (x: number, y: number, key: string) => {
    if (s.get(x, y) === CLEAR) s.set(x, y, key);
  };

  // The trunk, flaring into its roots, with a few knots in the bark.
  for (let y = 66; y <= foot; y++) {
    const flare = y > foot - 20 ? Math.round(((y - (foot - 20)) / 20) ** 2 * 14) : 0;
    const lean = Math.round(Math.sin((y - 66) / 17) * 2);
    s.rect(mid - 11 - flare + lean, y, 22 + flare * 2, 1, 'w');
  }
  s.bevel('w', 'W', 'v');
  for (const [x, y] of [
    [mid - 5, 100],
    [mid + 4, 120],
    [mid - 6, 138],
  ] as const) {
    s.rect(x, y, 1, 8, 'v').set(x + 1, y + 3, 'v');
  }
  // The dome over their tops, and its shade on the trunk.
  const ownerAt = paintCrown(s, crown, clumpsOf(crown, 43, { count: 11, r: 12 }), 47, 50);
  const bottoms = new Map<number, number>();
  for (let x = 0; x < W; x++) {
    let bottom = -1;
    for (let y = 0; y < H; y++) if (ownerAt(x, y) !== undefined) bottom = y;
    if (bottom >= 0) bottoms.set(x, bottom);
    for (let y = bottom + 1; y < bottom + 8 && bottom >= 0; y++) {
      const key = s.get(x, y);
      if (key === 'w' || key === 'W') s.set(x, y, 'v');
    }
  }
  const underside = (x: number) => bottoms.get(x) ?? -1;
  s.outline({ 0: 'o', 1: 'o', 2: 'o', 3: 'o', 4: 'o', 5: 'o', w: 'u', W: 'u', v: 'u' });
  // The fronds at the back, in the dome's shade.
  for (let x0 = mid - 60; x0 <= mid + 60; x0 += 9) {
    const x = x0 + Math.round(rand() * 3);
    const side = Math.abs(x - mid) / 60;
    if (underside(x) < 0) continue;
    strand(x, underside(x) - 2, 66 + Math.round(side * 24 + rand() * 18), false);
  }
  put = (x, y, key) => s.set(x, y, key);
  // The fronds in front: lit, longest at the sides, parted in the middle, each starting a little
  // up inside the dome's edge so the leaves flow down into them.
  for (let x0 = mid - 58; x0 <= mid + 58; x0 += 7) {
    const side = (x0 - mid) / 58;
    if (Math.abs(side) < 0.25) continue;
    const x = x0 + Math.round(rand() * 2);
    const bottom = underside(x);
    if (bottom < 0) continue;
    const length = Math.round(40 + Math.abs(side) * 52 + rand() * 22);
    strand(x, bottom - 5 - Math.round(rand() * 4), Math.min(length, foot - bottom), true);
  }
  return s.toSource();
}

export const WILLOW: SpriteSource = drawWillow();

export const WILLOW_PALETTE: Palette = leaves(C.leaf, C.leafLight);

export const ROSE_BUSH_PALETTE: Palette = {
  ...leaves(C.leafDark, C.leaf),
  q: ramp(C.rose)[0],
  r: C.rose,
  R: C.roseLight,
  h: ramp(C.roseLight)[4],
  b: C.berry,
};

// ---- The rose bush ----------------------------------------------------------------------------

/** Where the roses sit on her rose bush, and where tomorrow's buds are once it's picked. */
const ROSES_AT: readonly (readonly [number, number])[] = [
  [9, 19],
  [20, 17],
  [26, 25],
  [14, 27],
  [5, 29],
  [21, 33],
  [11, 37],
];

/**
 * Her rose bush (personal_touches.md, "Her garden"): a round, leafy shrub on a few stems, drawn
 * like the trees' crowns but a tile across. Picked, it is the same bush with tight buds for
 * tomorrow.
 */
function drawRoseShrub(): Sketch {
  const s = new Sketch(32, 48);
  for (const x of [12, 16, 20]) s.line(x, 45, 16 + Math.sign(x - 16) * 2, 38, 'w');
  const crown: Crown = { x: 16, y: 29, rx: 15.5, ry: 14 };
  paintCrown(s, crown, clumpsOf(crown, 5, { count: 7, r: 5 }), 9, 8);
  s.outline({ 0: 'o', 1: 'o', 2: 'o', 3: 'o', 4: 'o', 5: 'o', w: 'u' });
  return s;
}

function drawRoseBush(): SpriteSource {
  const s = drawRoseShrub();
  for (const [x, y] of ROSES_AT) {
    // A little rose: a round head lit from the top left, a curl of petal folds in the middle, and
    // its own deep pink along its shaded lower edge.
    s.ellipse(x, y, 3, 3, 'r');
    for (const [dx, dy] of [
      [-2, -2],
      [-1, -3],
      [-3, -1],
      [-2, -1],
      [-1, 0],
      [0, -1],
    ] as const) {
      s.set(x + dx, y + dy, 'R');
    }
    s.set(x, y, 'q').set(x + 1, y - 1, 'q');
    for (const [dx, dy] of [
      [3, 0],
      [3, 1],
      [2, 2],
      [1, 3],
      [0, 3],
      [-1, 3],
      [3, -1],
    ] as const) {
      if (s.get(x + dx, y + dy) !== 'r') s.set(x + dx, y + dy, 'q');
    }
  }
  return s.toSource();
}

function drawRoseBushPicked(): SpriteSource {
  const s = drawRoseShrub();
  for (const [x, y] of ROSES_AT)
    s.set(x, y, 'b')
      .set(x, y - 1, 'b')
      .set(x - 1, y, 'q');
  return s.toSource();
}

export const ROSE_BUSH: SpriteSource = drawRoseBush();
export const ROSE_BUSH_BARE: SpriteSource = drawRoseBushPicked();

// ---- Bushes (phase L) ---------------------------------------------------------------------------

/**
 * A round, low shrub of leafy clumps on a few stems, a tile across, drawn as the rose bush is: the
 * clutter along paths and in corners. One form has berries.
 */
function drawBush(seed: number, berries: boolean): SpriteSource {
  const s = new Sketch(32, 36);
  for (const x of [13, 19]) s.line(x, 34, 16, 29, 'w');
  const crown: Crown = { x: 16, y: 21, rx: 15.5, ry: 12 };
  paintCrown(s, crown, clumpsOf(crown, seed, { count: 7, r: 5 }), seed + 4, 7);
  if (berries) {
    const rand = seeded(seed);
    for (let i = 0; i < 6; i++) {
      const x = 6 + Math.floor(rand() * 20);
      const y = 14 + Math.floor(rand() * 13);
      if (s.get(x, y) === CLEAR || s.get(x + 1, y + 1) === CLEAR) continue;
      s.set(x, y, 'r')
        .set(x + 1, y, 'q')
        .set(x, y + 1, 'q')
        .set(x + 1, y + 1, 'q');
    }
  }
  s.outline({ 0: 'o', 1: 'o', 2: 'o', 3: 'o', 4: 'o', 5: 'o', w: 'u', r: 'o', q: 'o' });
  return s.toSource();
}

export const BUSH_FORMS: readonly SpriteSource[] = [
  drawBush(3, false),
  drawBush(8, true),
  drawBush(14, false),
];

/** Green, a darker hedge green, and a dusky plum; the berries are a soft red. */
export const BUSH_LEAVES: readonly Palette[] = [
  leaves(C.leafDark, C.leaf),
  leaves(C.hedge, C.hedgeLight),
  leaves(C.plum, C.plumLight),
].map((p) => ({ ...p, r: C.roseLight, q: C.rose }));

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
  // The castle garden's milkweed, which the monarchs love.
  milkweed: blooms(C.snapLight),
};
