import { HEN_IDS, HENS, LAYERS, type HenId } from '../data/hens';
import { ITEMS } from '../data/items';
import type { ItemId } from '../types/ids';
import type { CoopView } from '../world/services/Henhouse';
import { fitIcon, ROW_ICON } from './collection';
import { el, openSheet, PICTURE } from './dom';
import { quantity } from './messages';

/** What the coop's card may ask of the game. Like the other sheets, it never reaches the world. */
export interface CoopApi {
  view(): CoopView;
  /** Feeds the hens one of something from her bag; false if she can't now. */
  feed(item: ItemId): boolean;
  /** Takes the eggs waiting into her bag; how many. */
  collect(): number;
  /** How many of something she has. */
  count(item: ItemId): number;
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** One of them, drawn at 1×. */
  hen(canvas: HTMLCanvasElement, id: HenId): void;
}

const eggs = (n: number) => (n === 1 ? 'an egg' : `${n} eggs`);

/**
 * The coop at Boo Acres (1.6's X3): the eggs waiting, to collect; what she has in her bag the hens
 * would eat, the plainest first, to feed them once a day for an egg from each hen in the morning;
 * and who they are.
 */
export function openCoop(hud: HTMLElement, api: CoopApi): () => void {
  const picture = el('canvas', { className: 'hud-icon' });
  api.hen(picture, 'henrietta');
  fitIcon(picture, PICTURE);
  const first = api.view();
  const sheet = openSheet(hud, {
    title: 'The coop',
    line: first.out
      ? 'Henrietta, Peck and Omelette are pottering about the run, and Reginald is keeping an eye on things.'
      : "They're all tucked up inside for the night. A soft cluck now and then, and a rustle of straw.",
    picture,
    className: 'hud-coop-sheet',
  });
  const message = el('p', { className: 'hud-message' });

  const button = (text: string, onClick: () => void, disabled = false) => {
    const b = el('button', { type: 'button', className: 'hud-price', textContent: text });
    b.disabled = disabled;
    b.addEventListener('click', onClick);
    return b;
  };

  const row = (
    kind: string,
    draw: (c: HTMLCanvasElement) => void,
    name: string,
    about: string,
    ...buttons: HTMLElement[]
  ) => {
    const icon = el('canvas', { className: 'hud-icon' });
    draw(icon);
    fitIcon(icon, ROW_ICON);
    return el(
      'div',
      { className: `hud-ware ${kind}` },
      el('span', { className: 'hud-icon-box' }, icon),
      el('span', { className: 'hud-ware-text' }, el('strong', {}, name), el('small', {}, about)),
      ...buttons,
    );
  };

  const render = () => {
    const view = api.view();
    const laying = LAYERS.length;
    const waiting = row(
      'hud-eggs',
      (c) => api.icon(c, 'egg'),
      view.eggs > 0 ? `${eggs(view.eggs)} in the nest boxes` : 'No eggs just now',
      view.fed
        ? `Fed today. An egg from each hen, ${laying} in all, by tomorrow morning.`
        : `Feed them today for an egg from each hen, ${laying} in all, by tomorrow morning.`,
      button(
        'Collect',
        () => {
          const got = api.collect();
          message.textContent =
            got > 0
              ? `You collected ${eggs(got)}, still warm. Henrietta supervises.`
              : 'Nothing there yet.';
          render();
        },
        view.eggs === 0,
      ),
    );
    const feeds = view.choices.map((id) =>
      row(
        'hud-feed',
        (c) => api.icon(c, id),
        ITEMS[id].name,
        `${api.count(id)} in your bag`,
        button(
          'Feed',
          () => {
            if (api.feed(id)) {
              message.textContent = `You scattered ${quantity(id, 1)} for them. Peck pecks at it first, just to be sure.`;
            }
            render();
          },
          view.fed,
        ),
      ),
    );
    const feedLine = view.fed
      ? "They've had their breakfast today. Come back tomorrow."
      : feeds.length === 0
        ? "Nothing in your bag they'd eat. Any crop or seed will do: Scarah's seed cart has plenty."
        : 'Any crop or seed will do, once a day. The plainest you have:';
    const hens = HEN_IDS.map((id) =>
      row('hud-hen', (c) => api.hen(c, id), HENS[id].name, HENS[id].about),
    );
    sheet.body.replaceChildren(
      el('div', { className: 'hud-wares' }, waiting),
      el('h3', {}, 'Feed them'),
      el('p', {}, feedLine),
      el('div', { className: 'hud-wares' }, ...(view.fed ? [] : feeds)),
      message,
      el('h3', {}, 'The hens'),
      el('div', { className: 'hud-wares' }, ...hens),
    );
  };

  render();
  return sheet.close;
}
