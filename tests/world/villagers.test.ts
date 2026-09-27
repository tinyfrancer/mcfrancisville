import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { VILLAGERS } from '../../src/data/villagers';
import { dayKey } from '../../src/systems/clock';
import { favourOf, stopOf } from '../../src/systems/friendship';
import { DEFAULT_LOOK } from '../../src/data/outfits';
import { peddlerSpot } from '../../src/systems/shop';
import type { VillagerId } from '../../src/types/ids';
import { harness, type Harness } from './harness';

/** Taps a villager and walks up to them. */
function walkUpTo(h: Harness, id: VillagerId) {
  const n = h.town.neighbourhood.neighbour(id);
  h.town.tapTile(n.tile.tx, n.tile.ty);
  return h.until(() => !h.town.player.moving, `walking up to ${id}`).concat(h.tick(1));
}

describe('villagers', () => {
  it('are out in town at their stop for the hour', () => {
    const { town, clock } = harness();
    const day = dayKey(clock.now());
    for (const n of town.neighbourhood.neighbours) expect(n.tile).toEqual(stopOf(n.id, 12, day));
  });

  it('walk to their next stop when the hour turns', () => {
    const h = harness();
    const day = dayKey(h.clock.now());
    const next = VILLAGERS.cody.schedule.find((s) => s.from > 12)!;
    h.clock.set(new Date(2026, 8, 26, next.from, 1));
    h.tick(1);
    expect(h.town.neighbourhood.neighbour('cody').moving).toBe(true);
    h.until(() => !h.town.neighbourhood.neighbour('cody').moving, 'Cody to get there', 120_000);
    expect(h.town.neighbourhood.neighbour('cody').tile).toEqual(stopOf('cody', next.from, day));
  });

  it('stop and talk when she walks up to one', () => {
    const h = harness();
    const events = walkUpTo(h, 'rufus');
    expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', villager: 'rufus' }));
    expect(h.town.neighbourhood.talkingTo).toBe('rufus');
    const r = h.town.neighbourhood.neighbour('rufus').tile;
    const me = { tx: Math.floor(h.town.player.x / 16), ty: Math.floor(h.town.player.y / 16) };
    expect(Math.max(Math.abs(r.tx - me.tx), Math.abs(r.ty - me.ty))).toBeLessThanOrEqual(1);
  });

  it('wait for her while she talks, and go on their way once she is done', () => {
    const h = harness();
    walkUpTo(h, 'barty');
    const where = h.town.neighbourhood.neighbour('barty').tile;
    h.clock.set(new Date(2026, 8, 26, 16, 5));
    h.tick(200);
    expect(h.town.neighbourhood.neighbour('barty').tile).toEqual(where);
    h.town.neighbourhood.endTalk();
    h.tick(2);
    expect(h.town.neighbourhood.neighbour('barty').moving).toBe(true);
  });

  it('live only in the town, not on a test map', () => {
    expect(
      harness({ rows: ['...'], legend: TOWN.legend, spawn: { tx: 0, ty: 0 } }).town.neighbourhood
        .neighbours,
    ).toHaveLength(0);
  });
});

describe('talking', () => {
  it('counts once a day, and says something new each time', () => {
    const { town, clock } = harness();
    const first = town.neighbourhood.talk('maude');
    const second = town.neighbourhood.talk('maude');
    expect(first.bonus).toBe(true);
    expect(second.bonus).toBe(false);
    expect(second.line).not.toBe(first.line);
    expect(town.friends.of('maude').points).toBe(10);
    clock.advance(24 * 3_600_000);
    expect(town.neighbourhood.talk('maude').bonus).toBe(true);
    expect(town.friends.of('maude').points).toBe(20);
  });

  it('uses her name, and Cody calls her babe', () => {
    const { town } = harness(undefined, {
      closet: { look: { ...DEFAULT_LOOK, name: 'Em' } },
    });
    const said = Array.from({ length: 8 }, () => town.neighbourhood.talk('maude').line).join(' ');
    expect(said).not.toContain('{name}');
    expect(said).toContain('Em');
    const cody = Array.from({ length: 12 }, () => town.neighbourhood.talk('cody').line).join(' ');
    expect(cody).toMatch(/babe/);
  });

  it('now and then catches Cody letting one go', () => {
    const { town } = harness();
    const talks = Array.from({ length: 24 }, () => town.neighbourhood.talk('cody'));
    expect(talks[0]!.puff).toBe(false);
    const puffs = talks.filter((t) => t.puff);
    expect(puffs.length).toBeGreaterThan(0);
    expect(puffs[0]!.line).toMatch(/pfft/);
    expect(town.neighbourhood.puffing()).toBe(talks.at(-1)!.puff || town.neighbourhood.puffing());
  });
});

describe('gifts', () => {
  it('take it from her bag, and a loved one counts for most', () => {
    const { town } = harness(undefined, { finds: { bag: [{ id: 'burritoBowl', count: 2 }] } });
    const given = town.neighbourhood.give('cody', 'burritoBowl');
    expect(given).toEqual({
      declined: false,
      reaction: 'loved',
      line: 'chipotle is mah liiiiffeee',
    });
    expect(town.bag.count('burritoBowl')).toBe(1);
    expect(town.friends.of('cody').points).toBe(50);
  });

  it('are one a day: a second is turned down, and stays in her bag', () => {
    const { town, clock } = harness(undefined, { finds: { bag: [{ id: 'stone', count: 5 }] } });
    town.neighbourhood.give('agatha', 'stone');
    const again = town.neighbourhood.give('agatha', 'stone');
    expect(again?.declined).toBe(true);
    expect(town.bag.count('stone')).toBe(4);
    clock.advance(24 * 3_600_000);
    expect(town.neighbourhood.give('agatha', 'stone')?.declined).toBe(false);
  });

  it("can't be something she hasn't got", () => {
    expect(harness().town.neighbourhood.give('rufus', 'blueRose')).toBeNull();
  });
});

describe('mail', () => {
  it('brings a letter at three hearts, with a recipe she learns when she opens it', () => {
    const h = harness(undefined, {
      friends: { friends: { maude: { points: 295, talked: null, gifted: null, favour: null } } },
    });
    h.tick(1);
    h.town.neighbourhood.talk('maude');
    expect(h.tick(1)).toContainEqual({ kind: 'mail', from: 'maude' });
    expect(h.town.letters.unread).toBe(1);
    expect(h.town.workbench.knows('moonflowerLamp')).toBe(false);
    const [letter] = h.town.mailbox.view();
    expect(letter!.text).toMatch(/Maude/);
    expect(h.town.mailbox.open(letter!.id)).toBe(true);
    expect(h.town.workbench.knows('moonflowerLamp')).toBe(true);
    expect(h.town.letters.unread).toBe(0);
    expect(h.town.mailbox.open(letter!.id)).toBe(false);
  });

  it('sends each letter once, however far a friendship goes', () => {
    const { town } = harness(undefined, {
      finds: { bag: [{ id: 'loveBracelet', count: 3 }] },
      friends: { friends: { cody: { points: 990, talked: null, gifted: null, favour: null } } },
    });
    town.neighbourhood.give('cody', 'loveBracelet');
    expect(town.mailbox.view().map((m) => m.id)).toEqual(['cody:10']);
    expect(town.friends.of('cody').points).toBe(1000);
    town.mailbox.open('cody:10');
    expect(town.home.stored).toContainEqual({ id: 'codyPortrait', count: 1 });
  });

  it('comes on her birthday from everyone, once, with a cake', () => {
    const h = harness();
    h.clock.set(new Date(2027, 3, 9, 10));
    expect(h.tick(1)).toContainEqual({ kind: 'mail', from: 'everyone' });
    expect(h.tick(10)).not.toContainEqual(expect.objectContaining({ kind: 'mail' }));
    h.town.mailbox.open('birthday:2027');
    expect(h.town.home.stored).toContainEqual({ id: 'birthdayCake', count: 1 });
  });

  it('comes from Cody on their anniversary, with the orbs', () => {
    const h = harness();
    h.clock.set(new Date(2027, 5, 6, 21));
    h.tick(1);
    expect(h.town.mailbox.view()[0]!.text).toMatch(/I love you to the moon and back\./);
    h.town.mailbox.open('anniversary:2027');
    expect(h.town.home.stored).toContainEqual({ id: 'foreverOrbs', count: 1 });
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
    const favour = h.town.neighbourhood.favour('barty')!;
    h.town.bag.add(favour.item, favour.count);
    const before = h.town.wallet.candy;
    const done = h.town.neighbourhood.doFavour('barty');
    expect(done?.candy).toBeGreaterThan(0);
    expect(h.town.wallet.candy).toBe(before + done!.candy);
    expect(h.town.friends.of('barty').points).toBe(40);
    expect(h.town.neighbourhood.favour('barty')).toBeNull();
    expect(h.town.neighbourhood.doFavour('barty')).toBeNull();
  });

  it("can't be done without enough of what they asked for", () => {
    const h = favourDay('maude');
    const favour = h.town.neighbourhood.favour('maude')!;
    h.town.bag.remove(favour.item, h.town.bag.count(favour.item));
    expect(h.town.neighbourhood.doFavour('maude')).toBeNull();
    expect(h.town.neighbourhood.favour('maude')).toEqual(favour);
  });
});

describe('the Moon Pie Man', () => {
  it('is open on the days his cart is in town, and his cart is solid', () => {
    for (let i = 0; i < 30; i++) {
      const date = new Date(2026, 8, 26 + i, 12);
      const spot = peddlerSpot(TOWN.peddlerSpots!, date.getTime());
      const h = harness();
      h.clock.set(date);
      expect(h.town.shops.isOpen('moonPie')).toBe(spot !== null);
      if (spot) {
        expect(h.town.canWalk(spot.tx, spot.ty)).toBe(false);
        expect(h.town.shops.stock('moonPie')[0]!.offers[0]!.ware).toEqual({ item: 'moonPie' });
      }
    }
  });
});
