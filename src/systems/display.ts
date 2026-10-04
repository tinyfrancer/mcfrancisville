import { setOf, SHOWS } from '../data/display';
import { isKept, ITEMS } from '../data/items';
import type { DisplayPiece, ItemId, SetPiece } from '../types/ids';

/**
 * What a set piece shows: one of each thing in its set that she owns, in the set's order, packed
 * from its first place, so it fills as hers does and never shows a gap.
 */
export function onShow(piece: SetPiece, owns: (id: ItemId) => boolean): ItemId[] {
  return setOf(piece).filter(owns);
}

/**
 * Whether a display piece will take a thing to show off: one of its kinds, and not one that's hers
 * to keep with her (Fibi's bone, the keepsakes), which the ice, the sky and the gates read from her
 * bag.
 */
export function takes(piece: DisplayPiece, id: ItemId): boolean {
  return SHOWS[piece].includes(ITEMS[id].kind) && !isKept(id);
}
