import type { PropArrivals } from '../arrivals';
import type { Belongings } from '../services/Belongings';
import { CandyTree } from '../services/CandyTree';
import { Henhouse } from '../services/Henhouse';
import { Visits } from '../services/Visits';
import type { Shared } from './shared';

/**
 * Candy that comes while she's away, and a gift a visit (phase O). The honesty stall is made with
 * the workbench, which builds onto it (`making`, decisions.md 218).
 */
export interface Passive {
  visits: Visits;
  candyTree: CandyTree;
  /** The hens at Boo Acres (1.6's X3), whose eggs are laid while she's away. */
  henhouse: Henhouse;
  /** The pots by her door, the candy tree and its saplings, and the coop, walked up to. */
  arrivals: PropArrivals;
}

export function passive(s: Shared, belongings: Belongings): Passive {
  const { ctx, options, bag, wallet, porch } = s;
  const candyTree = new CandyTree(ctx, { wallet, bag }, options.candyTree);
  const farm = s.beyond.find((b) => b.id === 'booAcres')?.map;
  const coop = farm?.props.find((p) => p.id === 'coop') ?? null;
  const henhouse = new Henhouse(ctx, { bag }, { scene: s.town.scene, coop }, options.henhouse);
  return {
    visits: new Visits(ctx, { bag, wallet, belongings, name: s.town.name }, options.visits),
    candyTree,
    henhouse,
    arrivals: {
      pottedPlant: () => [{ kind: 'potted', plant: porch.swap() }],
      candyTree: () => [candyTree.shake()],
      saplingPlot: ({ prop }) => [candyTree.tend(prop)],
      // Walking up to the coop opens its card (`moments.ts`), and nothing more.
      coop: () => [],
    },
  };
}
