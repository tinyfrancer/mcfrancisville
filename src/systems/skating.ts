import { SKATING } from '../data/skating';
import type { Stop } from '../data/villagers';
import type { VillagerId } from '../types/ids';

/**
 * A day's stops with a neighbour's hours on the ice slipped in (V1's L4, `data/skating.ts`): the
 * stops before kept, the skating stop (`doing: 'skating'`) from its hour, and at its end whatever
 * stop they'd have been at then, from then, and the stops after as they were. Only for a day the
 * pond is frozen over (`scheduleOn` asks).
 */
export function withSkating(
  villager: VillagerId,
  stops: readonly Stop[],
  weekend: boolean,
): readonly Stop[] {
  const days = weekend ? 'weekend' : 'weekday';
  let out = stops;
  for (const row of SKATING) {
    if (row.villager !== villager || row.days !== days) continue;
    let resumed: Stop = out[out.length - 1]!;
    for (const s of out) if (s.from <= row.until) resumed = s;
    out = [
      ...out.filter((s) => s.from < row.from),
      { from: row.from, at: row.at, doing: 'skating' },
      { ...resumed, from: row.until },
      ...out.filter((s) => s.from > row.until),
    ];
  }
  return out;
}
