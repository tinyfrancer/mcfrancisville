import { CLUE_IDS, CLUES, SUSPECTS, type ClueId, type SuspectId } from '../data/mystery';
import { LAST_PIN } from '../data/mysteryChain';
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
  /** Whether a clue has cleared a suspect (V1's P3a). */
  cleared(id: SuspectId): boolean;
  /**
   * For a clue of the chain still to come (V1's P3a): how many days until it does, 0 once it's
   * due; null for any other clue, or one further off.
   */
  daysUntil(id: ClueId): number | null;
  /** Whether a clue is one of the chain's, which come a week apart. */
  inChain(id: ClueId): boolean;
  /** Whether the mayor has promised to say hello: the last pin is theirs. */
  ready(): boolean;
}

/** What a clue still to find says: where to look, or, for the chain's, when it'll come. */
function hintOf(api: MysteryApi, id: ClueId): string {
  if (!api.inChain(id)) return CLUES[id].hint;
  const days = api.daysUntil(id);
  if (days === 0) return CLUES[id].hint;
  if (days === 1) return 'Coming tomorrow, or thereabouts.';
  if (days !== null) return `Coming in about ${days} days.`;
  return 'After the clue before it, a week or so on.';
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
        el('small', {}, on ? `${row.note} (${dated(on)})` : hintOf(api, id)),
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
        el('small', {}, api.cleared(id) ? SUSPECTS[id].cleared : SUSPECTS[id].note),
      ),
    );
  });

  // The one pin left for the unmasking (V1's P3a; P3b's to fill).
  const lastPin = el(
    'div',
    { className: 'hud-seed hud-clue hud-last-pin' },
    el('span', { textContent: '❔' }),
    el(
      'span',
      { className: 'hud-seed-text' },
      el('strong', {}, LAST_PIN.title),
      el('small', {}, api.ready() ? LAST_PIN.ready : LAST_PIN.waiting),
    ),
  );

  const found = CLUE_IDS.filter((id) => api.foundOn(id) !== null).length;
  const status =
    found === CLUE_IDS.length
      ? 'Every clue is pinned up, and one pin is left. The mayor is still a mystery… for now.'
      : `${found} of ${CLUE_IDS.length} clues pinned up. Red string at the ready.`;

  const { body, close } = openSheet(hud, {
    title: 'Who is the mayor?',
    line: status,
    className: 'hud-corkboard-sheet',
  });
  body.append(
    el('div', { className: 'hud-seeds' }, ...clues, lastPin),
    ...(suspects.length > 0
      ? [el('h3', {}, 'Suspects'), el('div', { className: 'hud-seeds' }, ...suspects)]
      : []),
  );
  return close;
}
