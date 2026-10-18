import { describe, expect, it } from 'vitest';
import { ACTIVITIES, type ActivityId, type Game } from '../../src/data/activities';
import { fairTipOn, score } from '../../src/systems/activities';
import { FREE_GO_KEY } from '../../src/world/services/Activities';
import { effectOf } from '../../src/data/dishes';
import { ITEM_VALUE } from '../../src/data/shop';
import { dayKey } from '../../src/systems/clock';
import { snackOn } from '../../src/systems/gathering';
import { harness, type Harness } from './harness';

const RING_TOSS = (ACTIVITIES.ringToss.does as Game).game;

/** Has the day's free go already, so a test's go is paid for. */
function spendFreeGo(h: Harness) {
  h.world.takings.take(FREE_GO_KEY);
}

/** Waits for the moment a tap does best in the go she's on, and taps. */
function tapAtBest(h: Harness, id: ActivityId) {
  h.clock.set(h.world.activities.bestTapAt(id)!);
  return h.world.activities.toss(id);
}

/** Waits for the moment a tap does worst in the next half sweep, and taps. */
function tapAtWorst(h: Harness, id: ActivityId) {
  const next = h.world.activities.round(id)!.next!;
  const from = Math.max(h.clock.now(), next.startedAt ?? h.clock.now());
  let worst = from;
  for (let t = from; t < from + next.pattern.period; t += 10) {
    if (score(next.pattern, t, next.startedAt ?? from).grade === 0) {
      worst = t;
      break;
    }
  }
  h.clock.set(worst);
  return h.world.activities.toss(id);
}

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

  it('plays a go of three throws in time, paid for as it ends, the best for perfect taps', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 14, 14));
    spendFreeGo(h);
    h.world.wallet.earn(100);
    const candy = h.world.wallet.candy;
    const round = h.world.activities.start('ringToss')!;
    expect(round.throws).toEqual([]);
    expect(round.next).not.toBeNull();
    // A throw or two and nothing is paid yet; a go left off goes on where it was.
    tapAtBest(h, 'ringToss');
    expect(h.world.wallet.candy).toBe(candy);
    expect(h.world.activities.round('ringToss')!.throws).toHaveLength(1);
    expect(h.world.activities.start('ringToss')!.throws).toHaveLength(1);
    let won = null;
    for (let t = 1; t < RING_TOSS.throws; t++) won = tapAtBest(h, 'ringToss')!.won;
    // Every ring dropped right over the winking bottle: the rosette.
    expect(won).toMatchObject({ item: 'ringTossRosette', landed: 3, points: 6, top: true });
    expect(h.world.wallet.candy).toBe(candy - ACTIVITIES.ringToss.cost);
    expect(h.world.bag.count('ringTossRosette')).toBe(1);
    expect(h.world.activities.round('ringToss')).toBeNull();
    const moments = h.tick(1);
    expect(moments.filter((m) => m.kind === 'tossed')).toHaveLength(3);
    expect(moments).toContainEqual(
      expect.objectContaining({ kind: 'tossed', activity: 'ringToss', grade: 2 }),
    );
    expect(moments).toContainEqual(
      expect.objectContaining({ kind: 'won', activity: 'ringToss', top: true }),
    );
  });

  it('wins the floor for a go tapped late every time, and never nothing', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 19, 15));
    spendFreeGo(h);
    h.world.wallet.earn(100);
    for (const id of ['ringToss', 'hookAGhost'] as const) {
      const game = (ACTIVITIES[id].does as Game).game;
      const candy = h.world.wallet.candy;
      h.world.activities.start(id);
      let won = null;
      for (let t = 0; t < game.throws; t++) won = tapAtWorst(h, id)!.won;
      expect(won, id).toMatchObject({ item: game.prizes[0], points: 0, rank: 0, top: false });
      expect(h.world.bag.count(game.prizes[0]!)).toBeGreaterThan(0);
      expect(h.world.wallet.candy).toBe(candy - ACTIVITIES[id].cost);
    }
  });

  it('rings the strength bell from a hold let go at the top, and the floor for letting go at once', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 14, 15));
    spendFreeGo(h);
    h.world.wallet.earn(100);
    expect(h.world.activities.start('strengthBell')!.next!.startedAt).toBeNull();
    h.world.activities.hold('strengthBell');
    h.clock.set(h.world.activities.bestTapAt('strengthBell')!);
    const top = h.world.activities.toss('strengthBell')!;
    expect(top.thrown.grade).toBe(2);
    expect(top.won).toMatchObject({ item: 'luckyDuckSquish', top: true });
    h.world.activities.start('strengthBell');
    h.world.activities.hold('strengthBell');
    const bonk = h.world.activities.toss('strengthBell')!;
    expect(bonk.thrown.grade).toBe(0);
    expect(bonk.won).toMatchObject({ item: 'sourGhouls', rank: 0 });
  });

  it('gives the duck she picks at the duck pond, every duck something', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 14, 10));
    spendFreeGo(h);
    h.world.wallet.earn(500);
    const game = (ACTIVITIES.duckPond.does as Game).game;
    const won = new Set<string>();
    for (let go = 0; go < 20; go++) {
      h.world.activities.start('duckPond');
      h.clock.advance(1500);
      const result = h.world.activities.toss('duckPond', (go * 0.137) % 1)!;
      expect(result.won).not.toBeNull();
      expect(result.won!.item).toBe(game.prizes[result.thrown.grade]);
      won.add(result.won!.item);
    }
    expect(won.size).toBeGreaterThan(1);
  });

  it("gives the day's first go at one stall free, and the next one there is paid", () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 19, 19));
    const id = h.world.activities.freeGo();
    expect(h.world.activities.freeToday(id)).toBe(true);
    // Free even with an empty purse.
    h.world.wallet.spend(h.world.wallet.candy);
    const round = h.world.activities.start(id)!;
    expect(round.free).toBe(true);
    const game = (ACTIVITIES[id].does as Game).game;
    let won = null;
    for (let t = 0; t < game.throws; t++) {
      if (game.motion === 'bell') h.world.activities.hold(id);
      h.clock.advance(400);
      won = h.world.activities.toss(id, 0.5)!.won;
    }
    expect(won).toMatchObject({ free: true, candy: 0 });
    expect(h.world.wallet.candy).toBe(0);
    expect(h.world.activities.freeToday(id)).toBe(false);
    expect(h.world.activities.start(id)).toBeNull();
    // Tomorrow, a free go again somewhere.
    h.clock.set(new Date(2026, 8, 20, 19));
    expect(h.world.activities.freeToday(h.world.activities.freeGo())).toBe(true);
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
    spendFreeGo(h);
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

  it("points her to the day's free go now and then, while it's still to be had (V1's R6b)", () => {
    const h = harness();
    let day = 1;
    while (!fairTipOn(`2026-11-${String(day).padStart(2, '0')}`)) day++;
    h.clock.set(new Date(2026, 10, day, 19));
    h.world.wallet.earn(100);
    const free = ACTIVITIES[h.world.activities.freeGo()].name.toLowerCase();
    expect(h.world.activities.readFortune()!.fair).toContain(free);
    h.world.takings.take(FREE_GO_KEY);
    expect(h.world.activities.readFortune()!.fair).toBeNull();
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
