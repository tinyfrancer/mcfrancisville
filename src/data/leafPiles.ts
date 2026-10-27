import type { Family } from './critters';
import type { ItemRow } from './items';

/*
 * Leaf piles (1.7's Y2, decision 389): in autumn a pile gathers at the foot of a few of each
 * place's trees, dealt from the day key (`systems/leafPiles.ts`), to jump in. The first jump of the
 * day in each place always finds something; after a jump a pile lies flat till the window turns.
 * Nothing about them is saved.
 */

/** How many piles a place has on an autumn day, at the most and the least. */
export const PILES_A_PLACE = { least: 2, most: 3 } as const;

/** What might rustle out of a pile for her net: the little ones that like the leaf litter. */
export const PILE_FAMILIES: readonly Family[] = ['crawly', 'beetle', 'frog'];

/** Of the days a pile has no lost thing in it, how many in five a critter pops out. */
export const PILE_CRITTER_IN_FIVE = 3;

/** The Candy someone dropped in a pile, the least and the most. */
export const PILE_CANDY = { least: 2, most: 4 } as const;

/** What the first jump of the day says it found: the golden leaf, the very first time. */
export const PILE_GOLDEN =
  "Crunch! You land in a cloud of leaves, and the very first one to fly up is gold all over. That one's yours to keep.";

/** A critter rustling out: its name goes between. */
export const PILE_CRITTER = [
  'Crunch! Something rustles out of the leaves:',
  'Quick, your net!',
] as const;

/** A little Candy someone dropped: how much goes between. */
export const PILE_CANDY_FOUND = [
  'Crunch! Leaves everywhere, and',
  'someone dropped in the pile. Finders keepers.',
] as const;

export const LEAF_PILE_ITEMS = {
  goldenLeaf: {
    name: 'Golden leaf',
    kind: 'keepsake',
    description:
      'The very first leaf to fly up when you jumped in a pile, gold all over and perfectly crunchy. Some leaves are just made for keeping.',
  },
} as const satisfies Record<'goldenLeaf', ItemRow>;

/** Not for sale: it's for keeping. */
export const LEAF_PILE_VALUES = { goldenLeaf: 0 } as const;
