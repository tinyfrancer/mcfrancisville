import { el } from './dom';

/** One thing in a collection, as the collection sorts, filters and finds it. */
export interface Entry {
  id: string;
  name: string;
  /** Which filter it comes under. */
  group: string;
  /** How many she has, where that's worth saying. */
  count?: number;
  /** It arrived since she last looked. */
  isNew?: boolean;
  /** A little mark in the corner of its slot, where there's no count: ✦ for a critter out now. */
  mark?: string;
  /** A word on its slot where "new" would go, if it isn't new: "on" for a bracelet she wears. */
  tag?: string;
}

export type SortId = 'kind' | 'name' | 'new' | 'most';

const SORT_NAMES: Record<SortId, string> = {
  kind: 'By kind',
  name: 'A to Z',
  new: 'New first',
  most: 'Most first',
};

/** How she's looking at a collection: one group or all of them, in what order, for what. */
export interface View {
  group: string | null;
  sort: SortId;
  query: string;
}

/** Folds case and accents away, so "cafe" finds "Café". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/**
 * The entries she'd see: those in the group, whose name has every word she typed in it, in the
 * order asked for. "By kind" is the collection's own order; every other order falls back on it.
 */
export function arrange<E extends Entry>(entries: readonly E[], view: View): E[] {
  const words = fold(view.query).split(/\s+/).filter(Boolean);
  const shown = entries.filter(
    (e) =>
      (view.group === null || e.group === view.group) &&
      words.every((w) => fold(e.name).includes(w)),
  );
  const order = new Map(entries.map((e, i) => [e, i]));
  const byKind = (a: E, b: E) => order.get(a)! - order.get(b)!;
  const compare: Record<SortId, (a: E, b: E) => number> = {
    kind: byKind,
    name: (a, b) => a.name.localeCompare(b.name) || byKind(a, b),
    new: (a, b) => Number(b.isNew === true) - Number(a.isNew === true) || byKind(a, b),
    most: (a, b) => (b.count ?? 0) - (a.count ?? 0) || byKind(a, b),
  };
  return shown.sort(compare[view.sort]);
}

/** The HUD's two icon boxes: a slot in a grid, and the picture at the start of a row. */
export const SLOT_ICON = 48;
export const ROW_ICON = 64;

/**
 * Sizes an icon drawn at 1× to the largest whole scale that fits its box, so every pixel is a
 * whole block of CSS pixels whatever size its grid is (16, 24, 32 or 64).
 */
export function fitIcon(canvas: HTMLCanvasElement, box: number): void {
  const side = Math.max(canvas.width, canvas.height, 1);
  const scale = Math.max(1, Math.floor(box / side));
  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
}

export interface Group {
  id: string;
  label: string;
}

export interface CollectionOptions<E extends Entry> {
  /** What it's called, for VoiceOver: "your bag". */
  label: string;
  entries(): readonly E[];
  /** The filters, in order; "All" comes first by itself. None, and there are no filter chips. */
  groups: readonly Group[];
  /** The orders she can pick, the first the one it opens in. */
  sorts: readonly SortId[];
  /** A grid of slots with a picture each, or a list of rows. */
  layout: 'grid' | 'list';
  /** Draws an entry's picture into a canvas at 1×. */
  icon(canvas: HTMLCanvasElement, entry: E): void;
  /** What VoiceOver reads for a slot, when it isn't just the name. */
  describe?(entry: E): string;
  /** A list row's line under the name, and what goes at its end (a button). */
  row?(entry: E): { about: string | Node; end?: HTMLElement; extra?: Node };
  /** A tap on a slot in a grid. It's drawn again after, to show what changed. */
  pick?(entry: E): void;
  /** Whether a slot is pressed in: the one she picked, or what she's wearing. */
  pressed?(entry: E): boolean;
  /** What it says with nothing in it at all. */
  empty: string;
  /** Remembers how she last looked at it while the game is open: a filter, an order. */
  memory?: string;
}

export interface Collection {
  /** The search box, the filters and the order: for the sheet's head, to stay in sight. */
  tools: HTMLElement;
  /** The slots or rows: for the sheet's body, to scroll. */
  list: HTMLElement;
  /** Draws it again from its entries, as they are now. */
  refresh(): void;
}

/** A grid fills out to whole rows, with at least four, so it looks roomy rather than bare. */
const PER_ROW = 5;
const MIN_SLOTS = 20;

export function slotCount(filled: number): number {
  return Math.max(MIN_SLOTS, Math.ceil((filled + 1) / PER_ROW) * PER_ROW);
}

/** Search a collection only once it's big enough to need it. */
const SEARCH_FROM = 12;

const remembered = new Map<string, Omit<View, 'query'>>();

/**
 * One collection, drawn the same way everywhere (phase M): the bag, the closet, the storage chest,
 * the Curiosity Cabinet and the workbench. It sorts, filters and searches, and marks what's new
 * with a little "new" until she has looked.
 */
export function collection<E extends Entry>(options: CollectionOptions<E>): Collection {
  const kept = options.memory ? remembered.get(options.memory) : undefined;
  const view: View = {
    group: kept?.group && options.groups.some((g) => g.id === kept.group) ? kept.group : null,
    sort: kept && options.sorts.includes(kept.sort) ? kept.sort : options.sorts[0]!,
    query: '',
  };
  const remember = () => {
    if (options.memory) remembered.set(options.memory, { group: view.group, sort: view.sort });
  };

  const list = el('div', {
    className: options.layout === 'grid' ? 'hud-bag hud-collection' : 'hud-wares hud-collection',
  });
  list.setAttribute('role', 'list');
  list.setAttribute('aria-label', options.label);

  const search = el('input', {
    type: 'search',
    className: 'hud-search',
    placeholder: 'Find…',
    autocomplete: 'off',
  });
  search.setAttribute('aria-label', `Find in ${options.label}`);
  search.setAttribute('enterkeyhint', 'search');
  search.addEventListener('input', () => {
    view.query = search.value;
    refresh();
  });
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') search.blur();
  });

  const sort = el('button', { type: 'button', className: 'hud-chip hud-sort' });
  const showSort = () => {
    sort.textContent = `↕ ${SORT_NAMES[view.sort]}`;
    sort.setAttribute('aria-label', `Order: ${SORT_NAMES[view.sort]}. Tap to change.`);
  };
  sort.addEventListener('click', () => {
    const at = options.sorts.indexOf(view.sort);
    view.sort = options.sorts[(at + 1) % options.sorts.length]!;
    remember();
    showSort();
    refresh();
  });
  showSort();
  sort.hidden = options.sorts.length < 2;

  const chips = el('div', { className: 'hud-choices hud-tabs hud-filters' });
  chips.setAttribute('role', 'group');
  chips.setAttribute('aria-label', 'Show');
  const groups: (Group | { id: null; label: string })[] = [
    { id: null, label: 'All' },
    ...options.groups,
  ];
  const chipButtons = groups.map((g) => {
    const chip = el('button', { type: 'button', className: 'hud-chip', textContent: g.label });
    chip.addEventListener('click', () => {
      view.group = g.id;
      remember();
      refresh();
    });
    return chip;
  });
  chips.append(...chipButtons);

  const searchRow = el('div', { className: 'hud-find' }, search, sort);
  const tools = el('div', { className: 'hud-collection-tools' }, searchRow, chips);

  const slot = (entry: E) => {
    const canvas = el('canvas', { className: 'hud-icon' });
    options.icon(canvas, entry);
    fitIcon(canvas, SLOT_ICON);
    const b = el('button', { type: 'button', className: 'hud-slot' }, canvas);
    b.setAttribute('role', 'listitem');
    const name = options.describe?.(entry) ?? entry.name;
    b.setAttribute('aria-label', entry.isNew ? `${name}, new` : name);
    b.setAttribute('aria-pressed', String(options.pressed?.(entry) === true));
    if (entry.count !== undefined && entry.count > 1) {
      b.append(el('span', { className: 'hud-count' }, String(entry.count)));
    } else if (entry.mark) b.append(el('span', { className: 'hud-count' }, entry.mark));
    if (entry.isNew) b.append(el('span', { className: 'hud-new' }, 'new'));
    else if (entry.tag) b.append(el('span', { className: 'hud-new hud-tag' }, entry.tag));
    b.addEventListener('click', () => {
      options.pick?.(entry);
      refresh();
    });
    return b;
  };

  const row = (entry: E) => {
    const canvas = el('canvas', { className: 'hud-icon' });
    options.icon(canvas, entry);
    fitIcon(canvas, ROW_ICON);
    const parts = options.row?.(entry) ?? { about: '' };
    const title = el('strong', {}, entry.name);
    if (entry.count !== undefined && entry.count > 1) title.append(` ×${entry.count}`);
    if (entry.isNew) title.append(' ', el('span', { className: 'hud-new' }, 'new'));
    const r = el(
      'div',
      { className: 'hud-ware' },
      el('span', { className: 'hud-icon-box' }, canvas),
      el(
        'span',
        { className: 'hud-ware-text' },
        title,
        el('small', {}, parts.about),
        ...(parts.extra ? [parts.extra] : []),
      ),
      ...(parts.end ? [parts.end] : []),
    );
    r.setAttribute('role', 'listitem');
    return r;
  };

  function refresh() {
    const all = options.entries();
    const shown = arrange(all, view);
    chipButtons.forEach((b, i) =>
      b.setAttribute('aria-pressed', String(groups[i]!.id === view.group)),
    );
    // Only the filters with something under them, so a tap never finds an empty shelf.
    chipButtons.forEach((b, i) => {
      const id = groups[i]!.id;
      b.hidden = id !== null && id !== view.group && !all.some((e) => e.group === id);
    });
    chips.hidden = options.groups.length === 0;
    searchRow.hidden = all.length < SEARCH_FROM && view.query === '';
    const items: HTMLElement[] = shown.map((e) => (options.layout === 'grid' ? slot(e) : row(e)));
    if (shown.length === 0) {
      const said = all.length === 0 ? options.empty : 'Nothing here matches. Try another word?';
      list.replaceChildren(el('p', { className: 'hud-empty' }, said));
      return;
    }
    if (options.layout === 'grid') {
      const pad = view.group === null && view.query === '' ? slotCount(shown.length) : 0;
      for (let i = shown.length; i < pad; i++) {
        items.push(el('div', { className: 'hud-slot hud-slot-empty' }));
      }
    }
    list.replaceChildren(...items);
  }

  refresh();
  return { tools, list, refresh };
}
