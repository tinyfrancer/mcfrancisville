import { describe, expect, it } from 'vitest';
import { DISH_IDS, effectOf } from '../../src/data/dishes';
import { ITEMS } from '../../src/data/items';
import { RECIPES } from '../../src/data/recipes';
import { openStove, type CraftApi } from '../../src/hud/CraftSheet';
import { aboutFood, buffLine, eatLine } from '../../src/hud/food';
import { itemCard } from '../../src/hud/itemCard';
import { mealChips, type MealsApi } from '../../src/hud/MealChips';
import type { Toast } from '../../src/hud/messages';
import type { ItemId, RecipeId } from '../../src/types/ids';
import type { Buff } from '../../src/world/services/Kitchen';

const FOODS = (Object.keys(ITEMS) as ItemId[]).filter((id) => effectOf(id) !== null);

describe('what a food says it does (0.3’s A4)', () => {
  it('is a line for every dish, snack and treat, worked out from what eating it does', () => {
    expect(FOODS.length).toBeGreaterThan(DISH_IDS.length);
    for (const id of FOODS) expect(eatLine(id)).toMatch(/^Eat it: .+\.$/);
    expect(eatLine('pumpkinSoup')).toBe('Eat it: a spring in your step till the window turns.');
    expect(eatLine('fishChowder')).toBe('Eat it: the fish bite sooner till the window turns.');
    expect(eatLine('moonpetalCake')).toBe('Eat it: a moth comes out to see what smells so good.');
    expect(eatLine('roastGourd')).toBe('Eat it: an orb comes out to see what smells so good.');
    expect(eatLine('pumpkinSeed')).toBeNull();
    expect(aboutFood('pumpkinSeed')).toBe(ITEMS.pumpkinSeed.description);
    expect(aboutFood('midnightPizza')).toBe(
      `${ITEMS.midnightPizza.description} ${eatLine('midnightPizza')}`,
    );
  });

  it('stays on her card under whatever the card says, and only for food', () => {
    const card = itemCard(() => {});
    const eats = card.element.querySelector<HTMLElement>('.hud-eats')!;
    card.show('fishChowder', 2, ITEMS.fishChowder.description);
    expect(eats.hidden).toBe(false);
    expect(eats.textContent).toBe(eatLine('fishChowder'));
    card.say('Mmm!');
    expect(eats.textContent).toBe(eatLine('fishChowder'));
    card.show('pumpkinSeed', 1, ITEMS.pumpkinSeed.description);
    expect(eats.hidden).toBe(true);
    card.show('roseJam', 1, '');
    card.prompt('Tap something', '');
    expect(eats.hidden).toBe(true);
  });

  it('names the stove’s groups as the cards say it, and says it under each dish', () => {
    const hud = document.createElement('div');
    const dishes: RecipeId[] = ['pumpkinSoup', 'fishChowder', 'moonpetalCake'];
    const api: CraftApi = {
      recipes: () => dishes,
      cantMake: () => null,
      needs: () => [],
      make: () => null,
      isNew: () => false,
      seen: () => {},
      icon: () => {},
      itemIcon: () => {},
    };
    openStove(hud, api);
    const chips = [...hud.querySelectorAll('.hud-chip[aria-pressed]')]
      .filter((c) => !(c as HTMLElement).hidden)
      .map((c) => c.textContent);
    expect(chips).toEqual(['All', 'Spring in your step', 'Fish bite sooner', 'Lures a critter']);
    const lines = [...hud.querySelectorAll('.hud-ware small')].map((s) => s.textContent);
    for (const id of dishes) {
      const made = RECIPES[id].makes;
      if (!('item' in made)) throw new Error(`${id} makes no dish`);
      expect(lines.some((l) => l?.endsWith(eatLine(made.item)!))).toBe(true);
    }
  });
});

describe('the chips in the top bar', () => {
  function stub(buffs: Buff[]): MealsApi & { set(next: Buff[]): void } {
    let listener = () => {};
    return {
      buffs: () => buffs,
      onChange: (l) => {
        listener = l;
        return () => {};
      },
      icon: (canvas) => {
        canvas.width = 16;
        canvas.height = 16;
      },
      set(next) {
        buffs = next;
        listener();
      },
    };
  }

  it('shows a chip for each thing a meal is doing, till when said once, and a tap says what', () => {
    const api = stub([]);
    const said: Toast[] = [];
    const chips = mealChips(api, (t) => said.push(t));
    expect(chips.element.hidden).toBe(true);
    api.set([
      { effect: 'pep', item: 'ghostChili', until: 'evening' },
      { effect: { lure: 'bat' }, item: 'pumpkinPie', until: 'evening' },
    ]);
    expect(chips.element.hidden).toBe(false);
    const buttons = [...chips.element.querySelectorAll<HTMLButtonElement>('.hud-meal')];
    expect(buttons).toHaveLength(2);
    expect([...chips.element.querySelectorAll('.hud-meal-till')].map((t) => t.textContent)).toEqual(
      ['till evening'],
    );
    expect(buttons[0]!.querySelector('canvas')!.style.width).toBe('32px');
    expect(buttons[0]!.getAttribute('aria-label')).toBe(
      'Ghost pepper chili: a spring in your step, till evening',
    );
    buttons[1]!.click();
    expect(said.at(-1)?.text).toBe(buffLine({ lure: 'bat' }, 'evening'));
    expect(said.at(-1)?.text).toBe(
      'A bat comes out to see what smells so good, wherever you are outdoors, till this evening or till you catch it.',
    );
    api.set([]);
    expect(chips.element.hidden).toBe(true);
  });

  it('says till morning plainly', () => {
    expect(buffLine('bites', 'morning')).toBe('The fish bite sooner till morning.');
  });
});
