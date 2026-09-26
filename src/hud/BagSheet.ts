import { ITEMS } from '../data/items';
import type { ItemId } from '../types/ids';
import type { Stack } from '../world/Bag';
import { el, openSheet } from './dom';

/** What the bag sheet may ask of the game. Like the others, it never reaches the world directly. */
export interface BagApi {
  contents(): readonly Stack[];
  /** Draws an item's picture into a canvas at 1×, for the sheet to scale up. */
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Calls `listener` whenever something goes into the bag. Returns a function that stops it. */
  onChange(listener: () => void): () => void;
}

/** Slots come a row of five at a time, with at least four rows showing, so it looks roomy. */
const PER_ROW = 5;
const MIN_SLOTS = 20;

export function slotCount(stacks: number): number {
  return Math.max(MIN_SLOTS, Math.ceil((stacks + 1) / PER_ROW) * PER_ROW);
}

/**
 * Her bag: a slot for each thing she has found, with how many, and a tap on one to read about it.
 * It has no weight and never fills (decisions.md 33).
 */
export function openBag(hud: HTMLElement, api: BagApi): () => void {
  const { sheet, close } = openSheet(hud, { className: 'hud-bag-sheet' });
  const name = el('h3', {}, 'Tap something to look at it');
  const about = el('p', {}, 'Everything you gather lands here. It never gets too full to carry.');
  const grid = el('div', { className: 'hud-bag' });
  grid.setAttribute('role', 'list');

  const select = (stack: Stack, button: HTMLButtonElement) => {
    for (const b of grid.querySelectorAll('button')) b.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-pressed', 'true');
    const row = ITEMS[stack.id];
    name.textContent = stack.count > 1 ? `${row.name} ×${stack.count}` : row.name;
    about.textContent = row.description;
  };

  const stacks = api.contents();
  for (const stack of stacks) {
    const icon = el('canvas', { className: 'hud-item' });
    api.icon(icon, stack.id);
    const button = el('button', { type: 'button', className: 'hud-slot' }, icon);
    button.setAttribute('aria-label', `${ITEMS[stack.id].name}, ${stack.count}`);
    button.setAttribute('role', 'listitem');
    if (stack.count > 1) button.append(el('span', { className: 'hud-count' }, String(stack.count)));
    button.addEventListener('click', () => select(stack, button));
    grid.append(button);
  }
  for (let i = stacks.length; i < slotCount(stacks.length); i++) {
    grid.append(el('div', { className: 'hud-slot hud-slot-empty' }));
  }

  const done = el('button', { type: 'button', textContent: 'Done' });
  done.addEventListener('click', close);
  sheet.append(
    el('h2', {}, 'Your bag'),
    grid,
    name,
    about,
    el('div', { className: 'hud-row' }, done),
  );
  return close;
}
