import type { DishId, ItemId } from '../types/ids';
import type { DishRow } from './dishes';
import type { ItemRow } from './items';

/*
 * The hens at Boo Acres (1.6's X3, decision 382): three hens and a rooster in a coop by Scarah's
 * barn, pottering about their run by day and in by night. Fed once a day from her bag, each hen
 * lays an egg by the next morning; unfed, they simply lay nothing, and nothing is ever lost
 * (decision 11). The eggs go into two dishes at the stove and Wrapunzel's meringue ghosts. Rows
 * live here and are spread into the tables they belong to.
 */

export type HenId = 'henrietta' | 'peck' | 'omelette' | 'reginald';

/** How each is drawn: a speckled hen, a black one, a buff one, and the rooster. */
export type HenLook = 'speckled' | 'black' | 'buff' | 'rooster';

export interface HenRow {
  name: string;
  look: HenLook;
  /** Said of them on the coop's card. */
  about: string;
  /** The rooster lays no eggs; he crows at six instead. */
  rooster?: true;
}

export const HENS: Record<HenId, HenRow> = {
  henrietta: {
    name: 'Henrietta',
    look: 'speckled',
    about: 'Speckled, sensible, and quietly in charge of everyone, Reginald included.',
  },
  peck: {
    name: 'Peck',
    look: 'black',
    about: 'Glossy black with a green shimmer. Pecks at everything once, just to be sure.',
  },
  omelette: {
    name: 'Omelette',
    look: 'buff',
    about: 'Round, golden and very fluffy. Nobody has told her what her name means.',
  },
  reginald: {
    name: 'Reginald',
    look: 'rooster',
    rooster: true,
    about: 'The rooster. Crows at six sharp. Scarah has asked him to consider seven.',
  },
};

/** Every one of them, the hens first, in the order the card names them. */
export const HEN_IDS = Object.keys(HENS) as HenId[];

/** The three who lay, an egg each the morning after she feeds them. */
export const LAYERS: readonly HenId[] = HEN_IDS.filter((id) => !HENS[id].rooster);

/** They come out into the run as Reginald crows, and go in for the night at seven. */
export const OUT_HOUR = 6;
export const IN_HOUR = 19;

/** The hour Reginald crows, if she's at Boo Acres to hear it. */
export const CROW_HOUR = 6;

/** How long he holds his crow, head up, ms. */
export const CROW_MS = 2400;

/**
 * Where a hen's feet may be in the run, in pixels from the top left of the coop's footprint (three
 * tiles by two): clear of the henhouse, the fences, the trough and the waterer, so they stay
 * inside it. `sprites/farm.ts` draws the run round it.
 */
export const RUN_FLOOR = { x: 50, y: 20, w: 32, h: 34 } as const;

/** How many of the plainest things she could feed them the card offers. */
export const FEED_CHOICES = 4;

/** The eggs Wrapunzel asks for when she brings some to bake meringue ghosts. */
export const MERINGUE_EGGS = 2;

/** The hens' dishes at the stove. */
export type HenDishId = Extract<DishId, 'custardTart' | 'frittata'>;

/** What the hens give, and what's made from it. */
export type HenItemId = HenDishId | Extract<ItemId, 'egg' | 'meringueGhost'>;

/**
 * An egg is a crop, as the farm's fruit is (a gift Scarah likes, a thing the honesty stall sells),
 * but never "any crop" at the stove or feed for the hens themselves (`isEgg`).
 */
export const HEN_ITEMS: Record<HenItemId, ItemRow> = {
  egg: {
    name: 'Egg',
    kind: 'crop',
    description:
      'A warm brown egg from the coop at Boo Acres, still a little straw on it. Henrietta looks ' +
      'very proud of it. It might have been Omelette.',
  },
  custardTart: {
    name: 'Egg custard tart',
    kind: 'dish',
    description:
      'A wobbly golden custard in a crisp little crust, with a dusting of nutmeg shaped like a ' +
      'ghost if you squint. A slice and you could skip round the whole farm.',
  },
  frittata: {
    name: 'Frittata',
    kind: 'dish',
    plural: 'frittatas',
    description:
      'Eggs from the coop and whatever the garden gave you, baked fluffy in a skillet. The ' +
      'creepy-crawlies come wiggling out to see what smells so good.',
  },
  meringueGhost: {
    name: 'Meringue ghost',
    kind: 'snack',
    description:
      'A little piped meringue ghost with two chocolate-chip eyes, baked with Wrapunzel. It says ' +
      '"boo" very quietly, then melts on your tongue.',
  },
};

/** What eating each does: the tart is pep; the frittata brings a creepy-crawly out to her. */
export const HEN_DISHES: Record<HenDishId, DishRow> = {
  custardTart: { effect: 'pep' },
  frittata: { effect: { lure: 'crawly' } },
};

/**
 * What the shops pay. An egg is small change, a little more than a fruit, so a day's three come
 * to less than a crop from her beds; a dish is worth well over a quarter more than what goes in it
 * (0.2's E1).
 */
export const HEN_VALUES: Record<HenItemId, number> = {
  egg: 6,
  custardTart: 90,
  frittata: 70,
  meringueGhost: 15,
};

/** Whether a thing in her bag is one of the hens' eggs. */
export function isEgg(id: ItemId): boolean {
  return id === 'egg';
}
