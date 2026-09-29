import { linksBetween } from '../systems/zones';
import type { ZoneId } from '../types/ids';
import type { Place } from '../world/services/Travel';
import { el, openSheet } from './dom';

/** What the world map may ask of the game. Like the other sheets, it never reaches the world. */
export interface MapApi {
  /** The places she has found, and a question mark beside each. */
  places(): Place[];
  /** Goes straight there; false if she can't. */
  go(id: ZoneId): boolean;
}

const SVG = 'http://www.w3.org/2000/svg';

/**
 * The world map (decisions.md 90): the places she has found, joined by the paths between them, and
 * a question mark down each path she hasn't taken. A tap on a place goes there; a tap on a
 * question mark says what's waiting.
 */
export function openMap(hud: HTMLElement, api: MapApi): () => void {
  const { body, close } = openSheet(hud, { title: 'Map', className: 'hud-map-sheet' });
  const places = api.places();
  const here = places.find((p) => p.here);
  const caption = el('p', {
    textContent: here ? `You're in ${here.name}. Tap a place to go there.` : 'Tap a place to go.',
  });

  // The paths first, under the places: a line between each two it shows.
  const paths = document.createElementNS(SVG, 'svg');
  paths.setAttribute('class', 'hud-map-paths');
  paths.setAttribute('viewBox', '0 0 100 100');
  paths.setAttribute('preserveAspectRatio', 'none');
  const at = new Map(places.map((p) => [p.id, p]));
  for (const [a, b] of linksBetween()) {
    const from = at.get(a);
    const to = at.get(b);
    if (!from || !to) continue;
    const line = document.createElementNS(SVG, 'line');
    line.setAttribute('x1', String(from.at.x));
    line.setAttribute('y1', String(from.at.y));
    line.setAttribute('x2', String(to.at.x));
    line.setAttribute('y2', String(to.at.y));
    if (!from.found || !to.found) line.setAttribute('class', 'hud-map-unknown');
    paths.append(line);
  }

  const pins = places.map((place) => {
    const pin = el('button', {
      type: 'button',
      className: `hud-map-place${place.here ? ' hud-map-here' : ''}${place.found ? '' : ' hud-map-unfound'}`,
    });
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
      } else if (api.go(place.id)) close();
    });
    return pin;
  });

  body.append(el('div', { className: 'hud-map' }, paths, ...pins), caption);
  return close;
}
