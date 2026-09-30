import { describe, expect, it } from 'vitest';
import { patchStage } from '../../src/systems/pumpkinPatch';

describe('the pumpkin patch', () => {
  it('rests outside October, and grows over the festival to ripe by the middle of it', () => {
    expect(patchStage('2026-09-30')).toBe('resting');
    expect(patchStage('2026-10-01')).toBe('sprouting');
    expect(patchStage('2026-10-07')).toBe('sprouting');
    expect(patchStage('2026-10-08')).toBe('flowering');
    expect(patchStage('2026-10-14')).toBe('flowering');
    expect(patchStage('2026-10-15')).toBe('ripe');
    expect(patchStage('2026-10-31')).toBe('ripe');
    expect(patchStage('2026-11-01')).toBe('resting');
    expect(patchStage('2027-10-20')).toBe('ripe');
  });
});
