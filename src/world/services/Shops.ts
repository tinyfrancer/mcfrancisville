import type { Ware } from '../../data/shop';
import { dayKey, windowOf } from '../../systems/clock';
import { isHappening } from '../../systems/calendar';
import { canSell, paysOn, sameWare, stockOf, wantedOn, type Shelf } from '../../systems/shop';
import { atTheFair } from '../../systems/venues';
import type { ItemId, ShopId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Stalls } from '../zones/Stalls';
import type { Belongings } from './Belongings';
import type { Wallet } from './Wallet';

/**
 * Cobweb Corner, the pop-up, the Moon Pie Man and market day's stall at the fairground: their
 * stock, and buying and selling.
 */
export class Shops {
  private readonly ctx: WorldContext;
  private readonly wallet: Wallet;
  private readonly bag: Bag;
  private readonly belongings: Belongings;
  private readonly stalls: Stalls;

  constructor(ctx: WorldContext, wallet: Wallet, bag: Bag, belongings: Belongings, stalls: Stalls) {
    this.ctx = ctx;
    this.wallet = wallet;
    this.bag = bag;
    this.belongings = belongings;
    this.stalls = stalls;
  }

  /**
   * Whether a shop is open to her today. Cobweb Corner always is; the pop-up and the Moon Pie Man
   * only when they're in town; the market stall on market day, once the fairground is open.
   */
  isOpen(shop: ShopId): boolean {
    if (shop === 'popUp') return this.stalls.popUp() !== null;
    if (shop === 'moonPie') return this.stalls.moonPieCart() !== null;
    if (shop === 'market') {
      return atTheFair() && isHappening('marketDay', dayKey(this.ctx.clock.now()));
    }
    return true;
  }

  /** What a shop has on its shelves this window. */
  stock(shop: ShopId): Shelf[] {
    const now = this.ctx.clock.now();
    return stockOf(shop, dayKey(now), windowOf(now), atTheFair());
  }

  /**
   * Buys one of something on a shop's shelves today, into wherever it belongs. Null, and nothing
   * spent, if the shop is shut, it isn't on the shelves now, she can't afford it, or it's
   * something kept once that she already has.
   */
  buy(shop: ShopId, ware: Ware): WorldEvent | null {
    if (!this.isOpen(shop)) return null;
    // A special may be on another shelf too, at its full price; she pays the lower.
    const offer = this.stock(shop)
      .flatMap((shelf) => shelf.offers)
      .filter((o) => sameWare(o.ware, ware))
      .sort((a, b) => a.price - b.price)[0];
    if (!offer || offer.price > this.wallet.candy) return null;
    if (!this.belongings.receive(ware)) return null;
    this.wallet.spend(offer.price);
    this.ctx.signals.emit('bought', { shop, ware });
    return { kind: 'bought', shop, ware, price: offer.price };
  }

  /** Cobweb Corner's wanted list this week (0.2's E1): a critter, a crop and a dish. */
  wanted(): ItemId[] {
    return wantedOn(dayKey(this.ctx.clock.now()));
  }

  /** What Cobweb Corner pays for one today, double for what's wanted this week. */
  pays(item: ItemId): number {
    return paysOn(item, dayKey(this.ctx.clock.now()));
  }

  /** Sells `count` of something in her bag, if she has that many and a shop will take it. */
  sell(item: ItemId, count = 1): WorldEvent | null {
    if (!canSell(item) || !this.bag.remove(item, count)) return null;
    const candy = this.pays(item) * count;
    this.ctx.events.emit('bag', this.bag.contents);
    this.wallet.earn(candy);
    return { kind: 'sold', item, count, candy };
  }
}
