import { linksBetween } from '../systems/zones';
import type { ZoneId } from '../types/ids';
import type { Place, WayOut } from '../world/services/Travel';
import { el, openSheet } from './dom';

/** What the world map may ask of the game. Like the other sheets, it never reaches the world. */
export interface MapApi {
  /** The places she has found, and a question mark beside each. */
  places(): Place[];
  /** The ways out of the place she's in. */
  waysOut(): WayOut[];
  /** Goes straight there; false if she can't. */
  go(id: ZoneId): boolean;
}

const SVG = 'http://www.w3.org/2000/svg';

const SIDES: Record<WayOut['side'], string> = {
  north: '⬆️ North',
  south: '⬇️ South',
  east: '➡️ East',
  west: '⬅️ West',
};

const ORDER: readonly WayOut['side'][] = ['north', 'west', 'east', 'south'];

/**
 * The ways out of where she is (0.2's C1), laid out as a compass round it (U4): each edge's way on
 * that side of the place she's in, named if she has been, and a tap on one she has flies her.
 */
function compass(
  here: Place | undefined,
  ways: readonly WayOut[],
  places: ReadonlyMap<ZoneId, Place>,
  fly: (id: ZoneId) => void,
): HTMLElement {
  const centre = el(
    'div',
    { className: 'hud-map-centre' },
    el('span', { className: 'hud-map-mark', textContent: here?.icon ?? '📍' }),
    el('strong', { textContent: here?.name ?? 'Here' }),
    el('small', { className: 'hud-map-pin', textContent: 'you are here' }),
  );
  const sides = ORDER.map((side) => {
    const column = el('div', { className: 'hud-map-side' });
    column.dataset.side = side;
    for (const way of ways.filter((w) => w.side === side)) {
      const where = way.found
        ? `${way.icon} ${way.name}`
        : way.secret
          ? '❔ a way nobody takes'
          : '❔ somewhere still to find';
      const flies = way.found && places.get(way.to)?.open === true;
      const item = el(flies ? 'button' : 'div', {
        className: `hud-map-way${flies ? '' : ' hud-map-unfound'}`,
      });
      item.append(el('small', { textContent: SIDES[side] }), el('span', { textContent: where }));
      if (flies) {
        item.setAttribute('aria-label', `${SIDES[side]}: fly to ${way.name}`);
        item.addEventListener('click', () => fly(way.to));
      }
      column.append(item);
    }
    return column;
  });
  const none = ways.length === 0 ? [el('p', { textContent: 'No paths lead out of here.' })] : [];
  return el('div', {}, el('div', { className: 'hud-map-compass' }, centre, ...sides), ...none);
}

/**
 * The map (decisions.md 90, onto the frame in 0.2's U4): the ways out of where she is first, laid
 * out round it so which edge goes where is plain; then the world, the places she has found joined
 * by the paths between them, and a question mark down each path she hasn't taken. A tap on a place
 * goes there; a tap on a question mark says what's waiting. A new place is a `ZONES` row, nothing
 * here.
 */
export function openMap(hud: HTMLElement, api: MapApi): () => void {
  const places = api.places();
  const here = places.find((p) => p.here);
  const sheet = openSheet(hud, {
    title: 'Map',
    line: here ? `You're in ${here.name}.` : '',
    tabs: [
      { id: 'here', label: 'Ways out' },
      { id: 'world', label: 'World' },
    ],
    memory: 'map',
    className: 'hud-map-sheet',
  });
  const { close } = sheet;
  const caption = el('p', {
    textContent: here
      ? `You're in ${here.name}. Tap a place to fly there.`
      : 'Tap a place to fly there.',
  });
  const at = new Map(places.map((p) => [p.id, p]));
  const fly = (id: ZoneId) => {
    if (api.go(id)) close();
  };

  // The paths first, under the places: a line between each two it shows.
  const paths = document.createElementNS(SVG, 'svg');
  paths.setAttribute('class', 'hud-map-paths');
  paths.setAttribute('viewBox', '0 0 100 100');
  paths.setAttribute('preserveAspectRatio', 'none');
  for (const [a, b] of linksBetween()) {
    const from = at.get(a);
    const to = at.get(b);
    if (!from || !to) continue;
    const line = document.createElementNS(SVG, 'line');
    line.setAttribute('x1', String(from.at.x));
    line.setAttribute('y1', String(from.at.y));
    line.setAttribute('x2', String(to.at.x));
    line.setAttribute('y2', String(to.at.y));
    const out = from.here || to.here;
    const unknown = !from.found || !to.found;
    const kinds = [unknown ? 'hud-map-unknown' : '', out ? 'hud-map-out' : ''].filter(Boolean);
    if (kinds.length > 0) line.setAttribute('class', kinds.join(' '));
    paths.append(line);
  }

  const pins = places.map((place) => {
    const pin = el('button', {
      type: 'button',
      className: `hud-map-place${place.here ? ' hud-map-here' : ''}${place.found ? '' : ' hud-map-unfound'}`,
    });
    if (place.found && !place.here) pin.setAttribute('aria-label', `Fly to ${place.name}`);
    pin.style.left = `${place.at.x}%`;
    pin.style.top = `${place.at.y}%`;
    pin.append(
      el('span', { className: 'hud-map-mark', textContent: place.found ? place.icon : '❔' }),
      el('span', { className: 'hud-map-name', textContent: place.found ? place.name : '???' }),
      ...(place.here
        ? [el('small', { className: 'hud-map-pin', textContent: 'you are here' })]
        : []),
    );
    pin.addEventListener('click', () => {
      if (place.here) caption.textContent = `You're in ${place.name}. ${place.blurb}`;
      else if (!place.found) {
        caption.textContent = place.hint ?? 'Somewhere down this path is a place still to find.';
      } else fly(place.id);
    });
    return pin;
  });

  sheet.panel('here').append(
    compass(here, api.waysOut(), at, fly),
    el('p', {
      className: 'hud-map-hint',
      textContent: 'Walk off the edge where a signpost points, or tap a place you know to fly.',
    }),
  );
  sheet.panel('world').append(el('div', { className: 'hud-map' }, paths, ...pins), caption);
  return close;
}
