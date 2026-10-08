import { describe, expect, it } from 'vitest';
import { NOTES } from '../../src/data/patchNotes';
import { currentVersion, notesToShow } from '../../src/systems/patchNotes';

const newest = NOTES[NOTES.length - 1]!;

describe("the mayor's notes", () => {
  it('names the version on her phone by its newest notes', () => {
    expect(currentVersion()).toBe(newest.version);
  });

  it('shows the newest to a town that has never had them, as a phone from 0.1 has not', () => {
    expect(notesToShow(null, true)).toEqual([newest]);
  });

  it('shows every version since the one a phone last saw, oldest first', () => {
    const since = NOTES.length - 3;
    expect(notesToShow(NOTES[since]!.version, true)).toEqual(NOTES.slice(since + 1));
    expect(notesToShow(NOTES[NOTES.length - 2]!.version, true)).toEqual([newest]);
  });

  it('shows the newest to a phone that last saw a version these notes no longer know', () => {
    expect(notesToShow('someday', true)).toEqual([newest]);
  });

  it('shows nothing once this version has been seen', () => {
    expect(notesToShow(newest.version, true)).toEqual([]);
  });

  it('shows nothing to a town that begins today: nothing in it is new', () => {
    expect(notesToShow(null, false)).toEqual([]);
  });
});
