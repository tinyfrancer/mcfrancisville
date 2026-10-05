import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import { SET_WARES, SUITES } from '../../src/data/sets';
import { isSmall, isSurface, surfaceTop } from '../../src/data/tabletop';
import { bookPages } from '../../src/systems/workshop';
import { FURNITURE_ART } from '../../src/sprites/furniture';
import { spriteSize } from '../../src/sprites/sprite';

describe("the furniture sets (0.3's S3)", () => {
  it('has four sets of six to eight pieces, every piece in one set only', () => {
    expect(Object.keys(SUITES)).toHaveLength(4);
    const all = Object.values(SUITES).flatMap((s) => s.pieces);
    for (const suite of Object.values(SUITES)) {
      expect(suite.pieces.length, suite.name).toBeGreaterThanOrEqual(6);
      expect(suite.pieces.length, suite.name).toBeLessThanOrEqual(8);
    }
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual([...SET_WARES].sort());
  });

  it("prices every piece, so each is in Gourdon's book", () => {
    const book = new Set(bookPages().map((p) => p.piece));
    for (const id of SET_WARES) {
      expect(FURNITURE[id].price, id).toBeGreaterThan(0);
      expect(book.has(id), id).toBe(true);
    }
  });

  it('has a table, a counter or a desk in three of the sets, and small things for them', () => {
    expect(SET_WARES.filter(isSurface)).toEqual(
      expect.arrayContaining(['cosyCounter', 'vanity', 'nightstand', 'libraryDesk']),
    );
    expect(SET_WARES.filter(isSmall)).toEqual(
      expect.arrayContaining(['copperKettle', 'tasselLamp', 'bankersLamp', 'brassGlobe']),
    );
  });

  it("lines the kitchen's worktops up: the counter's, the sink's and the stove's", () => {
    // Each worktop's top edge, counted up from the bottom of its art, is the same.
    const edge = (id: 'cosyCounter' | 'cosySink' | 'cauldronStove') => {
      const { rows } = FURNITURE_ART[id].source;
      const { height } = spriteSize(FURNITURE_ART[id].source);
      const column = rows.map((row) => row[0]);
      return height - column.findIndex((key) => key !== '.');
    };
    expect(edge('cosySink')).toBe(edge('cosyCounter'));
    expect(edge('cauldronStove')).toBe(edge('cosyCounter'));
    expect(surfaceTop('cosyCounter')).toBeLessThan(edge('cosyCounter'));
  });
});
