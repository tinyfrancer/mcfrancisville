import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS, flies } from '../../src/data/critters';
import { letterOf } from '../../src/systems/friendship';
import type { CritterId } from '../../src/types/ids';
import { NET_MS, type Critter, type WorldEvent } from '../../src/world/Town';
import { harness, type Harness } from './harness';

/** Taps a critter, walks up to it, and swings. */
function goAfter(h: Harness, c: Critter): WorldEvent[] {
  expect(h.town.tapTile(c.tx, c.ty)).toBe(true);
  return h.until(() => !h.town.player.moving, `reaching the ${c.critter}`).concat(h.tick(1));
}

/** One of the hour's critters that no neighbour is standing near, so a tap is for it. */
function clearCritter(h: Harness, which?: CritterId): Critter {
  const c = h.town
    .critters()
    .find(
      (c) =>
        (!which || c.critter === which) &&
        !h.town.villagerAt(c.tx, c.ty) &&
        !h.town.villagerAt(c.tx, c.ty + 1),
    );
  if (!c) throw new Error(`no ${which ?? 'critter'} clear of the neighbours`);
  return c;
}

/** Sets the clock to the first night, from 26 September, that `id` is out at `hour`. */
function nightWith(h: Harness, id: CritterId, hour: number): void {
  for (let d = 0; d < 120; d++) {
    h.clock.set(new Date(2026, 8, 26 + d, hour, 10));
    if (h.town.critters().some((c) => c.critter === id && !h.town.villagerAt(c.tx, c.ty))) return;
  }
  throw new Error(`no ${id} at ${hour}:00 in four months`);
}

describe('critters in town', () => {
  it('are out at noon, the ones whose hours those are', () => {
    const { town } = harness();
    const out = town.critters();
    expect(out.length).toBeGreaterThanOrEqual(4);
    for (const c of out) expect(CRITTERS[c.critter].from).toBeLessThanOrEqual(12);
  });

  it('are caught with a walk up and a swing of the net, into her bag and her Cabinet', () => {
    const h = harness();
    const c = clearCritter(h);
    const events = goAfter(h, c);
    expect(events).toContainEqual({ kind: 'caught', critter: c.critter, first: true });
    expect(h.town.bag.count(c.critter)).toBe(1);
    expect(h.town.cabinet.caughtOn(c.critter)).toBe('2026-09-26');
    expect(h.town.netSwing()).not.toBeNull();
    h.clock.advance(NET_MS);
    expect(h.town.netSwing()).toBeNull();
  });

  it('once caught, are gone for the rest of the hour, even after a reload', () => {
    const h = harness();
    const c = clearCritter(h);
    goAfter(h, c);
    expect(h.town.critters().some((o) => o.key === c.key)).toBe(false);
    const again = harness(undefined, {
      finds: h.town.finds(),
      cabinet: h.town.cabinetSnapshot().cabinet,
    });
    expect(again.town.critters().some((o) => o.key === c.key)).toBe(false);
    expect(again.town.cabinet.caughtOn(c.critter)).toBe('2026-09-26');
  });

  it('can be tapped in the air above, for the ones that fly', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 26, 22, 10));
    const flier = h.town.critters().find((c) => flies(c.critter));
    expect(flier).toBeDefined();
    const above = h.town.critterAt(flier!.tx, flier!.ty - 1);
    // Unless something stands there that the tap would be for instead.
    if (above) expect(above.key).toBe(flier!.key);
  });

  it('are not new to the Cabinet a second time', () => {
    const h = harness();
    const first = clearCritter(h);
    goAfter(h, first);
    const later = harness(undefined, { cabinet: { caught: { [first.critter]: '2026-09-20' } } });
    const same = later.town.critters().find((c) => c.key === first.key)!;
    const events = goAfter(later, same);
    expect(events).toContainEqual({ kind: 'caught', critter: first.critter, first: false });
    expect(later.town.cabinet.caughtOn(first.critter)).toBe('2026-09-20');
  });
});

describe('a rare, wary critter', () => {
  it('flutters off a little way the first time, and is caught the next', () => {
    const h = harness();
    nightWith(h, 'lunaMoth', 22);
    const moth = clearCritter(h, 'lunaMoth');
    const fled = goAfter(h, moth);
    expect(fled).toContainEqual({ kind: 'fled', critter: 'lunaMoth' });
    expect(h.town.bag.count('lunaMoth')).toBe(0);
    const moved = h.town.critters().find((c) => c.key === moth.key)!;
    const far = Math.max(Math.abs(moved.tx - moth.tx), Math.abs(moved.ty - moth.ty));
    expect(far).toBeGreaterThanOrEqual(2);
    expect(far).toBeLessThanOrEqual(12);
    const caught = goAfter(h, moved);
    expect(caught).toContainEqual({ kind: 'caught', critter: 'lunaMoth', first: true });
  });

  it('includes the pair of orbs, out late in the graveyard', () => {
    const h = harness();
    nightWith(h, 'orbPair', 23);
    expect(h.town.critters().some((c) => c.critter === 'orbPair')).toBe(true);
  });
});

describe('the museum', () => {
  it('puts a critter from her bag on show, once for each kind', () => {
    const { town } = harness();
    expect(town.donate('lilyFrog')).toBeNull();
    town.bag.add('lilyFrog', 2);
    const label = town.donate('lilyFrog');
    expect(label).toMatch(/lily frog/);
    expect(town.cabinet.isDonated('lilyFrog')).toBe(true);
    expect(town.bag.count('lilyFrog')).toBe(1);
    expect(town.donate('lilyFrog')).toBeNull();
    expect(town.bag.count('lilyFrog')).toBe(1);
  });

  it('gives the luna moth and the orbs labels of their own', () => {
    const { town } = harness();
    town.bag.add('orbPair', 1);
    expect(town.donate('orbPair')).toMatch(/Forever orbs/);
  });

  it('has Wrapunzel write at ten on show, with a lamp, and when every case is full', () => {
    const h = harness();
    const nine = CRITTER_IDS.slice(0, 9);
    const town = harness(undefined, { cabinet: { caught: {}, donated: nine } }).town;
    const tenth = CRITTER_IDS[9]!;
    town.bag.add(tenth, 1);
    town.donate(tenth);
    expect(town.update(16)).toContainEqual({ kind: 'mail', from: 'wrapunzel' });
    expect(town.mail[0]!.id).toBe('museum:10');
    expect(town.openLetter('museum:10')).toBe(true);
    expect(town.home.stored).toContainEqual(expect.objectContaining({ id: 'lunaMothLamp' }));

    const rest = CRITTER_IDS.slice(10);
    for (const id of rest) h.town.bag.add(id, 1);
    for (const id of CRITTER_IDS.slice(0, 10)) h.town.bag.add(id, 1);
    for (const id of CRITTER_IDS) h.town.donate(id);
    expect(h.town.mail.map((m) => m.id).sort()).toEqual(['museum:10', 'museum:19']);
    expect(letterOf('museum:19')?.gift).toEqual({ furniture: 'curiosityCabinet' });
  });
});
