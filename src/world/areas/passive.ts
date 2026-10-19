import type { PropArrivals } from '../arrivals';
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
  /** The pots by her door, the candy tree and its saplings, walked up to. */
  arrivals: PropArrivals;
}

export function passive(s: Shared, belongings: Belongings): Passive {
  const { ctx, options, bag, wallet, porch } = s;
  const candyTree = new CandyTree(ctx, { wallet, bag }, options.candyTree);
  return {
    visits: new Visits(ctx, { bag, wallet, belongings, name: s.town.name }, options.visits),
    candyTree,
    arrivals: {
      pottedPlant: () => [{ kind: 'potted', plant: porch.swap() }],
      candyTree: () => [candyTree.shake()],
      saplingPlot: ({ prop }) => [candyTree.tend(prop)],
    },
  };
}
