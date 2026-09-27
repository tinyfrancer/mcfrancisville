import type { Ware } from '../../data/shop';
import { dayKey } from '../../systems/clock';
import { canSell, sameWare, sellValue, stockOf, type Shelf } from '../../systems/shop';
import type { ItemId, ShopId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Stalls } from '../zones/Stalls';
import type { Belongings } from './Belongings';
import type { Wallet } from './Wallet';

/** Cobweb Corner, the pop-up and the Moon Pie Man: their stock, and buying and selling. */
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
   * only when they're in town.
   */
  isOpen(shop: ShopId): boolean {
    if (shop === 'popUp') return this.stalls.popUp() !== null;
    if (shop === 'moonPie') return this.stalls.moonPieCart() !== null;
    return true;
  }

  /** What a shop has on its shelves today. */
  stock(shop: ShopId): Shelf[] {
    return stockOf(shop, dayKey(this.ctx.clock.now()));
  }

  /**
   * Buys one of something on a shop's shelves today, into wherever it belongs. Null, and nothing
   * spent, if the shop is shut, it isn't on the shelves today, she can't afford it, or it's
   * something kept once that she already has.
   */
  buy(shop: ShopId, ware: Ware): WorldEvent | null {
    if (!this.isOpen(shop)) return null;
    const offer = this.stock(shop)
      .flatMap((shelf) => shelf.offers)
      .find((o) => sameWare(o.ware, ware));
    if (!offer || offer.price > this.wallet.candy) return null;
    if (!this.belongings.receive(ware)) return null;
    this.wallet.spend(offer.price);
    this.ctx.signals.emit('bought', { shop, ware });
    return { kind: 'bought', shop, ware, price: offer.price };
  }

  /** Sells `count` of something in her bag, if she has that many and a shop will take it. */
  sell(item: ItemId, count = 1): WorldEvent | null {
    if (!canSell(item) || !this.bag.remove(item, count)) return null;
    const candy = sellValue(item) * count;
    this.ctx.events.emit('bag', this.bag.contents);
    this.wallet.earn(candy);
    return { kind: 'sold', item, count, candy };
  }
}
