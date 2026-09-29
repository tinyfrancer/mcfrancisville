import type { CalendarId } from '../../data/calendar';
import type { Weather } from '../../data/weather';
import { comingUp, happeningOn, monthOf, type CalendarDay } from '../../systems/calendar';
import { dayKey, windowKey, windowOf, type DayWindow } from '../../systems/clock';
import { weatherOn } from '../../systems/weather';
import { specialDayOf } from '../../systems/friendship';
import { happeningsOn } from '../../systems/happenings';
import type { HappeningId, ShopId } from '../../types/ids';
import type { WorldContext } from '../context';
import type { Stalls } from '../zones/Stalls';

/** Today at a glance: the day, its window and weather, what's on, and who's visiting. */
export interface Today {
  day: string;
  window: DayWindow;
  weather: Weather;
  happening: CalendarId[];
  /** The shops that turn up only on some days, and are in town today. */
  visitors: ShopId[];
  /** Her neighbours' own happenings today (phase S2); none on her birthday, the party is all. */
  gatherings: HappeningId[];
}

/**
 * The day and the calendar (phase N): which window it is, what's on today and what's coming up.
 * When a window turns while she plays, it says so (a `window` moment), so she knows the trees
 * have grown back and the special has changed; a window that turned while the game was closed
 * needs no word, Cody's welcome says hello.
 */
export class Calendar {
  private readonly ctx: WorldContext;
  private readonly stalls: Stalls;
  /** The window last seen, to tell when it turns. */
  private seen = '';

  constructor(ctx: WorldContext, stalls: Stalls) {
    this.ctx = ctx;
    this.stalls = stalls;
  }

  today(): Today {
    const now = this.ctx.clock.now();
    const day = dayKey(now);
    const visitors: ShopId[] = [];
    if (this.stalls.popUp()) visitors.push('popUp');
    if (this.stalls.moonPieCart()) visitors.push('moonPie');
    return {
      day,
      window: windowOf(now),
      weather: weatherOn(day),
      happening: happeningOn(day),
      visitors,
      gatherings: specialDayOf(day) === 'birthday' ? [] : happeningsOn(day),
    };
  }

  /** Every day of a month (1–12), and what's on each. */
  month(year: number, month: number): CalendarDay[] {
    return monthOf(year, month);
  }

  /** The next few days with something on. */
  comingUp(count = 4): CalendarDay[] {
    return comingUp(dayKey(this.ctx.clock.now()), count);
  }

  /** Notices a window turning: the HUD's day follows it, and she's told if she was playing. */
  check(): void {
    const now = this.ctx.clock.now();
    const key = windowKey(now);
    if (key === this.seen) return;
    const first = this.seen === '';
    this.seen = key;
    const today = this.today();
    this.ctx.events.emit('today', today);
    if (!first) {
      this.ctx.moments.push({ kind: 'window', window: today.window, happening: today.happening });
    }
  }
}
