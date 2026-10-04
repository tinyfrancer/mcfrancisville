import { FLOORINGS, FURNITURE, turnCount, WALLPAPERS, type Layer } from '../data/furniture';
import type { Placed } from '../data/home';
import { ITEMS } from '../data/items';
import type { FlooringId, FurnitureId, ItemId, WallpaperId } from '../types/ids';
import { BAG_GROUPS, bagEntries, type BagEntry } from './BagSheet';
import { collection, fitIcon, SLOT_ICON, type Entry, type Group } from './collection';
import { el, openSheet } from './dom';
import { howMany, itemCard, type ItemCard } from './itemCard';

/** What the home's sheets and bar may ask of the game. Like the others, they never reach the world. */
export interface HomeApi {
  /** Whether she's at home, where decorating happens. */
  indoors(): boolean;
  /**
   * Calls `listener` when she goes in or out, starts or stops decorating, picks up a piece, or
   * her home changes. Returns a function that stops it.
   */
  onChange(listener: () => void): () => void;
  /** What's waiting in her storage chest. */
  stored(): readonly { id: FurnitureId; count: number }[];
  /** The piece she has picked up while decorating, null if none, or undefined if not decorating. */
  selected(): Placed | null | undefined;
  startDecorating(): void;
  stopDecorating(): void;
  /** Takes a piece out of the chest and sets it down beside her, picked up. False if no room. */
  takeOut(id: FurnitureId): boolean;
  turn(): boolean;
  putAway(): boolean;
  wallpapers(): readonly WallpaperId[];
  floorings(): readonly FlooringId[];
  wallpaper(): WallpaperId;
  flooring(): FlooringId;
  paper(id: WallpaperId): void;
  lay(id: FlooringId): void;
  /** Whether a piece came since she last looked in her storage chest. */
  isNew(id: FurnitureId): boolean;
  /** She has looked in her storage chest. */
  seen(): void;
  /** Draws a piece, facing her, into a square canvas at 1×. */
  icon(canvas: HTMLCanvasElement, id: FurnitureId): void;
  /** The things from her bag waiting in her storage chest (0.3's H1). */
  items(): readonly { id: ItemId; count: number }[];
  /** Takes `count` of a thing out of the chest into her bag; false if there aren't that many. */
  takeOutItem(id: ItemId, count: number): boolean;
  /** Draws a thing from her bag at 1×. */
  itemIcon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Draws a tile of a wallpaper or flooring at 1×. */
  surfaceIcon(
    canvas: HTMLCanvasElement,
    surface: { wallpaper: WallpaperId } | { flooring: FlooringId },
  ): void;
}

/** The storage chest's shelves. */
const STORAGE_GROUPS: readonly (Group & { layer: Layer })[] = [
  { id: 'floor', label: 'Furniture', layer: 'floor' },
  { id: 'wall', label: 'On the walls', layer: 'wall' },
  { id: 'rug', label: 'Rugs', layer: 'rug' },
];

interface StoredEntry extends Entry {
  id: FurnitureId;
}

/** The storage chest's tabs: her furniture, and the things from her bag she put away (0.3's H1). */
const STORAGE_TABS = [
  { id: 'furniture', label: 'Furniture' },
  { id: 'items', label: 'Items' },
];

/**
 * Her storage chest: every piece she owns that isn't out, with how many, and a button to put one
 * out. It sets the piece down beside her, picked up, so her next tap says where it goes. Its Items
 * tab holds what she put away from her bag, with a card in the foot to take some back out.
 */
export function openStorage(hud: HTMLElement, api: HomeApi): () => void {
  const paint = (tab: string) => {
    chest.tools.hidden = tab !== 'furniture';
    things.tools.hidden = tab !== 'items';
    sheet.actions(...(tab === 'items' ? [card.element] : []));
  };
  const sheet = openSheet(hud, {
    title: 'Storage chest',
    line: 'Everything you own that isn’t out is kept safe in here.',
    className: 'hud-storage-sheet',
    tabs: STORAGE_TABS,
    memory: 'storage',
    onTab: (tab) => paint(tab),
    onClose: () => api.seen(),
  });
  const chest = collection<StoredEntry>({
    label: 'your storage chest',
    entries: () =>
      api.stored().map(({ id, count }) => ({
        id,
        name: FURNITURE[id].name,
        group: FURNITURE[id].layer,
        count,
        isNew: api.isNew(id),
      })),
    groups: STORAGE_GROUPS,
    sorts: ['kind', 'new', 'name'],
    layout: 'list',
    icon: (canvas, e) => api.icon(canvas, e.id),
    row(e) {
      const out = el('button', { type: 'button', className: 'hud-price', textContent: 'Put out' });
      out.setAttribute('aria-label', `Put out ${e.name}`);
      out.addEventListener('click', () => {
        sheet.close();
        api.takeOut(e.id);
      });
      return { about: FURNITURE[e.id].description, end: out };
    },
    empty: 'Your storage chest is empty. Cobweb Corner has new furniture every morning!',
    memory: 'storage',
  });
  const card = itemCard((canvas, id) => api.itemIcon(canvas, id));
  const things = storedItems(api, card);
  sheet.head.append(chest.tools, things.tools);
  sheet.panel('furniture').append(chest.list);
  sheet.panel('items').append(things.list);
  paint(sheet.tab());
  return sheet.close;
}

/** The chest's Items tab: her things laid out as her bag lays them, and the card to take some out. */
function storedItems(api: HomeApi, card: ItemCard) {
  let picked: ItemId | null = null;
  const quiet = () =>
    card.prompt(
      'Tap something to take it out',
      'Things you put away from your bag wait in here, safe, for as long as you like.',
    );
  quiet();
  const show = (said?: string) => {
    const stack = api.items().find((s) => s.id === picked);
    if (!stack) {
      picked = null;
      quiet();
      if (said) card.say(said);
      return;
    }
    const take = (n: number) => {
      if (!api.takeOutItem(stack.id, n)) return;
      show(n === 1 ? 'One back in your bag.' : `${n} back in your bag.`);
      things.refresh();
    };
    const some = el('button', { type: 'button', className: 'hud-price hud-take-out' });
    const label = (n: number) => {
      some.textContent = n === 1 && stack.count === 1 ? 'Take out' : `Take out ${n}`;
    };
    label(1);
    const count = howMany(stack.count, label);
    some.addEventListener('click', () => take(count.value()));
    const controls: HTMLElement[] = [some];
    if (stack.count > 1) {
      const all = el('button', { type: 'button', className: 'hud-price hud-take-all' });
      all.textContent = 'Take out all';
      all.setAttribute('aria-label', `Take out all ${stack.count}`);
      all.addEventListener('click', () => take(stack.count));
      controls.push(count.element, all);
    }
    card.show(stack.id, stack.count, said ?? ITEMS[stack.id].description, ...controls);
  };
  const things = collection<BagEntry>({
    label: 'the things in your storage chest',
    entries: () => bagEntries({ contents: () => api.items(), isNew: () => false }),
    groups: BAG_GROUPS,
    sorts: ['kind', 'name', 'most'],
    layout: 'grid',
    icon: (canvas, e) => api.itemIcon(canvas, e.id),
    describe: (e) => `${e.name}, ${e.count}`,
    pick(e) {
      picked = e.id;
      show();
    },
    pressed: (e) => e.id === picked,
    empty: 'Nothing put away yet. Tap something in your bag while you’re home to keep it in here.',
    memory: 'chestItems',
  });
  return things;
}

/** Her walls and floor: every wallpaper and flooring she owns, the one that's up pressed in. */
export function openSurfaces(hud: HTMLElement, api: HomeApi): () => void {
  const sheet = openSheet(hud, {
    title: 'Walls & floors',
    line: 'New ones turn up at Cobweb Corner. Every one you buy is yours to keep.',
    className: 'hud-surfaces-sheet',
    tabs: [
      { id: 'walls', label: 'Wallpaper' },
      { id: 'floors', label: 'Flooring' },
    ],
    memory: 'surfaces',
  });

  const swatches = <Id extends string>(
    ids: readonly Id[],
    current: () => Id,
    name: (id: Id) => string,
    draw: (canvas: HTMLCanvasElement, id: Id) => void,
    pick: (id: Id) => void,
  ) => {
    const row = el('div', { className: 'hud-choices' });
    const buttons = ids.map((id) => {
      const icon = el('canvas', { className: 'hud-icon' });
      draw(icon, id);
      fitIcon(icon, SLOT_ICON);
      const button = el('button', { type: 'button', className: 'hud-slot hud-surface' }, icon);
      button.setAttribute('aria-label', name(id));
      button.title = name(id);
      button.addEventListener('click', () => {
        pick(id);
        refresh();
      });
      return button;
    });
    const refresh = () =>
      buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(ids[i] === current())));
    refresh();
    row.append(...buttons);
    return row;
  };

  sheet.panel('walls').append(
    swatches(
      api.wallpapers(),
      api.wallpaper,
      (id) => WALLPAPERS[id].name,
      (canvas, wallpaper) => api.surfaceIcon(canvas, { wallpaper }),
      api.paper,
    ),
  );
  sheet.panel('floors').append(
    swatches(
      api.floorings(),
      api.flooring,
      (id) => FLOORINGS[id].name,
      (canvas, flooring) => api.surfaceIcon(canvas, { flooring }),
      api.lay,
    ),
  );
  return sheet.close;
}

/**
 * The bar along the bottom while she decorates: what a tap will do, and the buttons for the piece
 * she has picked up (turn it, put it away) or for the room (the chest, the walls and floor).
 * `render` redraws it from the api whenever decorating changes.
 */
export function decorBar(hud: HTMLElement, api: HomeApi): { element: HTMLElement; render(): void } {
  const element = el('div', { className: 'hud-decor-bar' });
  element.setAttribute('role', 'toolbar');
  element.setAttribute('aria-label', 'Decorating');
  const line = el('p', {});
  const buttons = el('div', { className: 'hud-row' });
  element.append(line, buttons);

  const button = (text: string, onClick: () => void, primary = false) => {
    const b = el('button', { type: 'button', textContent: text });
    if (primary) b.className = 'hud-primary';
    b.addEventListener('click', onClick);
    return b;
  };

  const render = () => {
    const selected = api.selected();
    element.hidden = selected === undefined;
    if (selected === undefined) return;
    const done = button('Done', api.stopDecorating, true);
    if (selected) {
      const row = FURNITURE[selected.id];
      line.textContent = `${row.name}: tap where it should go.`;
      const turn = button('↻ Turn', api.turn);
      turn.disabled = turnCount(selected.id) === 1;
      buttons.replaceChildren(turn, button('Put away', api.putAway), done);
    } else {
      line.textContent = 'Tap a piece to pick it up.';
      buttons.replaceChildren(
        button('Storage', () => openStorage(hud, api)),
        button('Walls & floors', () => openSurfaces(hud, api)),
        done,
      );
    }
  };
  render();
  return { element, render };
}
