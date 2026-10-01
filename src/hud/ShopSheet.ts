import { FLOORINGS, FURNITURE, WALLPAPERS } from '../data/furniture';
import { ITEMS } from '../data/items';
import { colourList, OUTFITS, recolours } from '../data/outfits';
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
import { BAG_GROUPS, bagEntries, type BagEntry } from './BagSheet';
import { collection, fitIcon, ROW_ICON } from './collection';
import { el, openSheet } from './dom';
import { howMany, itemCard } from './itemCard';
import { boughtLine, candy, soldLine, wantedLine, wontBuy } from './messages';
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
  /** What Cobweb Corner pays for one today, double if it's wanted; 0 for what it won't take. */
  sellValue(item: ItemId): number;
  /** Cobweb Corner's wanted list this week (0.2's E1). */
  wanted(): readonly ItemId[];
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
    const buying = tab === 'Buy';
    finder.hidden = buying;
    // The greeting gives its room to the week's wanted list while she sells.
    sheet.line(buying ? row.greeting : wantedLine(api.wanted()));
    if (buying) {
      body.replaceChildren(...buyShelves());
      sheet.actions();
      return;
    }
    bagView.refresh();
    body.replaceChildren(bagView.list);
    counter();
    sheet.actions(card.element);
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
      const colours = recolours(w.outfit) ? ` Comes in ${colourList(w.outfit)}.` : '';
      about = owned ? 'In your closet already.' : `${outfit.description}${colours}`;
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
    if (offer.was !== undefined && !owned) {
      buy.prepend(el('s', { className: 'hud-was' }, candy(offer.was)), ' ');
    }
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

  // Her bag, as the bag sheet shows it, and a card in the foot for the one she tapped: however
  // full her bag, what it fetches and the buttons to sell it are always in sight (0.2's B4).
  const card = itemCard((canvas, id) => api.icon(canvas, id));
  const bagView = collection<BagEntry>({
    label: 'your bag',
    entries: () => bagEntries({ contents: () => api.bag(), isNew: () => false }),
    groups: BAG_GROUPS,
    sorts: ['kind', 'name', 'most'],
    layout: 'grid',
    icon: (canvas, e) => api.icon(canvas, e.id),
    describe: (e) => `${e.name}, ${e.count}`,
    pick(e) {
      selling = e.id;
      message.textContent = '';
      counter();
    },
    pressed: (e) => e.id === selling,
    empty: 'Nothing in your bag to sell just yet.',
    memory: 'sell',
  });

  function counter(): void {
    const stack = api.bag().find((s) => s.id === selling);
    if (!stack) {
      selling = null;
      card.prompt('Tap something to sell it', 'You’ll see what it would fetch before it goes.');
      return;
    }
    const each = api.sellValue(stack.id);
    if (each === 0) {
      card.show(stack.id, stack.count, wontBuy(stack.id));
      return;
    }
    const sell = (count: number) => {
      if (!api.sell(stack.id, count)) return;
      message.textContent = soldLine(stack.id, count, each * count);
      render();
    };
    const some = el('button', { type: 'button', className: 'hud-price hud-sell-one' });
    const price = (n: number) => {
      some.textContent = `Sell ${n} for ${candy(each * n)}`;
    };
    price(1);
    const count = howMany(stack.count, price);
    some.addEventListener('click', () => sell(count.value()));
    const controls: HTMLElement[] = [some];
    if (stack.count > 1) {
      const all = el('button', { type: 'button', className: 'hud-price hud-sell-all' });
      all.textContent = 'Sell all';
      all.setAttribute('aria-label', `Sell all ${stack.count} for ${each * stack.count}`);
      all.addEventListener('click', () => sell(stack.count));
      controls.push(count.element, all);
    }
    const wanted = api.wanted().includes(stack.id) ? ' Wanted this week, so double!' : '';
    card.show(stack.id, stack.count, `${row.name} pays ${candy(each)} each.${wanted}`, ...controls);
  }

  // Her Candy and what just happened stay in sight while the shelves scroll under them.
  const head = el('div', { className: 'hud-shop-head' }, purse, message);
  const parts: HTMLElement[] = [head];
  const finder = el('div', { className: 'hud-shop-finder' }, bagView.tools);
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
    parts.push(tabs.element, finder);
  }
  render();
  sheet.head.append(...parts);
  sheet.body.append(body);
  return sheet.close;
}
