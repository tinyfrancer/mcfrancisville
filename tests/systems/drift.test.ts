import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS, flies } from '../../src/data/critters';
import { CREEP_TILES, drifts, driftTo, NOTICE_TILES, startles } from '../../src/systems/drift';

/*
 * V1's R6a (decision 316): the rare critters and the finer moths drift a tile away from her when
 * she rushes up, and settle; creeping up, or coming up behind a flier, she isn't noticed.
 */

describe('which critters are shy', () => {
  it('the rare and legendary ones, and the moths finer than common; never a common one', () => {
    for (const id of CRITTER_IDS) {
      const row = CRITTERS[id];
      if (row.rarity === 'common') expect(drifts(id), id).toBe(false);
      if (row.family === 'fish' || row.family === 'crawly') expect(drifts(id), id).toBe(false);
    }
    expect(drifts('lunaMoth')).toBe(true);
    expect(drifts('vampireBat')).toBe(true);
    expect(drifts('owlEyeMoth')).toBe(true);
    expect(drifts('orbPair')).toBe(true);
    expect(drifts('candleMoth')).toBe(false);
    expect(drifts('greenOrb')).toBe(false);
  });

  it('legendary ones are wary two or three times on the net, the commons not at all', () => {
    for (const id of CRITTER_IDS) {
      const row = CRITTERS[id];
      if (row.rarity === 'common') expect(row.wary, id).toBe(0);
      if (row.rarity === 'legendary' && row.family !== 'fish') {
        expect(row.wary, id).toBeGreaterThanOrEqual(2);
        expect(row.wary, id).toBeLessThanOrEqual(3);
      }
    }
  });
});

describe('noticing her', () => {
  const at = { tx: 10, ty: 10 };
  const rushed = CREEP_TILES + 3;
  it('when she rushes up from across the way, within a couple of tiles', () => {
    expect(startles('vampireBat', at, { her: { tx: 10, ty: 12 }, walked: rushed })).toBe(true);
    expect(startles('axolotl', at, { her: { tx: 10, ty: 11 }, walked: rushed })).toBe(true);
    // Not yet near enough to notice.
    const far = { tx: 10, ty: 10 + NOTICE_TILES + 1 };
    expect(startles('vampireBat', at, { her: far, walked: rushed })).toBe(false);
  });

  it('never when she creeps up, having stopped a few tiles away', () => {
    const her = { tx: 10, ty: 11 };
    expect(startles('vampireBat', at, { her, walked: CREEP_TILES })).toBe(false);
    expect(startles('vampireBat', at, { her, walked: 0.5 })).toBe(false);
  });

  it('never a flier she comes up behind, from the north, where its back is', () => {
    expect(flies('lunaMoth')).toBe(true);
    expect(startles('lunaMoth', at, { her: { tx: 10, ty: 9 }, walked: rushed })).toBe(false);
    expect(startles('lunaMoth', at, { her: { tx: 11, ty: 9 }, walked: rushed })).toBe(false);
    expect(startles('lunaMoth', at, { her: { tx: 10, ty: 11 }, walked: rushed })).toBe(true);
    expect(startles('lunaMoth', at, { her: { tx: 8, ty: 10 }, walked: rushed })).toBe(true);
    // Along a row above it, but more to its side than behind it: seen.
    expect(startles('lunaMoth', at, { her: { tx: 12, ty: 9 }, walked: rushed })).toBe(true);
    // A frog sees her coming from anywhere.
    expect(startles('axolotl', at, { her: { tx: 10, ty: 9 }, walked: rushed })).toBe(true);
  });

  it('never a common critter, however she comes', () => {
    expect(startles('candleMoth', at, { her: { tx: 11, ty: 11 }, walked: 30 })).toBe(false);
  });
});

describe('drifting off', () => {
  it('a tile, away from her, onto a free tile; nowhere if none is free', () => {
    const at = { tx: 10, ty: 10 };
    const to = driftTo(at, { tx: 10, ty: 12 }, () => true)!;
    expect(Math.max(Math.abs(to.tx - 10), Math.abs(to.ty - 10))).toBe(1);
    expect(to.ty).toBe(9);
    const sideways = driftTo(at, { tx: 8, ty: 10 }, (t) => t.tx !== 11 || t.ty !== 10)!;
    expect(sideways.tx).toBe(11);
    expect(driftTo(at, { tx: 10, ty: 12 }, () => false)).toBeNull();
  });
});
