import type { Ware } from '../../data/shop';
import { groupOf, orderPrice } from '../../systems/catalogue';
import { sameWare } from '../../systems/shop';
import type { CatalogueGroup } from '../../data/catalogue';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Belongings } from './Belongings';
import type { Deliveries } from './Deliveries';
import type { Wallet } from './Wallet';

/** One page of the catalogue: something she has had, what it costs, and whether it can come. */
export interface CatalogueEntry {
  ware: Ware;
  group: CatalogueGroup;
  price: number;
  /** Something kept once (clothes, walls, floors, pets' things) that's on its way already. */
  yours: boolean;
}

/**
 * Ollie's catalogue (0.3's S1), at his counter: everything she has ever had that a shop sells,
 * ordered again at the shelf's full price and brought round next morning (`Deliveries`). The
 * shops' daily deals stay the way to find something new; this is the way to have two.
 */
export class Catalogue {
  private readonly ctx: WorldContext;
  private readonly wallet: Wallet;
  private readonly belongings: Belongings;
  private readonly deliveries: Deliveries;

  constructor(
    ctx: WorldContext,
    parts: { wallet: Wallet; belongings: Belongings; deliveries: Deliveries },
  ) {
    this.ctx = ctx;
    ({ wallet: this.wallet, belongings: this.belongings, deliveries: this.deliveries } = parts);
  }

  /**
   * Every page, in the order she first had each thing: what she could have again. Something kept
   * once (clothes, walls, floors, pets' things) is hers for good, so it has a page only once it
   * isn't, which nothing does yet.
   */
  entries(): CatalogueEntry[] {
    return this.belongings.ever().flatMap((ware) => {
      const price = orderPrice(ware);
      const group = groupOf(ware);
      if (price === null || group === null || this.belongings.owns(ware)) return [];
      return [{ ware, group, price, yours: this.yours(ware) }];
    });
  }

  /**
   * Orders one, paid now and brought round in the morning. Null, and nothing spent, for something
   * she has never had, that no shop sells, she can't afford, or is kept once and hers already.
   */
  order(ware: Ware): WorldEvent | null {
    const price = orderPrice(ware);
    if (price === null || !this.belongings.hasHad(ware) || this.yours(ware)) return null;
    if (!this.wallet.spend(price)) return null;
    this.deliveries.send(ware);
    this.ctx.signals.emit('ordered', { ware });
    return { kind: 'ordered', ware, price };
  }

  /** Something kept once that she has, or that's coming already: one is all she needs. */
  private yours(ware: Ware): boolean {
    if ('furniture' in ware || 'item' in ware) return false;
    return this.belongings.owns(ware) || this.deliveries.onTheWay().some((w) => sameWare(w, ware));
  }
}
