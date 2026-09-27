import type { CritterId } from '../types/ids';

/** What kind of critter it is, which is how the Curiosity Cabinet groups them. */
export type Family = 'moth' | 'bat' | 'frog' | 'orb' | 'beetle' | 'fish';

/**
 * Where in town a critter turns up. Each is worked out from the map (`systems/critters.ts`): the
 * open ground by a lantern, a tree, a pumpkin or a gravestone, the flower patches, the pond's banks,
 * and the edge of the pond itself, which she nets from the bank.
 */
export type Habitat = 'lanterns' | 'flowers' | 'trees' | 'pumpkins' | 'graves' | 'bank' | 'pond';

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
  rarity: Rarity;
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
    rarity: 'uncommon',
    wary: 0,
    value: 80,
    description:
      'A round little fish with a light dangling in front of its nose. It lights the pond at night ' +
      'for everyone else.',
  },
};

/** Every critter, in the order the Curiosity Cabinet shows them. */
export const CRITTER_IDS = Object.keys(CRITTERS) as CritterId[];

export const FAMILIES: readonly Family[] = ['moth', 'bat', 'frog', 'orb', 'beetle', 'fish'];

/** How a family is named on its shelf in the Curiosity Cabinet. */
export const FAMILY_NAMES: Record<Family, string> = {
  moth: 'Moths',
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
  bank: "on the pond's bank",
  pond: 'in the pond',
};

/** Whether it flies (moths, bats, orbs and fireflies), drawn in the air above its tile. */
export function flies(id: CritterId): boolean {
  const family = CRITTERS[id].family;
  return family === 'moth' || family === 'bat' || family === 'orb' || id === 'firefly';
}

export function isCritter(id: string): id is CritterId {
  return id in CRITTERS;
}
