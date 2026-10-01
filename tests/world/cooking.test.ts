import { describe, expect, it } from 'vitest';
import { CRITTERS, isFish } from '../../src/data/critters';
import { lureKey, PEP } from '../../src/systems/cooking';
import { reach } from '../../src/world/Movement';
import type { WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Walks her in through her front door. */
function goHome(h = harness()) {
  const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
  h.world.tapTile(house.tx + 1, house.ty + 1);
  h.until(() => h.world.scene === 'home', 'going in');
  return h;
}

const kitchen = (bag: { id: Parameters<Harness['world']['bag']['add']>[0]; count: number }[]) =>
  harness(undefined, { finds: { bag } });

describe('her stove', () => {
  it('stands beside her workbench from the first day, and walking up to it opens it', () => {
    const h = goHome();
    expect(h.world.home.pieceAt(6, 3)?.id).toBe('stove');
    h.world.tapTile(6, 3);
    const events = h.until(() => !h.world.player.moving, 'walking to the stove');
    expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', piece: 'stove' }));
  });

  it('knows the starting dishes, and learns the rest from cards like any recipe', () => {
    const h = harness();
    expect(h.world.kitchen.recipes).toEqual([
      'pumpkinSoup',
      'fishChowder',
      'moonpetalCake',
      'midnightPlate',
      // Hers (0.2's N2).
      'spaghetti',
      'chipsAndGuac',
    ]);
    expect(h.world.workbench.recipes).not.toContain('pumpkinSoup');
    expect(h.world.kitchen.cantCook('ghostChili')).toBe('unknown');
    h.world.workbench.learn('ghostChili');
    expect(h.world.kitchen.recipes).toContain('ghostChili');
    expect(h.world.kitchen.cantCook('stumpStool')).toBe('unknown');
  });
});

describe('cooking', () => {
  it('cooks a dish from her bag, taking the plainest fish for any fish', () => {
    const h = kitchen([
      { id: 'blueMoonfish', count: 1 },
      { id: 'ghostMinnow', count: 2 },
      { id: 'pumpkin', count: 1 },
    ]);
    expect(h.world.kitchen.cook('fishChowder')).toEqual({
      kind: 'cooked',
      recipe: 'fishChowder',
      item: 'fishChowder',
      used: [
        { item: 'ghostMinnow', count: 1 },
        { item: 'pumpkin', count: 1 },
      ],
      night: false,
    });
    expect(h.world.bag.count('fishChowder')).toBe(1);
    expect(h.world.bag.count('blueMoonfish')).toBe(1);
    expect(h.world.bag.count('ghostMinnow')).toBe(1);
    expect(h.world.kitchen.cook('fishChowder')).toBeNull();
    expect(h.world.bag.count('ghostMinnow')).toBe(1);
  });

  it('makes a plate of late-night snackies only after dark', () => {
    const h = kitchen([
      { id: 'midnightPizza', count: 1 },
      { id: 'batWingCookie', count: 1 },
    ]);
    expect(h.world.kitchen.cantCook('midnightPlate')).toBe('night');
    expect(h.world.kitchen.cook('midnightPlate')).toBeNull();
    h.clock.set(new Date(2026, 8, 26, 23));
    expect(h.world.kitchen.cook('midnightPlate')).toMatchObject({ kind: 'cooked', night: true });
    expect(h.world.bag.count('midnightPizza')).toBe(0);
  });

  it('gives a dish her neighbours like, or love', () => {
    const h = kitchen([
      { id: 'ghostChili', count: 1 },
      { id: 'pumpkinSoup', count: 1 },
    ]);
    expect(h.world.neighbourhood.give('cody', 'ghostChili')).toMatchObject({ reaction: 'loved' });
    expect(h.world.neighbourhood.give('maude', 'pumpkinSoup')).toMatchObject({
      reaction: 'liked',
    });
  });
});

describe('eating', () => {
  it('eats a dish or a snack from her bag, but not a seed', () => {
    const h = kitchen([
      { id: 'pumpkinSoup', count: 2 },
      { id: 'pumpkinSeed', count: 1 },
    ]);
    expect(h.world.kitchen.canEat('pumpkinSoup')).toBe(true);
    expect(h.world.kitchen.canEat('pumpkinSeed')).toBe(false);
    expect(h.world.kitchen.canEat('midnightPizza')).toBe(false);
    expect(h.world.kitchen.eat('pumpkinSeed')).toBeNull();
    expect(h.world.kitchen.eat('pumpkinSoup')).toEqual({
      kind: 'ate',
      item: 'pumpkinSoup',
      effect: 'pep',
      until: 'evening',
    });
    expect(h.world.bag.count('pumpkinSoup')).toBe(1);
  });

  it('puts a spring in her step until the window turns', () => {
    const walk = (h: Harness) => {
      const from = h.world.player.x;
      h.world.tapTile(h.world.movement.tile.tx + 6, h.world.movement.tile.ty);
      h.tick(30);
      return Math.abs(h.world.player.x - from);
    };
    const plain = walk(kitchen([]));
    const h = kitchen([{ id: 'ghostChili', count: 1 }]);
    h.world.kitchen.eat('ghostChili');
    expect(h.world.kitchen.pace()).toBe(PEP);
    expect(walk(h)).toBeGreaterThan(plain * 1.2);
    h.clock.set(new Date(2026, 8, 26, 18));
    expect(h.world.kitchen.pace()).toBe(1);
  });

  it('has the fish biting sooner, from the cast', () => {
    const h = kitchen([{ id: 'moonflowerTea', count: 1 }]);
    expect(h.world.kitchen.eager()).toBe(false);
    h.world.kitchen.eat('moonflowerTea');
    expect(h.world.kitchen.eager()).toBe(true);
    const fish = h.world.collecting.critters().find((c) => isFish(c.critter))!;
    h.world.fishing.castTo(fish);
    expect(h.world.fishing.line?.eager).toBe(true);
  });

  it('lures a critter of its family out near her, caught once', () => {
    const h = kitchen([{ id: 'roseJam', count: 1 }]);
    const before = h.world.collecting.critters().length;
    const ate = h.world.kitchen.eat('roseJam');
    expect(ate).toMatchObject({ effect: { lure: 'beetle' } });
    const now = h.clock.now();
    const out = h.world.collecting.critters();
    expect(out.length).toBe(before + 1);
    const lured = out.find((c) => c.key === lureKey(now))!;
    expect(CRITTERS[lured.critter].family).toBe('beetle');
    expect(reach(h.world.movement.tile, lured)).toBeLessThanOrEqual(8);
    // Where it came out stays put, wherever she goes.
    h.world.tapTile(h.world.movement.tile.tx, h.world.movement.tile.ty + 2);
    h.tick(40);
    expect(h.world.collecting.find(lured.key)).toMatchObject({ tx: lured.tx, ty: lured.ty });
    const caught: WorldEvent = h.world.collecting.keep(lured);
    expect(caught).toMatchObject({ kind: 'caught', critter: lured.critter });
    expect(h.world.kitchen.lure()).toBeNull();
    expect(h.world.collecting.critters().length).toBe(before);
  });

  it('keeps what she ate in the save, and a lure already caught stays caught', () => {
    const h = kitchen([
      { id: 'pumpkinPie', count: 1 },
      { id: 'pumpkinSoup', count: 1 },
    ]);
    h.world.kitchen.eat('pumpkinPie');
    h.world.kitchen.eat('pumpkinSoup');
    const save = h.world.save();
    expect(save.kitchen).toEqual({
      pep: h.clock.now(),
      bites: null,
      lure: { family: 'bat', at: h.clock.now() },
    });
    const back = harness(undefined, { kitchen: save.kitchen, finds: save });
    back.clock.set(new Date(h.clock.now()));
    expect(back.world.kitchen.pace()).toBe(PEP);
    expect(back.world.kitchen.lure()).toEqual({ family: 'bat', at: h.clock.now() });
    const odd = harness(undefined, {
      kitchen: { pep: Number.NaN, lure: { family: 'fish', at: 1 } },
    });
    expect(odd.world.kitchen.snapshot().kitchen).toEqual({ pep: null, bites: null, lure: null });
  });
});
