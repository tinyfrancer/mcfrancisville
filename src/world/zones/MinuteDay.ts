import { dayKey } from '../../systems/clock';

/**
 * The day key, worked out once a minute (1.3's F2, decision 361), as `Stalls` keeps its stands:
 * `canWalk` asks the overlays on every step of every path, and the day can only turn on a minute
 * (5:00 is one, in every zone and across a clock change), so a minute is the finest it can change
 * in. Equal, not "later than", so a clock that is set back is read afresh.
 */
export class MinuteDay {
  private readonly now: () => number;
  private minute = Number.NaN;
  private day = '';

  constructor(now: () => number) {
    this.now = now;
  }

  get(): string {
    const now = this.now();
    const minute = Math.floor(now / 60_000);
    if (minute !== this.minute) {
      this.minute = minute;
      this.day = dayKey(now);
    }
    return this.day;
  }
}
