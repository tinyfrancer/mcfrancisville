import type { Clock } from '../systems/clock';
import { EventBus } from './eventBus';
import type { Signals, WorldEvent, WorldState } from './events';

/**
 * What every service shares, and nothing more: the clock, the state bus the HUD follows, the
 * signals services send each other, and the moments waiting to be handed out by `update`.
 */
export interface WorldContext {
  readonly clock: Clock;
  readonly events: EventBus<WorldState>;
  readonly signals: EventBus<Signals>;
  readonly moments: Moments;
}

export function worldContext(clock: Clock): WorldContext {
  return {
    clock,
    events: new EventBus<WorldState>(),
    signals: new EventBus<Signals>(),
    moments: new Moments(),
  };
}

/**
 * Moments from a tap or a sheet rather than a step (a letter come, a clue pinned, a piece that
 * won't go there), kept until the next `update` hands them out with its own.
 */
export class Moments {
  private waiting: WorldEvent[] = [];

  push(event: WorldEvent): void {
    this.waiting.push(event);
  }

  /** Everything waiting, oldest first, and none left after. */
  drain(): WorldEvent[] {
    const out = this.waiting;
    this.waiting = [];
    return out;
  }
}
