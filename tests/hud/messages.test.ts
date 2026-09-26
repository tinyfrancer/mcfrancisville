import { describe, expect, it } from 'vitest';
import { gatherToast, quantity } from '../../src/hud/messages';

describe('what the HUD says', () => {
  it('counts things the way they are said', () => {
    expect(quantity('wood', 3)).toBe('3 wood');
    expect(quantity('forgetMeBoo', 2)).toBe('2 forget-me-boos');
    expect(quantity('ghostDaisy', 2)).toBe('2 ghost daisies');
    expect(quantity('moonpetal', 1)).toBe('1 moonpetal');
  });

  it('cheers each find', () => {
    expect(gatherToast({ kind: 'gathered', from: 'tree', item: 'wood', count: 3 })).toEqual({
      text: 'The tree shook loose 3 wood.',
    });
    expect(
      gatherToast({ kind: 'gathered', from: 'flowers', item: 'forgetMeBoo', count: 2 })?.text,
    ).toBe('You picked 2 forget-me-boos!');
  });

  it('makes a fuss over the night snack', () => {
    expect(
      gatherToast({ kind: 'gathered', from: 'snack', item: 'midnightPizza', count: 1 }),
    ).toEqual({
      text: 'Late-night snackies! A midnight pizza slice, just for you.',
      special: true,
    });
  });

  it('promises more tomorrow, never scolds', () => {
    const text = gatherToast({ kind: 'resting', from: 'tree', item: 'wood' })?.text;
    expect(text).toMatch(/tomorrow/);
  });

  it('says nothing about plain arrivals', () => {
    expect(gatherToast({ kind: 'arrived', tx: 1, ty: 1 })).toBeNull();
  });
});
