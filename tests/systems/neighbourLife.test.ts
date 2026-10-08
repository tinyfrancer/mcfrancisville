import { describe, expect, it } from 'vitest';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { WORK_IDS, WORKS } from '../../src/data/work';
import {
  chatOn,
  LINGER_MS,
  NEIGHBOUR_WAVE_MS,
  restOf,
  stanceOf,
  stopNow,
  STROLL_AFTER_MS,
  strollAfter,
  strollTiles,
  strollTo,
  lingerFor,
  waveFrame,
  workFrame,
  type StrollGround,
} from '../../src/systems/neighbourLife';
import { specialDayOf } from '../../src/systems/friendship';
import { happeningOf } from '../../src/systems/happenings';
import { stopAt, stopOf, visitOf } from '../../src/systems/schedules';

/** A ground drawn in characters: `#` is solid, `D` a tile she needs, anything else open. */
function ground(rows: string[]): StrollGround {
  const at = (tx: number, ty: number) => rows[ty]?.[tx];
  return {
    canWalk: (tx, ty) => at(tx, ty) !== undefined && at(tx, ty) !== '#',
    needed: (tx, ty) => at(tx, ty) === 'D',
    width: rows[0]!.length,
    height: rows.length,
  };
}

describe("a neighbour's stroll", () => {
  it('comes every 20 to 40 seconds and lingers 3 to 6, different each time', () => {
    for (const id of VILLAGER_IDS) {
      const waits = Array.from({ length: 20 }, (_, n) => strollAfter(id, n));
      for (const w of waits) {
        expect(w).toBeGreaterThanOrEqual(STROLL_AFTER_MS[0]);
        expect(w).toBeLessThanOrEqual(STROLL_AFTER_MS[1]);
      }
      expect(new Set(waits).size).toBeGreaterThan(10);
      for (let n = 0; n < 20; n++) {
        expect(lingerFor(id, n)).toBeGreaterThanOrEqual(LINGER_MS[0]);
        expect(lingerFor(id, n)).toBeLessThanOrEqual(LINGER_MS[1]);
      }
    }
  });

  it('goes a tile or two, a short walk, never onto a tile she needs or another stop', () => {
    const g = ground(['.......', '.###...', '.#.#.D.', '.###...', '.......', '.......']);
    const stop = { tx: 4, ty: 3 };
    const tiles = strollTiles(g, stop, [{ tx: 5, ty: 4 }]);
    expect(tiles.length).toBeGreaterThan(5);
    for (const t of tiles) {
      expect(Math.max(Math.abs(t.tx - stop.tx), Math.abs(t.ty - stop.ty))).toBeLessThanOrEqual(2);
      expect(g.canWalk(t.tx, t.ty)).toBe(true);
    }
    expect(tiles).not.toContainEqual({ tx: 5, ty: 2 });
    expect(tiles).not.toContainEqual({ tx: 5, ty: 4 });
    expect(tiles).not.toContainEqual(stop);
    // Walled in, two tiles off as the crow flies but no way there.
    expect(tiles).not.toContainEqual({ tx: 2, ty: 2 });
  });

  it('picks the same tile for the same stroll, and goes nowhere with nowhere to go', () => {
    const tiles = [
      { tx: 1, ty: 1 },
      { tx: 2, ty: 1 },
      { tx: 3, ty: 1 },
    ];
    expect(strollTo('rufus', 3, tiles)).toEqual(strollTo('rufus', 3, tiles));
    const picks = new Set(Array.from({ length: 30 }, (_, n) => strollTo('rufus', n, tiles)!.tx));
    expect(picks.size).toBe(3);
    expect(strollTo('rufus', 0, [])).toBeNull();
  });
});

describe('the stop a neighbour keeps', () => {
  it('is their schedule stop, but not at a happening, on a visit or at her birthday party', () => {
    let kept = 0;
    let away = 0;
    for (let d = 1; d <= 28; d++) {
      const day = `2026-11-${String(d).padStart(2, '0')}`;
      for (const id of VILLAGER_IDS) {
        for (let hour = 0; hour < 24; hour++) {
          const stop = stopNow(id, hour, day);
          const elsewhere =
            specialDayOf(day) === 'birthday' ||
            happeningOf(id, hour, day) !== null ||
            visitOf(id, hour, day) !== null;
          if (elsewhere) {
            expect(stop).toBeNull();
            away += 1;
            continue;
          }
          expect(stop).not.toBeNull();
          expect(stopAt(stop!)).toEqual(stopOf(id, hour, day));
          kept += 1;
        }
      }
    }
    expect(kept).toBeGreaterThan(away);
    expect(away).toBeGreaterThan(0);
  });
});

describe('how a neighbour stands', () => {
  const standing = { id: 'rufus' as const, moving: false, waveMs: 0, working: null, seated: false };

  it('breathes and blinks to a beat of their own', () => {
    let out = 0;
    let blinks = 0;
    for (let ms = 0; ms < 60_000; ms += 10) {
      const rest = restOf('rufus', ms);
      if (rest.out) out += 1;
      if (rest.blink) blinks += 1;
    }
    expect(out / 6000).toBeCloseTo(0.5, 1);
    expect(blinks).toBeGreaterThan(0);
    // Not everyone breathes as one.
    const phases = new Set(
      VILLAGER_IDS.map((id) => [0, 400, 800, 1200].map((ms) => restOf(id, ms).out).join()),
    );
    expect(phases.size).toBeGreaterThan(1);
  });

  it('is never one still frame for more than a few seconds', () => {
    for (const working of [null, ...WORK_IDS]) {
      for (const seated of [false, true]) {
        const n = { ...standing, working, seated };
        let last = JSON.stringify(stanceOf(n, 0));
        let since = 0;
        for (let ms = 0; ms < 20_000; ms += 50) {
          const now = JSON.stringify(stanceOf(n, ms));
          if (now !== last) since = ms;
          last = now;
          expect(ms - since, `${working} ${seated}`).toBeLessThan(3_000);
        }
      }
    }
  });

  it('waves first, then works, then rests; walking is the walk', () => {
    expect(stanceOf({ ...standing, moving: true }, 0)).toBeNull();
    const waving = stanceOf({ ...standing, waveMs: NEIGHBOUR_WAVE_MS, working: 'flowers' }, 0);
    expect(waving?.act).toBe('wave');
    expect(stanceOf({ ...standing, working: 'flowers' }, 0)?.act).toBe('flowers');
    expect(stanceOf({ ...standing, seated: true }, 0)?.sit).toBe(true);
    expect(stanceOf(standing, 0)?.act).toBeUndefined();
  });

  it('waves the hand one way and the other, and works both frames of a job', () => {
    const frames = new Set<number>();
    for (let left = NEIGHBOUR_WAVE_MS; left > 0; left -= 50) frames.add(waveFrame(left));
    expect([...frames].sort()).toEqual([0, 1]);
    for (const work of WORK_IDS) {
      const seen = new Set<number>();
      for (let ms = 0; ms < 4 * WORKS[work].frameMs; ms += 25) {
        seen.add(workFrame('barty', work, ms));
      }
      expect([...seen].sort(), work).toEqual([0, 1]);
    }
  });
});

describe('chatter', () => {
  it('takes turns, in pauses, songs and hearts, with a quiet beat now and then', () => {
    const said = Array.from({ length: 200 }, (_, beat) => chatOn(['maude', 'agatha'], beat));
    const chats = new Set(said.flatMap((s) => (s ? [s.chat] : [])));
    expect([...chats].sort()).toEqual(['…', '♥', '♪'].sort());
    expect(said.some((s) => s === null)).toBe(true);
    said.forEach((s, beat) => {
      if (s) expect(s.by).toBe(beat % 2 === 0 ? 'maude' : 'agatha');
    });
  });
});
