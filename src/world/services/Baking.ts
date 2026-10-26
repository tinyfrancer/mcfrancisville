import {
  BAKE_CANDY,
  BAKE_KEEPS,
  BAKE_POINTS,
  BAKES,
  MERINGUE_BAKE,
  type Bake,
} from '../../data/baking';
import { MERINGUE_EGGS } from '../../data/hens';
import { dayKey } from '../../systems/clock';
import { fill } from '../../systems/friendship';
import { hashString } from '../../systems/random';
import type { VillagerId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Takings } from './Takings';
import type { Wallet } from './Wallet';

/** Who she bakes with, and where. */
const BAKER: VillagerId = 'wrapunzel';
const BAKERY: ZoneId = 'crumbs';

/** Kept in `Takings`, once a day. */
export const BAKE_KEY = 'bake:wrapunzel';

/** What baking reads of the rest of the world. */
export interface BakingReads {
  /** Her name, for Wrapunzel's line. */
  name: () => string;
  /** Where she is, and where Wrapunzel is. */
  scene: () => ZoneId;
  bakerAt: () => ZoneId;
  /** A little more friendship, letters and all. */
  thank: (villager: VillagerId, points: number) => void;
}

/** The day's bake, dealt from the day key. */
export function bakeOn(day: string): Bake {
  return BAKES[hashString(`bake:${day}`) % BAKES.length]!;
}

/**
 * Baking with Wrapunzel at Crumbs & Curios (0.2's E1, her answer 79): once a day, while they're
 * both in the bakery, she helps with the day's bake, and Wrapunzel pays her in Candy and sends a
 * couple home with her.
 */
export class Baking {
  private readonly ctx: WorldContext;
  private readonly keeps: { bag: Bag; wallet: Wallet; takings: Takings };
  private readonly reads: BakingReads;

  constructor(
    ctx: WorldContext,
    keeps: { bag: Bag; wallet: Wallet; takings: Takings },
    reads: BakingReads,
  ) {
    this.ctx = ctx;
    this.keeps = keeps;
    this.reads = reads;
  }

  /** Whether she can bake with a neighbour now: Wrapunzel, in her bakery, not yet today. */
  canBake(villager: VillagerId): boolean {
    return (
      villager === BAKER &&
      this.reads.scene() === BAKERY &&
      this.reads.bakerAt() === BAKERY &&
      this.keeps.takings.isReady(BAKE_KEY)
    );
  }

  /**
   * What they bake now: meringue ghosts if she has brought eggs from the hens (1.6's X3), or the
   * day's bake.
   */
  private bakeNow(): Bake {
    if (this.keeps.bag.count('egg') >= MERINGUE_EGGS) return MERINGUE_BAKE;
    return bakeOn(dayKey(this.ctx.clock.now()));
  }

  /**
   * Today's bake told a step at a time (V1's P4), Wrapunzel's lines filled in, the last being
   * `bake`'s; nothing is baked or paid until `bake`. Null if she can't bake now.
   */
  scene(villager: VillagerId): string[] | null {
    if (!this.canBake(villager)) return null;
    const bake = this.bakeNow();
    const name = this.reads.name();
    return [...bake.steps.map((s) => fill(s.line, { name })), fill(bake.line, { name })];
  }

  /** A step of today's bake as it's told: her at the bowl, pouring, or down at the oven. */
  step(k: number): void {
    const step = this.bakeNow().steps[k];
    if (step && this.keeps.takings.isReady(BAKE_KEY)) {
      this.ctx.moments.push({ kind: 'bakeStep', does: step.does });
    }
  }

  /** Bakes the day's bake with Wrapunzel. Null if she can't now. */
  bake(
    villager: VillagerId,
  ): { line: string; item: Bake['item']; count: number; candy: number } | null {
    if (!this.canBake(villager)) return null;
    const { bag, wallet, takings } = this.keeps;
    const bake = this.bakeNow();
    takings.take(BAKE_KEY);
    if (bake === MERINGUE_BAKE) bag.remove('egg', MERINGUE_EGGS);
    wallet.earn(BAKE_CANDY);
    bag.add(bake.item, BAKE_KEEPS);
    this.ctx.events.emit('bag', bag.contents);
    this.reads.thank(BAKER, BAKE_POINTS);
    this.ctx.moments.push({ kind: 'baked', item: bake.item, candy: BAKE_CANDY });
    return {
      line: fill(bake.line, { name: this.reads.name() }),
      item: bake.item,
      count: BAKE_KEEPS,
      candy: BAKE_CANDY,
    };
  }
}
