import { todayLines, type TodayFacts, type TodayLine } from '../../systems/today';

/**
 * What's up now (V1's R2, decision 312): the calendar's Today tab, worked out each time it's asked
 * from what the town's services say (`areas/upNow.ts`), so it's never out of step with the world.
 */
export class UpNow {
  private readonly read: () => TodayFacts;

  constructor(read: () => TodayFacts) {
    this.read = read;
  }

  /** What the lines are worked out from, as the town is now. */
  facts(): TodayFacts {
    return this.read();
  }

  /** What's up now, a line each. */
  lines(): TodayLine[] {
    return todayLines(this.read());
  }
}
