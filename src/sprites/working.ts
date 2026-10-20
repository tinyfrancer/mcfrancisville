import type { Build } from '../data/builds';
import { WORKS } from '../data/work';
import type { WorkId } from '../types/ids';
import {
  arm,
  armsBody,
  bodyOf,
  DOLL_HEIGHT,
  DOLL_WIDTH,
  forearm,
  measureOf,
  mirror,
  viewOf,
  type ActionArms,
  type PoseBody,
  type View,
} from './doll';
import { PALETTE as C, ramp } from './palette';
import { Sketch } from './sketch';
import type { Palette } from './sprite';

/*
 * Her neighbours at their jobs (V1's E3, decision 282): for each job, the arms that do it (an
 * `ActionArms` over a standing body, as her action poses are) and what's in their hands, two
 * frames of each, drawn for the one way they face to do it (`WORKS[work].faces`). Maude reads in
 * a sheet of her own (`sprites/villagers.ts`).
 */

/** Something held, drawn behind the arms that hold it, or in front of them. */
export interface Held {
  rows: readonly string[];
  palette: Palette;
  /** Over their hands, not under. */
  front?: true;
  /** What of it glows after dark, as a lantern's flame. */
  lit?: Palette;
}

interface WorkFrame {
  arms: ActionArms;
  held: readonly Held[];
}

const sketch = () => new Sketch(DOLL_WIDTH, DOLL_HEIGHT);

/** What a held thing was before its outline, and the outline's keys, to draw it again wider. */
const UNLINED = new WeakMap<
  readonly string[],
  { rows: string[]; outline: Record<string, string> }
>();

/** A held thing outlined all round, each edge in the darkest tone of the colour it wraps. */
function outlined(s: Sketch, palette: Palette, front?: true, lit?: Palette): Held {
  const pal: Record<string, string | null> = { '.': null, ...palette };
  const outline: Record<string, string> = {};
  Object.entries(palette).forEach(([key, colour], i) => {
    if (!colour) return;
    const edge = OUTLINE_KEYS[i]!;
    outline[key] = edge;
    pal[edge] = ramp(colour)[0]!;
  });
  const bare = s.rows;
  s.outline(outline);
  const rows = s.rows;
  UNLINED.set(rows, { rows: bare, outline });
  return { rows, palette: pal, ...(front ? { front } : {}), ...(lit ? { lit } : {}) };
}

/**
 * A held thing for a broader body (1.1's A5a): its two halves moved out `spread` each side, as the
 * hands holding it are, the middle drawn on across the gap, then outlined again; or less, or not
 * at all, where that would take it off the picture.
 */
function widened(held: Held, spread: number): Held {
  const unlined = UNLINED.get(held.rows);
  if (!unlined) return held;
  if (spread < 0) return narrowed(unlined, held, -spread);
  // Never so far that its outline would fall off the edge of the picture (Gourdon's trestle).
  const cols = [...Array(DOLL_WIDTH).keys()].filter((x) =>
    unlined.rows.some((row) => row[x] !== '.'),
  );
  const out = Math.min(spread, Math.min(...cols) - 1, DOLL_WIDTH - 2 - Math.max(...cols));
  if (out <= 0) return held;
  const from = (x: number) => (x < 16 - out ? x + out : x >= 16 + out ? x - out : x < 16 ? 15 : 16);
  const s = Sketch.from({
    rows: unlined.rows.map((row) => [...row].map((_, x) => row[from(x)]!).join('')),
  });
  s.outline(unlined.outline);
  return { ...held, rows: s.rows };
}

/**
 * A held thing for a narrower body (1.1's A5b): its two halves moved in `by` each side, as the
 * hands holding it are, the columns at its middle that meet taken out, then outlined again.
 */
function narrowed(
  unlined: { rows: string[]; outline: Record<string, string> },
  held: Held,
  by: number,
): Held {
  const from = (x: number) => (x < 16 ? x - by : x + by);
  const s = Sketch.from({
    rows: unlined.rows.map((row) => [...row].map((_, x) => row[from(x)] ?? '.').join('')),
  });
  s.outline(unlined.outline);
  return { ...held, rows: s.rows };
}

/** Keys kept for outlines, none of them one a held thing paints with. */
const OUTLINE_KEYS = '0123456789';

// ---- Rufus: a bucket of flowers held before him -------------------------------------------

const BUCKET_HANDS = forearm([
  [8, 29],
  [11, 33],
  [12, 35],
]);

function bucket(sway: 0 | 1): Held {
  const s = sketch();
  // Stems, then blooms nodding one way and the other.
  for (const [x, top] of [
    [12, 28],
    [15, 26],
    [18, 27],
    [20, 29],
  ] as const) {
    s.rect(x + (top % 2 === 0 ? sway : -sway), top + 2, 1, 34 - top - 2, 'g');
  }
  const bloom = (x: number, y: number, key: string) =>
    s
      .rect(x - 1, y, 3, 2, key)
      .set(x, y - 1, key)
      .set(x, y + 2, key)
      .set(x, y, 'y');
  bloom(12 + sway, 28, 'p');
  bloom(15 - sway, 26, 'v');
  bloom(18 + sway, 27, 'p');
  bloom(20 - sway, 29, 'w');
  s.rect(17 - sway, 31, 2, 1, 'G').rect(13 + sway, 32, 2, 1, 'G');
  // The tin bucket, wider at its rim, with a band round it.
  for (let y = 34; y <= 41; y++) {
    const inset = Math.floor((y - 34) / 3);
    s.rect(10 + inset, y, 12 - 2 * inset, 1, 'm');
  }
  s.rect(10, 34, 12, 1, 'L').rect(11, 38, 10, 1, 'M');
  s.bevel('m', null, 'M');
  return outlined(s, {
    g: C.leafDark,
    G: C.leaf,
    p: C.rose,
    v: C.lavender,
    w: C.white,
    y: C.candle,
    m: C.silver,
    M: C.silverShade,
    L: C.white,
  });
}

// ---- Gourdon: sawing a plank across a trestle ----------------------------------------------

function trestle(): Held {
  const s = sketch();
  s.rect(2, 34, 28, 3, 'm').rect(2, 34, 28, 1, 'L').rect(2, 36, 28, 1, 'M');
  for (const x of [5, 25]) s.line(x, 37, x - 2, 46, 'b').line(x + 1, 37, x + 3, 46, 'b');
  s.rect(3, 41, 6, 1, 'b').rect(23, 41, 6, 1, 'b');
  return outlined(s, { m: C.wood, L: C.cream, M: C.bark, b: C.barkDark });
}

function saw(hand: number, dust: boolean): Held {
  const s = sketch();
  // The handle in his fist, and the blade running down from it into the cut.
  s.rect(hand - 1, 30, 3, 3, 'h');
  for (let i = 0; i < 6; i++) s.rect(hand + 1 + i, 32 + Math.floor(i / 2), 2, 2, 'k');
  for (let i = 0; i < 6; i += 2) s.set(hand + 1 + i, 34 + Math.floor(i / 2), 'K');
  if (dust)
    s.set(hand + 6, 38, 'd')
      .set(hand + 8, 40, 'd')
      .set(hand + 5, 42, 'd');
  return outlined(s, { h: C.pumpkinDark, k: C.silver, K: C.iron, d: C.cream });
}

// ---- Barty: on his knees with a trowel, a heap of earth before him ----------------------------

function trowel(up: boolean): Held {
  const s = sketch();
  // Kept above the fold (rows from 37 come out as he kneels), so it comes down with his hand.
  const [x, y] = up ? [11, 30] : [12, 32];
  s.rect(x - 1, y - 1, 2, 2, 'h');
  s.rect(x, y + 1, 3, 2, 'k').set(x + 1, y + 3, 'k');
  if (up) s.set(15, 35, 'e').set(17, 34, 'e');
  // The heap at his knees, which stays on the ground as he kneels.
  s.ellipse(16, 46, 7, 3, 'e').rect(9, 47, 14, 1, 'e');
  s.rect(12, 44, 4, 1, 'E').set(19, 45, 'E');
  return outlined(s, { h: C.wood, k: C.silver, e: C.soil, E: C.soilLight });
}

// ---- Wrapunzel: a tray of fresh cakes carried before her --------------------------------------

function tray(lift: 0 | 1): Held {
  const s = sketch();
  const y = 30 - lift;
  s.rect(6, y, 20, 2, 'm')
    .rect(6, y, 20, 1, 'L')
    .rect(7, y + 2, 18, 1, 'M');
  const cake = (x: number, key: string) => {
    s.rect(x, y - 3, 5, 3, 'c').rect(x, y - 1, 5, 1, 'C');
    s.rect(x, y - 5, 5, 2, key).set(x + 2, y - 6, 'r');
  };
  cake(8, 'p');
  cake(14, 'w');
  cake(20, 'p');
  return outlined(s, {
    m: C.silver,
    M: C.silverShade,
    L: C.white,
    c: C.wood,
    C: C.bark,
    p: C.roseLight,
    w: C.cream,
    r: C.scarlet,
  });
}

// ---- Nessa: lighting a lantern at dusk, a taper to its door --------------------------------

function lantern(flare: 0 | 1): Held {
  const s = sketch();
  // Its ring in her hand, its cap, the glass round the flame, and its base.
  s.rect(12, 29, 3, 1, 'i').set(12, 30, 'i').set(14, 30, 'i');
  s.rect(11, 31, 5, 1, 'i').rect(10, 32, 7, 1, 'i');
  s.rect(10, 33, 1, 6, 'i').rect(16, 33, 1, 6, 'i');
  s.rect(11, 33, 5, 6, 'g');
  s.rect(10, 39, 7, 1, 'i').rect(11, 40, 5, 1, 'i');
  const flame = flare ? 3 : 2;
  s.rect(13, 38 - flame, 1, flame, 'f').set(13, 38 - flame - 1, 'F');
  if (flare) s.set(12, 37, 'f').set(14, 37, 'f');
  // The taper from her other hand, its tip alight.
  s.line(20, 34, 17, 36, 't');
  s.set(17 - flare, 36, 'F');
  return outlined(
    s,
    { i: C.iron, g: C.cream, f: C.candle, F: C.candleBright, t: C.wood },
    undefined,
    {
      f: C.candle,
      F: C.candleBright,
      g: C.cream,
    },
  );
}

// ---- Ollie: his satchel open, a letter out to read the name on ----------------------------

function letter(high: boolean): Held {
  const s = sketch();
  const y = high ? 24 : 26;
  s.rect(10, y, 8, 5, 'w').rect(10, y + 4, 8, 1, 'W');
  s.line(10, y, 13, y + 2, 'W').line(17, y, 14, y + 2, 'W');
  s.set(13, y + 2, 'r').set(14, y + 2, 'r');
  // The satchel's flap thrown back, and another letter waiting in it.
  s.rect(20, 33, 7, 2, 'b').rect(20, 33, 7, 1, 'B');
  s.rect(22, 35, 4, 1, high ? 'w' : 'W');
  return outlined(s, { w: C.white, W: C.creamShade, r: C.scarlet, b: C.wood, B: C.bark }, true);
}

// ---- Scarah: a little can, tipped over the beds -----------------------------------------------

function wateringCan(drop: 0 | 1): Held {
  const s = sketch();
  // Held out low on the viewer's left, its spout down and away.
  s.rect(4, 34, 6, 5, 'm').rect(4, 34, 6, 1, 'L').rect(5, 38, 5, 1, 'M');
  s.rect(6, 32, 3, 1, 'm').set(5, 33, 'm').set(9, 33, 'm');
  s.line(3, 36, 0, 39, 'm');
  s.rect(0, 39, 2, 1, 'L');
  const drops = drop
    ? [
        [0, 42],
        [1, 45],
      ]
    : [
        [1, 41],
        [0, 44],
      ];
  for (const [x, y] of drops) s.set(x!, y!, 'd');
  return outlined(s, { m: C.moss, M: C.mossDark, L: C.mossLight, d: C.waterLight }, true);
}

// ---- Hazel: at her little telescope on its legs, looking up ---------------------------------

function telescope(twinkle: 0 | 1): Held {
  const s = sketch();
  // The tripod's legs, then the tube from her eye up toward the sky.
  s.line(25, 30, 21, 47, 'b').line(26, 30, 30, 47, 'b').line(25, 31, 26, 47, 'B');
  s.rect(24, 28, 4, 3, 'i');
  for (let i = 0; i < 9; i++) s.rect(22 + i, 20 - i, 2, 3, 'm');
  s.rect(21, 20, 2, 3, 'i').rect(30, 10, 2, 4, 'g');
  s.bevel('m', 'L', 'M');
  const star = twinkle ? [29, 4] : [27, 6];
  s.set(star[0]!, star[1]!, 'y');
  if (twinkle) s.set(28, 4, 'y').set(30, 4, 'y').set(29, 3, 'y').set(29, 5, 'y');
  return outlined(s, {
    b: C.wood,
    B: C.bark,
    i: C.iron,
    m: C.navy,
    L: C.sky,
    M: C.navyShade,
    g: C.gold,
    y: C.candleBright,
  });
}

// ---- Boothoven: conducting, his baton up and down ------------------------------------------

function baton(hand: readonly [number, number]): Held {
  const s = sketch();
  s.line(hand[0], hand[1], hand[0] - 3, hand[1] - 5, 'w');
  s.set(hand[0], hand[1], 'k');
  return outlined(s, { w: C.bone, k: C.ink });
}

// ---- Agatha: stirring her cauldron with a long ladle -----------------------------------------

function ladle(hand: readonly [number, number]): Held {
  const s = sketch();
  s.line(hand[0], hand[1], hand[0] + 5, hand[1] + 9, 'h');
  s.rect(hand[0] + 4, hand[1] + 9, 3, 2, 'h');
  return outlined(s, { h: C.wood });
}

// ---- Cody: a cup of coffee, steaming ------------------------------------------------------

function coffee(steam: 0 | 1): Held {
  const s = sketch();
  s.rect(11, 27, 5, 5, 'm').rect(11, 27, 5, 1, 'c').rect(16, 28, 1, 3, 'm');
  s.rect(12, 30, 3, 1, 'M');
  const wisps = steam
    ? [
        [12, 25],
        [13, 24],
        [12, 23],
        [14, 21],
      ]
    : [
        [13, 25],
        [14, 24],
        [13, 22],
        [12, 21],
      ];
  for (const [x, y] of wisps) s.set(x!, y!, 's');
  return outlined(s, { m: C.maroon, M: C.maroonShade, c: C.bark, s: C.ghost });
}

// ---- Wrapunzel: a mixing bowl on her hip, the spoon going round (V1's P4) -------------------

function mixingBowl(round: 0 | 1): Held {
  const s = sketch();
  // The spoon first, so the bowl's rim comes over its foot.
  const [x, y] = round ? [13, 25] : [19, 26];
  s.line(x, y, 16, 32, 'h').set(x, y, 'H');
  // The bowl, a wide one, and the batter in it.
  s.ellipse(16, 34, 7, 4, 'b').rect(9, 33, 14, 1, 'B').rect(10, 32, 12, 1, 'c');
  s.rect(10 + round, 32, 2, 1, 'C').rect(18 - round, 32, 2, 1, 'C');
  s.bevel('b', 'L', 'M');
  return outlined(s, {
    h: C.wood,
    H: C.bark,
    b: C.cream,
    B: C.creamShade,
    L: C.white,
    M: C.creamShade,
    c: C.gold,
    C: C.pumpkin,
  });
}

// ---- Rob Boo: his rubber stamp, up and down onto a paper (V1's P4) -------------------------

function stampAndPaper(down: 0 | 1): Held {
  const s = sketch();
  // The paper in his near hand, with the last APPROVED on it in red.
  s.rect(6, 29, 9, 7, 'w').rect(6, 35, 9, 1, 'W');
  s.rect(8, 31, 5, 1, 'r').rect(8, 33, 4, 1, 'r');
  // The stamp in his other hand: a knob, a handle and the block, coming down onto the paper.
  const y = down ? 27 : 22;
  s.rect(19, y, 3, 2, 'k')
    .rect(20, y + 2, 1, 2, 'h')
    .rect(18, y + 4, 5, 2, 'h');
  s.rect(18, y + 6, 5, 1, 'r');
  if (down) s.set(16, 30, 'r').set(24, 31, 'r');
  return outlined(s, { w: C.white, W: C.creamShade, r: C.scarlet, k: C.plum, h: C.wood }, true);
}

// ---- The jobs, two frames each ----------------------------------------------------------

function two(make: (frame: 0 | 1) => WorkFrame): readonly [WorkFrame, WorkFrame] {
  return [make(0), make(1)];
}

const TRAY_HANDS = (lift: 0 | 1) =>
  forearm([
    [8, 29],
    [10, 31 - lift],
    [11, 31 - lift],
  ]);

// ---- On the frozen pond in winter (V1's L4): white skates, arms out for balance ------------

/** A pair of white skates on silver blades, over their feet, one foot a pixel ahead as they glide. */
function skates(glide: 0 | 1): Held {
  const s = sketch();
  for (const [x, lift] of [
    [10, glide],
    [17, 1 - glide],
  ] as const) {
    s.rect(x + 1, 43 - lift, 4, 3, 'w').rect(x + 1, 43 - lift, 4, 1, 'W');
    s.rect(x, 46 - lift, 6, 1, 'b');
    s.set(x + 5, 45 - lift, 'b');
  }
  return { ...outlined(s, { w: C.white, W: C.cream, b: C.silver }), front: true };
}

/** An arm held out to the side for balance, from the shoulder, its hand up or down a little. */
const balancing = (up: 0 | 1) =>
  arm([
    [8, 27],
    [5, 28 - up * 2],
    [2, 29 - up * 3],
    [1, 29 - up * 3],
  ]);

const SKATING: readonly [WorkFrame, WorkFrame] = two((f) => ({
  arms: { left: balancing(f), right: mirror(balancing(f === 1 ? 0 : 1)) },
  held: [skates(f)],
}));

const FRAMES: Record<Exclude<WorkId, 'reading'>, readonly [WorkFrame, WorkFrame]> = {
  flowers: [
    { arms: { left: BUCKET_HANDS, right: mirror(BUCKET_HANDS) }, held: [bucket(0)] },
    { arms: { left: BUCKET_HANDS, right: mirror(BUCKET_HANDS) }, held: [bucket(1)] },
  ],
  sawing: two((f) => {
    const hand = f ? 10 : 7;
    return {
      arms: {
        left: forearm([
          [8, 29],
          [hand, 31],
          [hand, 31],
        ]),
        right: forearm([
          [23, 29],
          [22, 32],
          [21, 34],
        ]),
      },
      held: [trestle(), saw(hand, f === 1)],
    };
  }),
  digging: [
    {
      arms: {
        left: forearm([
          [8, 29],
          [10, 31],
          [12, 32],
        ]),
        right: mirror(
          forearm([
            [8, 29],
            [9, 32],
            [10, 34],
          ]),
        ),
      },
      held: [trowel(false)],
    },
    {
      arms: {
        left: forearm([
          [8, 29],
          [9, 30],
          [11, 30],
        ]),
        right: mirror(
          forearm([
            [8, 29],
            [9, 32],
            [10, 34],
          ]),
        ),
      },
      held: [trowel(true)],
    },
  ],
  tray: two((lift) => ({
    arms: { left: TRAY_HANDS(lift), right: mirror(TRAY_HANDS(lift)) },
    held: [{ ...tray(lift), front: true as const }],
  })),
  lantern: two((flare) => ({
    arms: {
      left: forearm([
        [8, 29],
        [11, 30],
        [13, 30],
      ]),
      right: forearm([
        [23, 29],
        [22, 32],
        [20, 34],
      ]),
    },
    held: [lantern(flare)],
  })),
  post: two((f) => ({
    arms: {
      left: forearm([
        [8, 29],
        [10, f ? 28 : 30],
        [12, f ? 27 : 29],
      ]),
      right: forearm([
        [23, 29],
        [24, 32],
        [24, f ? 34 : 35],
      ]),
    },
    held: [letter(f === 1)],
  })),
  watering: two((drop) => ({
    arms: {
      left: forearm([
        [8, 29],
        [7, 32],
        [7, 34],
      ]),
    },
    held: [wateringCan(drop)],
  })),
  telescope: two((t) => ({
    arms: {
      near: arm([
        [15, 27],
        [19, 28],
        [22, 24 - t],
        [23, 23 - t],
      ]),
    },
    held: [telescope(t)],
  })),
  conducting: two((f) => {
    const high = arm([
      [8, 27],
      [4, 22],
      [4, 17],
      [5, 15],
    ]);
    const low = arm([
      [8, 27],
      [4, 26],
      [2, 22],
      [2, 21],
    ]);
    const up = f ? low : high;
    const other = f ? high : low;
    const hand = up.points[up.points.length - 1]!;
    return { arms: { left: up, right: mirror(other) }, held: [baton(hand)] };
  }),
  stirring: two((f) => {
    const hand = f ? ([23, 32] as const) : ([25, 31] as const);
    return {
      arms: {
        near: arm([[15, 27], [19, 30], [hand[0] - 2, hand[1]], hand]),
      },
      held: [ladle(hand)],
    };
  }),
  coffee: two((steam) => ({
    arms: {
      left: forearm([
        [8, 29],
        [10, 31],
        [12, 30],
      ]),
    },
    held: [{ ...coffee(steam), front: true as const }],
  })),
  skating: SKATING,
  baking: two((round) => ({
    arms: {
      left: forearm([
        [8, 29],
        [10, 32],
        [11, 33],
      ]),
      right: forearm([
        [23, 29],
        [round ? 20 : 22, 28],
        [round ? 17 : 19, 27],
      ]),
    },
    held: [{ ...mixingBowl(round), front: true as const }],
  })),
  stamping: two((down) => ({
    arms: {
      left: forearm([
        [8, 29],
        [9, 31],
        [10, 32],
      ]),
      right: forearm([
        [23, 29],
        [22, down ? 29 : 25],
        [21, down ? 28 : 23],
      ]),
    },
    held: [stampAndPaper(down)],
  })),
};

/** A job's body and what's in their hands, for the view they face to do it, by frame. */
export interface WorkPose {
  body: PoseBody;
  held: readonly Held[];
}

const POSES = new Map<string, WorkPose>();

/**
 * A neighbour at their job (`frame` 0 or 1), facing the way the job faces, on the body of their
 * build; null for a job drawn another way (Maude's reading) or a view it isn't done in. On a
 * broader body, what's in their hands is as much wider as their hands are further apart, and on a
 * narrower one as much narrower.
 */
export function workPose(
  work: WorkId,
  view: View,
  frame: number,
  build: Build = 'regular',
): WorkPose | null {
  if (work === 'reading' || view !== viewOf(WORKS[work].faces)) return null;
  const key = `${work}:${frame % 2}:${build}`;
  let pose = POSES.get(key);
  if (!pose) {
    const f = FRAMES[work][frame % 2]!;
    const spread = view === 'side' ? 0 : measureOf(bodyOf(build)[view][0]!).spread;
    pose = { body: armsBody(view, f.arms, build), held: f.held.map((h) => widened(h, spread)) };
    POSES.set(key, pose);
  }
  return pose;
}
