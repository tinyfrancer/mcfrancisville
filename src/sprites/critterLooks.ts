import type { CritterId } from '../types/ids';
import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

/*
 * The critters redrawn where they read wrong at phone size (V1's L6, decision 292): the frog, a
 * box with dots for eyes, is a squat frog with shiny eyes, folded legs and a smile; the mist newt
 * is a newt, not a frog in lavender; the firefly is a beetle with a glowing tail rather than a bar
 * and a bulb; the Hercules beetle's horn curves up out of a glossy shield instead of standing like
 * a bottle's neck; the fog eel is a ribbon with a face. The mourning cloak, the tombstone toad and
 * the reed frog, palettes on their family's shapes, get the markings that make each itself. Each
 * is a grid in the family's own keys, so its palette still says its colours.
 */

const WORLD = 24;

/** Outlines everything painted in `o`, but for the keys in `bare` (a glow isn't outlined). */
function outlined(s: Sketch, bare = ''): SpriteSource {
  s.outline((key) => (bare.includes(key) ? null : 'o'));
  return s.toSource();
}

/** A grid with some of its pixels changed: `touch` says each pixel's new key, or keeps its own. */
function touched(
  source: SpriteSource,
  touch: (x: number, y: number, key: string) => string,
): SpriteSource {
  return { rows: source.rows.map((row, y) => [...row].map((key, x) => touch(x, y, key)).join('')) };
}

/**
 * A frog sat squat, face on, at 24: a round body under two eye bumps, shiny eyes (`e`, a glint
 * `E`), a smile (`m`), a pale tummy (`G`), back legs folded at its sides and two little hands in
 * front, and a few spots (`s`) on its back.
 */
export function frogFace(): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  // The back legs folded up at its sides, behind it.
  s.ellipse(4.5, 17.5, 3, 3, 'g').ellipse(19.5, 17.5, 3, 3, 'g');
  s.rect(1, 20, 5, 1, 'g').rect(18, 20, 5, 1, 'g');
  s.outline(() => 'o');
  s.ellipse(12, 15.5, 8, 5.5, 'g');
  s.ellipse(7.5, 10.5, 3, 3, 'g').ellipse(16.5, 10.5, 3, 3, 'g');
  s.ellipse(12, 17.5, 4.5, 3, 'G');
  // Its hands, on the ground in front of its tummy.
  s.rect(8, 20, 2, 1, 'g').rect(14, 20, 2, 1, 'g');
  for (const x of [7, 16]) s.rect(x, 9, 2, 3, 'e').set(x, 9, 'E');
  s.rect(10, 14, 4, 1, 'm').set(9, 13, 'm').set(14, 13, 'm');
  for (const [x, y] of [
    [5, 13],
    [18, 13],
    [11, 11],
    [13, 12],
  ] as const) {
    s.set(x, y, 's');
  }
  s.outline((key) => (key === 'o' ? null : 'o'));
  return s.toSource();
}

/**
 * A newt side on, facing right, 16 or 24 across: a slim body (`b`, its belly `B`) low on four
 * splayed legs, a long tail curling up at its tip, a round head with a shiny eye (`e`, `E`) and a
 * smile (`m`), and glowing spots (`s`) down its back. Its tail swishes between frames.
 */
export function newt(size: 16 | 24, swish: boolean): SpriteSource {
  const k = size / WORLD;
  const at = (n: number) => Math.round(n * k);
  const s = new Sketch(size, size);
  for (const [x, y] of [
    [8, 19],
    [6, 19],
    [15, 19],
    [17, 19],
  ] as const) {
    s.rect(at(x), at(y - 1), Math.max(1, at(1)), Math.max(1, at(2)), 'b');
  }
  s.ellipse(11.5 * k, 16.5 * k, 6.5 * k, 2.8 * k, 'b');
  // The tail, thinning back to a tip that curls up, and over the other way on the swish.
  const tip = swish ? -1 : 1;
  for (let i = 0; i < 6; i++) {
    const x = at(5.5 - i);
    const y = at(16.5 - (i > 2 ? (i - 2) * 0.9 * tip : 0));
    s.rect(x, y - (i < 3 ? 1 : 0), 1, i < 3 ? 2 : 1, 'b');
  }
  s.ellipse(18.5 * k, 15 * k, 4 * k, 3.2 * k, 'b');
  s.rect(at(8), at(18), at(9), 1, 'B');
  s.set(at(19), at(14), 'e');
  if (size === 24) s.set(19, 13, 'E').set(20, 14, 'e');
  s.line(at(18), at(16), at(21), at(16), 'm');
  for (const x of [7, 10, 13, 16]) s.set(at(x), at(15), 's');
  return outlined(s, 's');
}

/**
 * A firefly from above, at 24: its feelers (`a`), a dark head, a rosy shield with a dark mark
 * (`p`), wing cases lit down their left edges (`b`, `w`), and its tail aglow (`t`, bright `T`).
 * On its second frame its wings are open, pale and see-through-looking (`W`), mid-flutter.
 */
export function fireflyFrame(open: boolean): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  if (open) {
    s.ellipse(6.5, 11, 4, 2.5, 'W').ellipse(17.5, 11, 4, 2.5, 'W');
  }
  s.ellipse(12, 13.5, 4, 4.5, 'b');
  s.rect(11, 10, 2, 8, 'k');
  s.line(9, 11, 9, 16, 'w');
  s.ellipse(12, 8.5, 3, 1.8, 'p');
  s.rect(11, 8, 2, 1, 'k');
  s.ellipse(12, 6, 1.6, 1.2, 'k');
  s.line(11, 5, 9, 2, 'a').line(12, 5, 14, 2, 'a');
  s.outline((key) => (key === 'a' ? null : 'o'));
  s.ellipse(12, 19, 2.6, 2.4, 't');
  s.rect(11, 18, 2, 2, 'T');
  return s.toSource();
}

/**
 * A Hercules beetle from above, 16 or 24 across: a broad olive-gold back split down the middle
 * (`W`, `w`) with dark spots (`s`), six legs bent out from under it, a glossy black shield (`h`,
 * lit `H`), and its long horn curving up from the shield to a point, a tooth along its side.
 */
export function hercules(size: 16 | 24): SpriteSource {
  const k = size / WORLD;
  const at = (n: number) => Math.round(n * k);
  const s = new Sketch(size, size);
  for (const [x0, y0, x1, y1] of [
    [8, 13, 3, 10],
    [7, 16, 2, 17],
    [8, 19, 4, 23],
  ] as const) {
    s.line(at(x0), at(y0), at(x1), at(y1), 'o');
    s.line(at(WORLD - 1 - x0), at(y0), at(WORLD - 1 - x1), at(y1), 'o');
  }
  s.ellipse(12 * k, 16.5 * k, 6.5 * k, 6 * k, 'W');
  s.rect(at(12) - 1, at(11), 2, at(11), 'w');
  s.ellipse(12 * k, 9.5 * k, 4 * k, 3 * k, 'h');
  // Two horns making a pincer: the long one from the shield, its tip hooked right, and the short
  // one from the head under it, bent left.
  for (const [x, y, w] of [
    [12, 6, 2],
    [12, 5, 2],
    [12, 4, 2],
    [12, 3, 1],
    [12, 2, 1],
    [13, 1, 1],
    [14, 1, 1],
    [10, 6, 1],
    [10, 5, 1],
    [9, 4, 1],
    [8, 3, 1],
  ] as const) {
    if (size === 16 && y < 3) continue;
    s.rect(at(x), at(y), Math.max(1, at(w)), 1, 'h');
  }
  if (size === 24) s.set(12, 5, 'H').set(12, 4, 'H');
  s.set(at(10), at(8), 'H').set(at(11), at(8), 'H');
  for (const [x, y] of [
    [9, 15],
    [15, 18],
    [14, 13],
    [9, 20],
  ] as const) {
    s.set(at(x), at(y), 's');
  }
  return outlined(s, 'o');
}

/**
 * A fog eel, 16 or 24 across: a soft ribbon (`f`) swaying one way or the other, a fin along its
 * back (`s`), thinning to its tail, and a round head with an eye (`e`) and a little smile (`m`).
 */
export function eel(size: 16 | 24, flick: boolean): SpriteSource {
  const k = size / WORLD;
  const at = (n: number) => Math.round(n * k);
  const s = new Sketch(size, size);
  const phase = flick ? Math.PI : 0;
  const mid = (x: number) => 12 * k + Math.sin(x / (3.2 * k) + phase) * 2.2 * k;
  const end = at(18);
  for (let x = at(1); x < end; x++) {
    const thick = x < at(5) ? 1 : x < at(9) ? 2 : 3;
    const top = Math.round(mid(x) - thick / 2);
    s.rect(x, top, 1, thick, 'f');
    if (thick > 1 && x % 2 === 0) s.set(x, top - 1, 's');
  }
  const hy = Math.round(mid(end));
  s.ellipse(end + 1.5 * k, hy, 3 * k, 2.5 * k, 'f');
  s.set(end + at(2), hy - 1, 'e');
  if (size === 24) s.set(end + 3, hy + 1, 'm').set(end + 2, hy + 1, 'm');
  return outlined(s, 's');
}

/**
 * The mourning cloak's own wings: a cream border round their outer edges (`p`) with a row of blue
 * dots inside it (`q`), over the moth's shape.
 */
export function cloaked(source: SpriteSource): SpriteSource {
  const width = source.rows[0]!.length;
  const at = (x: number, y: number) => source.rows[y]?.[x] ?? '.';
  const wing = (key: string) => key === 'W' || key === 'w';
  const SIDES = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ] as const;
  const open = (x: number, y: number) => {
    const key = at(x, y);
    return key === '.' || key === CLEAR;
  };
  // Its margin is the wings' outside edge, not the seam between a forewing and a hindwing.
  const edge = (x: number, y: number) =>
    SIDES.some(([dx, dy]) => {
      const [nx, ny] = [x + dx, y + dy];
      const key = at(nx, ny);
      return open(nx, ny) || (key === 'o' && SIDES.some(([ex, ey]) => open(nx + ex, ny + ey)));
    });
  // The margin keeps to the wings' far edges, or a pixel's rim would be most of a small wing.
  const outer = (x: number) => Math.abs(x + 0.5 - width / 2) > width / 4;
  const bordered = touched(source, (x, y, key) =>
    wing(key) && outer(x) && edge(x, y) ? 'p' : key,
  );
  return touched(bordered, (x, y, key) => {
    if (!wing(key) || !outer(x)) return key;
    const byBorder = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ].some(([dx, dy]) => bordered.rows[y + dy!]?.[x + dx!] === 'p');
    return byBorder && (x + y) % 3 === 0 ? 'q' : key;
  });
}

// ---- 1.3's F3 (decision 362): the families that read wrong at phone size, 16 and 24 as one ----

type Size = 16 | 24;
type Point = readonly [number, number];

/** A size's pixels from the 24-pixel drawing's. */
const scaleOf = (size: Size) => {
  const k = size / WORLD;
  return { k, at: (n: number) => Math.round(n * k) };
};

/** Fills a polygon (points in the 24's pixels, scaled by `k`): every pixel whose middle is in it. */
function polygon(s: Sketch, points: readonly Point[], k: number, key: string): void {
  const pts = points.map(([x, y]) => [x * k, y * k] as const);
  for (let y = 0; y < s.height; y++) {
    for (let x = 0; x < s.width; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i]!;
        const [xj, yj] = pts[j]!;
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) s.set(x, y, key);
    }
  }
}

/** A line between two points in the 24's pixels, scaled by `k`. */
function stroke(s: Sketch, [x0, y0]: Point, [x1, y1]: Point, k: number, key: string): void {
  s.line(Math.round(x0 * k), Math.round(y0 * k), Math.round(x1 * k), Math.round(y1 * k), key);
}

/**
 * A bat (the family's shape since 1.3's F3), face on, 16 or 24 across: each wing a membrane
 * (`W`) stretched from its shoulder to the wrist and down three finger bones (`v`) to their tips,
 * its trailing edge scalloped between them; a round body (`b`) with a pale tummy (`c`), a round
 * head between two pointed ears (pink inside, `c`), eyes (`e`) and, at 24, two little white fangs
 * (`F`). Spread, the wings reach out level; raised, they lift up into a V.
 */
export function batShape(size: Size, up: boolean): SpriteSource {
  const { k } = scaleOf(size);
  const s = new Sketch(size, size);
  const wing = new Sketch(size, size);
  const shoulder: Point = [10, 12];
  const hip: Point = [10.5, 17];
  const wrist: Point = up ? [4, 2] : [2, 8.5];
  const tips: readonly Point[] = up
    ? [
        [0.5, 6.5],
        [1.5, 11.5],
        [5.5, 15.5],
      ]
    : [
        [0, 14],
        [3.5, 18],
        [7.5, 18.5],
      ];
  const outline: Point[] = [shoulder, wrist, ...tips, hip];
  polygon(wing, outline, k, 'W');
  // The trailing edge bows in between each pair of tips, and between the last and the body.
  const edge: Point[] = [...tips, hip];
  const cx = outline.reduce((n, [x]) => n + x, 0) / outline.length;
  const cy = outline.reduce((n, [, y]) => n + y, 0) / outline.length;
  for (let i = 0; i + 1 < edge.length; i++) {
    const [ax, ay] = edge[i]!;
    const [bx, by] = edge[i + 1]!;
    const len = Math.hypot(bx - ax, by - ay);
    let nx = -(by - ay) / len;
    let ny = (bx - ax) / len;
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    if ((mx - cx) * nx + (my - cy) * ny < 0) [nx, ny] = [-nx, -ny];
    const r = len * 0.5;
    wing.ellipse((mx + nx * r * 0.42) * k, (my + ny * r * 0.42) * k, r * k, r * k, CLEAR);
  }
  // The arm is the wing's leading edge, its outline; at 16 the middle finger is left out too, or
  // the bones would be all the wing.
  for (const [i, tip] of tips.entries())
    if (size === 24 || i !== 1) stroke(wing, wrist, tip, k, 'v');
  s.stamp(wing, 0, 0).stamp(wing, 0, 0, { flipX: true });
  // The ears, then the head and body over their roots.
  const ear = new Sketch(size, size);
  polygon(
    ear,
    [
      [8.5, 10],
      [8.5, 4.5],
      [11.5, 8],
    ],
    k,
    'b',
  );
  if (size === 24) ear.set(9, 7, 'c').set(9, 8, 'c');
  s.stamp(ear, 0, 0).stamp(ear, 0, 0, { flipX: true });
  s.ellipse(12 * k, 14.5 * k, 3.2 * k, 4 * k, 'b');
  s.ellipse(12 * k, 15.5 * k, 1.8 * k, 2.4 * k, 'c');
  s.ellipse(12 * k, 10 * k, 3.6 * k, 3 * k, 'b');
  if (size === 24) {
    s.rect(9, 9, 1, 2, 'e').rect(14, 9, 1, 2, 'e');
    s.set(10, 12, 'F').set(13, 12, 'F');
  } else {
    s.set(6, 6, 'e').set(9, 6, 'e');
  }
  s.outline(() => 'o');
  return s.toSource();
}

/** The pixels just outside what `inner` has painted that `outer` has painted too. */
function seam(outer: Sketch, inner: Sketch): [number, number][] {
  const at: [number, number][] = [];
  for (let y = 0; y < outer.height; y++) {
    for (let x = 0; x < outer.width; x++) {
      if (inner.filled(x, y) || !outer.filled(x, y)) continue;
      const by = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => inner.filled(x + dx!, y + dy!));
      if (by) at.push([x, y]);
    }
  }
  return at;
}

/**
 * A moth from above (the family's shape since 1.3's F3), 16 or 24 across: two wings a side, the
 * forewing (`W`) swept out to a rounded point with its spot (`s`), and the rounder hindwing (`w`)
 * tucked under it with a line between them, so it reads as a moth and not a leaf; a fuzzy body
 * (`b`) of head, thorax and tapering abdomen, two dark eyes (`e`) and feathery antennae (`a`).
 * Raised, the wings lift and narrow. A luna's hindwings trail long tails.
 */
export function mothShape(size: Size, up: boolean, tails: boolean): SpriteSource {
  const { k } = scaleOf(size);
  const s = new Sketch(size, size);
  const hind = new Sketch(size, size);
  const fore = new Sketch(size, size);
  if (up) {
    hind.ellipse(8.5 * k, 13.5 * k, 3 * k, 3.5 * k, 'w');
    if (tails)
      polygon(
        hind,
        [
          [8, 15],
          [10.5, 15.5],
          [9.5, 21.5],
          [7.5, 21],
        ],
        k,
        'w',
      );
    polygon(
      fore,
      [
        [11, 7.5],
        [6, 1.5],
        [3.5, 2.5],
        [4.5, 6],
        [7.5, 11],
        [11, 11.5],
      ],
      k,
      'W',
    );
    fore.ellipse(5.5 * k, 4 * k, 1.2 * k, 1.2 * k, 's');
  } else {
    hind.ellipse(6.5 * k, 15.5 * k, 4.4 * k, 4.2 * k, 'w');
    if (tails)
      polygon(
        hind,
        [
          [5, 16],
          [9, 17],
          [7, 23.5],
          [4.5, 23],
        ],
        k,
        'w',
      );
    polygon(
      fore,
      [
        [11, 8],
        [3.5, 2],
        [1, 2.5],
        [0.5, 5.5],
        [2, 10],
        [6, 12],
        [11, 12.5],
      ],
      k,
      'W',
    );
    fore.ellipse(4 * k, 6 * k, 1.6 * k, 1.6 * k, 's');
  }
  hind.ellipse((up ? 9 : 5) * k, (up ? 14 : 17) * k, 1 * k, 1 * k, 's');
  const wing = new Sketch(size, size).stamp(hind, 0, 0);
  for (const [x, y] of seam(hind, fore)) wing.set(x, y, 'o');
  wing.stamp(fore, 0, 0);
  s.stamp(wing, 0, 0).stamp(wing, 0, 0, { flipX: true });
  // The body over the wings' roots, the antennae feathered with a tick or two along each.
  s.ellipse(12 * k, 9.5 * k, 2.2 * k, 2.6 * k, 'b');
  s.ellipse(12 * k, 15 * k, 1.6 * k, 4.6 * k, 'b');
  s.ellipse(12 * k, 6.5 * k, 1.8 * k, 1.5 * k, 'b');
  const feeler = new Sketch(size, size);
  stroke(feeler, [11, 5], [7.5, 1], k, 'a');
  if (size === 24) feeler.set(9, 2, 'a').set(8, 3, 'a');
  s.stamp(feeler, 0, 0).stamp(feeler, 0, 0, { flipX: true });
  s.outline((key) => (key === 'a' ? null : 'o'));
  if (size === 24) s.set(10, 6, 'e').set(13, 6, 'e');
  return s.toSource();
}

/**
 * A fish's forked tail (1.3's F3), in the 24's pixels: two lobes fanned back from a narrow wrist
 * at `root` (its middle at `y`), `reach` long; flicked, it tilts up. The wrist is what makes a
 * fish's shadow a fish and not a pebble.
 */
export function forkedTail(
  s: Sketch,
  k: number,
  root: number,
  y: number,
  reach: number,
  flick: boolean,
  key = 'f',
): void {
  const tip = root - reach;
  const lift = flick ? 1.5 : 0;
  const spread = reach * 0.8;
  polygon(
    s,
    [
      [root + 2, y - 1.6],
      [root, y - 1.6],
      [tip, y - spread - lift],
      [tip + reach * 0.4, y - lift * 0.5],
      [tip, y + spread - lift],
      [root, y + 1.6],
      [root + 2, y + 1.6],
    ],
    k,
    key,
  );
}

type FishKind = 'minnow' | 'koi' | 'carp';

/**
 * A fish side on, facing right (the family's shape since 1.3's F3), 16 or 24 across: a body
 * (`f`) rounder at the head and narrowing to a wrist, a forked tail, a fin on its back and one
 * under it, a round eye (`e`) and a smile. A minnow is small and slim; a koi has patches (`s`);
 * a carp is deep, with a whisker at its lip.
 */
export function fishShape(size: Size, flick: boolean, kind: FishKind): SpriteSource {
  const { k, at } = scaleOf(size);
  const s = new Sketch(size, size);
  const slim = kind === 'minnow';
  const depth = kind === 'carp' ? 4.8 : slim ? 3.2 : 4;
  const head = slim ? 18 : 19;
  const cx = slim ? 13 : 12.5;
  const half = slim ? 6 : 7.5;
  forkedTail(s, k, cx - half + 1.5, 12, slim ? 4.5 : 5.5, flick);
  // Its back fin, pointed and leaning back, and a small one underneath.
  polygon(
    s,
    [
      [cx - 2.5, 12 - depth + 1],
      [cx - 1.5, 12 - depth - (slim ? 1.5 : 2.5)],
      [cx + 2.5, 12 - depth + 0.5],
    ],
    k,
    'f',
  );
  polygon(
    s,
    [
      [cx - 1, 12 + depth - 1],
      [cx - 2.5, 12 + depth + 1.5],
      [cx + 1.5, 12 + depth - 0.5],
    ],
    k,
    'f',
  );
  s.ellipse(cx * k, 12 * k, half * k, depth * k, 'f');
  if (kind === 'koi') {
    s.ellipse(11 * k, 10.5 * k, 2.2 * k, 1.6 * k, 's');
    s.ellipse(15.5 * k, 13 * k, 1.6 * k, 1.2 * k, 's');
  } else if (kind === 'carp') {
    for (let x = at(8); x <= at(16); x += 2) s.set(x, at(11), 's');
  } else {
    s.rect(at(10), at(12), at(5), 1, 's');
  }
  s.outline((key) => (key === 'f' || key === 's' ? 'o' : null));
  if (size === 24) {
    s.rect(head - 1, 10, 2, 2, 'e');
    s.set(head + 1, 13, 'o').set(head, 13, 'o');
    if (kind === 'carp') s.line(head + 2, 14, head + 3, 16, 'o');
  } else {
    s.set(at(head), at(11), 'e');
    if (kind === 'carp') s.set(at(head) + 1, at(14), 'o').set(at(head) + 2, at(15), 'o');
  }
  return s.toSource();
}

/**
 * A round, deep-bodied fish (1.3's F3 gave it a wrist and a forked tail, so its shadow reads),
 * 16 or 24 across: the pumpkinseed with a dark spot at its gill (`s`), the snowglobe fish with
 * flecks of snow, or the blue moonfish with a pale crescent (`m`) on its side; a light belly
 * (`b`), a fin on its back and one under it.
 */
export function roundFishShape(size: Size, flick: boolean, mark: 'spot' | 'moon'): SpriteSource {
  const { k, at } = scaleOf(size);
  const s = new Sketch(size, size);
  forkedTail(s, k, 8.5, 12, 6, flick);
  polygon(
    s,
    [
      [10, 8],
      [11.5, 4.5],
      [15.5, 7.5],
    ],
    k,
    'f',
  );
  polygon(
    s,
    [
      [11, 16],
      [10, 19],
      [14, 16.5],
    ],
    k,
    'f',
  );
  s.ellipse(14 * k, 12 * k, 6 * k, 5 * k, 'f');
  s.ellipse(15 * k, 14.5 * k, 4 * k, 2 * k, 'b');
  if (mark === 'spot') {
    s.set(at(17), at(12), 's');
    s.set(at(13), at(10), 's').set(at(11), at(13), 's');
  } else {
    const crescent =
      size === 16
        ? [
            [9, 6],
            [8, 7],
            [8, 8],
            [9, 9],
          ]
        : [
            [13, 8],
            [12, 9],
            [11, 10],
            [11, 11],
            [11, 12],
            [12, 13],
            [13, 14],
            [14, 8],
            [14, 14],
          ];
    for (const [x, y] of crescent) s.set(x!, y!, 'm');
  }
  s.outline((key) => (key === 'm' ? null : 'o'));
  if (size === 24) {
    s.rect(17, 10, 2, 2, 'e');
    s.set(19, 13, 'o');
  } else {
    s.set(at(18), at(11), 'e');
  }
  return s.toSource();
}

/**
 * The owl-eye moth's own hindwings: each spot an eye looking back, a dark pupil (`k`) ringed in
 * the spot's colour, so the name reads at a glance.
 */
export function owlEyed(source: SpriteSource): SpriteSource {
  const height = source.rows.length;
  const at = (x: number, y: number) => source.rows[y]?.[x];
  return touched(source, (x, y, key) => {
    if (y < height / 2) return key;
    if (key === 's') return 'k';
    const ringed = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(([dx, dy]) => at(x + dx!, y + dy!) === 's');
    return key === 'w' && ringed ? 's' : key;
  });
}

/**
 * The skull beetle's own back (1.3's F3): a little smiling skull (`s`, its eyes and teeth `h`)
 * on its shell in place of the family's spots, so its name reads. At 16 or at 24.
 */
export function skulled(source: SpriteSource): SpriteSource {
  const big = source.rows.length === WORLD;
  const skull = big
    ? { x: 9, y: 10, rows: ['.ssss.', 'ssssss', 'shsshs', 'ssssss', '.shhs.', '..ss..'] }
    : { x: 5, y: 9, rows: ['.ssss.', 'shsshs', 'ssssss', '.s..s.'] };
  return touched(source, (x, y, key) => {
    const row = skull.rows[y - skull.y];
    const mark = row?.[x - skull.x];
    if (mark && mark !== '.' && (key === 'W' || key === 'w' || key === 's')) return mark;
    return key === 's' ? 'W' : key;
  });
}

/** The tombstone toad's markings: a pale cross on its brow (`c`) and dark warts (`k`). */
export function tombstoned(source: SpriteSource): SpriteSource {
  const cross = new Set(['12,11', '12,12', '12,13', '11,12', '13,12']);
  const warts = new Set(['6,15', '17,16', '9,12', '15,12', '4,17', '20,17']);
  return touched(source, (x, y, key) => {
    if (key !== 'g' && key !== 's') return key;
    if (cross.has(`${x},${y}`)) return 'c';
    return warts.has(`${x},${y}`) ? 'k' : key;
  });
}

/**
 * The reed frog's own stripe (`c`), pale along each flank, sloping out and down from under its
 * head to its back legs (1.3's F3: it sat by its mouth and read as two tusks).
 */
export function striped(source: SpriteSource): SpriteSource {
  const stripe = new Set(['5,14', '4,15', '3,16', '2,17', '18,14', '19,15', '20,16', '21,17']);
  return touched(source, (x, y, key) =>
    (key === 'g' || key === 's') && stripe.has(`${x},${y}`) ? 'c' : key,
  );
}

// ---- 1.4's G1 (decision 370): the shinies, every critter in a second palette, no new grids ------

/**
 * The colours a shiny is recoloured into, each a ramp's base (`ramp`), so its shading still runs
 * from the night's plum to candlelight like everything else in the game. Mostly what a critter
 * of that family never is: a golden bat, a rose koi, a pearl moth.
 */
export const GEMS = {
  gold: C.gold,
  rose: C.rose,
  blush: C.hairPink,
  pearl: mix(C.skinGhostly, C.blossom, 0.45),
  mint: C.mint,
  jade: mix(C.mint, C.teal, 0.5),
  emerald: C.leaf,
  frost: C.ice,
  sky: C.sky,
  sapphire: C.blueFabric,
  midnight: C.navy,
  amethyst: C.lavender,
  lilac: C.hairLavender,
  plum: C.plumLight,
  ruby: C.scarlet,
  coral: C.coral,
  peach: mix(C.coral, C.candle, 0.5),
  copper: C.copper,
  silver: C.silver,
} as const;

export type Gem = keyof typeof GEMS;

/**
 * How a critter shines: one gem over the whole of it, or a gem with an `accent` gem on some of its
 * keys (a snail's shell, a frog's spots, an orb pair's other orb), and `keep` for keys left their
 * own colour (a lantern fish's lamp, a peacock jumper's fan). The eyes, their glints and the ink
 * are always kept, so a shiny is the same creature looking back.
 */
export type Shine = Gem | { gem: Gem; accent?: Gem; keys?: string; keep?: string };

/** The keys a shiny never recolours: eyes, their glints and fangs. */
const EYES = 'eEF';

/** How light a colour looks, 0 to 1. */
function lightness(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return (0.2126 * ((n >> 16) & 0xff) + 0.7152 * ((n >> 8) & 0xff) + 0.0722 * (n & 0xff)) / 255;
}

/**
 * A palette recoloured to a shine (1.4's G1): each colour of it moved onto the gem's ramp by how
 * light it is among the critter's own colours and how light it is at all, so its shadows, lights,
 * spots and outline keep their places and the whole reads as the same critter in another colour.
 * Ink and the eyes stay as they are.
 */
export function shinePalette(palette: Palette, shine: Shine): Palette {
  const { gem, accent, keys = '', keep = '' } = typeof shine === 'string' ? { gem: shine } : shine;
  const recolours = (key: string, colour: string | null): colour is string =>
    colour !== null && colour !== C.ink && !EYES.includes(key) && !keep.includes(key);
  const colours = [
    ...new Set(Object.entries(palette).flatMap(([k, v]) => (recolours(k, v) ? [v] : []))),
  ].sort((a, b) => lightness(a) - lightness(b));
  const toneOf = (colour: string) => {
    const rank = colours.length > 1 ? colours.indexOf(colour) / (colours.length - 1) : 0.5;
    const light = Math.min(1, Math.max(0, (lightness(colour) - 0.1) / 0.85));
    return 1 + Math.round((rank * 0.6 + light * 0.4) * 3);
  };
  return Object.fromEntries(
    Object.entries(palette).map(([key, colour]) => {
      if (!recolours(key, colour)) return [key, colour];
      const on = accent && keys.includes(key) ? accent : gem;
      return [key, ramp(GEMS[on])[toneOf(colour)]!];
    }),
  );
}

/**
 * Every critter's shiny (1.4's G1, decision 370): a surprising colour that's still pretty, picked
 * to be what its plain self isn't. A legendary one's is the grandest.
 */
export const SHINIES: Record<CritterId, Shine> = {
  lunaMoth: { gem: 'blush', accent: 'gold', keys: 's' },
  candleMoth: 'lilac',
  owlEyeMoth: { gem: 'frost', accent: 'gold', keys: 's' },
  ghostMoth: 'mint',
  pumpkinBat: 'gold',
  velvetBat: 'jade',
  vampireBat: 'silver',
  lilyFrog: 'rose',
  pumpkinToad: 'amethyst',
  glowToad: { gem: 'ruby', accent: 'gold', keys: 's' },
  greenOrb: 'blush',
  blueOrb: 'gold',
  orbPair: { gem: 'blush', accent: 'gold', keys: 'hd' },
  skullBeetle: 'jade',
  jewelBeetle: 'emerald',
  firefly: { gem: 'sapphire', keep: 'tT' },
  ghostMinnow: 'gold',
  booKoi: 'rose',
  lanternFish: { gem: 'jade', keep: 'l' },
  toadstoolToad: { gem: 'frost', accent: 'amethyst', keys: 'cCq' },
  mossBeetle: 'copper',
  wisp: 'mint',
  mistNewt: { gem: 'gold', accent: 'ruby', keys: 's' },
  moonCarp: 'peach',
  ghostPike: 'amethyst',
  lanternBat: 'sky',
  wishingMoth: { gem: 'gold', accent: 'sapphire', keys: 's' },
  monarch: 'sky',
  raindropFrog: 'coral',
  veilMoth: 'amethyst',
  pumpkinseed: 'sapphire',
  catfish: 'gold',
  fogEel: 'coral',
  blueMoonfish: { gem: 'gold', accent: 'pearl', keys: 'm' },
  tombstoneToad: { gem: 'pearl', accent: 'mint', keys: 's' },
  mourningCloak: { gem: 'jade', keep: 'pq' },
  reedFrog: 'sapphire',
  ladybug: 'sky',
  herculesBeetle: 'amethyst',
  axolotl: 'gold',
  glowJelly: 'mint',
  pumpkinSnail: { gem: 'pearl', accent: 'amethyst', keys: 'sSlk', keep: 'c' },
  booSlug: 'mint',
  glowworm: { gem: 'plum', keep: 'tT' },
  woollyBear: { gem: 'pearl', accent: 'blush', keys: 'rRf', keep: 'c' },
  bowSpider: { gem: 'gold', accent: 'sky', keys: 'pP' },
  moonCricket: 'ruby',
  fiddleHopper: 'blush',
  twigKnight: { gem: 'silver', keep: 'p' },
  rolyPoly: 'sky',
  wiggleWorm: 'gold',
  goldenSnail: { gem: 'pearl', accent: 'midnight', keys: 'sSlk', keep: 'cg' },
  fruitBat: 'peach',
  mudPuppy: { gem: 'pearl', accent: 'ruby', keys: 'gG' },
  crawdad: 'sapphire',
  longEaredBat: 'lilac',
  ghostBat: 'rose',
  snowMoth: 'blush',
  frostBeetle: 'rose',
  snowglobeFish: 'rose',
  // Under the winter ice (1.4's G3): warm where the plain are cold.
  icicleSmelt: 'gold',
  bobblePerch: { gem: 'ruby', accent: 'gold', keys: 'p', keep: 'w' },
  auroraTrout: { gem: 'midnight', accent: 'gold', keys: 'aA' },
  coldMoonSturgeon: { gem: 'gold', accent: 'pearl', keys: 'p' },
  confettiMoth: { gem: 'midnight', keep: 'pqr' },
  lovebug: 'mint',
  luckyFrog: { gem: 'gold', accent: 'emerald', keys: 'skK' },
  bunnyBat: 'sky',
  sparklerOrb: 'amethyst',
  turkeyTailMoth: 'plum',
  baubleBeetle: { gem: 'emerald', keep: 'h' },
  zebraJumper: 'blush',
  boldJumper: 'copper',
  peacockJumper: { gem: 'gold', keep: 'pqr' },
};
