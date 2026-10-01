import { describe, expect, it } from 'vitest';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { BIRTHDAYS, birthdayOf, isBirthday } from '../../src/data/birthdays';
import { harness } from './harness';

describe("the neighbours sheet's world (0.2's U3)", () => {
  it('says where each neighbour is, everyone in town', () => {
    const h = harness();
    h.tick(1);
    for (const n of h.world.neighbourhood.neighbours) {
      expect(h.world.neighbourhood.whereIs(n.id)?.zone).toBe(n.zone);
    }
    expect(h.world.neighbourhood.neighbours).toHaveLength(VILLAGER_IDS.length);
  });

  it('names a happening they are at', () => {
    const h = harness();
    // A Wednesday evening: book club in Maude's library.
    h.clock.set(new Date(2026, 8, 30, 19, 30));
    const maude = h.world.neighbourhood.neighbour('maude');
    h.tick(1);
    // On her way across town she's only out in town.
    if (maude.zone !== 'library') {
      expect(h.world.neighbourhood.whereIs('maude')).toEqual({ zone: maude.zone, doing: null });
    }
    h.until(() => maude.zone === 'library', 'Maude to go in', 120_000);
    expect(h.world.neighbourhood.whereIs('maude')).toEqual({
      zone: 'library',
      doing: { happening: 'bookClub' },
    });
  });

  it('says her birthday party, on her birthday', () => {
    const h = harness();
    h.clock.set(new Date(2027, 3, 9, 15));
    h.tick(1);
    expect(h.world.neighbourhood.whereIs('rufus')?.doing).toEqual({ party: true });
  });

  it('walks her up to a neighbour who is where she is, and they talk', () => {
    const h = harness();
    h.tick(1);
    const rufus = h.world.neighbourhood.neighbour('rufus');
    expect(rufus.zone).toBe('town');
    expect(h.world.seek('rufus')).toBe(true);
    const events = h.until(() => !h.world.player.moving, 'walking up to Rufus').concat(h.tick(1));
    expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', villager: 'rufus' }));
  });

  it("never hops her to one who isn't where she is", () => {
    const h = harness();
    // Saturday afternoon: Cody is in at Cobweb Corner.
    h.clock.set(new Date(2026, 8, 26, 15, 1));
    const cody = h.world.neighbourhood.neighbour('cody');
    h.until(() => cody.zone === 'cobwebCorner', 'Cody to go in', 120_000);
    const before = { ...h.world.player };
    expect(h.world.seek('cody')).toBe(false);
    const away = h.world.neighbourhood.neighbours.filter((n) => n.zone !== 'town');
    expect(away.length).toBeGreaterThan(1);
    for (const n of away) expect(h.world.seek(n.id), n.id).toBe(false);
    expect(h.world.scene).toBe('town');
    expect(h.world.player.x).toBe(before.x);
    expect(h.world.player.y).toBe(before.y);
  });
});

describe('birthdays', () => {
  it('are a real day for everyone but Cody, who keeps his to himself', () => {
    for (const id of VILLAGER_IDS) {
      const birthday = BIRTHDAYS[id];
      if (id === 'cody') {
        expect(typeof birthday).toBe('object');
        continue;
      }
      expect(birthday).toMatch(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
      expect(birthdayOf(id)).toMatch(/^\d{1,2} [A-Z][a-z]+$/);
    }
    expect(birthdayOf('maude')).toBe('2 November');
    expect(isBirthday('gourdon', '2026-10-26')).toBe(true);
    expect(isBirthday('gourdon', '2026-10-27')).toBe(false);
    expect(isBirthday('cody', '2026-10-26')).toBe(false);
  });

  it("aren't on one of her own special days", () => {
    const taken = ['04-08', '04-09'];
    for (const id of VILLAGER_IDS) expect(taken).not.toContain(BIRTHDAYS[id]);
  });
});
