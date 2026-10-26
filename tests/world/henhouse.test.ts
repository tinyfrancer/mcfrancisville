import { describe, expect, it } from 'vitest';
import { BAKE_KEEPS, MERINGUE_BAKE } from '../../src/data/baking';
import { MERINGUE_EGGS } from '../../src/data/hens';
import { RECIPES } from '../../src/data/recipes';
import { todayLines } from '../../src/systems/today';
import { fromSave, World } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Over to Boo Acres and up to the coop. */
function toTheCoop(h: Harness) {
  h.world.travel.cross({ to: 'booAcres', along: 0 });
  h.tick(2);
  const coop = h.world.zones.map('booAcres').map.props.find((p) => p.id === 'coop')!;
  h.world.tapTile(coop.tx + 1, coop.ty + 1);
  return h.until(() => !h.world.player.moving, 'walking up to the coop').concat(h.tick(2));
}

describe("the hens at Boo Acres (1.6's X3)", () => {
  it('opens the coop as she walks up to it', () => {
    const h = harness();
    const events = toTheCoop(h);
    expect(events.some((e) => e.kind === 'arrived' && e.at === 'coop')).toBe(true);
  });

  it('are fed once a day from her bag, and lay an egg each by the next morning', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 26, 9));
    h.world.bag.add('pumpkinSeed', 2);
    const seeds = h.world.bag.count('pumpkinSeed');
    expect(h.world.henhouse.view()).toMatchObject({ eggs: 0, fed: false, out: true });
    expect(h.world.henhouse.view().choices).toContain('pumpkinSeed');
    expect(h.world.henhouse.feed('wood')).toBe(false);
    expect(h.world.henhouse.feed('pumpkinSeed')).toBe(true);
    expect(h.tick(1).some((e) => e.kind === 'fedHens' && e.item === 'pumpkinSeed')).toBe(true);
    expect(h.world.bag.count('pumpkinSeed')).toBe(seeds - 1);
    expect(h.world.henhouse.feed('pumpkinSeed')).toBe(false);
    expect(h.world.henhouse.view()).toMatchObject({ eggs: 0, fed: true });
    // Still none before five the next morning; three by it.
    h.clock.set(new Date(2026, 9, 27, 4, 59));
    expect(h.world.henhouse.eggs()).toBe(0);
    h.clock.set(new Date(2026, 9, 27, 5));
    expect(h.world.henhouse.eggs()).toBe(3);
    expect(todayLines(h.world.upNow.facts()).find((l) => l.kind === 'eggs')).toMatchObject({
      eggs: 3,
      go: { zone: 'booAcres', prop: 'coop' },
    });
    const eggs = h.world.bag.count('egg');
    expect(h.world.henhouse.collect()).toBe(3);
    expect(h.tick(1).some((e) => e.kind === 'laid' && e.eggs === 3)).toBe(true);
    expect(h.world.bag.count('egg')).toBe(eggs + 3);
    expect(h.world.henhouse.collect()).toBe(0);
    expect(todayLines(h.world.upNow.facts()).some((l) => l.kind === 'eggs')).toBe(false);
  });

  it('lay nothing on a day they went unfed, and are none the worse for it', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 26, 9));
    h.clock.set(new Date(2026, 9, 28, 9));
    expect(h.world.henhouse.eggs()).toBe(0);
    expect(h.world.henhouse.view().fed).toBe(false);
  });

  it('potter in the run by day and are in for the night', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 26, 10));
    const run = h.world.henhouse.run!;
    const hens = h.world.henhouse.hens();
    expect(hens.map((s) => s.id)).toEqual(['henrietta', 'peck', 'omelette', 'reginald']);
    for (const s of hens) {
      expect(s.x).toBeGreaterThanOrEqual(run.x);
      expect(s.x).toBeLessThanOrEqual(run.x + run.w);
      expect(s.y).toBeGreaterThanOrEqual(run.y);
      expect(s.y).toBeLessThanOrEqual(run.y + run.h);
    }
    // The run is inside the coop's footprint.
    const coop = h.world.zones.map('booAcres').map.props.find((p) => p.id === 'coop')!;
    expect(run.x).toBeGreaterThan(coop.tx * 32);
    expect(run.x + run.w).toBeLessThan((coop.tx + coop.w) * 32);
    expect(run.y).toBeGreaterThanOrEqual(coop.ty * 32);
    expect(run.y + run.h).toBeLessThan((coop.ty + coop.h) * 32);
    h.clock.set(new Date(2026, 9, 26, 21));
    expect(h.world.henhouse.hens()).toEqual([]);
  });

  it('hear Reginald crow once at six, only at Boo Acres', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 26, 5, 59));
    h.world.travel.cross({ to: 'booAcres', along: 0 });
    expect(h.tick(3).some((e) => e.kind === 'crow')).toBe(false);
    h.clock.set(new Date(2026, 9, 26, 6, 0));
    expect(h.tick(3).filter((e) => e.kind === 'crow')).toHaveLength(1);
    expect(h.tick(3).some((e) => e.kind === 'crow')).toBe(false);
    expect(h.world.henhouse.hens().find((s) => s.id === 'reginald')!.doing).toBe('crow');
    // In town at six the next day, she doesn't hear him.
    const town = harness();
    town.clock.set(new Date(2026, 9, 27, 6, 0));
    expect(town.tick(3).some((e) => e.kind === 'crow')).toBe(false);
  });

  it('keeps the day they were fed and the eggs waiting in the save', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 26, 9));
    expect(h.world.henhouse.feed('pumpkinSeed') || h.world.henhouse.feed('apple')).toBe(true);
    const saved = h.world.save();
    expect(saved.henhouse).toEqual({ fed: '2026-10-26', waiting: 0 });
    const again = new World({ ...fromSave(saved), clock: h.clock });
    expect(again.henhouse.view().fed).toBe(true);
    h.clock.set(new Date(2026, 9, 27, 9));
    expect(again.henhouse.eggs()).toBe(3);
    // A town from before the hens has none fed and none waiting.
    const old = new World({ ...fromSave({ ...saved, henhouse: undefined }), clock: h.clock });
    expect(old.henhouse.eggs()).toBe(0);
  });

  it('cooks the eggs into two dishes she knows from the start', () => {
    const h = harness();
    expect(h.world.kitchen.recipes).toEqual(expect.arrayContaining(['custardTart', 'frittata']));
    expect(RECIPES.frittata.needs).toContainEqual({ item: 'egg', count: 2 });
    h.world.bag.add('egg', 2);
    h.world.bag.add('tomato', 1);
    expect(h.world.kitchen.cantCook('frittata')).toBeNull();
    // An egg is never "any crop": two go in by name, and a crop besides.
    const taken = h.world.workbench.wouldTake('frittata');
    expect(taken.filter((t) => t.item === 'egg')).toEqual([{ item: 'egg', count: 2 }]);
    expect(taken.reduce((n, t) => n + t.count, 0)).toBe(3);
  });
});

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

describe("meringue ghosts with Wrapunzel (1.6's X3)", () => {
  it('bakes meringue ghosts instead when she brings eggs, and takes the eggs', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 5, 9));
    h.world.bag.add('egg', MERINGUE_EGGS + 1);
    intoTheBakery(h);
    const scene = h.world.baking.scene('wrapunzel')!;
    expect(scene[0]).toContain('Eggs!');
    const baked = h.world.baking.bake('wrapunzel');
    expect(baked).toMatchObject({ item: MERINGUE_BAKE.item, count: BAKE_KEEPS });
    expect(h.world.bag.count('egg')).toBe(1);
    expect(h.world.bag.count('meringueGhost')).toBe(BAKE_KEEPS);
  });
});
