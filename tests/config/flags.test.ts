import { describe, expect, it } from 'vitest';
import { galleryRequested, hourRequested, manualLoopRequested } from '../../src/config/flags';

describe('flags', () => {
  it('reads ?loop=manual', () => {
    expect(manualLoopRequested('?loop=manual')).toBe(true);
    expect(manualLoopRequested('?loop=auto')).toBe(false);
    expect(manualLoopRequested('')).toBe(false);
  });

  it('reads ?gallery with or without a value', () => {
    expect(galleryRequested('?gallery')).toBe(true);
    expect(galleryRequested('?x=1&gallery=1')).toBe(true);
    expect(galleryRequested('?loop=manual')).toBe(false);
  });

  it('reads ?hour= as an hour of the day, or not at all', () => {
    expect(hourRequested('?hour=21.5')).toBe(21.5);
    expect(hourRequested('?hour=0')).toBe(0);
    expect(hourRequested('?hour=24')).toBeNull();
    expect(hourRequested('?hour=night')).toBeNull();
    expect(hourRequested('?hour=')).toBeNull();
    expect(hourRequested('')).toBeNull();
  });
});
