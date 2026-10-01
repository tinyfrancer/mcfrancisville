import { describe, expect, it } from 'vitest';
import { doorStep } from '../../src/data/maps';
import { VILLAGERS } from '../../src/data/villagers';
import { fill } from '../../src/systems/friendship';
import { FIRST_NEIGHBOURS, lotOf, unpackingAt } from '../../src/systems/newcomers';
import { fromSave, World, type WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

const DAY = 86_400_000;

/** A day on, and the world stepped a little so it notices. */
function nextDay(h: Harness, days = 1): WorldEvent[] {
  h.clock.advance(days * DAY);
  return h.tick(2);
}

describe('newcomers', () => {
  it('are not in town on her first day, and their lots say "coming soon"', () => {
    const h = harness();
    h.tick(1);
    expect(h.world.newcomers.residents()).toEqual(FIRST_NEIGHBOURS);
    expect(h.world.neighbourhood.neighbours.map((n) => n.id)).toEqual(FIRST_NEIGHBOURS);
    const lot = lotOf('ollie')!;
    const step = doorStep(lot.house);
    expect(h.world.townZone.propAt(step.tx, step.ty - 1)?.id).toBe('lotSign');
    expect(h.world.townZone.propAt(lot.house.tx, lot.house.ty)).toBeUndefined();
  });

  it('are never talked of before they move in, by anyone, at any closeness or hour', () => {
    const h = harness();
    h.tick(1);
    const newcomers = ['ollie', 'nessa', 'gourdon', 'hazel'] as const;
    const named = new RegExp(`\\b(${newcomers.map((id) => VILLAGERS[id].name).join('|')})\\b`);
    for (const id of FIRST_NEIGHBOURS) {
      for (const points of [0, 400, 1000]) {
        h.world.friends.update(id, { points });
        for (const hour of [9, 15, 22]) {
          h.clock.set(new Date(2026, 9, 6 + hour, hour));
          for (let i = 0; i < 16; i++) {
            const { line } = h.world.neighbourhood.talk(id);
            expect(line, `${id} at ${points} points, ${hour}h`).not.toMatch(named);
          }
        }
      }
    }
  });

  it('write a month after her first day, move in the next, and settle in after that', () => {
    const h = harness();
    h.tick(1);
    nextDay(h, 29);
    expect(h.world.mailbox.view()).toHaveLength(0);
    nextDay(h);
    const letter = h.world.mailbox.view().find((m) => m.id === 'ollie:0');
    expect(letter?.from).toBe('ollie');
    const lot = lotOf('ollie')!;
    const step = doorStep(lot.house);
    expect(h.world.townZone.propAt(step.tx, step.ty - 1)?.id).toBe('soldSign');
    expect(h.world.neighbourhood.neighbours.some((n) => n.id === 'ollie')).toBe(false);

    // Moving day: his house is up, his boxes are out, and he's beside the door.
    const moving = nextDay(h);
    expect(moving).toContainEqual({ kind: 'movedIn', villager: 'ollie' });
    expect(h.world.townZone.propAt(lot.house.tx, lot.house.ty)?.id).toBe('ollieHouse');
    expect(h.world.townZone.propAt(step.tx + 1, step.ty)?.id).toBe('movingBoxes');
    expect(h.world.townZone.canWalk(step.tx, step.ty)).toBe(true);
    const ollie = h.world.neighbourhood.neighbour('ollie');
    expect(h.world.neighbourhood.neighbours).toContain(ollie);
    expect(ollie.zone).toBe('town');
    expect(ollie.tile).toEqual(unpackingAt(lot));
    const first = h.world.neighbourhood.talk('ollie');
    expect(first.line).toBe(fill(VILLAGERS.ollie.newcomer!.unpacking, { name: '' }));
    expect(h.world.neighbourhood.talk('ollie').line).not.toBe(first.line);

    // The day after, the boxes are unpacked and he keeps his hours like everyone else.
    nextDay(h);
    expect(h.world.townZone.propAt(step.tx + 1, step.ty)).toBeUndefined();
    expect(h.world.newcomers.moving('ollie')).toBe('settled');
    expect(h.world.save().newcomers.wrote).toEqual({ ollie: '2026-10-26' });
  });

  it('have their houses to go into once they live here, and back out onto the step', () => {
    const h = harness(undefined, {
      newcomers: { since: '2026-09-01', wrote: { ollie: '2026-09-01' } },
    });
    h.tick(1);
    const house = lotOf('ollie')!.house;
    expect(h.world.tapTile(house.tx, house.ty)).toBe(true);
    const events = h.until(() => h.world.scene === 'ollieCottage', 'going in to Ollie');
    expect(events).toContainEqual({ kind: 'entered', scene: 'ollieCottage' });
    const { mat } = h.world.zones.room('ollieCottage').room;
    h.world.tapTile(mat.tx, mat.ty - 1);
    h.until(() => !h.world.player.moving, 'a step in');
    h.world.tapTile(mat.tx, mat.ty);
    h.until(() => h.world.scene === 'town', 'going back out');
    expect(h.world.movement.tile).toEqual(doorStep(house));
  });

  it('come back as they were from a save, and only the ones who have written', () => {
    const h = harness(undefined, {
      newcomers: { since: '2026-09-01', wrote: { nessa: '2026-09-01', maude: '2026-09-01' } },
    });
    h.tick(1);
    expect(h.world.newcomers.residents()).toEqual([...FIRST_NEIGHBOURS, 'nessa']);
    const saved = h.world.save();
    expect(saved.newcomers).toEqual({ since: '2026-09-01', wrote: { nessa: '2026-09-01' } });
    const again = new World({ ...fromSave(saved), clock: h.clock });
    expect(again.newcomers.residents()).toContain('nessa');
    // A Saturday noon: she's come into town to look at the fountain.
    expect(again.neighbourhood.neighboursIn('town').map((n) => n.id)).toContain('nessa');
  });
});
