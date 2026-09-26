import { expect } from 'vitest';
import type { MapSource } from '../../src/data/maps';
import { FakeClock } from '../../src/systems/clock';
import { Town, type TownOptions, type WorldEvent } from '../../src/world/Town';

/**
 * A whole town driven for as long as a test likes, with nothing drawing it. Time is game time:
 * `tick` and `until` measure in the milliseconds `update` is handed, so a test is as fast as the
 * CPU and as deterministic as the rules.
 */
export interface Harness {
  town: Town;
  /** The town's clock, which stands still at noon on 26 September until a test moves it. */
  clock: FakeClock;
  /** Steps the town and returns every moment it produced. */
  tick(steps: number, deltaMs?: number): WorldEvent[];
  /** Steps until `done`, failing the test if the budget of game time runs out first. */
  until(done: () => boolean, label: string, budgetMs?: number): WorldEvent[];
}

export function harness(
  source?: MapSource,
  options: Omit<TownOptions, 'map' | 'clock'> = {},
): Harness {
  const clock = new FakeClock(new Date(2026, 8, 26, 12));
  const town = new Town({ ...options, map: source, clock });
  const tick = (steps: number, deltaMs = 16): WorldEvent[] => {
    const events: WorldEvent[] = [];
    for (let i = 0; i < steps; i++) events.push(...town.update(deltaMs));
    return events;
  };
  const until = (done: () => boolean, label: string, budgetMs = 60_000): WorldEvent[] => {
    const events: WorldEvent[] = [];
    let spent = 0;
    while (!done()) {
      if (spent >= budgetMs) {
        expect.fail(`gave up waiting for ${label} after ${budgetMs}ms of game time`);
      }
      events.push(...town.update(16));
      spent += 16;
    }
    return events;
  };
  return { town, clock, tick, until };
}

/** A small map for rules that are easier to read on a picture than in the real town. */
export function tinyMap(rows: string[], spawn = { tx: 1, ty: 1 }): MapSource {
  return {
    rows,
    spawn,
    legend: {
      '#': { tile: 'hedge', solid: true },
      '.': { tile: 'grass' },
      T: { tile: 'grass', prop: 'tree' },
      W: { tile: 'path', prop: 'well' },
    },
  };
}
