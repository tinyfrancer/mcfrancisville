import type { DishId, FruitId, ItemId, PropId } from '../types/ids';
import type { DishRow } from './dishes';
import type { Yield } from './gathering';
import type { ItemRow } from './items';

/*
 * Boo Acres' orchard (0.3's F2, decision 242): each kind of fruit tree gives its fruit once a
 * window, as any tree gives its wood, and the fruit goes into four dishes at the stove, each loved
 * by a neighbour. Rows live here and are spread into the tables they belong to.
 */

/** The orchard's trees, each a prop of its own (decision 241). */
export type FruitTreeId = Extract<PropId, 'appleTree' | 'pearTree' | 'plumTree' | 'persimmonTree'>;

/** Which fruit each tree gives. */
export const FRUIT_OF: Record<FruitTreeId, FruitId> = {
  appleTree: 'apple',
  pearTree: 'pear',
  plumTree: 'plum',
  persimmonTree: 'persimmon',
};

export function isFruitTree(id: string): id is FruitTreeId {
  return id in FRUIT_OF;
}

/** A tree's fruit, two a window: about what a tree's wood is worth, so the orchard is no richer. */
export const ORCHARD_YIELDS: Record<FruitTreeId, Yield> = {
  appleTree: { item: 'apple', count: 2 },
  pearTree: { item: 'pear', count: 2 },
  plumTree: { item: 'plum', count: 2 },
  persimmonTree: { item: 'persimmon', count: 2 },
};

/** The fruit in her bag. A fruit is a crop to the stove's "any crop" and the honesty stall. */
export const ORCHARD_ITEMS: Record<FruitId | OrchardDishId, ItemRow> = {
  apple: {
    name: 'Apple',
    kind: 'crop',
    description: 'A crisp red apple from Boo Acres, polished on your sleeve until it shines.',
  },
  pear: {
    name: 'Pear',
    kind: 'crop',
    description: 'A golden pear, freckled and sweet, and so ripe it drips down your wrist.',
  },
  plum: {
    name: 'Plum',
    kind: 'crop',
    description: 'A dusky purple plum with a bloom on it like moonlight. Squishy in the best way.',
  },
  persimmon: {
    name: 'Persimmon',
    kind: 'crop',
    description:
      'A little orange lantern of a fruit, honey-sweet once it goes soft. Worth the wait.',
  },
  applePie: {
    name: 'Apple pie',
    kind: 'dish',
    description:
      'Orchard apples, sweet and soft, under a golden lattice crust. The fruit bats in town can ' +
      'smell it from the belfry.',
  },
  plumCrumble: {
    name: 'Plum crumble',
    kind: 'dish',
    plural: 'dishes of plum crumble',
    description:
      'Plums gone jammy under a buttery crumble, crunchy at the edges. A spoonful and you could ' +
      'run round the whole farm.',
  },
  hotCider: {
    name: 'Hot cider',
    kind: 'dish',
    plural: 'mugs of hot cider',
    description:
      'Apples and pears pressed and warmed with cinnamon, in a big mug for slow sips on the pier. ' +
      'The fish lean in for a sniff and bite sooner.',
  },
  persimmonPudding: {
    name: 'Persimmon pudding',
    kind: 'dish',
    plural: 'persimmon puddings',
    description:
      'A soft, spiced pudding the colour of a sunset, with a glow about it. The moths come ' +
      'fluttering over to see.',
  },
};

/** The orchard's dishes. */
export type OrchardDishId = Extract<
  DishId,
  'applePie' | 'plumCrumble' | 'hotCider' | 'persimmonPudding'
>;

/**
 * What eating each does: the fruit bats come for the pie as they do for the pumpkin one, the
 * crumble is pep, the cider is the pier's, and the pudding glows for the moths.
 */
export const ORCHARD_DISHES: Record<OrchardDishId, DishRow> = {
  applePie: { effect: { lure: 'bat' } },
  plumCrumble: { effect: 'pep' },
  hotCider: { effect: 'bites' },
  persimmonPudding: { effect: { lure: 'moth' } },
};

/**
 * What the shops pay. Fruit is a little more than a wildflower, two a window being about a tree's
 * wood; a dish is worth well over a quarter more than what goes in it (0.2's E1).
 */
export const ORCHARD_VALUES: Record<FruitId | OrchardDishId, number> = {
  apple: 5,
  pear: 5,
  plum: 5,
  persimmon: 5,
  applePie: 90,
  plumCrumble: 90,
  hotCider: 40,
  persimmonPudding: 80,
};

/** Every fruit, in the orchard's order. */
export const FRUITS: readonly FruitId[] = Object.values(FRUIT_OF);

/** Whether a thing in her bag is fruit from the orchard. */
export function isFruit(id: ItemId): id is FruitId {
  return (FRUITS as readonly ItemId[]).includes(id);
}
