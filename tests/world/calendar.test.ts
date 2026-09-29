import { describe, expect, it } from 'vitest';
import { eventToast } from '../../src/hud/messages';
import { harness } from './harness';

describe("the day's windows and the calendar", () => {
  it('says what today is: its window, weather, what is on, and who is visiting', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 31, 20));
    const today = h.world.calendar.today();
    expect(today).toMatchObject({ day: '2026-10-31', window: 'evening' });
    expect(today.happening).toContain('halloween');
    expect(['clear', 'rain', 'fog']).toContain(today.weather);
    expect(today.visitors.every((v) => v === 'popUp' || v === 'moonPie')).toBe(true);
  });

  it('tells her when a window turns while she plays, but not when the game opens', () => {
    const h = harness();
    const seen: string[] = [];
    h.world.events.on('today', (t) => seen.push(t.window));
    expect(h.tick(1).filter((e) => e.kind === 'window')).toEqual([]);
    expect(seen).toEqual(['afternoon']);
    h.clock.set(new Date(2026, 8, 26, 18));
    const turned = h.tick(1).filter((e) => e.kind === 'window');
    expect(turned).toEqual([{ kind: 'window', window: 'evening', happening: expect.any(Array) }]);
    expect(seen).toEqual(['afternoon', 'evening']);
    expect(h.tick(1).filter((e) => e.kind === 'window')).toEqual([]);
  });

  it("says good morning, and what's on", () => {
    const toast = eventToast({ kind: 'window', window: 'morning', happening: ['marketDay'] });
    expect(toast?.text).toMatch(/^Good morning!.*market day/);
    const later = eventToast({ kind: 'window', window: 'afternoon', happening: [] });
    expect(later?.text).toMatch(/grown back/);
  });

  it('lays out a month, and what is coming up', () => {
    const { world } = harness();
    expect(world.calendar.month(2026, 10)).toHaveLength(31);
    const next = world.calendar.comingUp(3);
    expect(next).toHaveLength(3);
    expect(next[0]!.day > '2026-09-26').toBe(true);
  });

  it('says what the neighbours have on today, but nothing but the party on her birthday', () => {
    const h = harness();
    // A Saturday: movie night at Cody's.
    expect(h.world.calendar.today().gatherings).toContain('movieNight');
    h.clock.set(new Date(2026, 8, 30, 12));
    expect(h.world.calendar.today().gatherings).toContain('bookClub');
    h.clock.set(new Date(2027, 3, 9, 12));
    expect(h.world.calendar.today().gatherings).toEqual([]);
  });
});
