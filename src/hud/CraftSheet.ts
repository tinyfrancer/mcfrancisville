import { DISHES, isDish, PANTRY } from '../data/dishes';
import {
  needName,
  RECIPES,
  recipeAbout,
  recipeName,
  type Need,
  type Station,
} from '../data/recipes';
import type { CantMake } from '../systems/crafting';
import type { ItemId, RecipeId } from '../types/ids';
import { collection, type Entry, type Group } from './collection';
import { el, openSheet } from './dom';

/**
 * What the workbench, or a stove, may ask of the game. Like the other sheets, it never reaches the
 * world.
 */
export interface CraftApi {
  /** Every recipe she knows here, in the order it shows them. */
  recipes(): readonly RecipeId[];
  /** Why she can't make one now, or null if she can. */
  cantMake(id: RecipeId): CantMake | null;
  /** What a recipe needs, each with how many she has for it. */
  needs(id: RecipeId): readonly { need: Need; have: number }[];
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

/** How the workbench and the stove differ: what they're called, and how their recipes group. */
interface StationSheet {
  title: string;
  line: string;
  className: string;
  /** The button's word, and for the collection, what the list is. */
  verb: string;
  label: string;
  empty: string;
  groups: readonly Group[];
  groupOf(id: RecipeId): string;
  memory: string;
}

const SHEETS: Record<Station, StationSheet> = {
  bench: {
    title: 'Workbench',
    line: 'What shall we make today? New recipe cards turn up at Cobweb Corner.',
    className: 'hud-craft-sheet',
    verb: 'Make',
    label: 'your recipes',
    empty: 'No recipes yet.',
    groups: [
      { id: 'bracelets', label: 'Bracelets' },
      { id: 'furniture', label: 'Furniture' },
      { id: 'home', label: 'Home' },
    ],
    groupOf(id) {
      const made = RECIPES[id].makes;
      return 'item' in made ? 'bracelets' : 'furniture' in made ? 'furniture' : 'home';
    },
    memory: 'workbench',
  },
  // Phase R. Dishes group by what eating them does, which is why she'd pick one.
  stove: {
    title: 'Stove',
    line: "What's cooking? Eat a dish from your bag for a little treat, or give it to a friend.",
    className: 'hud-craft-sheet hud-stove-sheet',
    verb: 'Cook',
    label: 'your dishes',
    empty: 'No dishes yet.',
    groups: [
      { id: 'lures', label: 'Lures' },
      { id: 'pep', label: 'Pep' },
      { id: 'fishing', label: 'Fishing' },
    ],
    groupOf(id) {
      const made = RECIPES[id].makes;
      const effect = 'item' in made && isDish(made.item) ? DISHES[made.item].effect : 'pep';
      return typeof effect === 'object' ? 'lures' : effect === 'bites' ? 'fishing' : 'pep';
    },
    memory: 'stove',
  },
};

/** What the button says when she can't make something, where that isn't just "Make". */
const WAITING: Partial<Record<CantMake, string>> = {
  built: 'Built!',
  notYet: 'Soon',
  night: 'After dark',
};

interface RecipeEntry extends Entry {
  id: RecipeId;
}

/**
 * Her workbench: what she knows how to make, by bracelets, furniture and her house, what each
 * needs against what she has, and a button to make it there and then.
 */
export function openWorkbench(hud: HTMLElement, api: CraftApi): () => void {
  return openStation(hud, api, 'bench');
}

/** A stove, hers or Wrapunzel's (phase R): the dishes she knows, as the workbench shows its things. */
export function openStove(hud: HTMLElement, api: CraftApi): () => void {
  return openStation(hud, api, 'stove');
}

function openStation(hud: HTMLElement, api: CraftApi, station: Station): () => void {
  const at = SHEETS[station];
  const sheet = openSheet(hud, {
    title: at.title,
    line: at.line,
    className: at.className,
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
    for (const { need, have } of api.needs(id)) {
      const { count } = need;
      const icon = el('canvas', { className: 'hud-need-icon' });
      api.itemIcon(icon, 'item' in need ? need.item : PANTRY[need.any].icon);
      const chip = el('span', { className: 'hud-need' }, icon, `${Math.min(have, count)}/${count}`);
      chip.toggleAttribute('data-short', have < count);
      chip.toggleAttribute('data-any', 'any' in need);
      const name = needName(need);
      chip.setAttribute('aria-label', `${name}: ${have} of ${count}`);
      chip.title = name;
      chips.append(chip);
    }
    return chips;
  }

  const bench = collection<RecipeEntry>({
    label: at.label,
    entries: () =>
      api.recipes().map((id) => ({
        id,
        name: recipeName(id),
        group: at.groupOf(id),
        isNew: api.isNew(id),
      })),
    groups: at.groups,
    sorts: ['kind', 'new', 'name'],
    layout: 'list',
    icon: (canvas, e) => api.icon(canvas, e.id),
    row(e) {
      const why = api.cantMake(e.id);
      const make = el('button', { type: 'button', className: 'hud-price' });
      make.textContent = (why && WAITING[why]) ?? at.verb;
      make.disabled = why !== null;
      make.setAttribute('aria-label', `${at.verb} ${e.name}`);
      make.addEventListener('click', () => {
        const said = api.make(e.id);
        if (said) say(said);
        bench.refresh();
      });
      const about =
        why === 'notYet' ? 'Build the roomy extension first, then this one.' : recipeAbout(e.id);
      return { about, end: make, extra: needs(e.id) };
    },
    empty: at.empty,
    memory: at.memory,
  });
  sheet.head.append(head, bench.tools);
  sheet.body.append(bench.list);
  return sheet.close;
}
