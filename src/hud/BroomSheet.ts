import {
  BRISTLES,
  BRISTLES_IDS,
  RIBBON_IDS,
  RIBBONS,
  type BristlesId,
  type BroomLook,
  type RibbonId,
} from '../data/broom';
import { bristlesColour, ribbonColour } from '../sprites/broom';
import { fitIcon, ROW_ICON } from './collection';
import { button, el, openSheet } from './dom';
import { choiceRow, section } from './pickers';

/** What the broom's sheet may ask of the game. Like the others, it never reaches the world directly. */
export interface BroomApi {
  look(): BroomLook;
  dress(look: Partial<BroomLook>): void;
  /** The name of where she flew home from, to fly back to, if anywhere. */
  backTo(): string | null;
  flyBack(): void;
  /** Draws her broom in a look at 1×. */
  icon(canvas: HTMLCanvasElement, look: BroomLook): void;
}

/**
 * Her broom at its stand by the door (0.2's P1): back to exactly where she flew home from, or
 * anywhere on the map, and its ribbon and bristles to colour (question 57).
 */
export function openBroom(hud: HTMLElement, api: BroomApi, openMap: () => void): () => void {
  const back = api.backTo();
  const sheet = openSheet(hud, {
    title: 'Your broom',
    line: back
      ? `It gives a little wiggle. Back to ${back}, or somewhere new?`
      : 'It gives a little wiggle. Where to?',
    className: 'hud-broom-sheet',
  });
  const picture = el('canvas', { className: 'hud-icon' });
  const draw = () => {
    api.icon(picture, api.look());
    fitIcon(picture, ROW_ICON);
  };
  draw();
  const ribbons = choiceRow<RibbonId>(
    RIBBON_IDS.map((id) => ({ id, label: RIBBONS[id], swatch: ribbonColour(id) })),
    api.look().ribbon,
    (ribbon) => {
      api.dress({ ribbon });
      draw();
    },
  );
  const bristles = choiceRow<BristlesId>(
    BRISTLES_IDS.map((id) => ({ id, label: BRISTLES[id], swatch: bristlesColour(id) })),
    api.look().bristles,
    (next) => {
      api.dress({ bristles: next });
      draw();
    },
  );
  sheet.body.append(
    el('div', { className: 'hud-stage' }, el('span', { className: 'hud-icon-box' }, picture)),
    section('Ribbon', ribbons.element),
    section('Bristles', bristles.element),
  );
  const flights: HTMLElement[] = [];
  if (back) {
    flights.push(
      button(
        'Fly back',
        () => {
          sheet.close();
          api.flyBack();
        },
        true,
      ),
    );
  }
  flights.push(
    button('Fly somewhere…', () => {
      sheet.close();
      openMap();
    }),
  );
  sheet.actions(...flights);
  return sheet.close;
}
