import type { ToolId } from '../types/ids';
import type { ItemArt } from './items';
import { PALETTE as C } from './palette';

/** A tool's grid, and the pixel of it that sits in her hand. */
export interface ToolArt extends ItemArt {
  grip: { x: number; y: number };
}

/** Where a seed packet from her bag is held: by its middle. */
export const PACKET_GRIP = { x: 8, y: 9 };

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
};
