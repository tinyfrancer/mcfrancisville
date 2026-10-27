import type { Weather } from '../../data/weather';
import { dayKey, hourOf } from '../../systems/clock';
import { rainbowAt, rainbowDay, rainbowHour } from '../../systems/snow';
import { lastFlash, RUMBLE_AFTER_MS, stormOn, weatherOn } from '../../systems/weather';
import type { RainbowSeen } from '../../persistence/SaveState';
import type { MapZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';

const RAINBOW_JAR = 'rainbowJar';
/** How far into its time `showRainbow` puts a rainbow: past its coming in. */
const SHOWN_UP_MS = 60_000;

/**
 * Today's weather (phase L), the same in every place, and a word about it the first time she
 * steps outdoors on a rainy or foggy day. What's told is kept only while the game is open: a
 * word again after a reload is a hello, not a nag. After a rainy day, the first ten minutes she's
 * out under the sun there's a rainbow (1.6's X4, decision 383): from when she was first outdoors that
 * day, kept in the save since 1.7's Y1 (decision 388), so a reload keeps its ten minutes.
 */
export class Forecast {
  private readonly ctx: WorldContext;
  /** The place outdoors she is in, or null indoors. */
  private readonly outside: () => MapZoneId | null;
  /** The day she was last told about. */
  private told = '';
  /** The flash whose rumble has been heard. */
  private rumbled: number | null = null;
  /** Where her rainbow's jar goes, the first time; none in a test that doesn't give one. */
  private readonly bag: Bag | null;
  /** When she was first out under today's rainbow, if there is one. */
  private rainbowFrom: RainbowSeen | null = null;

  constructor(
    ctx: WorldContext,
    outside: () => MapZoneId | null,
    bag: Bag | null = null,
    saved: RainbowSeen | null = null,
  ) {
    this.ctx = ctx;
    this.outside = outside;
    this.bag = bag;
    if (saved && typeof saved.day === 'string' && Number.isFinite(saved.at)) {
      this.rainbowFrom = { day: saved.day, at: saved.at };
    }
  }

  /** When she was first out under today's rainbow, for the save; an old day's is let go. */
  snapshot(): { rainbow: RainbowSeen | null } {
    const from = this.rainbowFrom;
    const today = from !== null && from.day === dayKey(this.ctx.clock.now());
    return { rainbow: today ? { ...from } : null };
  }

  /** How far through its ten minutes today's rainbow is (0 to 1), or null with none up now. */
  rainbow(): number | null {
    const now = this.ctx.clock.now();
    const from = this.rainbowFrom;
    if (!from || from.day !== dayKey(now)) return null;
    return rainbowAt(now - from.at);
  }

  /** A rainbow up now, wherever she is, for a dev build's `?rainbow` and the smoke check. */
  showRainbow(): void {
    const now = this.ctx.clock.now();
    // Already come in, so it's seen at once.
    this.rainbowFrom = { day: dayKey(now), at: now - SHOWN_UP_MS };
    this.ctx.moments.push(this.rainbowSeen());
  }

  /** The rainbow seen: the first time ever, a little of it in a jar for her bag. */
  private rainbowSeen(): { kind: 'rainbow'; first: boolean } {
    const first = this.bag !== null && this.bag.count(RAINBOW_JAR) === 0;
    if (first) {
      this.bag!.add(RAINBOW_JAR, 1);
      this.ctx.events.emit('bag', this.bag!.contents);
    }
    return { kind: 'rainbow', first };
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
    if (this.outside() === null) return;
    const sunUp = rainbowHour(hourOf(now));
    if (this.rainbowFrom?.day !== day && sunUp && rainbowDay(day)) {
      this.rainbowFrom = { day, at: now };
      this.ctx.moments.push(this.rainbowSeen());
    }
    if (this.told === day) return;
    this.told = day;
    const weather = weatherOn(day);
    if (weather !== 'clear') {
      this.ctx.moments.push({ kind: 'weather', weather, ...(stormOn(day) && { storm: true }) });
    }
  }
}
