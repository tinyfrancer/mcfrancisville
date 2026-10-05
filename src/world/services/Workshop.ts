import type { Ware } from '../../data/shop';
import type { FurnitureId } from '../../types/ids';
import { bookPages, bookPrice, type BookPage } from '../../systems/workshop';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Deliveries } from './Deliveries';
import type { Wallet } from './Wallet';

/**
 * Gourdon's book (0.3's S2), at his bench: any piece he makes, paid as it's ordered, made overnight
 * and brought round by Ollie in the morning (`Deliveries`), so a piece she wants is a day away and
 * never a wait on the dealing. Fresh from the bench is a shelf, bought through `Shops`.
 */
export class Workshop {
  private readonly ctx: WorldContext;
  private readonly wallet: Wallet;
  private readonly deliveries: Deliveries;

  constructor(ctx: WorldContext, parts: { wallet: Wallet; deliveries: Deliveries }) {
    this.ctx = ctx;
    ({ wallet: this.wallet, deliveries: this.deliveries } = parts);
  }

  /** Every page of his book. */
  book(): BookPage[] {
    return bookPages();
  }

  /**
   * Orders a piece made, paid now and brought round in the morning. Null, and nothing spent, for a
   * piece he doesn't make or one she can't afford.
   */
  order(piece: FurnitureId): WorldEvent | null {
    const price = bookPrice(piece);
    if (price === null || !this.wallet.spend(price)) return null;
    const ware: Ware = { furniture: piece };
    this.deliveries.send(ware);
    this.ctx.signals.emit('ordered', { ware });
    return { kind: 'ordered', ware, price };
  }
}
