import { ZONES } from '../data/zones';
import type { ItemId, ZoneId } from '../types/ids';
import type { Wall } from '../world/services/Barn';
import { fitIcon, ROW_ICON } from './collection';
import { el, openSheet } from './dom';

/** What the barn's wall may ask of the game. Like the other sheets, it never reaches the world. */
export interface BarnApi {
  wall(): Wall;
  /** Stands sprinklers from her bag to water a field whole; how many went in. */
  sprinkle(field: number): number;
  /** Brings a field's sprinklers back into her bag; how many. */
  bringIn(field: number): number;
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
}

/** "rows 1 and 2", "row 5". */
export function rowsName([top, bottom]: readonly [number, number]): string {
  if (top === bottom) return `Row ${top}`;
  if (bottom === top + 1) return `Rows ${top} and ${bottom}`;
  return `Rows ${top} to ${bottom}`;
}

const placeName = (zone: ZoneId) => (zone === 'town' ? 'Hosta La Vista Farm' : ZONES[zone].name);

const sprinklers = (n: number) => `${n} sprinkler${n === 1 ? '' : 's'}`;

/**
 * The barn's wall at Boo Acres (0.3's F2): her rake, hoe and can hang there, and her sprinklers,
 * how many are in her bag and where the rest stand; and the farm's fields, each with a button to
 * water it whole with sprinklers from her bag, or to bring its sprinklers in.
 */
export function openBarn(hud: HTMLElement, api: BarnApi): () => void {
  const sheet = openSheet(hud, {
    title: 'The barn',
    line: 'Rakes, hoes and watering cans hang on the wall, each on its own peg. Sprinkle a field and it waters itself every morning.',
    className: 'hud-barn-sheet',
  });
  const message = el('p', { className: 'hud-message' });

  const button = (text: string, onClick: () => void, disabled = false) => {
    const b = el('button', { type: 'button', className: 'hud-price', textContent: text });
    b.disabled = disabled;
    b.addEventListener('click', onClick);
    return b;
  };

  const row = (kind: string, name: string, about: string, ...buttons: HTMLElement[]) => {
    const icon = el('canvas', { className: 'hud-icon' });
    api.icon(icon, 'sprinkler');
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
    const wall = api.wall();
    const where = wall.standing.map((s) => `${s.count} at ${placeName(s.zone)}`);
    const yours = row(
      'hud-sprinklers',
      'Your sprinklers',
      `${wall.inBag} in your bag${where.length > 0 ? `; ${where.join(', ')}` : ''}.`,
    );
    const fields = wall.fields.map((f, n) => {
      const name = rowsName(f.rows);
      const about =
        f.needs === 0
          ? `All ${f.beds} beds watered by sprinklers.`
          : `${f.watered} of ${f.beds} beds watered. ${sprinklers(f.needs)} would do the rest.`;
      const buttons: HTMLElement[] = [];
      if (f.needs > 0) {
        buttons.push(
          button(
            'Sprinkle',
            () => {
              const went = api.sprinkle(n);
              message.textContent =
                went === f.needs
                  ? `${sprinklers(went)} in ${name.toLowerCase()}. Every bed there waters itself now!`
                  : `${sprinklers(went)} in ${name.toLowerCase()}, all you had. Make more at your workbench.`;
              render();
            },
            wall.inBag === 0,
          ),
        );
      }
      if (f.standing > 0) {
        buttons.push(
          button('Bring in', () => {
            const back = api.bringIn(n);
            message.textContent = `${sprinklers(back)} back in your bag. What they watered stays watered.`;
            render();
          }),
        );
      }
      return row('hud-field', name, about, ...buttons);
    });
    sheet.body.replaceChildren(
      el('div', { className: 'hud-wares' }, yours),
      el('h3', {}, 'The fields'),
      el('div', { className: 'hud-wares' }, ...fields),
      message,
    );
  };

  render();
  return sheet.close;
}
