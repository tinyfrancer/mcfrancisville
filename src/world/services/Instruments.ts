import { tunesOf, type Instrument } from '../../data/instruments';
import { dayKey } from '../../systems/clock';
import { hashMixed } from '../../systems/random';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';

/**
 * What plays when she walks up to it (0.2's G2): a piano or the hall's music box, each tune of its
 * instrument in turn, starting the day on one dealt from the day key. Nothing is saved.
 */
export class Instruments {
  private readonly ctx: WorldContext;
  /** How many times she has played each, since the game opened. */
  private readonly plays = new Map<Instrument, number>();

  constructor(ctx: WorldContext) {
    this.ctx = ctx;
  }

  play(instrument: Instrument): WorldEvent {
    const tunes = tunesOf(instrument);
    const played = this.plays.get(instrument) ?? 0;
    this.plays.set(instrument, played + 1);
    const start = hashMixed(`${instrument}:${dayKey(this.ctx.clock.now())}`);
    return { kind: 'tune', tune: tunes[(start + played) % tunes.length]! };
  }
}
