import type {
  Carvable,
  CritterId,
  DollId,
  FigurineId,
  FossilId,
  ItemId,
  SquishyId,
} from '../types/ids';
import { CRITTER_IDS } from './critters';
import { FOSSIL_IDS } from './fossils';
import type { FurnitureRow } from './furniture';
import { ITEMS } from './items';

/**
 * Gourdon's figurines (0.3's C3): three of a kind she has, a critter, a squishy, a doll or a
 * fossil, carved at his bench into a little painted figure of it on a plinth, a piece for her
 * floor or her tables. One for every carvable thing, made from its row rather than typed, and
 * none with a price, so none is ever on a shelf, in the catalogue or in his book.
 */

/** How many of a thing he carves one figurine from. */
export const CARVE_COUNT = 3;

/** Her squishies, as `ITEMS` has them (the figurines test holds the two together). */
export const SQUISHY_IDS: readonly SquishyId[] = [
  'ghostGooBall',
  'pumpkinGooBall',
  'blueMoonGooBall',
  'swampGooBall',
  'eyeballSquish',
  'booBao',
  'xiaoLongBoo',
  'batGyoza',
];

/** Her monster dolls, as `ITEMS` has them. */
export const DOLL_IDS = (Object.keys(ITEMS) as ItemId[]).filter(
  (id) => ITEMS[id].kind === 'doll',
) as DollId[];

/** The four kinds of thing he carves, as the workshop's tab groups them. */
export type CarvedKind = 'critter' | 'squishy' | 'doll' | 'fossil';

export const CARVED_KINDS: readonly { id: CarvedKind; label: string }[] = [
  { id: 'critter', label: 'Critters' },
  { id: 'squishy', label: 'Squishies' },
  { id: 'doll', label: 'Dolls' },
  { id: 'fossil', label: 'Fossils' },
];

/** Everything he carves, the critters first, in the order the Cabinet keeps them. */
export const CARVABLE: readonly Carvable[] = [
  ...CRITTER_IDS,
  ...SQUISHY_IDS,
  ...DOLL_IDS,
  ...FOSSIL_IDS,
];

/** Which kind of thing it is: each is in her bag as an item of that kind. */
export function carvedKindOf(thing: Carvable): CarvedKind {
  return ITEMS[thing].kind as CarvedKind;
}

/** The figurine of a thing. */
export function figurineOf(thing: Carvable): FigurineId {
  return `${thing}Figurine`;
}

/** Every figurine, in the order of what they're carved from. */
export const FIGURINE_IDS: readonly FigurineId[] = CARVABLE.map(figurineOf);

/** What each kind's figurine says of itself, after the thing's own name. */
const DESCRIBED: Record<CarvedKind, string> = {
  critter: 'carved in wood and painted true to life, on a little plinth. Made from three of them.',
  squishy: 'carved in wood and painted to look every bit as squishy. It is not. Gourdon checked.',
  doll: 'carved in wood and painted in her very best, on a little plinth. She stands so still.',
  fossil: 'carved in wood and painted to look ever so old, on a little stone plinth.',
};

/** What she hears or thinks when she walks up to one at home. */
const SAYS: Record<CarvedKind, string> = {
  critter: 'You give it a little pat. It stays exactly where it is, which makes a nice change.',
  squishy: 'You give it a squeeze out of habit. Wood. Still lovely.',
  doll: 'She stands on her plinth as if the whole room were hers. It might be.',
  fossil: 'A fossil of a fossil. Gourdon says that makes it twice as old.',
};

function figurineRow(thing: Carvable): FurnitureRow {
  const kind = carvedKindOf(thing);
  const { name } = ITEMS[thing];
  return {
    name: `${name} figurine`,
    description: `${name}, ${DESCRIBED[kind]}`,
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: SAYS[kind],
  };
}

/** Every figurine's row, made from the row of what it's carved from. */
export const FIGURINE_FURNITURE = Object.fromEntries(
  CARVABLE.map((thing) => [figurineOf(thing), figurineRow(thing)]),
) as Record<FigurineId, FurnitureRow>;

/** The one he carves of himself, for every figurine there is (the `figurines` shelf). */
export const CARVED_GOURDON: Record<'carvedGourdon', FurnitureRow> = {
  carvedGourdon: {
    name: 'Gourdon figurine',
    description:
      'Gourdon, carved by Gourdon, candle and all, for a figurine of everything there is.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: "Little Gourdon's candle flickers. He looks like he's thinking. He probably is.",
  },
};

/** What Gourdon says over the figurines, in place of his greeting. */
export const CARVING_LINE =
  "Bring me three of a kind and I'll carve you one. Critter, squishy, doll, old bones. Painted true.";

/** What the figurines tab says when she has nothing he could carve yet. */
export const NOTHING_TO_CARVE =
  "Nothing to carve from yet. Catch a few critters, or dig something up. I'll be here.";

/** Whether a thing is a critter (for the type: every carvable thing but these is an item). */
export function isCritterThing(thing: Carvable): thing is CritterId {
  return carvedKindOf(thing) === 'critter';
}

/** Whether a thing is a fossil. */
export function isFossilThing(thing: Carvable): thing is FossilId {
  return carvedKindOf(thing) === 'fossil';
}
