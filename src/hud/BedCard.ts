import { CROPS } from '../data/crops';
import { ITEMS } from '../data/items';
import type { BedAction, BedJob, BedLook } from '../systems/beds';
import type { ItemId } from '../types/ids';
import { fitIcon } from './collection';
import { el } from './dom';

/** What the bed's pop-up may ask of the game. Like the sheets, it never reaches the world. */
export interface BedApi {
  /** The bed whose pop-up is up, and what it says; null when none is. */
  look(): BedLook | null;
  /** Walks her up to the bed to do `job`. */
  go(job: BedJob): void;
  close(): void;
  /** Calls `listener` when the bed, what she holds, her bag or where she is changes. */
  onChange(listener: () => void): () => void;
  itemIcon(canvas: HTMLCanvasElement, id: ItemId): void;
}

/** Where the bed is on the page, in client pixels: the middle of its top edge, and its height. */
export interface BedSpot {
  x: number;
  top: number;
  height: number;
}

/** The pop-up's words: what's in the bed, how it's doing, and what a tap will do. */
export interface BedWords {
  title: string;
  status: string;
  /** What the button (and a second tap on the bed) does; null when there's nothing to do. */
  action: string | null;
  /** The row button, when there is one. */
  row: string | null;
  /** The button that takes its sprinkler out, when it has one. */
  unfit: string | null;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const WATERED: Record<NonNullable<BedLook['watered']>, string> = {
  can: 'Watered today.',
  rain: "The rain's watering it today.",
  sprinkler: 'Your sprinkler waters it every morning.',
};

function actionLabel(action: BedAction): string | null {
  switch (action.kind) {
    case 'till':
      return 'Dig it over';
    case 'choose':
      return 'Plant a seed';
    case 'sow':
      return `Plant a ${ITEMS[action.seed].name.toLowerCase()}`;
    case 'water':
      return 'Water it';
    case 'pick':
      return 'Pick it!';
    case 'fit':
      return 'Fit your sprinkler here';
    case 'wait':
      return null;
  }
}

export function bedWords(look: BedLook): BedWords {
  const unfit = look.sprinkler ? 'Take the sprinkler out' : null;
  const action = actionLabel(look.action);
  const row = look.row > 1 ? `Plant the row (${look.row})` : null;
  if (!look.tilled) {
    return {
      title: 'A wild bed',
      status: "Dig it over, and it's ready for a seed.",
      action,
      row,
      unfit,
    };
  }
  if (!look.crop) {
    const damp = look.watered === 'sprinkler' ? ' Your sprinkler keeps it nice and damp.' : '';
    return { title: 'An empty bed', status: `Ready for a seed.${damp}`, action, row, unfit };
  }
  const title = capital(CROPS[look.crop].name);
  if (look.stage === 'ripe') {
    return { title, status: 'Ripe and ready to pick!', action, row, unfit };
  }
  const days = look.days ?? 0;
  const when = days <= 1 ? 'Ripe tomorrow.' : `Ripe in ${days} days.`;
  const water = look.watered ? WATERED[look.watered] : 'Thirsty! A drink today brings it on a day.';
  const rest = look.action.kind === 'wait' ? ' Nothing to do till tomorrow.' : '';
  return { title, status: `${when} ${water}${rest}`, action, row, unfit };
}

/** The picture on the pop-up: what's growing, or the seed or sprinkler in her hand. */
function iconOf(look: BedLook): ItemId | null {
  if (look.crop) return CROPS[look.crop].harvest.item;
  if (look.action.kind === 'sow') return look.action.seed;
  if (look.action.kind === 'fit') return 'sprinkler';
  return null;
}

/** How far above the bed the pop-up sits, and how close to the edges it may go. */
const GAP = 6;
const MARGIN = 8;
/**
 * How long a new pop-up ignores taps. A phone sends the tap's click after the finger lifts, by
 * which time the pop-up is up; it mustn't land on a button that wasn't there when she tapped.
 */
const SETTLE_MS = 400;

/**
 * A bed's pop-up (phase P): a small card over the bed she tapped, saying what's in it, how it's
 * doing and what a tap will do, with that as its button. A second tap on the bed does the same.
 * It follows the bed as the camera moves (`place`), and goes when she taps anywhere else.
 */
export function bedCard(api: BedApi): {
  element: HTMLElement;
  render(): void;
  place(spot: BedSpot | null): void;
} {
  const element = el('div', { className: 'hud-card hud-bed' });
  element.setAttribute('role', 'group');
  element.hidden = true;
  let shown: BedLook | null = null;
  let shownAt = 0;
  let placed = false;
  const settled = () => performance.now() - shownAt >= SETTLE_MS;

  const button = (label: string, job: BedJob, primary = false) => {
    const b = el('button', { type: 'button', className: primary ? 'hud-primary' : '' }, label);
    b.addEventListener('click', () => {
      if (settled()) api.go(job);
    });
    return b;
  };

  const render = () => {
    const was = shown;
    shown = api.look();
    element.hidden = shown === null;
    if (!shown) return;
    if (!was || was.tx !== shown.tx || was.ty !== shown.ty) {
      // Out of sight until it's over its bed, rather than wherever the last one was.
      shownAt = performance.now();
      placed = false;
      element.style.visibility = 'hidden';
    }
    const words = bedWords(shown);
    element.setAttribute('aria-label', words.title);
    const close = el('button', { type: 'button', className: 'hud-bed-close' }, '✕');
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => {
      if (settled()) api.close();
    });
    const head = el('div', { className: 'hud-bed-head' });
    const item = iconOf(shown);
    if (item) {
      const icon = el('canvas', { className: 'hud-icon' });
      api.itemIcon(icon, item);
      fitIcon(icon, 32);
      head.append(icon);
    }
    head.append(el('strong', {}, words.title), close);
    const buttons = el('div', { className: 'hud-row' });
    if (words.action) buttons.append(button(words.action, 'tend', true));
    if (words.row) buttons.append(button(words.row, 'row'));
    if (words.unfit) buttons.append(button(words.unfit, 'unfit'));
    element.replaceChildren(head, el('p', {}, words.status));
    if (buttons.childElementCount > 0) element.append(buttons);
  };

  const place = (spot: BedSpot | null) => {
    if (!shown || !spot) return;
    const parent = element.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0, width: 0 };
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const maxLeft = Math.max(MARGIN, parent.width - width - MARGIN);
    const left = Math.min(maxLeft, Math.max(MARGIN, spot.x - parent.left - width / 2));
    let top = spot.top - parent.top - height - GAP;
    // No room above it (the bed's near the top of the screen): under it instead.
    if (top < MARGIN) top = spot.top - parent.top + spot.height + GAP;
    element.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    if (!placed) {
      placed = true;
      element.style.visibility = '';
    }
  };

  api.onChange(render);
  render();
  return { element, render, place };
}
