import type { DishId, ItemId } from '../types/ids';
import { CRITTERS, type Family } from './critters';
import { ITEMS } from './items';
import { ORCHARD_DISHES } from './orchard';

/**
 * What eating something does (phase R, decision 122), for the rest of the window she eats it in:
 * a spring in her step, fish that bite sooner, or a critter of a family coming out to find her.
 */
export type Effect = 'pep' | 'bites' | { lure: Exclude<Family, 'fish'> };

export interface DishRow {
  effect: Effect;
  /** Cooked only after dark, a late-night snackie. */
  night?: true;
}

/** Every dish, and what eating it does. A lure for each family but the fish, whose is the tea. */
export const DISHES: Record<DishId, DishRow> = {
  pumpkinSoup: { effect: 'pep' },
  fishChowder: { effect: 'bites' },
  moonpetalCake: { effect: { lure: 'moth' } },
  midnightPlate: { effect: { lure: 'orb' }, night: true },
  ghostChili: { effect: 'pep' },
  pumpkinPie: { effect: { lure: 'bat' } },
  toadstoolStew: { effect: { lure: 'frog' } },
  roseJam: { effect: { lure: 'beetle' } },
  moonflowerTea: { effect: 'bites' },
  spaghetti: { effect: 'pep' },
  chipsAndGuac: { effect: 'pep' },
  roastGourd: { effect: { lure: 'orb' } },
  lavenderShortbread: { effect: { lure: 'moth' } },
  ...ORCHARD_DISHES,
};

export const DISH_IDS = Object.keys(DISHES) as DishId[];

export function isDish(id: ItemId): id is DishId {
  return id in DISHES;
}

/** What eating something does, or null if it isn't for eating. A snack or a treat perks her up. */
export function effectOf(id: ItemId): Effect | null {
  if (isDish(id)) return DISHES[id].effect;
  const kind = ITEMS[id].kind;
  return kind === 'snack' || kind === 'treat' ? 'pep' : null;
}

/** A kind of thing a recipe can take any of: whichever she has the plainest of. */
export type Pantry = 'fish' | 'crop' | 'snack';

export interface PantryRow {
  /** How a need for it reads: "any fish". */
  name: string;
  /** Its picture on the stove's needs. */
  icon: ItemId;
  holds(id: ItemId): boolean;
}

export const PANTRY: Record<Pantry, PantryRow> = {
  fish: {
    name: 'Any fish',
    icon: 'ghostMinnow',
    holds: (id) => id in CRITTERS && CRITTERS[id as keyof typeof CRITTERS].family === 'fish',
  },
  crop: { name: 'Any crop', icon: 'pumpkin', holds: (id) => ITEMS[id].kind === 'crop' },
  // Late-night snackies count (the plan's phase R): whatever the night left her.
  snack: { name: 'Any snack', icon: 'midnightPizza', holds: (id) => ITEMS[id].kind === 'snack' },
};
