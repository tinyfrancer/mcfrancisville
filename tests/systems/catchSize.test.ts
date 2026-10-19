import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS, isFish } from '../../src/data/critters';
import { FISH_SIZES, SHADOW_SIZES } from '../../src/data/fishSizes';
import { handsOf, isWhopper, sizeOf } from '../../src/systems/catchSize';

/*
 * V1's R6a (decision 316): a size per catch, from the fish's range (which sits in its shadow's)
 * and a hash of the cast, said in hands.
 */

describe('how big a fish comes', () => {
  it("has a range for every fish and nothing else, inside its shadow's", () => {
    for (const id of CRITTER_IDS) {
      const range = FISH_SIZES[id];
      expect(range !== undefined, id).toBe(isFish(id));
      if (!range) continue;
      const [least, most] = range;
      const [low, high] = SHADOW_SIZES[CRITTERS[id].shadow!];
      expect(least, id).toBeLessThan(most);
      expect(least, id).toBeGreaterThanOrEqual(low);
      expect(most, id).toBeLessThanOrEqual(high);
    }
  });

  it('is the same for the same cast, and differs cast to cast, always in its range', () => {
    for (const id of CRITTER_IDS.filter(isFish)) {
      const [least, most] = FISH_SIZES[id]!;
      expect(sizeOf(id, 'cast')).toBe(sizeOf(id, 'cast'));
      const sizes = Array.from({ length: 300 }, (_, i) => sizeOf(id, `${id}@${i}`)!);
      expect(new Set(sizes).size, id).toBeGreaterThanOrEqual(Math.min(3, most - least));
      for (const s of sizes) {
        expect(s).toBeGreaterThanOrEqual(least);
        expect(s).toBeLessThanOrEqual(most);
      }
      // Middling sizes likeliest, and a whopper a treat: now and then, never most of the time.
      const whoppers = sizes.filter((s) => isWhopper(id, s)).length;
      expect(whoppers, id).toBeGreaterThan(0);
      expect(whoppers / sizes.length, id).toBeLessThan(0.25);
    }
  });

  it('is nothing for a critter that is not a fish', () => {
    expect(sizeOf('lunaMoth', 'x')).toBeNull();
    expect(isWhopper('lunaMoth', 30)).toBe(false);
  });

  it('is said in her hands', () => {
    expect(handsOf(2)).toBe('half a hand');
    expect(handsOf(3)).toBe('three quarters of a hand');
    expect(handsOf(4)).toBe('a hand');
    expect(handsOf(6)).toBe('a hand and a half');
    expect(handsOf(8)).toBe('two hands');
    expect(handsOf(10)).toBe('two and a half hands');
    expect(handsOf(15)).toBe('three and three quarter hands');
    expect(handsOf(24)).toBe('six hands');
  });
});
