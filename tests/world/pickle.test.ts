import { describe, expect, it } from 'vitest';
import {
  FORAGED,
  GREW_LINES,
  GROWN_PATS,
  JOBS,
  LEVEL_AT,
  REST_LIKES,
  TRICKS,
  TREAT_LINES,
} from '../../src/data/affection';
import { ITEMS } from '../../src/data/items';
import { ACCESSORIES, fitsPet, PET_IDS, PETS, STARTER_PETS } from '../../src/data/pets';
import { eventToast } from '../../src/hud/messages';
import { dayKey } from '../../src/systems/clock';
import {
  FORAGE_KEY,
  foragedOn,
  PAT_DEAD_MS,
  pickleAwake,
  STARTLE_EVERY_MS,
  STARTLE_MS,
} from '../../src/systems/pets';
import type { PetId } from '../../src/types/ids';
import { JOB_AFTER_MS, Pet, type PetSurroundings } from '../../src/world/Pet';
import { Pets } from '../../src/world/Pets';
import type { WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/**
 * Pickle the possum (1.5's G7, decision 376): a seventh pet, hers from the moment 1.5 lands, who
 * keeps the night, plays dead at compliments and when a neighbour comes right up, forages a snack
 * once a night, and has two tricks in one.
 */

function run(h: Harness, ms: number, step = 16): WorldEvent[] {
  const events: WorldEvent[] = [];
  for (let t = 0; t < ms; t += step) {
    h.clock.advance(step);
    events.push(...h.world.update(step));
  }
  return events;
}

function goHome(h: Harness): void {
  const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
  h.world.tapTile(house.tx + 1, house.ty + 1);
  h.until(() => h.world.scene === 'home', 'going in');
}

function goOut(h: Harness): void {
  const mat = h.world.home.rooms.room.mat;
  h.world.tapTile(mat.tx, mat.ty);
  h.until(() => h.world.scene === 'town', 'going out');
}

/** The harness's day at an hour of it. */
function at(h: Harness, hour: number): void {
  const d = new Date(h.clock.now());
  d.setHours(hour, 0, 0, 0);
  h.clock.set(d);
}

describe('his row', () => {
  it('has everything the other six have', () => {
    const others = PET_IDS.filter((id) => id !== 'pickle');
    expect(PET_IDS.at(-1)).toBe('pickle');
    expect(PETS.pickle.pats).toHaveLength(3);
    for (const level of GROWN_PATS.pickle) expect(level).toHaveLength(3);
    expect(TRICKS.pickle.ms).toBeGreaterThan(0);
    expect(JOBS.pickle.job).toBe('forage');
    expect(GREW_LINES.pickle).toHaveLength(2);
    expect(TREAT_LINES.pickle).toContain('{treat}');
    expect(REST_LIKES.pickle.length).toBeGreaterThan(0);
    for (const id of others)
      expect(Object.keys(PETS.pickle).sort(), id).toEqual(Object.keys(PETS[id]).sort());
    expect(PETS.pickle.ghost).toBe(false);
  });

  it('is hers from the start, at home, and an old save without him loses nothing', () => {
    const h = harness();
    expect(h.world.petCare.pet('pickle').scene).toBe('home');
    const old = new Pets({ ...STARTER_PETS, names: { fibi: 'Feebs' } });
    expect(old.nameOf('pickle')).toBe('Pickle');
    expect(old.nameOf('fibi')).toBe('Feebs');
    expect(old.level('pickle')).toBe(0);
  });

  it('keeps his name, what he wears and his fondness in the save', () => {
    const pets = new Pets();
    pets.give('tailLantern');
    pets.rename('pickle', 'Pickle Rick');
    expect(pets.dress('pickle', 'tailLantern')).toBe(true);
    pets.setPoints('pickle', 25);
    const back = new Pets(JSON.parse(JSON.stringify(pets.snapshot())));
    expect(back.nameOf('pickle')).toBe('Pickle Rick');
    expect(back.wearing('pickle')).toBe('tailLantern');
    expect(back.level('pickle')).toBe(1);
  });
});

describe('his accessories', () => {
  it('a scarf for anyone; his bow and lantern for him alone', () => {
    const pets = new Pets();
    for (const id of ['tinyScarf', 'ribbonBow', 'tailLantern'] as const) {
      expect(ACCESSORIES[id].price, id).toBeGreaterThan(0);
      pets.give(id);
    }
    for (const id of PET_IDS) expect(fitsPet('tinyScarf', id)).toBe(true);
    expect(pets.dress('fibi', 'tinyScarf')).toBe(true);
    expect(pets.dress('fibi', 'ribbonBow')).toBe(false);
    expect(pets.dress('dolly', 'tailLantern')).toBe(false);
    expect(pets.wearing('fibi')).toBe('tinyScarf');
    expect(pets.dress('pickle', 'ribbonBow')).toBe(true);
    // A save that somehow has another wearing his lantern is put right as it loads.
    const odd = new Pets({
      ...STARTER_PETS,
      accessories: ['tailLantern'],
      wearing: { gary: 'tailLantern' },
    });
    expect(odd.wearing('gary')).toBeNull();
  });
});

describe('his night', () => {
  it('is up from the evening till five, and asleep the day away', () => {
    const day = new Date(2026, 9, 1);
    const hour = (h: number) => new Date(day.getFullYear(), 9, 1, h).getTime();
    expect(pickleAwake(hour(12))).toBe(false);
    expect(pickleAwake(hour(8))).toBe(false);
    expect(pickleAwake(hour(19))).toBe(true);
    expect(pickleAwake(hour(2))).toBe(true);
  });

  it('sleeps at home by day, and is up and about there at night', () => {
    const h = harness();
    goHome(h);
    run(h, 20_000, 50);
    expect(h.world.petCare.pet('pickle').pose).toBe('sleep');
    at(h, 22);
    run(h, 30_000, 50);
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      run(h, 1000, 50);
      seen.add(h.world.petCare.pet('pickle').pose);
    }
    expect(seen.has('sleep')).toBe(false);
  });

  it('naps on a walk by day the moment she stops', () => {
    const h = harness();
    goHome(h);
    h.world.petCare.walkWith('pickle');
    goOut(h);
    run(h, 5000);
    expect(h.world.petCare.pet('pickle').pose).toBe('sleep');
  });
});

describe('playing dead', () => {
  it('at a pat: a compliment floors him, and he is up again after', () => {
    const h = harness();
    goHome(h);
    const line = h.world.petCare.patPet('pickle');
    expect(line).toContain('Pickle');
    const pickle = h.world.petCare.pet('pickle');
    expect(pickle.pose).toBe('playDead');
    h.world.petCare.startPet('pickle');
    run(h, PAT_DEAD_MS / 2);
    expect(pickle.pose).toBe('playDead');
    run(h, PAT_DEAD_MS);
    expect(pickle.pose).toBe('sit');
    h.world.petCare.endPet();
  });

  it('when a neighbour comes right up, now and then, never to her', () => {
    const pickle = new Pet('pickle', { tx: 5, ty: 5 });
    const open = { canWalk: () => true, width: 20, height: 20 };
    const her = {
      x: 6 * 32 + 16,
      y: 5 * 32 + 16,
      facing: 'left' as const,
      moving: false,
      stillMs: 0,
    };
    const near = (now: number, villagers: { tx: number; ty: number }[]): PetSurroundings => ({
      now,
      ground: open,
      her,
      following: true,
      held: false,
      villagers,
      roam: [],
      happy: false,
    });
    pickle.update(16, near(1000, []));
    expect(pickle.pose).not.toBe('playDead');
    pickle.update(16, near(2000, [{ tx: 3, ty: 5 }]));
    expect(pickle.pose).toBe('playDead');
    pickle.update(16, near(2000 + STARTLE_MS + 10, [{ tx: 3, ty: 5 }]));
    expect(pickle.pose).not.toBe('playDead');
    // Not again for a while, with the same neighbour still there.
    pickle.update(16, near(2000 + STARTLE_MS + 500, [{ tx: 3, ty: 5 }]));
    expect(pickle.pose).not.toBe('playDead');
    pickle.update(16, near(2000 + STARTLE_EVERY_MS + 10, [{ tx: 3, ty: 5 }]));
    expect(pickle.pose).toBe('playDead');
  });

  it('gives way to his trick when she asks for it', () => {
    const h = harness();
    h.world.pets.setPoints('pickle', LEVEL_AT[2]);
    h.world.petCare.patPet('pickle');
    expect(h.world.petCare.trick('pickle')).toContain('hangs by his tail');
    run(h, 32);
    expect(h.world.petCare.pet('pickle').pose).toBe('trick');
  });
});

describe('foraging', () => {
  it('finds one of the night snacks, the same all day', () => {
    for (const id of FORAGED) expect(ITEMS[id].kind, id).toBe('snack');
    expect(foragedOn('2026-10-01')).toBe(foragedOn('2026-10-01'));
    const days = Array.from({ length: 40 }, (_, i) => foragedOn(`2026-11-${(i % 28) + 1}`));
    expect(new Set(days).size).toBeGreaterThan(1);
  });

  it('only on a night walk outdoors, once he is fond enough', () => {
    const pickle = new Pet('pickle', { tx: 5, ty: 5 });
    const night = new Date(2026, 9, 1, 22).getTime();
    const s = (now: number, level: 0 | 1, outdoors: boolean): PetSurroundings => ({
      now,
      ground: { canWalk: () => true, width: 20, height: 20 },
      her: { x: 5 * 32 + 16, y: 4 * 32 + 16, facing: 'down', moving: false, stillMs: JOB_AFTER_MS },
      following: true,
      held: false,
      villagers: [],
      roam: [],
      happy: false,
      level,
      finds: { mound: null, critters: [], lost: null, outdoors },
    });
    const deeds = (level: 0 | 1, outdoors: boolean, from: number) => {
      const found: unknown[] = [];
      for (let t = from; t < from + 120_000; t += 1000) {
        const deed = pickle.update(16, s(t, level, outdoors));
        if (deed && 'job' in deed) found.push(deed);
      }
      return found;
    };
    expect(deeds(0, true, night)).toEqual([]);
    expect(deeds(1, false, night)).toEqual([]);
    expect(deeds(1, true, night + 3600_000).length).toBeGreaterThan(0);
    // By day he naps instead.
    expect(deeds(1, true, new Date(2026, 9, 1, 13).getTime())).toEqual([]);
  });

  it('brings her a snack once a night, into her bag, with a toast', () => {
    const h = harness();
    at(h, 21);
    h.world.pets.setPoints('pickle', LEVEL_AT[1]);
    goHome(h);
    h.world.petCare.walkWith('pickle');
    goOut(h);
    const item = foragedOn(dayKey(h.clock.now()));
    const had = h.world.bag.count(item);
    let found: WorldEvent | undefined;
    for (let i = 0; i < 180 && !found; i++) {
      found = run(h, 1000, 50).find((e) => e.kind === 'petHelped' && e.job === 'forage');
    }
    expect(found).toBeDefined();
    expect(h.world.bag.count(item)).toBe(had + 1);
    expect(h.world.takings.isReady(FORAGE_KEY)).toBe(false);
    const toast = eventToast(found!);
    expect(toast && typeof toast === 'object' && 'text' in toast ? toast.text : '').toContain(
      'Pickle',
    );
    // Not again tonight.
    const again = run(h, 120_000, 100).filter((e) => e.kind === 'petHelped');
    expect(again).toEqual([]);
    expect(h.world.bag.count(item)).toBe(had + 1);
  });
});

describe('at home', () => {
  it('rests on the sofa or a rug, and the six keep their spots', () => {
    const h = harness();
    goHome(h);
    const spot = h.world.petCare.restOf('pickle');
    if (spot) expect(REST_LIKES.pickle).toContain(spot.kind);
    const held = (PET_IDS as PetId[])
      .map((id) => h.world.petCare.restOf(id))
      .filter((s) => s !== null)
      .map((s) => JSON.stringify(s!.perch?.tile ?? s!.floor));
    expect(new Set(held).size).toBe(held.length);
    expect(h.world.petCare.restOf('florence')?.kind).toBe('bed');
    expect(h.world.petCare.restOf('fibi')?.kind).toBe('rug');
  });
});
