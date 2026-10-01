import type { Weather } from '../../data/weather';
import { dayKey } from '../../systems/clock';
import { lastFlash, RUMBLE_AFTER_MS, stormOn, weatherOn } from '../../systems/weather';
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
  /** The flash whose rumble has been heard. */
  private rumbled: number | null = null;

  constructor(ctx: WorldContext, outside: () => MapZoneId | null) {
    this.ctx = ctx;
    this.outside = outside;
  }

  today(): Weather {
    return weatherOn(dayKey(this.ctx.clock.now()));
  }

  /** Whether today's rain is a thunderstorm (0.2's K1). */
  stormy(): boolean {
    return stormOn(dayKey(this.ctx.clock.now()));
  }

  /** How long ago the last flash of lightning was, on a stormy day, or null. */
  sinceFlash(): number | null {
    const now = this.ctx.clock.now();
    const at = lastFlash(dayKey(now), now);
    return at === null ? null : now - at;
  }

  /**
   * Tells her about the day's weather, once a day, when she's first outdoors in it; and on a
   * stormy day, the far-off rumble a moment after each flash, heard indoors too.
   */
  check(): void {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    const flash = lastFlash(day, now);
    if (flash !== null && flash !== this.rumbled) {
      const since = now - flash;
      if (since >= RUMBLE_AFTER_MS && since < RUMBLE_AFTER_MS + 4_000) {
        this.ctx.moments.push({ kind: 'thunder' });
      }
      if (since >= RUMBLE_AFTER_MS) this.rumbled = flash;
    }
    if (this.told === day || this.outside() === null) return;
    this.told = day;
    const weather = weatherOn(day);
    if (weather !== 'clear') {
      this.ctx.moments.push({ kind: 'weather', weather, ...(stormOn(day) && { storm: true }) });
    }
  }
}
