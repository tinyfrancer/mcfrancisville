import {
  CONSTELLATION_IDS,
  CONSTELLATIONS,
  FINDABLE_MONTHS,
  MONTHLY,
} from '../data/constellations';
import type { Weather } from '../data/weather';
import type { ConstellationId } from '../types/ids';
import { partsOf } from './calendar';
import { isNight } from './clock';
import { decorOn } from './holidays';
import { rareEventOn } from './rareEvents';

/*
 * The night sky's rules (1.5's G4, decision 373), worked out from the day key, the hour and the
 * weather, so nothing about tonight is saved: only what she has traced, on her star chart.
 */

/** How the sky is for looking at: open, too bright (by day), or too cloudy (rain or fog). */
export type SkyOpen = 'open' | 'bright' | 'cloudy';

/** Whether the stars can be seen: after dark (the snack's night, 8pm to 5am) on a clear day. */
export function skyOf(hour: number, weather: Weather): SkyOpen {
  if (!isNight(hour)) return 'bright';
  return weather === 'clear' ? 'open' : 'cloudy';
}

/** The constellation up in a month (1 is January). */
export function constellationOf(month: number): ConstellationId {
  return MONTHLY[(((month - 1) % 12) + 12) % 12]!;
}

/** Whether a meteor shower is tonight (V1's R3): every constellation is out at once. */
export function showersOn(day: string): boolean {
  return rareEventOn(day) === 'meteorShower';
}

/**
 * What she can find through the telescope tonight: this month's constellation and the two
 * months' before it, so a month missed isn't lost; a holiday's while its decorations are up; and
 * on a meteor shower's night every one there is. This month's first.
 */
export function findableOn(day: string): ConstellationId[] {
  if (showersOn(day)) {
    const first = constellationOf(partsOf(day).month);
    return [first, ...CONSTELLATION_IDS.filter((id) => id !== first)];
  }
  const { month } = partsOf(day);
  const found: ConstellationId[] = [];
  const decor = decorOn(day);
  const holiday = CONSTELLATION_IDS.find((id) => {
    const when = CONSTELLATIONS[id].when;
    return 'holiday' in when && when.holiday === decor;
  });
  for (let back = 0; back < FINDABLE_MONTHS; back++) found.push(constellationOf(month - back));
  if (holiday) found.splice(1, 0, holiday);
  return found;
}

/** A trace under way: the constellation, and how many of its stars she has lit in order. */
export interface Trace {
  id: ConstellationId;
  lit: number;
}

/**
 * What a tap on a star does (decision 272's skill with a floor): the next star in order lights
 * and draws its lines (`lit`), the last one lights the whole shape (`done`); any other star only
 * twinkles, and nothing is ever lost by it.
 */
export type TapResult = { kind: 'lit' | 'done'; star: number } | { kind: 'twinkle'; star: number };

/** Taps star `star` of the trace: the trace as it is after, and what happened. */
export function tapStar(trace: Trace, star: number): { trace: Trace; result: TapResult } {
  const count = CONSTELLATIONS[trace.id].stars.length;
  if (trace.lit >= count || star !== trace.lit) {
    return { trace, result: { kind: 'twinkle', star } };
  }
  const lit = trace.lit + 1;
  return { trace: { ...trace, lit }, result: { kind: lit === count ? 'done' : 'lit', star } };
}

/** The lines drawn once `lit` of a constellation's stars are lit: those with both ends lit. */
export function linesLit(id: ConstellationId, lit: number): (readonly [number, number])[] {
  return CONSTELLATIONS[id].lines.filter(([a, b]) => a < lit && b < lit);
}

/** How near a tap must be to a star to touch it, in the sky's pixels: a fingertip. */
export const TOUCH = 7;

/**
 * The star of a constellation a tap at `x`, `y` (in the box's pixels) touches: the nearest within
 * `TOUCH`, or null.
 */
export function starAt(id: ConstellationId, x: number, y: number, touch = TOUCH): number | null {
  let best: { i: number; d: number } | null = null;
  CONSTELLATIONS[id].stars.forEach((star, i) => {
    const d = Math.hypot(star.x - x, star.y - y);
    if (d <= touch && (!best || d < best.d)) best = { i, d };
  });
  return (best as { i: number; d: number } | null)?.i ?? null;
}
