import { describe, expect, it } from 'vitest';
import { eventToast, quantity } from '../../src/hud/messages';

describe('what the HUD says', () => {
  it('counts things the way they are said', () => {
    expect(quantity('wood', 3)).toBe('3 wood');
    expect(quantity('forgetMeBoo', 2)).toBe('2 forget-me-boos');
    expect(quantity('ghostDaisy', 2)).toBe('2 ghost daisies');
    expect(quantity('moonpetal', 1)).toBe('1 moonpetal');
  });

  it('cheers each find', () => {
    expect(eventToast({ kind: 'gathered', from: 'tree', item: 'wood', count: 3 })).toEqual({
      text: 'The tree shook loose 3 wood.',
    });
    expect(
      eventToast({ kind: 'gathered', from: 'flowers', item: 'forgetMeBoo', count: 2 })?.text,
    ).toBe('You picked 2 forget-me-boos!');
  });

  it('makes a fuss over the night snack', () => {
    expect(
      eventToast({ kind: 'gathered', from: 'snack', item: 'midnightPizza', count: 1 }),
    ).toEqual({
      text: 'Late-night snackies! A midnight pizza slice, just for you.',
      special: true,
      icon: '🌙',
    });
  });

  it('promises more tomorrow, never scolds', () => {
    const text = eventToast({ kind: 'resting', from: 'tree', item: 'wood' })?.text;
    expect(text).toMatch(/tomorrow/);
  });

  it('talks her through the garden, and always says when it will be ripe', () => {
    expect(eventToast({ kind: 'planted', crop: 'spiderLily', tx: 1, ty: 1 })?.text).toBe(
      'You planted a spider lily bulb. Tap it again to water it.',
    );
    expect(eventToast({ kind: 'watered', crop: 'rose', days: 1 })?.text).toBe(
      'You watered the roses. Ripe tomorrow!',
    );
    expect(eventToast({ kind: 'growing', crop: 'ghostPepper', days: 3 })?.text).toMatch(
      /ghost peppers.*Ripe in 3 days!/,
    );
    const picked = { kind: 'harvested', crop: 'ghostPepper', seed: 'ghostPepperSeed' } as const;
    expect(eventToast({ ...picked, item: 'ghostPepper', count: 3 })?.text).toBe(
      'You picked 3 ghost peppers, and saved a seed.',
    );
  });

  it('makes a fuss over a blue rose, from a bed or the bush', () => {
    const bed = eventToast({
      kind: 'harvested',
      crop: 'rose',
      item: 'blueRose',
      count: 1,
      seed: 'roseSeed',
    });
    expect(bed?.special).toBe(true);
    expect(eventToast({ kind: 'gathered', from: 'roseBush', item: 'blueRose', count: 1 })).toEqual(
      bed,
    );
  });

  it('says nothing about plain arrivals', () => {
    expect(eventToast({ kind: 'arrived', tx: 1, ty: 1 })).toBeNull();
  });
});
