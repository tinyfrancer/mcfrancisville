import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, OUTFITS } from '../../src/data/outfits';
import { closeUpOf, pieceBox } from '../../src/sprites/closeUp';
import { wear } from '../../src/systems/wardrobe';
import type { OutfitId } from '../../src/types/ids';

const EVERYTHING = Object.keys(OUTFITS) as OutfitId[];

function on(id: OutfitId) {
  return wear(DEFAULT_LOOK, id, EVERYTHING);
}

describe("the closet's close-ups", () => {
  it('frames a hat on the hat, not on her face', () => {
    const look = on('witchHat');
    const box = pieceBox(look, 'hat')!;
    const frame = closeUpOf(look, 'hat');
    expect(frame.size).toBe(24);
    expect(frame.y).toBeLessThanOrEqual(box.top);
    expect(frame.y + frame.size).toBeGreaterThanOrEqual(box.bottom);
  });

  it('comes close on small things and stands back for big ones', () => {
    expect(closeUpOf(on('moonLocket'), 'necklace').size).toBe(16);
    expect(closeUpOf(on('maryJanes'), 'shoes').size).toBe(16);
    expect(closeUpOf(on('cozyTee'), 'top').size).toBe(24);
    expect(closeUpOf(on('vampireCape'), 'outer').size).toBe(48);
  });

  it('holds every piece she wears that shows, centred on it, on her picture', () => {
    for (const id of EVERYTHING) {
      const { slot } = OUTFITS[id];
      const look = on(id);
      const box = pieceBox(look, slot);
      if (!box) continue;
      const { x, y, size } = closeUpOf(look, slot);
      const middle = (box.left + box.right + 1) / 2;
      expect(Math.abs(x + size / 2 - middle), id).toBeLessThanOrEqual(size === 48 ? 16 : 1);
      if (size < 48) {
        expect(x, id).toBeGreaterThanOrEqual(0);
        expect(x + size, id).toBeLessThanOrEqual(32);
      }
    }
  });
});
