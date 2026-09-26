import { describe, expect, it } from 'vitest';
import { FABRICS, DEFAULT_LOOK, OUTFITS, STARTER_WARDROBE } from '../../src/data/outfits';
import { repairLook } from '../../src/systems/wardrobe';

describe('the outfits', () => {
  it('each come in a blue, her favourite colour', () => {
    for (const [id, row] of Object.entries(OUTFITS)) {
      expect(
        row.fabrics.some((f) => FABRICS[f].blue),
        id,
      ).toBe(true);
    }
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

  it('give her a few band tees, jeans, a jersey and a couple of dresses on day one', () => {
    const starters = STARTER_WARDROBE.map((id) => OUTFITS[id]);
    expect(starters.filter((o) => o.name.endsWith(' tee') && o.name !== 'Cozy tee').length).toBe(4);
    expect(STARTER_WARDROBE).toContain('jeans');
    expect(STARTER_WARDROBE).toContain('jerseyTigers');
    expect(starters.filter((o) => o.dress).length).toBeGreaterThanOrEqual(2);
  });
});
