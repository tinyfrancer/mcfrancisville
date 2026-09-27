import type { FurnitureId } from '../types/ids';
import type { FurnitureArt } from './furniture';
import { PALETTE as C } from './palette';
import type { SpriteSource } from './sprite';

// The finishing touches (phase 12): an inside joke, two nods to Dolly, and the anniversary orb.

/**
 * A soft green plush dinosaur whose neck goes up, and up (personal_touches.md, "Inside jokes").
 * Its own creature, with lavender tufts down its neck, rather than anyone else's dinosaur.
 */
const LONG_NECK: SpriteSource = {
  rows: [
    '......oooo......',
    '.....oGGGGo.....',
    '....oGGwwGGo....',
    '....oGGwkGGGoo..',
    '....oGGGGGGGGGo.',
    '....oGrGGGGGGGo.',
    '.....oGGGGGGoo..',
    '......oGGgoo....',
    '......oGGgo.....',
    '......oGGgol....',
    '......oGGgol....',
    '......oGGgo.....',
    '......oGGgol....',
    '......oGGgol....',
    '......oGGgo.....',
    '......oGGgo.....',
    '.....ooGGgoo....',
    '....oGGGGGGGo...',
    '...oGGwwwwGGGo..',
    '..oGGwwwwwwGGgo.',
    '..oGGwwwwwwGGgo.',
    '..oGGwwwwwwGGgoo',
    '...oGGwwwwGGggGo',
    '...oGGGGGGGGgoo.',
    '...obbooooobbo..',
    '...obbbo.obbbo..',
    '...ooooo.ooooo..',
  ],
};

/** A blue butterfly pinned in a gilt frame, with a little brass plate. */
const BUTTERFLY_FRAME: SpriteSource = {
  rows: [
    'oooooooooooooooo',
    'oFFFFFFFFFFFFFFo',
    'oFccckcccckcccFo',
    'oFcBBBckkcBBBcFo',
    'oFBbbBBkkBBbbBFo',
    'oFBbybBkkBbybBFo',
    'oFBbbBBkkBBbbBFo',
    'oFcBBBBkkBBBBcFo',
    'oFccPPPkkPPPccFo',
    'oFcPpPPkkPPpPcFo',
    'oFcPPPckkcPPPcFo',
    'oFccccccccccccFo',
    'oFcccyyyyyycccFo',
    'oFccccccccccccFo',
    'oFFFFFFFFFFFFFFo',
    'oooooooooooooooo',
  ],
};

/** A sky-blue guitar studded with rhinestones, standing up on its end. */
const RHINESTONE_GUITAR: SpriteSource = {
  rows: [
    '.......oo.......',
    '......oWWo......',
    '......oWWo......',
    '.......oo.......',
    '.......on.......',
    '.......on.......',
    '.......on.......',
    '.......on.......',
    '.......on.......',
    '.....oooooo.....',
    '....oGGsGGGo....',
    '...oGGGGGsGGo...',
    '...oGsGGGGGGo...',
    '....oGGGkGGo....',
    '...oGGGkkkGGo...',
    '..oGGsGGkGGsGo..',
    '..oGGGGGGGGGGo..',
    '..oGGGGbbbGGGo..',
    '..oGsGGGGGGsGo..',
    '...oGGGGGGGGo...',
    '....oooooooo....',
  ],
};

/** A glass globe on a gold stand, with a green orb and a blue one inside: forever orbs. */
const FOREVER_ORBS: SpriteSource = {
  rows: [
    '.....oooooo.....',
    '....oWWWWWWo....',
    '...oWWggWWWWo...',
    '..oWWgGGgWWWWo..',
    '..oWWgGGgWbbWo..',
    '..oWWWggWbBBbo..',
    '..oWWWWWWbBBbo..',
    '..oWWWWWWWbbWo..',
    '...oWWWWWWWWo...',
    '....oWWWWWWo....',
    '.....oooooo.....',
    '....oyyyyyyo....',
    '...oyYyyyyYyo...',
    '...oooooooooo...',
  ],
};

export const TOUCHES_ART: Record<
  Extract<FurnitureId, 'longNeckYoshi' | 'butterflyFrame' | 'rhinestoneGuitar' | 'foreverOrbs'>,
  FurnitureArt
> = {
  longNeckYoshi: {
    source: LONG_NECK,
    palette: {
      '.': null,
      o: C.ink,
      G: C.leafLight,
      g: C.leaf,
      w: C.white,
      k: C.ink,
      r: C.cheek,
      b: C.pumpkin,
      l: C.lavender,
    },
  },
  butterflyFrame: {
    source: BUTTERFLY_FRAME,
    palette: {
      '.': null,
      o: C.ink,
      F: C.gold,
      c: C.cream,
      B: C.sky,
      b: C.blueFabric,
      y: C.gold,
      P: C.roseLight,
      p: C.rose,
      k: C.ink,
    },
  },
  rhinestoneGuitar: {
    source: RHINESTONE_GUITAR,
    palette: {
      '.': null,
      o: C.ink,
      W: C.wood,
      n: C.wood,
      G: C.sky,
      s: C.white,
      k: C.ink,
      b: C.bark,
    },
  },
  foreverOrbs: {
    source: FOREVER_ORBS,
    palette: {
      '.': null,
      o: C.ink,
      W: C.ghost,
      g: C.orbGreenDark,
      G: C.orbGreen,
      b: C.orbBlueDark,
      B: C.orbBlue,
      y: C.gold,
      Y: C.candleBright,
    },
    glow: { g: C.orbGreen, G: C.orbGreenLight, b: C.orbBlue, B: C.orbBlueLight },
    lights: [{ x: 8, y: 5, radius: 22 }],
  },
};
