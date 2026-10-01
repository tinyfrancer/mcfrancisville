import { describe, expect, it } from 'vitest';
import { lastFlash, RUMBLE_AFTER_MS } from '../../src/systems/weather';
import { harness } from './harness';

describe('the weather', () => {
  it('is the same everywhere today, from the day key', () => {
    const h = harness();
    expect(h.world.weather.today()).toBe('clear');
    h.clock.set(new Date(2026, 8, 28, 9));
    expect(h.world.weather.today()).toBe('rain');
    h.clock.set(new Date(2026, 8, 29, 9));
    expect(h.world.weather.today()).toBe('fog');
  });

  it('is told once a day, the first time she is outdoors in rain or fog', () => {
    const h = harness();
    expect(h.tick(1).filter((e) => e.kind === 'weather')).toEqual([]);
    h.clock.set(new Date(2026, 8, 28, 9));
    // The 28th's rain is a thunderstorm, and she's told so.
    expect(h.tick(1)).toContainEqual({ kind: 'weather', weather: 'rain', storm: true });
    expect(h.tick(5).filter((e) => e.kind === 'weather')).toEqual([]);
    h.clock.set(new Date(2026, 8, 29, 9));
    expect(h.tick(1)).toContainEqual({ kind: 'weather', weather: 'fog' });
  });

  it('waits until she steps outdoors to say so', () => {
    const h = harness(undefined, { player: { zone: 'home', tx: 3, ty: 4, facing: 'down' } });
    h.clock.set(new Date(2026, 8, 28, 9));
    expect(h.tick(3).filter((e) => e.kind === 'weather')).toEqual([]);
  });

  it('rumbles once, a moment after each flash on a stormy day, indoors too', () => {
    const h = harness(undefined, { player: { zone: 'home', tx: 3, ty: 4, facing: 'down' } });
    h.clock.set(new Date(2026, 8, 28, 9));
    expect(h.world.weather.stormy()).toBe(true);
    let now = h.clock.now();
    while (lastFlash('2026-09-28', now) === null) now += 1000;
    const flash = lastFlash('2026-09-28', now)!;
    h.clock.set(new Date(flash + 100));
    expect(h.world.weather.sinceFlash()).toBe(100);
    expect(h.tick(1).filter((e) => e.kind === 'thunder')).toEqual([]);
    h.clock.set(new Date(flash + RUMBLE_AFTER_MS + 50));
    expect(h.tick(1).filter((e) => e.kind === 'thunder')).toEqual([{ kind: 'thunder' }]);
    expect(h.tick(3).filter((e) => e.kind === 'thunder')).toEqual([]);
  });

  it('is never a storm on a clear or foggy day', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 29, 9));
    expect(h.world.weather.stormy()).toBe(false);
    expect(h.world.weather.sinceFlash()).toBeNull();
  });
});
