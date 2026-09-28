/**
 * Time is the phone's own clock (decisions.md 4). Every rule asks a `Clock` rather than `Date`, so a
 * test can stand the town at any hour of any day.
 */
export interface Clock {
  /** Epoch milliseconds. */
  now(): number;
}

export const systemClock: Clock = { now: () => Date.now() };

/** A clock a test (or the smoke check) sets by hand. */
export class FakeClock implements Clock {
  private ms: number;

  constructor(start: number | Date) {
    this.ms = typeof start === 'number' ? start : start.getTime();
  }

  now(): number {
    return this.ms;
  }

  set(at: number | Date): void {
    this.ms = typeof at === 'number' ? at : at.getTime();
  }

  advance(ms: number): void {
    this.ms += ms;
  }
}

/** The day turns over at 5am, so a late night is still the day it started on (decisions.md 4). */
export const DAY_STARTS_AT_HOUR = 5;

/**
 * The day `now` belongs to, as `YYYY-MM-DD` in local time. Anything that comes back each day (a
 * tree's wood, the night's snack) remembers the key it was taken on, and is back when the key
 * differs. Worked out from the calendar rather than by subtracting five hours, which a daylight
 * saving change would throw off by one.
 */
export function dayKey(now: number): string {
  const d = new Date(now);
  const day = d.getHours() < DAY_STARTS_AT_HOUR ? d.getDate() - 1 : d.getDate();
  const start = new Date(d.getFullYear(), d.getMonth(), day);
  const mm = String(start.getMonth() + 1).padStart(2, '0');
  const dd = String(start.getDate()).padStart(2, '0');
  return `${start.getFullYear()}-${mm}-${dd}`;
}

/**
 * The three windows of a day (decisions.md 81): morning from 5am, afternoon from noon, and evening
 * from 6pm until the day turns over. What she gathers and the shop's special come back each window,
 * so every check-in has something new without asking for more than three.
 */
export type DayWindow = 'morning' | 'afternoon' | 'evening';

export const DAY_WINDOWS: readonly DayWindow[] = ['morning', 'afternoon', 'evening'];

/** The hour each window starts. */
export const WINDOW_FROM: Record<DayWindow, number> = { morning: 5, afternoon: 12, evening: 18 };

export function windowOf(now: number): DayWindow {
  const h = new Date(now).getHours();
  if (h >= WINDOW_FROM.evening || h < WINDOW_FROM.morning) return 'evening';
  return h >= WINDOW_FROM.afternoon ? 'afternoon' : 'morning';
}

/** The window after this one; the evening's is the next day's morning. */
export function nextWindow(window: DayWindow): DayWindow {
  return DAY_WINDOWS[(DAY_WINDOWS.indexOf(window) + 1) % DAY_WINDOWS.length]!;
}

/**
 * The window `now` is in, as `YYYY-MM-DD@window`: its day key, so the evening after midnight is
 * still the evening it started as, and which window. Its day is everything before the `@`.
 */
export function windowKey(now: number): string {
  return `${dayKey(now)}@${windowOf(now)}`;
}

/** The local hour as a fraction: 21.5 is half past nine at night. */
export function hourOf(now: number): number {
  const d = new Date(now);
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

/** The late-night snack is out from 8pm until the day turns over at 5am. */
export const NIGHT_FROM_HOUR = 20;

export function isNight(hour: number): boolean {
  return hour >= NIGHT_FROM_HOUR || hour < DAY_STARTS_AT_HOUR;
}

/**
 * The light the town is washed in. The renderer gives each its colour. `moonlit` is the night of
 * a full moon (phase N), a little brighter, which `underFullMoon` puts in place of the night.
 */
export type Sky = 'night' | 'dawn' | 'day' | 'golden' | 'dusk' | 'moonlit';

/** Where each sky is at its fullest, through one day. Between two, the light blends. */
const SKY_AT: readonly (readonly [hour: number, sky: Sky])[] = [
  [0, 'night'],
  [5, 'night'],
  [6.5, 'dawn'],
  [8, 'day'],
  [16.5, 'day'],
  [18, 'golden'],
  [19.5, 'dusk'],
  [21, 'night'],
  [24, 'night'],
];

export interface Daylight {
  /** The light is `from` blended toward `to` by `t` (0 to 1). */
  from: Sky;
  to: Sky;
  t: number;
  /** How lit the lanterns, windows and jack-o'-lanterns are, 0 (off) to 1. */
  lamps: number;
}

/** They come on through the golden hour and go out after dawn. */
const LAMPS_ON: readonly [start: number, end: number] = [17.5, 19];
const LAMPS_OFF: readonly [start: number, end: number] = [6, 7.5];

function ramp(hour: number, [start, end]: readonly [number, number]): number {
  return Math.min(1, Math.max(0, (hour - start) / (end - start)));
}

export function daylight(hour: number): Daylight {
  const h = ((hour % 24) + 24) % 24;
  let i = 0;
  while (i < SKY_AT.length - 2 && SKY_AT[i + 1]![0] <= h) i++;
  const [fromHour, from] = SKY_AT[i]!;
  const [toHour, to] = SKY_AT[i + 1]!;
  const t = from === to ? 0 : (h - fromHour) / (toHour - fromHour);
  const lamps = h >= 12 ? ramp(h, LAMPS_ON) : 1 - ramp(h, LAMPS_OFF);
  return { from, to, t, lamps };
}

/** The same light under a full moon: the night brightened to moonlight. */
export function underFullMoon(light: Daylight): Daylight {
  const moon = (sky: Sky): Sky => (sky === 'night' ? 'moonlit' : sky);
  return { ...light, from: moon(light.from), to: moon(light.to) };
}

/**
 * A clock running from `hour` today onwards, for a dev build's `?hour=` to show the night's rules
 * (the snack) as well as its light. Production never uses it: there, `?hour=` changes only the light.
 */
export function clockFromHour(hour: number, base: Clock = systemClock): Clock {
  const start = base.now();
  const d = new Date(start);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() + hour * 3_600_000;
  const offset = target - start;
  return { now: () => base.now() + offset };
}
