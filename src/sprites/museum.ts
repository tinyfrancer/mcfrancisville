import type { FurnitureId } from '../types/ids';
import type { FurnitureArt } from './furniture';
import { PALETTE as C } from './palette';
import type { SpriteSource } from './sprite';

// What Wrapunzel sends from the museum (phase 10), as her cases fill. Like her neighbours' gifts,
// no shop sells them.

/** A luna moth of green glass on a brass stand, lit from inside. */
const LUNA_LAMP: SpriteSource = {
  rows: [
    '....a......a....',
    '.oooo.a..a.oooo.',
    'oWWWwo.bb.owwWWo',
    'oWsWwwobbowwWsWo',
    'oWWwwwobbowwwWWo',
    '.owwwwobbowwwwo.',
    '..owwoobboowwo..',
    '...owo.bb.owo...',
    '...owo.oo.owo...',
    '....oo.ss.oo....',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '.......ss.......',
    '.....oSSSSo.....',
    '....oSSSSSSo....',
    '....oooooooo....',
  ],
};

/** A cabinet of glass nooks, a little critter in each: a moth, an orb, a frog, a beetle, a fish and a bat. */
const CURIOSITY_CABINET: SpriteSource = {
  rows: [
    '..oooooooooooooooooooooooooooo..',
    '.oWWWWWWWWWWWWWWWWWWWWWWWWWWWWo.',
    'oWwwwwwwwwwwwwwwwwwwwwwwwwwwwwWo',
    'oWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWo',
    'oWoooooooooooooWWoooooooooooooWo',
    'oWogggggggggggoWWogggggggggggoWo',
    'oWoggmmgggmmggoWWoggggeeeggGgoWo',
    'oWoggmMmbmMmggoWWogggeEeEegggoWo',
    'oWogggmmbmmgggoWWogggeeEeegggoWo',
    'oWogggggggggggoWWoggggeeeggggoWo',
    'oWoSSSSSSSSSSSoWWoSSSSSSSSSSSoWo',
    'oWoggggOOOggggoWWogggggggggggoWo',
    'oWogggOOQOOgggoWWoggggkkkggggoWo',
    'oWogggOQQQOgggoWWogggkKkkkgkgoWo',
    'oWogggOOQOOgggoWWoggggkkkkkggoWo',
    'oWoggggOOOggggoWWogggggggggggoWo',
    'oWoSSSSSSSSSSSoWWoSSSSSSSSSSSoWo',
    'oWogggggggggggoWWogggggggggggoWo',
    'oWogggfFgFfgggoWWogBgggBgggBgoWo',
    'oWoggfffffffggoWWogBBgBBBgBBgoWo',
    'oWoggfdfffdfggoWWoggBBBeBBBggoWo',
    'oWogggggggggGgoWWogggggBgggggoWo',
    'oWoooooooooooooWWoooooooooooooWo',
    'oWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWo',
    'oWwwwwwwwwwwwwoyyowwwwwwwwwwwwWo',
    'oWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWo',
    '.ooo........................ooo.',
    '.oWo........................oWo.',
    '.ooo........................ooo.',
  ],
};

export const MUSEUM_ART: Record<
  Extract<FurnitureId, 'lunaMothLamp' | 'curiosityCabinet'>,
  FurnitureArt
> = {
  lunaMothLamp: {
    source: LUNA_LAMP,
    palette: {
      '.': null,
      o: C.mossDark,
      W: C.luna,
      w: C.lunaShade,
      s: C.gold,
      b: C.white,
      a: C.bark,
      S: C.goldShade,
    },
    glow: { W: C.luna, w: C.orbGreenLight, b: C.white },
    lights: [{ x: 8, y: 5, radius: 18 }],
  },
  curiosityCabinet: {
    source: CURIOSITY_CABINET,
    palette: {
      '.': null,
      o: C.ink,
      W: C.bark,
      w: C.wood,
      y: C.gold,
      S: C.barkDark,
      g: C.dusk,
      G: C.stoneLight,
      m: C.luna,
      M: C.lunaShade,
      b: C.white,
      O: C.orbGreen,
      Q: C.orbGreenLight,
      f: C.leafLight,
      F: C.ink,
      d: C.leafDark,
      e: C.blueFabric,
      E: C.sky,
      k: C.ghost,
      K: C.ink,
      B: C.plumLight,
    },
    glow: { O: C.orbGreen, Q: C.orbGreenLight },
    lights: [{ x: 9, y: 16, radius: 10 }],
  },
};
