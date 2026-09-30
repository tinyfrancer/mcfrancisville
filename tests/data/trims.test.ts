import { describe, expect, it } from 'vitest';
import { BAR_TRIMS, trimOn } from '../../src/data/trims';

describe("the top bar's little seasonal touch", () => {
  it('has one for every month', () => {
    expect(BAR_TRIMS).toHaveLength(12);
    for (const trim of BAR_TRIMS) expect(trim.icon.length).toBeGreaterThan(0);
  });

  it('is a pumpkin all October, and a little tree in December', () => {
    expect(trimOn('2026-10-01').icon).toBe('🎃');
    expect(trimOn('2026-10-31').icon).toBe('🎃');
    expect(trimOn('2026-12-24').icon).toBe('🎄');
    expect(trimOn('2027-01-01').icon).toBe('❄️');
  });
});
