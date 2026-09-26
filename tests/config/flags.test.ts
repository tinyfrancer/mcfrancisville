import { describe, expect, it } from 'vitest';
import { galleryRequested, manualLoopRequested } from '../../src/config/flags';

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
});
