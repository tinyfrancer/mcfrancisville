import { ITEMS, type ItemKind } from '../data/items';
import type { ItemId, ShelfId } from '../types/ids';
import type { Stack } from '../world/Bag';
import { collection, type Entry, type Group } from './collection';
import { el, openSheet } from './dom';

/** What the bag sheet may ask of the game. Like the others, it never reaches the world directly. */
export interface BagApi {
  contents(): readonly Stack[];
  /** Whether something is for eating: a dish, a snack or a treat (phase R). */
  canEat(id: ItemId): boolean;
  /** Eats one, and says what it did; null if she couldn't. */
  eat(id: ItemId): string | null;
  /** Draws an item's picture into a canvas at 1×, for the sheet to scale up. */
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Whether it came since she last looked in her bag. */
  isNew(id: ItemId): boolean;
  /** She has looked: nothing in it is new any more. */
  seen(): void;
}

/** How many new things are on each of her collections, for a dot on its button. */
export interface FreshApi {
  counts(): Record<ShelfId, number>;
  /** Calls `listener` whenever they change. Returns a function that stops it. */
  onChange(listener: () => void): () => void;
}

/** The bag's shelves, in the order it keeps them. */
const BAG_GROUPS: readonly (Group & { kinds: readonly ItemKind[] })[] = [
  { id: 'gathered', label: 'Gathered', kinds: ['material', 'flower'] },
  { id: 'food', label: 'Food', kinds: ['crop', 'dish', 'treat', 'snack'] },
  { id: 'seeds', label: 'Seeds', kinds: ['seed'] },
  { id: 'critters', label: 'Critters', kinds: ['critter'] },
  { id: 'crafts', label: 'Crafts', kinds: ['bead', 'bracelet', 'gear'] },
  { id: 'treasures', label: 'Treasures', kinds: ['squishy', 'record', 'bone', 'keepsake'] },
];

function groupOf(id: ItemId): string {
  const kind = ITEMS[id].kind;
  return BAG_GROUPS.find((g) => g.kinds.includes(kind))!.id;
}

interface BagEntry extends Entry {
  id: ItemId;
}

/** Her bag, by kind: each shelf in turn, and on each, things in the order she found them. */
export function bagEntries(api: Pick<BagApi, 'contents' | 'isNew'>): BagEntry[] {
  const order = BAG_GROUPS.map((g) => g.id);
  return api
    .contents()
    .map((s) => ({
      id: s.id,
      name: ITEMS[s.id].name,
      group: groupOf(s.id),
      count: s.count,
      isNew: api.isNew(s.id),
    }))
    .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
}

/**
 * Her bag: a slot for each thing she has found, with how many, and a tap on one to read about it.
 * It has no weight and never fills (decisions.md 33).
 */
export function openBag(hud: HTMLElement, api: BagApi): () => void {
  const sheet = openSheet(hud, {
    title: 'Your bag',
    className: 'hud-bag-sheet',
    onClose: () => api.seen(),
  });
  const name = el('h3', {}, 'Tap something to look at it');
  const about = el('p', {}, 'Everything you gather lands here. It never gets too full to carry.');
  let picked: ItemId | null = null;
  const eat = el('button', { type: 'button', className: 'hud-price hud-eat' }, 'Eat');
  eat.hidden = true;
  eat.addEventListener('click', () => {
    if (!picked) return;
    const said = api.eat(picked);
    if (!said) return;
    const left = api.contents().find((s) => s.id === picked)?.count ?? 0;
    name.textContent = left > 1 ? `${ITEMS[picked].name} ×${left}` : ITEMS[picked].name;
    about.textContent = said;
    if (left === 0) {
      picked = null;
      eat.hidden = true;
    }
    bag.refresh();
  });
  const bag = collection<BagEntry>({
    label: 'your bag',
    entries: () => bagEntries(api),
    groups: BAG_GROUPS,
    sorts: ['kind', 'new', 'name', 'most'],
    layout: 'grid',
    icon: (canvas, e) => api.icon(canvas, e.id),
    describe: (e) => `${e.name}, ${e.count}`,
    pick(e) {
      picked = e.id;
      const row = ITEMS[e.id];
      name.textContent = e.count && e.count > 1 ? `${row.name} ×${e.count}` : row.name;
      about.textContent = row.description;
      eat.hidden = !api.canEat(e.id);
      eat.setAttribute('aria-label', `Eat a ${row.name.toLowerCase()}`);
    },
    pressed: (e) => e.id === picked,
    empty: 'Nothing in here yet. Shake a tree, or pick some flowers!',
    memory: 'bag',
  });
  sheet.head.append(bag.tools);
  sheet.body.append(bag.list);
  sheet.actions(el('div', { className: 'hud-detail' }, name, about, eat));
  return sheet.close;
}
