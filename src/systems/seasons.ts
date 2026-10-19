import { SEASON_MONTHS, type SeasonId } from '../data/milestones';
import { GROUND_LOOKS, MONTH_LOOKS, type GroundLook, type GroundLookId } from '../data/seasons';

/**
 * The season a day is in (V1's L4, decision 294), by the month of its key: winter December to
 * February, spring March to May, summer June to August, autumn September to November. Read from
 * the day key, so a late night is still the day it started on, and nothing about it is saved.
 */
export function seasonOf(day: string): SeasonId {
  const month = Number(day.slice(5, 7));
  const found = (Object.keys(SEASON_MONTHS) as SeasonId[]).find((s) =>
    SEASON_MONTHS[s].includes(month),
  );
  return found ?? 'autumn';
}

/** Which look the ground has on a day: the season's, and in autumn how far the drifts have built. */
export function groundLookIdOf(day: string): GroundLookId {
  return MONTH_LOOKS[Number(day.slice(5, 7)) - 1] ?? 'autumn';
}

export function groundLookOf(day: string): GroundLook {
  return GROUND_LOOKS[groundLookIdOf(day)];
}

/** Whether snow lies on the ground on a day: all winter, not only on the snowy holidays. */
export function snowLies(day: string): boolean {
  return groundLookOf(day).snow === true;
}
