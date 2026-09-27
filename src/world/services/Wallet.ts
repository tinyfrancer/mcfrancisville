import { STARTING_CANDY } from '../../data/shop';
import type { EventBus } from '../eventBus';
import type { WorldState } from '../events';

/** Her Candy (decisions.md 41): what the shops take and pay, and favours bring in. */
export class Wallet {
  private readonly events: EventBus<WorldState>;
  private purse: number;

  /** A save's Candy, or a new game's little to start; anything that isn't a count of it is too. */
  constructor(events: EventBus<WorldState>, saved: number = STARTING_CANDY) {
    this.events = events;
    this.purse = Number.isInteger(saved) && saved >= 0 ? saved : STARTING_CANDY;
  }

  get candy(): number {
    return this.purse;
  }

  earn(candy: number): void {
    if (candy <= 0) return;
    this.purse += candy;
    this.events.emit('candy', this.purse);
  }

  /** Spends `candy` if she has that much. False, and nothing spent, if she hasn't. */
  spend(candy: number): boolean {
    if (candy > this.purse) return false;
    this.purse -= candy;
    this.events.emit('candy', this.purse);
    return true;
  }

  snapshot(): { candy: number } {
    return { candy: this.purse };
  }
}
