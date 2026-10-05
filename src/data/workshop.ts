import type { FurnitureId } from '../types/ids';
import { FURNITURE } from './furniture';
import type { ShelfRow, ShopRow } from './shop';

/**
 * Gourdon's workshop (0.3's S2), at his carpenter's bench: three pieces a day fresh off the bench
 * at the shelf's price, and his book, every piece he makes, made to order overnight for a quarter
 * more and brought round by Ollie in the morning.
 */

/**
 * Every piece he makes: every piece of furniture with a price, which is every piece a shop sells
 * (the sets and the yard's among them). A gift, a keepsake or a made piece has no price, so it
 * isn't in his book: a gift is one of a kind, and what she makes she makes at her workbench.
 */
export const WORKSHOP_PIECES: readonly FurnitureId[] = (
  Object.keys(FURNITURE) as FurnitureId[]
).filter((id) => FURNITURE[id].price !== undefined);

/** How much more a piece from his book costs than on a shelf, as a fraction: his evening's work. */
export const BOOK_MARKUP = 0.25;

/** The workshop's shelves, a row each, dealt as any shop's are (`systems/shop.ts`). */
export const WORKSHOP_SHELVES: readonly ShelfRow[] = [
  {
    name: 'Fresh from the bench',
    picks: [{ from: WORKSHOP_PIECES.map((furniture) => ({ furniture })), count: 3 }],
  },
];

/** His row in `SHOPS`. */
export const WORKSHOP: ShopRow = {
  name: "Gourdon's workshop",
  greeting: "Mind the sawdust. Three fresh off the bench today. Anything else, it's in the book.",
  shelves: WORKSHOP_SHELVES,
};

/** What he says over the book, in place of his greeting. */
export const BOOK_LINE =
  "Pick anything. I'll make it tonight, and Ollie brings it round in the morning. Bit extra for burning the candle late.";

/** The book's pages, by where a piece goes, in the order the sheet shows them. */
export type BookGroup = 'floor' | 'wall' | 'small' | 'yard';

export const BOOK_GROUPS: readonly { id: BookGroup; label: string }[] = [
  { id: 'floor', label: 'For the floor' },
  { id: 'wall', label: 'For the walls' },
  { id: 'small', label: 'Little things' },
  { id: 'yard', label: 'For the yard' },
];
