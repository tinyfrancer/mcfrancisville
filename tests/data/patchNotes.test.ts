import { describe, expect, it } from 'vitest';
import { NOTES } from '../../src/data/patchNotes';

describe("the mayor's notes, as rows", () => {
  it('has one row per version, never two', () => {
    const versions = NOTES.map((n) => n.version);
    expect(NOTES.length).toBeGreaterThan(0);
    expect(new Set(versions).size).toBe(versions.length);
  });

  it.each(NOTES.map((n) => [n.version, n] as const))('keeps %s to three to five lines', (_, n) => {
    expect(n.lines.length).toBeGreaterThanOrEqual(3);
    expect(n.lines.length).toBeLessThanOrEqual(5);
    for (const line of n.lines) {
      expect(line).toMatch(/^[A-Z"'].*[.!?]$/);
      expect(line.length).toBeLessThanOrEqual(160);
    }
    expect(n.ps).toMatch(/^P\.S\. /);
  });
});
