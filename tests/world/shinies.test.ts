import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS, FAMILIES } from '../../src/data/critters';
import { ITEM_VALUE } from '../../src/data/shop';
import { dayKey, hourOf } from '../../src/systems/clock';
import { isShinyDeal, SHINY_CHARM_DAYS } from '../../src/systems/critters';
import { shiftDay } from '../../src/systems/calendar';
import type { Critter } from '../../src/world/events';
import type { CritterId } from '../../src/types/ids';
import { harness } from './harness';

/** A critter out where she is, as the net would find it. */
const out = (critter: CritterId, shiny: boolean, slot = 0): Critter => ({
  slot,
  critter,
  tx: 5,
  ty: 5,
  key: `critter:12:${slot}`,
  ...(shiny ? { shiny: true } : {}),
});

describe("a shiny caught (1.4's G1)", () => {
  it('goes in her bag as its shiny self, in the Cabinet beside its first, with a fuss', () => {
    const { world } = harness();
    const caught = world.collecting.keep(out('lunaMoth', true));
    expect(caught).toMatchObject({
      kind: 'caught',
      critter: 'lunaMoth',
      first: true,
      shiny: true,
      firstShiny: true,
    });
    expect(world.bag.count('lunaMothShiny')).toBe(1);
    expect(world.bag.count('lunaMoth')).toBe(0);
    const today = dayKey(world.clock.now());
    expect(world.cabinet.caughtOn('lunaMoth')).toBe(today);
    expect(world.cabinet.shinyOn('lunaMoth')).toBe(today);
    expect(world.collecting.shinyToday()).toBe('lunaMoth');
    const again = world.collecting.keep(out('lunaMoth', true, 1));
    expect(again).toMatchObject({ shiny: true, first: false });
    expect(again).not.toHaveProperty('firstShiny');
  });

  it('keeps a plain catch plain, with no shiny noted', () => {
    const { world } = harness();
    const caught = world.collecting.keep(out('candleMoth', false));
    expect(caught).not.toHaveProperty('shiny');
    expect(world.cabinet.shinyOn('candleMoth')).toBeNull();
    expect(world.collecting.shinyToday()).toBeNull();
  });

  it('sells for twice its plain self', () => {
    const { world } = harness();
    world.bag.add('booKoiShiny', 1);
    const sold = world.shops.sell('booKoiShiny');
    expect(sold).toMatchObject({ kind: 'sold', item: 'booKoiShiny' });
    expect(ITEM_VALUE.booKoiShiny).toBe(ITEM_VALUE.booKoi * 2);
  });

  it('takes its case at the museum in place of the plain one, once', () => {
    const { world } = harness();
    world.bag.add('lunaMoth', 1);
    world.bag.add('lunaMothShiny', 2);
    expect(world.collecting.donate('lunaMoth')).not.toBeNull();
    expect(world.cabinet.isShinyShown('lunaMoth')).toBe(false);
    const label = world.collecting.donate('lunaMoth', true);
    expect(label).toContain('shiny luna moth');
    expect(world.cabinet.isShinyShown('lunaMoth')).toBe(true);
    expect(world.bag.count('lunaMothShiny')).toBe(1);
    expect(world.collecting.donate('lunaMoth', true)).toBeNull();
    expect(world.bag.count('lunaMothShiny')).toBe(1);
    // A shiny given first fills the case, and the plain one isn't asked for after.
    world.bag.add('ghostMothShiny', 1);
    world.bag.add('ghostMoth', 1);
    expect(world.collecting.donate('ghostMoth', true)).not.toBeNull();
    expect(world.cabinet.isDonated('ghostMoth')).toBe(true);
    expect(world.collecting.donate('ghostMoth')).toBeNull();
    expect(world.cabinet.snapshot()).toMatchObject({ shinyShown: ['lunaMoth', 'ghostMoth'] });
  });

  it('carves a shiny figurine from three shinies', () => {
    const { world } = harness();
    world.bag.add('axolotlShiny', 3);
    expect(world.figurines.carvings().map((c) => c.thing)).toContain('axolotlShiny');
    expect(world.figurines.carve('axolotlShiny')).toMatchObject({
      kind: 'carved',
      figurine: 'axolotlShinyFigurine',
    });
    expect(world.home.stored).toContainEqual({ id: 'axolotlShinyFigurine', count: 1 });
  });

  it('sends the two shiny shelves’ letters, a shiny of every family and of everything', () => {
    const day = '2026-10-01';
    const one = FAMILIES.map((f) => CRITTER_IDS.find((id) => CRITTERS[id].family === f)!);
    const shinies = (ids: readonly CritterId[]) => Object.fromEntries(ids.map((id) => [id, day]));
    const { world } = harness(undefined, {
      cabinet: { caught: shinies(CRITTER_IDS), donated: [], best: {}, shinies: shinies(one) },
    });
    world.update(16);
    expect(world.mailbox.letters.has('shelf:shinyFamilies')).toBe(true);
    expect(world.mailbox.letters.has('shelf:shinies')).toBe(false);
    expect(world.milestones.progress('shinies')).toMatchObject({
      have: one.length,
      total: CRITTER_IDS.length,
    });
    for (const id of CRITTER_IDS) world.cabinet.shine(id, day);
    world.events.emit('cabinet', world.cabinet);
    world.update(16);
    expect(world.mailbox.letters.has('shelf:shinies')).toBe(true);
    expect(world.mailbox.open('shelf:shinies')).toBe(true);
    expect(world.home.stored).toContainEqual(expect.objectContaining({ id: 'shinyDome' }));
  });

  it('charms a kind long in her Cabinet without its shiny, so the next one out is shiny', () => {
    const { world, clock } = harness();
    const today = dayKey(clock.now());
    const long = shiftDay(today, -SHINY_CHARM_DAYS);
    // Every kind caught long ago: whatever is out where she is comes out shiny.
    for (const id of CRITTER_IDS) world.cabinet.record(id, long);
    const critters = world.collecting.critters('town');
    expect(critters.length).toBeGreaterThan(0);
    expect(critters.every((c) => c.shiny)).toBe(true);
    // One caught shiny lifts its charm.
    const first = critters[0]!;
    world.cabinet.shine(first.critter, today);
    const after = world.collecting.critters('town').find((c) => c.key === first.key)!;
    const hour = Math.floor(hourOf(clock.now()));
    expect(after.shiny === true).toBe(isShinyDeal(today, hour, first.slot, first.critter));
  });
});
