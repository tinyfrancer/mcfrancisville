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
    const wardrobe = new Wardrobe({ look, wardrobe: ['jeans', 'cozyTee'] });
    expect(wardrobe.created).toBe(true);
    expect(wardrobe.look.skin).toBe('minty');
    expect(wardrobe.owned).toEqual(['jeans', 'cozyTee']);
  });

  it("forgets clothes this build doesn't know, and duplicates", () => {
    const saved = ['jeans', 'cape', 'jeans'] as OutfitId[];
    expect(new Wardrobe({ look: null, wardrobe: saved }).owned).toEqual(['jeans']);
  });
});
