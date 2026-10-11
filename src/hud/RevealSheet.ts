import { REVEAL_AT, REVEAL_TITLES } from '../data/robBoo';
import type { MysteryApi } from './CorkboardSheet';
import { button, el, openSheet } from './dom';

/**
 * Meeting the mayor at the castle (V1's P3b, decision 303): the scene in the great hall, one line
 * after another. The picture is a shape under a dust sheet until the line where it comes off, and
 * then it's Rob Boo, pink to the brim of his hat; the last line's button says hello back.
 */
export function openReveal(
  hud: HTMLElement,
  api: Pick<MysteryApi, 'mayor'>,
  lines: readonly string[],
): () => void {
  const picture = el('canvas', { className: 'hud-portrait' });
  api.mayor(picture, false);
  const sheet = openSheet(hud, {
    picture,
    title: REVEAL_TITLES.before,
    line: "Castle Mac-A-Boo's great hall",
    className: 'hud-talk-sheet hud-reveal-sheet',
    done: null,
  });
  const speech = el('p', { className: 'hud-speech' });
  sheet.body.append(speech);
  let at = 0;
  const next = () => {
    if (at === REVEAL_AT) {
      api.mayor(picture, true);
      sheet.title(REVEAL_TITLES.after);
    }
    speech.textContent = lines[at] ?? '';
    if (++at < lines.length) sheet.actions(button('Go on…', next, true));
    else sheet.actions(button('Hello, Rob!', sheet.close, true));
  };
  next();
  return sheet.close;
}
