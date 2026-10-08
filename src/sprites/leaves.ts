import { PALETTE as C } from './palette';
import type { Palette, SpriteSource } from './sprite';

/*
 * A leaf falling from a tree in autumn (V1's E5): a few pixels, tipped one way and then the
 * other as it flutters down, lit on its top edge. Its colours are a palette each, so the same
 * grids fall in pumpkin, gold and red.
 */

/** Keys: the leaf, its light edge, its stalk. */
const LEAF = 'l';
const LIGHT = 'h';
const STALK = 's';

/** A leaf tipped down to the left, then down to the right, as it rocks on the way down. */
export const LEAF_FRAMES: readonly SpriteSource[] = [
  { rows: ['.hh..', 'hlll.', '.llls', '..l..'] },
  { rows: ['..hh.', '.lllh', 'slll.', '..l..'] },
];

const leaf = (body: string, light: string): Palette => ({
  '.': null,
  [LEAF]: body,
  [LIGHT]: light,
  [STALK]: C.pumpkinDark,
});

/** The autumn's colours, one a leaf. */
export const LEAF_PALETTES: readonly Palette[] = [
  leaf(C.pumpkin, C.pumpkinLight),
  leaf(C.goldShade, C.gold),
  leaf(C.scarlet, C.pumpkin),
  leaf(C.pumpkinShade, C.gold),
];
