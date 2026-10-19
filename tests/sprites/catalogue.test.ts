import { describe, expect, it } from 'vitest';
import { catalogue, GALLERY_PAGE_ROWS, pageOf } from '../../src/sprites/catalogue';

describe('the catalogue', () => {
  const entries = catalogue();

  it('names every sprite once', () => {
    const names = entries.map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
  });

  // Every sprite in the game takes about 4 s on a 2-core container; give it room under load.
  it('draws every sprite, with something to see in it', { timeout: 20_000 }, () => {
    for (const entry of entries) {
      const raster = entry.draw();
      expect(raster.width * raster.height, entry.name).toBeGreaterThan(0);
      const seen = raster.data.some((v, i) => i % 4 === 3 && v > 0);
      expect(seen, entry.name).toBe(true);
    }
  });

  it('pages the gallery: every sprite once, in order, a fixed number a page', () => {
    const { pages } = pageOf(entries, null);
    expect(pageOf(entries, null).entries.map((e) => e.name)).toEqual(entries.map((e) => e.name));
    expect(pages).toBe(Math.ceil(entries.length / GALLERY_PAGE_ROWS));
    const paged = [];
    for (let page = 1; page <= pages; page++) {
      const shown = pageOf(entries, page).entries;
      if (page < pages) expect(shown).toHaveLength(GALLERY_PAGE_ROWS);
      paged.push(...shown.map((e) => e.name));
    }
    expect(paged).toEqual(entries.map((e) => e.name));
    expect(pageOf(entries, pages + 1).entries).toEqual([]);
  });
});
