import { beforeEach, describe, expect, it } from 'vitest';
import { NOTES, NOTES_HEAD } from '../../src/data/patchNotes';
import { NOTES_SEEN_KEY, openNotes, whatsNew, type NotesApi } from '../../src/hud/NotesCard';

const newest = NOTES[NOTES.length - 1]!;

function api(hasTown: boolean): NotesApi {
  return { name: () => 'Em', hasTown: () => hasTown };
}

describe("the mayor's notes on opening", () => {
  beforeEach(() => localStorage.clear());

  it('shows a town from before this version what changed, then goes on once she answers', () => {
    const hud = document.createElement('div');
    let done = 0;
    whatsNew(hud, api(true), () => done++);
    const card = hud.querySelector('.hud-notes-sheet');
    expect(card?.querySelector('h2')?.textContent).toBe(`What's new in ${newest.version}`);
    expect(card?.querySelector('.hud-notes p')?.textContent).toBe('Dear Em,');
    expect([...card!.querySelectorAll('.hud-notes-lines li')].map((li) => li.textContent)).toEqual(
      newest.lines,
    );
    expect(done).toBe(0);
    expect(localStorage.getItem(NOTES_SEEN_KEY)).toBeNull();

    const reply = card!.querySelector('.hud-done') as HTMLElement;
    expect(reply.textContent).toBe(NOTES_HEAD.reply);
    reply.click();
    expect(hud.querySelector('.hud-notes-sheet')).toBeNull();
    expect(done).toBe(1);
    expect(localStorage.getItem(NOTES_SEEN_KEY)).toBe(newest.version);
  });

  it('gives a handed line its own words, in quotes, signed by whoever wrote it', () => {
    // 1.7's card ends with Cody's line under the mayor's P.S. (decision 388).
    const notes = NOTES.find((n) => n.handed)!;
    const hud = document.createElement('div');
    openNotes(hud, api(true), notes);
    const handed = hud.querySelector('.hud-notes-handed');
    expect(handed?.textContent).toBe(
      `\u201c${notes.handed!.words}\u201d\u2014 ${notes.handed!.by}`,
    );
    expect(hud.querySelector('.hud-notes-by')?.textContent).toBe('\u2014 Cody');
    expect(hud.querySelector('.hud-notes-ps')?.nextElementSibling).toBe(handed);
  });

  it('shows them once: the next time she opens the game, she goes straight in', () => {
    localStorage.setItem(NOTES_SEEN_KEY, newest.version);
    const hud = document.createElement('div');
    let done = 0;
    whatsNew(hud, api(true), () => done++);
    expect(hud.querySelector('.hud-notes-sheet')).toBeNull();
    expect(done).toBe(1);
  });

  it('keeps a new town from them, and remembers the version it began on', () => {
    const hud = document.createElement('div');
    let done = 0;
    whatsNew(hud, api(false), () => done++);
    expect(hud.querySelector('.hud-notes-sheet')).toBeNull();
    expect(done).toBe(1);
    expect(localStorage.getItem(NOTES_SEEN_KEY)).toBe(newest.version);
  });
});
