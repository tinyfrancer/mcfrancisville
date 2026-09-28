import {
  CRITTER_IDS,
  CRITTERS,
  FAMILY_NAMES,
  HABITAT_NAMES,
  PLACE_NAMES,
  type Family,
} from '../data/critters';
import { MUSEUM_GREETING } from '../data/museum';
import { WEATHER_NAMES } from '../data/weather';
import { hoursOf } from '../systems/critters';
import type { CritterId } from '../types/ids';
import { collection, fitIcon, SLOT_ICON, type Entry, type Group } from './collection';
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
  /** Whether she caught it for the first time since she last looked in the Cabinet. */
  isNew(id: CritterId): boolean;
  /** She has looked in the Cabinet. */
  seen(): void;
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
  const weather = row.weather ? ` ${WEATHER_NAMES[row.weather]}` : '';
  return `${hoursOf(id)}${weather}, ${HABITAT_NAMES[row.habitat]} ${where}`;
}

function critterCanvas(api: CabinetApi, id: CritterId, shadow: boolean): HTMLCanvasElement {
  const canvas = el('canvas', { className: 'hud-icon' });
  if (shadow) api.silhouette(canvas, id);
  else api.icon(canvas, id);
  fitIcon(canvas, SLOT_ICON);
  return canvas;
}

const FAMILY_GROUPS: readonly Group[] = (Object.keys(FAMILY_NAMES) as Family[]).map((id) => ({
  id,
  label: FAMILY_NAMES[id],
}));

interface CaseEntry extends Entry {
  id: CritterId;
  known: boolean;
}

/**
 * The Curiosity Cabinet: a case for every critter, her catches drawn in theirs and the ones still
 * to find as silhouettes, with when and where to look. A dot marks the ones about right now.
 */
export function openCabinet(hud: HTMLElement, api: CabinetApi): () => void {
  const found = CRITTER_IDS.filter((id) => api.critter(id).caughtOn !== null).length;
  const shown = CRITTER_IDS.filter((id) => api.critter(id).donated).length;
  const sheet = openSheet(hud, {
    title: 'Curiosity Cabinet',
    line: `${found} of ${CRITTER_IDS.length} found, ${shown} on show at Crumbs & Curios.`,
    className: 'hud-cabinet-sheet',
    onClose: () => api.seen(),
  });
  const name = el('h3', {}, 'Tap a case to look closer');
  const about = el(
    'p',
    {},
    'Shadows are critters still to find. A ✦ means one is out right now, somewhere in town.',
  );
  const when = el('p', { className: 'hud-message' });
  let picked: CritterId | null = null;

  const cases = collection<CaseEntry>({
    label: 'the Curiosity Cabinet',
    entries: () =>
      CRITTER_IDS.map((id) => {
        const entry = api.critter(id);
        const known = entry.caughtOn !== null;
        return {
          id,
          known,
          name: known ? CRITTERS[id].name : 'Not found yet',
          group: CRITTERS[id].family,
          isNew: api.isNew(id),
          ...(entry.outNow ? { mark: '✦' } : {}),
        };
      }),
    groups: FAMILY_GROUPS,
    sorts: ['kind', 'new'],
    layout: 'grid',
    icon: (canvas, e) => (e.known ? api.icon(canvas, e.id) : api.silhouette(canvas, e.id)),
    pick(e) {
      picked = e.id;
      const entry = api.critter(e.id);
      const row = CRITTERS[e.id];
      const family = FAMILY_NAMES[row.family].toLowerCase();
      name.textContent = e.known ? row.name : `Not found yet (one of the ${family})`;
      about.textContent = e.known ? row.description : 'Keep an eye out, and have your net ready.';
      const out = entry.outNow ? ' Out now!' : '';
      const shownLine = entry.donated ? ' On show at Crumbs & Curios.' : '';
      const caught = e.known ? ` First caught ${dated(entry.caughtOn!)}.${shownLine}` : '';
      when.textContent = `${whenAndWhere(e.id)}.${out}${caught}`;
    },
    pressed: (e) => e.id === picked,
    empty: '',
    memory: 'cabinet',
  });
  sheet.head.append(cases.tools);
  sheet.body.append(cases.list);
  sheet.actions(el('div', { className: 'hud-detail' }, name, about, when));
  return sheet.close;
}

/**
 * Wrapunzel's museum, at the back of Crumbs & Curios: the critters in her bag that it hasn't got
 * yet, to donate, and every case, full or waiting.
 */
export function openMuseum(hud: HTMLElement, api: CabinetApi): () => void {
  const sheet = openSheet(hud, {
    title: 'Crumbs & Curios',
    line: MUSEUM_GREETING,
    className: 'hud-museum-sheet',
  });
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
        el('span', { className: 'hud-icon-box' }, critterCanvas(api, id, false)),
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
    sheet.body.replaceChildren(
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
    );
  };
  render();
  return sheet.close;
}
