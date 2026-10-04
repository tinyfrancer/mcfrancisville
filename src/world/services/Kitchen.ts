import type { Family } from '../../data/critters';
import { DISH_IDS, DISHES, effectOf, isDish, type Effect } from '../../data/dishes';
import type { DayWindow } from '../../data/windows';
import { RECIPES, stationOf } from '../../data/recipes';
import { hourOf, isNight, nextWindowStart, windowOf } from '../../systems/clock';
import { lasts, lureKey, NO_MEALS, PEP, type Meals } from '../../systems/cooking';
import type { CantMake } from '../../systems/crafting';
import type { ItemId, RecipeId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Takings } from './Takings';
import type { Workbench } from './Workbench';

/** The families a dish can lure out: every one but the fish, which are for her rod. */
const LURES: readonly Family[] = ['moth', 'bat', 'frog', 'orb', 'beetle'];

/** What a meal is still doing (0.3's A4): what she ate for it, and the window it lasts till. */
export interface Buff {
  effect: Effect;
  item: ItemId;
  until: DayWindow;
}

/** Which of her meals an effect is kept under. */
type Course = keyof Meals;

const courseOf = (effect: Effect): Course => (typeof effect === 'object' ? 'lure' : effect);

/**
 * The dish that stands for an effect, when the game no longer knows what she ate for it (it was
 * opened again since): the first that does the same thing.
 */
function dishFor(effect: Effect): ItemId {
  const same = (e: Effect) =>
    typeof effect === 'object' ? typeof e === 'object' && e.lure === effect.lure : e === effect;
  return DISH_IDS.find((id) => same(DISHES[id].effect)) ?? 'pumpkinSoup';
}

/** What cooking and eating reach into. */
export interface KitchenKeeps {
  bag: Bag;
  /** Her recipe book, and the making of things from it. */
  workbench: Workbench;
  /** Where a lured critter, once caught, is remembered. */
  takings: Takings;
}

/** A lure she ate for, still waiting to be caught. */
export interface Lure {
  family: Family;
  at: number;
}

/**
 * Her stove, at home or in Wrapunzel's bakery (phase R, decision 122): the dishes she knows,
 * cooking them from her bag, and eating what she cooked (or a snack) for a small, cozy effect that
 * lasts until the window turns.
 */
export class Kitchen {
  private readonly ctx: WorldContext;
  private readonly keeps: KitchenKeeps;
  private meals: Meals;
  /** What she ate for each, while the game is open: the save keeps only when (decision 223). */
  private readonly ate: Partial<Record<Course, ItemId>> = {};

  constructor(ctx: WorldContext, keeps: KitchenKeeps, saved?: Partial<Meals>) {
    this.ctx = ctx;
    this.keeps = keeps;
    const time = (at: unknown) => (typeof at === 'number' && Number.isFinite(at) ? at : null);
    const lure = saved?.lure;
    const lures: readonly string[] = LURES;
    this.meals = {
      pep: time(saved?.pep),
      bites: time(saved?.bites),
      lure:
        lure && lures.includes(lure.family) && time(lure.at) !== null
          ? { family: lure.family, at: lure.at }
          : null,
    };
  }

  /** Every dish she knows how to cook, in the order the stove shows them. */
  get recipes(): RecipeId[] {
    return this.keeps.workbench.known.filter((id) => stationOf(id) === 'stove');
  }

  /** Why she can't cook something now, or null if she can. */
  cantCook(id: RecipeId): CantMake | null {
    if (stationOf(id) !== 'stove') return 'unknown';
    return this.keeps.workbench.cantMake(id);
  }

  /** Cooks a dish at once, into her bag. Null, and nothing taken, if she can't. */
  cook(id: RecipeId): WorldEvent | null {
    if (this.cantCook(id) !== null) return null;
    const made = RECIPES[id].makes;
    if (!('item' in made) || !isDish(made.item)) return null;
    const used = this.keeps.workbench.wouldTake(id);
    if (!this.keeps.workbench.craft(id)) return null;
    const night = isNight(hourOf(this.ctx.clock.now()));
    return { kind: 'cooked', recipe: id, item: made.item, used, night };
  }

  /** Whether something in her bag is for eating. */
  canEat(item: ItemId): boolean {
    return effectOf(item) !== null && this.keeps.bag.count(item) > 0;
  }

  /** Eats one of something from her bag: what it does, and till when. Null if she can't. */
  eat(item: ItemId): WorldEvent | null {
    const effect = effectOf(item);
    const { bag } = this.keeps;
    if (effect === null || !bag.remove(item, 1)) return null;
    const now = this.ctx.clock.now();
    if (effect === 'pep') this.meals.pep = now;
    else if (effect === 'bites') this.meals.bites = now;
    else this.meals.lure = { family: effect.lure, at: now };
    this.ate[courseOf(effect)] = item;
    this.ctx.events.emit('bag', bag.contents);
    return { kind: 'ate', item, effect, until: windowOf(nextWindowStart(now)) };
  }

  /** How quick she walks: a spring in her step, or her usual stroll. */
  pace(): number {
    return lasts(this.meals.pep, this.ctx.clock.now()) ? PEP : 1;
  }

  /** Whether the fish bite sooner for her. */
  eager(): boolean {
    return lasts(this.meals.bites, this.ctx.clock.now());
  }

  /** The critter she ate to lure out, until it's caught or the window turns. */
  lure(): Lure | null {
    const lure = this.meals.lure;
    if (!lure || !lasts(lure.at, this.ctx.clock.now())) return null;
    return this.keeps.takings.isReady(lureKey(lure.at)) ? lure : null;
  }

  /** What her meals are doing now, a spring in her step first, then the fish, then a lure. */
  buffs(): Buff[] {
    const now = this.ctx.clock.now();
    const until = windowOf(nextWindowStart(now));
    const lure = this.lure();
    const on: Effect[] = [
      ...(this.pace() > 1 ? ['pep' as const] : []),
      ...(this.eager() ? ['bites' as const] : []),
      ...(lure && lure.family !== 'fish' ? [{ lure: lure.family }] : []),
    ];
    return on.map((effect) => ({
      effect,
      item: this.ate[courseOf(effect)] ?? dishFor(effect),
      until,
    }));
  }

  snapshot(): { kitchen: Meals } {
    return { kitchen: { ...NO_MEALS, ...this.meals } };
  }
}
