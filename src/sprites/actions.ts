import { PALETTE as C } from './palette';
import type { ToolArt } from './tools';

/*
 * What she holds as she does something (V1's E2, decision 281): her watering can tipped over a bed
 * as she pours, a trickle from its rose. Drawn at 1×, the doll's own density, as `HELD_ART` is.
 */

/**
 * Her can (`TOOL_ART.can`) tipped spout down: each column of it let down a row for every three
 * across from her hand, the 1:3 stair pixel art draws a slope in, so its edges stay whole; and
 * three drops falling from the rose.
 */
export const TIPPED_CAN: ToolArt = {
  source: {
    rows: [
      '................',
      '................',
      '................',
      '................',
      '....oo..........',
      '...o..oo........',
      '.ooo....o.......',
      '.oTooo..o.......',
      '.otTTTooo.......',
      '.otTTTTTTooo....',
      '.otTTTTTTTTo....',
      '.otTTTTTTTTo..o.',
      '.otTTTTTTTTo.oLo',
      '.otTTTTTTTTTooLo',
      '.ootttTTTTToTToo',
      '...oootttTTooo..',
      '......oootto..W.',
      '.........ooo....',
      '...............W',
      '................',
      '..............W.',
    ],
  },
  palette: {
    '.': null,
    o: C.ink,
    T: C.tealLight,
    t: C.teal,
    L: C.stoneLight,
    W: C.waterLight,
  },
  // Inside the loop of its handle, where her fist closes round it.
  grip: { x: 6, y: 6 },
};
