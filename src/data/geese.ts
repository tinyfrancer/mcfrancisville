import type { DecorId } from './holidays';

/**
 * The porch geese (0.2's K1, personal_touches.md "Clutter (2)"): a goose on her porch and one on
 * Barty's, each dressed for the season, and for each big holiday while its decorations are up.
 * What they wear is worked out from the day key, so nothing about them is saved.
 */
export type GooseOutfit =
  | 'witch'
  | 'ghost'
  | 'santa'
  | 'antlers'
  | 'bunny'
  | 'hearts'
  | 'shamrock'
  | 'stars'
  | 'pilgrim'
  | 'party'
  | 'raincoat'
  | 'sunhat'
  | 'scarf'
  | 'bobble';

/** What she reads walking up to a goose in each outfit: hers first, then Barty's. */
export const GOOSE_OUTFITS: Record<GooseOutfit, readonly [hers: string, barty: string]> = {
  witch: [
    'Your porch goose is a witch today: a pointy hat and a little cape. Honk.',
    "Barty's goose is a witch today. He says she's the most powerful goose in town.",
  ],
  ghost: [
    'Your porch goose is a ghost today, in a sheet with two eyeholes. Boo. Honk.',
    "Barty's goose is a little ghost today, in a sheet with eyeholes. Her beak pokes out.",
  ],
  santa: [
    'Your porch goose has a Santa hat on, with a bobble. Ho ho honk!',
    "Barty's goose is in a Santa hat. He says she's been very good this year.",
  ],
  antlers: [
    'Your porch goose is a reindeer today, antlers and a red bow. She looks ready to fly.',
    "Barty's goose has antlers on and a red bow. Rudolph, eat your heart out.",
  ],
  bunny: [
    'Your porch goose has bunny ears on for Easter. A goose-bunny!',
    "Barty's goose has bunny ears on. He hid an egg under her, and forgot which goose.",
  ],
  hearts: [
    "Your porch goose has a pink bow on for Valentine's Day. She loves you. Honk.",
    "Barty's goose has a pink bow on. He says she's his valentine every year.",
  ],
  shamrock: [
    "Your porch goose has a little green top hat on for St Patrick's Day. Lucky goose!",
    "Barty's goose has a green top hat on, with a gold band. He's polished it.",
  ],
  stars: [
    'Your porch goose has a starry bandana on for the Fourth. Very patriotic. Honk.',
    "Barty's goose has a starry bandana on. She's been practising her fireworks face.",
  ],
  pilgrim: [
    'Your porch goose has a buckled hat and a white collar on for Thanksgiving. Grateful goose.',
    "Barty's goose is in a buckled hat and collar. He's very thankful for her.",
  ],
  party: [
    'Your porch goose has a party hat on for the New Year. Happy honk year!',
    "Barty's goose has a party hat on. She's staying up till midnight. She never does.",
  ],
  raincoat: [
    'Your porch goose is in a yellow raincoat and hat. Ready for a lovely rainy day.',
    "Barty's goose has her yellow rain hat on. She likes puddles as much as you do.",
  ],
  sunhat: [
    'Your porch goose has a straw sunhat and sunglasses on. Cool goose.',
    "Barty's goose has a sunhat and sunglasses on. She's working on her tan.",
  ],
  scarf: [
    'Your porch goose has a stripy scarf on, for the cosy weather.',
    "Barty's goose has a stripy scarf on. He knitted it himself, with two bones.",
  ],
  bobble: [
    'Your porch goose has a bobble hat and a scarf on. Toasty goose.',
    "Barty's goose has a bobble hat on. He says her ears get cold. Geese don't have ears.",
  ],
};

/** What they wear while a big holiday's decorations are up: hers, then Barty's. */
export const GOOSE_HOLIDAYS: Record<DecorId, readonly [GooseOutfit, GooseOutfit]> = {
  newYear: ['party', 'party'],
  valentines: ['hearts', 'hearts'],
  stPatricks: ['shamrock', 'shamrock'],
  easter: ['bunny', 'bunny'],
  fourthOfJuly: ['stars', 'stars'],
  halloween: ['witch', 'ghost'],
  thanksgiving: ['pilgrim', 'pilgrim'],
  christmas: ['santa', 'antlers'],
};

/**
 * What they wear the rest of the year, by the month (January first). All of October is the
 * Halloween Festival, so they're in costume all month.
 */
export const GOOSE_MONTHS: readonly (readonly [GooseOutfit, GooseOutfit])[] = [
  ['bobble', 'bobble'],
  ['bobble', 'scarf'],
  ['raincoat', 'raincoat'],
  ['raincoat', 'bunny'],
  ['raincoat', 'sunhat'],
  ['sunhat', 'sunhat'],
  ['sunhat', 'sunhat'],
  ['sunhat', 'raincoat'],
  ['scarf', 'scarf'],
  ['witch', 'ghost'],
  ['scarf', 'scarf'],
  ['bobble', 'santa'],
];
