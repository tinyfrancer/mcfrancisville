import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HELD, held, heldGap } from '../../src/hud/dom';
import { howMany } from '../../src/hud/itemCard';

const press = (b: HTMLElement, type: string) =>
  b.dispatchEvent(new PointerEvent(type, { button: 0, bubbles: true }));

/** A press, held for `ms`, and let go, as a finger would: the browser's click comes after. */
function hold(b: HTMLButtonElement, ms: number): void {
  press(b, 'pointerdown');
  vi.advanceTimersByTime(ms);
  press(b, 'pointerup');
  if (!b.disabled) b.click();
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.replaceChildren();
});
afterEach(() => vi.useRealTimers());

describe('a held button (decision 275)', () => {
  it('waits, then steps every 120 ms, easing down to every 50 ms by two seconds', () => {
    expect(heldGap(0)).toBe(HELD.delay);
    expect(heldGap(HELD.delay)).toBe(120);
    expect(heldGap(1200)).toBeLessThan(120);
    expect(heldGap(1200)).toBeGreaterThan(50);
    expect(heldGap(HELD.rampTo)).toBe(50);
    expect(heldGap(10_000)).toBe(50);
  });

  it('steps once for a tap, mouse or finger, and once for a click with no press', () => {
    const b = document.createElement('button');
    document.body.append(b);
    let n = 0;
    held(b, () => n++);
    hold(b, 100);
    expect(n).toBe(1);
    b.click();
    expect(n).toBe(2);
  });

  it('repeats while held, and stops when she lets go or slides off it', () => {
    const b = document.createElement('button');
    document.body.append(b);
    let n = 0;
    held(b, () => n++);
    press(b, 'pointerdown');
    vi.advanceTimersByTime(HELD.delay - 1);
    expect(n).toBe(1);
    vi.advanceTimersByTime(1);
    expect(n).toBe(2);
    vi.advanceTimersByTime(120);
    expect(n).toBe(3);
    press(b, 'pointerleave');
    vi.advanceTimersByTime(1000);
    expect(n).toBe(3);

    press(b, 'pointerdown');
    vi.advanceTimersByTime(3000);
    press(b, 'pointerup');
    const after = n;
    // Held three seconds: past the ramp, so well over what 120 ms steps would give.
    expect(after - 3).toBeGreaterThan(Math.floor((3000 - HELD.delay) / 120) + 1);
    vi.advanceTimersByTime(1000);
    expect(n).toBe(after);
  });

  it('ignores any button but the main one', () => {
    const b = document.createElement('button');
    document.body.append(b);
    let n = 0;
    held(b, () => n++);
    b.dispatchEvent(new PointerEvent('pointerdown', { button: 2 }));
    vi.advanceTimersByTime(1000);
    expect(n).toBe(0);
  });
});

describe('how many, held', () => {
  it('counts up past ten in a second and a half on a stack of twenty, and stops at twenty', () => {
    const pick = howMany(20, () => {});
    document.body.append(pick.element);
    const [less, , more] = [...pick.element.children] as HTMLButtonElement[];
    hold(more!, 1500);
    expect(pick.value()).toBeGreaterThan(10);
    hold(more!, 5000);
    expect(pick.value()).toBe(20);
    expect(more!.disabled).toBe(true);
    hold(less!, 5000);
    expect(pick.value()).toBe(1);
  });

  it('still counts one at a tap', () => {
    const seen: number[] = [];
    const pick = howMany(5, (n) => seen.push(n));
    document.body.append(pick.element);
    const [, , more] = [...pick.element.children] as HTMLButtonElement[];
    hold(more!, 50);
    hold(more!, 50);
    expect(seen).toEqual([2, 3]);
  });
});
