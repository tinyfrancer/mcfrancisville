import type { ItemId } from '../types/ids';
import { CROPS } from './crops';

/**
 * Passive Candy (decisions.md 82): the candy tree by her house, which fills a little each window,
 * and the honesty stall at the farm gate, which sells what she leaves on it. Both fill while she's
 * away and wait for her.
 */

/** What the candy tree grows each window, in Candy. */
export const CANDY_PER_WINDOW = 15;

/** How many windows' candy the tree's branches hold: a week of them. */
export const TREE_HOLDS = 21;

/** What a tree nobody has shaken yet holds, so her first shake finds something. */
export const TREE_FIRST_FILL = 3;

/** How the tree looks: bare, a few sweets, or laden, from how many windows' candy it holds. */
export type TreeLook = 'bare' | 'few' | 'laden';

/** The fewest windows' candy that make each look. */
export const TREE_LOOK_FROM: Record<Exclude<TreeLook, 'bare'>, number> = { few: 1, laden: 6 };

/** How many things the honesty stall sells each window, at the shop's price. */
export const STALL_SELLS_PER_WINDOW = 4;

/** How many things fit on the stall at once. */
export const STALL_HOLDS = 24;

/** What the stall takes: what she grows (every crop's harvest, the rare ones too). */
export const STALL_WARES: readonly ItemId[] = [
  ...new Set(
    Object.values(CROPS).flatMap((crop) => [
      crop.harvest.item,
      ...(crop.harvest.rare ? [crop.harvest.rare.item] : []),
    ]),
  ),
];
