import { describe, expect, it } from 'vitest';
import {
  GOOSE_HOLIDAYS,
  GOOSE_MONTHS,
  GOOSE_OUTFITS,
  type GooseOutfit,
} from '../../src/data/geese';
import { DECOR_IDS } from '../../src/data/holidays';
import { gooseOn } from '../../src/systems/holidays';
import { GOOSE_ART } from '../../src/sprites/geese';
import { harness } from './harness';

describe('the porch geese', () => {
  it('dress for the month, for October as the festival, and for a holiday while it is up', () => {
    expect(gooseOn('2026-09-26', 0)).toBe('scarf');
    expect(gooseOn('2026-10-05', 0)).toBe('witch');
    expect(gooseOn('2026-10-05', 1)).toBe('ghost');
    expect(gooseOn('2026-12-24', 0)).toBe('santa');
    expect(gooseOn('2026-12-24', 1)).toBe('antlers');
    expect(gooseOn('2027-02-14', 0)).toBe('hearts');
    expect(gooseOn('2027-07-15', 0)).toBe('sunhat');
    expect(GOOSE_MONTHS).toHaveLength(12);
  });

  it('has art and a line for hers and for Barty’s in every outfit they wear', () => {
    const worn = new Set<GooseOutfit>([
      ...GOOSE_MONTHS.flat(),
      ...DECOR_IDS.flatMap((id) => GOOSE_HOLIDAYS[id]),
    ]);
    for (const outfit of worn) {
      expect(GOOSE_ART[outfit].source.rows.length, outfit).toBeGreaterThan(0);
      expect(GOOSE_OUTFITS[outfit][0]).toMatch(/goose/);
      expect(GOOSE_OUTFITS[outfit][1]).toMatch(/^Barty's goose/);
    }
  });

  it('say what they have on when she walks up, hers and then Barty’s', () => {
    const h = harness();
    const geese = h.world.map.props.filter((p) => p.id === 'goose');
    expect(geese).toHaveLength(2);
    for (const [whose, goose] of geese.entries()) {
      h.world.tapTile(goose.tx, goose.ty);
      const events = [...h.tick(1), ...h.until(() => !h.world.movement.walking, 'walking up')];
      const arrived = events.find((e) => e.kind === 'arrived' && e.at === 'goose');
      expect(arrived).toMatchObject({ says: GOOSE_OUTFITS.scarf[whose] });
    }
  });
});
