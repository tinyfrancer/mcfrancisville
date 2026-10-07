import { describe, expect, it } from 'vitest';
import {
  colourList,
  DEFAULT_LOOK,
  FABRICS,
  OUTFITS,
  recolours,
  STARTER_WARDROBE,
} from '../../src/data/outfits';
import type { OutfitId } from '../../src/types/ids';
import { FABRIC_TONES } from '../../src/sprites/lookColours';
import { repairLook } from '../../src/systems/wardrobe';

const IDS = Object.keys(OUTFITS) as OutfitId[];

describe('the outfits', () => {
  it('each come in the colours that suit it, every one a fabric that can be drawn', () => {
    for (const id of IDS) {
      const { fabrics } = OUTFITS[id];
      expect(fabrics.length, id).toBeGreaterThan(0);
      for (const f of fabrics) {
        expect(FABRICS[f], `${id} ${f}`).toBeDefined();
        expect(FABRIC_TONES[f], `${id} ${f}`).toBeDefined();
      }
    }
  });

  it('put the bat wings in red first, as she asked (decision 275)', () => {
    expect(OUTFITS.batWings.fabrics[0]).toBe('scarlet');
    expect(colourList('batWings')).toMatch(/^scarlet, /);
  });

  it('keep her first look in its own colours: Scream Dion in blue', () => {
    for (const worn of Object.values(DEFAULT_LOOK.outfit)) {
      expect(OUTFITS[worn.id].fabrics, worn.id).toContain(worn.fabric);
    }
    expect(OUTFITS.teeScreamDion.fabrics[0]).toBe('blue');
  });

  it('no longer put everything in blue: most pieces that recolour come first in something else', () => {
    const BLUES = ['blue', 'navy', 'sky', 'denim'];
    const recolouring = IDS.filter(recolours);
    const blueFirst = recolouring.filter((id) => BLUES.includes(OUTFITS[id].fabrics[0]!));
    expect(blueFirst.length).toBeLessThan(recolouring.length / 4);
  });

  it('are fixed exactly when they come in one colour', () => {
    for (const id of IDS) {
      expect(OUTFITS[id].fixed === true, id).toBe(OUTFITS[id].fabrics.length === 1);
    }
  });

  it("keep the jerseys in their team colours, Cody's tee in his, her gloves pink and her sweatpants black", () => {
    expect(OUTFITS.jerseyTigers.fabrics).toEqual(['pumpkin']);
    expect(OUTFITS.jerseyScarlet.fabrics).toEqual(['scarlet']);
    expect(OUTFITS.maroonTee.fabrics).toEqual(['maroon']);
    expect(OUTFITS.gardenGloves.fabrics).toEqual(['rose']);
    expect(OUTFITS.sweatpants.fabrics).toEqual(['ink']);
    expect(IDS.filter((id) => !recolours(id))).toEqual([
      'jerseyTigers',
      'jerseyScarlet',
      'maroonTee',
      'sweatpants',
      'gardenGloves',
      'scarahHat',
    ]);
  });

  it('name their colours as she would say them', () => {
    expect(colourList('teeGhoulyParton')).toBe('rose, cream, lavender or sky');
    expect(colourList('cutoffs')).toBe('denim or sky');
    expect(colourList('jerseyTigers')).toBe('pumpkin');
  });

  it('list each colour once', () => {
    for (const [id, row] of Object.entries(OUTFITS)) {
      expect(new Set(row.fabrics).size, id).toBe(row.fabrics.length);
    }
  });

  it('only call a top a dress', () => {
    for (const [id, row] of Object.entries(OUTFITS)) {
      if (row.dress) expect(row.slot, id).toBe('top');
    }
  });

  it('start her in clothes she owns, which need no repair', () => {
    expect(repairLook(DEFAULT_LOOK, STARTER_WARDROBE)).toEqual(DEFAULT_LOOK);
  });

  it('only call shoes fancy, and have plenty of fancy ones', () => {
    const fancy = Object.values(OUTFITS).filter((o) => o.fancy);
    for (const row of fancy) expect(row.slot, row.name).toBe('shoes');
    expect(fancy.length).toBeGreaterThanOrEqual(6);
  });

  it('start her closet with what she owns on day one, and nothing twice', () => {
    expect(new Set(STARTER_WARDROBE).size).toBe(STARTER_WARDROBE.length);
    expect(STARTER_WARDROBE).not.toContain('glitterHeels');
    expect(STARTER_WARDROBE.length).toBeLessThan(Object.keys(OUTFITS).length);
  });

  it('give her a few band tees, jeans, a jersey and a couple of dresses on day one', () => {
    const starters = STARTER_WARDROBE.map((id) => OUTFITS[id]);
    expect(starters.filter((o) => o.name.endsWith(' tee') && o.name !== 'Cozy tee').length).toBe(4);
    expect(STARTER_WARDROBE).toContain('jeans');
    expect(STARTER_WARDROBE).toContain('jerseyTigers');
    expect(starters.filter((o) => o.dress).length).toBeGreaterThanOrEqual(2);
  });

  it('give her something for every day in every slot, her gloves, comfy shirt and sweatpants', () => {
    const slots = new Set(STARTER_WARDROBE.map((id) => OUTFITS[id].slot));
    expect([...slots].sort()).toEqual(
      ['bottom', 'glasses', 'gloves', 'hat', 'necklace', 'shoes', 'top'].sort(),
    );
    expect(STARTER_WARDROBE).toContain('gardenGloves');
    expect(STARTER_WARDROBE).toContain('comfyShirt');
    expect(STARTER_WARDROBE).toContain('sweatpants');
    expect(STARTER_WARDROBE.length).toBeGreaterThanOrEqual(34);
  });
});
