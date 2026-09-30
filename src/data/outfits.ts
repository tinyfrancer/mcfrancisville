import type { CutId, FabricId, OutfitId, Slot } from '../types/ids';
import type { Look } from '../types/look';

export interface FabricRow {
  name: string;
  /** Every piece of clothing that recolours comes in at least one blue: blue is her favourite. */
  blue?: true;
}

export const FABRICS: Record<FabricId, FabricRow> = {
  blue: {
    name: 'Blue',
    blue: true,
  },
  navy: {
    name: 'Navy',
    blue: true,
  },
  sky: {
    name: 'Sky',
    blue: true,
  },
  denim: {
    name: 'Denim',
    blue: true,
  },
  rose: {
    name: 'Rose',
  },
  coral: {
    name: 'Coral',
  },
  cream: {
    name: 'Cream',
  },
  plum: {
    name: 'Plum',
  },
  lavender: {
    name: 'Lavender',
  },
  ink: {
    name: 'Black',
  },
  moss: {
    name: 'Moss',
  },
  teal: {
    name: 'Teal',
  },
  pumpkin: {
    name: 'Pumpkin',
  },
  silver: {
    name: 'Silver',
  },
  gold: {
    name: 'Gold',
  },
  scarlet: {
    name: 'Scarlet',
  },
  maroon: {
    name: 'Maroon',
  },
};

export interface OutfitRow {
  name: string;
  /** What it is, in the shop and the closet. It says nothing of colour unless it only has one. */
  description: string;
  slot: Slot;
  cut: CutId;
  /** Fancy shoes, which the shops always have a pair or two of: she loves shoes. */
  fancy?: true;
  /** Worn in the top slot, and covers where a bottom would go. */
  dress?: true;
  /** The first is what it comes in; the rest are a tap away in the wardrobe. */
  fabrics: readonly FabricId[];
  /**
   * Comes in its one colour and never another: team colours, and Cody's tee that matches his
   * (decision 141). No colours are offered for it, anywhere.
   */
  fixed?: true;
}

/**
 * Everything she can wear. The band tees are spooky puns on her favourite artists, with no real
 * names or logos, and the jersey is Bengals colours with 49 for 4/9 (personal_touches.md).
 */
export const OUTFITS: Record<OutfitId, OutfitRow> = {
  teeGhoulyParton: {
    name: 'Ghouly Parton tee',
    description:
      'A soft band tee with a golden butterfly on the front, from the ninth farewell tour.',
    slot: 'top',
    cut: 'tee',
    fabrics: ['rose', 'blue', 'cream'],
  },
  teeLadyGhoulga: {
    name: 'Lady Ghoul-ga tee',
    description:
      'A band tee with a golden lightning bolt down the front, made for dancing in the dark.',
    slot: 'top',
    cut: 'tee',
    fabrics: ['ink', 'blue', 'plum'],
  },
  teeFleetwoodMacabre: {
    name: 'Fleetwood Mac-abre tee',
    description:
      'A band tee with a pale crescent moon on the front, worn soft from a hundred singalongs.',
    slot: 'top',
    cut: 'tee',
    fabrics: ['teal', 'blue', 'ink'],
  },
  teeScreamDion: {
    name: 'Scream Dion tee',
    description: 'A band tee with a big pink heart on the front. It goes on, and on, and on.',
    slot: 'top',
    cut: 'tee',
    fabrics: ['blue', 'lavender', 'cream'],
  },
  cozyTee: {
    name: 'Cozy tee',
    description: 'A plain, soft tee, washed a hundred times until it was just right.',
    slot: 'top',
    cut: 'tee',
    fabrics: ['cream', 'blue', 'plum', 'rose', 'moss'],
  },
  jerseyTigers: {
    name: 'Tigers jersey, No. 49',
    description:
      'Tiger orange, with a big white 49 on the front and back. Team colours only, as a jersey should be.',
    slot: 'top',
    cut: 'jersey',
    fabrics: ['pumpkin'],
    fixed: true,
  },
  sundressFloral: {
    name: 'Floral sundress',
    description: 'A floaty sundress scattered with tiny flowers. It twirls beautifully.',
    slot: 'top',
    cut: 'sundress',
    dress: true,
    fabrics: ['blue', 'lavender', 'cream'],
  },
  sundressGingham: {
    name: 'Gingham sundress',
    description: 'A checked sundress, made for picnics and porch swings.',
    slot: 'top',
    cut: 'sundress',
    dress: true,
    fabrics: ['coral', 'blue', 'moss'],
  },
  wednesdayDress: {
    name: 'Wednesday collar dress',
    description: 'A dark dress with a crisp white collar, for dancing very seriously.',
    slot: 'top',
    cut: 'collarDress',
    dress: true,
    fabrics: ['ink', 'navy'],
  },
  jeans: {
    name: 'Jeans',
    description: 'Comfy jeans, broken in just right. They go with everything.',
    slot: 'bottom',
    cut: 'jeans',
    fabrics: ['denim', 'ink', 'sky'],
  },
  cutoffs: {
    name: 'Cutoff shorts',
    description: 'Frayed denim shorts, for long, warm afternoons.',
    slot: 'bottom',
    cut: 'cutoffs',
    fabrics: ['denim', 'sky'],
  },
  pleatedSkirt: {
    name: 'Pleated skirt',
    description: 'A swishy pleated skirt that sways when you walk.',
    slot: 'bottom',
    cut: 'pleatedSkirt',
    fabrics: ['plum', 'ink', 'blue'],
  },
  sneakers: {
    name: 'High-top sneakers',
    description: 'Canvas high-tops with long laces, good for miles of wandering.',
    slot: 'shoes',
    cut: 'sneakers',
    fabrics: ['cream', 'blue', 'rose'],
  },
  stompyBoots: {
    name: 'Stompy boots',
    description: 'Chunky boots with thick soles, and a very satisfying stomp.',
    slot: 'shoes',
    cut: 'boots',
    fabrics: ['ink', 'plum', 'navy'],
  },
  maryJanes: {
    name: 'Mary Janes',
    description: 'Round-toed shoes with a strap and a button. Sweet, and a tiny bit spooky.',
    slot: 'shoes',
    cut: 'maryJanes',
    fabrics: ['ink', 'blue', 'rose'],
  },
  pumpkinBeanie: {
    name: 'Pumpkin beanie',
    description: 'A slouchy knit beanie with a little green stalk on top.',
    slot: 'hat',
    cut: 'beanie',
    fabrics: ['pumpkin', 'blue', 'plum'],
  },
  batPendant: {
    name: 'Bat pendant',
    description: 'A tiny bat with its wings out, on a fine chain.',
    slot: 'necklace',
    cut: 'chainPendant',
    fabrics: ['silver', 'gold', 'blue'],
  },
  moonLocket: {
    name: 'Moon locket',
    description: "A crescent-moon locket on a chain. What's inside is a secret.",
    slot: 'necklace',
    cut: 'chainPendant',
    fabrics: ['gold', 'silver', 'blue'],
  },
  pearlStrand: {
    name: 'Pearls',
    description: 'A single strand of pearls, round and glowy as little moons.',
    slot: 'necklace',
    cut: 'pearls',
    fabrics: ['cream', 'blue', 'rose'],
  },
  roundGlasses: {
    name: 'Round glasses',
    description: 'Big round frames, for reading, peering and looking clever.',
    slot: 'glasses',
    cut: 'roundGlasses',
    fabrics: ['ink', 'blue', 'rose', 'gold'],
  },
  catEyeGlasses: {
    name: 'Cat-eye glasses',
    description: 'Frames with pointy corners, like a cat who knows something.',
    slot: 'glasses',
    cut: 'catEyeGlasses',
    fabrics: ['ink', 'blue', 'rose', 'gold'],
  },

  // From Cobweb Corner (phase 6). The scarlet-and-grey jersey is the Ohio State lookalike she was
  // to find later (personal_touches.md): colours only, no marks.
  teeBoneJovi: {
    name: 'Bone Jovi tee',
    description:
      'A band tee with a big white bone on the front. Ideal for singing into a hairbrush.',
    slot: 'top',
    cut: 'tee',
    fabrics: ['ink', 'blue', 'cream'],
  },
  jerseyScarlet: {
    name: 'Scarlet & grey jersey',
    description:
      'Scarlet with grey trim, for cheering on a crisp autumn Saturday. Team colours only.',
    slot: 'top',
    cut: 'jersey',
    fabrics: ['scarlet'],
    fixed: true,
  },
  sundressDots: {
    name: 'Polka-dot sundress',
    description: 'A polka-dot sundress with a full, twirly skirt.',
    slot: 'top',
    cut: 'sundress',
    dress: true,
    fabrics: ['sky', 'rose', 'ink'],
  },

  // Fancy shoes, in both shops every day.
  glitterHeels: {
    name: 'Glitter heels',
    description: 'Heels that sparkle with every step. You can almost hear them glitter.',
    slot: 'shoes',
    cut: 'heels',
    fancy: true,
    fabrics: ['blue', 'silver', 'gold', 'rose'],
  },
  velvetPumps: {
    name: 'Velvet pumps',
    description: 'Soft velvet pumps with a little heel, for feeling fancy.',
    slot: 'shoes',
    cut: 'heels',
    fancy: true,
    fabrics: ['plum', 'navy', 'ink'],
  },
  platformMaryJanes: {
    name: 'Platform Mary Janes',
    description: 'Mary Janes on thick white soles, for a bit of extra height.',
    slot: 'shoes',
    cut: 'platforms',
    fancy: true,
    fabrics: ['ink', 'blue', 'lavender'],
  },
  batBowFlats: {
    name: 'Bat-bow flats',
    description: 'Ballet flats with a little bat-wing bow on each toe.',
    slot: 'shoes',
    cut: 'flats',
    fancy: true,
    fabrics: ['ink', 'blue', 'rose'],
  },
  rhinestoneBoots: {
    name: 'Rhinestone cowgirl boots',
    description: 'Cowgirl boots covered in rhinestones. They catch every light in town.',
    slot: 'shoes',
    cut: 'tallBoots',
    fancy: true,
    fabrics: ['cream', 'blue', 'rose'],
  },
  kneeHighBoots: {
    name: 'Knee-high boots',
    description: 'Tall boots that zip up to the knee. Very dramatic, very comfy.',
    slot: 'shoes',
    cut: 'tallBoots',
    fancy: true,
    fabrics: ['ink', 'navy', 'plum'],
  },
  moonbeamSandals: {
    name: 'Moonbeam sandals',
    description: 'Strappy sandals with tiny golden moons on the straps, light as moonbeams.',
    slot: 'shoes',
    cut: 'sandals',
    fancy: true,
    fabrics: ['sky', 'lavender', 'silver'],
  },

  // Costumes, from the pop-up shop.
  witchHat: {
    name: 'Witch hat',
    description: 'A tall, pointy witch hat with a gold buckle on the band. Broom not included.',
    slot: 'hat',
    cut: 'witchHat',
    fabrics: ['ink', 'navy', 'plum'],
  },
  catEars: {
    name: 'Cat ears',
    description: 'A headband with two soft cat ears. Meow.',
    slot: 'hat',
    cut: 'catEars',
    fabrics: ['ink', 'blue', 'cream'],
  },
  skeletonTee: {
    name: 'Skeleton tee',
    description: 'A tee with a ribcage printed down the front. Very handy for learning your bones.',
    slot: 'top',
    cut: 'tee',
    fabrics: ['ink', 'navy'],
  },
  jackOLanternDress: {
    name: "Jack-o'-lantern dress",
    description: "A round, swishy dress with a jack-o'-lantern grinning on the skirt.",
    slot: 'top',
    cut: 'sundress',
    dress: true,
    fabrics: ['pumpkin', 'blue', 'lavender'],
  },
  // Gifts from her neighbours at six hearts (phase 9), sold nowhere.
  bookwormTee: {
    name: 'Bookworm tee',
    description: 'A soft tee with a little open book on the front. For reading in, obviously.',
    slot: 'top',
    cut: 'tee',
    fabrics: ['lavender', 'blue', 'cream'],
  },
  flowerCrown: {
    name: 'Flower crown',
    description: 'A ring of fresh flowers to wear in your hair. It never wilts.',
    slot: 'hat',
    cut: 'flowerCrown',
    fabrics: ['rose', 'blue', 'lavender'],
  },
  crumbsTee: {
    name: 'Crumbs & Curios tee',
    description: 'A bakery tee with a cupcake on the front. It smells faintly of icing.',
    slot: 'top',
    cut: 'tee',
    fabrics: ['cream', 'blue', 'rose'],
  },
  starryDress: {
    name: 'Starry night dress',
    description: 'A collared dress scattered with tiny twinkling stars, like a clear night sky.',
    slot: 'top',
    cut: 'collarDress',
    dress: true,
    fabrics: ['navy', 'ink', 'plum'],
  },
  strawSunHat: {
    name: 'Straw sun hat',
    description: 'A wide straw hat with a rose ribbon, for sunny days in the garden.',
    slot: 'hat',
    cut: 'sunHat',
    fabrics: ['gold', 'blue', 'cream'],
  },
  // Cody's own tee, so they match (personal_touches.md, "Cody's villager").
  maroonTee: {
    name: 'Maroon ¾-sleeve tee',
    description: 'Maroon, with three-quarter sleeves. Cody has one just like it, so you match.',
    slot: 'top',
    cut: 'threeQuarterTee',
    fabrics: ['maroon'],
    fixed: true,
  },
  // A nod to Dolly's coat of many colours (personal_touches.md): patches, stitched with love.
  manyColoursCoat: {
    name: 'Coat of many colours',
    description: 'A long coat patched together from every colour there is, and stitched with love.',
    slot: 'top',
    cut: 'collarDress',
    dress: true,
    fabrics: ['blue', 'plum', 'moss'],
  },
  // What the newcomers give her at six hearts (phase T).
  postieTee: {
    name: 'Special Delivery tee',
    description: 'A tee with an envelope on the front, sealed with a little red heart.',
    slot: 'top',
    cut: 'tee',
    fabrics: ['navy', 'scarlet', 'sky'],
  },
  bubbleDress: {
    name: 'Bubble dress',
    description: 'A swishy dress covered in little bubbles, like the lake on a calm night.',
    slot: 'top',
    cut: 'sundress',
    dress: true,
    fabrics: ['teal', 'sky', 'navy'],
  },
  flannelShirt: {
    name: 'Flannel shirt',
    description: 'A checked flannel shirt with the sleeves rolled up, warm as a campfire.',
    slot: 'top',
    cut: 'threeQuarterTee',
    fabrics: ['scarlet', 'blue', 'moss'],
  },
  nightSkyTee: {
    name: 'Night-sky tee',
    description: 'A tee with a crescent moon and a bright little star on the front.',
    slot: 'top',
    cut: 'tee',
    fabrics: ['navy', 'ink', 'lavender'],
  },
};

/**
 * What the closet holds on the first day. Everything else is found in the shops (phase 6) or given
 * by her neighbours (phase 9).
 */
/** Whether a piece offers her a choice of colours: it has more than one, and isn't fixed. */
export function recolours(id: OutfitId): boolean {
  const row = OUTFITS[id];
  return !row.fixed && row.fabrics.length > 1;
}

/** Its colours as she'd say them: "rose, blue or cream". */
export function colourList(id: OutfitId): string {
  const names = OUTFITS[id].fabrics.map((f) => FABRICS[f].name.toLowerCase());
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} or ${names.at(-1)}` : names.join('');
}

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
  hairStyle: 'splitBob',
  hairColour: 'pinkSplit',
  gauges: true,
  tattoos: 'sleeves',
  freckles: true,
  nosePiercing: true,
  outfit: {
    top: { id: 'teeScreamDion', fabric: 'blue' },
    bottom: { id: 'jeans', fabric: 'denim' },
    shoes: { id: 'stompyBoots', fabric: 'ink' },
    necklace: { id: 'batPendant', fabric: 'silver' },
  },
};
