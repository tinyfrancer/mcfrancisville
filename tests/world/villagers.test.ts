import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { VILLAGERS } from '../../src/data/villagers';
import { dayKey, windowKey } from '../../src/systems/clock';
import { tileOf, World } from '../../src/world/World';
import { FakeClock } from '../../src/systems/clock';
import { favourOf, fill, PUFF_MS, specialDayOf } from '../../src/systems/friendship';
import { SMALL_TALK } from '../../src/data/smallTalk';
import { stormOn, weatherOn } from '../../src/systems/weather';
import { stopOf, visitsOn } from '../../src/systems/schedules';
import { happeningsAt } from '../../src/systems/happenings';
import { smallEventOf } from '../../src/systems/smallEvents';
import { LOST } from '../../src/data/smallEvents';
import { DEFAULT_LOOK } from '../../src/data/outfits';
import { peddlerSpot } from '../../src/systems/shop';
import type { VillagerId } from '../../src/types/ids';
import { ROCK_MS } from '../../src/systems/poses';
import { harness, type Harness } from './harness';

/** Taps a villager and walks up to them. */
/**
 * The first visit from a Saturday in September that `wanted` picks, and halfway through its first
 * hour, when the guest has had time to get there. Not on a happening's evening, which comes first.
 */
function firstVisit(
  wanted: (v: ReturnType<typeof visitsOn>[number], day: string) => boolean,
): [Date, ReturnType<typeof visitsOn>[number]] {
  for (let d = 0; d < 60; d++) {
    const day = new Date(2026, 8, 26 + d, 12);
    const key = dayKey(day.getTime());
    if (specialDayOf(key)) continue;
    for (const v of visitsOn(key)) {
      if (!wanted(v, key)) continue;
      const at = new Date(2026, 8, 26 + d, v.from, 30);
      if (happeningsAt(v.from, key).length === 0) return [at, v];
    }
  }
  throw new Error('no visit found');
}

function walkUpTo(h: Harness, id: VillagerId) {
  const n = h.world.neighbourhood.neighbour(id);
  h.world.tapTile(n.tile.tx, n.tile.ty);
  return h.until(() => !h.world.player.moving, `walking up to ${id}`).concat(h.tick(1));
}

describe('villagers', () => {
  it('are out in town at their stop for the hour', () => {
    const { world, clock } = harness();
    const day = dayKey(clock.now());
    for (const n of world.neighbourhood.neighbours) {
      const { zone, ...tile } = stopOf(n.id, 12, day);
      expect(n.zone).toBe(zone);
      expect(n.tile).toEqual(tile);
    }
  });

  it('walk to their next stop when the hour turns', () => {
    const h = harness();
    const day = dayKey(h.clock.now());
    const next = VILLAGERS.barty.schedule.weekend.find((s) => s.from > 12)!;
    h.clock.set(new Date(2026, 8, 26, next.from, 1));
    h.tick(1);
    const barty = h.world.neighbourhood.neighbour('barty');
    expect(barty.moving).toBe(true);
    h.until(() => !barty.moving, 'Barty to get there', 120_000);
    const { zone, ...tile } = stopOf('barty', next.from, day);
    expect(barty.zone).toBe(zone);
    expect(barty.tile).toEqual(tile);
  });

  it('go in by the door when their stop is inside, and are in there when she follows', () => {
    const h = harness();
    // Saturday afternoon: Cody flicks through the records at Cobweb Corner.
    h.clock.set(new Date(2026, 8, 26, 15, 1));
    const cody = h.world.neighbourhood.neighbour('cody');
    h.until(() => cody.zone === 'cobwebCorner', 'Cody to go in', 120_000);
    const { zone, ...tile } = stopOf('cody', 15, dayKey(h.clock.now()));
    expect(zone).toBe('cobwebCorner');
    expect(cody.tile).toEqual(tile);
    expect(h.world.neighbourhood.neighboursIn('town').map((n) => n.id)).not.toContain('cody');
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

  it('says something different every talk of the day, until it has said everything', () => {
    const { world } = harness();
    for (const id of ['maude', 'cody', 'hazel'] as const) {
      const said = Array.from({ length: 9 }, () => world.neighbourhood.talk(id))
        .filter((t) => !t.puff)
        .map((t) => t.line);
      expect(new Set(said).size, id).toBe(said.length);
    }
  });

  it("brings up the rain, what she's holding and her pet (0.2's D2)", () => {
    const h = harness();
    let day = new Date(2026, 9, 6, 10);
    // Not a Sunday or a special day, and nothing lost or news of Barty's to tell first.
    const plain = (d: Date) => {
      const event = smallEventOf(windowKey(d.getTime()));
      const his = event.kind === 'news' ? event.news.who : LOST[event.lost].who;
      return d.getDay() !== 0 && !specialDayOf(dayKey(d.getTime())) && his !== 'barty';
    };
    while (weatherOn(dayKey(day.getTime())) !== 'rain' || !plain(day)) {
      day = new Date(day.getTime() + 24 * 3_600_000);
    }
    h.clock.set(day);
    h.world.hands.hold('can');
    const storm = stormOn(dayKey(day.getTime()));
    const talk = () => h.world.neighbourhood.talk('barty').line;
    const said = (lines: readonly string[]) => lines.map((line) => fill(line, { name: 'friend' }));
    const heard = Array.from({ length: 8 }, talk);
    const sky = said(storm ? SMALL_TALK.storm.barty : SMALL_TALK.rain.barty);
    expect(heard.some((line) => sky.includes(line))).toBe(true);
    expect(heard.some((line) => said(SMALL_TALK.can.barty).includes(line))).toBe(true);
    h.world.petCare.walkWith('fibi');
    const pet = said(SMALL_TALK.pet.barty.map((line) => line.replaceAll('{pet}', 'Fibi')));
    expect([talk(), talk()].some((line) => pet.includes(line))).toBe(true);
  });

  it('uses her name, and Cody calls her babe, among his names for her', () => {
    const { world } = harness(undefined, {
      closet: { look: { ...DEFAULT_LOOK, name: 'Em' } },
    });
    const said = Array.from({ length: 8 }, () => world.neighbourhood.talk('maude').line).join(' ');
    expect(said).not.toContain('{name}');
    expect(said).toContain('Em');
    const cody = Array.from({ length: 12 }, () => world.neighbourhood.talk('cody').line).join(' ');
    expect(cody).toMatch(/babe/);
    expect(cody).toMatch(/honey bunny|mi amor|booby/);
  });

  it('now and then catches Cody letting one go', () => {
    const { world } = harness();
    const talks = Array.from({ length: 24 }, () => world.neighbourhood.talk('cody'));
    expect(talks[0]!.puff).toBe(false);
    const puffs = talks.filter((t) => t.puff);
    expect(puffs.length).toBeGreaterThan(0);
    expect(puffs[0]!.line).toMatch(/pfft/);
  });

  it('catches anyone else letting one go only now and then, in their own words', () => {
    const { world } = harness();
    let all = 0;
    for (const id of ['maude', 'rufus', 'wrapunzel', 'agatha', 'barty'] as const) {
      const talks = Array.from({ length: 60 }, () => world.neighbourhood.talk(id));
      const puffs = talks.filter((t) => t.puff);
      all += puffs.length;
      expect(talks[0]!.puff, id).toBe(false);
      expect(puffs.length, id).toBeLessThan(talks.filter((t) => !t.puff).length / 3);
      for (const p of puffs) expect(VILLAGERS[id].puffs, id).toContain(p.line);
    }
    expect(all).toBeGreaterThan(0);
  });

  it('draws a puff over whoever let one go, while it hangs about', () => {
    const h = harness();
    const n = h.world.neighbourhood.neighbour('cody');
    let talks = 0;
    while (!h.world.neighbourhood.talk('cody').puff) talks++;
    expect(talks).toBeLessThan(40);
    expect(h.world.neighbourhood.puffing(n.zone).map((p) => p.id)).toContain('cody');
    h.clock.advance(PUFF_MS * 3);
    const still = h.world.neighbourhood.puffing(n.zone).map((p) => p.id);
    // Unless he happens to let another go on his own just then.
    expect(still.length).toBeLessThanOrEqual(1);
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
    const letter = h.world.mailbox.view().find((m) => m.id === 'anniversary:2027')!;
    expect(letter.text).toMatch(/I love you to the moon and back\./);
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

describe('neighbours with lives', () => {
  /** Walks her to a tile and lets her arrive. */
  function walkTo(h: Harness, tx: number, ty: number) {
    expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
    return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(2));
  }

  /** Walks her up to a building in town, and in. */
  function goIn(h: Harness, building: string) {
    const prop = h.world.map.props.find((p) => p.id === building)!;
    return walkTo(h, prop.tx, prop.ty);
  }

  /** Lets the town settle into the hour: everyone where they're going. */
  function settle(h: Harness) {
    h.tick(2);
    h.until(
      () => h.world.neighbourhood.neighbours.every((n) => !n.moving),
      'everyone to get where they are going',
      180_000,
    );
    h.tick(2);
  }

  it('never stand on one tile, guests and all, through a week of visits', () => {
    for (let date = 26; date < 33; date++) {
      for (const hour of [10, 15, 20]) {
        const world = new World({ clock: new FakeClock(new Date(2026, 8, date, hour)) });
        const spots = world.neighbourhood.neighbours.map(
          (n) => `${n.zone} ${n.tile.tx},${n.tile.ty}`,
        );
        expect(new Set(spots).size, `${date} ${hour}:00 ${spots.join(' / ')}`).toBe(spots.length);
      }
    }
  });

  it('are found indoors, and talked to there as out', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 26, 15, 1));
    settle(h);
    goIn(h, 'shopHouse');
    expect(h.world.scene).toBe('cobwebCorner');
    expect(h.world.neighbourhood.neighboursIn('cobwebCorner').map((n) => n.id)).toEqual(['cody']);
    const events = walkUpTo(h, 'cody');
    expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', villager: 'cody' }));
    expect(h.world.neighbourhood.talkingTo).toBe('cody');
  });

  it('visit each other, standing beside their host and turned to them', () => {
    const h = harness();
    // In town, where she is: a neighbour turns to their host only where she can see them.
    const [at, visit] = firstVisit(
      (v, day) => v.host !== 'her' && stopOf(v.host, v.from, day).zone === 'town',
    );
    h.clock.set(at);
    settle(h);
    const guest = h.world.neighbourhood.neighbour(visit.guest);
    const host = h.world.neighbourhood.neighbour(visit.host as VillagerId);
    expect(guest.zone).toBe(host.zone);
    const [g, o] = [guest.tile, host.tile];
    expect(Math.max(Math.abs(g.tx - o.tx), Math.abs(g.ty - o.ty))).toBe(1);
    // Side by side, facing each other.
    if (g.ty === o.ty) expect(guest.facing).toBe(g.tx < o.tx ? 'right' : 'left');
  });

  it('pop round to hers, waiting just inside the door, and say so first', () => {
    const h = harness();
    const [at, visit] = firstVisit((v) => v.host === 'her');
    h.clock.set(at);
    settle(h);
    const id = visit.guest;
    const guest = h.world.neighbourhood.neighbour(id);
    expect(guest.zone).toBe('home');
    goIn(h, 'homeHouse');
    expect(h.world.scene).toBe('home');
    const mat = h.world.zones.home.entry().tile;
    expect(Math.max(Math.abs(guest.tile.tx - mat.tx), Math.abs(guest.tile.ty - mat.ty))).toBe(1);
    walkUpTo(h, id);
    expect(h.world.neighbourhood.talkingTo).toBe(id);
    const dropsBy = fill(VILLAGERS[id].dropsBy, { name: h.world.name });
    expect(h.world.neighbourhood.talk(id).line).toBe(dropsBy);
    expect(h.world.neighbourhood.talk(id).line).not.toBe(dropsBy);
    // And off home again once the visit is over.
    h.world.neighbourhood.endTalk();
    h.clock.set(new Date(at.getFullYear(), at.getMonth(), at.getDate(), visit.until, 1));
    h.until(() => guest.zone !== 'home', 'them to go home', 120_000);
  });

  it('gather for their happenings, and say so, and hand her something once', () => {
    const h = harness();
    // A Friday, near midnight: the midnight bake at Crumbs & Curios.
    h.clock.set(new Date(2026, 9, 2, 23, 0));
    settle(h);
    const events = goIn(h, 'bakery');
    expect(events).toContainEqual({ kind: 'entered', scene: 'crumbs', happening: 'midnightBake' });
    const inside = h.world.neighbourhood.neighboursIn('crumbs').map((n) => n.id);
    expect(inside).toEqual(expect.arrayContaining(['wrapunzel', 'rufus']));
    walkUpTo(h, 'wrapunzel');
    const cookies = h.world.bag.count('batWingCookie');
    const first = h.world.neighbourhood.talk('wrapunzel');
    expect(first.line).toContain('midnight bake');
    expect(first.gift).toBe('batWingCookie');
    expect(h.world.bag.count('batWingCookie')).toBe(cookies + 1);
    const again = h.world.neighbourhood.talk('wrapunzel');
    expect(again.gift).toBeUndefined();
    expect(again.line).not.toContain('midnight bake');
    expect(h.world.bag.count('batWingCookie')).toBe(cookies + 1);
  });
});
