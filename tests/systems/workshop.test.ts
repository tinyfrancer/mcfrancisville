import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import { SHOPS } from '../../src/data/shop';
import { BOOK_GROUPS, BOOK_MARKUP, WORKSHOP_PIECES } from '../../src/data/workshop';
import { YARD_WARES } from '../../src/data/yard';
import { priceOf, stockOf } from '../../src/systems/shop';
import { bookGroupOf, bookPages, bookPrice } from '../../src/systems/workshop';
import type { FurnitureId } from '../../src/types/ids';

const ALL = Object.keys(FURNITURE) as FurnitureId[];

describe("Gourdon's book", () => {
  it('has every piece a shop sells, and nothing given, kept or made', () => {
    const pages = bookPages().map((p) => p.piece);
    for (const id of ALL) {
      expect(pages.includes(id), id).toBe(FURNITURE[id].price !== undefined);
    }
    // H5's pieces for the yard are in it, on its yard page.
    for (const id of YARD_WARES) expect(bookGroupOf(id), id).toBe('yard');
  });

  it('asks the shelf price and a quarter more, never less', () => {
    for (const page of bookPages()) {
      const shelf = priceOf({ furniture: page.piece });
      expect(page.price, page.piece).toBeGreaterThanOrEqual(shelf * (1 + BOOK_MARKUP));
      expect(page.price, page.piece).toBeLessThan(shelf * (1 + BOOK_MARKUP) + 1);
    }
    expect(bookPrice('pumpkinChair')).toBe(438);
    expect(bookPrice('ghostStories')).toBeNull();
  });

  it('puts every page under one of its groups', () => {
    const groups = new Set(BOOK_GROUPS.map((g) => g.id));
    for (const page of bookPages()) expect(groups.has(page.group), page.piece).toBe(true);
    expect(bookGroupOf('ghostPortrait')).toBe('wall');
    expect(bookGroupOf('skullMug')).toBe('small');
    expect(bookGroupOf('batBed')).toBe('floor');
  });
});

describe('fresh from the bench', () => {
  it('is three pieces a day from everything he makes, at the shelf price', () => {
    const days = ['2026-10-05', '2026-10-06', '2026-10-07'];
    const dealt = days.map((day) => stockOf('workshop', day));
    for (const shelves of dealt) {
      expect(shelves).toHaveLength(SHOPS.workshop.shelves.length);
      const offers = shelves[0]!.offers;
      expect(offers).toHaveLength(3);
      for (const offer of offers) {
        expect('furniture' in offer.ware && WORKSHOP_PIECES.includes(offer.ware.furniture)).toBe(
          true,
        );
        expect(offer.price).toBe(priceOf(offer.ware));
      }
    }
    // The same all day, and new the next.
    expect(stockOf('workshop', days[0]!, 'evening')).toEqual(dealt[0]);
    expect(dealt[1]).not.toEqual(dealt[0]);
  });
});
