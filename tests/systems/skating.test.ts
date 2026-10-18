import { describe, expect, it } from 'vitest';
import { TOWN, TOWN_SPOTS } from '../../src/data/maps';
import { SKATING } from '../../src/data/skating';
import { VILLAGERS } from '../../src/data/villagers';
import { WORKS } from '../../src/data/work';
import { parseMap, tileAt } from '../../src/systems/grid';
import { isFrozen } from '../../src/systems/holidays';
import { stopNow } from '../../src/systems/neighbourLife';
import { scheduleOn, stopOf } from '../../src/systems/schedules';
import { withSkating } from '../../src/systems/skating';
import { workPose } from '../../src/sprites/working';
import { viewOf } from '../../src/sprites/doll';
import { harness } from '../world/harness';

/** Saturday 2 January 2027, the pond frozen; Saturday 6 March, thawed. */
const FROZEN_SATURDAY = '2027-01-02';
const THAWED_SATURDAY = '2027-03-06';
/** Monday 4 January 2027, still frozen. */
const FROZEN_MONDAY = '2027-01-04';

describe('someone else on the ice', () => {
  it('skates on the pond itself, out on the water that freezes', () => {
    const town = parseMap(TOWN);
    for (const row of SKATING) {
      const { tx, ty } = TOWN_SPOTS[row.at];
      expect(tileAt(town, tx, ty), row.at).toBe('water');
    }
    expect(isFrozen(FROZEN_SATURDAY)).toBe(true);
    expect(isFrozen(THAWED_SATURDAY)).toBe(false);
  });

  it("puts Nessa on the ice while it's frozen, and back to the fountain's bank once it thaws", () => {
    expect(stopOf('nessa', 12, FROZEN_SATURDAY)).toEqual({ zone: 'town', ...TOWN_SPOTS.pondIce });
    expect(stopOf('nessa', 12, THAWED_SATURDAY)).toEqual({ zone: 'town', ...TOWN_SPOTS.pondNorth });
    expect(stopOf('nessa', 14, FROZEN_MONDAY)).toEqual({ zone: 'town', ...TOWN_SPOTS.pondIce });
  });

  it('skates as her stop, and her day goes on as it was before and after', () => {
    const day = scheduleOn('nessa', FROZEN_SATURDAY);
    const skating = day.find((s) => s.doing === 'skating')!;
    expect(skating.from).toBe(11);
    expect(stopNow('nessa', 12, FROZEN_SATURDAY)?.doing).toBe('skating');
    // At three she goes down to the lake as she always does.
    expect(stopOf('nessa', 15, FROZEN_SATURDAY)).toEqual(stopOf('nessa', 15, THAWED_SATURDAY));
    expect(stopOf('nessa', 7, FROZEN_SATURDAY)).toEqual(stopOf('nessa', 7, THAWED_SATURDAY));
    for (const other of ['maude', 'rufus', 'agatha'] as const) {
      expect(scheduleOn(other, FROZEN_SATURDAY)).toBe(VILLAGERS[other].schedule.weekend);
    }
  });

  it('carries on the stop that was running when the skating ends', () => {
    const stops = withSkating('nessa', VILLAGERS.nessa.schedule.weekday, false);
    expect(stops.map((s) => s.from)).toEqual([5, 8, 12, 13, 15, 18, 22]);
    // From one till three she's on the ice; the lake's stop from noon is cut short by it.
    expect(stops[3]!.doing).toBe('skating');
    expect(stops[4]).toEqual(VILLAGERS.nessa.schedule.weekday[3]);
  });

  it('draws a skater facing the way skating faces, two frames, arms out and skates on', () => {
    const view = viewOf(WORKS.skating.faces);
    const frames = [0, 1].map((f) => workPose('skating', view, f));
    expect(frames[0]).not.toBeNull();
    expect(frames[0]).not.toEqual(frames[1]);
    expect(frames[0]!.held.some((h) => h.front)).toBe(true);
  });

  it('has her skating out on the frozen pond in town, in her skates', () => {
    const h = harness();
    // Noon on a frozen Saturday, with no happening or visit taking her elsewhere.
    h.clock.set(new Date(2027, 0, 2, 12, 30));
    expect(stopNow('nessa', 12, FROZEN_SATURDAY)?.doing).toBe('skating');
    h.tick(1, 16);
    const nessa = h.world.neighbourhood.neighbour('nessa');
    const pond = TOWN_SPOTS.pondIce;
    const near = () =>
      Math.max(Math.abs(nessa.tile.tx - pond.tx), Math.abs(nessa.tile.ty - pond.ty)) <= 2;
    // She comes in from wherever she was and glides out onto the ice.
    h.until(() => nessa.zone === 'town' && near() && nessa.working !== null, 'Nessa skating');
    expect(h.world.zones.get('town').canWalk(nessa.tile.tx, nessa.tile.ty)).toBe(true);
    expect(nessa.working).toBe('skating');
  });
});
