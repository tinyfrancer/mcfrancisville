import { describe, expect, it } from 'vitest';
import { readCloseness, VIEW_KEY, writeCloseness } from '../src/settings';

describe('how close the camera is (decision 290)', () => {
  it('starts Close, and remembers Far on this phone', () => {
    localStorage.removeItem(VIEW_KEY);
    expect(readCloseness()).toBe('close');
    writeCloseness('far');
    expect(readCloseness()).toBe('far');
    writeCloseness('close');
    expect(readCloseness()).toBe('close');
  });

  it('reads anything it does not know as Close', () => {
    localStorage.setItem(VIEW_KEY, 'zoomed');
    expect(readCloseness()).toBe('close');
    localStorage.removeItem(VIEW_KEY);
  });

  it('opens Close on a phone that will not keep it', () => {
    const broken = {
      getItem: () => {
        throw new Error('no');
      },
      setItem: () => {
        throw new Error('no');
      },
    } as unknown as Storage;
    expect(() => writeCloseness('far', broken)).not.toThrow();
    expect(readCloseness(broken)).toBe('close');
  });
});
