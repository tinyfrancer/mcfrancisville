import { beforeEach, describe, expect, it } from 'vitest';
import {
  catchErrors,
  ERRORS_KEY,
  MOST_NOTES,
  NOTE_SHOWN_FOR_MS,
  noteError,
  readErrorNotes,
  troubleOf,
} from '../src/errorNotes';
import {
  BACKED_UP_KEY,
  markBackedUp,
  markNudged,
  readBackedUpAt,
  readNudgedAt,
} from '../src/safekeeping';

const AT = new Date(2026, 9, 18, 14).getTime();
const ABOUT = { version: '0.9', userAgent: 'iPhone' };

const broken = {
  getItem: () => {
    throw new Error('no');
  },
  setItem: () => {
    throw new Error('no');
  },
} as unknown as Storage;

describe("the error notes (V1's S3)", () => {
  beforeEach(() => localStorage.removeItem(ERRORS_KEY));

  it('keeps the last few, newest last', () => {
    for (let i = 0; i < MOST_NOTES + 3; i++) noteError({ message: `oops ${i}` }, AT + i);
    const notes = readErrorNotes();
    expect(notes).toHaveLength(MOST_NOTES);
    expect(notes[notes.length - 1]!.message).toBe(`oops ${MOST_NOTES + 2}`);
  });

  it('counts the same error again rather than filling up with it', () => {
    for (let i = 0; i < 100; i++) noteError({ message: 'every frame', where: 'a.js:1:2' }, AT + i);
    expect(readErrorNotes()).toEqual([
      { at: AT + 99, message: 'every frame', where: 'a.js:1:2', times: 100 },
    ]);
  });

  it('notes what the page did not catch, and a promise nobody was waiting on', () => {
    const stop = catchErrors(window, () => AT);
    window.dispatchEvent(
      new ErrorEvent('error', {
        message: 'Uncaught TypeError',
        filename: 'index.js',
        lineno: 3,
        colno: 9,
        error: new TypeError('x is undefined'),
      }),
    );
    const rejection = new Event('unhandledrejection') as Event & { reason?: unknown };
    rejection.reason = 'the cloud was busy';
    window.dispatchEvent(rejection);
    stop();
    window.dispatchEvent(new ErrorEvent('error', { message: 'after stopping' }));
    const notes = readErrorNotes();
    expect(notes.map((n) => n.message)).toEqual([
      'TypeError: x is undefined',
      'the cloud was busy',
    ]);
    expect(notes[0]!.where).toBe('index.js:3:9');
  });

  it('never throws, whatever storage or event it gets', () => {
    expect(() => noteError({ message: 'x' }, AT, broken)).not.toThrow();
    expect(readErrorNotes(broken)).toEqual([]);
    localStorage.setItem(ERRORS_KEY, '{not json');
    expect(readErrorNotes()).toEqual([]);
    localStorage.setItem(ERRORS_KEY, JSON.stringify([{ at: 'then' }, null, 4]));
    expect(readErrorNotes()).toEqual([]);
    const stop = catchErrors(window, () => AT, broken);
    expect(() => window.dispatchEvent(new ErrorEvent('error'))).not.toThrow();
    stop();
  });

  it("says on which day, and copies every note with the version and the phone's", () => {
    noteError({ message: 'first', stack: 'at a\nat b' }, AT - 1000);
    noteError({ message: 'second' }, AT);
    noteError({ message: 'second' }, AT);
    const trouble = troubleOf(readErrorNotes(), AT + 60_000, ABOUT);
    expect(trouble?.on).toBe('18 October');
    expect(trouble?.note).toContain('McFrancisVille 0.9\niPhone\n');
    expect(trouble?.note).toContain('first\n  at a\n  at b');
    expect(trouble?.note).toMatch(/\(x2\) second$/);
  });

  it('stops mentioning it a month after the last time', () => {
    noteError({ message: 'long ago' }, AT);
    expect(troubleOf(readErrorNotes(), AT + NOTE_SHOWN_FOR_MS + 1, ABOUT)).toBeNull();
    expect(troubleOf([], AT, ABOUT)).toBeNull();
  });
});

describe('when this phone last backed up', () => {
  it('is kept beside the save, and forgotten safely', () => {
    localStorage.removeItem(BACKED_UP_KEY);
    expect(readBackedUpAt()).toBeNull();
    markBackedUp(AT);
    expect(readBackedUpAt()).toBe(AT);
    markNudged(AT + 1);
    expect(readNudgedAt()).toBe(AT + 1);
    expect(() => markBackedUp(AT, broken)).not.toThrow();
    expect(readBackedUpAt(broken)).toBeNull();
  });
});
