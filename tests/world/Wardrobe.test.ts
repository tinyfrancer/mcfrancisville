import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, STARTER_WARDROBE } from '../../src/data/outfits';
import type { OutfitId } from '../../src/types/ids';
import { Wardrobe } from '../../src/world/Wardrobe';

describe('Wardrobe', () => {
  it('starts a new game in the default look, with the starters, waiting for the creator', () => {
    const wardrobe = new Wardrobe();
    expect(wardrobe.created).toBe(false);
    expect(wardrobe.look).toEqual(DEFAULT_LOOK);
    expect(wardrobe.owned).toEqual([...STARTER_WARDROBE]);
    expect(wardrobe.snapshot().look).toBeNull();
  });

  it('is created once a look is set, and saves it', () => {
    const wardrobe = new Wardrobe();
    wardrobe.setLook({ ...DEFAULT_LOOK, name: 'Her', hairStyle: 'bob' });
    expect(wardrobe.created).toBe(true);
    expect(wardrobe.snapshot().look).toMatchObject({ name: 'Her', hairStyle: 'bob' });
  });

  it('comes back from a save as it was', () => {
    const look = { ...DEFAULT_LOOK, name: 'Her', skin: 'minty' as const };
    const wardrobe = new Wardrobe({ look, wardrobe: [...STARTER_WARDROBE, 'witchHat'] });
    expect(wardrobe.created).toBe(true);
    expect(wardrobe.look.skin).toBe('minty');
    expect(wardrobe.owned).toEqual([...STARTER_WARDROBE, 'witchHat']);
    expect(wardrobe.added).toEqual([]);
  });

  it("forgets clothes this build doesn't know, and duplicates", () => {
    const saved = [...STARTER_WARDROBE, 'cape', 'jeans'] as OutfitId[];
    expect(new Wardrobe({ look: null, wardrobe: saved }).owned).toEqual([...STARTER_WARDROBE]);
  });

  it('gives a save from before them the first-day pieces it lacks, and takes nothing away', () => {
    const wardrobe = new Wardrobe({ look: null, wardrobe: ['jeans', 'witchHat'] });
    expect(wardrobe.owned.slice(0, 2)).toEqual(['jeans', 'witchHat']);
    expect(wardrobe.added).toEqual(STARTER_WARDROBE.filter((id) => id !== 'jeans'));
    expect(new Set(wardrobe.owned)).toEqual(new Set([...STARTER_WARDROBE, 'witchHat']));
  });

  it('adds nothing to a new game', () => {
    expect(new Wardrobe().added).toEqual([]);
  });
});
