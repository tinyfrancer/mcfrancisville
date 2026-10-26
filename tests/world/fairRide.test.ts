import { describe, expect, it } from 'vitest';
import { RIDE, RIDE_COST, RIDE_LINES, RIDE_MS } from '../../src/data/fairRide';
import { fill } from '../../src/systems/friendship';
import { FREE_RIDE_KEY, TICKET_STUB } from '../../src/world/services/Activities';
import { harness, type Harness } from './harness';

/** Lets the clock run on `ms` and the world step, so moments come out. */
function wait(h: Harness, ms: number) {
  h.clock.set(h.clock.now() + ms);
  return h.tick(1);
}

describe('a ride on the big wheel (1.6 X2)', () => {
  it('goes once round for free the first time today, and gives her a ticket stub', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 16, 15));
    const candy = h.world.wallet.candy;
    expect(h.world.activities.freeRide()).toBe(true);
    const riding = h.world.activities.board()!;
    expect(riding.at.part).toBe('up');
    expect(riding.free).toBe(true);
    wait(h, RIDE.up + 10);
    expect(h.world.activities.riding()!.at.part).toBe('top');
    // Not down till it's round.
    expect(h.world.activities.land()).toBeNull();
    wait(h, RIDE_MS);
    expect(h.world.activities.riding()!.at.part).toBe('done');
    const landed = h.world.activities.land()!;
    expect(landed).toMatchObject({ free: true, candy: 0, first: true });
    expect(h.world.activities.riding()).toBeNull();
    expect(h.world.wallet.candy).toBe(candy);
    expect(h.world.bag.count(TICKET_STUB)).toBe(1);
    expect(h.world.takings.isReady(FREE_RIDE_KEY)).toBe(false);
    expect(h.tick(1)).toContainEqual({ kind: 'rode', with: null, first: true });
  });

  it('charges a little for the next, and the stub only ever comes once', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 16, 15));
    h.world.wallet.earn(100);
    h.world.activities.board();
    wait(h, RIDE_MS);
    h.world.activities.land();
    const candy = h.world.wallet.candy;
    expect(h.world.activities.freeRide()).toBe(false);
    expect(h.world.activities.board()!.free).toBe(false);
    // Nothing's paid until it's round.
    expect(h.world.wallet.candy).toBe(candy);
    wait(h, RIDE_MS);
    expect(h.world.activities.land()).toMatchObject({
      free: false,
      candy: RIDE_COST,
      first: false,
    });
    expect(h.world.wallet.candy).toBe(candy - RIDE_COST);
    expect(h.world.bag.count(TICKET_STUB)).toBe(1);
    // The next day, free again.
    h.clock.set(new Date(2026, 8, 17, 15));
    expect(h.world.activities.freeRide()).toBe(true);
  });

  it('costs nothing to get off early, and the free ride waits', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 16, 15));
    const candy = h.world.wallet.candy;
    h.world.activities.board();
    wait(h, RIDE.up / 2);
    h.world.activities.getOff();
    expect(h.world.activities.riding()).toBeNull();
    wait(h, RIDE_MS);
    expect(h.world.activities.land()).toBeNull();
    expect(h.world.wallet.candy).toBe(candy);
    expect(h.world.activities.freeRide()).toBe(true);
    expect(h.world.bag.count(TICKET_STUB)).toBe(0);
  });

  it("won't take her up without the Candy once the free ride is had", () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 16, 15));
    h.world.takings.take(FREE_RIDE_KEY);
    h.world.wallet.spend(h.world.wallet.candy);
    expect(h.world.activities.board()).toBeNull();
    h.world.wallet.earn(RIDE_COST);
    expect(h.world.activities.board()).not.toBeNull();
  });

  it('takes whoever she knows at the fair along, who says something at the top', () => {
    const h = harness();
    // A Saturday afternoon: Agatha is in her tent at the fair.
    h.clock.set(new Date(2026, 8, 19, 13, 30));
    h.until(
      () => h.world.neighbourhood.neighbour('agatha').zone === 'fortuneTent',
      'Agatha walking down to her tent',
      240_000,
    );
    expect(h.world.activities.rideWith()).toBe('agatha');
    const riding = h.world.activities.board()!;
    expect(riding.with).toBe('agatha');
    const name = h.world.name;
    expect(RIDE_LINES.agatha.map((l) => fill(l, { name }))).toContain(riding.line);
    wait(h, RIDE_MS);
    h.world.activities.land();
    expect(h.tick(1)).toContainEqual({ kind: 'rode', with: 'agatha', first: true });
  });

  it('has the car to herself with nobody she knows at the fair, and the mayor plaque', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 16, 10));
    h.tick(2);
    expect(h.world.activities.rideWith()).toBeNull();
    expect(h.world.activities.board()!.line).toMatch(/plaque/);
  });
});
