import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { VILLAGERS } from '../../src/data/villagers';
import { dayKey } from '../../src/systems/clock';
import { tileOf } from '../../src/world/World';
import { favourOf, stopOf } from '../../src/systems/friendship';
import { DEFAULT_LOOK } from '../../src/data/outfits';
import { peddlerSpot } from '../../src/systems/shop';
import type { VillagerId } from '../../src/types/ids';
import { ROCK_MS } from '../../src/systems/poses';
import { harness, type Harness } from './harness';

/** Taps a villager and walks up to them. */
function walkUpTo(h: Harness, id: VillagerId) {
  const n = h.world.neighbourhood.neighbour(id);
  h.world.tapTile(n.tile.tx, n.tile.ty);
  return h.until(() => !h.world.player.moving, `walking up to ${id}`).concat(h.tick(1));
}

describe('villagers', () => {
  it('are out in town at their stop for the hour', () => {
    const { world, clock } = harness();
    const day = dayKey(clock.now());
    for (const n of world.neighbourhood.neighbours) expect(n.tile).toEqual(stopOf(n.id, 12, day));
  });

  it('walk to their next stop when the hour turns', () => {
    const h = harness();
    const day = dayKey(h.clock.now());
    const next = VILLAGERS.cody.schedule.find((s) => s.from > 12)!;
    h.clock.set(new Date(2026, 8, 26, next.from, 1));
    h.tick(1);
    expect(h.world.neighbourhood.neighbour('cody').moving).toBe(true);
    h.until(() => !h.world.neighbourhood.neighbour('cody').moving, 'Cody to get there', 120_000);
    expect(h.world.neighbourhood.neighbour('cody').tile).toEqual(stopOf('cody', next.from, day));
  });

  it('stop and talk when she walks up to one', () => {
    const h = harness();
    const events = walkUpTo(h, 'rufus');
    expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', villager: 'rufus' }));
    expect(h.world.neighbourhood.talkingTo).toBe('rufus');
    const r = h.world.neighbourhood.neighbour('rufus').tile;
    const me = tileOf(h.world.player.x, h.world.player.y);
    expect(Math.max(Math.abs(r.tx - me.tx), Math.abs(r.ty - me.ty))).toBeLessThanOrEqual(1);
  });

  it('wait for her while she talks, and go on their way once she is done', () => {
    const h = harness();
    walkUpTo(h, 'barty');
    const where = h.world.neighbourhood.neighbour('barty').tile;
    h.clock.set(new Date(2026, 8, 26, 16, 5));
    h.tick(200);
    expect(h.world.neighbourhood.neighbour('barty').tile).toEqual(where);
    h.world.neighbourhood.endTalk();
    h.tick(2);
    expect(h.world.neighbourhood.neighbour('barty').moving).toBe(true);
  });

  it('live only in the town, not on a test map', () => {
    expect(
      harness({ rows: ['...'], legend: TOWN.legend, spawn: { tx: 0, ty: 0 } }).world.neighbourhood
        .neighbours,
    ).toHaveLength(0);
  });
});

describe('talking', () => {
  it('counts once a day, and says something new each time', () => {
    const { world, clock } = harness();
    const first = world.neighbourhood.talk('maude');
    const second = world.neighbourhood.talk('maude');
    expect(first.bonus).toBe(true);
    expect(second.bonus).toBe(false);
    expect(second.line).not.toBe(first.line);
    expect(world.friends.of('maude').points).toBe(10);
    clock.advance(24 * 3_600_000);
    expect(world.neighbourhood.talk('maude').bonus).toBe(true);
    expect(world.friends.of('maude').points).toBe(20);
  });

  it('uses her name, and Cody calls her babe', () => {
    const { world } = harness(undefined, {
      closet: { look: { ...DEFAULT_LOOK, name: 'Em' } },
    });
    const said = Array.from({ length: 8 }, () => world.neighbourhood.talk('maude').line).join(' ');
    expect(said).not.toContain('{name}');
    expect(said).toContain('Em');
    const cody = Array.from({ length: 12 }, () => world.neighbourhood.talk('cody').line).join(' ');
    expect(cody).toMatch(/babe/);
  });

  it('now and then catches Cody letting one go', () => {
    const { world } = harness();
    const talks = Array.from({ length: 24 }, () => world.neighbourhood.talk('cody'));
    expect(talks[0]!.puff).toBe(false);
    const puffs = talks.filter((t) => t.puff);
    expect(puffs.length).toBeGreaterThan(0);
    expect(puffs[0]!.line).toMatch(/pfft/);
    expect(world.neighbourhood.puffing()).toBe(talks.at(-1)!.puff || world.neighbourhood.puffing());
  });
});

describe('gifts', () => {
  it('take it from her bag, and a loved one counts for most', () => {
    const { world } = harness(undefined, { finds: { bag: [{ id: 'burritoBowl', count: 2 }] } });
    const given = world.neighbourhood.give('cody', 'burritoBowl');
    expect(given).toEqual({
      declined: false,
      reaction: 'loved',
      line: 'chipotle is mah liiiiffeee',
    });
    expect(world.bag.count('burritoBowl')).toBe(1);
    expect(world.friends.of('cody').points).toBe(50);
    // A loved gift gets her rocking out.
    expect(['horns', 'bang']).toContain(world.poses.pose());
  });

  it('are one a day: a second is turned down, and stays in her bag', () => {
    const { world, clock } = harness(undefined, { finds: { bag: [{ id: 'stone', count: 5 }] } });
    world.neighbourhood.give('agatha', 'stone');
    const again = world.neighbourhood.give('agatha', 'stone');
    expect(again?.declined).toBe(true);
    expect(world.bag.count('stone')).toBe(4);
    clock.advance(24 * 3_600_000);
    expect(world.neighbourhood.give('agatha', 'stone')?.declined).toBe(false);
  });

  it("can't be something she hasn't got", () => {
    expect(harness().world.neighbourhood.give('rufus', 'blueRose')).toBeNull();
  });
});

describe('mail', () => {
  it('brings a letter at three hearts, with a recipe she learns when she opens it', () => {
    const h = harness(undefined, {
      friends: { friends: { maude: { points: 295, talked: null, gifted: null, favour: null } } },
    });
    h.tick(1);
    h.world.neighbourhood.talk('maude');
    expect(h.tick(1)).toContainEqual({ kind: 'mail', from: 'maude' });
    expect(h.world.letters.unread).toBe(1);
    expect(h.world.workbench.knows('moonflowerLamp')).toBe(false);
    const [letter] = h.world.mailbox.view();
    expect(letter!.text).toMatch(/Maude/);
    expect(h.world.mailbox.open(letter!.id)).toBe(true);
    expect(h.world.workbench.knows('moonflowerLamp')).toBe(true);
    expect(h.world.letters.unread).toBe(0);
    expect(h.world.mailbox.open(letter!.id)).toBe(false);
    // Only a letter from Cody gets her rocking out.
    expect(h.world.poses.pose()).toBeNull();
  });

  it('sends each letter once, however far a friendship goes', () => {
    const { world, clock } = harness(undefined, {
      finds: { bag: [{ id: 'loveBracelet', count: 3 }] },
      friends: { friends: { cody: { points: 990, talked: null, gifted: null, favour: null } } },
    });
    world.neighbourhood.give('cody', 'loveBracelet');
    expect(world.mailbox.view().map((m) => m.id)).toEqual(['cody:10']);
    expect(world.friends.of('cody').points).toBe(1000);
    clock.advance(ROCK_MS);
    expect(world.poses.pose()).toBeNull();
    world.mailbox.open('cody:10');
    expect(['horns', 'bang']).toContain(world.poses.pose());
    expect(world.home.stored).toContainEqual({ id: 'codyPortrait', count: 1 });
  });

  it('comes on her birthday from everyone, once, with a cake', () => {
    const h = harness();
    h.clock.set(new Date(2027, 3, 9, 10));
    expect(h.tick(1)).toContainEqual({ kind: 'mail', from: 'everyone' });
    expect(h.tick(10)).not.toContainEqual(expect.objectContaining({ kind: 'mail' }));
    h.world.mailbox.open('birthday:2027');
    expect(h.world.home.stored).toContainEqual({ id: 'birthdayCake', count: 1 });
  });

  it('comes from Cody on their anniversary, with the orbs', () => {
    const h = harness();
    h.clock.set(new Date(2027, 5, 6, 21));
    h.tick(1);
    expect(h.world.mailbox.view()[0]!.text).toMatch(/I love you to the moon and back\./);
    h.world.mailbox.open('anniversary:2027');
    expect(h.world.home.stored).toContainEqual({ id: 'foreverOrbs', count: 1 });
  });
});

describe('favours', () => {
  /** A day on which `id` has a favour to ask, and the harness standing at noon on it. */
  function favourDay(id: VillagerId): Harness {
    for (let i = 0; i < 60; i++) {
      const date = new Date(2026, 8, 26 + i, 12);
      if (favourOf(id, dayKey(date.getTime()))) {
        const h = harness(undefined, { finds: { bag: [{ id: 'wood', count: 20 }] } });
        h.clock.set(date);
        return h;
      }
    }
    throw new Error('no favour in sight');
  }

  it('take what they asked for, and give thanks, Candy and friendship', () => {
    const h = favourDay('barty');
    const favour = h.world.neighbourhood.favour('barty')!;
    h.world.bag.add(favour.item, favour.count);
    const before = h.world.wallet.candy;
    const done = h.world.neighbourhood.doFavour('barty');
    expect(done?.candy).toBeGreaterThan(0);
    expect(h.world.wallet.candy).toBe(before + done!.candy);
    expect(h.world.friends.of('barty').points).toBe(40);
    expect(h.world.neighbourhood.favour('barty')).toBeNull();
    expect(h.world.neighbourhood.doFavour('barty')).toBeNull();
  });

  it("can't be done without enough of what they asked for", () => {
    const h = favourDay('maude');
    const favour = h.world.neighbourhood.favour('maude')!;
    h.world.bag.remove(favour.item, h.world.bag.count(favour.item));
    expect(h.world.neighbourhood.doFavour('maude')).toBeNull();
    expect(h.world.neighbourhood.favour('maude')).toEqual(favour);
  });
});

describe('the Moon Pie Man', () => {
  it('is open on the days his cart is in town, and his cart is solid', () => {
    for (let i = 0; i < 30; i++) {
      const date = new Date(2026, 8, 26 + i, 12);
      const spot = peddlerSpot(TOWN.peddlerSpots!, date.getTime());
      const h = harness();
      h.clock.set(date);
      expect(h.world.shops.isOpen('moonPie')).toBe(spot !== null);
      if (spot) {
        expect(h.world.canWalk(spot.tx, spot.ty)).toBe(false);
        expect(h.world.shops.stock('moonPie')[0]!.offers[0]!.ware).toEqual({ item: 'moonPie' });
      }
    }
  });
});
