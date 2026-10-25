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

  it("showed her phone one card for 1.0: it had last seen 0.5's, which is kept as it shipped", () => {
    // 0.4 went to her phone with 0.5's notes (PR #175), and 0.6 to 0.9 were folded into 1.0; a
    // phone still on 0.5 would read 1.2 after it.
    expect(notesToShow('0.5', true).map((n) => n.version)).toEqual(['1.0', '1.2', '1.2.1']);
    const shipped = NOTES.find((n) => n.version === '0.5')!;
    expect(shipped.lines[0]).toMatch(/^Whatever you find flies to you now/);
    expect(shipped.lines).toHaveLength(5);
  });

  it('shows her phone, which has 1.0, exactly the 1.2 card: 1.0.1 and 1.1 are folded into it', () => {
    // Neither reached a phone (decision 356), so 1.2's five lines carry them.
    expect(notesToShow('1.0', true).map((n) => n.version)).toEqual(['1.2', '1.2.1']);
    expect(NOTES.map((n) => n.version)).not.toContain('1.0.1');
    expect(NOTES.map((n) => n.version)).not.toContain('1.1');
    expect(NOTES.find((n) => n.version === '1.2')!.lines).toHaveLength(5);
  });

  it('shows her phone, which has 1.2, exactly the 1.2.1 card: the moon twice a month (1.3 F1)', () => {
    const shown = notesToShow('1.2', true);
    expect(shown.map((n) => n.version)).toEqual(['1.2.1']);
    expect(shown[0]!.lines).toHaveLength(3);
    expect(shown[0]!.lines.join(' ')).toMatch(/new/);
    expect(newest.version).toBe('1.2.1');
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
