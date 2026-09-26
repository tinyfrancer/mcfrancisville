import type { ItemId } from '../types/ids';

/** What a thing in the bag is, which decides where it sits in the bag and what it's good for later. */
export type ItemKind = 'material' | 'flower' | 'treat' | 'snack';

export interface ItemRow {
  name: string;
  kind: ItemKind;
  /** Shown when she taps it in her bag. Warm and a little silly, never snarky. */
  description: string;
  /** How it's said in a sentence when there's more than one, where that isn't just an "s". */
  plural?: string;
}

/**
 * Everything she can carry. "Purse butter" is Cody's name for the mints she keeps in her purse
 * (personal_touches.md, "Her days"); the snacks turn up after dark, because late-night snackies
 * are her favourite.
 */
export const ITEMS: Record<ItemId, ItemRow> = {
  wood: {
    name: 'Wood',
    kind: 'material',
    description: 'Good, sturdy wood, shaken loose by a friendly tree.',
  },
  stone: {
    name: 'Stone',
    kind: 'material',
    description: 'A handful of smooth grey stone. Some of it sparkles if you squint.',
  },
  moonpetal: {
    name: 'Moonpetal',
    kind: 'flower',
    description: 'A lavender bloom that glows softly whenever the moon is out.',
  },
  forgetMeBoo: {
    name: 'Forget-me-boo',
    kind: 'flower',
    description: 'A tiny blue flower. Nobody who is given one ever forgets it, which is the point.',
  },
  ghostDaisy: {
    name: 'Ghost daisy',
    kind: 'flower',
    plural: 'ghost daisies',
    description: "A daisy so pale it's nearly see-through. It says boo, very quietly.",
  },
  purseButter: {
    name: 'Purse butter',
    kind: 'treat',
    description:
      'Little foil-wrapped mint chocolates from the bottom of your purse. Cody insists they are ' +
      'purse butter, and honestly, they do look like it.',
  },
  midnightPizza: {
    name: 'Midnight pizza slice',
    kind: 'snack',
    description: 'Still warm, somehow. The best slice is always the one you find after dark.',
  },
  batWingCookie: {
    name: 'Bat-wing cookie',
    kind: 'snack',
    description: 'A chocolate cookie with little wings. It tries to flap away, but not very hard.',
  },
  pumpkinPudding: {
    name: 'Pumpkin pudding cup',
    kind: 'snack',
    description: 'Spiced, silky, and topped with a tiny whipped-cream ghost.',
  },
  ghostMallow: {
    name: 'Toasted ghost mallow',
    kind: 'snack',
    description: 'Golden outside, gooey inside, and it giggles a little when you eat it.',
  },
};

/** What a new bag holds: a few purse butters, as her real purse always does. */
export const STARTER_BAG: readonly { id: ItemId; count: number }[] = [
  { id: 'purseButter', count: 5 },
];
