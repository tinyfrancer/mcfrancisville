import type { CritterId } from '../types/ids';
import { PALETTE as C } from './palette';
import { CLEAR, Sketch } from './sketch';
import type { Palette, SpriteSource } from './sprite';

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
};

/** A critter all in one colour, for the Curiosity Cabinet to show where one is still missing. */
export function silhouetteOf(id: CritterId): Palette {
  const palette = CRITTER_ART[id].palette;
  return Object.fromEntries(
    Object.entries(palette).map(([k, v]) => [k, v === null ? null : C.plum]),
  );
}

/** Whether a critter glows after dark, and so casts a little light of its own. */
export function glows(id: CritterId): boolean {
  return CRITTER_ART[id].glow !== undefined;
}
