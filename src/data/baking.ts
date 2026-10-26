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
  /**
   * The bake told a step at a time before it (V1's P4): what Wrapunzel says, and what she does
   * meanwhile, pouring or crouching at the oven. `line` is the last, when it's done.
   */
  steps: readonly BakeStep[];
}

/** One beat of baking together (V1's P4): Wrapunzel's line, and her at the bowl or the oven. */
export interface BakeStep {
  line: string;
  /** Pouring the mix in, or down at the oven door. */
  does: 'pour' | 'crouch';
}

export const BAKES: readonly Bake[] = [
  {
    item: 'batWingCookie',
    line:
      "Oh, {name}, perfect timing! Roll, cut, and mind the wing tips, they're the crispy bit. " +
      'There. Look at them flap! Well. Nearly.',
    steps: [
      {
        line: "Aprons on, {name}! Flour, sugar, a pinch of midnight. You pour, I'll wave the spoon about.",
        does: 'pour',
      },
      {
        line: 'Now the cutter. Bat, bat, bat… one escaped. Rufus will have it. Into the oven!',
        does: 'crouch',
      },
      {
        line: 'Ten minutes. We sit, we sniff, we pretend we are not peeking. You peeked! So did I.',
        does: 'crouch',
      },
    ],
  },
  {
    item: 'pumpkinPudding',
    line:
      'Pudding day! You stir, I wobble. No, the pudding wobbles. I just unravel a little when ' +
      "I'm excited. Lovely and smooth, {name}!",
    steps: [
      {
        line: 'Pumpkin, cream and a whisper of cinnamon. Pour it in slowly, {name}. Slowly! Lovely.',
        does: 'pour',
      },
      {
        line: "Into the little moulds, and the moulds into the oven. Mind your sleeves, dear, I've lost three wrappings that way.",
        does: 'crouch',
      },
      {
        line: "Now we wait for the wobble. A good pudding wobbles like it's laughing.",
        does: 'crouch',
      },
    ],
  },
  {
    item: 'ghostMallow',
    line:
      "Ghost mallows! Pipe them tall, {name}, then a dot, a dot, and a little 'oh'. That one " +
      "looks like Maude. Don't tell her.",
    steps: [
      {
        line: 'Ghost mallow day, {name}! Sugar syrup in the bowl. Pour, and I whisk till my arm unravels.',
        does: 'pour',
      },
      {
        line: "Fluffy as a cloud. Fluffy as a ghost. Fluffy as Maude's hair, if she had any.",
        does: 'pour',
      },
      {
        line: 'A quick toast in the oven for their little cheeks. Crouch down, look! They blush.',
        does: 'crouch',
      },
    ],
  },
];

/**
 * Meringue ghosts (1.6's X3): baked instead of the day's bake whenever she brings eggs from the
 * hens at Boo Acres (`MERINGUE_EGGS` of them, which go into the bowl).
 */
export const MERINGUE_BAKE: Bake = {
  item: 'meringueGhost',
  line:
    'Out they come! Crisp outside, soft inside, and every one of them saying "boo" under its ' +
    'breath. Those chocolate-chip eyes, {name}. I could cry. I might unravel.',
  steps: [
    {
      line: "Eggs! From Scarah's hens? Oh, {name}, you know what this means. Whites in the bowl. Pour, and I'll whisk!",
      does: 'pour',
    },
    {
      line: 'Whisk, whisk, sugar, whisk… stiff peaks! Like little ghosts standing to attention. Now we pipe them tall.',
      does: 'pour',
    },
    {
      line: 'Two chocolate chips each, for eyes, and into a very low oven. They dry out slowly, like me on a sunny day.',
      does: 'crouch',
    },
  ],
};

/** What Wrapunzel pays for an hour in her kitchen. */
export const BAKE_CANDY = 60;

/** How many of the day's bake she sends home with her. */
export const BAKE_KEEPS = 2;

/** A little closer for the help, about half a talk's worth. */
export const BAKE_POINTS = 5;
