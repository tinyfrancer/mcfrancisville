import { CROPS, cropFromSeed } from '../data/crops';
import { ITEMS } from '../data/items';
import type { ItemId } from '../types/ids';
import type { Stack } from '../world/Bag';
import { el, openSheet } from './dom';

/** What the seed sheet may ask of the game. Like the others, it never reaches the world directly. */
export interface FarmApi {
  /** The seeds in her bag, in the order she found them. */
  seeds(): readonly Stack[];
  /** Draws an item's picture into a canvas at 1×, for the sheet to scale up. */
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Plants `seed` in the bed she's standing at. */
  plant(seed: ItemId): void;
}

/** "Ripe in 3 days", as she'd find it if she left it be. */
export function ripensIn(seed: ItemId): string {
  const crop = cropFromSeed(seed);
  if (!crop) return '';
  const days = CROPS[crop].days;
  return days === 1 ? 'Ripe tomorrow' : `Ripe in ${days} days, sooner if watered`;
}

/**
 * Asked when she's standing at an empty bed: which seed goes in. Each seed she carries is one big
 * button; picking one plants it and closes the sheet. Walking away is fine too: the bed waits.
 */
export function openSeeds(hud: HTMLElement, api: FarmApi): () => void {
  const { sheet, close } = openSheet(hud, { className: 'hud-seed-sheet' });
  const list = el('div', { className: 'hud-seeds' });
  for (const stack of api.seeds()) {
    const icon = el('canvas', { className: 'hud-item' });
    api.icon(icon, stack.id);
    const name = el('strong', {}, ITEMS[stack.id].name);
    const count = el('span', { className: 'hud-seed-count' }, `×${stack.count}`);
    const about = el('small', {}, ripensIn(stack.id));
    const button = el(
      'button',
      { type: 'button', className: 'hud-seed' },
      icon,
      el('span', { className: 'hud-seed-text' }, el('span', {}, name, ' ', count), about),
    );
    button.addEventListener('click', () => {
      close();
      api.plant(stack.id);
    });
    list.append(button);
  }
  const later = el('button', { type: 'button', textContent: 'Not now' });
  later.addEventListener('click', close);
  sheet.append(
    el('h2', {}, 'What shall we plant?'),
    el('p', {}, 'Every harvest gives you its seed back, so plant whatever makes you happy.'),
    list,
    el('div', { className: 'hud-row' }, later),
  );
  return close;
}
