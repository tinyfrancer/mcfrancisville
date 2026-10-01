import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS, FAMILIES } from '../../src/data/critters';
import { ITEMS } from '../../src/data/items';
import { MILESTONE_IDS, MILESTONES } from '../../src/data/milestones';
import { letterOf } from '../../src/systems/friendship';
import { seasonOf, shelfOf } from '../../src/systems/milestones';
import type { CritterId, ItemId } from '../../src/types/ids';
import { harness } from './harness';

const DAY = '2026-10-01';
const moths = CRITTER_IDS.filter((id) => CRITTERS[id].family === 'moth');
const caught = (ids: readonly CritterId[]) => Object.fromEntries(ids.map((id) => [id, DAY]));

describe('the shelves to finish (0.2’s F2)', () => {
  it('has a shelf for every family caught and every wing, and every shelf has something on it', () => {
    for (const family of FAMILIES) {
      expect(
        MILESTONE_IDS.some(
          (id) => 'caught' in MILESTONES[id].shelf && MILESTONES[id].shelf.caught === family,
        ),
      ).toBe(true);
      expect(
        MILESTONE_IDS.some(
          (id) => 'wing' in MILESTONES[id].shelf && MILESTONES[id].shelf.wing === family,
        ),
      ).toBe(true);
    }
    for (const id of MILESTONE_IDS) {
      expect(shelfOf(MILESTONES[id].shelf).length, id).toBeGreaterThan(1);
      expect(letterOf(`shelf:${id}`)?.gift, id).toEqual(MILESTONES[id].gift);
    }
    expect(letterOf('shelf:nothing')).toBeNull();
  });

  it('counts a seasonal critter in the season it first comes out, and an all-year one in none', () => {
    expect(seasonOf('pumpkinBat')).toBe('autumn');
    expect(seasonOf('mistNewt')).toBe('winter');
    expect(seasonOf('firefly')).toBe('summer');
    expect(seasonOf('lunaMoth')).toBeNull();
  });

  it('sends the framed luna moth once every moth is caught, and only once', () => {
    const { world } = harness(undefined, { cabinet: { caught: caught(moths.slice(1)) } });
    world.update(16);
    expect(world.mailbox.letters.has('shelf:moths')).toBe(false);
    expect(world.milestones.progress('moths')).toEqual({
      have: moths.length - 1,
      total: moths.length,
      done: false,
    });
    world.cabinet.record(moths[0]!, DAY);
    world.events.emit('cabinet', world.cabinet);
    expect(world.update(16)).toContainEqual({ kind: 'mail', from: 'wrapunzel' });
    expect(world.mailbox.open('shelf:moths')).toBe(true);
    expect(world.home.stored).toContainEqual(expect.objectContaining({ id: 'framedMoth' }));
    world.events.emit('cabinet', world.cabinet);
    expect(world.update(16)).not.toContainEqual(expect.objectContaining({ kind: 'mail' }));
  });

  it('sends a shelf finished before this build the first time she plays it', () => {
    const { world } = harness(undefined, { cabinet: { caught: caught(moths) } });
    world.update(16);
    expect(world.mailbox.letters.has('shelf:moths')).toBe(true);
  });

  it('fills a wing as she donates, and sends its dome when the wing is full', () => {
    const { world } = harness(undefined, { cabinet: { caught: caught(moths) } });
    for (const id of moths) world.bag.add(id, 1);
    for (const id of moths.slice(0, -1)) world.collecting.donate(id);
    world.update(16);
    expect(world.mailbox.letters.has('shelf:mothWing')).toBe(false);
    world.collecting.donate(moths.at(-1)!);
    world.update(16);
    expect(world.mailbox.open('shelf:mothWing')).toBe(true);
    expect(world.home.stored).toContainEqual(expect.objectContaining({ id: 'mothDome' }));
  });

  it('remembers every squishy she has had, even sold, and sends Cody’s shelf for the set', () => {
    const squishies = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === 'squishy');
    const { world } = harness();
    for (const id of squishies.slice(0, -1)) {
      world.bag.add(id, 1);
      world.events.emit('bag', world.bag.contents);
      world.bag.remove(id);
    }
    world.update(16);
    expect(world.milestones.hasHad(squishies[0]!)).toBe(true);
    expect(world.mailbox.letters.has('shelf:squishies')).toBe(false);
    const saved = world.save().collected;
    const again = harness(undefined, { collected: saved }).world;
    again.bag.add(squishies.at(-1)!, 1);
    again.events.emit('bag', again.bag.contents);
    expect(again.update(16)).toContainEqual({ kind: 'mail', from: 'cody' });
    expect(letterOf('shelf:squishies')?.gift).toEqual({ furniture: 'squishyShelf' });
  });

  it('sends a monster doll for a season’s own, and Agatha’s dollhouse for every doll', () => {
    const autumn = CRITTER_IDS.filter((id) => seasonOf(id) === 'autumn');
    const { world } = harness(undefined, { cabinet: { caught: caught(autumn) } });
    world.update(16);
    expect(world.mailbox.open('shelf:autumn')).toBe(true);
    expect(world.bag.count('witchDoll')).toBe(1);
    expect(letterOf('shelf:dolls')?.from).toBe('agatha');
  });
});
