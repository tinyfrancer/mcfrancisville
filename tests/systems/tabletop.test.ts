import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import { ROOM, type Placed } from '../../src/data/home';
import { SMALL, SURFACES, isSmall, isSurface, surfaceTop } from '../../src/data/tabletop';
import { refusal, riderAt, ridersOf, surfaceAt } from '../../src/systems/decor';
import { FURNITURE_ART } from '../../src/sprites/furniture';
import { spriteSize } from '../../src/sprites/sprite';
import type { FurnitureId } from '../../src/types/ids';

const at = (id: FurnitureId, tx: number, ty: number, on = false): Placed =>
  on ? { id, tx, ty, turn: 0, on: true } : { id, tx, ty, turn: 0 };

const TABLE = at('teaTable', 5, 6);

describe('what goes on tables (0.3’s H3)', () => {
  it('has surfaces one tile deep, the same footprint every way round, their top on their art', () => {
    for (const id of Object.keys(SURFACES) as FurnitureId[]) {
      const row = FURNITURE[id];
      expect(row.layer, id).toBe('floor');
      expect(row.size.h, id).toBe(1);
      expect(row.turns, id).not.toBe('four');
      const { height } = spriteSize(FURNITURE_ART[id].source);
      expect(surfaceTop(id), id).toBeGreaterThan(0);
      expect(surfaceTop(id), id).toBeLessThan(height);
    }
  });

  it('has small pieces of one tile that stand, none of them a surface', () => {
    for (const id of SMALL) {
      expect(FURNITURE[id].layer, id).toBe('floor');
      expect(FURNITURE[id].size, id).toEqual({ w: 1, h: 1 });
      expect(isSurface(id), id).toBe(false);
      expect(FURNITURE[id].planter, id).toBeUndefined();
      expect(FURNITURE[id].seat, id).toBeUndefined();
    }
    expect(isSmall('skullMug')).toBe(true);
    expect(isSmall('batBed')).toBe(false);
  });

  it('lets a small piece stand on each tile of a surface, one to a tile', () => {
    expect(refusal(ROOM, [TABLE], at('skullMug', 5, 6, true), null)).toBeNull();
    expect(refusal(ROOM, [TABLE], at('skullMug', 6, 6, true), null)).toBeNull();
    const mug = at('skullMug', 5, 6, true);
    expect(refusal(ROOM, [TABLE, mug], at('hourglass', 5, 6, true), null)).toBe('noRoom');
    expect(refusal(ROOM, [TABLE, mug], at('hourglass', 6, 6, true), null)).toBeNull();
  });

  it('keeps big pieces off a surface, and small ones from standing on nothing', () => {
    expect(refusal(ROOM, [TABLE], at('cauldron', 5, 6, true), null)).toBe('noRoom');
    expect(refusal(ROOM, [TABLE], at('skullMug', 7, 6, true), null)).toBe('noRoom');
    expect(refusal(ROOM, [at('cauldron', 7, 6)], at('skullMug', 7, 6, true), null)).toBe('noRoom');
    // On the floor, under the table, there's no room either.
    expect(refusal(ROOM, [TABLE], at('skullMug', 5, 6), null)).toBe('noRoom');
  });

  it('never minds her standing beside a table, and a mug on it walls nobody in', () => {
    expect(refusal(ROOM, [TABLE], at('skullMug', 5, 6, true), { tx: 5, ty: 7 })).toBeNull();
  });

  it('lets a surface move over the tiles its own things stand on', () => {
    const mug = at('skullMug', 5, 6, true);
    expect(refusal(ROOM, [mug], at('teaTable', 4, 6), null)).toBeNull();
  });

  it('finds what stands on what', () => {
    const mug = at('skullMug', 6, 6, true);
    const placed = [TABLE, mug, at('cauldron', 2, 8)];
    expect(surfaceAt(placed, 6, 6)).toBe(TABLE);
    expect(surfaceAt(placed, 2, 8)).toBeUndefined();
    expect(riderAt(placed, 6, 6)).toBe(mug);
    expect(riderAt(placed, 5, 6)).toBeUndefined();
    expect(ridersOf(placed, TABLE)).toEqual([mug]);
  });
});
