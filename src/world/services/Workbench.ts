import { RECIPE_IDS, RECIPES, STARTER_RECIPES, stationOf } from '../../data/recipes';
import { hourOf, isNight } from '../../systems/clock';
import {
  cantMake,
  reckon,
  type CantMake,
  type Reckoning,
  type Taken,
} from '../../systems/crafting';
import type { RecipeId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Farm } from '../Farm';
import type { Home } from '../Home';
import type { HonestyStall } from './HonestyStall';

/**
 * Her workbench: the recipes she knows, and making things from them (decisions.md 52). Her recipe
 * book is kept here too, the stove's recipes with the rest (phase R).
 */
export class Workbench {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  private readonly home: Home;
  private readonly farm: Farm;
  private readonly stall: HonestyStall;
  private readonly learned = new Set<RecipeId>(STARTER_RECIPES);

  /** `saved` is the recipes she has learned beyond the ones everyone knows; unknown ids are left out. */
  constructor(
    ctx: WorldContext,
    kept: { bag: Bag; home: Home; farm: Farm; stall: HonestyStall },
    saved: readonly string[] = [],
  ) {
    this.ctx = ctx;
    this.bag = kept.bag;
    this.home = kept.home;
    this.farm = kept.farm;
    this.stall = kept.stall;
    for (const id of saved) if (id in RECIPES) this.learned.add(id as RecipeId);
  }

  /** Every recipe she knows for her workbench, in the order it shows them. */
  get recipes(): RecipeId[] {
    return this.known.filter((id) => stationOf(id) === 'bench');
  }

  /** Every recipe she knows, at the workbench and the stove alike: her recipe book. */
  get known(): RecipeId[] {
    return RECIPE_IDS.filter((id) => this.learned.has(id));
  }

  knows(id: RecipeId): boolean {
    return this.learned.has(id);
  }

  /** Learns a recipe, from a card or a friend. False if she already knew it. */
  learn(id: RecipeId): boolean {
    if (this.learned.has(id)) return false;
    this.learned.add(id);
    this.ctx.events.emit('recipes', this.known);
    return true;
  }

  /** Why she can't make something now, or null if she can. */
  cantMake(id: RecipeId): CantMake | null {
    return cantMake(id, {
      knows: (r) => this.knows(r),
      count: (item) => this.bag.count(item),
      roomSize: this.home.extensions,
      rooms: this.home.built,
      farmRows: this.farm.rows,
      stallShelves: this.stall.shelves,
      night: isNight(hourOf(this.ctx.clock.now())),
    });
  }

  /** What a recipe needs, each with how many she has for it. */
  needs(id: RecipeId): Reckoning['needs'] {
    return reckon(id, (item) => this.bag.count(item)).needs;
  }

  /** What making it now would take from her bag: for a need of any fish, which fish. */
  wouldTake(id: RecipeId): Taken[] {
    return reckon(id, (item) => this.bag.count(item)).take;
  }

  /**
   * Makes something at once: what it needs comes out of her bag, and what it makes goes into her
   * bag or her storage chest, builds onto her house or the honesty stall, or digs a new row at the
   * farm. Null, and
   * nothing taken, if she can't.
   */
  craft(id: RecipeId): WorldEvent | null {
    if (this.cantMake(id) !== null) return null;
    for (const { item, count } of this.wouldTake(id)) this.bag.remove(item, count);
    const made = RECIPES[id].makes;
    if ('item' in made) this.bag.add(made.item, 1);
    else if ('furniture' in made) this.home.store(made.furniture);
    else if ('room' in made) this.home.grow();
    else if ('newRoom' in made) {
      // Anything that stood in the doorway's way goes in the chest, a planter's crop with it.
      for (const p of this.home.build(made.newRoom) ?? []) {
        this.ctx.signals.emit('moved', { piece: p.id, from: { tx: p.tx, ty: p.ty }, to: null });
      }
    } else if ('shelf' in made) this.stall.addShelf();
    else this.farm.extend();
    this.ctx.events.emit('bag', this.bag.contents);
    if ('furniture' in made || 'room' in made || 'newRoom' in made) {
      this.ctx.events.emit('home', this.home);
    }
    return { kind: 'made', recipe: id, made };
  }

  snapshot(): { recipes: RecipeId[] } {
    return { recipes: this.known };
  }
}
