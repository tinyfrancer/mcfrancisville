import type { Belongings } from '../services/Belongings';
import { CandyTree } from '../services/CandyTree';
import { Visits } from '../services/Visits';
import type { Shared } from './shared';

/**
 * Candy that comes while she's away, and a gift a visit (phase O). The honesty stall is made with
 * the workbench, which builds onto it (`making`, decisions.md 218).
 */
export interface Passive {
  visits: Visits;
  candyTree: CandyTree;
}

export function passive(s: Shared, belongings: Belongings): Passive {
  const { ctx, options, bag, wallet } = s;
  return {
    visits: new Visits(ctx, { bag, wallet, belongings, name: s.town.name }, options.visits),
    candyTree: new CandyTree(ctx, { wallet, bag }, options.candyTree),
  };
}
