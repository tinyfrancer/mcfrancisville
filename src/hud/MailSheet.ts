import type { Ware } from '../data/shop';
import type { MailView } from '../world/World';
import { el, openSheet } from './dom';
import { boughtLine, senderName } from './messages';

/** What the mail sheet may ask of the game. Like the others, it never reaches the world directly. */
export interface MailApi {
  /** Her letters, newest first. */
  mail(): readonly MailView[];
  /** Opens a letter, taking out what came with it the first time. */
  open(id: string): boolean;
}

/** What came with a letter, and where it went. */
function enclosed(gift: Ware): string {
  return `Enclosed: ${boughtLine(gift)}`;
}

/** "27 Sep", from a day key. */
export function dated(day: string): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year!, month! - 1, date!).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Her mailbox: every letter her neighbours have sent, kept for good, the unread ones marked. A
 * letter opens to its page, and whatever came with it goes where it belongs.
 */
export function openMail(hud: HTMLElement, api: MailApi): () => void {
  const { sheet, close } = openSheet(hud, { className: 'hud-mail-sheet' });
  const done = el('button', { type: 'button', textContent: 'Done' });
  done.addEventListener('click', close);

  const list = () => {
    const letters = api.mail();
    const rows = letters.map((letter) => {
      const b = el(
        'button',
        { type: 'button', className: 'hud-seed' },
        el('span', { textContent: letter.opened ? '✉️' : '💌' }),
        el(
          'span',
          { className: 'hud-seed-text' },
          el('strong', {}, `From ${senderName(letter.from)}`),
          el('small', {}, letter.opened ? dated(letter.on) : `${dated(letter.on)} · new!`),
        ),
      );
      b.addEventListener('click', () => read(letter));
      return b;
    });
    sheet.replaceChildren(
      el('h2', {}, 'Your mailbox'),
      rows.length > 0
        ? el('div', { className: 'hud-seeds' }, ...rows)
        : el('p', {}, 'No letters yet. Make some friends in town, and they may write!'),
      el('div', { className: 'hud-row' }, done),
    );
  };

  const read = (letter: MailView) => {
    const first = !letter.opened && api.open(letter.id);
    const back = el('button', { type: 'button', textContent: 'Back' });
    back.addEventListener('click', list);
    const page = el('div', { className: 'hud-letter', textContent: letter.text });
    const parts: HTMLElement[] = [el('h2', {}, `From ${senderName(letter.from)}`), page];
    if (letter.gift) {
      const text = first ? enclosed(letter.gift) : 'Something came with this letter. You have it!';
      parts.push(el('p', { className: 'hud-message', textContent: text }));
    }
    sheet.replaceChildren(...parts, el('div', { className: 'hud-row' }, back, done));
  };

  list();
  return close;
}
