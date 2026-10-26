import type { SnowKeepsakeId, SnowmanId } from '../types/ids';
import type { FurnitureRow } from './furniture';
import type { ItemRow } from './items';

/*
 * Snow days, puddles and a rainbow (1.6's X4, decision 383). In winter she rolls a snowman in her
 * yard, three taps on the snow, and throws snowballs anywhere else, and her neighbours throw them
 * at each other; at the thaw her snowmen don't melt, they come in. After a rainy day the first ten
 * minutes she's out on a sunny one, a rainbow. The rules are `systems/snow.ts`, the snow she plays
 * in `world/services/Snow.ts`, the rainbow's window `world/services/Forecast.ts`.
 */

/** Her snowmen, in the order a tile deals their hats. */
export const SNOWMAN_IDS: readonly SnowmanId[] = ['snowmanTopHat', 'snowmanBobble', 'snowmanWitch'];

/** A snowman in her yard: made, never sold, solid, movable, and the chest takes him. */
export const SNOWMEN: Record<SnowmanId, FurnitureRow> = {
  snowmanTopHat: {
    name: 'Snowman in a top hat',
    description:
      'Three snowballs, a carrot, two bits of coal and a very tall top hat. He looks like he is about to make a speech.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The snowman tips his top hat. Well, he would, if he had arms. He has twigs. Close enough.',
  },
  snowmanBobble: {
    name: 'Snowman in a bobble hat',
    description:
      'Three snowballs, a carrot, two bits of coal and a stripy bobble hat pulled down over his ears. Cosy.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: "The snowman's bobble wobbles in the breeze. He seems pleased about it.",
  },
  snowmanWitch: {
    name: 'Snowman in a witch hat',
    description:
      'Three snowballs, a carrot, two bits of coal and a pointy witch hat. The spookiest snowman on the street, and the friendliest.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The snowman looks wise and a bit mysterious. You think he might know a spell for hot cocoa.',
  },
};

/** The keepsakes: never sold, never stowed, hers to keep (as every keepsake is). */
export const SNOW_ITEMS = {
  meltlessSnowman: {
    name: "Snowman that didn't melt",
    kind: 'keepsake',
    plural: "snowmen that didn't melt",
    description:
      'A little snowman who came in from the yard when the thaw came, carrot and all. He is still a bit chilly to hold. He likes it that way.',
  },
  rainbowJar: {
    name: 'Rainbow in a jar',
    kind: 'keepsake',
    plural: 'rainbows in jars',
    description:
      'A little of the first rainbow you saw after the rain, caught in a jam jar with the lid on tight. It glows in the dark, very softly.',
  },
} as const satisfies Record<SnowKeepsakeId, ItemRow>;

export const SNOW_VALUES = { meltlessSnowman: 0, rainbowJar: 0 } as const;

/** How many taps a snowman takes: a snowball rolled, rolled bigger, and stood up. */
export const SNOWBALL_SIZES = 2;

/** How far she throws a snowball at nothing in particular, in tiles, the way she faces. */
export const THROW_TILES = 3;
/** A neighbour within this many tiles is who she throws at, and who throws one back. */
export const THROW_AT_TILES = 4;
/** How long after hers lands their snowball comes back, gently. */
export const THROW_BACK_MS = 900;
/** How long a neighbour hit by her snowball laughs, and laughs as they throw. */
export const LAUGH_MS = 2_400;

/** How long a rainbow stays after rain, from when she's first out under it. */
export const RAINBOW_MS = 10 * 60_000;
/** A rainbow needs the sun up: from this hour, and before that one. */
export const RAINBOW_HOURS: readonly [number, number] = [7, 19];

/** Told the first time she's in her yard on a snowy day, a hint of what the snow is for. */
export const SNOW_HINT =
  'The snow is just right for a snowman! Tap yourself in your yard to roll a snowball, and tap it again to make it bigger.';

/** A snowball rolled in her yard, and rolled bigger. */
export const ROLLED = 'You roll a little snowball. It wants to be bigger.';
export const GREW = 'You roll the snowball round and round. It is getting very round indeed.';

/** The snowman stood up, by his hat. */
export const BUILT: Record<SnowmanId, string> = {
  snowmanTopHat:
    'A snowman! You give him a carrot, two bits of coal and a top hat. He looks very distinguished.',
  snowmanBobble:
    'A snowman! You give him a carrot, two bits of coal and a stripy bobble hat. He looks very cosy.',
  snowmanWitch:
    'A snowman! You give him a carrot, two bits of coal and a witch hat. He looks very spooky, and very kind.',
};

/** At the thaw: her snowmen didn't melt. They came in, a little snowman each, kept in her bag. */
export function thawLine(count: number): string {
  return count === 1
    ? "The snow is melting! But your snowman didn't. He hopped in out of the sun, and he's a little snowman now, tucked in your bag."
    : `The snow is melting! But your ${count} snowmen didn't. They hopped in out of the sun, and they're little snowmen now, tucked in your bag.`;
}

/** The first rainbow after rain, and her jar of it. */
export const RAINBOW_FIRST =
  'A rainbow after the rain! You catch a little of it in a jam jar, for keeps.';
export const RAINBOW_AGAIN = 'A rainbow after the rain! Look up!';

/** Why a snowman stays outdoors. */
export const MELTS =
  "He'd melt in the warm! Snowmen stay out in the yard, where it's nice and cold.";
