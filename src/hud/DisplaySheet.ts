import { SHOWS } from '../data/display';
import { FURNITURE } from '../data/furniture';
import { ITEMS, type ItemKind } from '../data/items';
import type { DisplayPiece, ItemId } from '../types/ids';
import type { Stack } from '../world/Bag';
import { BAG_GROUPS, bagEntries, type BagEntry } from './BagSheet';
import { collection, fitIcon } from './collection';
import { el, openSheet, PICTURE } from './dom';
import { itemCard } from './itemCard';

/** What a display piece's sheet may ask of the game (0.3's H2). It never reaches the world. */
export interface DisplayApi {
  /** The display piece she walked up to, and what's on show in it; null if she's away from it. */
  piece(): { id: DisplayPiece; shows: ItemId | null } | null;
  /** What in her bag it would take, and how many of each she could spare. */
  offers(): readonly Stack[];
  /** Puts one on show from her bag, giving back what was there; false if she couldn't. */
  show(id: ItemId): boolean;
  /** Takes what's on show back into her bag; false if nothing was. */
  empty(): boolean;
  /** Draws the piece as it is now, with what's on show, at 1×. */
  picture(canvas: HTMLCanvasElement): void;
  itemIcon(canvas: HTMLCanvasElement, id: ItemId): void;
}

/** How a kind of thing is named in "a critter, a doll or a flower would look lovely in here". */
const A: Partial<Record<ItemKind, string>> = {
  critter: 'a critter',
  squishy: 'a squishy',
  doll: 'a doll',
  record: 'a record',
  flower: 'a flower',
  bead: 'a bead',
  bracelet: 'a bracelet',
};

export function wouldSuit(id: DisplayPiece): string {
  const words = SHOWS[id].flatMap((k) => A[k] ?? []);
  const last = words.pop() ?? 'something';
  const list = words.length > 0 ? `${words.join(', ')} or ${last}` : last;
  return list.charAt(0).toUpperCase() + list.slice(1);
}

/**
 * A bell jar, a shadow box, a plinth, a terrarium or a bud vase, walked up to at home: what's on
 * show in it, what from her bag it would take, and a card in the foot to put one in or take it out.
 * Nothing is lost: whatever comes out goes back in her bag.
 */
export function openDisplay(hud: HTMLElement, api: DisplayApi): () => void {
  const first = api.piece();
  if (!first) return () => {};
  const row = FURNITURE[first.id];
  const picture = el('canvas', { className: 'hud-icon' });
  const sheet = openSheet(hud, {
    title: row.name,
    picture,
    className: 'hud-display-sheet',
  });
  let picked: ItemId | null = null;
  const card = itemCard((canvas, id) => api.itemIcon(canvas, id));
  sheet.actions(card.element);

  const paint = (said?: string) => {
    const piece = api.piece();
    if (!piece) {
      sheet.close();
      return;
    }
    api.picture(picture);
    fitIcon(picture, PICTURE);
    const shows = piece.shows;
    sheet.line(
      shows
        ? `Your ${ITEMS[shows].name.toLowerCase()} is on show.`
        : `${wouldSuit(piece.id)} would look lovely in here.`,
    );
    const stack = picked ? api.offers().find((s) => s.id === picked) : undefined;
    if (stack) {
      const put = el('button', { type: 'button', className: 'hud-price hud-show-it' });
      put.textContent = shows ? 'Swap it in' : 'Put it in';
      put.addEventListener('click', () => {
        const id = stack.id;
        if (!api.show(id)) return;
        picked = null;
        things.refresh();
        paint('On show, just so.');
      });
      card.show(stack.id, stack.count, ITEMS[stack.id].description, put);
    } else if (shows) {
      const out = el('button', { type: 'button', className: 'hud-price hud-take-out' });
      out.textContent = 'Take it out';
      out.addEventListener('click', () => {
        if (!api.empty()) return;
        things.refresh();
        paint('Back in your bag, safe and sound.');
      });
      card.show(shows, 1, said ?? 'Tap something below to swap it, or take it out.', out);
    } else {
      picked = null;
      card.prompt(
        'Tap something to put it in',
        said ?? 'It goes back in your bag whenever you take it out.',
      );
    }
  };

  const things = collection<BagEntry>({
    label: `what you could put in the ${row.name.toLowerCase()}`,
    entries: () => bagEntries({ contents: () => api.offers(), isNew: () => false }),
    groups: BAG_GROUPS,
    sorts: ['kind', 'name', 'most'],
    layout: 'grid',
    icon: (canvas, e) => api.itemIcon(canvas, e.id),
    describe: (e) => `${e.name}, ${e.count}`,
    pick(e) {
      picked = e.id;
      paint();
    },
    pressed: (e) => e.id === picked,
    empty: `Nothing in your bag fits in here just now. ${wouldSuit(first.id)} would look lovely.`,
    memory: 'display',
  });
  sheet.head.append(things.tools);
  sheet.body.append(things.list);
  paint();
  return sheet.close;
}
