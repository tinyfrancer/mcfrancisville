import type { CritterId } from '../types/ids';
import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';
import { CRAWLY_ART } from './crawlies';
import { JUMPER_ART } from './jumpers';
import {
  batShape,
  cloaked,
  eel,
  fireflyFrame,
  fishShape,
  forkedTail,
  frogFace,
  hercules,
  mothShape,
  newt,
  owlEyed,
  roundFishShape,
  striped,
  tombstoned,
} from './critterLooks';

/**
 * The critters (phase 10), each 16×16 so it fits its tile and doubles as its picture in her bag.
 * Every family is one or two grids, and each critter is a palette over them.
 */
/** A frog sitting pretty. `g` skin, `G` its light tummy, `m` its mouth, `s` spots. */
const FROG: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...ooo....ooo...',
    '..ogego..ogego..',
    '..oggggggggggo..',
    '.oggsggggggsggo.',
    '.ogggmmmmmmgggo.',
    '.oGggsggggsggGo.',
    'ogGGoggggggoGGgo',
    '.ooo.oooooo.ooo.',
    '................',
  ],
};

/** Two orbs, one green (`g`, `c`) and one blue (`h`, `d`), going round each other. */
const ORB_PAIR: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '.....rrr........',
    '....rgggr.......',
    '....rgcgr.rrr...',
    '....rgggrrhhhr..',
    '.....rrr.rhdhr..',
    '.........rhhhr..',
    '..........rrr...',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

/** The pair half a turn on. */
const ORB_PAIR_TURNED: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '........rrr.....',
    '.......rhhhr....',
    '...rrr.rhdhr....',
    '..rgggrrhhhr....',
    '..rgcgr.rrr.....',
    '..rgggr.........',
    '...rrr..........',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

/** A beetle from above. `W`/`w` shell, `s` its pattern, `h` head. */
const BEETLE: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....o....o.....',
    '......o..o......',
    '.....oooooo.....',
    '...o.ohhhho.o...',
    '....oooooooo....',
    '..o.oWwsswwo.o..',
    '...owWwsswwwo...',
    '..o.owwsswwo.o..',
    '....owwsswwo....',
    '.....owwwwo.....',
    '......oooo......',
    '................',
    '................',
  ],
};

/** A firefly, its tail (`t`) lit. `w` wing, `b` body. */
const FIREFLY: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '......o..o......',
    '.......oo.......',
    '......obbo......',
    '....oowbbwoo....',
    '...owwobbowwo...',
    '...owwottowwo...',
    '....oo.tt.oo....',
    '......otto......',
    '.......oo.......',
    '................',
    '................',
    '................',
  ],
};

// ---- In town, at 32 pixels a tile (decisions.md 79) --------------------------------------------

/** The size of a critter as it's drawn in town: a little under a tile, so it reads beside her. */
const WORLD = 24;

/** Outlines everything painted in `o`, but for the keys in `bare` (a glow isn't outlined). */
function outlined(s: Sketch, bare = ''): SpriteSource {
  s.outline((key) => (bare.includes(key) ? null : 'o'));
  return s.toSource();
}

/**
 * A wisp of light (1.3's F3), 16 or 24 across: a round glow (`g`) with a brighter heart toward the
 * light (`c`) and a white gleam (`w`), rimmed in its own darkest tone (`r`), a little flame of a
 * tail flicking off behind it, two eyes (`e`) and, at 24, a smile. Flat tones, never dithered:
 * the glow after dark is what softens it. The tail flicks the other way between frames.
 */
function orbShape(size: 16 | 24, flick: boolean): SpriteSource {
  const k = size / WORLD;
  const at = (n: number) => Math.round(n * k);
  const s = new Sketch(size, size);
  const tail = new Sketch(size, size);
  tail.ellipse(8 * k, 16 * k, 3.5 * k, 3 * k, 'g');
  tail.ellipse((flick ? 4 : 4.5) * k, (flick ? 18.5 : 19.5) * k, 2 * k, 1.8 * k, 'g');
  tail.ellipse((flick ? 2 : 3) * k, (flick ? 19.5 : 21.5) * k, 1.1 * k, 1.1 * k, 'g');
  s.stamp(tail, 0, 0);
  s.ellipse(13 * k, 12 * k, 7 * k, 7 * k, 'g');
  s.ellipse(12 * k, 11 * k, 4.5 * k, 4.5 * k, 'c');
  s.rect(at(10), at(8), Math.max(1, at(2)), Math.max(1, at(2)), 'w');
  s.outline(() => 'r');
  if (size === 24) {
    s.rect(11, 12, 1, 2, 'e').rect(15, 12, 1, 2, 'e');
    s.set(13, 15, 'e');
  } else {
    s.set(7, 8, 'e').set(10, 8, 'e');
  }
  return s.toSource();
}

/** Two orbs going round each other, green and blue, close as can be. */
function orbPairWorld(turned: boolean): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  const [a, b] = turned ? [15, 8] : [8, 15];
  s.sphere(a, 10, 5, 5, 'ggc');
  s.sphere(b, 14, 5, 5, 'hhd');
  s.outline(() => 'r');
  return s.toSource();
}

/** A beetle from above: its head, its shell split down the middle, and little legs. */
function beetleWorld(): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  for (const y of [11, 14, 17]) s.rect(4, y, 16, 1, 'o');
  s.ellipse(12, 14, 6, 7, 'W');
  s.ellipse(12, 6.5, 3.5, 2.5, 'h');
  s.rect(12, 8, 1, 12, 'w').rect(11, 8, 1, 12, 'w');
  s.ellipse(9, 12, 1.5, 1.5, 's').ellipse(15, 16, 1.5, 1.5, 's');
  s.line(10, 4, 8, 2, 'o').line(13, 4, 15, 2, 'o');
  return outlined(s, 'o');
}

/**
 * A lantern fish (1.3's F3), 16 or 24 across: a round plum angler, its belly paler (`b`), a big
 * candle-bright eye (`e`, its pupil `k`), a wide grin with two little white teeth (`w`), a forked
 * tail, and its lure (`l`) glowing on a stalk curled up over its nose. It bobs its lure between
 * frames.
 */
function lanternFish(size: 16 | 24, bob: boolean): SpriteSource {
  const k = size / WORLD;
  const at = (n: number) => Math.round(n * k);
  const s = new Sketch(size, size);
  const lift = bob ? 1 : 0;
  forkedTail(s, k, 6.5, 13.5, 5, bob);
  s.ellipse(9 * k, 8.5 * k, 2.2 * k, 1.6 * k, 'f');
  s.ellipse(13 * k, 13.5 * k, 7 * k, 5.5 * k, 'f');
  s.ellipse(14 * k, 16.5 * k, 4.5 * k, 2 * k, 'b');
  s.outline((key) => (key === 'f' || key === 'b' ? 'o' : null));
  // The stalk from its brow, curling up and forward over its nose to the lure.
  s.line(at(14), at(8), at(15), at(5) - lift, 'o').line(
    at(15),
    at(5) - lift,
    at(18),
    at(3) - lift,
    'o',
  );
  s.ellipse(19.5 * k, (4 - lift) * k, 1.6 * k, 1.6 * k, 'l');
  if (size === 24) {
    s.rect(15, 10, 3, 3, 'e').set(17, 12, 'k');
    s.line(15, 16, 19, 15, 'o').set(16, 16, 'w').set(18, 16, 'w');
  } else {
    s.set(10, 7, 'e').line(10, 10, 12, 10, 'o');
  }
  return s.toSource();
}

/**
 * A pike, 16 or 24 across: long and lean, a jutting jaw with two little teeth (`w`), its back
 * fin set far back by its tail (1.3's F3: a forked tail on a narrow wrist, so its shadow reads).
 */
function pike(size: 16 | 24, flick: boolean): SpriteSource {
  const k = size / WORLD;
  const at = (n: number) => Math.round(n * k);
  const s = new Sketch(size, size);
  forkedTail(s, k, 6.5, 12, 6, flick);
  s.ellipse(9.5 * k, 9.5 * k, 2.5 * k, 1.5 * k, 'f').ellipse(10 * k, 14.5 * k, 2 * k, 1.2 * k, 'f');
  s.ellipse(14 * k, 12 * k, 8.5 * k, 3 * k, 'f');
  s.rect(at(20), at(12), at(3), 1, 'f');
  s.rect(at(9), at(10), at(5), 1, 's').rect(at(14), at(14), at(3), 1, 's');
  s.outline((key) => (key === 'f' || key === 's' ? 'o' : null));
  if (size === 24) s.rect(18, 10, 2, 2, 'e').set(21, 13, 'w').set(19, 13, 'w');
  else s.set(at(19), at(11), 'e');
  return s.toSource();
}

/** A fish's fanned tail, rooted at `x` and spreading back to the left; flicked, it tilts up. */
function fishTail(s: Sketch, x: number, y: number, length: number, flick: boolean): void {
  for (let i = 0; i < length; i++) {
    const half = Math.round(i * 0.7);
    const lift = flick ? Math.round(i * 0.5) : 0;
    s.rect(x - i, y - half - lift, 1, half * 2 + 1, 'f');
  }
}

/**
 * A black catfish: a long flat head with two cat's-ear points, and whiskers (`w`, paler at the tip
 * `W`) curling from its lip, two drooping under its chin and one swept up (0.2's K2).
 */
function catfish(size: 16 | 24, flick: boolean): SpriteSource {
  const k = size / WORLD;
  const s = new Sketch(size, size);
  s.ellipse(11 * k, 13 * k, 8 * k, 3.5 * k, 'f');
  s.ellipse(16 * k, 12.5 * k, 3.5 * k, 3.5 * k, 'f');
  const ear = (x: number) => {
    s.set(Math.round(x * k), Math.round(8 * k), 'f').set(Math.round(x * k), Math.round(9 * k), 'f');
    s.set(Math.round(x * k) + 1, Math.round(9 * k), 'f');
  };
  ear(14);
  ear(17);
  fishTail(s, Math.round(4 * k), Math.round(13 * k), Math.round(4 * k), flick);
  s.set(Math.round(18 * k), Math.round(11 * k), 'e');
  s.outline((key) => (key === 'w' || key === 'W' ? null : 'o'));
  for (const whisker of CATFISH_WHISKERS) {
    whisker.forEach(([x, y], i) => {
      s.set(Math.round(x * k), Math.round(y * k), i === whisker.length - 1 ? 'W' : 'w');
    });
  }
  return s.toSource();
}

/** A catfish's whiskers, in the 24-pixel fish's pixels, from its lip out to the tip. */
const CATFISH_WHISKERS: readonly (readonly [number, number])[][] = [
  [
    [20, 14],
    [21, 15],
    [22, 15],
    [23, 16],
  ],
  [
    [19, 15],
    [20, 16],
    [20, 17],
    [21, 18],
  ],
  [
    [20, 13],
    [21, 12],
    [22, 12],
    [23, 11],
  ],
];

/** A toadstool cap in its own keys (`c` cap, `C` lit, `S` spot), for a toad to wear. */
function cap(s: Sketch, cx: number, y: number, r: number): void {
  const top = new Sketch(s.width, s.height);
  top.sphere(cx, y + r * 0.7, r, r * 0.7, 'ccC');
  for (let j = Math.ceil(y + r * 0.7); j < s.height; j++) top.rect(0, j, s.width, 1, CLEAR);
  top.set(Math.round(cx - r / 2), Math.round(y + 2), 'S');
  top.set(Math.round(cx + r / 3), Math.round(y + 1), 'S');
  s.stamp(top, 0, 0);
}

/** A toad wearing a toadstool for a hat. */
function toadstoolToad(size: 16 | 24): SpriteSource {
  const s = new Sketch(size, size);
  const frog = size === 16 ? FROG : FROG_WORLD;
  s.stamp(frog, 0, 0);
  // Its outline is ink already; the cap sits on its head, between its eyes.
  if (size === 24) cap(s, 12, 2, 7);
  else cap(s, 8, 2, 5);
  s.outline((k) => (k === 'c' || k === 'C' || k === 'S' ? 'q' : null));
  return s.toSource();
}

/**
 * An axolotl face on (0.2's F1), 16 or 24 across: a wide round head with three frilly gills (`g`)
 * fanned out each side, a smile (`m`) and pink cheeks (`c`), a pale belly (`P`) and a tail curled
 * off to one side. The gills sway from one frame to the next.
 */
function axolotl(size: 16 | 24, sway: boolean): SpriteSource {
  const k = size / WORLD;
  const at = (n: number) => Math.round(n * k);
  const s = new Sketch(size, size);
  const lift = sway ? 1 : 0;
  const gill = new Sketch(size, size);
  gill.line(at(7), at(10), at(3), at(5) + lift, 'g');
  gill.line(at(6), at(12), at(1), at(11) + lift, 'g');
  gill.line(at(7), at(14), at(2), at(17) - lift, 'g');
  s.stamp(gill, 0, 0).stamp(gill, 0, 0, { flipX: true });
  s.line(at(15), at(20), at(21), at(21), 'p').line(at(15), at(19), at(20), at(20), 'p');
  s.ellipse(12 * k, 18.5 * k, 4.5 * k, 3.5 * k, 'p');
  s.ellipse(12 * k, 19 * k, 2.5 * k, 2 * k, 'P');
  s.rect(at(7), at(20), at(3), at(2), 'p').rect(at(14), at(20), at(3), at(2), 'p');
  s.ellipse(12 * k, 13 * k, 7 * k, 5 * k, 'p');
  s.set(at(9), at(12), 'e').set(at(14), at(12), 'e');
  s.line(at(10), at(15), at(13), at(15), 'm');
  if (size === 24) s.set(9, 14, 'm').set(14, 14, 'm').set(7, 14, 'c').set(16, 14, 'c');
  return outlined(s);
}

/**
 * A glowing jellyfish (0.2's F1), 16 or 24 across: a round bell (`b`, lit `B`) with a sleepy face
 * and a frilled rim (`r`), trailing soft wavy tentacles (`t`). It pulses: the bell squeezes in and
 * the tentacles draw up from one frame to the next.
 */
function jellyfish(size: 16 | 24, pulse: boolean): SpriteSource {
  const k = size / WORLD;
  const at = (n: number) => Math.round(n * k);
  const s = new Sketch(size, size);
  const rim = at(pulse ? 11 : 12);
  const width = pulse ? 6 : 7.5;
  s.sphere(12 * k, rim, width * k, (pulse ? 8 : 7) * k, 'bbB');
  for (let y = rim; y < size; y++) s.rect(0, y, size, 1, CLEAR);
  s.rect(at(12 - width) + 1, rim, at(width * 2) - 1, 1, 'r');
  const reach = at(pulse ? 20 : 22);
  for (const [n, x0] of [-1.5, -0.5, 0.5, 1.5].entries()) {
    for (let y = rim + 1; y < reach; y++) {
      const wave = Math.round(Math.sin((y + n * 2) / (1.6 * k)) * 0.8);
      s.set(at(12 + x0 * (pulse ? 2.2 : 3)) + wave, y, 't');
    }
  }
  s.set(at(10), rim - at(3), 'e').set(at(14), rim - at(3), 'e');
  return outlined(s, 't');
}

/**
 * A bat's picture with ears as long as the rest of it (0.3's C2): the long-eared bat. `ears` are
 * the ears' columns and how far up they reach; `inner` is the pink of each, a column in.
 */
function longEared(
  source: SpriteSource,
  ears: readonly { x: number; w: number }[],
  from: number,
  to: number,
): SpriteSource {
  const s = new Sketch(source.rows[0]!.length, source.rows.length).stamp(source, 0, 0);
  for (const { x, w } of ears) {
    s.rect(x, from, w, to - from, 'b');
    if (w > 1) s.rect(x + (x < s.width / 2 ? 1 : 0), from + 2, 1, to - from - 2, 'c');
  }
  s.outline((key) => (key === 'o' ? null : 'o'));
  return s.toSource();
}

const MOTH_WORLD = [mothShape(24, false, false), mothShape(24, true, false)] as const;
const LUNA_WORLD = [mothShape(24, false, true), mothShape(24, true, true)] as const;
const MOTH_SMALL = [mothShape(16, false, false), mothShape(16, true, false)] as const;
const LUNA_SMALL = [mothShape(16, false, true), mothShape(16, true, true)] as const;
const BAT_WORLD = [batShape(24, false), batShape(24, true)] as const;
const BAT_SMALL = [batShape(16, false), batShape(16, true)] as const;
const FROG_WORLD = frogFace();
const ORB_WORLD = orbShape(24, false);
const ORB_SMALL = [orbShape(16, false), orbShape(16, true)] as const;
const ORB_WORLDS = [ORB_WORLD, orbShape(24, true)] as const;
const BEETLE_WORLD = beetleWorld();

export interface CritterArt {
  /**
   * Its 16×16 picture, the first its bag icon: two frames it swaps between as it flutters, flaps,
   * bobs or swims, and a still one repeats. The HUD keeps these until it's redrawn (phase M).
   */
  frames: readonly [SpriteSource, SpriteSource];
  /** The same two frames at the town's density, 24×24, as she sees it out and about. */
  world: readonly [SpriteSource, SpriteSource];
  palette: Palette;
  /** What of it glows after dark, as a prop's lit keys do. */
  glow?: Palette;
}

const moth = (W: string, w: string, s: string, b: string, a: string = C.barkDark): CritterArt => ({
  frames: MOTH_SMALL,
  world: MOTH_WORLD,
  palette: { '.': null, o: C.ink, W, w, s, b, a, e: C.ink },
});

/** A bat's palette: its wings' finger bones a step darker than the membrane, and white fangs. */
const batPalette = (o: string, W: string, b: string, c: string, e: string): Palette => ({
  '.': null,
  o,
  W,
  v: mix(W, C.ink, 0.35),
  b,
  c,
  e,
  F: C.white,
});

const bat = (W: string, b: string, c: string, e: string): CritterArt => ({
  frames: BAT_SMALL,
  world: BAT_WORLD,
  palette: batPalette(C.ink, W, b, c, e),
});

const frog = (g: string, G: string, m: string, s: string): CritterArt => ({
  frames: [FROG, FROG],
  world: [FROG_WORLD, FROG_WORLD],
  palette: { '.': null, o: C.ink, e: C.ink, E: C.white, g, G, m, s },
});

const orb = (r: string, g: string, c: string): CritterArt => {
  const palette = { '.': null, r, g, c, w: C.white, e: C.ink };
  return {
    frames: ORB_SMALL,
    world: ORB_WORLDS,
    palette,
    glow: { r, g, c, w: C.white },
  };
};

const beetle = (W: string, w: string, s: string, h: string): CritterArt => ({
  frames: [BEETLE, BEETLE],
  world: [BEETLE_WORLD, BEETLE_WORLD],
  palette: { '.': null, o: C.ink, W, w, s, h },
});

const fish = (o: string, f: string, s: string, kind: 'minnow' | 'koi' | 'carp'): CritterArt => ({
  frames: [fishShape(16, false, kind), fishShape(16, true, kind)],
  world: [fishShape(24, false, kind), fishShape(24, true, kind)],
  palette: { '.': null, o, f, s, e: C.ink },
});

// ---- The holiday critters (V1's R5), each its family's shapes with a touch of its holiday -------

/** A grid with some of its pixels changed: `touch` says each pixel's new key, or keeps its own. */
function touched(
  source: SpriteSource,
  touch: (x: number, y: number, key: string) => string,
): SpriteSource {
  return { rows: source.rows.map((row, y) => [...row].map((key, x) => touch(x, y, key)).join('')) };
}

/** Little hearts (`k`), each three wide, with its top-left at a pixel. */
function withHearts(
  source: SpriteSource,
  at: readonly (readonly [number, number])[],
): SpriteSource {
  const heart = new Set<string>();
  for (const [x, y] of at) {
    for (const [dx, dy] of [
      [0, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ] as const) {
      heart.add(`${x + dx},${y + dy}`);
    }
  }
  return touched(source, (x, y, key) => (heart.has(`${x},${y}`) ? 'k' : key));
}

/** Confetti dotted over a moth's wings (`p`, `q`, `r`), the same dots on both frames' wings. */
const confetti = (source: SpriteSource) =>
  touched(source, (x, y, key) => {
    if (key !== 'W' && key !== 'w') return key;
    const n = (x * 7 + y * 5) % 11;
    return n === 0 ? 'p' : n === 4 ? 'q' : n === 8 ? 'r' : key;
  });

/** A turkey's tail across a moth's outer wings: every other row a darker band (`v`). */
const banded = (source: SpriteSource) =>
  touched(source, (_x, y, key) => (key === 'W' && y % 2 === 0 ? 'v' : key));

/** Sparks (`x`, `y`) fizzing round an orb, in different places each frame. */
function sparks(source: SpriteSource, at: readonly (readonly [number, number, string])[]) {
  const spark = new Map(at.map(([x, y, key]) => [`${x},${y}`, key]));
  return touched(source, (x, y, key) => spark.get(`${x},${y}`) ?? key);
}

const BUNNY_EARS = {
  frames: [
    [
      { x: 5, w: 2 },
      { x: 9, w: 2 },
    ],
    0,
    5,
  ],
  world: [
    [
      { x: 8, w: 3 },
      { x: 13, w: 3 },
    ],
    0,
    8,
  ],
} as const;

/** A critter for each big holiday but Halloween (V1's R5, decision 310). */
const HOLIDAY_ART = {
  confettiMoth: {
    ...moth(C.cream, C.lavender, C.hairPink, C.plum),
    frames: [confetti(MOTH_SMALL[0]), confetti(MOTH_SMALL[1])],
    world: [confetti(MOTH_WORLD[0]), confetti(MOTH_WORLD[1])],
    palette: {
      '.': null,
      o: C.ink,
      W: C.cream,
      w: C.lavender,
      s: C.hairPink,
      b: C.plum,
      a: C.barkDark,
      p: C.hairPink,
      q: C.sky,
      r: C.candle,
      e: C.ink,
    },
  },
  lovebug: {
    ...beetle(C.roseLight, C.rose, C.scarlet, C.ink),
    frames: [BEETLE, BEETLE],
    world: [
      withHearts(
        touched(BEETLE_WORLD, (_x, _y, key) => (key === 's' ? 'W' : key)),
        [
          [7, 10],
          [14, 13],
          [8, 16],
        ],
      ),
      withHearts(
        touched(BEETLE_WORLD, (_x, _y, key) => (key === 's' ? 'W' : key)),
        [
          [7, 10],
          [14, 13],
          [8, 16],
        ],
      ),
    ],
    palette: {
      '.': null,
      o: C.ink,
      W: C.roseLight,
      w: C.rose,
      s: C.scarlet,
      h: C.ink,
      k: C.scarlet,
    },
  },
  luckyFrog: {
    ...frog(C.leaf, C.leafLight, C.leafDark, C.gold),
    frames: [
      touched(FROG, (x, y, key) => (x >= 7 && x <= 8 && y >= 9 && y <= 10 ? 'k' : key)),
      touched(FROG, (x, y, key) => (x >= 7 && x <= 8 && y >= 9 && y <= 10 ? 'k' : key)),
    ],
    world: [
      touched(FROG_WORLD, (x, y, key) => clover(x, y) ?? key),
      touched(FROG_WORLD, (x, y, key) => clover(x, y) ?? key),
    ],
    palette: {
      '.': null,
      o: C.ink,
      e: C.ink,
      E: C.white,
      g: C.leaf,
      G: C.leafLight,
      m: C.leafDark,
      s: C.gold,
      k: C.hedgeDark,
      K: C.leafDark,
    },
  },
  bunnyBat: {
    ...bat(C.ghost, C.white, C.roseLight, C.ink),
    frames: [
      longEared(BAT_SMALL[0], ...BUNNY_EARS.frames),
      longEared(BAT_SMALL[1], ...BUNNY_EARS.frames),
    ],
    world: [
      longEared(BAT_WORLD[0], ...BUNNY_EARS.world),
      longEared(BAT_WORLD[1], ...BUNNY_EARS.world),
    ],
    palette: batPalette(C.lavenderShade, C.ghost, C.white, C.roseLight, C.ink),
  },
  sparklerOrb: {
    ...orb(C.scarlet, C.sky, C.white),
    frames: [
      sparks(ORB_SMALL[0], [
        [2, 3, 'x'],
        [13, 4, 'y'],
        [1, 8, 'y'],
        [14, 10, 'x'],
        [4, 13, 'x'],
        [11, 13, 'y'],
      ]),
      sparks(ORB_SMALL[1], [
        [3, 2, 'y'],
        [12, 2, 'x'],
        [1, 11, 'x'],
        [14, 7, 'y'],
        [7, 14, 'y'],
        [13, 13, 'x'],
      ]),
    ],
    world: [
      sparks(ORB_WORLD, [
        [3, 4, 'x'],
        [20, 5, 'y'],
        [2, 13, 'y'],
        [21, 15, 'x'],
        [6, 20, 'x'],
        [17, 21, 'y'],
        [12, 2, 'y'],
      ]),
      sparks(ORB_WORLDS[1], [
        [5, 2, 'y'],
        [18, 3, 'x'],
        [1, 10, 'x'],
        [22, 12, 'y'],
        [9, 22, 'y'],
        [20, 19, 'x'],
        [3, 18, 'x'],
      ]),
    ],
    palette: {
      '.': null,
      r: C.scarlet,
      g: C.sky,
      c: C.white,
      w: C.white,
      e: C.ink,
      x: C.candleBright,
      y: C.white,
    },
    glow: { r: C.scarlet, g: C.sky, c: C.white, w: C.white, x: C.candleBright, y: C.white },
  },
  turkeyTailMoth: {
    ...moth(C.copper, C.cream, C.pumpkin, C.bark),
    frames: [banded(MOTH_SMALL[0]), banded(MOTH_SMALL[1])],
    world: [banded(MOTH_WORLD[0]), banded(MOTH_WORLD[1])],
    palette: {
      '.': null,
      o: C.barkDark,
      W: C.copper,
      w: C.cream,
      s: C.pumpkin,
      b: C.bark,
      a: C.barkDark,
      v: C.bark,
      e: C.ink,
    },
  },
  baubleBeetle: {
    ...beetle(C.scarlet, C.scarletShade, C.white, C.gold),
    frames: [
      touched(BEETLE, (x, y, key) => (key === 's' ? 'w' : x === 6 && y === 9 ? 's' : key)),
      touched(BEETLE, (x, y, key) => (key === 's' ? 'w' : x === 6 && y === 9 ? 's' : key)),
    ],
    world: [
      touched(BEETLE_WORLD, (_x, y, key) => (key === 's' && y > 14 ? 'W' : key)),
      touched(BEETLE_WORLD, (_x, y, key) => (key === 's' && y > 14 ? 'W' : key)),
    ],
  },
} satisfies Partial<Record<CritterId, CritterArt>>;

/** A four-leaf clover on a frog's back at 24 (`k`, its stalk `K`), or nothing at that pixel. */
function clover(x: number, y: number): string | null {
  for (const [lx, ly] of [
    [10, 11],
    [13, 11],
    [10, 14],
    [13, 14],
  ] as const) {
    if (x >= lx && x < lx + 2 && y >= ly && y < ly + 2) return 'k';
  }
  return x === 12 && y === 13 ? 'K' : null;
}

const PAIR: Palette = {
  '.': null,
  r: C.ink,
  g: C.orbGreen,
  c: C.orbGreenLight,
  h: C.orbBlue,
  d: C.orbBlueLight,
};

export const CRITTER_ART: Record<CritterId, CritterArt> = {
  lunaMoth: {
    frames: LUNA_SMALL,
    world: LUNA_WORLD,
    palette: {
      '.': null,
      o: C.mossDark,
      W: C.luna,
      w: C.lunaShade,
      s: C.candle,
      b: C.white,
      a: C.bark,
      e: C.ink,
    },
    glow: { W: C.luna },
  },
  candleMoth: moth(C.cream, C.candle, C.pumpkinLight, C.creamShade),
  owlEyeMoth: {
    ...moth(C.furLight, C.fur, C.candle, C.furShade),
    frames: [owlEyed(MOTH_SMALL[0]), owlEyed(MOTH_SMALL[1])],
    world: [owlEyed(MOTH_WORLD[0]), owlEyed(MOTH_WORLD[1])],
    palette: { ...moth(C.furLight, C.fur, C.candle, C.furShade).palette, k: C.ink },
  },
  ghostMoth: {
    ...moth(C.white, C.ghost, C.lavender, C.skinGhostly, C.stoneLight),
    glow: { W: C.white },
  },
  pumpkinBat: bat(C.plum, C.iron, C.pumpkin, C.candle),
  velvetBat: bat(C.plumLight, C.plum, C.lavender, C.ghost),
  vampireBat: bat(C.maroon, C.hairBlack, C.scarlet, C.candleBright),
  lilyFrog: frog(C.leafLight, C.guac, C.leafDark, C.leafLight),
  pumpkinToad: frog(C.pumpkin, C.pumpkinLight, C.pumpkinDark, C.pumpkinShade),
  glowToad: {
    ...frog(C.teal, C.tealLight, C.tealShade, C.fireflyGlow),
    glow: { s: C.fireflyGlow },
  },
  greenOrb: orb(C.orbGreenDark, C.orbGreen, C.orbGreenLight),
  blueOrb: orb(C.orbBlueDark, C.orbBlue, C.orbBlueLight),
  orbPair: {
    frames: [ORB_PAIR, ORB_PAIR_TURNED],
    world: [orbPairWorld(false), orbPairWorld(true)],
    palette: PAIR,
    glow: { g: C.orbGreen, c: C.orbGreenLight, h: C.orbBlue, d: C.orbBlueLight },
  },
  skullBeetle: beetle(C.stoneDark, C.iron, C.bone, C.ink),
  jewelBeetle: beetle(C.sky, C.blueFabric, C.white, C.navy),
  firefly: {
    frames: [FIREFLY, FIREFLY],
    world: [fireflyFrame(false), fireflyFrame(true)],
    palette: {
      '.': null,
      o: C.ink,
      w: C.stoneLight,
      b: C.iron,
      k: C.inkFabric,
      a: C.ink,
      p: C.coral,
      W: mix(C.white, C.sky, 0.35),
      t: C.fireflyGlow,
      T: mix(C.fireflyGlow, C.white, 0.6),
    },
    glow: { t: C.fireflyGlow, T: mix(C.fireflyGlow, C.white, 0.6) },
  },
  ghostMinnow: fish(C.stoneLight, C.ghost, C.ghost, 'minnow'),
  booKoi: fish(C.plum, C.white, C.lavender, 'koi'),
  lanternFish: {
    frames: [lanternFish(16, false), lanternFish(16, true)],
    world: [lanternFish(24, false), lanternFish(24, true)],
    palette: {
      '.': null,
      o: C.ink,
      f: C.plum,
      b: C.plumLight,
      e: C.candle,
      k: C.ink,
      w: C.white,
      l: C.candleBright,
    },
    glow: { l: C.candleBright, e: C.candle },
  },
  // Beyond the town (phase I).
  toadstoolToad: {
    frames: [toadstoolToad(16), toadstoolToad(16)],
    world: [toadstoolToad(24), toadstoolToad(24)],
    palette: {
      '.': null,
      o: C.ink,
      e: C.ink,
      E: C.white,
      g: C.skinHoney,
      G: C.cream,
      m: C.skinHoneyShade,
      s: C.skinBronze,
      c: C.toadstool,
      C: mix(C.toadstool, C.white, 0.35),
      S: C.white,
      q: ramp(C.toadstool)[0]!,
    },
  },
  mossBeetle: beetle(C.leafDark, C.moss, C.mossLight, C.barkDark),
  wisp: orb(C.lavenderShade, C.lavender, C.hairLavender),
  mistNewt: {
    frames: [newt(16, false), newt(16, true)],
    world: [newt(24, false), newt(24, true)],
    palette: {
      '.': null,
      o: ramp(C.lavenderShade)[0]!,
      b: C.skinGhostly,
      B: C.white,
      s: C.orbBlue,
      e: C.ink,
      E: C.white,
      m: C.lavenderShade,
    },
    glow: { s: C.orbBlueLight },
  },
  moonCarp: fish(C.stoneDark, C.silver, C.white, 'carp'),
  ghostPike: {
    frames: [pike(16, false), pike(16, true)],
    world: [pike(24, false), pike(24, true)],
    palette: { '.': null, o: C.stoneLight, f: C.ghost, s: C.skinGhostly, e: C.ink, w: C.white },
    glow: { f: C.ghost },
  },
  lanternBat: { ...bat(C.gold, C.goldShade, C.candle, C.ink), glow: { c: C.candleBright } },
  wishingMoth: {
    ...moth(C.navy, C.blueFabric, C.candleBright, C.inkFabric, C.stoneLight),
    glow: { s: C.candleBright },
  },
  monarch: moth(C.monarch, mix(C.monarch, C.pumpkinDark, 0.35), C.white, C.ink),
  // Out only in their weather (phase L).
  raindropFrog: frog(C.iceLight, C.white, C.sky, C.orbBlueLight),
  veilMoth: moth(C.silver, C.silverShade, C.white, C.stoneDark, C.stoneLight),
  // Caught with her rod (phase Q).
  pumpkinseed: {
    frames: [roundFishShape(16, false, 'spot'), roundFishShape(16, true, 'spot')],
    world: [roundFishShape(24, false, 'spot'), roundFishShape(24, true, 'spot')],
    palette: { '.': null, o: C.pumpkinDark, f: C.pumpkin, b: C.candle, s: C.iron, e: C.ink },
  },
  catfish: {
    frames: [catfish(16, false), catfish(16, true)],
    world: [catfish(24, false), catfish(24, true)],
    palette: { '.': null, o: C.ink, f: C.inkFabric, w: C.silverShade, W: C.silver, e: C.candle },
    glow: { e: C.candle },
  },
  fogEel: {
    frames: [eel(16, false), eel(16, true)],
    world: [eel(24, false), eel(24, true)],
    palette: { '.': null, o: C.stoneDark, f: C.silver, s: C.white, e: C.ink, m: C.stoneDark },
  },
  blueMoonfish: {
    frames: [roundFishShape(16, false, 'moon'), roundFishShape(16, true, 'moon')],
    world: [roundFishShape(24, false, 'moon'), roundFishShape(24, true, 'moon')],
    palette: {
      '.': null,
      o: C.navy,
      f: C.orbBlue,
      b: C.orbBlueLight,
      m: C.candleBright,
      e: C.ink,
    },
    glow: { f: C.orbBlue, m: C.candleBright },
  },
  // Out by day (0.2's F1).
  tombstoneToad: {
    ...frog(C.stone, C.stoneLight, C.stoneDark, C.mossLight),
    world: [tombstoned(FROG_WORLD), tombstoned(FROG_WORLD)],
    palette: {
      ...frog(C.stone, C.stoneLight, C.stoneDark, C.mossLight).palette,
      c: C.ghost,
      k: C.stoneDark,
    },
  },
  mourningCloak: {
    ...moth(C.maroonShade, C.maroon, C.maroon, C.inkFabric),
    frames: [cloaked(MOTH_SMALL[0]), cloaked(MOTH_SMALL[1])],
    world: [cloaked(MOTH_WORLD[0]), cloaked(MOTH_WORLD[1])],
    palette: {
      ...moth(C.maroonShade, C.maroon, C.maroon, C.inkFabric).palette,
      p: C.cream,
      q: C.sky,
    },
  },
  reedFrog: {
    ...frog(C.gold, C.cream, C.goldShade, C.leafDark),
    world: [striped(FROG_WORLD), striped(FROG_WORLD)],
    palette: { ...frog(C.gold, C.cream, C.goldShade, C.leafDark).palette, c: C.white },
  },
  ladybug: beetle(C.scarlet, C.scarletShade, C.ink, C.ink),
  // The top of the Cabinet (0.2's F1).
  herculesBeetle: {
    frames: [hercules(16), hercules(16)],
    world: [hercules(24), hercules(24)],
    palette: {
      '.': null,
      o: C.ink,
      W: mix(C.gold, C.bark, 0.35),
      w: mix(C.gold, C.barkDark, 0.6),
      s: C.barkDark,
      h: C.inkFabric,
      H: C.stoneLight,
    },
  },
  axolotl: {
    frames: [axolotl(16, false), axolotl(16, true)],
    world: [axolotl(24, false), axolotl(24, true)],
    palette: {
      '.': null,
      o: mix(C.rose, C.ink, 0.35),
      p: C.hairPink,
      P: mix(C.hairPink, C.white, 0.5),
      g: C.rose,
      c: C.roseLight,
      m: mix(C.rose, C.ink, 0.35),
      e: C.ink,
    },
  },
  glowJelly: {
    frames: [jellyfish(16, false), jellyfish(16, true)],
    world: [jellyfish(24, false), jellyfish(24, true)],
    palette: {
      '.': null,
      o: C.lavenderShade,
      b: C.hairPink,
      B: mix(C.hairPink, C.white, 0.55),
      r: C.hairLavender,
      t: C.hairLavender,
      e: C.plum,
    },
    glow: { b: C.hairPink, B: mix(C.hairPink, C.white, 0.55), t: C.hairLavender },
  },
  // 0.3's C2: the creepy-crawlies, the farm's own, the bats' missing tiers and winter's.
  ...CRAWLY_ART,
  fruitBat: bat(C.bark, C.copper, C.cream, C.ink),
  longEaredBat: {
    ...bat(C.furShade, C.fur, C.roseLight, C.ink),
    frames: [
      longEared(
        BAT_SMALL[0],
        [
          { x: 6, w: 1 },
          { x: 9, w: 1 },
        ],
        1,
        4,
      ),
      longEared(
        BAT_SMALL[1],
        [
          { x: 6, w: 1 },
          { x: 9, w: 1 },
        ],
        1,
        4,
      ),
    ],
    world: [
      longEared(
        BAT_WORLD[0],
        [
          { x: 9, w: 2 },
          { x: 13, w: 2 },
        ],
        2,
        7,
      ),
      longEared(
        BAT_WORLD[1],
        [
          { x: 9, w: 2 },
          { x: 13, w: 2 },
        ],
        2,
        7,
      ),
    ],
  },
  ghostBat: {
    ...bat(C.ghost, C.white, C.lavender, C.plum),
    glow: { W: C.ghost, b: C.white },
  },
  snowMoth: moth(C.white, C.ghost, C.iceLight, C.silver, C.stoneLight),
  frostBeetle: beetle(C.iceLight, C.sky, C.white, C.navy),
  snowglobeFish: {
    frames: [roundFishShape(16, false, 'spot'), roundFishShape(16, true, 'spot')],
    world: [roundFishShape(24, false, 'spot'), roundFishShape(24, true, 'spot')],
    palette: { '.': null, o: C.navy, f: C.sky, b: C.white, s: C.white, e: C.ink },
  },
  // V1's R5: a critter for each big holiday, and three jumping spiders.
  ...HOLIDAY_ART,
  ...JUMPER_ART,
};

/**
 * A critter all in one colour: plum for the Curiosity Cabinet to show where one is still missing,
 * or a fish's shadow in the water.
 */
export function silhouetteOf(id: CritterId, colour: string = C.plum): Palette {
  const palette = CRITTER_ART[id].palette;
  return Object.fromEntries(
    Object.entries(palette).map(([k, v]) => [k, v === null ? null : colour]),
  );
}

/** The key a fish shadow's rim is drawn in. */
export const RIM = '~';

/**
 * A fish's shadow's shape with a rim of light round it (0.2's K2), where the water catches the
 * light at its edge, so a shadow can be found on the darkest water; silhouetteOf colours the rest.
 */
export function rimmed(source: SpriteSource, palette: Palette): SpriteSource {
  const solid = (x: number, y: number) => {
    const key = source.rows[y]?.[x];
    return key !== undefined && palette[key] != null;
  };
  return {
    rows: source.rows.map((row, y) =>
      [...row]
        .map((key, x) =>
          !solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))
            ? RIM
            : key,
        )
        .join(''),
    ),
  };
}

/** Whether a critter glows after dark, and so casts a little light of its own. */
export function glows(id: CritterId): boolean {
  return CRITTER_ART[id].glow !== undefined;
}
