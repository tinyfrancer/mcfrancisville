import { describe, expect, it } from 'vitest';
import { NOTES } from '../../src/data/patchNotes';
import { currentVersion, notesToShow } from '../../src/systems/patchNotes';

const newest = NOTES[NOTES.length - 1]!;

describe("the mayor's notes", () => {
  it('names the version on her phone by its newest notes', () => {
    expect(currentVersion()).toBe(newest.version);
  });

  it('shows the newest to a town that has never had them, as a phone from 0.1 has not', () => {
    expect(notesToShow(null, true)).toBe(newest);
  });

  it('shows the newest to a phone that last saw an older version, or one it no longer knows', () => {
    expect(notesToShow('0.1', true)).toBe(newest);
    expect(notesToShow('someday', true)).toBe(newest);
  });

  it('shows nothing once this version has been seen', () => {
    expect(notesToShow(newest.version, true)).toBeNull();
  });

  it('shows nothing to a town that begins today: nothing in it is new', () => {
    expect(notesToShow(null, false)).toBeNull();
  });
});
