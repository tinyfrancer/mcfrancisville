import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { RARE_EVENTS, WANDERING_STALL_AT, type RareEventId } from '../../src/data/rareEvents';
import { shiftDay } from '../../src/systems/calendar';
import { parseMap } from '../../src/systems/grid';
import { rareEventOn } from '../../src/systems/rareEvents';
import { peddlerSpot } from '../../src/systems/shop';
import { talkActions } from '../../src/wiring/talkActions';
import type { WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** The first day from 1 October 2026 a rare event comes, and its next time after that. */
function daysOf(id: RareEventId): [string, string] {
  const found: string[] = [];
  for (let i = 0; found.length < 2 && i < 2000; i++) {
    const day = shiftDay('2026-10-01', i);
    if (rareEventOn(day) !== id) continue;
    // A week's stall counts once.
    if (found.length > 0 && id === 'wanderingStall' && shiftDay(found[0]!, 6) >= day) continue;
    found.push(day);
  }
  return [found[0]!, found[1]!];
}

const at = (day: string, hour: number) => new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`);

/** A town on a day at an hour, stepped once so it has looked about. */
function townOn(day: string, hour = 10): { h: Harness; events: WorldEvent[] } {
  const h = harness();
  h.clock.set(at(day, hour));
  return { h, events: h.tick(2) };
}

const heralds = (events: readonly WorldEvent[]) =>
  events.flatMap((e) => (e.kind === 'heralded' ? [e.what] : []));

const letters = (h: Harness) => h.world.mailbox.view().map((m) => m.id);

describe('a rare event (V1 R3)', () => {
  it('is told the first time she is out that day, once, with its keepsake in the mail', () => {
    for (const id of ['meteorShower', 'wanderingStall', 'snowDay'] as const) {
      const [first, again] = daysOf(id);
      const { h, events } = townOn(first);
      expect(heralds(events), id).toContainEqual({ rare: id });
      expect(heralds(h.tick(5)), id).toEqual([]);
      expect(letters(h), id).toContain(`rare:${id}`);
      expect(h.world.mailbox.open(`rare:${id}`)).toBe(true);
      expect(h.world.bag.count(RARE_EVENTS[id].keepsake), id).toBe(1);
      // The next time it comes, it's told again, but the keepsake came only the once.
      const mail = letters(h).length;
      h.clock.set(at(again, 10));
      expect(heralds(h.tick(2)), id).toContainEqual({ rare: id });
      expect(letters(h).filter((l) => l === `rare:${id}`).length, id).toBe(1);
      expect(letters(h).length, id).toBeGreaterThanOrEqual(mail);
    }
  });

  it('isn’t told indoors, but as soon as she is out', () => {
    const [day] = daysOf('meteorShower');
    const h = harness();
    h.clock.set(at(day, 10));
    expect(h.world.travel.home()).toBe(true);
    expect(heralds(h.tick(3))).toEqual([]);
    expect(h.world.travel.back()).toBe(true);
    expect(heralds(h.tick(3))).toContainEqual({ rare: 'meteorShower' });
  });

  it('puts shooting stars in the sky after eight on a meteor shower’s night', () => {
    const [day] = daysOf('meteorShower');
    const { h } = townOn(day, 12);
    expect(h.world.rareEvents.sky()).toBeNull();
    h.clock.set(at(day, 22));
    expect(h.world.rareEvents.sky()).toBe('meteors');
  });
});

describe('the wandering stall (V1 R3)', () => {
  it('stands in town all its week, open for curios, walked up to like any stall', () => {
    const [monday] = daysOf('wanderingStall');
    const { h } = townOn(shiftDay(monday, 3));
    const stall = h.world.townZone.propAt(WANDERING_STALL_AT.tx, WANDERING_STALL_AT.ty);
    expect(stall?.id).toBe('wanderingStall');
    expect(h.world.shops.isOpen('wandering')).toBe(true);
    expect(h.world.shops.stock('wandering')[0]!.offers.length).toBe(5);
    h.world.tapTile(WANDERING_STALL_AT.tx + 1, WANDERING_STALL_AT.ty);
    const events = h.until(() => !h.world.player.moving, 'walking to the stall').concat(h.tick(1));
    expect(events).toContainEqual(
      expect.objectContaining({ kind: 'arrived', at: 'wanderingStall' }),
    );
    // The week after, it's gone.
    h.clock.set(at(shiftDay(monday, 7), 10));
    expect(h.world.shops.isOpen('wandering')).toBe(false);
    expect(h.world.townZone.propAt(WANDERING_STALL_AT.tx, WANDERING_STALL_AT.ty)).toBeUndefined();
  });

  it('deals the same curios all week', () => {
    const [monday] = daysOf('wanderingStall');
    const { h } = townOn(monday);
    const stock = JSON.stringify(h.world.shops.stock('wandering'));
    h.clock.set(at(shiftDay(monday, 6), 20));
    expect(JSON.stringify(h.world.shops.stock('wandering'))).toBe(stock);
  });
});

describe('someone passing through (V1 R3)', () => {
  it('says hello with a little gift once a day, and the wayfarer’s postcard comes after', () => {
    const [day] = daysOf('stranger');
    const { h } = townOn(day);
    const [wayfarer] = h.world.rareEvents.passers('town');
    expect(wayfarer?.id).toBe('wayfarer');
    h.world.tapTile(wayfarer!.tx, wayfarer!.ty);
    const events = h
      .until(() => !h.world.player.moving, 'walking up to the wayfarer')
      .concat(h.tick(1));
    const met = events.find((e) => e.kind === 'metPasser');
    expect(met).toMatchObject({ kind: 'metPasser', who: 'wayfarer' });
    const gift = met?.kind === 'metPasser' ? met.gift : null;
    expect(gift).not.toBeNull();
    expect(h.world.bag.count(gift!)).toBeGreaterThan(0);
    expect(letters(h)).toContain('rare:stranger');
    expect(h.world.rareEvents.meet('wayfarer')).toMatchObject({ gift: null });
  });

  it('has Moira at the shore for her week in July, told the day she comes', () => {
    const h = harness();
    h.clock.set(at('2027-07-12', 10));
    h.world.atlas.find('lanternShore');
    expect(h.world.travel.go('lanternShore')).toBe(true);
    const events = h.tick(3);
    expect(heralds(events)).toContainEqual({ passer: 'moira' });
    expect(h.world.rareEvents.passers('lanternShore').map((p) => p.id)).toEqual(['moira']);
    h.clock.set(at('2027-07-20', 10));
    expect(h.world.rareEvents.passers()).toEqual([]);
  });
});

describe('a critter gone astray (V1 R3)', () => {
  it('is found where it waits, carried home, and thanked for with the rosette the first time', () => {
    const [day] = daysOf('lostCritter');
    const { h } = townOn(day);
    const stray = h.world.rareEvents.stray()!;
    expect(stray).not.toBeNull();
    h.world.atlas.find(stray.zone);
    if (stray.zone !== 'town') expect(h.world.travel.go(stray.zone)).toBe(true);
    h.tick(2);
    h.world.tapTile(stray.tx, stray.ty);
    const events = h.until(() => !h.world.player.moving, 'walking to the stray').concat(h.tick(1));
    expect(events).toContainEqual(
      expect.objectContaining({ kind: 'foundStray', critter: stray.critter }),
    );
    expect(h.world.rareEvents.stray()).toBeNull();
    expect(h.world.rareEvents.carrying()?.owner).toBe(stray.owner);
    // In their talk, a button to give it back.
    const give = talkActions(h.world, stray.owner, () => {}).find((a) =>
      a.label.includes(stray.name),
    );
    expect(give).toBeDefined();
    const candy = h.world.wallet.candy;
    expect(give!.run()).toMatchObject({ lines: [expect.stringContaining('')] });
    expect(h.world.wallet.candy).toBeGreaterThan(candy);
    expect(h.world.rareEvents.carrying()).toBeNull();
    expect(letters(h)).toContain('rare:lostCritter');
    expect(
      talkActions(h.world, stray.owner, () => {}).some((a) => a.label.includes(stray.name)),
    ).toBe(false);
  });
});

describe('the Moon Pie Man and the pop-up (V1 R3)', () => {
  it('are told when they arrive in town, not on a day they were already here', () => {
    const map = parseMap(TOWN);
    const noon = (d: string) => at(d, 12).getTime();
    const days = Array.from({ length: 60 }, (_, i) => shiftDay('2027-03-01', i));
    const arrives = days.find(
      (d) =>
        peddlerSpot(map.peddlerSpots, noon(d)) &&
        !peddlerSpot(map.peddlerSpots, noon(shiftDay(d, -1))),
    )!;
    const stays = days.find(
      (d) =>
        peddlerSpot(map.peddlerSpots, noon(d)) &&
        peddlerSpot(map.peddlerSpots, noon(shiftDay(d, -1))),
    );
    expect(heralds(townOn(arrives).events)).toContainEqual({ shop: 'moonPie' });
    if (stays) expect(heralds(townOn(stays).events)).not.toContainEqual({ shop: 'moonPie' });
  });
});
