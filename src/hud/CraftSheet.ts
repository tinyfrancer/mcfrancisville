import { ITEMS } from '../data/items';
import { RECIPES, recipeAbout, recipeName } from '../data/recipes';
import type { CantMake } from '../systems/crafting';
import type { ItemId, RecipeId } from '../types/ids';
import { collection, type Entry, type Group } from './collection';
import { el, openSheet } from './dom';

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
  /** Whether she learned it since she last looked at the workbench. */
  isNew(id: RecipeId): boolean;
  /** She has looked at the workbench. */
  seen(): void;
  /** Draws what a recipe makes at 1×. */
  icon(canvas: HTMLCanvasElement, id: RecipeId): void;
  itemIcon(canvas: HTMLCanvasElement, id: ItemId): void;
}

const CRAFT_GROUPS: readonly Group[] = [
  { id: 'bracelets', label: 'Bracelets' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'home', label: 'Home' },
];

function groupOf(id: RecipeId): string {
  const made = RECIPES[id].makes;
  return 'item' in made ? 'bracelets' : 'furniture' in made ? 'furniture' : 'home';
}

/** What the button says when she can't make something, where that isn't just "Make". */
const WAITING: Partial<Record<CantMake, string>> = {
  built: 'Built!',
  notYet: 'Soon',
};

interface RecipeEntry extends Entry {
  id: RecipeId;
}

/**
 * Her workbench: what she knows how to make, by bracelets, furniture and her house, what each
 * needs against what she has, and a button to make it there and then.
 */
export function openWorkbench(hud: HTMLElement, api: CraftApi): () => void {
  const sheet = openSheet(hud, {
    title: 'Workbench',
    line: 'What shall we make today? New recipe cards turn up at Cobweb Corner.',
    className: 'hud-craft-sheet',
    onClose: () => api.seen(),
  });
  const message = el('p', { className: 'hud-message' });
  const head = el('div', { className: 'hud-shop-head' }, message);
  const say = (text: string) => {
    message.textContent = text;
    head.hidden = text === '';
  };
  say('');

  function needs(id: RecipeId): HTMLElement {
    const chips = el('span', { className: 'hud-needs' });
    for (const { item, count } of RECIPES[id].needs) {
      const have = api.count(item);
      const need = el('canvas', { className: 'hud-need-icon' });
      api.itemIcon(need, item);
      const chip = el('span', { className: 'hud-need' }, need, `${Math.min(have, count)}/${count}`);
      chip.toggleAttribute('data-short', have < count);
      chip.setAttribute('aria-label', `${ITEMS[item].name}: ${have} of ${count}`);
      chip.title = ITEMS[item].name;
      chips.append(chip);
    }
    return chips;
  }

  const bench = collection<RecipeEntry>({
    label: 'your recipes',
    entries: () =>
      api.recipes().map((id) => ({
        id,
        name: recipeName(id),
        group: groupOf(id),
        isNew: api.isNew(id),
      })),
    groups: CRAFT_GROUPS,
    sorts: ['kind', 'new', 'name'],
    layout: 'list',
    icon: (canvas, e) => api.icon(canvas, e.id),
    row(e) {
      const why = api.cantMake(e.id);
      const make = el('button', { type: 'button', className: 'hud-price' });
      make.textContent = (why && WAITING[why]) ?? 'Make';
      make.disabled = why !== null;
      make.setAttribute('aria-label', `Make ${e.name}`);
      make.addEventListener('click', () => {
        const said = api.make(e.id);
        if (said) say(said);
        bench.refresh();
      });
      const about =
        why === 'notYet' ? 'Build the roomy extension first, then this one.' : recipeAbout(e.id);
      return { about, end: make, extra: needs(e.id) };
    },
    empty: 'No recipes yet.',
    memory: 'workbench',
  });
  sheet.head.append(head, bench.tools);
  sheet.body.append(bench.list);
  return sheet.close;
}
