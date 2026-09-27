import { describe, expect, it } from 'vitest';
import { PET_IDS, STARTER_PETS } from '../../src/data/pets';
import { dayKey } from '../../src/systems/clock';
import { lostBone } from '../../src/systems/pets';
import type { PetId } from '../../src/types/ids';
import { CATCH_UP_TILES } from '../../src/world/Pet';
import { tileOf, type WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

const here = (h: Harness) => tileOf(h.world.player.x, h.world.player.y);
const reach = (a: { tx: number; ty: number }, b: { tx: number; ty: number }) =>
  Math.max(Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty));

/** Steps the town with its clock running, as it does on a phone. */
function run(h: Harness, ms: number): WorldEvent[] {
  const events: WorldEvent[] = [];
  for (let t = 0; t < ms; t += 16) {
    h.clock.advance(16);
    events.push(...h.world.update(16));
  }
  return events;
}

function walkTo(h: Harness, tx: number, ty: number): WorldEvent[] {
  h.world.tapTile(tx, ty);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(1));
}

function goHome(h: Harness): void {
  const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
  h.world.tapTile(house.tx + 1, house.ty + 1);
  h.until(() => h.world.scene === 'home', 'going in');
}

function goOut(h: Harness): void {
  const mat = h.world.home.room.mat;
  h.world.tapTile(mat.tx, mat.ty);
  h.until(() => h.world.scene === 'town', 'going out');
}

/** She takes a pet out: home, the pet's sheet, "come for a walk", and back out. */
function walkWith(id: PetId, h = harness()): Harness {
  goHome(h);
  h.world.petCare.walkWith(id);
  goOut(h);
  return h;
}

describe('pets', () => {
  it('are all at home from the start, on open floor, with nobody out walking', () => {
    const { world } = harness();
    expect(world.petCare.all.map((p) => p.id)).toEqual(PET_IDS);
    expect(world.pets.walking).toBeNull();
    expect(world.petCare.here()).toEqual([]);
    for (const pet of world.petCare.all) {
      expect(pet.scene).toBe('home');
      expect(world.home.canWalk(pet.tile.tx, pet.tile.ty)).toBe(true);
    }
    expect(world.pets.wearing('fibi')).toBe('pinkSpikedCollar');
    expect(world.pets.wearing('dolly')).toBe('blueBandana');
    expect(world.pets.nameOf('gary')).toBe('Gary');
  });

  it('are there when she goes in, and she can walk up to one', () => {
    const h = harness();
    goHome(h);
    expect(h.world.petCare.here()).toHaveLength(PET_IDS.length);
    const gary = h.world.petCare.pet('gary');
    h.world.tapTile(gary.tile.tx, gary.tile.ty);
    const events = h.until(() => !h.world.player.moving, 'walking up to Gary').concat(h.tick(1));
    expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', pet: 'gary' }));
    expect(h.world.petCare.pettingNow).toBe('gary');
    expect(reach(here(h), gary.tile)).toBeLessThanOrEqual(1);
    expect(h.world.petCare.patPet('gary')).toContain('Gary');
    h.world.petCare.endPet();
    expect(h.world.petCare.pettingNow).toBeNull();
  });

  it('go out walking with her, one at a time, and follow her across town', () => {
    const h = walkWith('dolly');
    const dolly = h.world.petCare.pet('dolly');
    expect(dolly.scene).toBe('town');
    expect(h.world.petCare.here()).toEqual([dolly]);
    walkTo(h, h.world.map.spawn.tx + 6, h.world.map.spawn.ty + 4);
    run(h, 3000);
    expect(reach(dolly.tile, here(h))).toBe(1);

    h.world.petCare.walkWith('fibi');
    expect(dolly.scene).toBe('home');
    expect(h.world.petCare.pet('fibi').scene).toBe('town');
    expect(reach(h.world.petCare.pet('fibi').tile, here(h))).toBeLessThanOrEqual(1);
    h.world.petCare.walkWith(null);
    expect(h.world.petCare.here()).toEqual([]);
  });

  it('come back in with her, and out again', () => {
    const h = walkWith('wybie');
    goHome(h);
    expect(h.world.petCare.pet('wybie').scene).toBe('home');
    expect(reach(h.world.petCare.pet('wybie').tile, here(h))).toBeLessThanOrEqual(1);
    goOut(h);
    expect(h.world.petCare.pet('wybie').scene).toBe('town');
  });

  it('turn up beside her even when they can hardly keep up, as Gary can', () => {
    const h = walkWith('gary');
    const gary = h.world.petCare.pet('gary');
    const far = { tx: h.world.map.spawn.tx + 14, ty: h.world.map.spawn.ty + 6 };
    walkTo(h, far.tx, far.ty);
    expect(reach(gary.tile, here(h))).toBeGreaterThan(1);
    expect(reach(gary.tile, here(h))).toBeLessThanOrEqual(CATCH_UP_TILES + 1);
    run(h, 30_000);
    expect(reach(gary.tile, here(h))).toBeLessThanOrEqual(1);
  });

  it('Florence falls asleep under her blanket when she stands still, and wakes when she walks', () => {
    const h = walkWith('florence');
    run(h, 4000);
    const florence = h.world.petCare.pet('florence');
    expect(florence.pose).toBe('sleep');
    expect(florence.bubble(h.clock.now())).toBe('zzz');
    h.world.tapTile(here(h).tx + 3, here(h).ty);
    run(h, 200);
    expect(florence.pose).not.toBe('sleep');
  });

  it('Elvira curls up right beside her when she stands still', () => {
    const h = walkWith('elvira');
    run(h, 4000);
    const elvira = h.world.petCare.pet('elvira');
    expect(elvira.pose).toBe('curl');
    expect(reach(elvira.tile, here(h))).toBe(1);
  });

  it('Dolly barks at a neighbour who comes close, then hides behind her', () => {
    const h = walkWith('dolly');
    const rufus = h.world.neighbourhood.neighbour('rufus');
    h.world.tapTile(rufus.tile.tx, rufus.tile.ty);
    h.until(() => !h.world.player.moving, 'walking up to Rufus');
    h.tick(1);
    h.world.neighbourhood.endTalk();
    const dolly = h.world.petCare.pet('dolly');
    let barked = false;
    for (let i = 0; i < 200 && !barked; i++) {
      run(h, 16);
      barked = dolly.bubble(h.clock.now()) === 'woof';
    }
    expect(barked).toBe(true);
    run(h, 3000);
    const me = here(h);
    const r = rufus.tile;
    // On her far side from Rufus: never nearer him than she is.
    expect(reach(dolly.tile, me)).toBe(1);
    expect(reach(dolly.tile, r)).toBeGreaterThanOrEqual(reach(me, r));
  });

  it('can be named, and given their own name back', () => {
    const { world } = harness();
    expect(world.petCare.rename('gary', '  Sir   Gary  ')).toBe('Sir Gary');
    expect(world.petCare.rename('gary', 'A name far too long for a snail')).toHaveLength(14);
    expect(world.petCare.rename('gary', '   ')).toBe('Gary');
    expect(world.pets.snapshot().names).toEqual({});
  });

  it('wear what she owns, and she can buy them more', () => {
    const h = harness();
    const { world } = h;
    expect(world.petCare.dress('florence', 'scarletBandana')).toBe(true);
    expect(world.pets.wearing('florence')).toBe('scarletBandana');
    expect(world.petCare.dress('gary', 'bellCollar')).toBe(false);
    expect(world.petCare.dress('fibi', null)).toBe(true);
    expect(world.pets.wearing('fibi')).toBeNull();

    const offer = world.shops
      .stock('corner')
      .flatMap((s) => s.offers)
      .find((o) => 'accessory' in o.ware)!;
    expect(offer).toBeDefined();
    const bought = world.shops.buy('corner', offer.ware);
    expect(bought).toMatchObject({ kind: 'bought' });
    expect(world.shops.buy('corner', offer.ware)).toBeNull();
    const id = (offer.ware as { accessory: never }).accessory;
    expect(world.pets.owns(id)).toBe(true);
    expect(world.petCare.dress('gary', id)).toBe(true);
  });

  it('keep their names, accessories and walker in a save', () => {
    const h = harness();
    h.world.petCare.rename('elvira', 'Elvie');
    h.world.petCare.dress('elvira', 'lavenderBandana');
    h.world.petCare.walkWith('elvira');
    const saved = h.world.petsSnapshot().pets;
    expect(saved).toEqual({
      ...STARTER_PETS,
      walking: 'elvira',
      names: { elvira: 'Elvie' },
      wearing: { ...STARTER_PETS.wearing, elvira: 'lavenderBandana' },
    });
    const again = harness(undefined, { pets: saved });
    expect(again.world.petCare.pet('elvira').scene).toBe('town');
    expect(again.world.pets.nameOf('elvira')).toBe('Elvie');
  });
});

describe("Fibi's bones", () => {
  /** Moves the clock to noon on the first day from 26 September her bone is out in `scene`. */
  function dayWithBone(h: Harness, scene: 'town' | 'home'): void {
    for (let d = 0; d < 60; d++) {
      h.clock.set(new Date(2026, 8, 26 + d, 12));
      if (h.world.petCare.lostBone()?.scene === scene) return;
    }
    expect.fail(`no day with a bone at ${scene}`);
  }

  it('turn up on most days, the same all day', () => {
    let days = 0;
    for (let d = 0; d < 70; d++) {
      const day = dayKey(new Date(2026, 0, 1 + d, 12).getTime());
      const spots = [{ tx: 1, ty: 1 }];
      if (lostBone(day, spots, spots)) days += 1;
      expect(lostBone(day, spots, spots)).toEqual(lostBone(day, spots, spots));
    }
    expect(days).toBeGreaterThan(40);
    expect(days).toBeLessThan(60);
  });

  it('can be found in town and brought back to her, which makes her day', () => {
    const h = harness();
    dayWithBone(h, 'town');
    const bone = h.world.petCare.lostBone()!;
    const events = walkTo(h, bone.tx, bone.ty);
    expect(events).toContainEqual(
      expect.objectContaining({ kind: 'gathered', from: 'bone', item: 'fibisBone' }),
    );
    expect(h.world.bag.count('fibisBone')).toBe(1);
    expect(h.world.petCare.lostBone()).toBeNull();

    const day = dayKey(h.clock.now());
    expect(h.world.pets.fibiHappy(day)).toBe(false);
    expect(h.world.petCare.returnBone()).toContain('Fibi');
    expect(h.world.bag.count('fibisBone')).toBe(0);
    expect(h.world.pets.bones).toBe(1);
    expect(h.world.pets.fibiHappy(day)).toBe(true);
    expect(h.world.petCare.returnBone()).toBeNull();
  });

  it('can be found at home, under the furniture', () => {
    const h = harness();
    goHome(h);
    dayWithBone(h, 'home');
    const bone = h.world.petCare.lostBone()!;
    expect(h.world.home.canWalk(bone.tx, bone.ty)).toBe(true);
    const events = walkTo(h, bone.tx, bone.ty);
    expect(events).toContainEqual(expect.objectContaining({ kind: 'gathered', from: 'bone' }));
  });

  it("can't be sold: they're hers", () => {
    const h = harness();
    h.world.bag.add('fibisBone', 1);
    expect(h.world.shops.sell('fibisBone')).toBeNull();
  });
});

describe('a found bone', () => {
  it("isn't a gift for a neighbour: it's Fibi's", () => {
    const h = harness();
    h.world.bag.add('fibisBone', 1);
    expect(h.world.neighbourhood.give('cody', 'fibisBone')).toBeNull();
    expect(h.world.bag.count('fibisBone')).toBe(1);
  });
});
