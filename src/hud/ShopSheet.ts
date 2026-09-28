import { FLOORINGS, FURNITURE, WALLPAPERS } from '../data/furniture';
import { ITEMS } from '../data/items';
import { OUTFITS } from '../data/outfits';
import { ACCESSORIES } from '../data/pets';
import { recipeName } from '../data/recipes';
import { SHOPS, type Ware } from '../data/shop';
import type { Offer, Shelf } from '../systems/shop';
import type {
  AccessoryId,
  FlooringId,
  FurnitureId,
  ItemId,
  OutfitId,
  RecipeId,
  ShopId,
  WallpaperId,
} from '../types/ids';
import type { Stack } from '../world/Bag';
import { fitIcon, ROW_ICON, SLOT_ICON, slotCount } from './collection';
import { el, openSheet } from './dom';
import { boughtLine, candy, soldLine, wontBuy } from './messages';
import { choiceRow } from './pickers';
import { ripensIn } from './SeedSheet';

/** What the shop sheet may ask of the game. Like the others, it never reaches the world directly. */
export interface ShopApi {
  candy(): number;
  /** Calls `listener` whenever her Candy changes. Returns a function that stops it. */
  onCandy(listener: (candy: number) => void): () => void;
  stock(shop: ShopId): Shelf[];
  bag(): readonly Stack[];
  /** Whether she already has something bought once: clothing, walls and floors, or a recipe. */
  owns(ware: Ware): boolean;
  /** What Cobweb Corner pays for one; 0 for what it won't take. */
  sellValue(item: ItemId): number;
  /** Buys one; false if it couldn't be bought. */
  buy(shop: ShopId, ware: Ware): boolean;
  /** Sells `count`; false if they couldn't be sold. */
  sell(item: ItemId, count: number): boolean;
  /** Draws an item's picture into a canvas at 1×, for the sheet to scale up. */
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Draws her wearing a piece, close up on where it's worn, at 1×. */
  tryOn(canvas: HTMLCanvasElement, outfit: OutfitId): void;
  /** Draws a piece of furniture into a square canvas at 1×. */
  pieceIcon(canvas: HTMLCanvasElement, id: FurnitureId): void;
  /** Draws what a recipe makes at 1×. */
  recipeIcon(canvas: HTMLCanvasElement, id: RecipeId): void;
  /** Draws a tile of a wallpaper or a flooring at 1×. */
  surfaceIcon(
    canvas: HTMLCanvasElement,
    surface: { wallpaper: WallpaperId } | { flooring: FlooringId },
  ): void;
  /** Draws a pet's accessory at 1×. */
  accessoryIcon(canvas: HTMLCanvasElement, id: AccessoryId): void;
}

type Tab = 'Buy' | 'Sell';

/**
 * A shop's counter: today's shelves to buy from, and, at Cobweb Corner, her bag to sell from. The
 * pop-up only sells: it's a costume shop, and it won't be here long enough to resell anything.
 */
export function openShop(hud: HTMLElement, api: ShopApi, shop: ShopId): () => void {
  const row = SHOPS[shop];
  const sheet = openSheet(hud, {
    title: row.name,
    line: row.greeting,
    className: 'hud-shop-sheet',
  });
  const purse = el('p', { className: 'hud-purse' });
  const message = el('p', { className: 'hud-message' });
  const body = el('div', { className: 'hud-shop-body' });
  const buysBack = shop === 'corner';
  let tab: Tab = 'Buy';
  let selling: ItemId | null = null;

  const render = () => {
    purse.textContent = `${candy(api.candy())} Candy`;
    body.replaceChildren(...(tab === 'Buy' ? buyShelves() : sellGrid()));
  };

  function buyShelves(): HTMLElement[] {
    return api
      .stock(shop)
      .map((shelf) =>
        el(
          'section',
          {},
          el('h3', {}, shelf.name),
          el('div', { className: 'hud-wares' }, ...shelf.offers.map(ware)),
        ),
      );
  }

  function ware(offer: Offer): HTMLElement {
    const icon = el('canvas', { className: 'hud-icon' });
    const w = offer.ware;
    let name: string;
    let about: string;
    let owned = false;
    if ('item' in w) {
      api.icon(icon, w.item);
      name = ITEMS[w.item].name;
      const have = api.bag().find((s) => s.id === w.item)?.count ?? 0;
      const kind = ITEMS[w.item].kind;
      about = kind === 'seed' ? `${ripensIn(w.item)}.` : ITEMS[w.item].description;
      if (have > 0) about = `${about} You have ${have}.`;
    } else if ('furniture' in w) {
      api.pieceIcon(icon, w.furniture);
      name = FURNITURE[w.furniture].name;
      about = FURNITURE[w.furniture].description;
    } else if ('recipe' in w) {
      api.recipeIcon(icon, w.recipe);
      name = `Recipe: ${recipeName(w.recipe)}`;
      owned = api.owns(w);
      about = owned ? 'You know this one already.' : 'A recipe card, to make it at your workbench.';
    } else if ('outfit' in w) {
      api.tryOn(icon, w.outfit);
      const outfit = OUTFITS[w.outfit];
      name = outfit.name;
      owned = api.owns(w);
      const colours = outfit.fabrics.length;
      about = owned ? 'In your closet already.' : `Comes in ${colours} colours, blue among them.`;
    } else if ('accessory' in w) {
      api.accessoryIcon(icon, w.accessory);
      name = ACCESSORIES[w.accessory].name;
      owned = api.owns(w);
      about = owned ? 'Yours already.' : ACCESSORIES[w.accessory].description;
    } else {
      api.surfaceIcon(icon, w);
      name =
        'wallpaper' in w
          ? `${WALLPAPERS[w.wallpaper].name} wallpaper`
          : `${FLOORINGS[w.flooring].name} flooring`;
      owned = api.owns(w);
      about = owned ? 'Yours already.' : 'For your home. Yours to keep once it’s bought.';
    }
    const buy = el('button', { type: 'button', className: 'hud-price' });
    buy.textContent = owned ? 'Yours' : candy(offer.price);
    buy.disabled = owned || offer.price > api.candy();
    buy.setAttribute('aria-label', owned ? `${name}, yours` : `Buy ${name} for ${offer.price}`);
    buy.addEventListener('click', () => {
      if (!api.buy(shop, w)) return;
      message.textContent = boughtLine(w);
      render();
    });
    fitIcon(icon, ROW_ICON);
    return el(
      'div',
      { className: 'hud-ware' },
      el('span', { className: 'hud-icon-box' }, icon),
      el('span', { className: 'hud-ware-text' }, el('strong', {}, name), el('small', {}, about)),
      buy,
    );
  }

  function sellGrid(): HTMLElement[] {
    const stacks = api.bag();
    if (selling && !stacks.some((s) => s.id === selling)) selling = null;
    const grid = el('div', { className: 'hud-bag' });
    grid.setAttribute('role', 'list');
    for (const stack of stacks) {
      const icon = el('canvas', { className: 'hud-icon' });
      api.icon(icon, stack.id);
      fitIcon(icon, SLOT_ICON);
      const slot = el('button', { type: 'button', className: 'hud-slot' }, icon);
      slot.setAttribute('role', 'listitem');
      slot.setAttribute('aria-label', `${ITEMS[stack.id].name}, ${stack.count}`);
      slot.setAttribute('aria-pressed', String(stack.id === selling));
      if (stack.count > 1) slot.append(el('span', { className: 'hud-count' }, String(stack.count)));
      slot.addEventListener('click', () => {
        selling = stack.id;
        message.textContent = '';
        render();
      });
      grid.append(slot);
    }
    for (let i = stacks.length; i < slotCount(stacks.length); i++) {
      grid.append(el('div', { className: 'hud-slot hud-slot-empty' }));
    }
    return [grid, sellCounter(stacks)];
  }

  function sellCounter(stacks: readonly Stack[]): HTMLElement {
    const stack = stacks.find((s) => s.id === selling);
    if (!stack) return el('p', {}, 'Tap something in your bag to see what it would fetch.');
    const each = api.sellValue(stack.id);
    const name = el(
      'h3',
      {},
      stack.count > 1 ? `${ITEMS[stack.id].name} ×${stack.count}` : ITEMS[stack.id].name,
    );
    if (each === 0) return el('div', {}, name, el('p', {}, wontBuy(stack.id)));
    const sell = (count: number) => {
      if (!api.sell(stack.id, count)) return;
      message.textContent = soldLine(stack.id, count, each * count);
      render();
    };
    const one = el('button', { type: 'button', className: 'hud-sell-one' });
    one.textContent = `Sell 1 for ${candy(each)}`;
    one.addEventListener('click', () => sell(1));
    const buttons: HTMLElement[] = [one];
    if (stack.count > 1) {
      const all = el('button', { type: 'button', className: 'hud-sell-all' });
      all.textContent = `Sell all ${stack.count} for ${candy(each * stack.count)}`;
      all.addEventListener('click', () => sell(stack.count));
      buttons.push(all);
    }
    return el(
      'div',
      {},
      name,
      el('p', {}, `${row.name} pays ${candy(each)} each.`),
      el('div', { className: 'hud-row' }, ...buttons),
    );
  }

  // Her Candy and what just happened stay in sight while the shelves scroll under them.
  const head = el('div', { className: 'hud-shop-head' }, purse, message);
  const parts: HTMLElement[] = [head];
  if (buysBack) {
    const tabs = choiceRow<Tab>(
      [
        { id: 'Buy', label: 'Buy' },
        { id: 'Sell', label: 'Sell' },
      ],
      tab,
      (next) => {
        tab = next;
        message.textContent = '';
        render();
      },
    );
    tabs.element.classList.add('hud-tabs');
    parts.push(tabs.element);
  }
  render();
  sheet.head.append(...parts);
  sheet.body.append(body);
  return sheet.close;
}
