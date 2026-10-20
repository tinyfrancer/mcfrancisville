import type { StallApi } from '../../hud/StallSheet';
import { stallTakes } from '../../systems/passive';
import type { CraftApi } from '../../hud/CraftSheet';
import type { MealsApi } from '../../hud/MealChips';
import { cookedToast, madeToast } from '../../hud/messages';
import { CUES } from '../../audio/cues';
import { drawItemIcon } from '../../render/items';
import { drawRecipeIcon } from '../../render/recipes';
import { sellValue } from '../../systems/shop';
import type { ApiWiring, SheetApis } from './shared';

/** Making: her workbench, the stove and what a meal still does, and the honesty stall. */
export function makingApis({
  world,
  sound,
  changed,
}: ApiWiring): Pick<SheetApis, 'craft' | 'meals' | 'stove' | 'stall'> {
  const craft: CraftApi = {
    recipes: () => world.workbench.recipes,
    cantMake: (id) => world.workbench.cantMake(id),
    needs: (id) => world.workbench.needs(id),
    make(id) {
      const made = world.workbench.craft(id);
      if (!made || made.kind !== 'made') return null;
      // The sheet says what was made; a toast behind it would only be half seen.
      changed();
      return madeToast(made.made).text;
    },
    isNew: (id) => world.novelty.isNew('recipes', id),
    seen: () => world.novelty.seen('recipes'),
    icon: drawRecipeIcon,
    itemIcon: drawItemIcon,
  };
  // The top bar's chips follow what she eats, a catch (a lured critter is one) and the window.
  const meals: MealsApi = {
    buffs: () => world.kitchen.buffs(),
    onChange(listener) {
      const offs = [world.events.on('bag', listener), world.events.on('today', listener)];
      return () => offs.forEach((off) => off());
    },
    icon: drawItemIcon,
  };
  const stove: CraftApi = {
    recipes: () => world.kitchen.recipes,
    cantMake: (id) => world.kitchen.cantCook(id),
    needs: (id) => world.workbench.needs(id),
    make(id) {
      const cooked = world.kitchen.cook(id);
      if (!cooked || cooked.kind !== 'cooked') return null;
      changed();
      sound.cue(CUES.cooked);
      return cookedToast(cooked).text;
    },
    isNew: (id) => world.novelty.isNew('recipes', id),
    seen: () => world.novelty.seen('recipes'),
    icon: drawRecipeIcon,
    itemIcon: drawItemIcon,
  };
  const stall: StallApi = {
    stall: () => world.stall.view(),
    wares: () => world.bag.spares.filter((s) => stallTakes(s.id)),
    price: sellValue,
    leave(item, count) {
      changed();
      return world.stall.leave(item, count);
    },
    takeBack(item) {
      changed();
      return world.stall.takeBack(item);
    },
    icon: drawItemIcon,
  };
  return {
    craft,
    meals,
    stove,
    stall,
  };
}
