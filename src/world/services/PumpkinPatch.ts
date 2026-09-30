import type { PatchStage } from '../../data/pumpkinPatch';
import { dayKey } from '../../systems/clock';
import { PATCH_KEY, patchStage } from '../../systems/pumpkinPatch';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Takings } from './Takings';

/**
 * The pumpkin patch on the farm (0.2's J3, decision 156): how it's coming on is read off the day,
 * and once it's ripe, walking up to it picks her a pumpkin for carving, once a day.
 */
export class PumpkinPatch {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  private readonly takings: Takings;

  constructor(ctx: WorldContext, keeps: { bag: Bag; takings: Takings }) {
    this.ctx = ctx;
    this.bag = keeps.bag;
    this.takings = keeps.takings;
  }

  /** How it's coming on today. */
  stage(): PatchStage {
    return patchStage(dayKey(this.ctx.clock.now()));
  }

  /** She has walked up to it: a pumpkin if it's ripe and she hasn't had today's. */
  visit(): WorldEvent {
    const stage = this.stage();
    if (stage !== 'ripe') return { kind: 'patch', stage };
    if (!this.takings.isReady(PATCH_KEY)) return { kind: 'patch', stage, picked: false };
    this.takings.take(PATCH_KEY);
    this.bag.add('patchPumpkin', 1);
    this.ctx.events.emit('bag', this.bag.contents);
    return { kind: 'patch', stage, picked: true };
  }
}
