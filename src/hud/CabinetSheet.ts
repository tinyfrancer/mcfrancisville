import { CRITTER_IDS, CRITTERS, FAMILY_NAMES, HABITAT_NAMES, PLACE_NAMES } from '../data/critters';
import { MUSEUM_GREETING } from '../data/museum';
import { hoursOf } from '../systems/critters';
import type { CritterId } from '../types/ids';
import { el, openSheet } from './dom';
import { dated } from './MailSheet';

/** What the Curiosity Cabinet and the museum may ask of the game. Neither reaches the world directly. */
export interface CabinetApi {
  /** The day she first caught one, or null; whether one is on show; whether any are about now. */
  critter(id: CritterId): { caughtOn: string | null; donated: boolean; outNow: boolean };
  /** How many she has in her bag. */
  inBag(id: CritterId): number;
  /** Puts one from her bag on show: its label, or null if it couldn't be. */
  donate(id: CritterId): string | null;
  /** Draws a critter at 1×, for the sheet to scale up. */
  icon(canvas: HTMLCanvasElement, id: CritterId): void;
  /** Draws a critter as a shadow of itself, for one she hasn't found. */
  silhouette(canvas: HTMLCanvasElement, id: CritterId): void;
}

/** When and where a critter is about, as the Cabinet tells it. */
function whenAndWhere(id: CritterId): string {
  const row = CRITTERS[id];
  const places = row.where.map((z) => PLACE_NAMES[z]);
  const where =
    places.length > 1 ? `${places.slice(0, -1).join(', ')} or ${places.at(-1)}` : places[0];
  return `${hoursOf(id)}, ${HABITAT_NAMES[row.habitat]} ${where}`;
}

function critterCanvas(api: CabinetApi, id: CritterId, shadow: boolean): HTMLCanvasElement {
  const canvas = el('canvas', { className: 'hud-item' });
  if (shadow) api.silhouette(canvas, id);
  else api.icon(canvas, id);
  return canvas;
}

/**
 * The Curiosity Cabinet: a case for every critter, her catches drawn in theirs and the ones still
 * to find as silhouettes, with when and where to look. A dot marks the ones about right now.
 */
export function openCabinet(hud: HTMLElement, api: CabinetApi): () => void {
  const { sheet, close } = openSheet(hud, { className: 'hud-cabinet-sheet' });
  const found = CRITTER_IDS.filter((id) => api.critter(id).caughtOn !== null).length;
  const shown = CRITTER_IDS.filter((id) => api.critter(id).donated).length;
  const name = el('h3', {}, 'Tap a case to look closer');
  const about = el(
    'p',
    {},
    'Shadows are critters still to find. A ✦ means one is out right now, somewhere in town.',
  );
  const when = el('p', { className: 'hud-message' });
  const grid = el('div', { className: 'hud-bag' });
  grid.setAttribute('role', 'list');

  for (const id of CRITTER_IDS) {
    const entry = api.critter(id);
    const known = entry.caughtOn !== null;
    const button = el(
      'button',
      { type: 'button', className: 'hud-slot' },
      critterCanvas(api, id, !known),
    );
    button.setAttribute('role', 'listitem');
    button.setAttribute('aria-label', known ? CRITTERS[id].name : 'Not found yet');
    if (entry.outNow) button.append(el('span', { className: 'hud-count' }, '✦'));
    button.addEventListener('click', () => {
      for (const b of grid.querySelectorAll('button')) b.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-pressed', 'true');
      const row = CRITTERS[id];
      const family = FAMILY_NAMES[row.family].toLowerCase();
      name.textContent = known ? row.name : `Not found yet (one of the ${family})`;
      about.textContent = known ? row.description : 'Keep an eye out, and have your net ready.';
      const out = entry.outNow ? ' Out now!' : '';
      const shownLine = entry.donated ? ' On show at Crumbs & Curios.' : '';
      const caught = known ? ` First caught ${dated(entry.caughtOn!)}.${shownLine}` : '';
      when.textContent = `${whenAndWhere(id)}.${out}${caught}`;
    });
    grid.append(button);
  }

  const done = el('button', { type: 'button', textContent: 'Done' });
  done.addEventListener('click', close);
  sheet.append(
    el('h2', {}, 'Curiosity Cabinet'),
    el('p', {}, `${found} of ${CRITTER_IDS.length} found, ${shown} on show at Crumbs & Curios.`),
    grid,
    name,
    about,
    when,
    el('div', { className: 'hud-row' }, done),
  );
  return close;
}

/**
 * Wrapunzel's museum, at the back of Crumbs & Curios: the critters in her bag that it hasn't got
 * yet, to donate, and every case, full or waiting.
 */
export function openMuseum(hud: HTMLElement, api: CabinetApi): () => void {
  const { sheet, close } = openSheet(hud, { className: 'hud-museum-sheet' });
  const done = el('button', { type: 'button', textContent: 'Done' });
  done.addEventListener('click', close);
  const message = el('p', { className: 'hud-message' });

  const render = () => {
    const give = CRITTER_IDS.filter((id) => api.inBag(id) > 0 && !api.critter(id).donated);
    const rows = give.map((id) => {
      const donate = el('button', {
        type: 'button',
        className: 'hud-price hud-primary',
        textContent: 'Donate',
      });
      donate.addEventListener('click', () => {
        const label = api.donate(id);
        if (label === null) return;
        render();
        message.textContent = label;
      });
      return el(
        'div',
        { className: 'hud-ware' },
        critterCanvas(api, id, false),
        el(
          'div',
          { className: 'hud-ware-text' },
          el('strong', {}, CRITTERS[id].name),
          el('small', {}, 'Not in the museum yet'),
        ),
        donate,
      );
    });
    const cases = CRITTER_IDS.map((id) => {
      const shown = api.critter(id).donated;
      const slot = el('div', { className: shown ? 'hud-slot' : 'hud-slot hud-slot-empty' });
      slot.setAttribute('role', 'listitem');
      slot.setAttribute('aria-label', shown ? CRITTERS[id].name : 'An empty case');
      if (shown) slot.append(critterCanvas(api, id, false));
      return slot;
    });
    const onShow = CRITTER_IDS.filter((id) => api.critter(id).donated).length;
    const grid = el('div', { className: 'hud-bag' }, ...cases);
    grid.setAttribute('role', 'list');
    message.textContent = '';
    sheet.replaceChildren(
      el('h2', {}, 'Crumbs & Curios'),
      el('p', {}, MUSEUM_GREETING),
      el('h3', {}, 'To donate'),
      rows.length > 0
        ? el('div', { className: 'hud-wares' }, ...rows)
        : el(
            'p',
            {},
            "Nothing new to give today. Catch a critter the museum hasn't got, and bring it here!",
          ),
      message,
      el('h3', {}, `On show: ${onShow} of ${CRITTER_IDS.length}`),
      grid,
      el('div', { className: 'hud-row' }, done),
    );
  };
  render();
  return close;
}
