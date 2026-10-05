import { CATALOGUE_GREETING, CATALOGUE_GROUPS } from '../data/catalogue';
import type { Ware } from '../data/shop';
import { keyOf } from '../systems/catalogue';
import type { ItemId } from '../types/ids';
import type { CatalogueEntry } from '../world/services/Catalogue';
import { collection, fitIcon, ROW_ICON, type Entry } from './collection';
import { el, openSheet } from './dom';
import { candy, orderedLine, wareName } from './messages';
import { drawWare, faceOf, type WareArt } from './wares';

/** What Ollie's catalogue may ask of the game (0.3's S1). It never reaches the world directly. */
export interface CatalogueApi extends WareArt {
  candy(): number;
  /** Every page: everything she has ever had that a shop sells, and its price. */
  entries(): readonly CatalogueEntry[];
  /** What's on its way, ordered and not yet come. */
  onTheWay(): readonly Ware[];
  /** How many of a thing she has in her bag. */
  count(id: ItemId): number;
  /** Whether she has something kept once already. */
  owns(ware: Ware): boolean;
  /** Orders one, to come in the morning; false if it couldn't be ordered. */
  order(ware: Ware): boolean;
}

interface Page extends Entry {
  entry: CatalogueEntry;
  about: string;
}

const TABS = [
  { id: 'pages', label: 'Catalogue' },
  { id: 'coming', label: 'On its way' },
] as const;

/**
 * Ollie's catalogue, at his post counter: every page something she has had, by kind and
 * searchable, a price and an Order button each; and what's on its way, to come in the morning.
 */
export function openCatalogue(hud: HTMLElement, api: CatalogueApi): () => void {
  const sheet = openSheet(hud, {
    title: "Ollie's catalogue",
    line: CATALOGUE_GREETING,
    className: 'hud-catalogue-sheet',
    tabs: TABS,
    onTab: () => render(),
  });
  const purse = el('p', { className: 'hud-purse' });
  const message = el('p', { className: 'hud-message' });
  const has = { count: (id: ItemId) => api.count(id), owns: (w: Ware) => api.owns(w) };

  const pages = collection<Page>({
    label: "Ollie's catalogue",
    entries: () =>
      api.entries().map((entry) => {
        const face = faceOf(entry.ware, has);
        return {
          id: keyOf(entry.ware),
          name: face.name,
          group: entry.group,
          entry,
          about: face.about,
        };
      }),
    groups: CATALOGUE_GROUPS,
    sorts: ['kind', 'name'],
    layout: 'list',
    icon: (canvas, page) => drawWare(canvas, api, page.entry.ware),
    row: (page) => ({ about: page.about, end: orderButton(page) }),
    empty: 'Nothing in it yet! Whatever you buy at a shop can be ordered here again.',
    memory: 'catalogue',
  });

  function orderButton(page: Page): HTMLElement {
    const { ware, price, yours } = page.entry;
    const b = el('button', { type: 'button', className: 'hud-price' });
    b.textContent = yours ? 'Yours' : candy(price);
    b.disabled = yours || price > api.candy();
    b.setAttribute('aria-label', yours ? `${page.name}, yours` : `Order ${page.name} for ${price}`);
    b.addEventListener('click', () => {
      if (!api.order(ware)) return;
      message.textContent = orderedLine(ware);
      render();
    });
    return b;
  }

  function coming(): HTMLElement {
    const wares = api.onTheWay();
    if (wares.length === 0) {
      return el(
        'p',
        { className: 'hud-empty' },
        'Nothing on its way just now. Anything you order comes in the morning.',
      );
    }
    const rows = wares.map((ware) => {
      const icon = el('canvas', { className: 'hud-icon' });
      drawWare(icon, api, ware);
      fitIcon(icon, ROW_ICON);
      return el(
        'div',
        { className: 'hud-ware' },
        el('span', { className: 'hud-icon-box' }, icon),
        el(
          'span',
          { className: 'hud-ware-text' },
          el('strong', {}, wareName(ware)),
          el('small', {}, 'In your mailbox in the morning.'),
        ),
      );
    });
    return el('div', { className: 'hud-wares' }, ...rows);
  }

  function render(): void {
    purse.textContent = `${candy(api.candy())} Candy`;
    const browsing = sheet.tab() === 'pages';
    finder.hidden = !browsing;
    if (browsing) pages.refresh();
    else sheet.panel('coming').replaceChildren(coming());
  }

  const head = el('div', { className: 'hud-shop-head' }, purse, message);
  const finder = el('div', { className: 'hud-shop-finder' }, pages.tools);
  sheet.head.append(head, finder);
  sheet.panel('pages').append(pages.list);
  render();
  return sheet.close;
}
