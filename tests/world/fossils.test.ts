import { describe, expect, it } from 'vitest';
import { FOSSILS, FOSSIL_IDS } from '../../src/data/fossils';
import { dayKey } from '../../src/systems/clock';
import { findIn } from '../../src/systems/fossils';
import { fromSave, type WorldEvent } from '../../src/world/World';
import { harness } from './harness';

/** Walks her up to the town's mound today, and returns what happened. */
function digTown(h: ReturnType<typeof harness>): WorldEvent[] {
  const mound = h.world.fossils.mound('town')!;
  h.world.tapTile(mound.tx, mound.ty);
  return [...h.tick(1), ...h.until(() => !h.world.movement.walking, 'walking up to the mound')];
}

/** A day on which the town's mound has a fossil in it, from 26 September on. */
function fossilDay(h: ReturnType<typeof harness>): void {
  while (!('fossil' in findIn('town', dayKey(h.clock.now())))) h.clock.advance(24 * 3_600_000);
}

describe("the day's mound", () => {
  it('stands in town, solid, and gives what is in it once a day', () => {
    const h = harness();
    fossilDay(h);
    const mound = h.world.fossils.mound('town')!;
    expect(h.world.zone.canWalk(mound.tx, mound.ty)).toBe(false);
    expect(h.world.zone.propAt(mound.tx, mound.ty)?.id).toBe('mound');
    const find = findIn('town', dayKey(h.clock.now()));
    const dug = digTown(h).find((e) => e.kind === 'unearthed');
    expect(dug).toEqual({ kind: 'unearthed', find, first: true });
    const fossil = (find as { fossil: (typeof FOSSIL_IDS)[number] }).fossil;
    expect(h.world.bag.count(fossil)).toBe(1);
    expect(h.world.fossils.isDug('town')).toBe(true);
    // Once a day: the hole stays till morning.
    expect(digTown(h).some((e) => e.kind === 'unearthed')).toBe(false);
    h.clock.advance(24 * 3_600_000);
    expect(h.world.fossils.isDug('town')).toBe(false);
  });

  it('says the first of a fossil is new, and not the second', () => {
    const h = harness();
    fossilDay(h);
    const fossil = (findIn('town', dayKey(h.clock.now())) as { fossil: never }).fossil;
    digTown(h);
    expect(h.world.milestones.hasHad(fossil)).toBe(true);
    let first: boolean | null = null;
    for (let d = 0; d < 400 && first === null; d++) {
      h.clock.advance(24 * 3_600_000);
      const find = findIn('town', dayKey(h.clock.now()));
      if (!('fossil' in find) || find.fossil !== fossil) continue;
      const dug = digTown(h).find((e) => e.kind === 'unearthed');
      first = dug?.kind === 'unearthed' ? dug.first : null;
    }
    expect(first).toBe(false);
  });

  it('pays Candy, or a bead, now and then', () => {
    const h = harness();
    while (!('candy' in findIn('town', dayKey(h.clock.now())))) h.clock.advance(24 * 3_600_000);
    const before = h.world.wallet.candy;
    digTown(h);
    expect(h.world.wallet.candy).toBeGreaterThan(before);
  });

  it('is kept dug through a save, and a fossil goes on show at the museum and stays', () => {
    const h = harness();
    fossilDay(h);
    digTown(h);
    const fossil = FOSSIL_IDS.find((id) => h.world.bag.count(id) > 0)!;
    expect(h.world.fossils.donate(fossil)).toBe(FOSSILS[fossil].label);
    expect(h.world.fossils.donate(fossil)).toBeNull();
    expect(h.world.cabinet.isDonated(fossil)).toBe(true);
    expect(h.world.cabinet.onShow).toBe(0);
    expect(h.world.cabinet.fossilsOnShow).toBe(1);
    const saved = h.world.save();
    expect(saved.cabinet.donated).toEqual([fossil]);
    const again = harness(undefined, fromSave(saved));
    again.clock.set(h.clock.now());
    expect(again.world.fossils.isDug('town')).toBe(true);
    expect(again.world.cabinet.isDonated(fossil)).toBe(true);
  });
});
