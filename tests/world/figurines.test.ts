import { describe, expect, it } from 'vitest';
import { CARVE_COUNT, FIGURINE_IDS } from '../../src/data/figurines';
import { letterOf } from '../../src/systems/friendship';
import { carvedFrom } from '../../src/systems/figurines';
import { harness } from './harness';

describe("Gourdon's figurines (0.3's C3)", () => {
  it('carves a figurine from three of a thing in her bag, into her storage chest', () => {
    const { world } = harness();
    world.bag.add('lunaMoth', 4);
    const carved = world.figurines.carve('lunaMoth');
    expect(carved).toEqual({
      kind: 'carved',
      thing: 'lunaMoth',
      figurine: 'lunaMothFigurine',
      first: true,
    });
    expect(world.bag.count('lunaMoth')).toBe(4 - CARVE_COUNT);
    expect(world.home.stored).toContainEqual({ id: 'lunaMothFigurine', count: 1 });
    expect(carvedFrom('lunaMothFigurine')).toBe('lunaMoth');
  });

  it('asks for nothing but the three, and carves nothing from two', () => {
    const { world } = harness();
    const candy = world.wallet.candy;
    world.bag.add('trilobite', 2);
    expect(world.figurines.carve('trilobite')).toBeNull();
    expect(world.bag.count('trilobite')).toBe(2);
    world.bag.add('trilobite', 1);
    expect(world.figurines.carve('trilobite')?.kind).toBe('carved');
    expect(world.wallet.candy).toBe(candy);
    expect(world.bag.count('trilobite')).toBe(0);
  });

  it('lists what she has of each kind he carves, critters first', () => {
    const { world } = harness();
    world.bag.add('vampDoll', 3);
    world.bag.add('ghostGooBall', 1);
    world.bag.add('ammonite', 5);
    world.bag.add('firefly', 2);
    const kinds = world.figurines
      .carvings()
      .filter((c) => ['vampDoll', 'ghostGooBall', 'ammonite', 'firefly'].includes(c.thing))
      .map((c) => [c.thing, c.kind, c.have]);
    expect(kinds).toEqual([
      ['firefly', 'critter', 2],
      ['ghostGooBall', 'squishy', 1],
      ['vampDoll', 'doll', 3],
      ['ammonite', 'fossil', 5],
    ]);
  });

  it('remembers every figurine she has had, says a second is no first, and keeps it in the save', () => {
    const { world } = harness();
    world.bag.add('booBao', 6);
    world.figurines.carve('booBao');
    expect(world.milestones.hasHad('booBaoFigurine')).toBe(true);
    expect(world.figurines.carve('booBao')).toMatchObject({ first: false });
    const saved = world.save().collected;
    expect(saved).toContain('booBaoFigurine');
    const again = harness(undefined, { collected: saved }).world;
    expect(again.milestones.hasHad('booBaoFigurine')).toBe(true);
  });

  it('sends Gourdon by Gourdon for a figurine of everything there is', () => {
    const last = FIGURINE_IDS.at(-1)!;
    const { world } = harness(undefined, { collected: FIGURINE_IDS.slice(0, -1) });
    world.update(16);
    expect(world.milestones.progress('figurines')).toMatchObject({ done: false });
    expect(world.mailbox.letters.has('shelf:figurines')).toBe(false);
    const thing = carvedFrom(last)!;
    world.bag.add(thing, CARVE_COUNT);
    world.figurines.carve(thing);
    expect(world.update(16)).toContainEqual({ kind: 'mail', from: 'gourdon' });
    expect(letterOf('shelf:figurines')?.gift).toEqual({ furniture: 'carvedGourdon' });
  });
});
