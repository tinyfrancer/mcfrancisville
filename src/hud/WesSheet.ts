import { button, el, openSheet } from './dom';
import type { MysteryApi } from './CorkboardSheet';

/**
 * A chat with Wes behind his tree (V1's P3a): what he says, one line after another (the first time
 * he owns up), and a goodbye. Nothing to give him and no hearts: he isn't a neighbour, only a nervous
 * man in a trench coat who stays for a chat now.
 */
export function openWes(
  hud: HTMLElement,
  api: Pick<MysteryApi, 'portrait'>,
  lines: readonly string[],
): () => void {
  const picture = el('canvas', { className: 'hud-portrait' });
  api.portrait(picture, 'wes');
  const sheet = openSheet(hud, {
    picture,
    title: 'Wes',
    line: "The mayor's assistant",
    className: 'hud-talk-sheet hud-wes-sheet',
    done: null,
  });
  const speech = el('p', { className: 'hud-speech' });
  sheet.body.append(speech);
  let at = 0;
  const next = () => {
    speech.textContent = lines[at] ?? '';
    if (++at < lines.length) sheet.actions(button('Go on…', next, true));
    else sheet.actions(button('Bye', sheet.close));
  };
  next();
  return sheet.close;
}
