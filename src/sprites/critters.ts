import type { CritterId } from '../types/ids';
import { PALETTE as C } from './palette';
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

export interface CritterArt {
  /** Two frames it swaps between as it flutters, flaps, bobs or swims; a still one repeats. */
  frames: readonly [SpriteSource, SpriteSource];
  palette: Palette;
  /** What of it glows after dark, as a prop's lit keys do. */
  glow?: Palette;
}

const moth = (W: string, w: string, s: string, b: string, a: string = C.barkDark): CritterArt => ({
  frames: [MOTH_OPEN, MOTH_UP],
  palette: { '.': null, o: C.ink, W, w, s, b, a },
});

const bat = (W: string, b: string, c: string, e: string): CritterArt => ({
  frames: [BAT_OPEN, BAT_UP],
  palette: { '.': null, o: C.ink, W, b, c, e },
});

const frog = (g: string, G: string, m: string, s: string): CritterArt => ({
  frames: [FROG, FROG],
  palette: { '.': null, o: C.ink, e: C.ink, g, G, m, s },
});

const orb = (r: string, g: string, c: string): CritterArt => {
  const palette = { '.': null, r, g, c, w: C.white, e: C.ink };
  return { frames: [ORB, ORB], palette, glow: { r, g, c, w: C.white } };
};

const beetle = (W: string, w: string, s: string, h: string): CritterArt => ({
  frames: [BEETLE, BEETLE],
  palette: { '.': null, o: C.ink, W, w, s, h },
});

const fish = (o: string, f: string, s: string): CritterArt => ({
  frames: [FISH, FISH_FLICK],
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
    palette: PAIR,
    glow: { g: C.orbGreen, c: C.orbGreenLight, h: C.orbBlue, d: C.orbBlueLight },
  },
  skullBeetle: beetle(C.stoneDark, C.iron, C.bone, C.ink),
  jewelBeetle: beetle(C.sky, C.blueFabric, C.white, C.navy),
  firefly: {
    frames: [FIREFLY, FIREFLY],
    palette: { '.': null, o: C.ink, w: C.stoneLight, b: C.iron, t: C.fireflyGlow },
    glow: { t: C.fireflyGlow },
  },
  ghostMinnow: fish(C.stoneLight, C.ghost, C.ghost),
  booKoi: fish(C.plum, C.white, C.lavender),
  lanternFish: {
    frames: [LANTERN_FISH, LANTERN_FISH],
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
