import { CALENDAR } from '../data/calendar';
import { VILLAGERS } from '../data/villagers';
import type { ItemId, VillagerId } from '../types/ids';
import type { Stack } from '../world/Bag';
import type { Notice } from '../world/services/Noticeboard';
import { fitIcon, ROW_ICON } from './collection';
import { el, openSheet } from './dom';
import { asked, candy, wantedLine } from './messages';

/** What the noticeboard may ask of the game. Like the other sheets, it never reaches the world. */
export interface NoticeApi {
  notices(): Notice[];
  bag(): readonly Stack[];
  /** Cobweb Corner's wanted list this week, pinned up with the notes (0.2's E1). */
  wanted(): readonly ItemId[];
  /** Hands over what a note asks for; false if she can't. */
  answer(slot: number): boolean;
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Draws a neighbour's head and shoulders at 1×. */
  portrait(canvas: HTMLCanvasElement, id: VillagerId): void;
}

/**
 * The noticeboard by the square (phase N): three notes from her neighbours, new each window, each
 * saying what they'd like, what it brings, and how many she has; a tap hands it over.
 */
export function openNotices(hud: HTMLElement, api: NoticeApi): () => void {
  const sheet = openSheet(hud, {
    title: 'Noticeboard',
    line: 'New notes every morning, afternoon and evening.',
    className: 'hud-notice-sheet',
  });
  const message = el('p', { className: 'hud-message' });

  const render = () => {
    const bag = api.bag();
    const wanted = el(
      'section',
      { className: 'hud-notice-wanted' },
      el(
        'p',
        {},
        el('small', { className: 'hud-notice-for' }, '📌 Pinned up by Cobweb Corner'),
        wantedLine(api.wanted()),
      ),
    );
    sheet.body.replaceChildren(
      ...api.notices().map((notice) => card(notice, bag)),
      wanted,
      message,
    );
  };

  function card(notice: Notice, bag: readonly Stack[]): HTMLElement {
    const face = el('canvas', { className: 'hud-portrait hud-notice-face' });
    api.portrait(face, notice.from);
    const icon = el('canvas', { className: 'hud-icon' });
    api.icon(icon, notice.item);
    fitIcon(icon, ROW_ICON / 2);
    const have = bag.find((s) => s.id === notice.item)?.count ?? 0;
    const what = asked(notice.item, notice.count);
    const note = notice.note.replace('{what}', what);
    const give = el('button', { type: 'button', className: 'hud-primary' });
    if (notice.done) {
      give.textContent = 'Done ✓';
      give.disabled = true;
    } else {
      give.textContent = `Hand over · ${candy(notice.candy)}`;
      give.disabled = have < notice.count;
      give.addEventListener('click', () => {
        if (!api.answer(notice.slot)) return;
        message.textContent = `${VILLAGERS[notice.from].name} will be so pleased!`;
        render();
      });
    }
    return el(
      'section',
      { className: `hud-notice${notice.done ? ' hud-notice-done' : ''}` },
      el(
        'div',
        { className: 'hud-notice-top' },
        face,
        el(
          'p',
          {},
          ...(notice.during
            ? [
                el(
                  'small',
                  { className: 'hud-notice-for' },
                  `${CALENDAR[notice.during].icon} ${CALENDAR[notice.during].name}`,
                ),
              ]
            : []),
          note,
          el('small', {}, `— ${VILLAGERS[notice.from].name}`),
        ),
      ),
      el(
        'div',
        { className: 'hud-notice-foot' },
        el('span', { className: 'hud-icon-box hud-notice-icon' }, icon),
        el('small', {}, notice.done ? 'Answered.' : `You have ${have} of ${notice.count}.`),
        give,
      ),
    );
  }

  render();
  return sheet.close;
}
