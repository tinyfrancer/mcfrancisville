import { TILE_SIZE } from '../../config/world';
import { HEN_IDS, RUN_FLOOR } from '../../data/hens';
import { dayKey } from '../../systems/clock';
import type { PlacedProp } from '../../systems/grid';
import {
  canFeed,
  collectedOn,
  crowHour,
  eggsWaiting,
  feedChoices,
  fedOn,
  henAt,
  henOut,
  isFeed,
  NO_HENHOUSE,
  type Box,
  type HenhouseState,
  type HenSpot,
} from '../../systems/hens';
import type { ItemId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';

/** What the coop's card shows (1.6's X3): the eggs waiting, whether they're fed, and what she has. */
export interface CoopView {
  eggs: number;
  /** Fed today already. */
  fed: boolean;
  /** What she could feed them, the plainest first. */
  choices: readonly ItemId[];
  /** Out in the run, or in for the night. */
  out: boolean;
}

/** What the coop reads of the world. */
export interface HenhouseReads {
  /** Where she is, for Reginald's crow. */
  scene: () => ZoneId;
  /** The coop standing at Boo Acres, where its run is. */
  coop: PlacedProp | null;
}

function repaired(saved: Partial<HenhouseState> | undefined): HenhouseState {
  const fed = typeof saved?.fed === 'string' ? saved.fed : null;
  const n = saved?.waiting;
  const waiting = typeof n === 'number' && Number.isInteger(n) && n > 0 ? n : 0;
  return { fed, waiting };
}

/**
 * The hens at Boo Acres (1.6's X3, decision 382): fed once a day with a crop or a seed from her
 * bag, an egg from each hen waiting the next morning, collected whenever she comes by; where each
 * one potters in the run, worked out from the clock; and Reginald's crow at six, heard only if
 * she's at Boo Acres.
 */
export class Henhouse {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  private readonly reads: HenhouseReads;
  private state: HenhouseState;
  /** The day he last crowed while she was there, so he crows once. Not kept. */
  private crowed: string | null = null;
  private crowedTime: number | null = null;
  /** Where the hens' feet may be, in the world's pixels. */
  readonly run: Box | null;

  constructor(
    ctx: WorldContext,
    keeps: { bag: Bag },
    reads: HenhouseReads,
    saved?: Partial<HenhouseState>,
  ) {
    this.ctx = ctx;
    this.bag = keeps.bag;
    this.reads = reads;
    this.state = saved ? repaired(saved) : { ...NO_HENHOUSE };
    const coop = reads.coop;
    this.run = coop
      ? {
          x: coop.tx * TILE_SIZE + RUN_FLOOR.x,
          y: coop.ty * TILE_SIZE + RUN_FLOOR.y,
          w: RUN_FLOOR.w,
          h: RUN_FLOOR.h,
        }
      : null;
  }

  private today(): string {
    return dayKey(this.ctx.clock.now());
  }

  /** The eggs waiting in the coop now. */
  eggs(): number {
    return eggsWaiting(this.state, this.today());
  }

  view(): CoopView {
    return {
      eggs: this.eggs(),
      fed: !canFeed(this.state, this.today()),
      choices: feedChoices((id) => this.bag.count(id)),
      out: henOut(this.ctx.clock.now()),
    };
  }

  /** Feeds them one of something from her bag, once a day; false if she can't. */
  feed(item: ItemId): boolean {
    const today = this.today();
    if (!canFeed(this.state, today) || !isFeed(item) || !this.bag.remove(item, 1)) return false;
    this.state = fedOn(this.state, today);
    this.ctx.events.emit('bag', this.bag.contents);
    this.ctx.moments.push({ kind: 'fedHens', item });
    return true;
  }

  /** Takes the eggs waiting into her bag; how many. */
  collect(): number {
    const today = this.today();
    const eggs = eggsWaiting(this.state, today);
    if (eggs === 0) return 0;
    this.state = collectedOn(this.state, today);
    this.bag.add('egg', eggs);
    this.ctx.events.emit('bag', this.bag.contents);
    this.ctx.moments.push({ kind: 'laid', eggs });
    return eggs;
  }

  /** Reginald crows once in the six o'clock hour, if she's at Boo Acres to hear him. */
  check(): void {
    const now = this.ctx.clock.now();
    if (this.reads.scene() !== 'booAcres' || !this.run || !crowHour(now)) return;
    const today = dayKey(now);
    if (this.crowed === today) return;
    this.crowed = today;
    this.crowedTime = now;
    this.ctx.moments.push({ kind: 'crow' });
  }

  /** When he last crowed, for the view to show him at it. */
  get crowedAt(): number | null {
    return this.crowedTime;
  }

  /** Where each of them is in the run now, or none while they're in for the night. */
  hens(): HenSpot[] {
    const now = this.ctx.clock.now();
    const run = this.run;
    if (!run || !henOut(now)) return [];
    return HEN_IDS.map((id) => henAt(id, now, run, this.crowedTime));
  }

  snapshot(): { henhouse: HenhouseState } {
    return { henhouse: { ...this.state } };
  }
}
