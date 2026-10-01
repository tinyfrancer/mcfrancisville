import { describe, expect, it } from 'vitest';
import { HAPPENINGS } from '../../src/data/happenings';
import { doorStep } from '../../src/data/maps';
import { VILLAGERS } from '../../src/data/villagers';
import { fill } from '../../src/systems/friendship';
import { happensOn } from '../../src/systems/happenings';
import { lotOf } from '../../src/systems/newcomers';
import { fromSave, World } from '../../src/world/World';
import { harness } from './harness';

const DAY = 86_400_000;

describe('Boothoven (0.2 L1)', () => {
  it('writes first, moves in the next day, and has his welcome party the evening after', () => {
    const h = harness();
    h.tick(1);
    expect(h.world.save().newcomers.heard).toEqual({ boothoven: '2026-09-26' });

    // Two days on, his letter comes, and his lot is sold.
    h.clock.advance(2 * DAY);
    h.tick(2);
    const letter = h.world.mailbox.view().find((m) => m.id === 'boothoven:0');
    expect(letter?.from).toBe('boothoven');
    const lot = lotOf('boothoven')!;
    const step = doorStep(lot.house);
    expect(lot.zone).toBe('town');
    expect(h.world.townZone.propAt(step.tx, step.ty - 1)?.id).toBe('soldSign');

    // Moving day: his house is up and he's at his door among his boxes.
    h.clock.advance(DAY);
    const moving = h.tick(2);
    expect(moving).toContainEqual({ kind: 'movedIn', villager: 'boothoven' });
    expect(h.world.townZone.propAt(lot.house.tx, lot.house.ty)?.id).toBe('boothovenHouse');
    const first = h.world.neighbourhood.talk('boothoven');
    expect(first.line).toBe(fill(VILLAGERS.boothoven.newcomer!.unpacking, { name: h.world.name }));
    expect(happensOn('welcomeParty', '2026-09-29')).toBe(false);

    // The evening after, the town gathers round the well to welcome him.
    expect(happensOn('welcomeParty', '2026-09-30')).toBe(true);
    h.clock.set(new Date(2026, 8, 30, 19));
    h.tick(2);
    expect(h.world.neighbourhood.happeningIn('town')).toBe('welcomeParty');
    const party = h.world.neighbourhood.talk('maude');
    expect(party.line).toBe(fill(HAPPENINGS.welcomeParty.says.maude!, { name: h.world.name }));
    expect(happensOn('welcomeParty', '2026-10-01')).toBe(false);

    // And his house is his to visit from then on, saved and loaded alike.
    const again = new World({ ...fromSave(h.world.save()), clock: h.clock });
    expect(again.newcomers.residents()).toContain('boothoven');
    expect(again.save().newcomers.wrote).toEqual({ boothoven: '2026-09-28' });
  });

  it('is heard of the day an older save first loads, and writes two days after that', () => {
    const h = harness(undefined, { newcomers: { since: '2026-09-01', wrote: {}, heard: {} } });
    h.tick(1);
    expect(h.world.newcomers.moving('boothoven')).toBe('away');
    h.clock.advance(DAY);
    h.tick(2);
    expect(h.world.mailbox.view().some((m) => m.id === 'boothoven:0')).toBe(false);
    h.clock.advance(DAY);
    h.tick(2);
    expect(h.world.mailbox.view().some((m) => m.id === 'boothoven:0')).toBe(true);
    // Ollie, a month on from 1 September, still writes when he would have.
    expect(h.world.save().newcomers.since).toBe('2026-09-01');
  });
});
