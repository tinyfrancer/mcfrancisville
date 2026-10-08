import type { CritterId } from '../types/ids';
import { mix, PALETTE as C, ramp } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';
import { CRAWLY_ART } from './crawlies';
import { JUMPER_ART } from './jumpers';

/**
 * The critters (phase 10), each 16×16 so it fits its tile and doubles as its picture in her bag.
 * Every family is one or two grids, and each critter is a palette over them.
 */
/** A moth with its wings open. `W`/`w` wing, `s` spot, `b` body, `a` antenna. */
const MOTH_OPEN: SpriteSource = {
  rows: [
    '................',
    '................',
    '....a......a....',
    '.....a....a.....',
    '.oooo.a..a.oooo.',
    'oWWWwo.bb.owwWWo',
    'oWsWwwobbowwWsWo',
    'oWWwwwobbowwwWWo',
    '.owwwwobbowwwwo.',
    '..owwoobboowwo..',
    '.owwwo.bb.owwwo.',
    '.owWwo.bb.owWwo.',
    '..ooo..oo..ooo..',
    '................',
    '................',
    '................',
  ],
};

/** The same moth mid-flap, its wings raised. */
const MOTH_UP: SpriteSource = {
  rows: [
    '................',
    '................',
    '..ooo......ooo..',
    '.oWWwo.aa.owWWo.',
    '.oWswwobbowwsWo.',
    '..owwwobbowwwo..',
    '...owwobbowwo...',
    '....ooobbooo....',
    '......obbo......',
    '......obbo......',
    '.......oo.......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

/** The luna moth, with its long swishy tails. */
const LUNA_OPEN: SpriteSource = {
  rows: [
    '................',
    '....a......a....',
    '.....a....a.....',
    '.oooo.a..a.oooo.',
    'oWWWwo.bb.owwWWo',
    'oWsWwwobbowwWsWo',
    'oWWwwwobbowwwWWo',
    '.owwwwobbowwwwo.',
    '..owwoobboowwo..',
    '..owwo.bb.owwo..',
    '..owwo.oo.owwo..',
    '...owo....owo...',
    '...owo....owo...',
    '....oo....oo....',
    '................',
    '................',
  ],
};

/** The luna moth mid-flap, its tails hanging. */
const LUNA_UP: SpriteSource = {
  rows: [
    '................',
    '..ooo......ooo..',
    '.oWWwo.aa.owWWo.',
    '.oWswwobbowwsWo.',
    '..owwwobbowwwo..',
    '...owwobbowwo...',
    '....ooobbooo....',
    '.....owbbwo.....',
    '.....owoowo.....',
    '.....ow..wo.....',
    '.....ow..wo.....',
    '......o..o......',
    '................',
    '................',
    '................',
    '................',
  ],
};

/** A bat with its wings spread. `W` wing, `b` body, `c` tummy, `e` eyes. */
const BAT_OPEN: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '.....o....o.....',
    '.....oboobo.....',
    'oo..obbbbbbo..oo',
    'oWo.obebbebo.oWo',
    'oWWoobbccbbooWWo',
    'oWWWWobccboWWWWo',
    '.oWWWWobboWWWWo.',
    '..oWoWooooWoWo..',
    '...o.o....o.o...',
    '................',
    '................',
    '................',
    '................',
  ],
};

/** The same bat with its wings raised. */
const BAT_UP: SpriteSource = {
  rows: [
    '................',
    '................',
    'oo............oo',
    'oWo..o....o..oWo',
    'oWWo.oboobo.oWWo',
    '.oWWobbbbbboWWo.',
    '..oWobebbeboWo..',
    '...oobbccbboo...',
    '.....obccbo.....',
    '......obbo......',
    '.......oo.......',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
};

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

/** An orb: a soft glow with a bright heart. `r` its rim, `g` glow, `c` and `w` its heart. */
const ORB: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '......rrrr......',
    '....rrggggrr....',
    '...rgggccgggr...',
    '...rgecwwcegr...',
    '...rggcwwcggr...',
    '...rgggccgggr...',
    '....rrggggrr....',
    '......rrrr......',
    '................',
    '................',
    '................',
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

/** A ghost-fish, side on. `f` body, `s` spots, `e` eye. */
const FISH: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....oooo.......',
    '...ooffffoo..oo.',
    '..oeffsffffsoffo',
    '..offfsfffffffo.',
    '...ooffffoo..oo.',
    '.....oooo.......',
    '................',
    '................',
    '................',
  ],
};

/** The fish with a flick of its tail. */
const FISH_FLICK: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....oooo.......',
    '...ooffffoo.....',
    '..oeffsffffsoo..',
    '..offfsfffffooo.',
    '...ooffffoo..ffo',
    '.....oooo.....o.',
    '................',
    '................',
    '................',
  ],
};

/** The lantern fish, and its little light (`l`). */
const LANTERN_FISH: SpriteSource = {
  rows: [
    '................',
    '................',
    '................',
    '................',
    '..ll............',
    '..llo...........',
    '....o...........',
    '.....ooooo......',
    '....offfffo..oo.',
    '...oeffffffooffo',
    '...offffffffffo.',
    '....offffffooffo',
    '.....ooooooo..oo',
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

/** A moth, wings open or raised, with its tails if it's a luna. */
function mothWorld(up: boolean, tails: boolean): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  const left = new Sketch(WORLD, WORLD);
  if (up) {
    left.ellipse(8, 7, 3.5, 5.5, 'W').ellipse(9, 13, 2.5, 3, 'W');
    left.ellipse(8, 6, 1.5, 1.5, 's');
  } else {
    left.ellipse(6, 10, 5.5, 4.5, 'W').ellipse(8, 16, 3.5, 3, 'W');
    left.ellipse(5, 10, 1.5, 1.5, 's');
  }
  if (tails) left.rect(8, up ? 15 : 18, 2, 5, 'W').rect(7, up ? 19 : 22, 2, 2, 'W');
  // The half of each wing toward the body is its second colour.
  for (let y = 0; y < WORLD; y++) {
    for (let x = 0; x < WORLD; x++) if (left.get(x, y) === 'W' && x >= 8) left.set(x, y, 'w');
  }
  s.stamp(left, 0, 0).stamp(left, 0, 0, { flipX: true });
  s.rect(11, 7, 2, 11, 'b').set(11, 17, CLEAR).set(12, 17, 'b');
  s.line(11, 6, 8, 2, 'a').line(12, 6, 15, 2, 'a');
  return outlined(s, 'a');
}

/** A bat, wings spread or folded up in a flap. */
function batWorld(up: boolean): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  const wing = new Sketch(WORLD, WORLD);
  for (let x = 1; x < 11; x++) {
    const reach = up ? 3 + Math.round((11 - x) * 0.6) : 9 + Math.round(Math.abs(x - 6) * 0.3);
    const top = up ? 12 - reach : reach;
    const bottom = up ? 13 : 15 - (x % 3 === 1 ? 1 : 0);
    wing.rect(x, top, 1, bottom - top, 'W');
  }
  s.stamp(wing, 0, 0).stamp(wing, 0, 0, { flipX: true });
  s.ellipse(12, 13, 3.5, 4, 'b');
  s.rect(9, 7, 2, 3, 'b').rect(13, 7, 2, 3, 'b');
  s.ellipse(12, 15, 2, 1.5, 'c');
  s.set(10, 11, 'e').set(13, 11, 'e');
  return outlined(s);
}

/** A frog sat squat, eyes up on top, with a pale belly and a few spots. */
function frogWorld(): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  s.ellipse(12, 16, 9, 5.5, 'g');
  s.ellipse(7, 11, 3, 3, 'g').ellipse(17, 11, 3, 3, 'g');
  s.ellipse(12, 18, 5, 3, 'G');
  s.rect(3, 19, 4, 2, 'g').rect(17, 19, 4, 2, 'g');
  s.rect(7, 10, 2, 2, 'e').rect(16, 10, 2, 2, 'e');
  s.rect(9, 15, 6, 1, 'm');
  for (const [x, y] of [
    [5, 14],
    [19, 14],
    [8, 18],
    [16, 18],
  ] as const) {
    s.set(x, y, 's');
  }
  return outlined(s);
}

/** A wisp of light: a soft round glow, lit from the top left, with two little eyes. */
function orbWorld(): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  s.sphere(12, 12, 7, 7, 'rggcc', { dither: true });
  s.rect(9, 8, 2, 2, 'w');
  s.set(10, 12, 'e').set(14, 12, 'e');
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

/** A firefly: wings, a small dark body, and its tail lit up. */
function fireflyWorld(): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  s.ellipse(8, 10, 3.5, 2.5, 'w').ellipse(16, 10, 3.5, 2.5, 'w');
  s.ellipse(12, 10, 2, 3, 'b');
  s.ellipse(12, 15, 2.5, 3, 't');
  return outlined(s, 't');
}

/** A fish side on, facing right, its tail straight or flicked. */
function fishWorld(flick: boolean): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  s.ellipse(13, 12, 7, 3.5, 'f');
  const tail: readonly [number, number][] = flick
    ? [
        [5, 9],
        [4, 8],
        [5, 10],
        [4, 10],
        [3, 9],
        [5, 11],
      ]
    : [
        [5, 11],
        [4, 10],
        [3, 9],
        [4, 12],
        [3, 13],
        [5, 12],
      ];
  for (const [x, y] of tail) s.set(x, y, 'f').set(x - 1, y, 'f');
  s.rect(11, 8, 3, 1, 's').rect(12, 15, 2, 1, 's');
  s.set(17, 11, 'e');
  return outlined(s);
}

/** A lantern fish: a round plum body and a candle-bright lure on a stalk before its nose. */
function lanternFishWorld(): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  s.ellipse(11, 14, 7, 5, 'f');
  s.rect(2, 12, 3, 5, 'f');
  s.line(14, 9, 17, 5, 'o').line(17, 5, 19, 6, 'o');
  s.ellipse(20, 7.5, 1.5, 1.5, 'l');
  s.set(15, 13, 'e');
  s.rect(15, 16, 3, 1, 'o');
  return outlined(s, 'lo');
}

/** A pike: long and lean, a jutting jaw with two little teeth, its tail straight or flicked. */
function pikeWorld(flick: boolean): SpriteSource {
  const s = new Sketch(WORLD, WORLD);
  s.ellipse(13, 12, 9.5, 3, 'f');
  s.rect(20, 12, 3, 1, 'f');
  const tail = flick ? -1 : 1;
  for (let i = 0; i < 4; i++) s.rect(1 + i, 12 - i * tail - (tail < 0 ? 0 : 0), 1, 2 + i, 'f');
  s.rect(9, 9, 4, 1, 's').rect(14, 15, 3, 1, 's');
  s.set(19, 11, 'e').set(21, 13, 'w').set(20, 13, 'w');
  return outlined(s, 'w');
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
 * A round, deep-bodied fish (phase Q), 16 or 24 across: the pumpkinseed with a dark spot at its
 * gill (`s`), or the blue moonfish with a pale crescent (`m`) on its side.
 */
function roundFish(size: 16 | 24, flick: boolean, mark: 'spot' | 'moon'): SpriteSource {
  const k = size / WORLD;
  const s = new Sketch(size, size);
  s.ellipse(13 * k, 12 * k, 6.5 * k, 5 * k, 'f');
  s.ellipse(14 * k, 14.5 * k, 4.5 * k, 2 * k, 'b');
  s.rect(Math.round(10 * k), Math.round(6.5 * k), Math.round(5 * k), 1, 'f');
  fishTail(s, Math.round(7 * k), Math.round(12 * k), Math.round(4 * k), flick);
  if (mark === 'spot') {
    s.set(Math.round(16 * k), Math.round(12 * k), 's');
    s.set(Math.round(12 * k), Math.round(10 * k), 's').set(
      Math.round(10 * k),
      Math.round(13 * k),
      's',
    );
  } else {
    // Set by hand, a "(" a pixel thick: two circles, one cut from the other, left an L.
    const crescent =
      size === 16
        ? [
            [8, 6],
            [7, 7],
            [7, 8],
            [8, 9],
          ]
        : [
            [12, 8],
            [11, 9],
            [10, 10],
            [10, 11],
            [10, 12],
            [11, 13],
            [12, 14],
            [13, 8],
            [13, 14],
          ];
    for (const [x, y] of crescent) s.set(x!, y!, 'm');
  }
  s.set(Math.round(17 * k), Math.round(11 * k), 'e');
  return outlined(s, 'm');
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
    [21, 16],
    [22, 17],
    [22, 18],
    [23, 19],
  ],
  [
    [18, 16],
    [18, 17],
    [17, 18],
    [17, 19],
    [16, 20],
  ],
  [
    [20, 13],
    [21, 12],
    [22, 12],
    [23, 11],
  ],
];

/** A fog eel: a long, soft ribbon of a fish, curving one way or the other. */
function fogEel(size: 16 | 24, flick: boolean): SpriteSource {
  const k = size / WORLD;
  const s = new Sketch(size, size);
  const phase = flick ? Math.PI : 0;
  const top = (x: number) => Math.round(12 * k + Math.sin(x / (3 * k) + phase) * 1.5 * k);
  for (let x = Math.round(2 * k); x < Math.round(19 * k); x++) {
    const thick = x < Math.round(6 * k) ? 1 : 2;
    s.rect(x, top(x) - (thick - 1), 1, thick + 1, 'f');
  }
  const head = Math.round(19 * k);
  s.ellipse(head, top(head), 2.5 * k, 2 * k, 'f');
  s.rect(Math.round(8 * k), top(Math.round(8 * k)) - 2, Math.round(8 * k), 1, 's');
  s.set(head + 1, top(head) - 1, 'e');
  return outlined(s);
}

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
 * A Hercules beetle from above (0.2's F1, question 60), 16 or 24 across and filling it: a big
 * round shell split down the middle (`W`, `w`) with dark spots (`s`), its head and the long horn
 * reaching forward (`h`, glossy `H`), a shorter horn under it, and six sturdy legs.
 */
function herculesBeetle(size: 16 | 24): SpriteSource {
  const k = size / WORLD;
  const at = (n: number) => Math.round(n * k);
  const s = new Sketch(size, size);
  for (const y of [12, 16, 20]) s.rect(at(1), at(y), at(22), 1, 'o');
  s.ellipse(12 * k, 16 * k, 7.5 * k, 7 * k, 'W');
  s.rect(at(12) - 1, at(10), 2, at(13), 'w');
  s.ellipse(12 * k, 9.5 * k, 5.5 * k, 2.5 * k, 'h');
  s.rect(at(12) - 1, 0, 2, at(8), 'h');
  s.set(at(12) - 2, at(3), 'h').set(at(12) + 1, at(3), 'h');
  s.set(at(12) - 1, at(1), 'H').set(at(10), at(9), 'H');
  s.set(at(9), at(15), 's').set(at(15), at(18), 's').set(at(14), at(13), 's');
  s.set(at(9), at(20), 's');
  return outlined(s, 'o');
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

const MOTH_WORLD = [mothWorld(false, false), mothWorld(true, false)] as const;
const LUNA_WORLD = [mothWorld(false, true), mothWorld(true, true)] as const;
const BAT_WORLD = [batWorld(false), batWorld(true)] as const;
const FROG_WORLD = frogWorld();
const ORB_WORLD = orbWorld();
const BEETLE_WORLD = beetleWorld();
const FISH_WORLD = [fishWorld(false), fishWorld(true)] as const;

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
  frames: [MOTH_OPEN, MOTH_UP],
  world: MOTH_WORLD,
  palette: { '.': null, o: C.ink, W, w, s, b, a },
});

const bat = (W: string, b: string, c: string, e: string): CritterArt => ({
  frames: [BAT_OPEN, BAT_UP],
  world: BAT_WORLD,
  palette: { '.': null, o: C.ink, W, b, c, e },
});

const frog = (g: string, G: string, m: string, s: string): CritterArt => ({
  frames: [FROG, FROG],
  world: [FROG_WORLD, FROG_WORLD],
  palette: { '.': null, o: C.ink, e: C.ink, g, G, m, s },
});

const orb = (r: string, g: string, c: string): CritterArt => {
  const palette = { '.': null, r, g, c, w: C.white, e: C.ink };
  return {
    frames: [ORB, ORB],
    world: [ORB_WORLD, ORB_WORLD],
    palette,
    glow: { r, g, c, w: C.white },
  };
};

const beetle = (W: string, w: string, s: string, h: string): CritterArt => ({
  frames: [BEETLE, BEETLE],
  world: [BEETLE_WORLD, BEETLE_WORLD],
  palette: { '.': null, o: C.ink, W, w, s, h },
});

const fish = (o: string, f: string, s: string): CritterArt => ({
  frames: [FISH, FISH_FLICK],
  world: FISH_WORLD,
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
    frames: [confetti(MOTH_OPEN), confetti(MOTH_UP)],
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
    frames: [longEared(BAT_OPEN, ...BUNNY_EARS.frames), longEared(BAT_UP, ...BUNNY_EARS.frames)],
    world: [
      longEared(BAT_WORLD[0], ...BUNNY_EARS.world),
      longEared(BAT_WORLD[1], ...BUNNY_EARS.world),
    ],
    palette: { '.': null, o: C.lavenderShade, W: C.ghost, b: C.white, c: C.roseLight, e: C.ink },
  },
  sparklerOrb: {
    ...orb(C.scarlet, C.sky, C.white),
    frames: [
      sparks(ORB, [
        [2, 3, 'x'],
        [13, 4, 'y'],
        [1, 8, 'y'],
        [14, 10, 'x'],
        [4, 13, 'x'],
        [11, 13, 'y'],
      ]),
      sparks(ORB, [
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
      sparks(ORB_WORLD, [
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
    frames: [banded(MOTH_OPEN), banded(MOTH_UP)],
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
    frames: [LUNA_OPEN, LUNA_UP],
    world: LUNA_WORLD,
    palette: {
      '.': null,
      o: C.mossDark,
      W: C.luna,
      w: C.lunaShade,
      s: C.candle,
      b: C.white,
      a: C.bark,
    },
    glow: { W: C.luna },
  },
  candleMoth: moth(C.cream, C.candle, C.pumpkinLight, C.creamShade),
  owlEyeMoth: moth(C.furLight, C.fur, C.candle, C.furShade),
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
    world: [fireflyWorld(), fireflyWorld()],
    palette: { '.': null, o: C.ink, w: C.stoneLight, b: C.iron, t: C.fireflyGlow },
    glow: { t: C.fireflyGlow },
  },
  ghostMinnow: fish(C.stoneLight, C.ghost, C.ghost),
  booKoi: fish(C.plum, C.white, C.lavender),
  lanternFish: {
    frames: [LANTERN_FISH, LANTERN_FISH],
    world: [lanternFishWorld(), lanternFishWorld()],
    palette: { '.': null, o: C.ink, f: C.plum, e: C.candle, l: C.candleBright },
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
    ...frog(C.skinGhostly, C.white, C.lavenderShade, C.orbBlue),
    glow: { s: C.orbBlueLight },
  },
  moonCarp: fish(C.stoneDark, C.silver, C.white),
  ghostPike: {
    frames: [FISH, FISH_FLICK],
    world: [pikeWorld(false), pikeWorld(true)],
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
    frames: [roundFish(16, false, 'spot'), roundFish(16, true, 'spot')],
    world: [roundFish(24, false, 'spot'), roundFish(24, true, 'spot')],
    palette: { '.': null, o: C.pumpkinDark, f: C.pumpkin, b: C.candle, s: C.iron, e: C.ink },
  },
  catfish: {
    frames: [catfish(16, false), catfish(16, true)],
    world: [catfish(24, false), catfish(24, true)],
    palette: { '.': null, o: C.ink, f: C.inkFabric, w: C.silverShade, W: C.silver, e: C.candle },
    glow: { e: C.candle },
  },
  fogEel: {
    frames: [fogEel(16, false), fogEel(16, true)],
    world: [fogEel(24, false), fogEel(24, true)],
    palette: { '.': null, o: C.stoneDark, f: C.silver, s: C.white, e: C.ink },
  },
  blueMoonfish: {
    frames: [roundFish(16, false, 'moon'), roundFish(16, true, 'moon')],
    world: [roundFish(24, false, 'moon'), roundFish(24, true, 'moon')],
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
  tombstoneToad: frog(C.stone, C.stoneLight, C.stoneDark, C.mossLight),
  mourningCloak: moth(C.maroonShade, C.maroon, C.cream, C.inkFabric),
  reedFrog: frog(C.gold, C.cream, C.goldShade, C.leafDark),
  ladybug: beetle(C.scarlet, C.scarletShade, C.ink, C.ink),
  // The top of the Cabinet (0.2's F1).
  herculesBeetle: {
    frames: [herculesBeetle(16), herculesBeetle(16)],
    world: [herculesBeetle(24), herculesBeetle(24)],
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
        BAT_OPEN,
        [
          { x: 6, w: 1 },
          { x: 9, w: 1 },
        ],
        1,
        4,
      ),
      longEared(
        BAT_UP,
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
    frames: [roundFish(16, false, 'spot'), roundFish(16, true, 'spot')],
    world: [roundFish(24, false, 'spot'), roundFish(24, true, 'spot')],
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
