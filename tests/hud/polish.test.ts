import { describe, expect, it, vi } from 'vitest';
import { COUNT_MS, countAt, countUp } from '../../src/hud/countUp';
import { heartsRow } from '../../src/hud/hearts';
import { price } from '../../src/hud/glyph';
import { scale2x } from '../../src/render/scale2x';
import { moonAge, SYNODIC_DAYS } from '../../src/systems/calendar';

/** The chrome made a little more alive (V1's L5, decision 295). */
describe('hearts', () => {
  it('are ten drawn hearts, filled then empty', () => {
    const row = heartsRow(3);
    expect(row).toHaveLength(10);
    const srcs = row.map((h) => h.getAttribute('src'));
    expect(new Set(srcs.slice(0, 3)).size).toBe(1);
    expect(new Set(srcs.slice(3)).size).toBe(1);
    expect(srcs[0]).not.toBe(srcs[3]);
    expect(row.some((h) => h.classList.contains('hud-heart-pop'))).toBe(false);
  });

  it('pop in one after another as they are won', () => {
    const row = heartsRow(5, 3);
    const popped = row.filter((h) => h.classList.contains('hud-heart-pop'));
    expect(popped).toEqual([row[3], row[4]]);
    expect(popped.map((h) => h.style.getPropertyValue('--i'))).toEqual(['0', '1']);
  });
});

describe('Candy counting', () => {
  it('eases to the new amount and lands on it', () => {
    expect(countAt(100, 200, 0)).toBe(100);
    expect(countAt(100, 200, 0.5)).toBeGreaterThan(150);
    expect(countAt(100, 200, 1)).toBe(200);
    expect(countAt(200, 150, 2)).toBe(150);
  });

  it('jumps straight there when nothing may move', () => {
    const shown = document.createElement('span');
    const counter = countUp(shown, 40, () => false);
    expect(shown.textContent).toBe('40');
    counter.to(65);
    expect(shown.textContent).toBe('65');
    expect(counter.value()).toBe(65);
  });

  it('counts frame by frame when it may', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'performance'] });
    const shown = document.createElement('span');
    const counter = countUp(shown, 0, () => true);
    counter.to(90);
    expect(shown.classList.contains('hud-counting')).toBe(true);
    vi.advanceTimersByTime(COUNT_MS / 4);
    const partway = Number(shown.textContent);
    expect(partway).toBeGreaterThan(0);
    expect(partway).toBeLessThan(90);
    vi.advanceTimersByTime(COUNT_MS);
    expect(shown.textContent).toBe('90');
    expect(shown.classList.contains('hud-counting')).toBe(false);
    vi.useRealTimers();
  });
});

describe('a price', () => {
  it('is the drawn sweet and the number', () => {
    const tag = price(12);
    expect(tag.textContent).toBe('12');
    expect(tag.querySelector('img.hud-glyph')).not.toBeNull();
  });
});

describe('scale2x', () => {
  const px = (r: number) => [r, 0, 0, 255];
  it('doubles a picture, rounding a diagonal step and keeping a straight edge', () => {
    // A 2×2 with one corner empty: the empty corner's inner quarter fills in.
    const data = new Uint8ClampedArray([...px(1), ...px(1), ...px(1), 0, 0, 0, 0]);
    const out = scale2x(data, 2, 2);
    const at = (x: number, y: number) => out[(y * 4 + x) * 4 + 3];
    expect(out.length).toBe(4 * 4 * 4);
    expect(at(2, 2)).toBe(255);
    expect(at(3, 3)).toBe(0);
    expect(at(0, 0)).toBe(255);
  });
});

describe("the title's moon", () => {
  it('is new, then full half a month on, from the calendar the full moons come from', () => {
    expect(moonAge('2000-01-07')).toBeLessThan(1);
    const full = moonAge('2026-10-26');
    expect(Math.abs(full - SYNODIC_DAYS / 2)).toBeLessThan(1);
  });
});
