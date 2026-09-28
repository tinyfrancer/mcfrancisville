import { idlePose, rockPose } from '../../systems/poses';
import type { Pose } from '../../types/ids';
import type { WorldContext } from '../context';
import type { Thrill } from '../events';
import { NET_MS } from './Collecting';

/** What her poses need to know of her: whether she's walking, or busy with something. */
export interface PoseCues {
  moving(): boolean;
  /** Talking, petting, decorating or dancing: no time for her phone. */
  busy(): boolean;
}

/** A thrill waits for what brought it to finish: her net's swing, for a catch. */
const AFTER: Record<Thrill, number> = {
  catch: NET_MS,
  gift: 0,
  harvest: 0,
  letter: 0,
  find: 0,
};

/**
 * How she stands: idling after a while still, and rocking out when something thrills her. It
 * keeps only how long she has stood still and when she was last thrilled; the view asks `pose`.
 */
export class Poses {
  private readonly ctx: WorldContext;
  private readonly cues: PoseCues;
  private stillMs = 0;
  private rockFrom = -Infinity;

  constructor(ctx: WorldContext, cues: PoseCues) {
    this.ctx = ctx;
    this.cues = cues;
    ctx.signals.on('thrilled', ({ by }) => {
      this.rockFrom = ctx.clock.now() + AFTER[by];
      this.stillMs = 0;
    });
  }

  step(deltaMs: number): void {
    if (this.cues.moving() || this.cues.busy()) this.stillMs = 0;
    else this.stillMs += deltaMs;
  }

  /** She's been asked to do something: whatever she was doing standing there, she stops. */
  stir(): void {
    this.stillMs = 0;
    this.rockFrom = -Infinity;
  }

  /** Her pose now, or null for standing (or walking) as usual. */
  pose(): Pose | null {
    if (this.cues.moving()) return null;
    const rock = rockPose(this.ctx.clock.now() - this.rockFrom);
    if (rock) return rock;
    return this.cues.busy() ? null : idlePose(this.stillMs);
  }
}
