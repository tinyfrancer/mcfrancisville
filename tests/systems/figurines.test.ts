import { describe, expect, it } from 'vitest';
import {
  CARVABLE,
  CARVE_COUNT,
  carvedKindOf,
  FIGURINE_FURNITURE,
  FIGURINE_IDS,
  figurineOf,
  SQUISHY_IDS,
} from '../../src/data/figurines';
import { CRITTER_IDS } from '../../src/data/critters';
import { FOSSIL_IDS } from '../../src/data/fossils';
import { FURNITURE } from '../../src/data/furniture';
import { ITEMS } from '../../src/data/items';
import { SMALL } from '../../src/data/tabletop';
import { WORKSHOP_PIECES } from '../../src/data/workshop';
import { FURNITURE_ART } from '../../src/sprites/furniture';
import { spriteSize } from '../../src/sprites/sprite';
import { canCarve, carvedFrom, carvingsFrom, isFigurine } from '../../src/systems/figurines';
import { shelfOf } from '../../src/systems/milestones';
import { MILESTONES } from '../../src/data/milestones';
import type { ItemId } from '../../src/types/ids';

describe("Gourdon's figurines (0.3's C3)", () => {
  it('has one for every critter, squishy, doll and fossil, made from its row', () => {
    const kinds = (kind: string) =>
      (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === kind);
    expect([...SQUISHY_IDS].sort()).toEqual(kinds('squishy').sort());
    expect(CARVABLE).toEqual([...CRITTER_IDS, ...SQUISHY_IDS, ...kinds('doll'), ...FOSSIL_IDS]);
    expect(Object.keys(FIGURINE_FURNITURE)).toEqual(FIGURINE_IDS);
    expect(FIGURINE_IDS).toHaveLength(70 + 8 + 8 + 12);
    for (const thing of CARVABLE) {
      const id = figurineOf(thing);
      expect(FURNITURE[id].name, id).toBe(`${ITEMS[thing].name} figurine`);
      expect(carvedFrom(id)).toBe(thing);
      expect(isFigurine(id)).toBe(true);
    }
    expect(carvedKindOf('lunaMoth')).toBe('critter');
    expect(carvedKindOf('booKoi')).toBe('critter');
    expect(carvedKindOf('booBao')).toBe('squishy');
    expect(carvedKindOf('witchDoll')).toBe('doll');
    expect(carvedKindOf('dragonEgg')).toBe('fossil');
    expect(isFigurine('batBed')).toBe(false);
    expect(carvedFrom('batBed')).toBeNull();
  });

  it('gives none a price, so none is on his bench or in his book, and every one goes on a table', () => {
    for (const id of [...FIGURINE_IDS, 'carvedGourdon' as const]) {
      expect(FURNITURE[id].price, id).toBeUndefined();
      expect(WORKSHOP_PIECES, id).not.toContain(id);
      expect(SMALL.has(id), id).toBe(true);
    }
  });

  it('draws each one a tile wide, standing on its plinth, never taller than a tile', () => {
    for (const id of [...FIGURINE_IDS, 'carvedGourdon' as const]) {
      const art = FURNITURE_ART[id];
      expect(spriteSize(art.source), id).toEqual({ width: 32, height: 32 });
      for (const row of art.source.rows) {
        for (const k of row) expect(k === '.' || k in art.palette, `${id} key ${k}`).toBe(true);
      }
    }
  });

  it('carves one from three, and lists only what she has', () => {
    expect(canCarve(CARVE_COUNT - 1)).toBe(false);
    expect(canCarve(CARVE_COUNT)).toBe(true);
    const have: Partial<Record<ItemId, number>> = { firefly: 4, trilobite: 1, wood: 9 };
    expect(carvingsFrom((id) => have[id] ?? 0)).toEqual([
      { thing: 'firefly', figurine: 'fireflyFigurine', kind: 'critter', have: 4 },
      { thing: 'trilobite', figurine: 'trilobiteFigurine', kind: 'fossil', have: 1 },
    ]);
  });

  it('fills the Every figurine shelf with every figurine there is', () => {
    expect(shelfOf(MILESTONES.figurines.shelf)).toEqual(FIGURINE_IDS);
    expect(MILESTONES.figurines.gift).toEqual({ furniture: 'carvedGourdon' });
  });
});
