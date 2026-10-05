import { FURNITURE } from '../data/furniture';
import { SMALL } from '../data/tabletop';
import { BOOK_MARKUP, WORKSHOP_PIECES, type BookGroup } from '../data/workshop';
import { OUTDOOR } from '../data/yard';
import type { FurnitureId } from '../types/ids';
import { orderPrice } from './catalogue';

/**
 * Gourdon's book (0.3's S2): what a piece made to order costs, and which page it's on. Fresh from
 * the bench is a shelf, dealt as any shop's is.
 */

/** One page of his book: a piece, where it goes, and what he asks to make it. */
export interface BookPage {
  piece: FurnitureId;
  group: BookGroup;
  price: number;
}

/**
 * What he asks to make a piece: the shelf's full price and a quarter more, rounded up, so the book
 * is never the cheaper way to a piece a shelf has today. Null for one he doesn't make.
 */
export function bookPrice(piece: FurnitureId): number | null {
  if (!WORKSHOP_PIECES.includes(piece)) return null;
  const shelf = orderPrice({ furniture: piece });
  return shelf === null ? null : Math.ceil(shelf * (1 + BOOK_MARKUP));
}

/** Which page of the book a piece is on: the yard's, the little things, the walls, or the floor. */
export function bookGroupOf(piece: FurnitureId): BookGroup {
  if (OUTDOOR.has(piece)) return 'yard';
  if (SMALL.has(piece)) return 'small';
  return FURNITURE[piece].layer === 'wall' ? 'wall' : 'floor';
}

/** Every page of his book, in the order the pieces are kept. */
export function bookPages(): BookPage[] {
  return WORKSHOP_PIECES.flatMap((piece) => {
    const price = bookPrice(piece);
    return price === null ? [] : [{ piece, group: bookGroupOf(piece), price }];
  });
}
