import { describe, expect, it } from 'vitest';
import { ACTIVITIES, type Game } from '../../src/data/activities';
import { effectOf } from '../../src/data/dishes';
import { ITEM_VALUE } from '../../src/data/shop';
import { dayKey } from '../../src/systems/clock';
import { snackOn } from '../../src/systems/gathering';
import { harness, type Harness } from './harness';

const RING_TOSS = (ACTIVITIES.ringToss.does as Game).game;

/** Walks her somewhere, and lets the moments of getting there come out. */
function walkTo(h: Harness, tx: number, ty: number) {
  expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(2));
}

/** Down through the park's gate to the fairground, once she has met Boothoven. */
function toTheFair(h: Harness) {
  h.world.friends.update('boothoven', { points: 100 });
  h.tick(1);
  walkTo(h, 35, 49);
  expect(h.world.scene).toBe('fairground');
}

describe("the fairground's games (0.2's M2)", () => {
  it('opens a stall she walks up to', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 5, 14));
    toTheFair(h);
    const stall = h.world.zones.map('fairground').map.props.find((p) => p.id === 'ringTossStall')!;
    const events = walkTo(h, stall.tx + 1, stall.ty);
    const arrived = events.find((e) => e.kind === 'arrived' && e.at === 'ringTossStall');
    expect(arrived).toBeDefined();
    expect(h.world.activities.at(arrived as { at?: 'ringTossStall' })).toBe('ringToss');
  });

  it('plays a go of three throws, paid for as it ends, with a prize however it went', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 14, 14));
    h.world.wallet.earn(100);
    const candy = h.world.wallet.candy;
    const round = h.world.activities.start('ringToss')!;
    expect(round.throws).toEqual([]);
    expect(round.glint).not.toBeNull();
    // A throw or two and nothing is paid yet; a go left off goes on where it was.
    h.world.activities.toss('ringToss', round.glint!);
    expect(h.world.wallet.candy).toBe(candy);
    expect(h.world.activities.round('ringToss')!.throws).toHaveLength(1);
    expect(h.world.activities.start('ringToss')!.throws).toHaveLength(1);
    let won = null;
    for (let t = 1; t < RING_TOSS.throws; t++) {
      const glint = h.world.activities.round('ringToss')!.glint!;
      won = h.world.activities.toss('ringToss', glint)!.won;
    }
    // Every throw at the glinting bottle: the rosette.
    expect(won).toMatchObject({ item: 'ringTossRosette', landed: 3, top: true });
    expect(h.world.wallet.candy).toBe(candy - ACTIVITIES.ringToss.cost);
    expect(h.world.bag.count('ringTossRosette')).toBe(1);
    expect(h.world.activities.round('ringToss')).toBeNull();
    const moments = h.tick(1);
    expect(moments.filter((m) => m.kind === 'tossed')).toHaveLength(3);
    expect(moments).toContainEqual(
      expect.objectContaining({ kind: 'won', activity: 'ringToss', top: true }),
    );
  });

  it("won't start a go while it's shut, or without the Candy", () => {
    const h = harness();
    // A Monday morning in September: ring toss opens in the afternoon.
    h.clock.set(new Date(2026, 8, 14, 9));
    h.world.wallet.earn(100);
    expect(h.world.activities.isOpen('ringToss')).toBe(false);
    expect(h.world.activities.start('ringToss')).toBeNull();
    expect(h.world.activities.closed('ringToss')).toMatch(/afternoon/);
    h.clock.set(new Date(2026, 8, 14, 14));
    h.world.wallet.spend(h.world.wallet.candy);
    expect(h.world.activities.start('ringToss')).toBeNull();
  });
});

describe("the fortune tent (0.2's M2)", () => {
  it('reads her fortune once a day for a little Candy, then again for free', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 14, 10));
    h.world.wallet.earn(100);
    const candy = h.world.wallet.candy;
    expect(h.world.activities.readToday).toBe(false);
    const reading = h.world.activities.readFortune()!;
    expect(reading.line.length).toBeGreaterThan(0);
    expect(reading.lucky?.line).toMatch(/Lucky critter: a .+, .+, in .+\./);
    expect(h.world.wallet.candy).toBe(candy - ACTIVITIES.fortune.cost);
    expect(h.world.activities.readToday).toBe(true);
    expect(h.world.activities.readFortune()!.line).toBe(reading.line);
    expect(h.world.wallet.candy).toBe(candy - ACTIVITIES.fortune.cost);
    // Tomorrow, a new one, paid for again.
    h.clock.set(new Date(2026, 8, 15, 10));
    expect(h.world.activities.readToday).toBe(false);
  });

  it("is read in Agatha's voice while she's behind the ball", () => {
    const h = harness();
    // A Saturday afternoon: Agatha reads fortunes in her tent.
    h.clock.set(new Date(2026, 8, 19, 13, 30));
    h.world.wallet.earn(100);
    h.tick(2);
    h.until(
      () => h.world.neighbourhood.neighbour('agatha').zone === 'fortuneTent',
      'Agatha goes to her tent',
      180_000,
    );
    const reading = h.world.activities.readFortune()!;
    expect(reading.reader).toBe('agatha');
    expect(reading.opening).toMatch(/Agatha/);
    expect(reading.opening).not.toContain('{name}');
    // A weekday morning she's elsewhere, and the ball reads by itself.
    h.clock.set(new Date(2026, 8, 21, 10));
    h.tick(2);
    expect(h.world.activities.readFortune()!.reader).toBe('ball');
  });

  it('opens at the fortune table', () => {
    const h = harness();
    toTheFair(h);
    const tent = h.world.zones.map('fairground').map.props.find((p) => p.id === 'fortuneTent')!;
    walkTo(h, tent.tx + 1, tent.ty + 1);
    expect(h.world.scene).toBe('fortuneTent');
    const table = h.world.zones
      .room('fortuneTent')
      .things.find((t) => 'fixture' in t && t.fixture.id === 'fortuneTable')!;
    if (!('fixture' in table)) throw new Error('no fortune table');
    const events = walkTo(h, table.fixture.tx, table.fixture.ty);
    const arrived = events.find((e) => e.kind === 'arrived' && e.fixture === 'fortuneTable');
    expect(arrived).toMatchObject({ opens: { activity: 'fortune' } });
    expect(h.world.activities.at(arrived as { fixture?: 'fortuneTable' })).toBe('fortune');
  });
});

describe("the snack stalls (0.2's M2)", () => {
  it("sells corn dogs, fried pickles, vinegar fries and tonight's snack, for a spring in her step", () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 14, 10));
    h.world.wallet.earn(200);
    const menu = h.world.activities.menu('cornDogs');
    const items = menu.map((s) => s.item);
    expect(items).toEqual(expect.arrayContaining(['cornDog', 'friedPickles', 'vinegarFries']));
    expect(items).toContain(snackOn(dayKey(h.clock.now())));
    for (const { item, price } of menu) expect(price).toBe(ITEM_VALUE[item] * 2);
    const candy = h.world.wallet.candy;
    expect(h.world.activities.buy('cornDogs', 'friedPickles')).toBe(true);
    expect(h.world.bag.count('friedPickles')).toBe(1);
    expect(h.world.wallet.candy).toBe(candy - ITEM_VALUE.friedPickles * 2);
    expect(effectOf('friedPickles')).toBe('pep');
    expect(effectOf('vinegarFries')).toBe('pep');
    expect(h.world.activities.buy('cornDogs', 'toffeeApple')).toBe(false);
    expect(h.tick(1)).toContainEqual(
      expect.objectContaining({ kind: 'snackBought', item: 'friedPickles' }),
    );
  });

  it("sells nothing while it's shut, or to an empty purse", () => {
    const h = harness();
    // Toffee apples are afternoons and evenings, outside the festival.
    h.clock.set(new Date(2026, 8, 14, 10));
    h.world.wallet.earn(200);
    expect(h.world.activities.buy('toffeeApples', 'toffeeApple')).toBe(false);
    h.clock.set(new Date(2026, 8, 14, 14));
    expect(h.world.activities.buy('toffeeApples', 'toffeeApple')).toBe(true);
    h.world.wallet.spend(h.world.wallet.candy);
    expect(h.world.activities.buy('toffeeApples', 'toffeeApple')).toBe(false);
  });
});
