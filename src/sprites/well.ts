import type { WellThingId } from '../types/ids';
import type { ItemArt } from './items';
import { PALETTE as C, ramp } from './palette';
import { Sketch } from './sketch';

/*
 * What comes back up the wishing well (1.7's Y2, decision 389), at 16: a smooth pebble with a
 * wet shine, and the lucky penny of her first wish, copper with a little bat stamped on it.
 */

export const WELL_ITEM_ART: Record<WellThingId, ItemArt> = {
  wellPebble: (() => {
    const s = new Sketch(16, 16);
    s.sphere(8, 9, 5.5, 4.2, 'abcd');
    s.set(6, 6, 'w').set(5, 7, 'w');
    s.set(10, 10, 'e').set(11, 9, 'e').set(9, 11, 'e');
    s.outline({ a: 'o', b: 'o', c: 'o', d: 'o', w: 'o', e: 'o' });
    const r = ramp(C.lavender);
    return {
      source: s.toSource(),
      palette: {
        '.': null,
        o: r[0]!,
        a: r[1]!,
        b: r[2]!,
        c: r[3]!,
        d: r[4]!,
        e: C.teal,
        w: C.white,
      },
    };
  })(),
  wellPenny: (() => {
    const s = new Sketch(16, 16);
    s.ellipse(8, 8, 6, 6, 'b');
    s.bevel('b', 'c', 'a');
    s.ellipse(8, 8, 4, 4, 'b');
    // A little bat stamped on it, wings out.
    ['a...aa...a', 'aa.aaaa.aa', '.aaaaaaaa.', '..a.aa.a..'].forEach((row, j) =>
      [...row].forEach((c, i) => c === 'a' && s.set(3 + i, 6 + j, 'a')),
    );
    s.set(5, 4, 'w').set(4, 5, 'w');
    s.outline({ a: 'o', b: 'o', c: 'o', w: 'o' });
    const r = ramp(C.copper);
    return {
      source: s.toSource(),
      palette: { '.': null, o: r[0]!, a: r[1]!, b: r[2]!, c: r[3]!, w: C.candleBright },
    };
  })(),
};
