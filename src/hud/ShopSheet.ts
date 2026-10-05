import { SHOPS, type Ware } from '../data/shop';
import { BOOK_GROUPS, BOOK_LINE } from '../data/workshop';
import type { Offer, Shelf } from '../systems/shop';
import type { BookPage } from '../systems/workshop';
import type { FurnitureId, ItemId, ShopId } from '../types/ids';
import type { Stack } from '../world/Bag';
import { BAG_GROUPS, bagEntries, type BagEntry } from './BagSheet';
import { collection, fitIcon, ROW_ICON, type Entry } from './collection';
import { el, openSheet } from './dom';
import { howMany, itemCard } from './itemCard';
import { boughtLine, candy, madeToOrderLine, soldLine, wantedLine, wontBuy } from './messages';
import { drawWare, faceOf, type WareArt } from './wares';

/** What the shop sheet may ask of the game. Like the others, it never reaches the world directly. */
export interface ShopApi extends WareArt {
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
  /** Every page of Gourdon's book (0.3's S2): every piece he makes, and what he asks. */
  book(): readonly BookPage[];
  /** Orders a piece from his book, to come in the morning; false if it couldn't be ordered. */
  orderMade(piece: FurnitureId): boolean;
  /** What's on its way on Ollie's round, ordered and not yet come. */
  onTheWay(): readonly Ware[];
}

/** What a counter may have besides its shelves: her bag to sell from, or Gourdon's book. */
type CounterTab = 'buy' | 'sell' | 'book';

/**
 * The tabs at a counter that has more than its shelves, the shelves first; a shop not here is all
 * shelves, and needs no tabs. A tab is a row.
 */
const COUNTER_TABS: Partial<Record<ShopId, readonly { id: CounterTab; label: string }[]>> = {
  // Only Cobweb Corner buys back: the pop-up won't be here long enough to resell anything.
  corner: [
    { id: 'buy', label: 'Buy' },
    { id: 'sell', label: 'Sell' },
  ],
  workshop: [
    { id: 'buy', label: 'The bench' },
    { id: 'book', label: 'His book' },
  ],
};

interface BookEntry extends Entry {
  page: BookPage;
  about: string;
}

/**
 * A shop's counter: today's shelves to buy from; at Cobweb Corner, her bag to sell from; and at
 * Gourdon's workshop, his book, any piece he makes, made to order (0.3's S2).
 */
export function openShop(hud: HTMLElement, api: ShopApi, shop: ShopId): () => void {
  const row = SHOPS[shop];
  const tabs = COUNTER_TABS[shop];
  const sheet = openSheet(hud, {
    title: row.name,
    line: row.greeting,
    className: 'hud-shop-sheet',
    ...(tabs ? { tabs, onTab: changed } : {}),
  });
  const purse = el('p', { className: 'hud-purse' });
  const message = el('p', { className: 'hud-message' });
  const shelves = tabs ? sheet.panel('buy') : sheet.body;
  let selling: ItemId | null = null;
  function changed() {
    message.textContent = '';
    render();
  }
  const tab = (): CounterTab => (tabs ? (sheet.tab() as CounterTab) : 'buy');

  const render = () => {
    purse.textContent = `${candy(api.candy())} Candy`;
    const at = tab();
    finder.hidden = at !== 'sell';
    bookFinder.hidden = at !== 'book';
    // The greeting gives its room to the week's wanted list while she sells, and to Gourdon's word
    // on his book while she reads it.
    sheet.line(at === 'sell' ? wantedLine(api.wanted()) : at === 'book' ? BOOK_LINE : row.greeting);
    if (at === 'buy') {
      shelves.replaceChildren(...buyShelves());
      sheet.actions();
      return;
    }
    if (at === 'book') {
      book.refresh();
      sheet.actions();
      return;
    }
    bagView.refresh();
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
    drawWare(icon, api, w);
    const has = {
      count: (id: ItemId) => api.bag().find((s) => s.id === id)?.count ?? 0,
      owns: api.owns,
    };
    const { name, about, owned } = faceOf(w, has);
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

  // Gourdon's book (0.3's S2): every piece he makes, by where it goes, an Order button each.
  const book = collection<BookEntry>({
    label: "Gourdon's book",
    entries: () => {
      const coming = api.onTheWay();
      return api.book().map((page) => {
        const ware: Ware = { furniture: page.piece };
        const { name, about } = faceOf(ware, { count: () => 0, owns: () => false });
        const n = coming.filter((w) => 'furniture' in w && w.furniture === page.piece).length;
        const due = n === 0 ? '' : ` ${n === 1 ? 'One' : n} on its way.`;
        return { id: page.piece, name, group: page.group, page, about: `${about}${due}` };
      });
    },
    groups: BOOK_GROUPS,
    sorts: ['kind', 'name'],
    layout: 'list',
    icon: (canvas, e) => api.pieceIcon(canvas, e.page.piece),
    row: (e) => ({ about: e.about, end: orderButton(e) }),
    empty: 'Nothing in the book yet.',
    memory: 'workshop',
  });

  function orderButton(e: BookEntry): HTMLElement {
    const { piece, price } = e.page;
    const b = el('button', { type: 'button', className: 'hud-price' });
    b.textContent = candy(price);
    b.disabled = price > api.candy();
    b.setAttribute('aria-label', `Order ${e.name} for ${price}`);
    b.addEventListener('click', () => {
      if (!api.orderMade(piece)) return;
      message.textContent = madeToOrderLine({ furniture: piece });
      render();
    });
    return b;
  }

  // Her Candy and what just happened stay in sight while the shelves scroll under them.
  const head = el('div', { className: 'hud-shop-head' }, purse, message);
  const finder = el('div', { className: 'hud-shop-finder' }, bagView.tools);
  const bookFinder = el('div', { className: 'hud-shop-finder' }, book.tools);
  sheet.head.append(head, finder, bookFinder);
  if (tabs?.some((t) => t.id === 'sell')) sheet.panel('sell').append(bagView.list);
  if (tabs?.some((t) => t.id === 'book')) sheet.panel('book').append(book.list);
  render();
  return sheet.close;
}
