import type { FairPrizeId } from '../types/ids';
import type { ItemArt } from './items';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * What's only won at the Hollow Fairground (V1's R6b), 16 pixels for her bag as every item is,
 * outlined in ink like the other squishies.
 */

/** A ghostly white duckling facing left, round and squashy, in a gold paper crown. */
function luckyDuck(): ItemArt {
  const s = new Sketch(16, 16);
  // The body, and its tail tipped up behind.
  s.ellipse(8.5, 11, 6, 3.5, 'w');
  s.rect(13, 8, 2, 3, 'w').set(14, 7, 'w');
  // The head, sat forward on it.
  s.ellipse(6, 6.5, 3.5, 3, 'w');
  // The underside in shade, and the light along the top of the head and back.
  s.rect(4, 13, 10, 1, 's').rect(5, 14, 8, 1, 's');
  s.set(4, 4, 'W').set(5, 4, 'W').set(8, 9, 'W').set(9, 9, 'W');
  // A tucked wing.
  s.line(8, 11, 11, 12, 's').set(12, 11, 's');
  // The beak, an eye and a rosy cheek.
  s.rect(1, 7, 2, 1, 'b').set(2, 8, 'B');
  s.set(4, 6, 'e').set(6, 7, 'r');
  // The crown: a band and three points.
  s.rect(4, 2, 5, 2, 'g').set(4, 1, 'g').set(6, 1, 'g').set(8, 1, 'g');
  s.set(5, 3, 'G').set(7, 3, 'G');
  s.outline((key) => (key === 'e' ? null : 'o'));
  return {
    source: s.toSource(),
    palette: {
      '.': null,
      o: C.ink,
      w: C.ghost,
      W: C.white,
      s: C.lavender,
      b: C.pumpkin,
      B: C.pumpkinShade,
      e: C.ink,
      r: C.roseLight,
      g: C.gold,
      G: C.goldShade,
    },
  };
}

export const FAIR_PRIZE_ART: Record<FairPrizeId, ItemArt> = {
  luckyDuckSquish: luckyDuck(),
};
