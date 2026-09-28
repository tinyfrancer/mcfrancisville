import type { CritterId, MapZoneId } from '../types/ids';
import type { Weather } from './weather';

/** What kind of critter it is, which is how the Curiosity Cabinet groups them. */
export type Family = 'moth' | 'bat' | 'frog' | 'orb' | 'beetle' | 'fish';

/**
 * Where in a place a critter turns up. Each is worked out from the map (`systems/critters.ts`): the
 * open ground by a lantern, a tree, a pumpkin, a gravestone or a clump of toadstools, the flower
 * patches, the banks of a pond or lake, and the edge of the water itself, which she nets from the
 * bank.
 */
export type Habitat =
  'lanterns' | 'flowers' | 'trees' | 'pumpkins' | 'graves' | 'mushrooms' | 'bank' | 'pond';

/** How often it's dealt out, among whatever else is about at that hour. */
export type Rarity = 'common' | 'uncommon' | 'rare';

export interface CritterRow {
  name: string;
  family: Family;
  /**
   * Out from `from` o'clock until `to` o'clock, round past midnight when `to` is the smaller: 20 to
   * 4 is eight at night until four in the morning. 0 to 24 is all day.
   */
  from: number;
  to: number;
  habitat: Habitat;
  /** The places it lives in (phase I): some only in one, the rest wherever their habitat is. */
  where: readonly MapZoneId[];
  rarity: Rarity;
  /** The only weather it comes out in, if it's particular (phase L). */
  weather?: Exclude<Weather, 'clear'>;
  /** How many times it flutters off before it lets itself be caught. Only the rare ones do. */
  wary: number;
  /** What Cobweb Corner pays for one, and half what a shop would ask. */
  value: number;
  /** Shown in her bag and in the Curiosity Cabinet once she's caught one. */
  description: string;
  plural?: string;
}

/**
 * The critters of McFrancisVille (phase 10): moths, bats, frogs, orbs, beetles and ghost-fish, each
 * with its own hours. The luna moth is hers (personal_touches.md, "The critters"); the orbs are green
 * and blue, and the rare pair is one of each, because forever orbs is what she and Cody call each
 * other.
 */
export const CRITTERS: Record<CritterId, CritterRow> = {
  lunaMoth: {
    name: 'Luna moth',
    family: 'moth',
    from: 20,
    to: 4,
    habitat: 'flowers',
    where: ['town', 'hiddenClearing'],
    rarity: 'rare',
    wary: 1,
    value: 220,
    description:
      'Pale green wings with long, swishy tails, like a ballgown made of moonlight. The loveliest ' +
      'thing that flies in McFrancisVille, and it knows it.',
  },
  candleMoth: {
    name: 'Candle moth',
    family: 'moth',
    from: 18,
    to: 3,
    habitat: 'lanterns',
    where: ['town', 'lanternShore', 'castleHill'],
    rarity: 'common',
    wary: 0,
    value: 25,
    description:
      'Its wings look like dribbles of candle wax. It loves the lanterns, and the lanterns are too ' +
      'polite to say anything.',
  },
  owlEyeMoth: {
    name: 'Owl-eye moth',
    family: 'moth',
    from: 16,
    to: 23,
    habitat: 'trees',
    where: ['town', 'whisperwood', 'castleHill'],
    rarity: 'uncommon',
    wary: 0,
    value: 60,
    description:
      'Two big eyespots on its wings, so it looks like a very sleepy owl. It is not an owl. It is ' +
      'a moth doing its best.',
  },
  ghostMoth: {
    name: 'Ghost moth',
    family: 'moth',
    from: 22,
    to: 6,
    habitat: 'graves',
    where: ['town'],
    rarity: 'common',
    wary: 0,
    value: 30,
    description:
      'Soft and white as a bedsheet with the eyeholes cut out. It flutters round the graves saying ' +
      'boo to nobody in particular.',
  },
  pumpkinBat: {
    name: 'Pumpkin bat',
    family: 'bat',
    from: 17,
    to: 22,
    habitat: 'pumpkins',
    where: ['town', 'castleHill'],
    rarity: 'common',
    wary: 0,
    value: 30,
    description:
      'A little bat with an orange tummy, round as a pumpkin, and for much the same reasons. It ' +
      'hangs about the pumpkin patches at dusk.',
  },
  velvetBat: {
    name: 'Velvet bat',
    family: 'bat',
    from: 20,
    to: 6,
    habitat: 'trees',
    where: ['town', 'whisperwood', 'castleHill'],
    rarity: 'common',
    wary: 0,
    value: 35,
    description:
      'Soft as a velvet cushion, with ears far too big for it. It swoops round the trees at night ' +
      'and squeaks when it gets it right.',
  },
  vampireBat: {
    name: 'Vampire bat',
    family: 'bat',
    from: 0,
    to: 4,
    habitat: 'graves',
    where: ['town'],
    rarity: 'rare',
    wary: 1,
    value: 180,
    description:
      'Tiny fangs, a tiny cape of wings, and a taste for nothing stronger than peach juice. Only ' +
      'out in the smallest hours, among the graves.',
  },
  lilyFrog: {
    name: 'Lily frog',
    family: 'frog',
    from: 6,
    to: 19,
    habitat: 'bank',
    where: ['town', 'lanternShore', 'hiddenClearing'],
    rarity: 'common',
    wary: 0,
    value: 20,
    description:
      'A bright green frog who sits by the pond all day, being extremely good at sitting by the pond.',
  },
  pumpkinToad: {
    name: 'Pumpkin toad',
    family: 'frog',
    from: 9,
    to: 18,
    habitat: 'pumpkins',
    where: ['town', 'castleHill'],
    rarity: 'uncommon',
    wary: 0,
    value: 55,
    description:
      'Orange, lumpy and ribbed down its back, so it can hide in a pumpkin patch in plain sight. ' +
      'It is very proud of this.',
  },
  glowToad: {
    name: 'Glow toad',
    family: 'frog',
    from: 19,
    to: 6,
    habitat: 'bank',
    where: ['town', 'lanternShore'],
    rarity: 'uncommon',
    wary: 0,
    value: 60,
    description:
      'Its spots light up after dark, so it can find its way home. It always finds its way home. ' +
      'Home is the pond.',
  },
  greenOrb: {
    name: 'Green orb',
    family: 'orb',
    from: 21,
    to: 6,
    habitat: 'graves',
    where: ['town'],
    rarity: 'uncommon',
    wary: 0,
    value: 70,
    description:
      'A soft green glow that bobs about the graveyard at night, humming to itself. Warm to hold, ' +
      'like a mug of tea.',
  },
  blueOrb: {
    name: 'Blue orb',
    family: 'orb',
    from: 21,
    to: 6,
    habitat: 'flowers',
    where: ['town', 'hiddenClearing'],
    rarity: 'uncommon',
    wary: 0,
    value: 70,
    description:
      'A little blue glow that drifts among the flowers at night. It seems to be looking for ' +
      'someone.',
  },
  orbPair: {
    name: 'Pair of orbs',
    family: 'orb',
    from: 23,
    to: 4,
    habitat: 'graves',
    where: ['town'],
    rarity: 'rare',
    wary: 1,
    value: 250,
    plural: 'pairs of orbs',
    description:
      'One green orb and one blue, circling each other and never more than a wingbeat apart. ' +
      'Forever orbs.',
  },
  skullBeetle: {
    name: 'Skull beetle',
    family: 'beetle',
    from: 6,
    to: 17,
    habitat: 'trees',
    where: ['town', 'whisperwood', 'castleHill'],
    rarity: 'common',
    wary: 0,
    value: 20,
    description:
      'A shiny black beetle with a little white skull on its back. Up close, the skull is smiling.',
  },
  jewelBeetle: {
    name: 'Blue jewel beetle',
    family: 'beetle',
    from: 10,
    to: 16,
    habitat: 'flowers',
    where: ['town', 'hiddenClearing', 'castleHill'],
    rarity: 'uncommon',
    wary: 0,
    value: 70,
    description:
      'The bluest thing in the garden, and it sparkles like a gem. Out in the brightest part of ' +
      'the day, showing off.',
  },
  firefly: {
    name: 'Firefly',
    family: 'beetle',
    plural: 'fireflies',
    from: 19,
    to: 24,
    habitat: 'flowers',
    where: ['town', 'whisperwood', 'hiddenClearing'],
    rarity: 'common',
    wary: 0,
    value: 25,
    description:
      'A beetle with a lantern for a tail. It blinks on, and off, and on, which is its way of ' +
      'saying hello.',
  },
  ghostMinnow: {
    name: 'Ghost minnow',
    family: 'fish',
    from: 0,
    to: 24,
    habitat: 'pond',
    where: ['town', 'lanternShore', 'hiddenClearing'],
    rarity: 'common',
    wary: 0,
    value: 15,
    description:
      'A tiny see-through fish. There are always a few about, at any hour, going round and round ' +
      'the pond.',
  },
  booKoi: {
    name: 'Boo koi',
    family: 'fish',
    plural: 'boo koi',
    from: 6,
    to: 19,
    habitat: 'pond',
    where: ['town', 'lanternShore'],
    rarity: 'uncommon',
    wary: 0,
    value: 60,
    description:
      'A pale koi splashed with lavender, with a face that looks a bit like it just said boo. ' +
      'It did. It says it to everyone.',
  },
  lanternFish: {
    name: 'Lantern fish',
    family: 'fish',
    from: 20,
    to: 6,
    habitat: 'pond',
    where: ['town', 'lanternShore'],
    rarity: 'uncommon',
    wary: 0,
    value: 80,
    description:
      'A round little fish with a light dangling in front of its nose. It lights the pond at night ' +
      'for everyone else.',
  },
  // Beyond the town (phase I).
  toadstoolToad: {
    name: 'Toadstool toad',
    family: 'frog',
    from: 5,
    to: 19,
    habitat: 'mushrooms',
    where: ['whisperwood', 'hiddenClearing'],
    rarity: 'common',
    wary: 0,
    value: 45,
    description:
      'A plump brown toad wearing a toadstool for a hat. Nobody knows where it got the hat. It ' +
      'will not be taking it off.',
  },
  mossBeetle: {
    name: 'Moss beetle',
    family: 'beetle',
    from: 6,
    to: 18,
    habitat: 'trees',
    where: ['whisperwood', 'castleHill'],
    rarity: 'uncommon',
    wary: 0,
    value: 70,
    description:
      'A little beetle with a soft green coat of moss on its back, like it has been sitting very ' +
      'still in the woods for a very long time. It has.',
  },
  wisp: {
    name: "Will-o'-the-wisp",
    family: 'orb',
    plural: "will-o'-the-wisps",
    from: 20,
    to: 5,
    habitat: 'mushrooms',
    where: ['whisperwood', 'hiddenClearing'],
    rarity: 'uncommon',
    wary: 0,
    value: 90,
    description:
      'A lilac light that bobs about the toadstools after dark. It likes to lead people places, ' +
      'but only nice places, like a picnic.',
  },
  mistNewt: {
    name: 'Mist newt',
    family: 'frog',
    from: 18,
    to: 7,
    habitat: 'bank',
    where: ['lanternShore'],
    rarity: 'uncommon',
    wary: 0,
    value: 80,
    description:
      'A pale newt that comes up out of the lake with the evening mist, speckled like a starry ' +
      'sky. It is cool to hold, and very polite.',
  },
  moonCarp: {
    name: 'Moon carp',
    family: 'fish',
    plural: 'moon carp',
    from: 0,
    to: 24,
    habitat: 'pond',
    where: ['lanternShore'],
    rarity: 'common',
    wary: 0,
    value: 35,
    description:
      'A silvery carp with scales like little moons. The lake is full of them, drifting under the ' +
      'lanterns, thinking carp thoughts.',
  },
  ghostPike: {
    name: 'Ghost pike',
    family: 'fish',
    from: 19,
    to: 5,
    habitat: 'pond',
    where: ['lanternShore'],
    rarity: 'rare',
    wary: 1,
    value: 260,
    description:
      'A long, pale, see-through pike with a toothy grin that is all for show. The biggest thing ' +
      'in Lantern Shore, and the shyest.',
  },
  lanternBat: {
    name: 'Lantern bat',
    family: 'bat',
    from: 20,
    to: 6,
    habitat: 'lanterns',
    where: ['lanternShore', 'castleHill'],
    rarity: 'common',
    wary: 0,
    value: 40,
    description:
      'A small golden bat that hangs about the lamps, warming its toes. Its ears glow when the ' +
      'light is behind them.',
  },
  wishingMoth: {
    name: 'Wishing moth',
    family: 'moth',
    from: 20,
    to: 4,
    habitat: 'flowers',
    where: ['hiddenClearing'],
    rarity: 'rare',
    wary: 1,
    value: 300,
    description:
      'Midnight-blue wings dusted with stars, found only in the hidden clearing. Catch one, and ' +
      'you get a wish. (The wish is that you caught one. It came true!)',
  },
  monarch: {
    name: 'Monarch butterfly',
    family: 'moth',
    from: 7,
    to: 19,
    habitat: 'flowers',
    where: ['castleHill'],
    rarity: 'common',
    wary: 0,
    value: 60,
    description:
      'Orange and black, and everywhere up at the castle: on the milkweed, the roses, the arch and ' +
      'the stones. A butterfly, not a moth, but the moths let it sit with them.',
  },
  // Out only in their weather (phase L).
  raindropFrog: {
    name: 'Raindrop frog',
    family: 'frog',
    from: 6,
    to: 22,
    habitat: 'bank',
    where: ['town', 'lanternShore', 'hiddenClearing'],
    rarity: 'uncommon',
    weather: 'rain',
    wary: 0,
    value: 90,
    description:
      'A little see-through frog, clear as a raindrop, that only comes out when it rains. It sits ' +
      'with its mouth open to catch the drops, and it has never once missed.',
  },
  veilMoth: {
    name: 'Veil moth',
    family: 'moth',
    from: 0,
    to: 24,
    habitat: 'trees',
    where: ['town', 'whisperwood', 'castleHill'],
    rarity: 'uncommon',
    weather: 'fog',
    wary: 0,
    value: 90,
    description:
      'A soft grey moth with wings as thin as a wedding veil, out only on foggy days. In the fog ' +
      'it is nearly invisible, which it finds very relaxing.',
  },
};

/**
 * How much likelier a family is to be dealt in some weather (phase L): frogs and fish love the
 * rain, and orbs and moths the fog. Whole numbers, since the deal is a whole-number draw.
 */
export const WEATHER_WEIGHT: Record<Weather, Partial<Record<Family, number>>> = {
  clear: {},
  rain: { frog: 3, fish: 2 },
  fog: { orb: 3, moth: 2 },
};

/** Every critter, in the order the Curiosity Cabinet shows them. */
export const CRITTER_IDS = Object.keys(CRITTERS) as CritterId[];

export const FAMILIES: readonly Family[] = ['moth', 'bat', 'frog', 'orb', 'beetle', 'fish'];

/** How a family is named on its shelf in the Curiosity Cabinet. */
export const FAMILY_NAMES: Record<Family, string> = {
  moth: 'Moths and butterflies',
  bat: 'Bats',
  frog: 'Frogs and toads',
  orb: 'Orbs',
  beetle: 'Beetles',
  fish: 'Ghost-fish',
};

/** Where a critter is to be found, as the Curiosity Cabinet says it. */
export const HABITAT_NAMES: Record<Habitat, string> = {
  lanterns: 'round the lanterns',
  flowers: 'among the flowers',
  trees: 'about the trees',
  pumpkins: 'by the pumpkins',
  graves: 'in the graveyard',
  mushrooms: 'by the toadstools',
  bank: "at the water's edge",
  pond: 'in the water',
};

/**
 * Each place as the Curiosity Cabinet says where to look. The hidden clearing is a secret, so it's
 * only hinted at.
 */
export const PLACE_NAMES: Record<MapZoneId, string> = {
  town: 'in town',
  whisperwood: 'in Whisperwood',
  lanternShore: 'at Lantern Shore',
  castleHill: 'up at the castle',
  hiddenClearing: 'somewhere hidden in the woods',
};

/** Whether it flies (moths, bats, orbs and fireflies), drawn in the air above its tile. */
export function flies(id: CritterId): boolean {
  const family = CRITTERS[id].family;
  return family === 'moth' || family === 'bat' || family === 'orb' || id === 'firefly';
}

export function isCritter(id: string): id is CritterId {
  return id in CRITTERS;
}
