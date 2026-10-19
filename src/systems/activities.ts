import {
  ACTIVITIES,
  ACTIVITY_IDS,
  FAIR_TIP_ONE_IN,
  FAIR_TIPS,
  FORTUNES,
  type ActivityId,
  type Game,
  type Hours,
  type Motion,
} from '../data/activities';
import { CRITTER_IDS, CRITTERS } from '../data/critters';
import type { Weather } from '../data/weather';
import type { CritterId, FixtureId, MapZoneId, PropId } from '../types/ids';
import { festivalsOn, partsOf } from './calendar';
import { DAY_WINDOWS, windowAtHour, type DayWindow } from './clock';
import { isAbout } from './critters';
import { hashMixed, hashString } from './random';

/** The activity at a stall or a fixture, if one is. */
export function activityAt(at: { prop: PropId } | { fixture: FixtureId }): ActivityId | null {
  for (const [id, row] of Object.entries(ACTIVITIES) as [
    ActivityId,
    (typeof ACTIVITIES)[ActivityId],
  ][]) {
    if ('prop' in at && 'prop' in row.at && row.at.prop === at.prop) return id;
    if ('fixture' in at && 'fixture' in row.at && row.at.fixture === at.fixture) return id;
  }
  return null;
}

const isWeekend = (day: string) => [0, 6].includes(partsOf(day).weekday);

/** Whether it's open on a day in a window: in its windows (at weekends, if only then), or all of a festival. */
export function isOpen(hours: Hours, day: string, window: DayWindow): boolean {
  if (hours.festival && festivalsOn(day).includes(hours.festival)) return true;
  if (hours.weekends && !isWeekend(day)) return false;
  return hours.windows.includes(window);
}

const list = (windows: readonly DayWindow[]) =>
  windows.length === 1
    ? windows[0]!
    : `${windows.slice(0, -1).join(', ')} and ${windows[windows.length - 1]!}`;

/** What it says when she comes by while it's shut: when it opens next. */
export function closedLine(id: ActivityId, day: string, window: DayWindow): string {
  const { name, hours } = ACTIVITIES[id];
  if (hours.weekends && !isWeekend(day)) {
    return `${name} is shut. It's open at weekends, in the ${list(hours.windows)}.`;
  }
  const later = DAY_WINDOWS.slice(DAY_WINDOWS.indexOf(window) + 1).find((w) =>
    hours.windows.includes(w),
  );
  if (later) return `${name} is shut just now. It opens this ${later}.`;
  return `${name} is shut for the night. It opens tomorrow ${hours.windows[0]!}.`;
}

// ---- The games, in time (V1's R6b, decision 315) ---------------------------------------------

/** How well a throw went: wide of it (still worth the floor), good, or near perfect. */
export type Grade = 0 | 1 | 2;

/**
 * A throw's moving thing, dealt from the day and the go: how long a sweep takes, where in it the
 * thing starts, what she's aiming for along the track (0 to 1, left to right; the bell's is its
 * top) and, at the duck pond, what's under each duck.
 */
export interface Pattern {
  motion: Motion;
  targets: number;
  period: number;
  phase: number;
  target: number;
  /** Which target she's aiming for: the bottle that glints. */
  glint: number;
  marks: readonly Grade[];
}

/** How long a sweep takes, ms, before the go's own pace: a swing there and back, a ghost across. */
export const SWEEP_MS: Record<Motion, number> = {
  swing: 2600,
  bob: 3600,
  ducks: 12000,
  bell: 1800,
};

/** How much slower it all goes with reduced motion asked for: slower, never still. */
export const SLOW_SWEEP = 1.6;

/** How near is near perfect, and how near is good, along the track (the bell's in its height). */
export const WINDOWS: Record<Exclude<Motion, 'ducks'>, { perfect: number; good: number }> = {
  swing: { perfect: 0.06, good: 0.16 },
  bob: { perfect: 0.025, good: 0.07 },
  bell: { perfect: 0.07, good: 0.3 },
};

/** How long after a throw the next one starts moving, so she sees where the last one went. */
export const BETWEEN_THROWS_MS = 900;

/** What's under the ducks, in tenths: plain for half, a star for three, a crown for two. */
const DUCK_MARKS: readonly Grade[] = [0, 0, 0, 0, 0, 1, 1, 1, 2, 2];

/** A throw's moving thing, the same every time for the same go and throw. */
export function patternOf(
  game: Game['game'],
  seed: string,
  throwNo: number,
  slow = false,
): Pattern {
  const at = `${seed}:${throwNo}`;
  const pace = 0.9 + (hashMixed(`pace:${at}`) % 26) / 100;
  const period = Math.round(SWEEP_MS[game.motion] * pace * (slow ? SLOW_SWEEP : 1));
  const phase = game.motion === 'bell' ? 0 : (hashMixed(`phase:${at}`) % 1000) / 1000;
  const glint = game.motion === 'swing' ? hashMixed(`glint:${at}`) % game.targets : 0;
  const target =
    game.motion === 'swing' ? (glint + 0.5) / game.targets : game.motion === 'bell' ? 1 : 0.5;
  const marks =
    game.motion === 'ducks'
      ? Array.from(
          { length: game.targets },
          (_, k) => DUCK_MARKS[hashMixed(`duck:${at}:${k}`) % DUCK_MARKS.length]!,
        )
      : [];
  return { motion: game.motion, targets: game.targets, period, phase, target, glint, marks };
}

const frac = (x: number) => x - Math.floor(x);
/** There and back: 0 to 1 and back to 0 as u goes round once. */
const there = (u: number) => (frac(u) < 0.5 ? frac(u) * 2 : 2 - frac(u) * 2);

/** Where the swinging ring is, `ms` into its throw, across the bottles. */
export function ringAt(p: Pattern, ms: number): number {
  return 0.05 + 0.9 * there(Math.max(0, ms) / p.period + p.phase);
}

/** Where each ghost is across the tub, `ms` in: evenly spaced, drifting right to left. */
export function ghostsAt(p: Pattern, ms: number): number[] {
  const t = Math.max(0, ms) / p.period;
  return Array.from({ length: p.targets }, (_, k) => frac(k / p.targets + p.phase - t));
}

/** Where each duck is round the pond, `ms` in, drifting left to right. */
export function ducksAt(p: Pattern, ms: number): number[] {
  const t = Math.max(0, ms) / p.period;
  return Array.from({ length: p.targets }, (_, k) => frac(k / p.targets + p.phase + t));
}

/** How high the bell's puck is, `ms` after she took hold: easing up to the top and back down. */
export function puckAt(p: Pattern, ms: number): number {
  return Math.sin((Math.PI * Math.max(0, ms)) / p.period) ** 2;
}

/** The nearest of a row of places round a loop to `at`, and how far it is. */
function nearest(places: readonly number[], at: number): { k: number; d: number } {
  let best = { k: 0, d: Infinity };
  places.forEach((x, k) => {
    const d = Math.min(Math.abs(x - at), 1 - Math.abs(x - at));
    if (d < best.d) best = { k, d };
  });
  return best;
}

/** How far from what she's aiming for the moving thing is, `ms` into a throw; 0 at the ducks. */
function offBy(p: Pattern, ms: number): number {
  switch (p.motion) {
    case 'swing':
      return Math.abs(ringAt(p, ms) - p.target);
    case 'bob':
      return nearest(ghostsAt(p, ms), p.target).d;
    case 'bell':
      return 1 - puckAt(p, ms);
    case 'ducks':
      return 0;
  }
}

const gradeBy = (d: number, w: { perfect: number; good: number }): Grade =>
  d <= w.perfect ? 2 : d <= w.good ? 1 : 0;

/** What a throw did: how well, and where it went (the ring's place, the ghost or duck, the puck). */
export interface Scored {
  grade: Grade;
  at: number;
}

/**
 * How well a tap went (V1's R6b): `tapAt` against the throw's pattern, which began moving at
 * `startedAt` (when she took hold, at the bell). At the duck pond, `at` is where she tapped along
 * the pond, and the duck nearest it is hers. Never worse than the floor, which still wins.
 */
export function score(p: Pattern, tapAt: number, startedAt: number, at = 0.5): Scored {
  const ms = tapAt - startedAt;
  switch (p.motion) {
    case 'swing':
      return { grade: gradeBy(offBy(p, ms), WINDOWS.swing), at: ringAt(p, ms) };
    case 'bob':
      return {
        grade: gradeBy(offBy(p, ms), WINDOWS.bob),
        at: nearest(ghostsAt(p, ms), p.target).k,
      };
    case 'ducks': {
      const { k } = nearest(ducksAt(p, ms), Math.min(1, Math.max(0, at)));
      return { grade: p.marks[k] ?? 0, at: k };
    }
    case 'bell':
      return { grade: gradeBy(offBy(p, ms), WINDOWS.bell), at: puckAt(p, ms) };
  }
}

/**
 * The first time from `from` (within a sweep and a half) that a tap scores best: for the tests,
 * and smoke's timed tap. At the duck pond, any time does; it's which duck that counts.
 */
export function bestTapAfter(p: Pattern, startedAt: number, from: number): number {
  let best = from;
  let bestD = Infinity;
  for (let t = from; t < from + p.period * 1.5; t += 5) {
    const d = offBy(p, t - startedAt);
    if (d < bestD - 1e-9) {
      best = t;
      bestD = d;
    }
  }
  return best;
}

/** How a go's throws add up: two a near-perfect one, one a good one, none a wide one. */
export const pointsOf = (grades: readonly Grade[]): number =>
  grades.reduce<number>((n, g) => n + g, 0);

/** Which of a game's prizes a go's points win, from 0 (the floor) to the best. */
export function prizeRank(game: Game['game'], points: number): number {
  const top = game.prizes.length - 1;
  const most = game.throws * 2;
  return Math.min(top, Math.max(0, Math.round((Math.max(0, points) * top) / most)));
}

/**
 * What a go wins, by how well it went: the floor for anything, and up the prizes as the points
 * come, the best for near perfect (of three throws, five points of six; of one, a perfect one).
 */
export function prizeOf(game: Game['game'], points: number): Game['game']['prizes'][number] {
  return game.prizes[prizeRank(game, points)]!;
}

/** The games, in the order the free go is dealt among them. */
const GAMES = ACTIVITY_IDS.filter((id) => 'game' in ACTIVITIES[id].does);

/**
 * The stall whose first go is free today (V1's R6b): one of the games open of an evening (when
 * she plays), dealt from the day key.
 */
export function freeGoOn(day: string): ActivityId {
  const open = GAMES.filter((id) => isOpen(ACTIVITIES[id].hours, day, 'evening'));
  const pool = open.length > 0 ? open : GAMES;
  return pool[hashString(`freeGo:${day}`) % pool.length]!;
}

/** The fortune's word about today's free go, on one day in `FAIR_TIP_ONE_IN`, or null. */
export function fairTipOn(day: string): string | null {
  if (hashString(`fairTip:${day}`) % FAIR_TIP_ONE_IN !== 0) return null;
  const line = FAIR_TIPS[hashString(`fairTipLine:${day}`) % FAIR_TIPS.length]!;
  return line.replace('{stall}', ACTIVITIES[freeGoOn(day)].name.toLowerCase());
}

/** The day's fortune, the same all day. */
export function fortuneOn(day: string): string {
  return FORTUNES[hashString(`fortune:${day}`) % FORTUNES.length]!;
}

/** A critter worth looking for today: which, from what hour, and where. */
export interface Lucky {
  critter: CritterId;
  hour: number;
  where: MapZoneId;
}

/**
 * The critter the fortune points her to: one about from now until the day turns, one she hasn't
 * caught if any is, dealt from the day key, and the first hour it's out. Null if nothing is about
 * at all, which the year never quite manages.
 */
export function luckyCritter(
  day: string,
  hour: number,
  weather: Weather,
  caught: (id: CritterId) => boolean,
): Lucky | null {
  const from = Math.floor(hour);
  // The day runs on past midnight to five, as the day key does.
  const until = from < 5 ? 5 : 29;
  const firstOut = new Map<CritterId, number>();
  for (let h = from; h < until; h++) {
    for (const id of CRITTER_IDS) {
      if (!firstOut.has(id) && isAbout(id, day, h % 24, weather)) firstOut.set(id, h % 24);
    }
  }
  const about = [...firstOut.keys()];
  const fresh = about.filter((id) => !caught(id));
  const pool = fresh.length > 0 ? fresh : about;
  if (pool.length === 0) return null;
  const critter = pool[hashString(`lucky:${day}`) % pool.length]!;
  const places = CRITTERS[critter].where;
  return {
    critter,
    hour: firstOut.get(critter)!,
    where: places[hashString(`luckyAt:${day}`) % places.length]!,
  };
}

/** When a lucky critter is out, as the fortune says it: "now", "this afternoon", "tonight". */
export function whenOut(lucky: Lucky, hour: number): string {
  if (lucky.hour === Math.floor(hour)) return 'right now';
  if (lucky.hour >= 20 || lucky.hour < 5) return 'tonight';
  return `this ${windowAtHour(lucky.hour)}`;
}
