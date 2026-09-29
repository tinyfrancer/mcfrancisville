import type { TreeLook } from '../../data/passive';
import { nextWindowStart, windowOf } from '../../systems/clock';
import { treeCandy, treeLook, treeWindows } from '../../systems/passive';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Wallet } from './Wallet';

export interface CandyTreeSnapshot {
  /** When she last shook it; null if she never has. */
  shaken: number | null;
}

/**
 * The candy tree by her house (phase O, decisions.md 82): it grows a little Candy each window,
 * up to a week's, and walking up to it shakes down all it holds. How much is worked out from when
 * she last shook it.
 */
export class CandyTree {
  private readonly ctx: WorldContext;
  private readonly wallet: Wallet;
  private shaken: number | null;

  constructor(ctx: WorldContext, wallet: Wallet, saved?: Partial<CandyTreeSnapshot>) {
    this.ctx = ctx;
    this.wallet = wallet;
    const at = saved?.shaken;
    this.shaken = typeof at === 'number' && Number.isFinite(at) ? at : null;
  }

  /** How many windows' candy it holds now. */
  windows(): number {
    return treeWindows(this.shaken, this.ctx.clock.now());
  }

  look(): TreeLook {
    return treeLook(this.windows());
  }

  /** When she last shook it, for the view to wiggle it. */
  get shakenAt(): number | null {
    return this.shaken;
  }

  /** Shakes down what it holds, into her Candy; bare, it says when there'll be more. */
  shake(): WorldEvent {
    const now = this.ctx.clock.now();
    const candy = treeCandy(this.windows());
    this.shaken = now;
    if (candy === 0) return { kind: 'shook', candy, back: windowOf(nextWindowStart(now)) };
    this.wallet.earn(candy);
    return { kind: 'shook', candy };
  }

  snapshot(): { candyTree: CandyTreeSnapshot } {
    return { candyTree: { shaken: this.shaken } };
  }
}
