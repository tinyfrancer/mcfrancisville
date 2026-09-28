import { windowKey, type Clock, type DayWindow } from '../../systems/clock';
import { backIn, isReady, pruneTaken } from '../../systems/gathering';

/**
 * What she has taken today, by key (a tree, a patch, the snack, a critter, Fibi's bone), to the
 * window she took it in. Everything comes back whole the next window (decisions.md 35, 81), but
 * the snack and the bone, which come once a day.
 */
export class Takings {
  private readonly clock: Clock;
  private readonly taken: Record<string, string>;

  constructor(clock: Clock, saved: Record<string, string> = {}) {
    this.clock = clock;
    this.taken = { ...saved };
  }

  /** Whether what a key names has anything to give now. */
  isReady(key: string): boolean {
    return isReady(this.taken, key, this.clock.now());
  }

  take(key: string): void {
    this.taken[key] = windowKey(this.clock.now());
  }

  /** When what a key names, taken now, has something to give again. */
  backIn(key: string): DayWindow {
    return backIn(key, this.clock.now());
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
