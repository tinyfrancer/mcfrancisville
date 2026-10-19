import type { PropId } from '../types/ids';
import type { SeasonId } from './milestones';

/**
 * Leaves falling under the trees in autumn (V1's E5): which trees let them go, in which months,
 * and how many at once from each. Only to be seen, so nothing in the world knows of them. The
 * season is L4's rule (`seasonOf`, decision 294); these fall whatever colour the crown is.
 */
export const FALLING_LEAVES = {
  trees: ['tree', 'oldTree', 'willow', 'appleTree', 'pearTree', 'plumTree', 'persimmonTree'],
  /** Autumn, September to November. */
  season: 'autumn',
  /** How many leaves fall from each tree, each in its own time. */
  perTree: 2,
} as const satisfies { trees: readonly PropId[]; season: SeasonId; perTree: number };
