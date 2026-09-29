import { ITEMS, type ItemKind } from '../../data/items';
import { isTool, type Held } from '../../data/tools';
import type { ItemId, ToolId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';

/** What in her bag she can hold: seeds to plant, and sprinklers to fit (phase P). */
const HOLDABLE: readonly (ItemKind | undefined)[] = ['seed', 'gear'];

/**
 * What she's holding, picked on the quick bar (phase M): her hands, her net, her watering can, or
 * a seed to plant. It follows what she does, too: watering a bed puts the can in her hand, and
 * swinging at a critter her net, unless she's holding a seed, which she keeps until it runs out.
 */
export class Hands {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  private holding: Held;

  /** A saved seed she has none of any more, or anything this build doesn't know, is her hands. */
  constructor(ctx: WorldContext, bag: Bag, saved?: string) {
    this.ctx = ctx;
    this.bag = bag;
    this.holding = saved !== undefined && this.canHold(saved) ? saved : 'hands';
    ctx.events.on('bag', () => {
      if (!this.canHold(this.holding)) this.put('hands');
    });
  }

  get held(): Held {
    return this.holding;
  }

  /** The seed in her hand, if it's one. */
  get seed(): ItemId | null {
    if (isTool(this.holding)) return null;
    return ITEMS[this.holding].kind === 'seed' ? this.holding : null;
  }

  /** Picks something up from the quick bar. False for a seed she has none of. */
  hold(held: string): boolean {
    if (!this.canHold(held)) return false;
    this.put(held);
    return true;
  }

  /** Picks up a tool to do something with it, unless she's holding a seed or a sprinkler. */
  use(tool: ToolId): void {
    if (isTool(this.holding)) this.put(tool);
  }

  snapshot(): { held: Held } {
    return { held: this.holding };
  }

  private canHold(held: string): held is Held {
    if (isTool(held)) return true;
    const row = ITEMS[held as ItemId];
    return HOLDABLE.includes(row?.kind) && this.bag.count(held as ItemId) > 0;
  }

  private put(held: Held): void {
    if (held === this.holding) return;
    this.holding = held;
    this.ctx.events.emit('held', held);
  }
}
