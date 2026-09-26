import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, STARTER_WARDROBE } from '../../src/data/outfits';
import { cleanName, repairLook, takeOff, wear } from '../../src/systems/wardrobe';
import type { Look } from '../../src/types/look';

const OWNED = STARTER_WARDROBE;

describe('wear', () => {
  it('puts a piece on in its slot, in the colour it comes in', () => {
    const look = wear(DEFAULT_LOOK, 'cozyTee', OWNED);
    expect(look.outfit.top).toEqual({ id: 'cozyTee', fabric: 'cream' });
    expect(look.outfit.bottom).toEqual(DEFAULT_LOOK.outfit.bottom);
  });

  it('keeps the colour she already wears it in, unless she picks another', () => {
    const blue = wear(DEFAULT_LOOK, 'cozyTee', OWNED, 'blue');
    expect(wear(blue, 'cozyTee', OWNED).outfit.top?.fabric).toBe('blue');
    expect(wear(blue, 'cozyTee', OWNED, 'moss').outfit.top?.fabric).toBe('moss');
  });

  it("ignores a colour the piece doesn't come in", () => {
    expect(wear(DEFAULT_LOOK, 'jeans', OWNED, 'pumpkin').outfit.bottom?.fabric).toBe('denim');
  });

  it('takes the bottom off under a dress, and swaps the dress for a top under a bottom', () => {
    const dressed = wear(DEFAULT_LOOK, 'wednesdayDress', OWNED);
    expect(dressed.outfit.top?.id).toBe('wednesdayDress');
    expect(dressed.outfit.bottom).toBeUndefined();
    const skirted = wear(dressed, 'pleatedSkirt', OWNED);
    expect(skirted.outfit.bottom?.id).toBe('pleatedSkirt');
    expect(skirted.outfit.top?.id).toBe('teeGhoulyParton');
  });

  it('keeps the dress when she owns no top to change into', () => {
    const dressed = wear(DEFAULT_LOOK, 'sundressFloral', OWNED);
    expect(wear(dressed, 'jeans', ['sundressFloral', 'jeans'])).toBe(dressed);
  });
});

describe('takeOff', () => {
  it('bares an optional slot, and never the top or bottom', () => {
    expect(takeOff(DEFAULT_LOOK, 'necklace').outfit.necklace).toBeUndefined();
    expect(takeOff(DEFAULT_LOOK, 'top')).toBe(DEFAULT_LOOK);
    expect(takeOff(DEFAULT_LOOK, 'bottom')).toBe(DEFAULT_LOOK);
  });
});

describe('repairLook', () => {
  it('passes a good look through', () => {
    const look = { ...DEFAULT_LOOK, name: 'Her' };
    expect(repairLook(look, OWNED)).toEqual(look);
  });

  it("swaps anything this build doesn't know for the default's", () => {
    const later = {
      ...DEFAULT_LOOK,
      skin: 'glittery',
      hairStyle: 'mohawk',
      tattoos: 'dragon',
      outfit: { top: { id: 'cape', fabric: 'gold' }, shoes: { id: 'sneakers', fabric: 'gold' } },
    } as unknown as Look;
    const repaired = repairLook(later, OWNED);
    expect(repaired.skin).toBe(DEFAULT_LOOK.skin);
    expect(repaired.hairStyle).toBe(DEFAULT_LOOK.hairStyle);
    expect(repaired.tattoos).toBe(DEFAULT_LOOK.tattoos);
    expect(repaired.outfit.top).toEqual(DEFAULT_LOOK.outfit.top);
    expect(repaired.outfit.bottom).toEqual(DEFAULT_LOOK.outfit.bottom);
    expect(repaired.outfit.shoes).toEqual({ id: 'sneakers', fabric: 'cream' });
  });

  it("takes off what she doesn't own, or what is in the wrong slot", () => {
    const look = {
      ...DEFAULT_LOOK,
      outfit: { ...DEFAULT_LOOK.outfit, hat: { id: 'jeans', fabric: 'denim' } },
    } as Look;
    expect(repairLook(look, OWNED).outfit.hat).toBeUndefined();
    expect(repairLook(DEFAULT_LOOK, ['jeans']).outfit.necklace).toBeUndefined();
  });

  it('leaves no bottom under a dress', () => {
    const look = {
      ...DEFAULT_LOOK,
      outfit: { ...DEFAULT_LOOK.outfit, top: { id: 'sundressGingham', fabric: 'coral' } },
    } as Look;
    expect(repairLook(look, OWNED).outfit.bottom).toBeUndefined();
  });
});

describe('cleanName', () => {
  it('trims, squashes spaces, and stops at sixteen letters', () => {
    expect(cleanName('  Mrs   Francis ')).toBe('Mrs Francis');
    expect(cleanName('   ')).toBe('');
    expect(cleanName('A'.repeat(40))).toHaveLength(16);
  });
});
