import type { ItemId } from '../types/ids';
import { CRITTERS } from './critters';
import { CROPS } from './crops';
import { isDish, PANTRY } from './dishes';
import { RECIPES } from './recipes';
import { SHOPS } from './shop';

/**
 * Cobweb Corner's wanted list (0.2's E1): three things a week it pays double for, a critter, a
 * crop and a dish, dealt from the week. Each is something only time makes (a catch, a harvest, a
 * dish with something in it no shop sells), so buying the makings can never pay (decision 128).
 */

/** What a wanted thing fetches, against what it usually does. */
export const WANTED_PAYS = 2;

/** Everything any shop's shelves may carry for her bag. */
const SOLD: ReadonlySet<ItemId> = new Set(
  Object.values(SHOPS).flatMap((shop) =>
    shop.shelves.flatMap((shelf) =>
      shelf.picks.flatMap((pick) => pick.from.flatMap((w) => ('item' in w ? [w.item] : []))),
    ),
  ),
);

/** A critter in town every week of the year, whatever the weather or the moon. */
export const WANTED_CRITTERS: readonly ItemId[] = Object.entries(CRITTERS)
  .filter(
    ([, c]) =>
      (c.rarity === 'common' || c.rarity === 'uncommon') &&
      c.where.includes('town') &&
      !c.season &&
      !c.weather &&
      !c.moon,
  )
  .map(([id]) => id as ItemId);

/** Every crop's own harvest. */
export const WANTED_CROPS: readonly ItemId[] = [
  ...new Set(Object.values(CROPS).map((crop) => crop.harvest.item)),
];

/** Every dish with something in it that no shop sells. */
export const WANTED_DISHES: readonly ItemId[] = Object.values(RECIPES).flatMap((recipe) => {
  if (!('item' in recipe.makes) || !isDish(recipe.makes.item)) return [];
  const unsold = recipe.needs.some((n) =>
    'item' in n ? !SOLD.has(n.item) : ![...SOLD].some((id) => PANTRY[n.any].holds(id)),
  );
  return unsold ? [recipe.makes.item] : [];
});
