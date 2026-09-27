import { RECIPE_IDS, RECIPES, STARTER_RECIPES } from '../../data/recipes';
import { cantMake, type CantMake } from '../../systems/crafting';
import type { RecipeId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Home } from '../Home';

/** Her workbench: the recipes she knows, and making things from them (decisions.md 52). */
export class Workbench {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  private readonly home: Home;
  private readonly learned = new Set<RecipeId>(STARTER_RECIPES);

  /** `saved` is the recipes she has learned beyond the ones everyone knows; unknown ids are left out. */
  constructor(ctx: WorldContext, bag: Bag, home: Home, saved: readonly string[] = []) {
    this.ctx = ctx;
    this.bag = bag;
    this.home = home;
    for (const id of saved) if (id in RECIPES) this.learned.add(id as RecipeId);
  }

  /** Every recipe she knows, in the order the workbench shows them. */
  get recipes(): RecipeId[] {
    return RECIPE_IDS.filter((id) => this.learned.has(id));
  }

  knows(id: RecipeId): boolean {
    return this.learned.has(id);
  }

  /** Learns a recipe, from a card or a friend. False if she already knew it. */
  learn(id: RecipeId): boolean {
    if (this.learned.has(id)) return false;
    this.learned.add(id);
    this.ctx.events.emit('recipes', this.recipes);
    return true;
  }

  /** Why she can't make something now, or null if she can. */
  cantMake(id: RecipeId): CantMake | null {
    return cantMake(id, {
      knows: (r) => this.knows(r),
      count: (item) => this.bag.count(item),
      roomSize: this.home.room.size,
    });
  }

  /**
   * Makes something at once: what it needs comes out of her bag, and what it makes goes into her
   * bag or her storage chest, or builds onto her house. Null, and nothing taken, if she can't.
   */
  craft(id: RecipeId): WorldEvent | null {
    if (this.cantMake(id) !== null) return null;
    const row = RECIPES[id];
    for (const { item, count } of row.needs) this.bag.remove(item, count);
    const made = row.makes;
    if ('item' in made) this.bag.add(made.item, 1);
    else if ('furniture' in made) this.home.store(made.furniture);
    else this.home.grow();
    this.ctx.events.emit('bag', this.bag.contents);
    if (!('item' in made)) this.ctx.events.emit('home', this.home);
    return { kind: 'made', recipe: id, made };
  }

  snapshot(): { recipes: RecipeId[] } {
    return { recipes: this.recipes };
  }
}
