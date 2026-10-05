import { Catalogue } from '../services/Catalogue';
import { Deliveries } from '../services/Deliveries';
import { Workshop } from '../services/Workshop';
import type { Belongings } from '../services/Belongings';
import type { Mailbox } from '../services/Mailbox';
import type { Shared } from './shared';

/**
 * Ollie's round and his catalogue (0.3's S1), and Gourdon's book (0.3's S2): what she orders, and
 * its coming in the morning.
 */
export interface Shopping {
  deliveries: Deliveries;
  catalogue: Catalogue;
  workshop: Workshop;
}

interface ShoppingParts {
  mailbox: Mailbox;
  belongings: Belongings;
}

export function shopping(s: Shared, parts: ShoppingParts): Shopping {
  const { ctx, options } = s;
  const deliveries = new Deliveries(ctx, parts.mailbox, options.orders);
  const catalogue = new Catalogue(ctx, {
    wallet: s.wallet,
    belongings: parts.belongings,
    deliveries,
  });
  const workshop = new Workshop(ctx, { wallet: s.wallet, deliveries });
  return { deliveries, catalogue, workshop };
}
