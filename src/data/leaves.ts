import type { PropId } from '../types/ids';

/**
 * Leaves falling under the trees in autumn (V1's E5): which trees let them go, in which months,
 * and how many at once from each. Only to be seen, so nothing in the world knows of them. L4's
 * seasons may turn the crowns themselves; these fall whatever colour the crown is.
 */
export const FALLING_LEAVES = {
  trees: ['tree', 'oldTree', 'willow', 'appleTree', 'pearTree', 'plumTree', 'persimmonTree'],
  /** September to November, 1 to 12. */
  months: [9, 10, 11],
  /** How many leaves fall from each tree, each in its own time. */
  perTree: 2,
} as const satisfies { trees: readonly PropId[]; months: readonly number[]; perTree: number };
