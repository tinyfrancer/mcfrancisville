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
    // phone still on 0.5 would read 1.2 and 1.3 after it.
    expect(notesToShow('0.5', true).map((n) => n.version)).toEqual([
      '1.0',
      '1.2',
      '1.3',
      '1.4',
      '1.4.1',
      '1.5',
    ]);
    const shipped = NOTES.find((n) => n.version === '0.5')!;
    expect(shipped.lines[0]).toMatch(/^Whatever you find flies to you now/);
    expect(shipped.lines).toHaveLength(5);
  });

  it('showed her phone, which had 1.0, the 1.2 card: 1.0.1 and 1.1 are folded into it', () => {
    // Neither reached a phone (decision 356), so 1.2's five lines carry them.
    expect(notesToShow('1.0', true).map((n) => n.version)).toEqual([
      '1.2',
      '1.3',
      '1.4',
      '1.4.1',
      '1.5',
    ]);
    expect(NOTES.map((n) => n.version)).not.toContain('1.0.1');
    expect(NOTES.map((n) => n.version)).not.toContain('1.1');
    expect(NOTES.find((n) => n.version === '1.2')!.lines).toHaveLength(5);
  });

  it('showed her phone, which had 1.2, the 1.3 card: 1.2.1 is folded into it', () => {
    // 1.2.1 (1.3's F1, the moon twice a month) never reached a phone (decision 366), so 1.3's five
    // lines carry it, and 1.2 stays as it shipped.
    const shown = notesToShow('1.2', true);
    expect(shown.map((n) => n.version)).toEqual(['1.3', '1.4', '1.4.1', '1.5']);
    expect(shown[0]!.lines).toHaveLength(5);
    expect(shown[0]!.lines.join(' ')).toMatch(/full and the day after it's new/);
    expect(NOTES.map((n) => n.version)).not.toContain('1.2.1');
    expect(NOTES.find((n) => n.version === '1.2')!.lines[0]).toMatch(/^The little switch/);
    expect(NOTES.find((n) => n.version === '1.3')!.lines).toHaveLength(5);
  });

  it('shows her phone, which has 1.3, the 1.4 card: the shinies first, then the winter', () => {
    // 1.4's G1 made the row and G2 added to it, two lines each; G3 adds one, five at most.
    const shown = notesToShow('1.3', true);
    expect(shown.map((n) => n.version)).toEqual(['1.4', '1.4.1', '1.5']);
    const card = shown[0]!;
    expect(card.lines[0]).toMatch(/wrong colour on purpose, and prettier for it/);
    expect(card.lines.join(' ')).toMatch(/winter woollies/);
    expect(card.lines.length).toBeLessThanOrEqual(5);
  });

  it('has a 1.4.1 card after it, the night sky first', () => {
    // G4's row (decision 373), which ships with 1.4.
    const card = NOTES.find((n) => n.version === '1.4.1')!;
    expect(card.lines[0]).toMatch(/telescope by the castle gate/);
    expect(card.lines.length).toBeLessThanOrEqual(5);
  });

  it('has a 1.5 card after that, the attic first; G5 and G7 add theirs, five at most', () => {
    // 1.5's G6 made the row (decision 375); the review folds it to five.
    expect(newest.version).toBe('1.5');
    expect(newest.lines.join(' ')).toMatch(/build an attic now/);
    expect(newest.lines.length).toBeLessThanOrEqual(5);
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
