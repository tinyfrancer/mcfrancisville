import type { DisplayPiece, FurnitureId, ItemId, SetPiece } from '../types/ids';
import type { FurnitureRow } from './furniture';
import { ITEMS, type ItemKind } from './items';

/** The kinds of thing she collects a set of, which a set piece shows (0.3's H2). */
export type SetKind = Extract<
  ItemKind,
  'squishy' | 'doll' | 'record' | 'bead' | 'bracelet' | 'fossil'
>;

/**
 * What each set piece shows: one of every thing of its kind she owns (in her bag, her storage
 * chest, or on show in a display piece), in the order the set is listed, filling as hers does.
 */
export const SETS: Record<SetPiece, SetKind> = {
  squishyShelf: 'squishy',
  dollHouse: 'doll',
  recordRack: 'record',
  beadJar: 'bead',
  braceletWall: 'bracelet',
  fossilShelf: 'fossil',
};

/**
 * What each display piece will take from her bag to show off, one thing at a time. Fossils go in
 * the bell jar and on the plinth (0.3's C1).
 */
export const SHOWS: Record<DisplayPiece, readonly ItemKind[]> = {
  bellJar: ['critter', 'squishy', 'doll', 'flower', 'bead', 'bracelet', 'fossil'],
  displayFrame: ['critter', 'record', 'flower', 'bracelet'],
  plinth: ['doll', 'squishy', 'record', 'bracelet', 'critter', 'fossil'],
  terrarium: ['critter', 'flower'],
  budVase: ['flower'],
};

/** The whole set a set piece shows, in the order its things are listed: where each one sits. */
export function setOf(piece: SetPiece): readonly ItemId[] {
  return (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === SETS[piece]);
}

export function isSetPiece(id: FurnitureId): id is SetPiece {
  return id in SETS;
}

export function isDisplayPiece(id: FurnitureId): id is DisplayPiece {
  return id in SHOWS;
}

/** The new pieces that show things off (0.3's H2), sold on Cobweb Corner's furniture shelf. */
export const DISPLAY_FURNITURE: Record<
  Exclude<SetPiece, 'squishyShelf' | 'dollHouse' | 'fossilShelf'> | DisplayPiece,
  FurnitureRow
> = {
  recordRack: {
    name: 'Record crate',
    description:
      'A wooden crate that holds one of every record you have, sleeves up, to flick through like a proper music nerd.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You flick through your records. Every single one a banger.',
    price: 420,
  },
  beadJar: {
    name: 'Bead jar',
    description:
      'A big glass jar that shows off one of every kind of bead you have. Very satisfying to shake.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You give the bead jar a little shake. Clickety-clack.',
    price: 300,
  },
  braceletWall: {
    name: 'Bracelet board',
    description:
      'A velvet board with little pegs, to hang up one of every bracelet you have strung.',
    layer: 'wall',
    size: { w: 2, h: 1 },
    says: 'Every bracelet on its peg. You could wear them all at once. You probably shouldn’t.',
    price: 480,
  },
  bellJar: {
    name: 'Bell jar',
    description:
      'A glass bell jar on a little stand, to show off one treasure: a critter, a squishy, a doll, a flower. Walk up to it to choose.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    price: 380,
  },
  displayFrame: {
    name: 'Shadow box',
    description:
      'A deep frame with a velvet back, for hanging up a record, a pressed flower, a bracelet or a critter. Walk up to it to choose.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    price: 340,
  },
  plinth: {
    name: 'Little plinth',
    description:
      'A marble plinth, so your favourite thing can stand up where everyone can admire it. Walk up to it to choose.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    price: 360,
  },
  terrarium: {
    name: 'Terrarium',
    description:
      'A little glass house with moss inside, for a critter to be cozy in or a flower to keep fresh. Walk up to it to choose.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    price: 450,
  },
  budVase: {
    name: 'Bud vase',
    description: 'A slim vase for one perfect flower. Walk up to it to choose which.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    price: 260,
  },
};

/** What Cobweb Corner's furniture shelf may have of them, one a day. */
export const DISPLAY_WARES = Object.keys(DISPLAY_FURNITURE) as (keyof typeof DISPLAY_FURNITURE)[];
