import { CLUE_IDS, CLUES, SUSPECTS, type ClueId, type SuspectId } from '../data/mystery';
import { el, openSheet } from './dom';
import { dated } from './MailSheet';

/** What her corkboard may ask of the game. Like the other sheets, it never reaches the world. */
export interface MysteryApi {
  /** The day a clue was pinned up, or null while it's still to find. */
  foundOn(id: ClueId): string | null;
  /** Who her clues point at so far. */
  suspects(): SuspectId[];
  /** Draws a suspect's head and shoulders at 1×, for the sheet to scale up. */
  portrait(canvas: HTMLCanvasElement, id: SuspectId): void;
}

/**
 * The mystery corkboard (decisions.md 19): every clue she has found, pinned with the day she found
 * it, a question mark and a hint for each still to find, and a photo of everyone they point at.
 */
export function openCorkboard(hud: HTMLElement, api: MysteryApi): () => void {
  const clues = CLUE_IDS.map((id) => {
    const row = CLUES[id];
    const on = api.foundOn(id);
    return el(
      'div',
      { className: 'hud-seed hud-clue' },
      el('span', { textContent: on ? '📌' : '❔' }),
      el(
        'span',
        { className: 'hud-seed-text' },
        el('strong', {}, on ? row.title : 'Still to find'),
        el('small', {}, on ? `${row.note} (${dated(on)})` : row.hint),
      ),
    );
  });

  const suspects = api.suspects().map((id) => {
    const photo = el('canvas', { className: 'hud-portrait' });
    api.portrait(photo, id);
    return el(
      'div',
      { className: 'hud-seed hud-clue' },
      photo,
      el(
        'span',
        { className: 'hud-seed-text' },
        el('strong', {}, SUSPECTS[id].name),
        el('small', {}, SUSPECTS[id].note),
      ),
    );
  });

  const found = CLUE_IDS.filter((id) => api.foundOn(id) !== null).length;
  const status =
    found === CLUE_IDS.length
      ? 'Every clue so far is pinned up. The mayor is still a mystery… for now.'
      : `${found} of ${CLUE_IDS.length} clues pinned up. Red string at the ready.`;

  const { body, close } = openSheet(hud, {
    title: 'Who is the mayor?',
    line: status,
    className: 'hud-corkboard-sheet',
  });
  body.append(
    el('div', { className: 'hud-seeds' }, ...clues),
    ...(suspects.length > 0
      ? [el('h3', {}, 'Suspects'), el('div', { className: 'hud-seeds' }, ...suspects)]
      : []),
  );
  return close;
}
