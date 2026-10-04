import { ITEMS } from '../data/items';
import type { ItemId } from '../types/ids';
import { fitIcon } from './collection';
import { el } from './dom';
import { eatLine } from './food';

/** Big beside its name and what it is (0.2's U2): a 16-pixel icon at 4×. */
export const CARD_ICON = 64;

/**
 * One thing from her bag, told the same way wherever she taps it (0.2's B4): its picture, big, and
 * beside it its name and how many with a line about it under them, and what she can do with it. It sits in a sheet's foot, so
 * however far down her bag she tapped, it's in sight. A dish, snack or treat says what eating it
 * does under that, whatever the line (0.3's A4).
 */
export interface ItemCard {
  element: HTMLElement;
  show(id: ItemId, count: number, line: string, ...controls: HTMLElement[]): void;
  /** What it says with nothing picked. */
  prompt(title: string, line: string): void;
  /** Says something new under the name, keeping the picture and the buttons. */
  say(line: string): void;
}

export function itemCard(draw: (canvas: HTMLCanvasElement, id: ItemId) => void): ItemCard {
  const icon = el('canvas', { className: 'hud-icon' });
  const box = el('span', { className: 'hud-icon-box' }, icon);
  const name = el('h3', {});
  const about = el('p', {});
  // What eating it does stays put under whatever the card says of it (0.3's A4).
  const eats = el('p', { className: 'hud-eats' });
  const controls = el('div', { className: 'hud-row' });
  const element = el(
    'div',
    { className: 'hud-detail hud-item-card' },
    box,
    el('div', { className: 'hud-item-text' }, name, about, eats),
    controls,
  );
  return {
    element,
    show(id, count, line, ...buttons) {
      draw(icon, id);
      fitIcon(icon, CARD_ICON);
      box.hidden = false;
      name.textContent = count > 1 ? `${ITEMS[id].name} ×${count}` : ITEMS[id].name;
      about.textContent = line;
      const eat = eatLine(id);
      eats.textContent = eat ?? '';
      eats.hidden = eat === null;
      controls.replaceChildren(...buttons);
      controls.hidden = buttons.length === 0;
    },
    prompt(title, line) {
      box.hidden = true;
      name.textContent = title;
      about.textContent = line;
      eats.hidden = true;
      controls.replaceChildren();
      controls.hidden = true;
    },
    say(line) {
      about.textContent = line;
    },
  };
}

export interface HowMany {
  element: HTMLElement;
  value(): number;
}

/** A − n + for how many of something, from one up to all she has. */
export function howMany(most: number, onChange: (n: number) => void): HowMany {
  let n = 1;
  const shown = el('output', { className: 'hud-how-many-n' }, '1');
  const less = el('button', { type: 'button', className: 'hud-chip', textContent: '−' });
  const more = el('button', { type: 'button', className: 'hud-chip', textContent: '+' });
  less.setAttribute('aria-label', 'One fewer');
  more.setAttribute('aria-label', 'One more');
  const paint = () => {
    shown.textContent = String(n);
    less.disabled = n <= 1;
    more.disabled = n >= most;
  };
  const set = (next: number) => {
    n = Math.min(most, Math.max(1, next));
    paint();
    onChange(n);
  };
  less.addEventListener('click', () => set(n - 1));
  more.addEventListener('click', () => set(n + 1));
  paint();
  const element = el('div', { className: 'hud-how-many' }, less, shown, more);
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', 'How many');
  return { element, value: () => n };
}
