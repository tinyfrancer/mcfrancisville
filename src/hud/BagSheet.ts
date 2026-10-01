import { ITEMS, type ItemKind } from '../data/items';
import type { ItemId, ShelfId } from '../types/ids';
import type { Stack } from '../world/Bag';
import { collection, type Entry, type Group } from './collection';
import { el, openSheet } from './dom';
import { itemCard } from './itemCard';

/** What the bag sheet may ask of the game. Like the others, it never reaches the world directly. */
export interface BagApi {
  contents(): readonly Stack[];
  /** Whether something is for eating: a dish, a snack or a treat (phase R). */
  canEat(id: ItemId): boolean;
  /** Eats one, and says what it did; null if she couldn't. */
  eat(id: ItemId): string | null;
  /** Draws an item's picture into a canvas at 1×, for the sheet to scale up. */
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** How many of it she has on her wrist (0.2's W1). */
  worn(id: ItemId): number;
  /** Whether she could put one more on: a bracelet with one spare and room on her wrist. */
  canWear(id: ItemId): boolean;
  /** Puts one on her wrist; false if she couldn't. */
  wear(id: ItemId): boolean;
  /** Slips one off her wrist, back into only her bag. */
  takeOff(id: ItemId): boolean;
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
export const BAG_GROUPS: readonly (Group & { kinds: readonly ItemKind[] })[] = [
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

export interface BagEntry extends Entry {
  id: ItemId;
  /** How many of it are on her wrist. */
  worn: number;
}

/** Her bag, by kind: each shelf in turn, and on each, things in the order she found them. */
export function bagEntries(
  api: Pick<BagApi, 'contents' | 'isNew'> & Partial<Pick<BagApi, 'worn'>>,
): BagEntry[] {
  const order = BAG_GROUPS.map((g) => g.id);
  return api
    .contents()
    .map((s) => ({
      id: s.id,
      name: ITEMS[s.id].name,
      group: groupOf(s.id),
      count: s.count,
      isNew: api.isNew(s.id),
      worn: api.worn?.(s.id) ?? 0,
    }))
    .map((e) => (e.worn > 0 ? { ...e, tag: 'on' } : e))
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
  const card = itemCard((canvas, id) => api.icon(canvas, id));
  const quiet = () =>
    card.prompt(
      'Tap something to look at it',
      'Everything you gather lands here. It never gets too full to carry.',
    );
  quiet();
  let picked: ItemId | null = null;
  const eat = el('button', { type: 'button', className: 'hud-price hud-eat' }, 'Eat');
  eat.addEventListener('click', () => {
    if (!picked) return;
    const said = api.eat(picked);
    if (!said) return;
    const left = api.contents().find((s) => s.id === picked)?.count ?? 0;
    if (left === 0) {
      picked = null;
      quiet();
      card.say(said);
    } else card.show(picked, left, said, eat);
    bag.refresh();
  });
  const wear = el('button', { type: 'button', className: 'hud-price hud-eat' }, 'Wear');
  const off = el('button', { type: 'button', className: 'hud-price hud-eat' }, 'Take off');
  const wristControls = (id: ItemId) => [
    ...(api.canWear(id) ? [wear] : []),
    ...(api.worn(id) > 0 ? [off] : []),
  ];
  const wristLine = (id: ItemId) => {
    const worn = api.worn(id);
    if (worn === 0) return ITEMS[id].description;
    const on = worn > 1 ? `${worn} of these are` : "You're wearing it";
    return `${ITEMS[id].description} ${on} on your wrist, so it stays with you.`;
  };
  const showPicked = () => {
    if (!picked) return;
    const count = api.contents().find((s) => s.id === picked)?.count ?? 1;
    card.show(picked, count, wristLine(picked), ...wristControls(picked));
    bag.refresh();
  };
  wear.addEventListener('click', () => {
    if (picked && api.wear(picked)) showPicked();
  });
  off.addEventListener('click', () => {
    if (picked && api.takeOff(picked)) showPicked();
  });
  const bag = collection<BagEntry>({
    label: 'your bag',
    entries: () => bagEntries(api),
    groups: BAG_GROUPS,
    sorts: ['kind', 'new', 'name', 'most'],
    layout: 'grid',
    icon: (canvas, e) => api.icon(canvas, e.id),
    describe: (e) => `${e.name}, ${e.count}${e.worn > 0 ? ', wearing' : ''}`,
    pick(e) {
      picked = e.id;
      const row = ITEMS[e.id];
      if (row.kind === 'bracelet') {
        showPicked();
        return;
      }
      eat.setAttribute('aria-label', `Eat a ${row.name.toLowerCase()}`);
      card.show(e.id, e.count ?? 1, row.description, ...(api.canEat(e.id) ? [eat] : []));
    },
    pressed: (e) => e.id === picked,
    empty: 'Nothing in here yet. Shake a tree, or pick some flowers!',
    memory: 'bag',
  });
  sheet.head.append(bag.tools);
  sheet.body.append(bag.list);
  sheet.actions(card.element);
  return sheet.close;
}
