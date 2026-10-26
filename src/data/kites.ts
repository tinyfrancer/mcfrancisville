import type { KiteId, MapZoneId } from '../types/ids';
import type { ItemRow } from './items';

/*
 * A kite (1.6's X6, decision 385): three from Cobweb Corner, held from the quick bar and flown
 * from the end of Lantern Shore's pier or the castle lookout on a day the wind is up there. A tap
 * on the spot with one in hand, or on herself standing there, lifts it; any tap brings it in.
 * The wind is dealt from the day (`windyOn` in `systems/kite.ts`), the flying kept by
 * `world.kite` (`world/services/Kite.ts`), and the kite drawn up in the sky by the `kite` pass.
 */

export const KITE_IDS: readonly KiteId[] = ['batKite', 'ghostKite', 'mothKite'];

export const KITE_ITEMS = {
  batKite: {
    name: 'Bat kite',
    kind: 'kite',
    description:
      'A kite shaped like a bat with its wings out wide, and a tail of little purple bows. It flaps when the wind gets under it. It thinks it is flying itself.',
  },
  ghostKite: {
    name: 'Ghost kite',
    kind: 'kite',
    description:
      'A round white ghost of a kite with a wavy hem and a surprised face, and a long tail of white ribbons. Up in the sky it looks like it is having the time of its life.',
  },
  mothKite: {
    name: 'Moth kite',
    kind: 'kite',
    description:
      'A luna moth kite in pale green, with two long swallowtails and a spot on each wing. On a breezy day it flutters just like the real thing, only much higher.',
  },
  // Hers to keep, the first time a kite goes up.
  skyOnAString: {
    name: 'Sky on a string',
    kind: 'keepsake',
    plural: 'skies on strings',
    description:
      "A kite string's worth of sky from your first flight, wound round a little wooden spool. Hold it to your ear and you can hear the wind.",
  },
} as const satisfies Record<KiteId | 'skyOnAString', ItemRow>;

/** What Cobweb Corner pays for one, so a kite costs twice this; the keepsake isn't for sale. */
export const KITE_VALUES = { batKite: 60, ghostKite: 60, mothKite: 60, skyOnAString: 0 } as const;

/**
 * Where a kite goes up: a named spot in each windy place (`SPOTS` in `data/maps.ts`), and the
 * tiles round it. The end of the pier, out over the lake, and the castle lookout by the telescope.
 */
export const KITE_FIELDS = {
  lanternShore: 'pierEnd',
  castleHill: 'lookout',
} as const satisfies Partial<Record<MapZoneId, string>>;

export type KitePlace = keyof typeof KITE_FIELDS;

/**
 * How often the wind is up for a kite in each place, out of a hundred clear days: the castle hill
 * is the windier, as its ambience's wind is the strongest anywhere. Never on a rainy or foggy day.
 */
export const WINDY_CHANCE: Record<KitePlace, number> = { lanternShore: 50, castleHill: 65 };

/** Said as a kite goes up, by the kite. */
export const KITE_UP: Record<KiteId, string> = {
  batKite: 'Up goes the bat kite, flapping like it means it! Tap anywhere to wind it in.',
  ghostKite: 'Up goes the ghost kite, its ribbons streaming. Whooo! Tap anywhere to wind it in.',
  mothKite: 'Up goes the moth kite, fluttering on the breeze. Tap anywhere to wind it in.',
};

/** The first time any kite goes up, and the keepsake that comes of it. */
export const KITE_FIRST =
  'Your very first kite flight! You wind a little of the sky onto a spool to keep.';

export const KITE_IN = 'You wind the kite back in, hand over hand. What a lovely bit of sky.';

/** Holding a kite at the spot on a still day. */
export const KITE_STILL =
  "Not a breath of wind today. The kite flops. Maybe tomorrow! Today's calendar says when it's breezy.";

/** Holding a kite anywhere else. */
export const KITE_NOWHERE =
  'Not enough wind here. Try the end of the pier at Lantern Shore, or the castle lookout, on a breezy day.';
