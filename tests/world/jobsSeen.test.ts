import { describe, expect, it } from 'vitest';
import { BIRTHDAY_GIFT_TIMES, BIRTHDAY_LINES } from '../../src/data/birthdayParties';
import { HOLIDAY_GIFTS } from '../../src/data/flowerShop';
import { FIXTURES } from '../../src/data/interiors';
import { SHOPS } from '../../src/data/shop';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';
import { WORK_IDS } from '../../src/data/work';
import { GIFT_POINTS, reactionTo } from '../../src/systems/friendship';
import { happeningOf, placeAt } from '../../src/systems/happenings';
import { stockOf } from '../../src/systems/shop';
import { harness, type Harness } from './harness';

function settle(h: Harness) {
  h.tick(2);
  h.until(
    () => h.world.neighbourhood.neighbours.every((n) => !n.moving),
    'everyone to get where they are going',
    180_000,
  );
}

describe("jobs seen (V1's P4)", () => {
  it('has everyone at their job at some stop every day of the week, every job done by someone', () => {
    for (const id of VILLAGER_IDS) {
      const { weekday, weekend } = VILLAGERS[id].schedule;
      expect(
        weekday.some((s) => s.doing),
        `${id} weekday`,
      ).toBe(true);
      expect(
        weekend.some((s) => s.doing),
        `${id} weekend`,
      ).toBe(true);
    }
    const done = new Set(
      VILLAGER_IDS.flatMap((id) =>
        [...VILLAGERS[id].schedule.weekday, ...VILLAGERS[id].schedule.weekend].flatMap((s) =>
          s.doing ? [s.doing] : [],
        ),
      ),
    );
    expect([...done].sort()).toEqual([...WORK_IDS].sort());
  });

  it("opens Rufus's flower buckets as a shop with something in every bucket", () => {
    expect(FIXTURES.flowerBuckets.opens).toEqual({ shop: 'flowers' });
    expect(SHOPS.flowers.shelves.length).toBeGreaterThan(2);
    const stock = stockOf('flowers', '2026-10-17');
    expect(stock.every((shelf) => shelf.offers.length > 0)).toBe(true);
    expect(stock.flatMap((shelf) => shelf.offers).length).toBeGreaterThan(5);
  });

  it('has Nessa lighting the lanterns on the pier at dusk, every day', () => {
    expect(happeningOf('nessa', 18.5, '2026-10-17')).toBe('lanternLighting');
    expect(placeAt('lanternLighting', 'nessa').place.zone).toBe('lanternShore');
    const h = harness(undefined, {
      player: { zone: 'lanternShore', tx: 14, ty: 6, facing: 'down' },
    });
    h.clock.set(new Date(2026, 9, 17, 18, 20));
    settle(h);
    const nessa = h.world.neighbourhood.neighbour('nessa');
    expect(nessa.zone).toBe('lanternShore');
    expect(nessa.working).toBe('lantern');
  });

  it("is Rufus's Valentine's rose, bought back after he sold every one", () => {
    expect(HOLIDAY_GIFTS.valentines?.rufus).toBe('rose');
    const h = harness();
    h.clock.set(new Date(2027, 1, 14, 12));
    h.tick(1);
    const had = h.world.bag.count('rose');
    const chat = h.world.neighbourhood.talk('rufus');
    expect(chat.gift).toBe('rose');
    expect(h.world.bag.count('rose')).toBe(had + 1);
  });
});

describe("birthdays as days (V1's P4)", () => {
  // Gourdon's, on Pumpkin Day.
  const birthday = new Date(2026, 9, 26, 12);

  it('opens their day with their own birthday line', () => {
    const h = harness();
    h.clock.set(birthday);
    h.tick(1);
    const line = h.world.neighbourhood.talk('gourdon').line;
    expect(line).toBe(
      BIRTHDAY_LINES.gourdon.replace('{name}', h.world.wardrobe.look.name || 'friend'),
    );
  });

  it('counts a gift on their birthday double', () => {
    const plain = harness();
    plain.clock.set(new Date(2026, 9, 25, 12));
    const party = harness();
    party.clock.set(birthday);
    for (const h of [plain, party]) {
      h.tick(1);
      h.world.bag.add('wood', 1);
    }
    const before = plain.world.friends.of('gourdon').points;
    plain.world.neighbourhood.give('gourdon', 'wood');
    const given = party.world.neighbourhood.give('gourdon', 'wood')!;
    const points = GIFT_POINTS[reactionTo('gourdon', 'wood')];
    expect(plain.world.friends.of('gourdon').points - before).toBe(points);
    expect(party.world.friends.of('gourdon').points - before).toBe(points * BIRTHDAY_GIFT_TIMES);
    expect(given).toMatchObject({ declined: false, birthday: true });
  });

  it('has a party at theirs from five, two friends round', () => {
    expect(happeningOf('gourdon', 18, '2026-10-26')).toBe('gourdonBirthday');
    expect(happeningOf('hazel', 18, '2026-10-26')).toBe('gourdonBirthday');
    expect(happeningOf('gourdon', 18, '2026-10-27')).toBeNull();
    expect(placeAt('gourdonBirthday', 'gourdon').place.zone).toBe('gourdonPumpkin');
  });
});
