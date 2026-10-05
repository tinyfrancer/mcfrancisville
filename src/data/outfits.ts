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
  // The pop-up's Halloween shelf (0.2's J2), three costumes for two: this year a bug catcher and
  // a butterfly, and before that a lion tamer and a lion, and two meddling kids
  // (personal_touches.md, question 44).
  bugCatcherHat: {
    name: "Bug catcher's hat",
    description:
      "A round explorer's helmet with a band, for peering into bushes. Net sold separately.",
    slot: 'hat',
    cut: 'explorerHat',
    fabrics: ['cream', 'moss', 'blue'],
  },
  bugCatcherShirt: {
    name: "Bug catcher's shirt",
    description: 'A shirt with two big pockets on the front, for jars, notebooks and snacks.',
    slot: 'top',
    cut: 'threeQuarterTee',
    fabrics: ['moss', 'cream', 'blue'],
  },
  butterflyAntennae: {
    name: 'Butterfly antennae',
    description: 'Two curly antennae on a headband, with a bobble on the end of each. Boing.',
    slot: 'hat',
    cut: 'antennae',
    fabrics: ['ink', 'blue', 'gold'],
  },
  butterflyWings: {
    name: 'Butterfly wing dress',
    description:
      "A little dress with a pair of wings on the back, veined and spotted like a monarch's.",
    slot: 'top',
    cut: 'wings',
    dress: true,
    fabrics: ['pumpkin', 'blue', 'lavender'],
  },
  ringmasterHat: {
    name: "Ringmaster's top hat",
    description: 'A tall top hat with a gold band. Ladies and gentlemen, ghouls and goblins…',
    slot: 'hat',
    cut: 'topHat',
    fabrics: ['scarlet', 'ink', 'blue'],
  },
  ringmasterCoat: {
    name: "Ringmaster's coat",
    description: 'A smart coat with gold buttons and cuffs, for taming lions. Gently. With treats.',
    slot: 'top',
    cut: 'jacket',
    fabrics: ['scarlet', 'navy', 'blue'],
  },
  lionMane: {
    name: "Lion's mane",
    description: 'A big fluffy mane with two round ears, to wear round your face. Rawr, softly.',
    slot: 'hat',
    cut: 'mane',
    fabrics: ['gold', 'pumpkin', 'blue'],
  },
  clueTurtleneck: {
    name: "Clue-finder's turtleneck",
    description: 'A snug turtleneck for solving mysteries in. Jinkies!',
    slot: 'top',
    cut: 'turtleneck',
    fabrics: ['pumpkin', 'blue', 'plum'],
  },
  clueGlasses: {
    name: "Clue-finder's glasses",
    description: "Thick square glasses. Don't lose them: you'll never find the clue without them.",
    slot: 'glasses',
    cut: 'squareGlasses',
    fabrics: ['ink', 'blue', 'plum'],
  },
  scaredyTee: {
    name: 'Scaredy-cat tee',
    description: 'A big slouchy tee for running away from ghosts in. Zoinks!',
    slot: 'top',
    cut: 'tee',
    fabrics: ['moss', 'blue', 'teal'],
  },
  // A fuller closet from the first day (0.2's W2, question 51 left to Claude), with her gloves
  // (question 14) and her comfy shirt (question 34).
  cozyHoodie: {
    name: 'Cozy hoodie',
    description:
      'A big soft hoodie with a front pocket and drawstrings to fiddle with. The hood is for rainy days.',
    slot: 'top',
    cut: 'hoodie',
    fabrics: ['plum', 'blue', 'moss', 'ink'],
  },
  comfyShirt: {
    name: 'Comfy shirt',
    description:
      'Long sleeves, a size too big, and softer than anything. Your comfy shirt: the one you always reach for.',
    slot: 'top',
    cut: 'bigTee',
    fabrics: ['cream', 'blue', 'lavender', 'ink'],
  },
  mothCardigan: {
    name: 'Moth cardigan',
    description: 'A slouchy knit cardigan with little moth buttons, worn open over a soft vest.',
    slot: 'top',
    cut: 'cardigan',
    fabrics: ['lavender', 'sky', 'rose', 'moss'],
  },
  stripyTee: {
    name: 'Stripy long-sleeve',
    description:
      "A long-sleeved tee in bold stripes, like a certain ghost's whose name you mustn't say three times.",
    slot: 'top',
    cut: 'longTee',
    fabrics: ['ink', 'navy', 'plum', 'moss'],
  },
  leggings: {
    name: 'Leggings',
    description: 'Stretchy, soft and ready for anything, even a little cartwheel.',
    slot: 'bottom',
    cut: 'leggings',
    fabrics: ['ink', 'navy', 'plum'],
  },
  overalls: {
    name: 'Overalls',
    description:
      'Overalls with a bib pocket and two shiny buttons, worn over any top. Made for gardening, and for pockets.',
    slot: 'bottom',
    cut: 'overalls',
    fabrics: ['denim', 'ink', 'rose'],
  },
  skaterSkirt: {
    name: 'Skater skirt',
    description: 'A short, flared skirt that spins right out when you twirl.',
    slot: 'bottom',
    cut: 'skaterSkirt',
    fabrics: ['ink', 'blue', 'plum', 'rose'],
  },
  joggers: {
    name: 'Joggers',
    description: 'Soft joggers with cuffs at the ankles and a drawstring waist, for lazy Sundays.',
    slot: 'bottom',
    cut: 'joggers',
    fabrics: ['navy', 'ink', 'plum', 'rose'],
  },
  // Her big black sweatpants (question 70).
  sweatpants: {
    name: 'Big black sweatpants',
    description:
      'Baggy, black and a size too big, cuffed at the ankles. For staying in, and in, and in.',
    slot: 'bottom',
    cut: 'sweats',
    fabrics: ['ink'],
    fixed: true,
  },
  rainBoots: {
    name: 'Rain boots',
    description: 'Shiny rubber boots for stomping through puddles. Thunderstorms welcome.',
    slot: 'shoes',
    cut: 'wellies',
    fabrics: ['blue', 'rose', 'moss', 'gold'],
  },
  bobbleBeanie: {
    name: 'Bobble beanie',
    description: 'A snug knit beanie, cuffed at the brim, with a fluffy bobble on top.',
    slot: 'hat',
    cut: 'pomBeanie',
    fabrics: ['ink', 'blue', 'rose', 'cream'],
  },
  hairBow: {
    name: 'Big hair bow',
    description: 'A big floppy bow to clip in your hair. Instantly twenty percent cuter.',
    slot: 'hat',
    cut: 'hairBow',
    fabrics: ['ink', 'rose', 'blue', 'lavender'],
  },
  gardenGloves: {
    name: 'Pink gardening gloves',
    description:
      'Pink, with a frilly cuff, for digging, planting and patting the soil down just so.',
    slot: 'gloves',
    cut: 'gloves',
    fabrics: ['rose'],
    fixed: true,
  },
  // Cooler clothes to buy (0.2's W3, question 72). Cobweb Corner's clothes shelf: the band
  // hoodie (question 68), a jacket worn over any top, a corset and tulle, tights under anything.
  walkTheTombHoodie: {
    name: 'Walk the Tomb hoodie',
    description:
      'Tour merch with a little dancing tombstone on the front. Shut up and haunt with me!',
    slot: 'top',
    cut: 'hoodie',
    fabrics: ['ink', 'navy', 'blue', 'plum'],
  },
  corsetTop: {
    name: 'Corset top',
    description: 'Laced up the front, with a lace trim along the top. Very gothic, very dramatic.',
    slot: 'top',
    cut: 'corset',
    fabrics: ['ink', 'navy', 'plum', 'scarlet'],
  },
  tulleSkirt: {
    name: 'Tulle skirt',
    description: 'Layers and layers of soft tulle, puffed out like a cloud at midnight.',
    slot: 'bottom',
    cut: 'tulleSkirt',
    fabrics: ['ink', 'lavender', 'blue', 'rose'],
  },
  batSkirt: {
    name: 'Bat-print skirt',
    description: 'A flared little skirt scattered with tiny flapping bats.',
    slot: 'bottom',
    cut: 'skaterSkirt',
    fabrics: ['ink', 'plum', 'navy'],
  },
  fishnets: {
    name: 'Fishnet tights',
    description: 'Fishnets, for under a skirt or a dress. Instantly rock and roll.',
    slot: 'tights',
    cut: 'fishnets',
    fabrics: ['ink', 'navy', 'plum'],
  },
  stripyTights: {
    name: 'Stripy tights',
    description: 'Long stripy tights, the kind a witch wears when she means business.',
    slot: 'tights',
    cut: 'tights',
    fabrics: ['ink', 'plum', 'blue', 'moss'],
  },
  motoJacket: {
    name: 'Moto jacket',
    description: 'A cropped jacket with a slanted zip, silver studs and attitude. Worn open.',
    slot: 'outer',
    cut: 'moto',
    fabrics: ['ink', 'navy', 'maroon'],
  },
  denimJacket: {
    name: 'Denim jacket',
    description: 'A trusty jean jacket with two chest pockets, worn open over anything at all.',
    slot: 'outer',
    cut: 'denimJacket',
    fabrics: ['denim', 'ink', 'sky'],
  },
  // The weekly boutique (0.2's W3): fancy, pricey whole looks, a spaceman suit among them.
  velvetDress: {
    name: 'Velvet dress',
    description:
      'Long sleeves, a long skirt and deep, soft velvet that shines where the light falls.',
    slot: 'top',
    cut: 'velvetDress',
    dress: true,
    fabrics: ['plum', 'navy', 'ink', 'maroon'],
  },
  operaCoat: {
    name: 'Opera coat',
    description:
      'A long, swishy coat with gold buttons, for sweeping into the theatre fashionably late.',
    slot: 'outer',
    cut: 'operaCoat',
    fabrics: ['ink', 'plum', 'navy', 'cream'],
  },
  ballGown: {
    name: 'Midnight ball gown',
    description:
      'A laced bodice and a skirt down to the floor, sparkling like the sky at midnight. Twirling is compulsory.',
    slot: 'top',
    cut: 'gown',
    dress: true,
    fabrics: ['navy', 'plum', 'ink', 'rose'],
  },
  tiara: {
    name: 'Tiara',
    description: 'A little crown of points and jewels, for the queen of the ball.',
    slot: 'hat',
    cut: 'tiara',
    fabrics: ['silver', 'gold', 'blue'],
  },
  spaceSuit: {
    name: 'Spaceman suit',
    description:
      'A puffy space suit with a control panel on the chest. One small step for her, one giant leap for McFrancisVille.',
    slot: 'top',
    cut: 'spacesuit',
    dress: true,
    fabrics: ['silver', 'blue', 'cream'],
  },
  spaceHelmet: {
    name: 'Bubble helmet',
    description: 'A round glass helmet for breathing in space. The moon is just up there.',
    slot: 'hat',
    cut: 'helmet',
    fabrics: ['silver', 'blue', 'gold'],
  },
  platformBoots: {
    name: 'Platform boots',
    description: 'Laced-up boots on soles as thick as a book. Stomp, stomp, stomp.',
    slot: 'shoes',
    cut: 'platformBoots',
    fancy: true,
    fabrics: ['ink', 'navy', 'plum', 'cream'],
  },
  // More for the pop-up's Halloween shelf (0.2's W3).
  vampireCape: {
    name: 'Vampire cape',
    description:
      "A swirly cape with a high collar and a maroon lining, like a certain someone's. Bleh, bleh!",
    slot: 'outer',
    cut: 'cape',
    fabrics: ['ink', 'navy', 'plum'],
  },
  batWings: {
    name: 'Bat wings',
    description: 'A pair of little bat wings to wear on your back. They flap if you wiggle.',
    slot: 'outer',
    cut: 'batWings',
    fabrics: ['ink', 'plum', 'navy'],
  },
  mummyWraps: {
    name: 'Mummy wraps',
    description:
      'Wrapped from top to toe, like Wrapunzel on a busy day. Comes with no curse whatsoever.',
    slot: 'top',
    cut: 'wraps',
    dress: true,
    fabrics: ['cream', 'sky', 'lavender'],
  },
  devilHorns: {
    name: 'Little devil horns',
    description: 'Two small horns on a headband. Mischief not included, but strongly encouraged.',
    slot: 'hat',
    cut: 'horns',
    fabrics: ['scarlet', 'ink', 'blue'],
  },
  // What Scarah gives her at six hearts (0.3's F3): the twin of her own.
  scarahHat: {
    name: 'Patched straw hat',
    description:
      'A floppy straw hat with a gingham patch on the crown and a few straws poking out of the brim, as a farmer likes it.',
    slot: 'hat',
    cut: 'farmHat',
    fabrics: ['gold'],
    fixed: true,
  },
};

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

/**
 * What the closet holds on the first day. Everything else is found in the shops (phase 6) or given
 * by her neighbours (phase 9). A save from before a piece joined this list gets it when it loads
 * (0.2's W2): pieces are only ever added.
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
  'cozyHoodie',
  'comfyShirt',
  'mothCardigan',
  'stripyTee',
  'leggings',
  'overalls',
  'skaterSkirt',
  'joggers',
  'sweatpants',
  'rainBoots',
  'bobbleBeanie',
  'hairBow',
  'gardenGloves',
];

/** Slots she may leave bare. A top is always on, and a bottom unless the top is a dress. */
export const OPTIONAL_SLOTS: readonly Slot[] = [
  'shoes',
  'hat',
  'necklace',
  'glasses',
  'gloves',
  'outer',
  'tights',
];

/**
 * What the creator opens on. It is already her (split dye, gauges, sleeves, a band tee and jeans),
 * because the person who made the game knows her; she only has to type her name.
 */
export const DEFAULT_LOOK: Look = {
  name: '',
  skin: 'peach',
  eyes: 'brown',
  hairStyle: 'splitBob',
  hairColour: 'pink',
  splitColour: 'darkBrown',
  gauges: true,
  tattoos: 'sleeves',
  stripesArm: 'right',
  freckles: true,
  nosePiercing: true,
  wrist: [],
  outfit: {
    top: { id: 'teeScreamDion', fabric: 'blue' },
    bottom: { id: 'jeans', fabric: 'denim' },
    shoes: { id: 'stompyBoots', fabric: 'ink' },
    necklace: { id: 'batPendant', fabric: 'silver' },
  },
};
