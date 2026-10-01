import { CANDY_TREES_MOST, type TreeLook } from '../../data/passive';
import { nextWindowStart, windowOf } from '../../systems/clock';
import type { Tile } from '../../systems/pathfinding';
import {
  dropsSapling,
  saplingDaysLeft,
  treeCandy,
  treeLook,
  treeWindows,
} from '../../systems/passive';
import { isSweetSeason, treeSweet } from '../../systems/trickOrTreat';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Wallet } from './Wallet';

/** A sapling she planted in one of the rings of earth in her yard (0.2's E1). */
export interface PlantedSapling {
  tx: number;
  ty: number;
  /** When she planted it; it's a tree `SAPLING_DAYS` days later. */
  planted: number;
  /** When she last shook it once it's a tree; null if she never has. */
  shaken: number | null;
}

export interface CandyTreeSnapshot {
  /** When she last shook it; null if she never has. */
  shaken: number | null;
  /** The saplings she has planted, growing or grown (save v31). */
  saplings: PlantedSapling[];
}

/** How a ring of earth for a sapling looks: waiting, a sapling, or a candy tree as full as it is. */
export type PlotStage = 'plot' | 'sapling' | TreeLook;

const isTime = (at: unknown): at is number => typeof at === 'number' && Number.isFinite(at);

function repaired(saved: unknown): PlantedSapling[] {
  if (!Array.isArray(saved)) return [];
  return saved.flatMap((s: Partial<PlantedSapling> | null) =>
    typeof s === 'object' &&
    s !== null &&
    Number.isInteger(s.tx) &&
    Number.isInteger(s.ty) &&
    isTime(s.planted)
      ? [{ tx: s.tx!, ty: s.ty!, planted: s.planted, shaken: isTime(s.shaken) ? s.shaken : null }]
      : [],
  );
}

/**
 * The candy tree by her house (phase O, decisions.md 82): it grows a little Candy each window,
 * up to a week's, and walking up to it shakes down all it holds. How much is worked out from when
 * she last shook it. While the Halloween Festival is on, a sweet falls with it (0.2's J2). Now and
 * then a sapling falls too, which she plants in a ring of earth in her yard, and three days later
 * it's a candy tree of its own, filling and shaken just like the first (0.2's E1).
 */
export class CandyTree {
  private readonly ctx: WorldContext;
  private readonly wallet: Wallet;
  private readonly bag: Bag;
  private shaken: number | null;
  private readonly saplings: PlantedSapling[];

  constructor(
    ctx: WorldContext,
    keeps: { wallet: Wallet; bag: Bag },
    saved?: Partial<CandyTreeSnapshot>,
  ) {
    this.ctx = ctx;
    this.wallet = keeps.wallet;
    this.bag = keeps.bag;
    const at = saved?.shaken;
    this.shaken = isTime(at) ? at : null;
    this.saplings = repaired(saved?.saplings);
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
    const shook: WorldEvent & { kind: 'shook' } = { kind: 'shook', candy };
    if (isSweetSeason(now)) {
      shook.sweet = treeSweet(now);
      this.bag.add(shook.sweet, 1);
    }
    if (this.trees() < CANDY_TREES_MOST && dropsSapling(now)) {
      shook.sapling = true;
      this.bag.add('candySapling', 1);
    }
    if (shook.sweet || shook.sapling) this.ctx.events.emit('bag', this.bag.contents);
    return shook;
  }

  /** Her candy trees, the first one, those planted and the saplings in her bag. */
  private trees(): number {
    return 1 + this.saplings.length + this.bag.count('candySapling');
  }

  private at(spot: Tile): PlantedSapling | undefined {
    return this.saplings.find((s) => s.tx === spot.tx && s.ty === spot.ty);
  }

  /** How a ring of earth looks now. */
  stage(spot: Tile): PlotStage {
    const sapling = this.at(spot);
    if (!sapling) return 'plot';
    const now = this.ctx.clock.now();
    if (saplingDaysLeft(sapling.planted, now) > 0) return 'sapling';
    return treeLook(treeWindows(sapling.shaken, now));
  }

  /** When she last shook the tree in a ring, for the view to wiggle it. */
  shakenAtSpot(spot: Tile): number | null {
    return this.at(spot)?.shaken ?? null;
  }

  /**
   * She walked up to a ring of earth: plants a sapling from her bag in it, says how long one
   * has still to grow, or shakes the tree it has grown into.
   */
  tend(spot: Tile): WorldEvent {
    const now = this.ctx.clock.now();
    const sapling = this.at(spot);
    if (!sapling) {
      if (!this.bag.remove('candySapling', 1)) return { kind: 'sapling', did: 'waiting' };
      this.saplings.push({ tx: spot.tx, ty: spot.ty, planted: now, shaken: null });
      this.ctx.events.emit('bag', this.bag.contents);
      return { kind: 'sapling', did: 'planted', days: saplingDaysLeft(now, now) };
    }
    const days = saplingDaysLeft(sapling.planted, now);
    if (days > 0) return { kind: 'sapling', did: 'growing', days };
    const candy = treeCandy(treeWindows(sapling.shaken, now));
    sapling.shaken = now;
    if (candy === 0) return { kind: 'shook', candy, back: windowOf(nextWindowStart(now)) };
    this.wallet.earn(candy);
    return { kind: 'shook', candy };
  }

  snapshot(): { candyTree: CandyTreeSnapshot } {
    return { candyTree: { shaken: this.shaken, saplings: this.saplings.map((s) => ({ ...s })) } };
  }
}
