import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import { SET_WARES, SUITES } from '../../src/data/sets';
import { isSmall, isSurface, surfaceTop } from '../../src/data/tabletop';
import { bookPages } from '../../src/systems/workshop';
import { FURNITURE_ART } from '../../src/sprites/furniture';
import { spriteSize } from '../../src/sprites/sprite';

describe("the furniture sets (0.3's S3 and S4)", () => {
  it('has eight sets of six to eight pieces, every piece in one set only', () => {
    expect(Object.keys(SUITES)).toHaveLength(8);
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

  it('has tables, counters and benches in the sets, and small things for them', () => {
    expect(SET_WARES.filter(isSurface)).toEqual(
      expect.arrayContaining([
        'cosyCounter',
        'vanity',
        'nightstand',
        'libraryDesk',
        'washstand',
        'pottingTable',
        'clawTable',
      ]),
    );
    expect(SET_WARES.filter(isSmall)).toEqual(
      expect.arrayContaining([
        'copperKettle',
        'tasselLamp',
        'bankersLamp',
        'brassGlobe',
        'rubberDuck',
        'wateringCan',
        'microphone',
        'loungeCandelabra',
      ]),
    );
  });

  it('gives the music corner, the garden room and the lounge somewhere to sit', () => {
    for (const id of ['wickerChair', 'coffinSofa'] as const)
      expect(FURNITURE[id].seat, id).toBeDefined();
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
