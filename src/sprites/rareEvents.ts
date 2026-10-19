import type { RareKeepsakeId } from '../types/ids';
import type { ItemArt } from './items';
import { PALETTE as C } from './palette';
import { Sketch } from './sketch';

/*
 * The rare events' keepsakes (V1's R3), 16-pixel things for her bag like every item's, each a few
 * keys of its own outlined in ink.
 */

function keepsake(draw: (s: Sketch) => void, palette: Record<string, string>): ItemArt {
  const s = new Sketch(16, 16);
  draw(s);
  s.outline(() => 'o');
  return { source: s.toSource(), palette: { '.': null, o: C.ink, ...palette } };
}

export const RARE_KEEPSAKE_ART: Record<RareKeepsakeId, ItemArt> = {
  // A five-pointed shard of star, lit at its heart.
  starShard: keepsake(
    (s) => {
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
        s.line(8, 8, Math.round(8 + Math.cos(a) * 6), Math.round(8 + Math.sin(a) * 6), 's');
      }
      s.ellipse(8, 8, 2.5, 2.5, 's').rect(7, 7, 2, 2, 'S').set(6, 6, 'W');
    },
    { s: C.candle, S: C.candleBright, W: C.white },
  ),
  // A plum pennant on a little pole, a gold moth stitched on.
  stallPennant: keepsake(
    (s) => {
      s.rect(3, 2, 1, 13, 'w');
      for (let x = 4; x < 14; x++) {
        const half = Math.round((14 - x) * 0.45);
        s.rect(x, 7 - half, 1, half * 2 + 1, 'p');
      }
      s.set(7, 6, 'g').set(7, 8, 'g').set(8, 7, 'g').set(6, 7, 'g');
    },
    { w: C.wood, p: C.plum, g: C.gold },
  ),
  // A postcard with a moth stamp in its corner and a few lines of writing.
  wayfarerPostcard: keepsake(
    (s) => {
      s.rect(1, 4, 14, 9, 'c');
      s.rect(10, 5, 4, 4, 'm').set(11, 6, 'g').set(12, 7, 'g');
      for (const y of [6, 8, 10]) s.rect(3, y, 5, 1, 'i');
      s.rect(3, 11, 9, 1, 'i');
    },
    { c: C.cream, m: C.lavender, g: C.gold, i: C.bark },
  ),
  // A snowflake on a silver chain.
  snowflakeCharm: keepsake(
    (s) => {
      s.line(4, 1, 8, 4, 'c').line(12, 1, 8, 4, 'c');
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * Math.PI * 2;
        s.line(8, 9, Math.round(8 + Math.cos(a) * 5), Math.round(9 + Math.sin(a) * 5), 'w');
      }
      s.set(8, 9, 'b');
    },
    { c: C.silver, w: C.white, b: C.orbBlueLight },
  ),
  // A rosette in the library's green and gold, with two ribbons.
  finderRosette: keepsake(
    (s) => {
      s.rect(5, 9, 2, 6, 'r').rect(9, 9, 2, 6, 'r');
      s.ellipse(8, 7, 6, 6, 'g').ellipse(8, 7, 4, 4, 'l').ellipse(8, 7, 2, 2, 'y');
    },
    { r: C.leafDark, g: C.leaf, l: C.leafLight, y: C.gold },
  ),
};
