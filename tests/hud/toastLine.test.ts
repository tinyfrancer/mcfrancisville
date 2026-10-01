import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TOAST_MAX_MS, TOAST_MIN_MS, toastLine, toastMs } from '../../src/hud/ToastLine';

describe('how long a toast stays', () => {
  it('is never under three seconds, and longer the more it says', () => {
    expect(toastMs({ text: 'Hi!' })).toBe(TOAST_MIN_MS);
    const short = toastMs({ text: 'You picked 2 roses.' });
    const long = toastMs({
      text: 'The creek here is frozen solid, and slippery as anything. A pair of skates would do it!',
    });
    expect(short).toBeGreaterThanOrEqual(TOAST_MIN_MS);
    expect(long).toBeGreaterThan(short);
    expect(long).toBeGreaterThan(6000);
    expect(toastMs({ text: 'boo '.repeat(200) })).toBe(TOAST_MAX_MS);
  });
});

describe('the toast line', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const make = () => {
    const hud = document.createElement('div');
    const line = toastLine(hud);
    hud.append(line.element);
    const shown = () => line.element.classList.contains('hud-toast-shown');
    return { line, shown };
  };

  it('stays for as long as it takes to read', () => {
    const { line, shown } = make();
    const toast = { text: 'Wybie has the zoomies again, round and round the chest of drawers!' };
    line.show(toast);
    vi.advanceTimersByTime(toastMs(toast) - 1);
    expect(shown()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(shown()).toBe(false);
  });

  it('goes at a tap, which it keeps from the world under it', () => {
    const { line, shown } = make();
    line.show({ text: 'You picked 2 roses.' });
    const tap = new Event('pointerdown', { bubbles: true, cancelable: true });
    line.element.dispatchEvent(tap);
    expect(shown()).toBe(false);
    expect(tap.defaultPrevented).toBe(true);
  });

  it('lets a waiting big moment have its turn once the first is tapped away', () => {
    const { line, shown } = make();
    line.show({ text: 'You found Whisperwood!', special: true });
    line.show({ text: 'A letter from Cody!', special: true });
    expect(line.element.textContent).toMatch(/Whisperwood/);
    line.element.dispatchEvent(new Event('pointerdown', { cancelable: true }));
    expect(shown()).toBe(true);
    expect(line.element.textContent).toMatch(/Cody/);
  });
});
