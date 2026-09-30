import { NOTES_HEAD, type PatchNotes } from '../data/patchNotes';
import { fill } from '../systems/friendship';
import { currentVersion, notesToShow } from '../systems/patchNotes';
import { el, openSheet } from './dom';

/** What the patch notes need of the game: who they're to, and whether she has a town yet. */
export interface NotesApi {
  name(): string;
  hasTown(): boolean;
}

/** The version whose notes this phone last showed her, kept per phone like the dedication. */
export const NOTES_SEEN_KEY = 'mcfrancisville:notesSeen';

function lastSeen(): string | null {
  try {
    return localStorage.getItem(NOTES_SEEN_KEY);
  } catch {
    return null;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(NOTES_SEEN_KEY, currentVersion());
  } catch {
    // A phone that won't keep it shows her the notes again next time, which does no harm.
  }
}

/**
 * The mayor's notes on what's new, the first time she opens a new version (decision 142), then
 * `onDone`. A new town has nothing new in it, so it just remembers the version and goes on.
 */
export function whatsNew(hud: HTMLElement, api: NotesApi, onDone: () => void): void {
  const notes = notesToShow(lastSeen(), api.hasTown());
  if (!notes) {
    markSeen();
    onDone();
    return;
  }
  // Remembered once she's read them, so closing the app on the card shows it again next time.
  openNotes(hud, api, notes, () => {
    markSeen();
    onDone();
  });
}

/** The notes as the mayor typed them, which Settings can open again. */
export function openNotes(
  hud: HTMLElement,
  api: NotesApi,
  notes: PatchNotes,
  onDone: () => void = () => {},
): () => void {
  const { body, close } = openSheet(hud, {
    title: `What's new in ${notes.version}`,
    line: NOTES_HEAD.from,
    className: 'hud-notes-sheet',
    done: NOTES_HEAD.reply,
    onClose: onDone,
  });
  const lines = el('ul', { className: 'hud-notes-lines' });
  notes.lines.forEach((line, i) => {
    const item = el('li', { textContent: line });
    item.style.setProperty('--i', String(i));
    lines.append(item);
  });
  body.append(
    el(
      'div',
      { className: 'hud-letter hud-notes' },
      el('p', { textContent: fill(NOTES_HEAD.dear, { name: api.name() }) }),
      el('p', { textContent: NOTES_HEAD.intro }),
      lines,
      el('p', { className: 'hud-notes-signed', textContent: NOTES_HEAD.signed }),
      el('p', { className: 'hud-notes-ps', textContent: notes.ps }),
    ),
  );
  return close;
}
