import { describe, expect, it } from 'vitest';
import { ACCESSORIES, ACCESSORY_IDS, PET_IDS } from '../../src/data/pets';
import { SHOPS } from '../../src/data/shop';
import { rasterize, spriteSize } from '../../src/sprites/sprite';
import { accessoryIcon, BUBBLE_ART, PET_ART, petPalette, petSource } from '../../src/sprites/pets';

const FRAMES = ['side0', 'side1', 'sit', 'rest'] as const;

describe('pet art', () => {
  it('draws every pet in every frame, bare and in every accessory', () => {
    for (const id of PET_IDS) {
      for (const frame of FRAMES) {
        for (const accessory of [null, ...ACCESSORY_IDS]) {
          expect(() => rasterize(petSource(id, frame), petPalette(id, accessory))).not.toThrow();
        }
      }
    }
  });

  it('keeps both walking frames the same size, so a pet does not jump as it trots', () => {
    for (const id of PET_IDS) {
      const [a, b] = PET_ART[id].side;
      expect(spriteSize(a), id).toEqual(spriteSize(b));
    }
  });

  it('shows what they wear: a worn accessory changes the picture', () => {
    for (const id of PET_IDS) {
      const bare = rasterize(petSource(id, 'side0'), petPalette(id, null)).data;
      const dressed = rasterize(petSource(id, 'side0'), petPalette(id, 'blueBandana')).data;
      expect(dressed, id).not.toEqual(bare);
    }
  });

  it('gives the ghost pets a glow, and only them', () => {
    expect(PET_IDS.filter((id) => PET_ART[id].glow)).toEqual(['wybie', 'elvira']);
  });

  it('draws every accessory and bubble on its own', () => {
    for (const id of ACCESSORY_IDS) {
      const { source, palette } = accessoryIcon(id);
      expect(() => rasterize(source, palette)).not.toThrow();
    }
    for (const art of Object.values(BUBBLE_ART)) {
      expect(() => rasterize(art.source, art.palette)).not.toThrow();
    }
  });
});

describe('accessories', () => {
  it('are all sold at Cobweb Corner, but for the ones she has from the start', () => {
    const sold = SHOPS.corner.shelves
      .flatMap((s) => s.picks.flatMap((p) => p.from))
      .flatMap((w) => ('accessory' in w ? [w.accessory] : []));
    for (const id of ACCESSORY_IDS) {
      expect(sold.includes(id), id).toBe(ACCESSORIES[id].price !== undefined);
    }
  });

  it('come in blue (personal_touches.md), with a bandana in blue for Dolly', () => {
    expect(ACCESSORIES.blueBandana.style).toBe('bandana');
    expect(ACCESSORIES.pinkSpikedCollar.style).toBe('spiked');
  });
});
