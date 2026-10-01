import { ITEMS } from '../data/items';
import { stallHolds, stallSells, type StallSnapshot } from '../systems/passive';
import type { ItemId } from '../types/ids';
import type { Stack } from '../world/Bag';
import { fitIcon, ROW_ICON } from './collection';
import { el, openSheet } from './dom';
import { candy, quantity } from './messages';

/** What the honesty stall may ask of the game. Like the other sheets, it never reaches the world. */
export interface StallApi {
  stall(): Readonly<StallSnapshot>;
  /** What's in her bag that the stall takes. */
  wares(): readonly Stack[];
  /** What Cobweb Corner pays for one, which is what the stall sells it for. */
  price(item: ItemId): number;
  /** Leaves `count` on the stall; how many went. */
  leave(item: ItemId, count: number): number;
  /** Takes all of one kind back into her bag; how many. */
  takeBack(item: ItemId): number;
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
}

/**
 * The honesty stall outside the farm gate (phase O): what's on it, and what she grows and makes
 * in her bag to put out (0.2's E1). It sells a few things each window while she's away; the Candy
 * is in its tin the next time she comes by.
 */
export function openStall(hud: HTMLElement, api: StallApi): () => void {
  const { shelves } = api.stall();
  const holds = stallHolds(shelves);
  const sheet = openSheet(hud, {
    title: 'Honesty stall',
    line: `Leave what you grow and make. ${stallSells(shelves)} things sell each morning, afternoon and evening, at Cobweb Corner's prices.`,
    className: 'hud-stall-sheet',
  });
  const message = el('p', { className: 'hud-message' });

  const row = (item: ItemId, about: string, ...buttons: HTMLElement[]) => {
    const icon = el('canvas', { className: 'hud-icon' });
    api.icon(icon, item);
    fitIcon(icon, ROW_ICON);
    return el(
      'div',
      { className: 'hud-ware' },
      el('span', { className: 'hud-icon-box' }, icon),
      el(
        'span',
        { className: 'hud-ware-text' },
        el('strong', {}, ITEMS[item].name),
        el('small', {}, about),
      ),
      ...buttons,
    );
  };

  const button = (text: string, onClick: () => void, disabled = false) => {
    const b = el('button', { type: 'button', className: 'hud-price', textContent: text });
    b.disabled = disabled;
    b.addEventListener('click', onClick);
    return b;
  };

  const render = () => {
    const stall = api.stall();
    const onIt = stall.stock.reduce((n, s) => n + s.count, 0);
    const room = holds - onIt;
    const out = stall.stock.map((s) =>
      row(
        s.id,
        `${s.count} out, ${candy(api.price(s.id))} each.`,
        button('Take back', () => {
          const n = api.takeBack(s.id);
          message.textContent = `${quantity(s.id, n)} back in your bag.`;
          render();
        }),
      ),
    );
    const wares = api.wares().map((s) =>
      row(
        s.id,
        `You have ${s.count}. Sells for ${candy(api.price(s.id))} each.`,
        button(
          'Put out',
          () => {
            const n = api.leave(s.id, s.count);
            message.textContent = `${quantity(s.id, n)} out on the stall.`;
            render();
          },
          room <= 0,
        ),
      ),
    );
    sheet.body.replaceChildren(
      el('h3', {}, `On the stall (${onIt} of ${holds})`),
      out.length > 0
        ? el('div', { className: 'hud-wares' }, ...out)
        : el('p', { className: 'hud-message' }, 'Nothing out yet.'),
      el('h3', {}, 'From your garden and workbench'),
      wares.length > 0
        ? el('div', { className: 'hud-wares' }, ...wares)
        : el(
            'p',
            { className: 'hud-message' },
            'Nothing to put out. Whatever you grow, cook or make can go here.',
          ),
      message,
    );
  };

  render();
  return sheet.close;
}
