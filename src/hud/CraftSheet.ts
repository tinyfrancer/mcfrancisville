import { ITEMS } from '../data/items';
import { RECIPES, recipeAbout, recipeName } from '../data/recipes';
import type { CantMake } from '../systems/crafting';
import type { ItemId, RecipeId } from '../types/ids';
import { el, openSheet } from './dom';
import { choiceRow } from './pickers';

/** What the workbench may ask of the game. Like the other sheets, it never reaches the world. */
export interface CraftApi {
  /** Every recipe she knows, in the workbench's order. */
  recipes(): readonly RecipeId[];
  /** Why she can't make one now, or null if she can. */
  cantMake(id: RecipeId): CantMake | null;
  /** How many of something she has in her bag. */
  count(item: ItemId): number;
  /** Makes one, and says what happened; null if it couldn't be made. */
  make(id: RecipeId): string | null;
  /** Draws what a recipe makes at 1×. */
  icon(canvas: HTMLCanvasElement, id: RecipeId): void;
  itemIcon(canvas: HTMLCanvasElement, id: ItemId): void;
}

type Tab = 'Bracelets' | 'Furniture' | 'Home';

function tabOf(id: RecipeId): Tab {
  const made = RECIPES[id].makes;
  return 'item' in made ? 'Bracelets' : 'furniture' in made ? 'Furniture' : 'Home';
}

/** What the button says when she can't make something, where that isn't just "Make". */
const WAITING: Partial<Record<CantMake, string>> = {
  built: 'Built!',
  notYet: 'Soon',
};

/**
 * Her workbench: what she knows how to make, a tab each for bracelets, furniture and her house,
 * what each needs against what she has, and a button to make it there and then.
 */
export function openWorkbench(hud: HTMLElement, api: CraftApi): () => void {
  const { sheet, close } = openSheet(hud, { className: 'hud-craft-sheet' });
  const message = el('p', { className: 'hud-message' });
  const head = el('div', { className: 'hud-shop-head' }, message);
  const say = (text: string) => {
    message.textContent = text;
    head.hidden = text === '';
  };
  say('');
  const body = el('div', { className: 'hud-wares' });
  let tab: Tab = 'Bracelets';

  const render = () => {
    body.replaceChildren(
      ...api
        .recipes()
        .filter((id) => tabOf(id) === tab)
        .map(recipe),
    );
  };

  function recipe(id: RecipeId): HTMLElement {
    const row = RECIPES[id];
    const icon = el('canvas', { className: 'furniture' in row.makes ? 'hud-piece' : 'hud-item' });
    api.icon(icon, id);
    const needs = el('span', { className: 'hud-needs' });
    for (const { item, count } of row.needs) {
      const have = api.count(item);
      const need = el('canvas', { className: 'hud-need-icon' });
      api.itemIcon(need, item);
      const chip = el('span', { className: 'hud-need' }, need, `${Math.min(have, count)}/${count}`);
      chip.toggleAttribute('data-short', have < count);
      chip.setAttribute('aria-label', `${ITEMS[item].name}: ${have} of ${count}`);
      chip.title = ITEMS[item].name;
      needs.append(chip);
    }
    const why = api.cantMake(id);
    const name = recipeName(id);
    const make = el('button', { type: 'button', className: 'hud-price' });
    make.textContent = (why && WAITING[why]) ?? 'Make';
    make.disabled = why !== null;
    make.setAttribute('aria-label', `Make ${name}`);
    make.addEventListener('click', () => {
      const said = api.make(id);
      if (said) say(said);
      render();
    });
    const about =
      why === 'notYet' ? 'Build the roomy extension first, then this one.' : recipeAbout(id);
    return el(
      'div',
      { className: 'hud-ware' },
      icon,
      el(
        'span',
        { className: 'hud-ware-text' },
        el('strong', {}, name),
        el('small', {}, about),
        needs,
      ),
      make,
    );
  }

  const tabs = choiceRow<Tab>(
    (['Bracelets', 'Furniture', 'Home'] as const).map((id) => ({ id, label: id })),
    tab,
    (next) => {
      tab = next;
      say('');
      render();
    },
  );
  tabs.element.classList.add('hud-tabs');
  const done = el('button', { type: 'button', className: 'hud-primary', textContent: 'Done' });
  done.addEventListener('click', close);
  render();
  sheet.append(
    el('h2', {}, 'Workbench'),
    el('p', {}, 'What shall we make today? New recipe cards turn up at Cobweb Corner.'),
    head,
    tabs.element,
    body,
    el('div', { className: 'hud-row' }, done),
  );
  return close;
}
