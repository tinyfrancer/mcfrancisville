import type { ItemId } from '../types/ids';
import type { Buff } from '../world/services/Kitchen';
import { fitIcon } from './collection';
import { el } from './dom';
import { buffLine, effectWords, tillShort } from './food';
import { ITEMS } from '../data/items';
import type { Toast } from './messages';

/** What the top bar's meal chips may ask of the game (0.3's A4). */
export interface MealsApi {
  /** What her meals are doing now, each with the dish she ate for it. */
  buffs(): readonly Buff[];
  /** Calls `listener` whenever that might have changed. Returns a function that stops it. */
  onChange(listener: () => void): () => void;
  /** Draws an item's picture into a canvas at 1×. */
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
}

/** A dish's 16-pixel picture at 2×, inside a chip a thumb high. */
const CHIP_ICON = 32;

export interface MealChips {
  element: HTMLElement;
  render(): void;
}

/**
 * A chip in the top bar for each thing a meal is doing (0.3's A4): the dish's picture, and since
 * every one of them ends as the window turns, "till evening" said once, after the last. A tap says
 * what it does. They go when the window turns, or a lured critter is caught.
 */
export function mealChips(api: MealsApi, toast: (toast: Toast) => void): MealChips {
  const element = el('div', { className: 'hud-meals' });
  element.setAttribute('role', 'group');
  element.setAttribute('aria-label', 'What you ate is doing');
  let shown: string | null = null;
  const render = () => {
    const buffs = api.buffs();
    const key = buffs.map((b) => `${JSON.stringify(b.effect)}:${b.item}:${b.until}`).join('|');
    if (key === shown) return;
    shown = key;
    element.hidden = buffs.length === 0;
    element.replaceChildren(
      ...buffs.map((buff, i) => {
        const icon = el('canvas', { className: 'hud-icon' });
        api.icon(icon, buff.item);
        fitIcon(icon, CHIP_ICON);
        const chip = el('button', { type: 'button', className: 'hud-meal' }, icon);
        if (i === buffs.length - 1) {
          chip.append(el('span', { className: 'hud-meal-till' }, tillShort(buff.until)));
        }
        chip.setAttribute(
          'aria-label',
          `${ITEMS[buff.item].name}: ${effectWords(buff.effect)}, ${tillShort(buff.until)}`,
        );
        chip.addEventListener('click', () =>
          toast({ text: buffLine(buff.effect, buff.until), icon: '😋' }),
        );
        return chip;
      }),
    );
  };
  render();
  api.onChange(render);
  return { element, render };
}
