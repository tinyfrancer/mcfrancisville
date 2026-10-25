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
import { shinyName, shinyOf } from '../data/shinies';
import { WEATHER_NAMES } from '../data/weather';
import { hoursOf, nextChance } from '../systems/critters';
import { handsOf } from '../systems/catchSize';
import { drifts } from '../systems/drift';
import { CALENDAR } from '../data/calendar';
import { DECOR } from '../data/holidays';
import { daysBetween } from '../systems/calendar';
import { ITEMS } from '../data/items';
import { MILESTONE_IDS, MILESTONES } from '../data/milestones';
import { shelfOf } from '../systems/milestones';
import type { ConstellationId, CritterId, FossilId, ItemId, MilestoneId } from '../types/ids';
import { CONSTELLATION_IDS, CONSTELLATIONS, FINDABLE_MONTHS } from '../data/constellations';
import { named } from './SkySheet';
import { collection, fitIcon, SLOT_ICON, type Entry, type Group } from './collection';
import { MONTHS } from './CalendarSheet';
import { el, openSheet } from './dom';
import { CARD_ICON } from './itemCard';
import { dated } from './MailSheet';

/** What the Curiosity Cabinet and the museum may ask of the game. Neither reaches the world directly. */
export interface CabinetApi {
  /**
   * The day she first caught one, or null; whether one is on show; whether any are about now; and
   * the biggest she has landed of a fish, in quarters of a hand (V1's R6a).
   */
  critter(id: CritterId): {
    caughtOn: string | null;
    donated: boolean;
    outNow: boolean;
    best?: number | null;
    /** The day she first caught it shiny, and whether its case shows a shiny (1.4's G1). */
    shinyOn?: string | null;
    shinyShown?: boolean;
  };
  /** How many she has in her bag. */
  inBag(id: ItemId): number;
  /**
   * Puts one from her bag on show, or its shiny in its case in place of the plain one: its label,
   * or null if it couldn't be.
   */
  donate(id: CritterId, shiny?: boolean): string | null;
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
  /** The day she first traced a constellation, or null (1.5's G4). */
  star(id: ConstellationId): string | null;
  /** Draws her star chart, the one picked framed. */
  chart(canvas: HTMLCanvasElement, picked: ConstellationId | null): void;
  /** The constellation at a fraction across and down the chart, or null. */
  chartAt(fx: number, fy: number): ConstellationId | null;
  /** Today's day key and the hour, for when each critter's next chance is (V1's R5). */
  now(): { day: string; hour: number };
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
    // The fossils have a tab of their own, and the figurines are too many for a grid: a tally each.
    if ('had' in shelf && (shelf.had === 'squishy' || shelf.had === 'doll')) {
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

/** When a constellation she hasn't found is up, as the chart tells it (1.5's G4). */
function upWhen(id: ConstellationId): { short: string; long: string } {
  const when = CONSTELLATIONS[id].when;
  if ('holiday' in when) {
    const name = CALENDAR[DECOR[when.holiday].holiday].name;
    return { short: name, long: `Out for ${name}, while the decorations are up` };
  }
  const from = MONTHS[when.month - 1]!;
  const to = MONTHS[(when.month + FINDABLE_MONTHS - 2) % 12]!;
  return { short: from, long: `Up from ${from} to the end of ${to}` };
}

/**
 * Her star chart (1.5's G4): the whole sky drawn as a map, each constellation lit once she has
 * traced it and faint with a question mark until then; a tap on one, or its name below, says
 * what it is, or when it's up and where to look.
 */
function skyOf(api: CabinetApi): HTMLElement {
  const found = CONSTELLATION_IDS.filter((id) => api.star(id) !== null).length;
  const chart = el('canvas', { className: 'hud-sky-chart' });
  const name = el('h3', {}, 'Tap a constellation to look closer');
  const about = el(
    'p',
    {},
    'Look through the telescope by the castle gate on a clear night, and trace the stars in order.',
  );
  const names = el('div', { className: 'hud-sky-chips' });
  let picked: ConstellationId | null = null;
  const pick = (id: ConstellationId | null) => {
    picked = id;
    api.chart(chart, picked);
    for (const chip of names.children) {
      chip.setAttribute('aria-pressed', String(chip.getAttribute('data-id') === picked));
    }
    if (!id) return;
    const on = api.star(id);
    name.textContent = on ? named(id) : 'Not found yet';
    about.textContent = on
      ? `${CONSTELLATIONS[id].about} Traced ${dated(on)}.`
      : `${upWhen(id).long}, through the telescope by the castle gate on a clear night.`;
  };
  chart.addEventListener('click', (e) => {
    const box = chart.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    pick(api.chartAt((e.clientX - box.left) / box.width, (e.clientY - box.top) / box.height));
  });
  chart.setAttribute('aria-hidden', 'true');
  names.setAttribute('role', 'group');
  names.setAttribute('aria-label', 'Your star chart');
  for (const id of CONSTELLATION_IDS) {
    const chip = el('button', { type: 'button', className: 'hud-sky-chip' });
    chip.textContent = api.star(id) !== null ? named(id) : `? ${upWhen(id).short}`;
    chip.setAttribute('data-id', id);
    chip.addEventListener('click', () => pick(id));
    names.append(chip);
  }
  pick(null);
  return el(
    'section',
    { className: 'hud-sky-tab' },
    el('p', {}, `${found} of ${CONSTELLATION_IDS.length} constellations on your star chart.`),
    chart,
    el('div', { className: 'hud-detail' }, name, about),
    names,
  );
}

/**
 * When a critter is out, as the Cabinet tells it: "all year", "in May and June", "for
 * Valentine's Day", and the day after each full or new moon for one that visits then (V1's R5).
 */
function seasonOf(id: CritterId): string {
  const { season, holiday, weather, moon } = CRITTERS[id];
  const visits = ', and the day after each full or new moon';
  if (holiday) return `for ${CALENDAR[DECOR[holiday].holiday].name}${visits}`;
  if (season) {
    const [from, to] = season.map((m) => MONTHS[m - 1]!);
    const months =
      (season[1] - season[0] + 12) % 12 === 1 ? `in ${from} and ${to}` : `from ${from} to ${to}`;
    return `${months}${visits}`;
  }
  if (weather && !moon) return `all year${visits} whatever the weather`;
  return 'all year';
}

/** "24th", for the date in a day key. */
function ordinal(date: number): string {
  const tens = Math.floor(date / 10) % 10;
  const suffix = tens === 1 ? 'th' : (['th', 'st', 'nd', 'rd'][date % 10] ?? 'th');
  return `${date}${suffix}`;
}

/**
 * When a critter's next chance is, from now (V1's R5): nothing if it could be out later today,
 * "visiting today" if that's a visit, and otherwise "next tomorrow", "next on the 24th", or "next
 * on the 3rd of November" a month on.
 */
export function nextOf(id: CritterId, now: { day: string; hour: number }): string {
  const next = nextChance(id, now.day, now.hour);
  if (!next) return '';
  const days = daysBetween(now.day, next.day);
  if (days === 0) return next.visit ? '; visiting today' : '';
  if (days === 1) return '; next tomorrow';
  const date = ordinal(Number(next.day.slice(8)));
  const month = Number(next.day.slice(5, 7));
  const sameMonth = month === Number(now.day.slice(5, 7));
  return sameMonth ? `; next on the ${date}` : `; next on the ${date} of ${MONTHS[month - 1]}`;
}

/**
 * How rare a critter is, and when and where it's about, as the Cabinet tells it (0.2's F1): the
 * hint that stands in for a silhouette's name, and the note under a catch.
 */
export function whenAndWhere(id: CritterId, now?: { day: string; hour: number }): string {
  const row = CRITTERS[id];
  const places = row.where.map((z) => PLACE_NAMES[z]);
  const where =
    places.length > 1 ? `${places.slice(0, -1).join(', ')} or ${places.at(-1)}` : places[0];
  const weather = row.weather ? ` ${WEATHER_NAMES[row.weather]}` : '';
  const moon = row.moon ? ' on the night of a full moon' : '';
  const when = `${hoursOf(id)}${weather}${moon}`;
  const next = now ? nextOf(id, now) : '';
  return `${RARITY_NAMES[row.rarity]}. ${when}, ${HABITAT_NAMES[row.habitat]} ${where}, ${seasonOf(id)}${next}`;
}

/** What the Cabinet says to look out for, for one she hasn't found. */
function lookOut(id: CritterId): string {
  const shy = drifts(id) ? ` ${SHY}` : '';
  if (CRITTERS[id].rarity === 'legendary') {
    return `One of the rarest of all, and it waits for its moment. Be there when it says.${shy}`;
  }
  return isFish(id)
    ? 'Look for its shadow in the water, and have your rod ready.'
    : `Keep an eye out, and have your net ready.${shy}`;
}

/** The Cabinet's word on a shy one, which drifts off if she rushes at it (V1's R6a). */
export const SHY = "It's shy: creep up on it slowly, or from behind.";

/** A fish's biggest, as the Cabinet's card says it, or how to have one measured (V1's R6a). */
function biggest(id: CritterId, best: number | null | undefined): string {
  if (!isFish(id)) return '';
  return best ? ` Your biggest: ${handsOf(best)} long.` : ' Land another to see how big it is.';
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
  const shinies = CRITTER_IDS.filter((id) => api.critter(id).shinyOn).length;
  const sheet = openSheet(hud, {
    title: 'Curiosity Cabinet',
    line: `${found} of ${CRITTER_IDS.length} found, ${shown} on show at Crumbs & Curios. ${shinies} of ${CRITTER_IDS.length} shinies.`,
    className: 'hud-cabinet-sheet',
    onClose: () => api.seen(),
    tabs: [
      { id: 'cases', label: 'Cases' },
      { id: 'fossils', label: 'Fossils' },
      { id: 'sky', label: 'Sky' },
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
  // Its shiny beside it, once she has caught one (1.4's G1).
  const shinyPicture = el('canvas', { className: 'hud-icon' });
  const shinyBox = el('span', { className: 'hud-icon-box' }, shinyPicture);
  shinyBox.hidden = true;
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
          ...(entry.shinyOn ? { badge: 'sparkle' as const } : {}),
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
      const caught = e.known
        ? ` First caught ${dated(entry.caughtOn!)}.${shownLine}${biggest(e.id, entry.best)}`
        : '';
      const shy = e.known && drifts(e.id) ? ` ${SHY}` : '';
      const shone = entry.shinyOn
        ? ` A shiny one first caught ${dated(entry.shinyOn)}.`
        : e.known
          ? ' Now and then one comes out shiny: look for a twinkle.'
          : '';
      when.textContent = `${whenAndWhere(e.id, api.now())}.${out}${caught}${shone}${shy}`;
      if (e.known) api.icon(picture, e.id);
      else api.silhouette(picture, e.id);
      fitIcon(picture, CARD_ICON);
      box.hidden = false;
      shinyBox.hidden = !entry.shinyOn;
      if (entry.shinyOn) {
        api.item(shinyPicture, shinyOf(e.id));
        fitIcon(shinyPicture, CARD_ICON);
      }
    },
    pressed: (e) => e.id === picked,
    empty: '',
    memory: 'cabinet',
  });
  const detail = el(
    'div',
    { className: 'hud-detail hud-item-card' },
    box,
    shinyBox,
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
  sheet.panel('sky').append(skyOf(api));
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
    // A shiny takes its case in place of the plain one (1.4's G1), once.
    const giveShinies = CRITTER_IDS.filter(
      (id) => api.inBag(shinyOf(id)) > 0 && !api.critter(id).shinyShown,
    );
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
    const shinyRows = giveShinies.map((id) => {
      const donate = el('button', {
        type: 'button',
        className: 'hud-price hud-primary',
        textContent: 'Donate',
      });
      donate.addEventListener('click', () => {
        const label = api.donate(id, true);
        if (label === null) return;
        render();
        message.textContent = label;
      });
      const canvas = el('canvas', { className: 'hud-icon' });
      api.item(canvas, shinyOf(id));
      fitIcon(canvas, SLOT_ICON);
      return el(
        'div',
        { className: 'hud-ware' },
        el('span', { className: 'hud-icon-box' }, canvas),
        el(
          'div',
          { className: 'hud-ware-text' },
          el('strong', {}, shinyName(id)),
          el(
            'small',
            {},
            api.critter(id).donated
              ? 'Would take its case in place of the plain one'
              : 'Not in the museum yet',
          ),
        ),
        donate,
      );
    });
    rows.push(...shinyRows, ...fossilRows);
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
        const { donated: shown, shinyShown } = api.critter(id);
        const slot = el('div', { className: shown ? 'hud-slot' : 'hud-slot hud-slot-empty' });
        slot.setAttribute('role', 'listitem');
        slot.setAttribute(
          'aria-label',
          shinyShown ? shinyName(id) : shown ? CRITTERS[id].name : 'An empty case',
        );
        if (shinyShown) {
          const canvas = el('canvas', { className: 'hud-icon' });
          api.item(canvas, shinyOf(id));
          fitIcon(canvas, SLOT_ICON);
          slot.append(canvas);
        } else if (shown) slot.append(critterCanvas(api, id, false));
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
