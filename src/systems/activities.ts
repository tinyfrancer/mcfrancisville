import { ACTIVITIES, FORTUNES, type ActivityId, type Game, type Hours } from '../data/activities';
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

/** Which of a game's targets glints for a throw of a go: thrown at, it always lands. */
export function glintOf(game: Game['game'], seed: string, throwNo: number): number {
  return hashMixed(`glint:${seed}:${throwNo}`) % game.targets;
}

/** Whether a throw at a target lands: always at the glinting one, now and then at another. */
export function lands(game: Game['game'], seed: string, throwNo: number, target: number): boolean {
  if (target === glintOf(game, seed, throwNo)) return true;
  return hashMixed(`lands:${seed}:${throwNo}:${target}`) % 100 < game.chance;
}

/** What a go wins, by how many landed. There's always something. */
export function prizeOf(game: Game['game'], landed: number): Game['game']['prizes'][number] {
  const { prizes } = game;
  return prizes[Math.min(Math.max(landed, 0), prizes.length - 1)]!;
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
