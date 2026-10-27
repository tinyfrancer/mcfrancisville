import type { ItemId } from '../types/ids';
import type { WellView } from '../world/services/Well';
import { fitIcon } from './collection';
import { button, el, openSheet, PICTURE } from './dom';
import { candy } from './messages';

/** What the well's card may ask of the game. Like the other sheets, it never reaches the world. */
export interface WellApi {
  view(): WellView;
  /** Tosses a Candy in for today's wish; false if she can't now. */
  toss(): boolean;
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
}

/** What the card says, by whether she has wished today and has a Candy to toss. */
export function wellWords(view: WellView): string {
  if (view.wished) {
    return "You've made today's wish. The well is still turning it over. Come back tomorrow for another.";
  }
  if (view.candy < view.costs) {
    return "You haven't a Candy to toss just now. The well doesn't mind a bit. It'll be right here.";
  }
  return `Toss in ${candy(view.costs)} and make a wish. The well always answers, once a day.`;
}

/**
 * The wishing well on the square (1.7's Y2): Toss a Candy, once a day, or Not today. A toss closes
 * the card, so the ripple over the water is seen and the wish comes back as a toast.
 */
export function openWell(hud: HTMLElement, api: WellApi): () => void {
  const picture = el('canvas', { className: 'hud-icon' });
  api.icon(picture, 'wellPenny');
  fitIcon(picture, PICTURE);
  const view = api.view();
  const sheet = openSheet(hud, {
    title: 'The wishing well',
    line: 'Old stones, a mossy roof and a bucket on a rope. Deep down, something glints.',
    picture,
    className: 'hud-well-sheet',
    done: view.wished ? 'Done' : 'Not today',
  });
  sheet.body.append(el('p', { className: 'hud-well-words' }, wellWords(view)));
  if (!view.wished) {
    const toss = button(
      'Toss a Candy',
      () => {
        if (api.toss()) sheet.close();
      },
      true,
    );
    toss.classList.add('hud-well-toss');
    toss.disabled = view.candy < view.costs;
    sheet.actions(toss);
  }
  return sheet.close;
}
