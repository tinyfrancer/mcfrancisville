import type { CutId, FabricId, OutfitId, Slot } from '../types/ids';
import type { Look } from '../types/look';

export interface FabricRow {
  name: string;
  /** Every piece of clothing comes in at least one blue fabric: blue is her favourite. */
  blue?: true;
}

export const FABRICS: Record<FabricId, FabricRow> = {
  blue: { name: 'Blue', blue: true },
  navy: { name: 'Navy', blue: true },
  sky: { name: 'Sky', blue: true },
  denim: { name: 'Denim', blue: true },
  rose: { name: 'Rose' },
  coral: { name: 'Coral' },
  cream: { name: 'Cream' },
  plum: { name: 'Plum' },
  lavender: { name: 'Lavender' },
  ink: { name: 'Black' },
  moss: { name: 'Moss' },
  teal: { name: 'Teal' },
  pumpkin: { name: 'Pumpkin' },
  silver: { name: 'Silver' },
  gold: { name: 'Gold' },
  scarlet: { name: 'Scarlet' },
};

export interface OutfitRow {
  name: string;
  slot: Slot;
  cut: CutId;
  /** Fancy shoes, which the shops always have a pair or two of: she loves shoes. */
  fancy?: true;
  /** Worn in the top slot, and covers where a bottom would go. */
  dress?: true;
  /** The first is what it comes in; the rest are a tap away in the wardrobe. */
  fabrics: readonly FabricId[];
}

/**
 * Everything she can wear. The band tees are spooky puns on her favourite artists, with no real
 * names or logos, and the jersey is Bengals colours with 49 for 4/9 (personal_touches.md).
 */
export const OUTFITS: Record<OutfitId, OutfitRow> = {
  teeGhoulyParton: {
    name: 'Ghouly Parton tee',
    slot: 'top',
    cut: 'tee',
    fabrics: ['rose', 'blue', 'cream'],
  },
  teeLadyGhoulga: {
    name: 'Lady Ghoul-ga tee',
    slot: 'top',
    cut: 'tee',
    fabrics: ['ink', 'blue', 'plum'],
  },
  teeFleetwoodMacabre: {
    name: 'Fleetwood Mac-abre tee',
    slot: 'top',
    cut: 'tee',
    fabrics: ['teal', 'blue', 'ink'],
  },
  teeScreamDion: {
    name: 'Scream Dion tee',
    slot: 'top',
    cut: 'tee',
    fabrics: ['blue', 'lavender', 'cream'],
  },
  cozyTee: {
    name: 'Cozy tee',
    slot: 'top',
    cut: 'tee',
    fabrics: ['cream', 'blue', 'plum', 'rose', 'moss'],
  },
  jerseyTigers: {
    name: 'Tigers jersey, No. 49',
    slot: 'top',
    cut: 'jersey',
    fabrics: ['pumpkin', 'blue'],
  },
  sundressFloral: {
    name: 'Floral sundress',
    slot: 'top',
    cut: 'sundress',
    dress: true,
    fabrics: ['blue', 'lavender', 'cream'],
  },
  sundressGingham: {
    name: 'Gingham sundress',
    slot: 'top',
    cut: 'sundress',
    dress: true,
    fabrics: ['coral', 'blue', 'moss'],
  },
  wednesdayDress: {
    name: 'Wednesday collar dress',
    slot: 'top',
    cut: 'collarDress',
    dress: true,
    fabrics: ['ink', 'navy'],
  },
  jeans: { name: 'Jeans', slot: 'bottom', cut: 'jeans', fabrics: ['denim', 'ink', 'sky'] },
  cutoffs: { name: 'Cutoff shorts', slot: 'bottom', cut: 'cutoffs', fabrics: ['denim', 'sky'] },
  pleatedSkirt: {
    name: 'Pleated skirt',
    slot: 'bottom',
    cut: 'pleatedSkirt',
    fabrics: ['plum', 'ink', 'blue'],
  },
  sneakers: {
    name: 'High-top sneakers',
    slot: 'shoes',
    cut: 'sneakers',
    fabrics: ['cream', 'blue', 'rose'],
  },
  stompyBoots: {
    name: 'Stompy boots',
    slot: 'shoes',
    cut: 'boots',
    fabrics: ['ink', 'plum', 'navy'],
  },
  maryJanes: {
    name: 'Mary Janes',
    slot: 'shoes',
    cut: 'maryJanes',
    fabrics: ['ink', 'blue', 'rose'],
  },
  pumpkinBeanie: {
    name: 'Pumpkin beanie',
    slot: 'hat',
    cut: 'beanie',
    fabrics: ['pumpkin', 'blue', 'plum'],
  },
  batPendant: {
    name: 'Bat pendant',
    slot: 'necklace',
    cut: 'chainPendant',
    fabrics: ['silver', 'gold', 'blue'],
  },
  moonLocket: {
    name: 'Moon locket',
    slot: 'necklace',
    cut: 'chainPendant',
    fabrics: ['gold', 'silver', 'blue'],
  },
  pearlStrand: {
    name: 'Pearls',
    slot: 'necklace',
    cut: 'pearls',
    fabrics: ['cream', 'blue', 'rose'],
  },
  roundGlasses: {
    name: 'Round glasses',
    slot: 'glasses',
    cut: 'roundGlasses',
    fabrics: ['ink', 'blue', 'rose', 'gold'],
  },
  catEyeGlasses: {
    name: 'Cat-eye glasses',
    slot: 'glasses',
    cut: 'catEyeGlasses',
    fabrics: ['ink', 'blue', 'rose', 'gold'],
  },

  // From Cobweb Corner (phase 6). The scarlet-and-grey jersey is the Ohio State lookalike she was
  // to find later (personal_touches.md): colours only, no marks.
  teeBoneJovi: {
    name: 'Bone Jovi tee',
    slot: 'top',
    cut: 'tee',
    fabrics: ['ink', 'blue', 'cream'],
  },
  jerseyScarlet: {
    name: 'Scarlet & grey jersey',
    slot: 'top',
    cut: 'jersey',
    fabrics: ['scarlet', 'blue'],
  },
  sundressDots: {
    name: 'Polka-dot sundress',
    slot: 'top',
    cut: 'sundress',
    dress: true,
    fabrics: ['sky', 'rose', 'ink'],
  },

  // Fancy shoes, in both shops every day.
  glitterHeels: {
    name: 'Glitter heels',
    slot: 'shoes',
    cut: 'heels',
    fancy: true,
    fabrics: ['blue', 'silver', 'gold', 'rose'],
  },
  velvetPumps: {
    name: 'Velvet pumps',
    slot: 'shoes',
    cut: 'heels',
    fancy: true,
    fabrics: ['plum', 'navy', 'ink'],
  },
  platformMaryJanes: {
    name: 'Platform Mary Janes',
    slot: 'shoes',
    cut: 'platforms',
    fancy: true,
    fabrics: ['ink', 'blue', 'lavender'],
  },
  batBowFlats: {
    name: 'Bat-bow flats',
    slot: 'shoes',
    cut: 'flats',
    fancy: true,
    fabrics: ['ink', 'blue', 'rose'],
  },
  rhinestoneBoots: {
    name: 'Rhinestone cowgirl boots',
    slot: 'shoes',
    cut: 'tallBoots',
    fancy: true,
    fabrics: ['cream', 'blue', 'rose'],
  },
  kneeHighBoots: {
    name: 'Knee-high boots',
    slot: 'shoes',
    cut: 'tallBoots',
    fancy: true,
    fabrics: ['ink', 'navy', 'plum'],
  },
  moonbeamSandals: {
    name: 'Moonbeam sandals',
    slot: 'shoes',
    cut: 'sandals',
    fancy: true,
    fabrics: ['sky', 'lavender', 'silver'],
  },

  // Costumes, from the pop-up shop.
  witchHat: {
    name: 'Witch hat',
    slot: 'hat',
    cut: 'witchHat',
    fabrics: ['ink', 'navy', 'plum'],
  },
  catEars: { name: 'Cat ears', slot: 'hat', cut: 'catEars', fabrics: ['ink', 'blue', 'cream'] },
  skeletonTee: {
    name: 'Skeleton tee',
    slot: 'top',
    cut: 'tee',
    fabrics: ['ink', 'navy'],
  },
  jackOLanternDress: {
    name: "Jack-o'-lantern dress",
    slot: 'top',
    cut: 'sundress',
    dress: true,
    fabrics: ['pumpkin', 'blue', 'lavender'],
  },
};

/**
 * What the closet holds on the first day. Everything else is found in the shops (phase 6) or given
 * by her neighbours (phase 9).
 */
export const STARTER_WARDROBE: readonly OutfitId[] = [
  'teeGhoulyParton',
  'teeLadyGhoulga',
  'teeFleetwoodMacabre',
  'teeScreamDion',
  'cozyTee',
  'jerseyTigers',
  'sundressFloral',
  'sundressGingham',
  'wednesdayDress',
  'jeans',
  'cutoffs',
  'pleatedSkirt',
  'sneakers',
  'stompyBoots',
  'maryJanes',
  'pumpkinBeanie',
  'batPendant',
  'moonLocket',
  'pearlStrand',
  'roundGlasses',
  'catEyeGlasses',
];

/** Slots she may leave bare. A top is always on, and a bottom unless the top is a dress. */
export const OPTIONAL_SLOTS: readonly Slot[] = ['shoes', 'hat', 'necklace', 'glasses'];

/**
 * What the creator opens on. It is already her (split dye, gauges, sleeves, a band tee and jeans),
 * because the person who made the game knows her; she only has to type her name.
 */
export const DEFAULT_LOOK: Look = {
  name: '',
  skin: 'peach',
  eyes: 'brown',
  hairStyle: 'long',
  hairColour: 'splitDye',
  gauges: true,
  tattoos: 'sleeves',
  outfit: {
    top: { id: 'teeScreamDion', fabric: 'blue' },
    bottom: { id: 'jeans', fabric: 'denim' },
    shoes: { id: 'stompyBoots', fabric: 'ink' },
    necklace: { id: 'batPendant', fabric: 'silver' },
  },
};
