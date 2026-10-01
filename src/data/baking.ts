import type { ItemId } from '../types/ids';

/**
 * Baking with Wrapunzel at Crumbs & Curios (0.2's E1, her answer 79): a little job for Candy, once
 * a day while Wrapunzel is in her bakery. Each day has its bake, dealt from the day key; she pays
 * for the help and sends a couple home.
 */
export interface Bake {
  /** What they bake, and what she takes home. */
  item: ItemId;
  /** What Wrapunzel says as they bake it. `{name}` is her name. */
  line: string;
}

export const BAKES: readonly Bake[] = [
  {
    item: 'batWingCookie',
    line:
      "Oh, {name}, perfect timing! Roll, cut, and mind the wing tips, they're the crispy bit. " +
      'There. Look at them flap! Well. Nearly.',
  },
  {
    item: 'pumpkinPudding',
    line:
      'Pudding day! You stir, I wobble. No, the pudding wobbles. I just unravel a little when ' +
      "I'm excited. Lovely and smooth, {name}!",
  },
  {
    item: 'ghostMallow',
    line:
      "Ghost mallows! Pipe them tall, {name}, then a dot, a dot, and a little 'oh'. That one " +
      "looks like Maude. Don't tell her.",
  },
];

/** What Wrapunzel pays for an hour in her kitchen. */
export const BAKE_CANDY = 60;

/** How many of the day's bake she sends home with her. */
export const BAKE_KEEPS = 2;

/** A little closer for the help, about half a talk's worth. */
export const BAKE_POINTS = 5;
