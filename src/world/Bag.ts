import { ITEMS, STARTER_BAG } from '../data/items';
import type { ItemId } from '../types/ids';

export interface Stack {
  id: ItemId;
  count: number;
}

/**
 * Everything she carries: stacks with no limit and no weight, in the order she first found each
 * thing. It never fills, so nothing she picks up is ever turned away (decisions.md 11).
 */
export class Bag {
  private readonly stacks: Stack[] = [];

  /**
   * `saved` is the bag from a save, or the starter bag for a new game. An id this build doesn't
   * know (a retired item) is left out rather than the save being set aside over it.
   */
  constructor(saved: readonly { id: string; count: number }[] = STARTER_BAG) {
    for (const { id, count } of saved) {
      if (id in ITEMS && Number.isInteger(count) && count > 0) this.add(id as ItemId, count);
    }
  }

  get contents(): readonly Stack[] {
    return this.stacks;
  }

  count(id: ItemId): number {
    return this.stacks.find((s) => s.id === id)?.count ?? 0;
  }

  add(id: ItemId, count: number): void {
    if (count <= 0) return;
    const stack = this.stacks.find((s) => s.id === id);
    if (stack) stack.count += count;
    else this.stacks.push({ id, count });
  }

  snapshot(): Stack[] {
    return this.stacks.map((s) => ({ ...s }));
  }
}
