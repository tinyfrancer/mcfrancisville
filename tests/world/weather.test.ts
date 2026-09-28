import { describe, expect, it } from 'vitest';
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
    expect(h.tick(1)).toContainEqual({ kind: 'weather', weather: 'rain' });
    expect(h.tick(5).filter((e) => e.kind === 'weather')).toEqual([]);
    h.clock.set(new Date(2026, 8, 29, 9));
    expect(h.tick(1)).toContainEqual({ kind: 'weather', weather: 'fog' });
  });

  it('waits until she steps outdoors to say so', () => {
    const h = harness(undefined, { player: { zone: 'home', tx: 3, ty: 4, facing: 'down' } });
    h.clock.set(new Date(2026, 8, 28, 9));
    expect(h.tick(3).filter((e) => e.kind === 'weather')).toEqual([]);
  });
});
