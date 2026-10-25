import { describe, expect, it } from 'vitest';
import { CONSTELLATION_IDS, CONSTELLATIONS, FIRST_STARS } from '../../src/data/constellations';
import { keyOf, shiftDay } from '../../src/systems/calendar';
import { rareEventOn } from '../../src/systems/rareEvents';
import { weatherOn } from '../../src/systems/weather';
import { letterOf } from '../../src/systems/friendship';
import type { ConstellationId } from '../../src/types/ids';
import type { WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** The first day from `from` that's clear, with no meteor shower. */
function clearDay(from: string): string {
  let day = from;
  while (weatherOn(day) !== 'clear' || rareEventOn(day) === 'meteorShower') {
    day = shiftDay(day, 1);
  }
  return day;
}

function at(h: Harness, day: string, hour: number): void {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  h.clock.set(new Date(y, m - 1, d, hour));
}

/** Walks up to the telescope at the castle lookout, and says what came of it. */
function lookThrough(h: Harness): WorldEvent[] {
  h.world.atlas.find('castleHill');
  if (h.world.scene !== 'castleHill') expect(h.world.travel.go('castleHill')).toBe(true);
  h.tick(2);
  const zone = h.world.zones.outdoor('castleHill')!;
  const scope = zone.map.props.find((p) => p.id === 'telescope')!;
  h.world.tapTile(scope.tx, scope.ty);
  return [
    ...h.tick(1),
    ...h.until(() => !h.world.movement.walking, 'walking to the telescope', 60_000),
    ...h.tick(1),
  ];
}

function trace(h: Harness, id: ConstellationId): WorldEvent[] {
  expect(h.world.stargazing.begin(id)).not.toBeNull();
  const events: WorldEvent[] = [];
  CONSTELLATIONS[id].stars.forEach((_, i) => {
    h.world.stargazing.tap(i);
    events.push(...h.tick(1));
  });
  return events;
}

describe('the telescope at the castle lookout (1.5 G4)', () => {
  it('says the sky is too bright by day, and opens the sky on a clear night', () => {
    const h = harness();
    const day = clearDay('2026-10-05');
    at(h, day, 12);
    expect(lookThrough(h)).toContainEqual({ kind: 'stargaze', sky: 'bright' });
    at(h, day, 22);
    expect(lookThrough(h)).toContainEqual({ kind: 'stargaze', sky: 'open' });
  });

  it('says the sky is cloudy on a night of rain or fog', () => {
    const h = harness();
    let day = '2026-10-05';
    while (weatherOn(day) === 'clear') day = shiftDay(day, 1);
    at(h, day, 22);
    expect(lookThrough(h)).toContainEqual({ kind: 'stargaze', sky: 'cloudy' });
    expect(h.world.stargazing.begin('bat')).toBeNull();
  });
});

describe('tracing a constellation', () => {
  it("puts it on her chart, and Hazel's letter with her star map comes after the first", () => {
    const h = harness();
    at(h, clearDay('2026-10-05'), 22);
    expect(h.world.stargazing.tonight().findable).toEqual(['bat', 'cauldron', 'cat']);
    expect(h.world.stargazing.begin('snowflake')).toBeNull();
    const events = trace(h, 'bat');
    expect(events).toContainEqual({
      kind: 'traced',
      constellation: 'bat',
      first: true,
      posted: true,
    });
    expect(h.world.cabinet.tracedOn('bat')).not.toBeNull();
    expect(h.world.mailbox.letters.has(FIRST_STARS)).toBe(true);
    expect(letterOf(FIRST_STARS)?.gift).toEqual({ item: 'starMap' });
    const second = trace(h, 'cat');
    expect(second).toContainEqual({ kind: 'traced', constellation: 'cat', first: true });
    // Traced again, it's no news, and nothing is posted.
    expect(trace(h, 'bat')).toContainEqual({ kind: 'traced', constellation: 'bat', first: false });
  });

  it('only twinkles at a star out of order, and the trace goes on', () => {
    const h = harness();
    at(h, clearDay('2026-10-05'), 22);
    h.world.stargazing.begin('bat');
    expect(h.world.stargazing.tap(3)?.kind).toBe('twinkle');
    expect(h.world.stargazing.tap(0)?.kind).toBe('lit');
    expect(h.world.stargazing.trace).toEqual({ id: 'bat', lit: 1 });
  });

  it('keeps her chart in the save', () => {
    const h = harness();
    at(h, clearDay('2026-10-05'), 22);
    trace(h, 'bat');
    const saved = h.world.save();
    expect(Object.keys(saved.cabinet.stars)).toEqual(['bat']);
  });

  it('fills half the sky and then the whole, each sending Hazel’s gift', () => {
    const h = harness();
    at(h, keyOf(2026, 10, 1), 22);
    for (const id of CONSTELLATION_IDS) h.world.cabinet.chart(id, '2026-10-01');
    expect(h.world.milestones.progress('halfTheSky')).toEqual({ have: 8, total: 8, done: true });
    expect(h.world.milestones.progress('wholeSky')).toEqual({ have: 15, total: 15, done: true });
  });
});
