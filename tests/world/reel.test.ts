import { describe, expect, it } from 'vitest';
import { FakeClock } from '../../src/systems/clock';
import { SLOW_SWEEP } from '../../src/systems/activities';
import { needleAt, REELS } from '../../src/systems/fishing';
import { worldContext } from '../../src/world/context';
import type { Critter, WorldEvent } from '../../src/world/events';
import type { Collecting } from '../../src/world/services/Collecting';
import { Fishing } from '../../src/world/services/Fishing';
import type { CritterId } from '../../src/types/ids';

/*
 * V1's R6a (decision 316): a rare fish is hooked on its bite and reeled in with a tap in time on
 * the tension bar; a tap out of time only lets the line go slack, and it bites again. Nothing is
 * ever lost.
 */

/** Her rod over one fish, its keeping counted, with a clock the test moves. */
function rodOver(critter: CritterId, slow = false) {
  const clock = new FakeClock(new Date(2026, 9, 2, 21));
  const fish: Critter = { slot: 4, critter, tx: 5, ty: 5, key: 'critter:21:4' };
  const kept: { size: number | null }[] = [];
  const collecting = {
    find: (key: string) => (key === fish.key && kept.length === 0 ? fish : undefined),
    keep: (c: Critter, size: number | null): WorldEvent => {
      kept.push({ size });
      return { kind: 'caught', critter: c.critter, first: false, ...(size ? { size } : {}) };
    },
  } as unknown as Collecting;
  const rod = new Fishing(worldContext(clock), {
    collecting,
    walking: () => false,
    hasFished: () => true,
    eager: () => false,
    slow: () => slow,
    scene: () => 'town',
  });
  /** Steps the clock 16 ms at a time until `done`, gathering what the line does. */
  const wait = (done: () => boolean, budget = 30_000): WorldEvent[] => {
    const events: WorldEvent[] = [];
    for (let spent = 0; !done(); spent += 16) {
      if (spent > budget) throw new Error('gave up waiting');
      clock.advance(16);
      events.push(...rod.step());
    }
    return events;
  };
  /** Waits for when a tap does best, and taps. */
  const tapInTime = (): WorldEvent | null => {
    clock.set(rod.bestTapAt()!);
    rod.step();
    return rod.reel();
  };
  rod.castTo(fish);
  return { clock, rod, kept, wait, tapInTime, fish };
}

describe('reeling in a rare fish', () => {
  it('lands a common fish with one timed tap, sized', () => {
    const { rod, kept, tapInTime } = rodOver('ghostMinnow');
    const caught = tapInTime();
    expect(caught).toMatchObject({ kind: 'caught', critter: 'ghostMinnow' });
    expect(kept).toHaveLength(1);
    expect(kept[0]!.size).toBeGreaterThan(0);
    expect(rod.line).toBeNull();
  });

  it('hooks a rare one on the bite, and a tap in time on the bar lands it, perfect', () => {
    const { rod, kept, tapInTime } = rodOver('ghostPike');
    expect(tapInTime()).toEqual({ kind: 'hooked' });
    expect(rod.line?.state).toBe('reel');
    expect(rod.line?.reeling?.needle).toBe(0);
    const landed = tapInTime();
    expect(landed).toMatchObject({ kind: 'caught', critter: 'ghostPike', grade: 2 });
    expect(kept).toHaveLength(1);
    expect(rod.line).toBeNull();
  });

  it('goes slack on a late tap, loses nothing, and bites again to land', () => {
    const { clock, rod, kept, wait, tapInTime } = rodOver('glowJelly');
    expect(tapInTime()).toEqual({ kind: 'hooked' });
    const hooked = rod.line!.reeling!;
    // Late: the needle at the far end, well past the window.
    clock.set(hooked.at + hooked.reel.period / 2);
    expect(needleAt(hooked.reel, clock.now() - hooked.at)).toBeCloseTo(1);
    expect(rod.reel()).toEqual({ kind: 'slack', first: true });
    expect(kept).toHaveLength(0);
    // Still on her line, coming round to bite again.
    expect(rod.line).not.toBeNull();
    expect(rod.line?.state).not.toBe('reel');
    const again = wait(() => rod.line?.state === 'bite');
    expect(again).toContainEqual({ kind: 'bite' });
    expect(tapInTime()).toEqual({ kind: 'hooked' });
    expect(tapInTime()).toMatchObject({ kind: 'caught', critter: 'glowJelly' });
    expect(kept).toHaveLength(1);
  });

  it('goes slack by itself if she never taps the bar, and the fish is still there', () => {
    const { rod, wait, tapInTime, kept } = rodOver('ghostPike');
    tapInTime();
    const events = wait(() => rod.line?.state !== 'reel');
    expect(events).toContainEqual({ kind: 'slack', first: true });
    expect(rod.line).not.toBeNull();
    expect(kept).toHaveLength(0);
    // Told once; a second slack says nothing more.
    wait(() => rod.line?.state === 'bite');
    tapInTime();
    expect(wait(() => rod.line?.state !== 'reel')).toContainEqual({ kind: 'slack' });
  });

  it('bites for a shorter time the rarer the fish', () => {
    const lengths: Record<string, number> = {};
    for (const id of ['ghostMinnow', 'booKoi', 'ghostPike', 'glowJelly'] as const) {
      const { clock, rod, wait } = rodOver(id);
      wait(() => rod.line?.state === 'bite');
      const from = clock.now();
      wait(() => rod.line?.state !== 'bite');
      lengths[id] = clock.now() - from;
    }
    expect(lengths.ghostMinnow).toBeGreaterThan(lengths.booKoi!);
    expect(lengths.booKoi).toBeGreaterThan(lengths.ghostPike!);
    expect(lengths.ghostPike).toBeGreaterThan(lengths.glowJelly!);
    expect(Math.abs(lengths.glowJelly! - 700)).toBeLessThanOrEqual(16);
  });

  it('sweeps gentler under reduced motion, the same window, and still lands it (1.0.1)', () => {
    const quick = rodOver('ghostPike');
    const gentle = rodOver('ghostPike', true);
    quick.tapInTime();
    gentle.tapInTime();
    const a = quick.rod.line!.reeling!.reel;
    const b = gentle.rod.line!.reeling!.reel;
    expect(a.period).toBe(REELS.rare!.period);
    expect(b.period).toBe(Math.round(REELS.rare!.period * SLOW_SWEEP));
    expect(b.target).toBe(a.target);
    // Untapped, it takes longer to go slack too.
    const from = gentle.clock.now();
    gentle.wait(() => gentle.rod.line?.state !== 'reel', 60_000);
    expect(gentle.clock.now() - from).toBeGreaterThan(3 * a.period);
    gentle.wait(() => gentle.rod.line?.state === 'bite');
    gentle.tapInTime();
    expect(gentle.tapInTime()).toMatchObject({ kind: 'caught', critter: 'ghostPike', grade: 2 });
  });
});
