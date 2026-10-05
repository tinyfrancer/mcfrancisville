import {
  CRITTER_IDS,
  CRITTERS,
  FAMILY_NAMES,
  HABITAT_NAMES,
  PLACE_NAMES,
  RARITY_NAMES,
  isFish,
  type Family,
} from '../data/critters';
import { FOSSIL_IDS, FOSSILS } from '../data/fossils';
import { MUSEUM_GREETING } from '../data/museum';
import { WEATHER_NAMES } from '../data/weather';
import { hoursOf } from '../systems/critters';
import { ITEMS } from '../data/items';
import { MILESTONE_IDS, MILESTONES } from '../data/milestones';
import { shelfOf } from '../systems/milestones';
import type { CritterId, FossilId, ItemId, MilestoneId } from '../types/ids';
import { collection, fitIcon, SLOT_ICON, type Entry, type Group } from './collection';
import { MONTHS } from './CalendarSheet';
import { el, openSheet } from './dom';
import { CARD_ICON } from './itemCard';
import { dated } from './MailSheet';

/** What the Curiosity Cabinet and the museum may ask of the game. Neither reaches the world directly. */
export interface CabinetApi {
  /** The day she first caught one, or null; whether one is on show; whether any are about now. */
  critter(id: CritterId): { caughtOn: string | null; donated: boolean; outNow: boolean };
  /** How many she has in her bag. */
  inBag(id: CritterId | FossilId): number;
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
  /** How far along a shelf is (0.2's F2), and whether it's finished. */
  shelf(id: MilestoneId): { have: number; total: number; done: boolean };
  /** Whether she has ever had a squishy or a doll. */
  hasHad(id: ItemId): boolean;
  /** Draws a thing from her bag at 1×. */
  item(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Whether she has ever dug one up, and whether one is in the seventh case (0.3's C1). */
  fossil(id: FossilId): { found: boolean; donated: boolean };
  /** Puts a fossil from her bag in the seventh case: Wrapunzel's label, or null if it couldn't be. */
  donateFossil(id: FossilId): string | null;
  /** Draws a fossil as a shadow of itself, for one she hasn't dug up. */
  fossilSilhouette(canvas: HTMLCanvasElement, id: FossilId): void;
}

/** How a shelf's progress reads: "3 of 7", or a tick when it's finished. */
function tally(api: CabinetApi, id: MilestoneId): string {
  const { have, total, done } = api.shelf(id);
  return done
    ? `${MILESTONES[id].name}: all ${total} ✓`
    : `${MILESTONES[id].name}: ${have} of ${total}`;
}

/**
 * Her shelves to finish (0.2's F2), under the cases: each family and season with how far along
 * it is, and her squishies and monster dolls, a shadow for each she hasn't had yet.
 */
function shelvesOf(api: CabinetApi): HTMLElement {
  const lines = MILESTONE_IDS.filter((id) => !('wing' in MILESTONES[id].shelf)).map((id) => {
    const shelf = MILESTONES[id].shelf;
    const row = el('div', { className: 'hud-detail' }, el('strong', {}, tally(api, id)));
    if ('had' in shelf && shelf.had !== 'fossil') {
      const things = (shelfOf(shelf) as ItemId[]).map((thing) => {
        const had = api.hasHad(thing);
        const canvas = el('canvas', { className: 'hud-icon' });
        api.item(canvas, thing);
        fitIcon(canvas, SLOT_ICON);
        const slot = el('div', { className: had ? 'hud-slot' : 'hud-slot hud-unhad' }, canvas);
        slot.setAttribute('role', 'listitem');
        slot.setAttribute('aria-label', had ? ITEMS[thing].name : 'Not had yet');
        return slot;
      });
      const grid = el('div', { className: 'hud-bag' }, ...things);
      grid.setAttribute('role', 'list');
      row.append(grid);
    }
    return row;
  });
  return el(
    'section',
    { className: 'hud-shelves' },
    el('h3', {}, 'Shelves to finish'),
    el('p', {}, 'Finish one and someone will write. Wrapunzel is keeping count.'),
    ...lines,
  );
}

/** The months a critter is out, as the Cabinet tells it: "all year", "in May and June". */
function seasonOf(id: CritterId): string {
  const season = CRITTERS[id].season;
  if (!season) return 'all year';
  const [from, to] = season.map((m) => MONTHS[m - 1]!);
  return (season[1] - season[0] + 12) % 12 === 1 ? `in ${from} and ${to}` : `from ${from} to ${to}`;
}

/**
 * How rare a critter is, and when and where it's about, as the Cabinet tells it (0.2's F1): the
 * hint that stands in for a silhouette's name, and the note under a catch.
 */
export function whenAndWhere(id: CritterId): string {
  const row = CRITTERS[id];
  const places = row.where.map((z) => PLACE_NAMES[z]);
  const where =
    places.length > 1 ? `${places.slice(0, -1).join(', ')} or ${places.at(-1)}` : places[0];
  const weather = row.weather ? ` ${WEATHER_NAMES[row.weather]}` : '';
  const moon = row.moon ? ' on the night of a full moon' : '';
  const when = `${hoursOf(id)}${weather}${moon}`;
  return `${RARITY_NAMES[row.rarity]}. ${when}, ${HABITAT_NAMES[row.habitat]} ${where}, ${seasonOf(id)}`;
}

/** What the Cabinet says to look out for, for one she hasn't found. */
function lookOut(id: CritterId): string {
  if (CRITTERS[id].rarity === 'legendary') {
    return 'One of the rarest of all, and it waits for its moment. Be there when it says.';
  }
  return isFish(id)
    ? 'Look for its shadow in the water, and have your rod ready.'
    : 'Keep an eye out, and have your net ready.';
}

function critterCanvas(api: CabinetApi, id: CritterId, shadow: boolean): HTMLCanvasElement {
  const canvas = el('canvas', { className: 'hud-icon' });
  if (shadow) api.silhouette(canvas, id);
  else api.icon(canvas, id);
  fitIcon(canvas, SLOT_ICON);
  return canvas;
}

/** The fossils' tiers, as the Fossils tab groups them. */
const FOSSIL_GROUPS: readonly Group[] = (['common', 'uncommon', 'rare'] as const).map((id) => ({
  id,
  label: RARITY_NAMES[id],
}));

interface FossilEntry extends Entry {
  id: FossilId;
  known: boolean;
}

function fossilCanvas(api: CabinetApi, id: FossilId, shadow: boolean): HTMLCanvasElement {
  const canvas = el('canvas', { className: 'hud-icon' });
  if (shadow) api.fossilSilhouette(canvas, id);
  else api.item(canvas, id);
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
    tabs: [
      { id: 'cases', label: 'Cases' },
      { id: 'fossils', label: 'Fossils' },
      { id: 'shelves', label: 'Shelves' },
    ],
    memory: 'cabinet',
    onTab: (tab) => {
      cases.tools.hidden = tab !== 'cases';
      fossils.tools.hidden = tab !== 'fossils';
      sheet.actions(...actionsOn(tab));
    },
  });
  const actionsOn = (tab: string) =>
    tab === 'cases' ? [detail] : tab === 'fossils' ? [fossilDetail] : [];
  // The one she tapped, as an item card tells a thing in her bag: its picture big beside it.
  const picture = el('canvas', { className: 'hud-icon' });
  const box = el('span', { className: 'hud-icon-box' }, picture);
  box.hidden = true;
  const name = el('h3', {}, 'Tap a case to look closer');
  const about = el(
    'p',
    {},
    'Shadows are critters still to find. A ✦ means one could be out right now, somewhere.',
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
      about.textContent = e.known ? row.description : lookOut(e.id);
      const out = entry.outNow ? ' Out now!' : '';
      const shownLine = entry.donated ? ' On show at Crumbs & Curios.' : '';
      const caught = e.known ? ` First caught ${dated(entry.caughtOn!)}.${shownLine}` : '';
      when.textContent = `${whenAndWhere(e.id)}.${out}${caught}`;
      if (e.known) api.icon(picture, e.id);
      else api.silhouette(picture, e.id);
      fitIcon(picture, CARD_ICON);
      box.hidden = false;
    },
    pressed: (e) => e.id === picked,
    empty: '',
    memory: 'cabinet',
  });
  const detail = el(
    'div',
    { className: 'hud-detail hud-item-card' },
    box,
    el('div', { className: 'hud-item-text' }, name, about, when),
  );
  // The fossils she has dug up (0.3's C1), and shadows for the ones still in the ground.
  const fossilPicture = el('canvas', { className: 'hud-icon' });
  const fossilBox = el('span', { className: 'hud-icon-box' }, fossilPicture);
  fossilBox.hidden = true;
  const fossilName = el('h3', {}, 'Tap a fossil to look closer');
  const fossilAbout = el(
    'p',
    {},
    "A mound turns up in every place each day. Walk up to it and dig! Shadows are fossils you haven't dug up yet.",
  );
  const fossilWhere = el('p', { className: 'hud-message' });
  let pickedFossil: FossilId | null = null;
  const fossils = collection<FossilEntry>({
    label: 'the fossils',
    entries: () =>
      FOSSIL_IDS.map((id) => {
        const known = api.fossil(id).found;
        return {
          id,
          known,
          name: known ? FOSSILS[id].name : 'Not dug up yet',
          group: FOSSILS[id].rarity,
          isNew: false,
        };
      }),
    groups: FOSSIL_GROUPS,
    sorts: ['kind'],
    layout: 'grid',
    icon: (canvas, e) => (e.known ? api.item(canvas, e.id) : api.fossilSilhouette(canvas, e.id)),
    pick(e) {
      pickedFossil = e.id;
      const row = FOSSILS[e.id];
      fossilName.textContent = e.known ? row.name : 'Not dug up yet';
      fossilAbout.textContent = e.known ? row.description : row.hint;
      fossilWhere.textContent = e.known
        ? api.fossil(e.id).donated
          ? `${RARITY_NAMES[row.rarity]}. On show at Crumbs & Curios.`
          : `${RARITY_NAMES[row.rarity]}. Wrapunzel would love one for the seventh case.`
        : '';
      if (e.known) api.item(fossilPicture, e.id);
      else api.fossilSilhouette(fossilPicture, e.id);
      fitIcon(fossilPicture, CARD_ICON);
      fossilBox.hidden = false;
    },
    pressed: (e) => e.id === pickedFossil,
    empty: '',
    memory: 'cabinet-fossils',
  });
  const fossilDetail = el(
    'div',
    { className: 'hud-detail hud-item-card' },
    fossilBox,
    el('div', { className: 'hud-item-text' }, fossilName, fossilAbout, fossilWhere),
  );
  sheet.head.append(cases.tools, fossils.tools);
  sheet.panel('cases').append(cases.list);
  sheet.panel('fossils').append(fossils.list);
  sheet.panel('shelves').append(shelvesOf(api));
  cases.tools.hidden = sheet.tab() !== 'cases';
  fossils.tools.hidden = sheet.tab() !== 'fossils';
  sheet.actions(...actionsOn(sheet.tab()));
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
    tabs: [
      { id: 'donate', label: 'To donate' },
      { id: 'show', label: 'On show' },
    ],
  });
  const message = el('p', { className: 'hud-message' });

  const render = () => {
    const give = CRITTER_IDS.filter((id) => api.inBag(id) > 0 && !api.critter(id).donated);
    const giveFossils = FOSSIL_IDS.filter((id) => api.inBag(id) > 0 && !api.fossil(id).donated);
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
    const fossilRows = giveFossils.map((id) => {
      const donate = el('button', {
        type: 'button',
        className: 'hud-price hud-primary',
        textContent: 'Donate',
      });
      donate.addEventListener('click', () => {
        const label = api.donateFossil(id);
        if (label === null) return;
        render();
        message.textContent = label;
      });
      return el(
        'div',
        { className: 'hud-ware' },
        el('span', { className: 'hud-icon-box' }, fossilCanvas(api, id, false)),
        el(
          'div',
          { className: 'hud-ware-text' },
          el('strong', {}, FOSSILS[id].name),
          el('small', {}, 'Not in the seventh case yet'),
        ),
        donate,
      );
    });
    rows.push(...fossilRows);
    // A wing of the museum for each family, filling as she donates (0.2's F2), and the fossils'
    // seventh case (0.3's C1).
    const wings = MILESTONE_IDS.flatMap((wing) => {
      const shelf = MILESTONES[wing].shelf;
      if (!('wing' in shelf)) return [];
      if (shelf.wing === 'fossil') {
        const nooks = FOSSIL_IDS.map((id) => {
          const shown = api.fossil(id).donated;
          const slot = el('div', { className: shown ? 'hud-slot' : 'hud-slot hud-slot-empty' });
          slot.setAttribute('role', 'listitem');
          slot.setAttribute('aria-label', shown ? FOSSILS[id].name : 'An empty nook');
          if (shown) slot.append(fossilCanvas(api, id, false));
          return slot;
        });
        const grid = el('div', { className: 'hud-bag' }, ...nooks);
        grid.setAttribute('role', 'list');
        return [el('h4', {}, tally(api, wing)), grid];
      }
      const cases = (shelfOf(shelf) as CritterId[]).map((id) => {
        const shown = api.critter(id).donated;
        const slot = el('div', { className: shown ? 'hud-slot' : 'hud-slot hud-slot-empty' });
        slot.setAttribute('role', 'listitem');
        slot.setAttribute('aria-label', shown ? CRITTERS[id].name : 'An empty case');
        if (shown) slot.append(critterCanvas(api, id, false));
        return slot;
      });
      const grid = el('div', { className: 'hud-bag' }, ...cases);
      grid.setAttribute('role', 'list');
      return [el('h4', {}, tally(api, wing)), grid];
    });
    const onShow =
      CRITTER_IDS.filter((id) => api.critter(id).donated).length +
      FOSSIL_IDS.filter((id) => api.fossil(id).donated).length;
    message.textContent = '';
    sheet
      .panel('donate')
      .replaceChildren(
        el('h3', {}, 'To donate'),
        rows.length > 0
          ? el('div', { className: 'hud-wares' }, ...rows)
          : el(
              'p',
              {},
              "Nothing new to give today. Catch a critter or dig up a fossil the museum hasn't got, and bring it here!",
            ),
        message,
      );
    sheet
      .panel('show')
      .replaceChildren(
        el('h3', {}, `On show: ${onShow} of ${CRITTER_IDS.length + FOSSIL_IDS.length}`),
        ...wings,
      );
  };
  render();
  return sheet.close;
}
