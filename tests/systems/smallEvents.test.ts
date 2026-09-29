import { describe, expect, it } from 'vitest';
import { PARTY_SPOTS } from '../../src/data/specialDays';
import { LOST, LOST_IDS, LOST_SPOTS, NEWS } from '../../src/data/smallEvents';
import { spotOf, TOWN } from '../../src/data/maps';
import { parseMap, walkable } from '../../src/systems/grid';
import { findPath } from '../../src/systems/pathfinding';
import { stopsIn } from '../../src/systems/schedules';
import { smallEventOf } from '../../src/systems/smallEvents';
import { exitAt } from '../../src/systems/zones';

const WINDOWS = Array.from({ length: 60 }, (_, i) => {
  const day = new Date(Date.UTC(2026, 8, 26 + Math.floor(i / 3))).toISOString().slice(0, 10);
  return `${day}@${['morning', 'afternoon', 'evening'][i % 3]}`;
});

describe('small events', () => {
  it('are dealt by the window, the same all window, news and lost things both', () => {
    for (const w of WINDOWS) expect(smallEventOf(w)).toEqual(smallEventOf(w));
    const kinds = WINDOWS.map((w) => smallEventOf(w).kind);
    expect(kinds.filter((k) => k === 'news').length).toBeGreaterThan(15);
    expect(kinds.filter((k) => k === 'lost').length).toBeGreaterThan(15);
    const lost = new Set(
      WINDOWS.map(smallEventOf).flatMap((e) => (e.kind === 'lost' ? [e.lost] : [])),
    );
    expect(lost.size).toBe(LOST_IDS.length);
  });

  it('lose things only on open ground she can reach, clear of anyone standing there', () => {
    const map = parseMap(TOWN);
    const stood = [
      ...stopsIn('town'),
      ...Object.values(PARTY_SPOTS).map((name) => spotOf('town', name)),
      ...map.snackSpots,
      map.spawn,
    ].map((t) => `${t.tx},${t.ty}`);
    for (const { at, where } of LOST_SPOTS) {
      const label = `${where} ${at.tx},${at.ty}`;
      expect(walkable(map, at.tx, at.ty), label).toBe(true);
      const path = findPath(map.spawn, at, (x, y) => walkable(map, x, y), map.width, map.height);
      expect(path, label).not.toBeNull();
      expect(stood, label).not.toContain(`${at.tx},${at.ty}`);
      expect(
        map.patches.some((p) => p.tx === at.tx && p.ty === at.ty),
        label,
      ).toBe(false);
      expect(exitAt(map.exits, at), label).toBeUndefined();
    }
    expect(new Set(LOST_SPOTS.map((s) => `${s.at.tx},${s.at.ty}`)).size).toBe(LOST_SPOTS.length);
  });

  it('have something to say, and say where, with only Cody calling her babe', () => {
    for (const id of LOST_IDS) {
      const row = LOST[id];
      expect(row.ask, id).toContain('{where}');
      for (const line of [row.ask, row.thanks]) {
        expect(/\bbabe\b/i.test(line), id).toBe(row.who === 'cody');
      }
    }
    for (const news of NEWS) expect(/\bbabe\b/i.test(news.line)).toBe(news.who === 'cody');
  });
});
