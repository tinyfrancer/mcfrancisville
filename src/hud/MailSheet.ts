import type { Ware } from '../data/shop';
import type { MailView } from '../world/World';
import { button, el, openSheet } from './dom';
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
  const sheet = openSheet(hud, { title: 'Your mailbox', className: 'hud-mail-sheet' });

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
    sheet.title('Your mailbox');
    sheet.actions();
    sheet.body.replaceChildren(
      rows.length > 0
        ? el('div', { className: 'hud-seeds' }, ...rows)
        : el('p', {}, 'No letters yet. Make some friends in town, and they may write!'),
    );
  };

  const read = (letter: MailView) => {
    const first = !letter.opened && api.open(letter.id);
    const page = el('div', { className: 'hud-letter', textContent: letter.text });
    const parts: HTMLElement[] = [page];
    if (letter.gift) {
      const text = first ? enclosed(letter.gift) : 'Something came with this letter. You have it!';
      parts.push(el('p', { className: 'hud-message', textContent: text }));
    }
    sheet.title(`From ${senderName(letter.from)}`);
    sheet.body.replaceChildren(...parts);
    sheet.body.scrollTop = 0;
    sheet.actions(button('Back', list));
  };

  list();
  return close;
}
