import type { TreeLook } from '../../data/passive';
import { nextWindowStart, windowOf } from '../../systems/clock';
import { treeCandy, treeLook, treeWindows } from '../../systems/passive';
import { isSweetSeason, treeSweet } from '../../systems/trickOrTreat';
import type { Bag } from '../Bag';
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
 * she last shook it. While the Halloween Festival is on, a sweet falls with it (0.2's J2).
 */
export class CandyTree {
  private readonly ctx: WorldContext;
  private readonly wallet: Wallet;
  private readonly bag: Bag;
  private shaken: number | null;

  constructor(
    ctx: WorldContext,
    keeps: { wallet: Wallet; bag: Bag },
    saved?: Partial<CandyTreeSnapshot>,
  ) {
    this.ctx = ctx;
    this.wallet = keeps.wallet;
    this.bag = keeps.bag;
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
    if (!isSweetSeason(now)) return { kind: 'shook', candy };
    const sweet = treeSweet(now);
    this.bag.add(sweet, 1);
    this.ctx.events.emit('bag', this.bag.contents);
    return { kind: 'shook', candy, sweet };
  }

  snapshot(): { candyTree: CandyTreeSnapshot } {
    return { candyTree: { shaken: this.shaken } };
  }
}
