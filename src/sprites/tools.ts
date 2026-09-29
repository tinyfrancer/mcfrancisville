import type { ToolId } from '../types/ids';
import type { ItemArt } from './items';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';
import type { SpriteSource } from './sprite';

/** A tool's grid, and the pixel of it that sits in her hand. */
export interface ToolArt extends ItemArt {
  grip: { x: number; y: number };
}

/** The tip of the rod in her hand (`HELD_ART`), where her line runs out from once cast (phase Q). */
export const ROD_TIP = { x: 21, y: 1 };

/** The rod's keys that are its line and float, left off while they're out in the water. */
export const ROD_LINE_KEYS = ['L', 'P', 'p', 'g'] as const;

/** Where a seed packet is held (`HELD_PACKET`): by its top. */
export const PACKET_GRIP = { x: 4, y: 1 };

/** Where anything else from her bag is held, at its icon's size: by its middle. */
export const ICON_GRIP = { x: 8, y: 9 };

/**
 * What she can hold from the quick bar (phase M), each a 16-pixel grid like an item: the HUD
 * draws it as an icon, and the world draws it in her hand at 1×, the doll's own density.
 */
export const TOOL_ART: Record<ToolId, ToolArt> = {
  /** An open hand, waving: nothing in it. */
  hands: {
    source: {
      rows: [
        '................',
        '.....oo.oo......',
        '....oSSoSSo.oo..',
        '....oSSoSSooSSo.',
        '.oo.oSSoSSoSSSo.',
        'oSSooSSoSSoSSo..',
        'oSSSoSSSSSSSSo..',
        '.oSSSSSSSSSSSo..',
        '..oSSSSSSSSSso..',
        '..oSSSSSSSSsso..',
        '...oSSSSSSsso...',
        '....oSSSSsso....',
        '....osssssso....',
        '.....oooooo.....',
        '................',
        '................',
      ],
    },
    palette: { '.': null, o: C.ink, S: C.skin, s: C.skinShade },
    grip: { x: 8, y: 12 },
  },
  /** Her bug net: a wooden handle and a hoop of pale mesh. */
  net: {
    source: {
      rows: [
        '................',
        '........oooo....',
        '......ooRRRRoo..',
        '.....oRmwmwmwRo.',
        '.....oRwmwmwmRo.',
        '.....oRmwmwmwRo.',
        '.....oRwmwmwmRo.',
        '......oRRRRRRo..',
        '.....oHoooooo...',
        '....oHo.........',
        '...oHo..........',
        '..oHo...........',
        '.oHo............',
        '.oo.............',
        '................',
        '................',
      ],
    },
    palette: {
      '.': null,
      o: C.ink,
      R: C.stoneLight,
      m: C.ghost,
      w: C.stoneLight,
      H: C.wood,
    },
    grip: { x: 2, y: 12 },
  },
  /** A little tin watering can, a rose on its spout. */
  can: {
    source: {
      rows: [
        '................',
        '................',
        '....oooo........',
        '...o....o.......',
        '...o....o.......',
        '.ooooooooooo....',
        '.oTTTTTTTTTo..oo',
        '.otTTTTTTTTo.oLo',
        '.otTTTTTTTToooLo',
        '.otTTTTTTTTTTTo.',
        '.otTTTTTTTTooo..',
        '.otTTTTTTTTo....',
        '.ottttttttto....',
        '.ooooooooooo....',
        '................',
        '................',
      ],
    },
    palette: { '.': null, o: C.ink, T: C.tealLight, t: C.teal, L: C.stoneLight },
    grip: { x: 6, y: 3 },
  },
  /** Her fishing rod (phase Q): a slim wooden rod, a little reel, and a pumpkin for a float. */
  rod: {
    source: {
      rows: [
        '.............o..',
        '............oWo.',
        '...........oWoL.',
        '..........oWo.L.',
        '.........oWo..L.',
        '........oWo...L.',
        '.......oWo....L.',
        '......oWo....ogo',
        '.....oWo....oPPo',
        '....oWoRo..oPPpo',
        '...oWoRRo...oppo',
        '..oWo.oo.....oo.',
        '.oHo............',
        'oHo.............',
        'oo..............',
        '................',
      ],
    },
    palette: {
      '.': null,
      o: C.ink,
      W: C.wood,
      H: C.barkDark,
      R: C.stoneLight,
      L: C.ghost,
      P: C.pumpkin,
      p: C.pumpkinDark,
      g: C.leafDark,
    },
    grip: { x: 2, y: 12 },
  },
};

/**
 * What she holds, drawn at the world's size (phase V: at the icons' 16 the net and rod were tiny
 * beside her and the seed packet as big as she is). Each takes its icon's palette, and its grip
 * is where her fist closes round it.
 */
export const HELD_ART: Record<Exclude<ToolId, 'hands'>, ToolArt> = {
  net: {
    source: (() => {
      const s = new Sketch(20, 26);
      s.line(2, 24, 12, 11, 'H').line(3, 24, 13, 11, 'H');
      s.ellipse(13, 7, 6, 5, 'R');
      s.ellipse(13, 7, 4.6, 3.6, 'm');
      for (let y = 0; y < 26; y++) {
        for (let x = 0; x < 20; x++) if (s.get(x, y) === 'm' && (x + y) % 2 === 0) s.set(x, y, 'w');
      }
      s.outline({ H: 'o', R: 'o', m: 'o', w: 'o' });
      return s.toSource();
    })(),
    palette: TOOL_ART.net.palette,
    grip: { x: 4, y: 21 },
  },
  // The can is small enough at its icon's size, hanging from her hand by its handle.
  can: TOOL_ART.can,
  rod: {
    source: (() => {
      const s = new Sketch(24, 26);
      s.line(1, 24, 21, 1, 'W');
      s.line(1, 24, 5, 19, 'H').line(2, 24, 6, 19, 'H');
      s.rect(6, 18, 2, 2, 'R');
      s.line(21, 2, 21, 12, 'L');
      s.ellipse(21, 15, 2, 2, 'P').set(22, 16, 'p').set(21, 17, 'p').set(21, 12, 'g');
      s.outline({ W: 'o', H: 'o', R: 'o', P: 'o', p: 'o', g: 'o' });
      return s.toSource();
    })(),
    palette: TOOL_ART.rod.palette,
    grip: { x: 3, y: 22 },
  },
};

/**
 * A seed packet in her hand: the icon's packet (`SEED_PACKET` in `items.ts`) at the size of her
 * fist, in the same keys so every seed's colours fit it.
 */
export const HELD_PACKET: SpriteSource = {
  rows: [
    'oooooooo',
    'oPPPPPPo',
    'oooooooo',
    'occcccco',
    'ocffffco',
    'ocfFffco',
    'ocffffco',
    'occcccco',
    'opttpppo',
    'oooooooo',
  ],
};
