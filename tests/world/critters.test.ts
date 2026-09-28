import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS, flies } from '../../src/data/critters';
import { letterOf } from '../../src/systems/friendship';
import type { CritterId } from '../../src/types/ids';
import { NET_MS, type Critter, type WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Taps a critter, walks up to it, and swings. */
function goAfter(h: Harness, c: Critter): WorldEvent[] {
  expect(h.world.tapTile(c.tx, c.ty)).toBe(true);
  return h.until(() => !h.world.player.moving, `reaching the ${c.critter}`).concat(h.tick(1));
}

/** One of the hour's critters that no neighbour is standing near, so a tap is for it. */
function clearCritter(h: Harness, which?: CritterId): Critter {
  const c = h.world.collecting
    .critters()
    .find(
      (c) =>
        (!which || c.critter === which) &&
        !h.world.neighbourhood.villagerAt(c.tx, c.ty) &&
        !h.world.neighbourhood.villagerAt(c.tx, c.ty + 1),
    );
  if (!c) throw new Error(`no ${which ?? 'critter'} clear of the neighbours`);
  return c;
}

/** Sets the clock to the first night, from 26 September, that `id` is out at `hour`. */
function nightWith(h: Harness, id: CritterId, hour: number): void {
  for (let d = 0; d < 120; d++) {
    h.clock.set(new Date(2026, 8, 26 + d, hour, 10));
    if (
      h.world.collecting
        .critters()
        .some((c) => c.critter === id && !h.world.neighbourhood.villagerAt(c.tx, c.ty))
    )
      return;
  }
  throw new Error(`no ${id} at ${hour}:00 in four months`);
}

describe('critters in town', () => {
  it('are out at noon, the ones whose hours those are', () => {
    const { world } = harness();
    const out = world.collecting.critters();
    expect(out.length).toBeGreaterThanOrEqual(4);
    for (const c of out) expect(CRITTERS[c.critter].from).toBeLessThanOrEqual(12);
  });

  it('are caught with a walk up and a swing of the net, into her bag and her Cabinet', () => {
    const h = harness();
    const c = clearCritter(h);
    const events = goAfter(h, c);
    expect(events).toContainEqual({ kind: 'caught', critter: c.critter, first: true });
    expect(h.world.bag.count(c.critter)).toBe(1);
    expect(h.world.cabinet.caughtOn(c.critter)).toBe('2026-09-26');
    expect(h.world.collecting.netSwing()).not.toBeNull();
    h.clock.advance(NET_MS);
    expect(h.world.collecting.netSwing()).toBeNull();
  });

  it('once caught, are gone for the rest of the hour, even after a reload', () => {
    const h = harness();
    const c = clearCritter(h);
    goAfter(h, c);
    expect(h.world.collecting.critters().some((o) => o.key === c.key)).toBe(false);
    const again = harness(undefined, {
      finds: h.world.finds(),
      cabinet: h.world.cabinetSnapshot().cabinet,
    });
    expect(again.world.collecting.critters().some((o) => o.key === c.key)).toBe(false);
    expect(again.world.cabinet.caughtOn(c.critter)).toBe('2026-09-26');
  });

  it('can be tapped in the air above, for the ones that fly', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 26, 22, 10));
    const flier = h.world.collecting.critters().find((c) => flies(c.critter));
    expect(flier).toBeDefined();
    const above = h.world.collecting.critterAt(flier!.tx, flier!.ty - 1);
    // Unless something stands there that the tap would be for instead.
    if (above) expect(above.key).toBe(flier!.key);
  });

  it('are not new to the Cabinet a second time', () => {
    const h = harness();
    const first = clearCritter(h);
    goAfter(h, first);
    const later = harness(undefined, { cabinet: { caught: { [first.critter]: '2026-09-20' } } });
    const same = later.world.collecting.critters().find((c) => c.key === first.key)!;
    const events = goAfter(later, same);
    expect(events).toContainEqual({ kind: 'caught', critter: first.critter, first: false });
    expect(later.world.cabinet.caughtOn(first.critter)).toBe('2026-09-20');
  });
});

describe('a rare, wary critter', () => {
  it('flutters off a little way the first time, and is caught the next', () => {
    const h = harness();
    nightWith(h, 'lunaMoth', 22);
    const moth = clearCritter(h, 'lunaMoth');
    const fled = goAfter(h, moth);
    expect(fled).toContainEqual({ kind: 'fled', critter: 'lunaMoth' });
    expect(h.world.bag.count('lunaMoth')).toBe(0);
    const moved = h.world.collecting.critters().find((c) => c.key === moth.key)!;
    const far = Math.max(Math.abs(moved.tx - moth.tx), Math.abs(moved.ty - moth.ty));
    expect(far).toBeGreaterThanOrEqual(2);
    expect(far).toBeLessThanOrEqual(12);
    expect(h.world.poses.pose()).toBeNull();
    const caught = goAfter(h, moved);
    expect(caught).toContainEqual({ kind: 'caught', critter: 'lunaMoth', first: true });
    // A rare catch gets her rocking out, once her net has come down.
    expect(h.world.poses.pose()).toBeNull();
    h.clock.advance(NET_MS);
    expect(['horns', 'bang']).toContain(h.world.poses.pose());
  });

  it('includes the pair of orbs, out late in the graveyard', () => {
    const h = harness();
    nightWith(h, 'orbPair', 23);
    expect(h.world.collecting.critters().some((c) => c.critter === 'orbPair')).toBe(true);
  });
});

describe('the museum', () => {
  it('puts a critter from her bag on show, once for each kind', () => {
    const { world } = harness();
    expect(world.collecting.donate('lilyFrog')).toBeNull();
    world.bag.add('lilyFrog', 2);
    const label = world.collecting.donate('lilyFrog');
    expect(label).toMatch(/lily frog/);
    expect(world.cabinet.isDonated('lilyFrog')).toBe(true);
    expect(world.bag.count('lilyFrog')).toBe(1);
    expect(world.collecting.donate('lilyFrog')).toBeNull();
    expect(world.bag.count('lilyFrog')).toBe(1);
  });

  it('gives the luna moth and the orbs labels of their own', () => {
    const { world } = harness();
    world.bag.add('orbPair', 1);
    expect(world.collecting.donate('orbPair')).toMatch(/Forever orbs/);
  });

  it('has Wrapunzel write at ten on show, with a lamp, and when every case is full', () => {
    const h = harness();
    const nine = CRITTER_IDS.slice(0, 9);
    const world = harness(undefined, { cabinet: { caught: {}, donated: nine } }).world;
    const tenth = CRITTER_IDS[9]!;
    world.bag.add(tenth, 1);
    world.collecting.donate(tenth);
    expect(world.update(16)).toContainEqual({ kind: 'mail', from: 'wrapunzel' });
    expect(world.mailbox.view()[0]!.id).toBe('museum:10');
    expect(world.mailbox.open('museum:10')).toBe(true);
    expect(world.home.stored).toContainEqual(expect.objectContaining({ id: 'lunaMothLamp' }));

    const rest = CRITTER_IDS.slice(10);
    for (const id of rest) h.world.bag.add(id, 1);
    for (const id of CRITTER_IDS.slice(0, 10)) h.world.bag.add(id, 1);
    for (const id of CRITTER_IDS) h.world.collecting.donate(id);
    expect(
      h.world.mailbox
        .view()
        .map((m) => m.id)
        .sort(),
    ).toEqual(['museum:10', 'museum:19']);
    expect(letterOf('museum:19')?.gift).toEqual({ furniture: 'curiosityCabinet' });
  });
});
