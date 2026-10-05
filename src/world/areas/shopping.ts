import { Catalogue } from '../services/Catalogue';
import { Deliveries } from '../services/Deliveries';
import { Figurines } from '../services/Figurines';
import { Workshop } from '../services/Workshop';
import type { Belongings } from '../services/Belongings';
import type { Mailbox } from '../services/Mailbox';
import type { Had } from '../../systems/milestones';
import type { Shared } from './shared';

/**
 * Ollie's round and his catalogue (0.3's S1), and Gourdon's book (0.3's S2): what she orders, and
 * its coming in the morning; and his figurines (0.3's C3), carved from three of a kind.
 */
export interface Shopping {
  deliveries: Deliveries;
  catalogue: Catalogue;
  workshop: Workshop;
  figurines: Figurines;
}

interface ShoppingParts {
  mailbox: Mailbox;
  belongings: Belongings;
  /** Whether she has ever had a thing (the milestones, made later). */
  hasHad: (id: Had) => boolean;
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
  const { belongings, hasHad } = parts;
  const figurines = new Figurines(ctx, { bag: s.bag, belongings, hasHad });
  return { deliveries, catalogue, workshop, figurines };
}
