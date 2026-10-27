import { ITEMS, type ItemKind } from '../../data/items';
import { isTool, type Held } from '../../data/tools';
import type { ItemId, KiteId, ToolId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';

/** What in her bag she can hold: seeds to plant, sprinklers to fit (phase P), and a kite (1.6's X6). */
const HOLDABLE: readonly (ItemKind | undefined)[] = ['seed', 'gear', 'kite'];

/**
 * What she's holding, picked on the quick bar (phase M): her hands, her net, her watering can, or
 * a seed to plant. It follows what she does, too: watering a bed puts the can in her hand, and
 * swinging at a critter her net, unless she's holding a seed, which she keeps until it runs out;
 * casting to a fish always puts the rod in it (1.7's Y1).
 */
export class Hands {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  private readonly outdoors: () => boolean;
  /** Whether she's somewhere indoors she fishes, the ice hut (1.4's G3), where her rod comes in. */
  private readonly fishingIndoors: () => boolean;
  private holding: Held;

  /** A saved seed she has none of any more, or anything this build doesn't know, is her hands. */
  constructor(
    ctx: WorldContext,
    bag: Bag,
    saved?: string,
    outdoors: () => boolean = () => true,
    fishingIndoors: () => boolean = () => false,
  ) {
    this.ctx = ctx;
    this.bag = bag;
    this.outdoors = outdoors;
    this.fishingIndoors = fishingIndoors;
    this.holding = saved !== undefined && this.canHold(saved) ? saved : 'hands';
    ctx.events.on('bag', () => {
      if (!this.canHold(this.holding)) this.put('hands');
    });
  }

  /**
   * What's in her hand where she is. Her net, can and rod are outdoor things, so she leaves them
   * by the door going in and picks them up again on the way out (1.0.1); a seed or a sprinkler
   * stays in her hand, for the planters inside. Her rod comes into the ice hut (1.4's G3).
   */
  get held(): Held {
    if (!isTool(this.holding) || this.outdoors()) return this.holding;
    return this.holding === 'rod' && this.fishingIndoors() ? 'rod' : 'hands';
  }

  /** The seed in her hand, if it's one. */
  get seed(): ItemId | null {
    if (isTool(this.holding)) return null;
    return ITEMS[this.holding].kind === 'seed' ? this.holding : null;
  }

  /** The kite in her hand, if it's one (1.6's X6). */
  get kite(): KiteId | null {
    if (isTool(this.holding)) return null;
    return ITEMS[this.holding].kind === 'kite' ? (this.holding as KiteId) : null;
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

  /**
   * Picks up a tool whatever's in her hand (1.7's Y1, decision 388): a tap on a fish is only ever
   * fishing, so the rod comes out over a seed or a kite, which wait on the quick bar.
   */
  takeUp(tool: ToolId): void {
    this.put(tool);
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
