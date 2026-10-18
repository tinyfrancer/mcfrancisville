import { MAX_HEARTS } from '../systems/friendship';
import { glyph } from './glyph';

/**
 * How close they are, out of ten, as drawn hearts (V1's L5): filled, then empty. Any filled since
 * `was` pop in one after another as they're shown, so a heart won is seen being won.
 */
export function heartsRow(hearts: number, was = hearts): HTMLElement[] {
  return Array.from({ length: MAX_HEARTS }, (_, k) => {
    const full = k < hearts;
    const heart = glyph(full ? 'heart' : 'heartEmpty', 16, 'hud-heart');
    if (full && k >= was) {
      heart.classList.add('hud-heart-pop');
      heart.style.setProperty('--i', String(k - was));
    }
    return heart;
  });
}
