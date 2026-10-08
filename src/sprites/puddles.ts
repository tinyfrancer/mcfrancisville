import type { Palette, SpriteSource } from './sprite';
import { PALETTE as C } from './palette';
import { CLEAR } from './sketch';

/**
 * Puddles on a rainy day (V1's L3): flat pools on the paths holding the grey sky, a darker rim of
 * wet stone round them and a glint of light on the near side. Never outlined (water's surface,
 * `docs/art_style.md`). Each fits inside one tile, so a chunk of ground bakes them whole.
 */
export const PUDDLE_ART: readonly SpriteSource[] = [
  {
    rows: [
      '....eeeeeeee....',
      '..eewwwwwwwwee..',
      '.ewwwsswwwwwwwe.',
      '.ewwwwwwwwwwwwe.',
      '..eewwwwwwwwee..',
      '....eeeeeeee....',
    ],
  },
  {
    rows: [
      '..eeeeee..', //
      '.ewwsswwe.',
      '.ewwwwwwe.',
      '..eeeeee..',
    ],
  },
  {
    rows: [
      '.....eeeeee...........',
      '...eewwwwwweeeeeee....',
      '..ewwwsswwwwwwwwwwee..',
      '.ewwwwwwwwwwwwwwwwwwe.',
      '..eewwwwwwwwwwwwwwee..',
      '....eeeewwwwwweeee....',
      '........eeeeee........',
    ],
  },
];

export const PUDDLE_PALETTE: Palette = {
  [CLEAR]: null,
  e: C.puddle,
  w: C.puddleSky,
  s: C.puddleShine,
};
