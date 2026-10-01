import { describe, expect, it } from 'vitest';
import { BAKE_CANDY, BAKE_KEEPS, BAKES } from '../../src/data/baking';
import { dayKey } from '../../src/systems/clock';
import { bakeOn } from '../../src/world/services/Baking';
import { harness, type Harness } from './harness';

/** Lets the town settle into the hour, then walks her into Crumbs & Curios. */
function intoTheBakery(h: Harness) {
  h.tick(2);
  h.until(
    () => h.world.neighbourhood.neighbours.every((n) => !n.moving),
    'everyone to get where they are going',
    180_000,
  );
  const bakery = h.world.map.props.find((p) => p.id === 'bakery')!;
  h.world.tapTile(bakery.tx, bakery.ty);
  h.until(() => h.world.scene === 'crumbs', 'she goes into Crumbs & Curios');
  h.tick(2);
}

describe("baking with Wrapunzel (0.2's E1)", () => {
  it('bakes the day’s bake once a day, for Candy, a couple to take home, and a little closer', () => {
    const h = harness();
    // A Monday morning: Wrapunzel is at her ovens.
    h.clock.set(new Date(2026, 9, 5, 9));
    intoTheBakery(h);
    expect(h.world.neighbourhood.neighbour('wrapunzel').zone).toBe('crumbs');
    expect(h.world.baking.canBake('wrapunzel')).toBe(true);
    expect(h.world.baking.canBake('maude')).toBe(false);
    const bake = bakeOn(dayKey(h.clock.now()));
    const candy = h.world.wallet.candy;
    const had = h.world.bag.count(bake.item);
    const points = h.world.friends.of('wrapunzel').points;
    const baked = h.world.baking.bake('wrapunzel');
    expect(baked).toMatchObject({ item: bake.item, count: BAKE_KEEPS, candy: BAKE_CANDY });
    expect(baked!.line).not.toContain('{name}');
    expect(h.world.wallet.candy).toBe(candy + BAKE_CANDY);
    expect(h.world.bag.count(bake.item)).toBe(had + BAKE_KEEPS);
    expect(h.world.friends.of('wrapunzel').points).toBeGreaterThan(points);
    // Once a day: not again this afternoon, but tomorrow.
    expect(h.world.baking.bake('wrapunzel')).toBeNull();
    h.clock.set(new Date(2026, 9, 6, 9));
    expect(h.world.baking.canBake('wrapunzel')).toBe(true);
  });

  it('needs Wrapunzel in her bakery, and her there too', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 5, 9));
    expect(h.world.baking.canBake('wrapunzel')).toBe(false);
    // An afternoon at the square: she's out of the bakery.
    h.clock.set(new Date(2026, 9, 5, 11, 30));
    intoTheBakery(h);
    expect(h.world.baking.canBake('wrapunzel')).toBe(false);
  });

  it('deals each bake on some day', () => {
    const seen = new Set<string>();
    for (let d = 1; d <= 28; d++) seen.add(bakeOn(`2026-10-${String(d).padStart(2, '0')}`).item);
    expect(seen.size).toBe(BAKES.length);
  });
});
