import { describe, expect, it } from 'vitest';
import { ACTIVITIES } from '../../src/data/activities';
import { CROW_VIEW, RIDE, RIDE_COST, RIDE_LINES, RIDE_MS } from '../../src/data/fairRide';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { activityAt } from '../../src/systems/activities';
import { companionOf, isFairDay, rideAt, topLine } from '../../src/systems/fairRide';

describe('the big wheel (1.6 X2)', () => {
  it('is a fifth thing to do at the fair, on the wheel, turning all day', () => {
    const row = ACTIVITIES.bigWheel;
    expect(row.at).toEqual({ prop: 'ferrisWheel' });
    expect(activityAt({ prop: 'ferrisWheel' })).toBe('bigWheel');
    expect(row.does).toEqual({ ride: true });
    expect(row.cost).toBe(RIDE_COST);
    expect(row.hours.windows).toEqual(['morning', 'afternoon', 'evening']);
  });

  it('goes once round: up the near side, a stop at the top, and down', () => {
    expect(rideAt(0)).toEqual({ part: 'up', turn: 0, lift: 0 });
    expect(rideAt(RIDE.up / 2).part).toBe('up');
    expect(rideAt(RIDE.up / 2).lift).toBeCloseTo(0.5, 5);
    expect(rideAt(RIDE.up + 1)).toMatchObject({ part: 'top', turn: 0.5, lift: 1 });
    expect(rideAt(RIDE.up + RIDE.top - 1).part).toBe('top');
    expect(rideAt(RIDE.up + RIDE.top + RIDE.down / 2).part).toBe('down');
    expect(rideAt(RIDE_MS)).toEqual({ part: 'done', turn: 1, lift: 0 });
    // Higher all the way up, and lower all the way down, never out of the wheel.
    let last = -1;
    for (let ms = 0; ms <= RIDE.up; ms += 100) {
      const { lift } = rideAt(ms);
      expect(lift).toBeGreaterThanOrEqual(last);
      last = lift;
    }
    for (let ms = RIDE.up + RIDE.top; ms <= RIDE_MS; ms += 100) {
      const { lift } = rideAt(ms);
      expect(lift).toBeLessThanOrEqual(last + 1e-9);
      expect(lift).toBeGreaterThanOrEqual(0);
      last = lift;
    }
  });

  it('takes her husband along if he is at the fair, else whoever she is closest to', () => {
    const hearts = (id: string) => ({ agatha: 3, rufus: 6, cody: 10 })[id] ?? 0;
    expect(companionOf([], hearts)).toBeNull();
    expect(companionOf(['agatha'], hearts)).toBe('agatha');
    expect(companionOf(['agatha', 'rufus'], hearts)).toBe('rufus');
    expect(companionOf(['rufus', 'cody', 'agatha'], () => 0)).toBe('cody');
    // A tie goes to the first in the town's order.
    expect(companionOf(['rufus', 'maude'], () => 2)).toBe('maude');
  });

  it('takes her husband along of an evening, wherever he was (1.7’s Y1)', () => {
    const hearts = (id: string) => ({ agatha: 3, rufus: 6 })[id] ?? 0;
    expect(companionOf([], hearts, true)).toBe('cody');
    expect(companionOf(['agatha', 'rufus'], hearts, true)).toBe('cody');
    expect(companionOf(['agatha', 'rufus'], hearts, false)).toBe('rufus');
  });

  it('has three warm lines at the top for everyone, and the crow’s nothing alone', () => {
    for (const id of VILLAGER_IDS) {
      expect(RIDE_LINES[id], id).toHaveLength(3);
      expect(RIDE_LINES[id]).toContain(topLine(id, '2026-09-19', 1));
    }
    expect(CROW_VIEW).toContain(topLine(null, '2026-09-19', 1));
    for (const line of CROW_VIEW)
      expect(line).toMatch(/crow.*(says nothing|nothing at all|absolutely nothing)/);
    // The same ride says the same; another ride may say another.
    expect(topLine('cody', '2026-09-19', 2)).toBe(topLine('cody', '2026-09-19', 2));
    const said = new Set([1, 2, 3, 4, 5, 6].map((n) => topLine('cody', '2026-09-19', n)));
    expect(said.size).toBeGreaterThan(1);
  });

  it('calls weekends and festival days fair days', () => {
    expect(isFairDay('2026-09-19')).toBe(true);
    expect(isFairDay('2026-09-20')).toBe(true);
    expect(isFairDay('2026-09-16')).toBe(false);
    // The Halloween Festival, all October.
    expect(isFairDay('2026-10-14')).toBe(true);
  });
});
