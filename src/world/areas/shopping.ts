import { Catalogue } from '../services/Catalogue';
import { Deliveries } from '../services/Deliveries';
import type { Belongings } from '../services/Belongings';
import type { Mailbox } from '../services/Mailbox';
import type { Shared } from './shared';

/** Ollie's round and his catalogue (0.3's S1): what she orders, and its coming in the morning. */
export interface Shopping {
  deliveries: Deliveries;
  catalogue: Catalogue;
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
  return { deliveries, catalogue };
}
