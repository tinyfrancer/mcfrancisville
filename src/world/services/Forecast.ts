import type { Weather } from '../../data/weather';
import { dayKey } from '../../systems/clock';
import { weatherOn } from '../../systems/weather';
import type { MapZoneId } from '../../types/ids';
import type { WorldContext } from '../context';

/**
 * Today's weather (phase L), the same in every place, and a word about it the first time she
 * steps outdoors on a rainy or foggy day. What's told is kept only while the game is open: a
 * word again after a reload is a hello, not a nag.
 */
export class Forecast {
  private readonly ctx: WorldContext;
  /** The place outdoors she is in, or null indoors. */
  private readonly outside: () => MapZoneId | null;
  /** The day she was last told about. */
  private told = '';

  constructor(ctx: WorldContext, outside: () => MapZoneId | null) {
    this.ctx = ctx;
    this.outside = outside;
  }

  today(): Weather {
    return weatherOn(dayKey(this.ctx.clock.now()));
  }

  /** Tells her about the day's weather, once a day, when she's first outdoors in it. */
  check(): void {
    const day = dayKey(this.ctx.clock.now());
    if (this.told === day || this.outside() === null) return;
    this.told = day;
    const weather = weatherOn(day);
    if (weather !== 'clear') this.ctx.moments.push({ kind: 'weather', weather });
  }
}
