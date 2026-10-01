import type { CritterId, MapZoneId } from '../types/ids';
import type { Weather } from './weather';

/** What kind of critter it is, which is how the Curiosity Cabinet groups them. */
export type Family = 'moth' | 'bat' | 'frog' | 'orb' | 'beetle' | 'fish';

/**
 * Where in a place a critter turns up. Each is worked out from the map (`systems/critters.ts`): the
 * open ground by a lantern, a tree, a pumpkin, a gravestone or a clump of toadstools, the flower
 * patches, the banks of a pond or lake, the banks of the frozen creek, and the edge of the water
 * itself, where the fish swim within a cast of the bank.
 */
export type Habitat =
  | 'lanterns'
  | 'flowers'
  | 'trees'
  | 'pumpkins'
  | 'graves'
  | 'mushrooms'
  | 'bank'
  | 'creek'
  | 'pond';

/**
 * How often it's dealt out, among whatever else is about at that hour (0.2's F1, decision 150). A
 * legendary one also waits on its moment: a few hours of the night, its weather, or the full moon.
 */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

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
  /**
   * The months it's out (0.2's F1), from the first through the second, 1 to 12, round past December
   * when the second is the smaller: 10 to 3 is October until the end of March. All year if not said.
   */
  season?: readonly [from: number, to: number];
  /** Out only on the night of a full moon, which the calendar shows. */
  moon?: true;
  /** The only weather it comes out in, if it's particular (phase L). */
  weather?: Exclude<Weather, 'clear'>;
  /**
   * How many times it flutters off before it lets itself be caught. Only the rarest do. A wary
   * fish nibbles longer before it bites.
   */
  wary: number;
  /** A fish's shadow in the water (phase Q), small, middling or big: all she sees of it. */
  shadow?: 1 | 2 | 3;
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
    where: ['town', 'lanternShore', 'castleHill', 'fairground'],
    rarity: 'common',
    season: [2, 3],
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
    where: ['town', 'whisperwood', 'castleHill', 'fairground'],
    rarity: 'uncommon',
    season: [9, 1],
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
    where: ['fairground'],
    rarity: 'common',
    season: [10, 11],
    wary: 0,
    value: 30,
    description:
      'A little bat with an orange tummy, round as a pumpkin, and for much the same reasons. It ' +
      'hangs about the pumpkin patches at dusk.',
  },
  velvetBat: {
    name: 'Velvet bat',
    family: 'bat',
    from: 18,
    to: 6,
    habitat: 'trees',
    where: ['town', 'whisperwood', 'castleHill', 'fairground'],
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
    from: 23,
    to: 4,
    habitat: 'graves',
    where: ['town'],
    rarity: 'rare',
    wary: 1,
    value: 180,
    description:
      'Tiny fangs, a tiny cape of wings, and a taste for nothing stronger than peach juice. Only ' +
      'out late, in the smallest hours, among the graves.',
  },
  lilyFrog: {
    name: 'Lily frog',
    family: 'frog',
    from: 6,
    to: 19,
    habitat: 'bank',
    where: ['town', 'lanternShore', 'hiddenClearing'],
    rarity: 'common',
    season: [3, 8],
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
    where: ['fairground'],
    rarity: 'uncommon',
    season: [9, 11],
    wary: 0,
    value: 55,
    description:
      'Orange, lumpy and ribbed down its back, so it can hide in a pumpkin patch in plain sight. ' +
      'It is very proud of this.',
  },
  glowToad: {
    name: 'Glow toad',
    family: 'frog',
    from: 18,
    to: 7,
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
    from: 20,
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
    from: 20,
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
    rarity: 'legendary',
    wary: 1,
    value: 400,
    plural: 'pairs of orbs',
    description:
      'One green orb and one blue, circling each other and never more than a wingbeat apart. ' +
      'Forever orbs.',
  },
  skullBeetle: {
    name: 'Skull beetle',
    family: 'beetle',
    from: 6,
    to: 19,
    habitat: 'trees',
    where: ['town', 'whisperwood', 'castleHill', 'fairground'],
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
    where: ['castleHill'],
    rarity: 'uncommon',
    season: [8, 9],
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
    where: ['fairground'],
    rarity: 'common',
    season: [6, 7],
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
    shadow: 1,
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
    shadow: 2,
    rarity: 'uncommon',
    season: [4, 9],
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
    shadow: 1,
    rarity: 'uncommon',
    season: [11, 3],
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
    to: 21,
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
    to: 20,
    habitat: 'trees',
    where: ['whisperwood', 'castleHill', 'fairground'],
    rarity: 'uncommon',
    season: [3, 11],
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
    season: [9, 2],
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
    season: [12, 1],
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
    shadow: 2,
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
    shadow: 3,
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
    from: 18,
    to: 6,
    habitat: 'lanterns',
    where: ['lanternShore', 'castleHill', 'fairground'],
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
    from: 23,
    to: 3,
    habitat: 'flowers',
    where: ['hiddenClearing'],
    rarity: 'legendary',
    wary: 1,
    value: 450,
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
    rarity: 'uncommon',
    season: [6, 10],
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
    season: [4, 5],
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
    where: ['town', 'whisperwood', 'castleHill', 'fairground'],
    rarity: 'uncommon',
    weather: 'fog',
    wary: 0,
    value: 90,
    description:
      'A soft grey moth with wings as thin as a wedding veil, out only on foggy days. In the fog ' +
      'it is nearly invisible, which it finds very relaxing.',
  },
  // Caught with her rod (phase Q), like every fish now.
  pumpkinseed: {
    name: 'Pumpkinseed',
    family: 'fish',
    from: 5,
    to: 18,
    habitat: 'pond',
    where: ['town', 'hiddenClearing'],
    shadow: 1,
    rarity: 'common',
    season: [3, 11],
    wary: 0,
    value: 20,
    description:
      'A little round sunfish, orange underneath and freckled like the inside of a pumpkin. It ' +
      'really is called a pumpkinseed, and it is very proud of it.',
  },
  catfish: {
    name: 'Black catfish',
    family: 'fish',
    plural: 'black catfish',
    from: 17,
    to: 7,
    habitat: 'pond',
    where: ['town', 'lanternShore'],
    shadow: 2,
    rarity: 'uncommon',
    wary: 0,
    value: 70,
    description:
      "Sleek and black, with long whiskers and two little points on its head like a cat's ears. " +
      'It comes up in the evening, and nobody can work out how, but it purrs.',
  },
  fogEel: {
    name: 'Fog eel',
    family: 'fish',
    from: 0,
    to: 24,
    habitat: 'pond',
    where: ['lanternShore'],
    shadow: 3,
    rarity: 'uncommon',
    weather: 'fog',
    wary: 0,
    value: 90,
    description:
      'Long and soft and grey, like a ribbon of the fog itself. It only comes up when the lake is ' +
      'misty, so it can feel at home.',
  },
  blueMoonfish: {
    name: 'Blue moonfish',
    family: 'fish',
    from: 18,
    to: 5,
    habitat: 'pond',
    where: ['lanternShore'],
    shadow: 2,
    rarity: 'legendary',
    moon: true,
    wary: 1,
    value: 480,
    description:
      'Round, blue as anything and softly shining, with a pale crescent moon on each side. It ' +
      'comes up once in a blue moon, which is to say: in the lake, on the night of a full one.',
  },
  // Out by day (0.2's F1), so the net has something to do before the lanterns are lit.
  tombstoneToad: {
    name: 'Tombstone toad',
    family: 'frog',
    from: 7,
    to: 19,
    habitat: 'graves',
    where: ['town'],
    rarity: 'common',
    wary: 0,
    value: 25,
    description:
      'A grey toad speckled with lichen, who sits so still on the gravestones that people try to ' +
      'read it. It says: HERE SITS A TOAD. It is very happy there.',
  },
  mourningCloak: {
    name: 'Mourning cloak',
    family: 'moth',
    from: 8,
    to: 18,
    habitat: 'flowers',
    where: ['town', 'whisperwood', 'castleHill', 'fairground'],
    rarity: 'uncommon',
    wary: 0,
    value: 65,
    description:
      'A butterfly in a dark velvet cloak with pale spots, dressed up for a very sad party. ' +
      'It is not sad at all. It just likes the outfit.',
  },
  reedFrog: {
    name: 'Reed frog',
    family: 'frog',
    from: 6,
    to: 20,
    habitat: 'bank',
    where: ['lanternShore'],
    rarity: 'common',
    wary: 0,
    value: 30,
    description:
      'A little golden frog, speckled green, that clings to the reeds by the lake, humming. The same three notes, ' +
      'all day long. It is working on a fourth.',
  },
  ladybug: {
    name: 'Ladybug',
    family: 'beetle',
    from: 8,
    to: 18,
    habitat: 'flowers',
    where: ['town', 'hiddenClearing', 'castleHill', 'fairground'],
    rarity: 'common',
    season: [3, 10],
    wary: 0,
    value: 25,
    description:
      'Red with black spots, and very polite: it curtsies before it flies. Out among the flowers ' +
      'from spring until the leaves fall, then off somewhere cosy for the winter.',
  },
  // The top of the Cabinet (0.2's F1): hers to squeal at.
  herculesBeetle: {
    name: 'Hercules beetle',
    family: 'beetle',
    from: 21,
    to: 2,
    habitat: 'trees',
    where: ['whisperwood', 'castleHill'],
    rarity: 'legendary',
    wary: 1,
    value: 480,
    description:
      'The biggest beetle anyone has ever seen, as long as your hand, with a horn out front like ' +
      'a knight with a lance. It is a gentle giant, and it lets you hold it if you ask nicely.',
  },
  axolotl: {
    name: 'Axolotl',
    family: 'frog',
    from: 16,
    to: 24,
    habitat: 'creek',
    where: ['whisperwood'],
    rarity: 'legendary',
    weather: 'rain',
    wary: 1,
    value: 500,
    description:
      'Pink and soft, with frilly gills like a little crown and a smile that never, ever stops. It ' +
      'comes up by the frozen creek on rainy evenings, to see what all the pitter-patter is about.',
  },
  glowJelly: {
    name: 'Glowing jellyfish',
    family: 'fish',
    plural: 'glowing jellyfish',
    from: 22,
    to: 3,
    habitat: 'pond',
    where: ['lanternShore'],
    shadow: 2,
    rarity: 'legendary',
    wary: 1,
    value: 500,
    description:
      'A little lake jellyfish, no bigger than a teacup, that glows soft pink and lilac and drifts ' +
      'up under the lanterns late at night. It pulses, gently, like a heartbeat. It does not sting.',
  },
};

/**
 * How much likelier a family is to be dealt in some weather (phase L): frogs love the rain, and
 * orbs and moths the fog. Whole numbers, since the deal is a whole-number draw. The fish love the
 * rain too, and come up one more in it (`RAIN_FISH`), since they're dealt apart (phase Q).
 */
export const WEATHER_WEIGHT: Record<Weather, Partial<Record<Family, number>>> = {
  clear: {},
  rain: { frog: 3 },
  fog: { orb: 4, moth: 2 },
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
  fish: 'Fish',
};

/** How the Curiosity Cabinet names each tier (0.2's F1). */
export const RARITY_NAMES: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
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
  creek: 'by the frozen creek',
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
  fairground: 'at the fairground',
};

/** Whether it flies (moths, bats, orbs and fireflies), drawn in the air above its tile. */
export function flies(id: CritterId): boolean {
  const family = CRITTERS[id].family;
  return family === 'moth' || family === 'bat' || family === 'orb' || id === 'firefly';
}

/** Whether it's a fish, caught on her rod rather than in her net (phase Q). */
export function isFish(id: CritterId): boolean {
  return CRITTERS[id].family === 'fish';
}

export function isCritter(id: string): id is CritterId {
  return id in CRITTERS;
}
