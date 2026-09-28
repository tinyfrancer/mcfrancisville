/**
 * The three windows of a day (decisions.md 81): morning from 5am, afternoon from noon, and evening
 * from 6pm until the day turns over. What she gathers and the shop's special come back each window,
 * so every check-in has something new without asking for more than three.
 */
export type DayWindow = 'morning' | 'afternoon' | 'evening';

export const DAY_WINDOWS: readonly DayWindow[] = ['morning', 'afternoon', 'evening'];

/** The hour each window starts. */
export const WINDOW_FROM: Record<DayWindow, number> = { morning: 5, afternoon: 12, evening: 18 };
