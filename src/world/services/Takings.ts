import { dayKey, type Clock } from '../../systems/clock';
import { isReady, pruneTaken } from '../../systems/gathering';

/**
 * What she has taken today, by key (a tree, a patch, the snack, a critter, Fibi's bone), to the
 * day key she took it on. Everything comes back whole at 5am (decisions.md 35).
 */
export class Takings {
  private readonly clock: Clock;
  private readonly taken: Record<string, string>;

  constructor(clock: Clock, saved: Record<string, string> = {}) {
    this.clock = clock;
    this.taken = { ...saved };
  }

  /** Whether what a key names has anything to give today. */
  isReady(key: string): boolean {
    return isReady(this.taken, key, this.clock.now());
  }

  take(key: string): void {
    this.taken[key] = dayKey(this.clock.now());
  }

  /** The day's takings; yesterday's are dropped, since they no longer mean anything. */
  snapshot(): { taken: Record<string, string> } {
    return { taken: pruneTaken(this.taken, this.clock.now()) };
  }

  /** The takings as they stand, for rules that read them whole (tonight's snack). */
  get all(): Readonly<Record<string, string>> {
    return this.taken;
  }
}
