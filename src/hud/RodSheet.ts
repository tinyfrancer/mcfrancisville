import { ROD_COLOUR_IDS, ROD_COLOURS, type RodColourId } from '../data/rods';
import { ROD_PAINT } from '../sprites/tools';
import { fitIcon, ROW_ICON } from './collection';
import { el, openSheet } from './dom';
import { choiceRow, section } from './pickers';

/** What the rod's sheet may ask of the game. */
export interface RodApi {
  colour(): RodColourId;
  paint(colour: RodColourId): void;
  /** Draws her rod in a colour at 1×. */
  icon(canvas: HTMLCanvasElement, colour: RodColourId): void;
}

/**
 * Her rod, to paint (personal_touches.md, "The rod (18)", 0.2's K2): a second tap on it on the
 * quick bar, while she's holding it.
 */
export function openRod(hud: HTMLElement, api: RodApi, onClose: () => void): () => void {
  const sheet = openSheet(hud, {
    title: 'Your rod',
    line: 'Nothing on it but its pumpkin float. What colour should it be?',
    className: 'hud-rod-sheet',
    onClose,
  });
  const picture = el('canvas', { className: 'hud-icon' });
  const draw = () => {
    api.icon(picture, api.colour());
    fitIcon(picture, ROW_ICON);
  };
  draw();
  const colours = choiceRow<RodColourId>(
    ROD_COLOUR_IDS.map((id) => ({ id, label: ROD_COLOURS[id], swatch: ROD_PAINT[id] })),
    api.colour(),
    (colour) => {
      api.paint(colour);
      draw();
    },
  );
  sheet.body.append(
    el('div', { className: 'hud-stage' }, el('span', { className: 'hud-icon-box' }, picture)),
    section('Paint', colours.element),
  );
  return sheet.close;
}
