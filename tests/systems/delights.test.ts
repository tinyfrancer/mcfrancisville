import { describe, expect, it } from 'vitest';
import { CRITTERS } from '../../src/data/critters';
import { BLESS_YOU } from '../../src/data/delights';
import { PET_GIFT_IDS, PET_GIFTS } from '../../src/data/petGifts';
import { VILLAGERS } from '../../src/data/villagers';
import { isVisitDay } from '../../src/systems/critters';
import {
  blesser,
  firefliesOut,
  fliersAbout,
  flierFor,
  giftOn,
  GIFT_KEY,
  scarecrowBy,
  sneezeAfter,
  tickles,
} from '../../src/systems/delights';
import { onceADay } from '../../src/systems/gathering';
import type { PlacedProp } from '../../src/systems/grid';
import type { VillagerId } from '../../src/types/ids';

describe('a butterfly or moth on her hat (1.6’s X5)', () => {
  it('is one of the moths and butterflies about where she is, never a legendary one', () => {
    const day = '2026-09-26';
    const noon = fliersAbout('town', day, 12, 'clear');
    expect(noon).toContain('mourningCloak');
    for (const id of noon) {
      expect(CRITTERS[id].family).toBe('moth');
      expect(CRITTERS[id].rarity).not.toBe('legendary');
      expect(CRITTERS[id].where).toContain('town');
    }
    // By night the town's moths, not its butterflies.
    const night = fliersAbout('town', day, 23, 'clear');
    expect(night).toContain('ghostMoth');
    expect(night).not.toContain('mourningCloak');
    expect(fliersAbout('town', day, 23, 'clear')).not.toContain('wishingMoth');
    // Sheltering from the rain.
    expect(fliersAbout('town', day, 12, 'rain')).toEqual([]);
  });

  it('is nothing where none is about: the lake shore on an autumn evening', () => {
    let day = '2026-10-05';
    while (isVisitDay(day)) day = `2026-10-${String(Number(day.slice(8)) + 1).padStart(2, '0')}`;
    expect(fliersAbout('lanternShore', day, 19, 'clear')).toEqual([]);
    expect(flierFor([], day, 0)).toBeNull();
  });

  it('is dealt from those about, the same for the same day and turn', () => {
    const fliers = fliersAbout('town', '2026-09-26', 12, 'clear');
    const a = flierFor(fliers, '2026-09-26', 3);
    expect(fliers).toContain(a);
    expect(flierFor(fliers, '2026-09-26', 3)).toBe(a);
  });
});

describe('fireflies (1.6’s X5)', () => {
  it('gather on summer nights over grass, not in the rain, not by day, not in other seasons', () => {
    expect(firefliesOut('2026-07-10', 22, 'grass', 'clear')).toBe(true);
    expect(firefliesOut('2026-08-31', 2, 'longGrass', 'fog')).toBe(true);
    expect(firefliesOut('2026-06-01', 21, 'meadow', 'clear')).toBe(true);
    expect(firefliesOut('2026-07-10', 20, 'grass', 'clear')).toBe(false);
    expect(firefliesOut('2026-07-10', 12, 'grass', 'clear')).toBe(false);
    expect(firefliesOut('2026-07-10', 22, 'grass', 'rain')).toBe(false);
    expect(firefliesOut('2026-07-10', 22, 'path', 'clear')).toBe(false);
    expect(firefliesOut('2026-09-10', 22, 'grass', 'clear')).toBe(false);
    expect(firefliesOut('2026-05-31', 22, 'grass', 'clear')).toBe(false);
  });
});

describe('the crow on the scarecrow (1.6’s X5)', () => {
  const scarecrow: PlacedProp = { id: 'scarecrow', tx: 10, ty: 10, w: 1, h: 1 };
  it('caws at her within two tiles of it', () => {
    expect(scarecrowBy([scarecrow], { tx: 12, ty: 10 })).toBe(scarecrow);
    expect(scarecrowBy([scarecrow], { tx: 8, ty: 8 })).toBe(scarecrow);
    expect(scarecrowBy([scarecrow], { tx: 13, ty: 10 })).toBeNull();
    expect(scarecrowBy([{ ...scarecrow, id: 'tree' }], { tx: 10, ty: 11 })).toBeNull();
  });
});

describe('a sneeze in the long grass (1.6’s X5)', () => {
  it('comes from the meadow and long grass in spring only', () => {
    expect(tickles('2027-04-15', 'meadow')).toBe(true);
    expect(tickles('2027-03-01', 'longGrass')).toBe(true);
    expect(tickles('2027-04-15', 'grass')).toBe(false);
    expect(tickles('2027-06-15', 'meadow')).toBe(false);
  });

  it('comes after four to nine tickly steps, dealt by the window', () => {
    const counts = new Set<number>();
    for (let d = 1; d <= 30; d++) {
      const n = sneezeAfter(`2027-04-${String(d).padStart(2, '0')}@morning`);
      expect(n).toBeGreaterThanOrEqual(4);
      expect(n).toBeLessThanOrEqual(9);
      counts.add(n);
    }
    expect(counts.size).toBeGreaterThan(2);
  });

  it('is blessed by the nearest neighbour within four tiles', () => {
    const near = [
      { id: 'maude' as VillagerId, tile: { tx: 14, ty: 10 } },
      { id: 'barty' as VillagerId, tile: { tx: 12, ty: 11 } },
      { id: 'rufus' as VillagerId, tile: { tx: 20, ty: 10 } },
    ];
    expect(blesser(near, { tx: 10, ty: 10 })?.id).toBe('barty');
    expect(blesser(near.slice(2), { tx: 10, ty: 10 })).toBeNull();
  });

  it('has a warm bless you from every neighbour', () => {
    for (const id of Object.keys(VILLAGERS) as VillagerId[]) {
      expect(BLESS_YOU[id]).toMatch(/[Bb]less you/);
    }
  });
});

describe('Fibi’s gift (1.6’s X5)', () => {
  it('is once a day, one of her finds, none of them hers', () => {
    expect(onceADay(GIFT_KEY)).toBe(true);
    expect(PET_GIFT_IDS).toContain(giftOn('2026-10-26'));
    expect(giftOn('2026-10-26')).toBe(giftOn('2026-10-26'));
    expect(PET_GIFTS.sock.line).toBe('{name} has brought you a sock. It is not yours.');
    for (const id of PET_GIFT_IDS) expect(PET_GIFTS[id].line).toMatch(/^\{name\} has brought you/);
  });
});
