import type { FlooringId, FurnitureId, WallpaperId } from '../types/ids';

type Gifted =
  | 'ghostStories'
  | 'moonBouquet'
  | 'coffinCake'
  | 'broomstick'
  | 'broomStand'
  | 'boneGnome'
  | 'codyPortrait'
  | 'birthdayCake'
  | 'lunaMothLamp'
  | 'curiosityCabinet'
  | 'foreverOrbs'
  | 'holidayTree';

type Keepsake =
  | 'floatingCandles'
  | 'wingbackChair'
  | 'roseBucket'
  | 'pawPrintRug'
  | 'potionShelf'
  | 'witchHatLamp'
  | 'seedlingTray'
  | 'skullPlanter'
  | 'velvetSettee'
  | 'stainedGlass'
  | 'cupcakeTower'
  | 'mummyTeapot';

/** The newcomers' pieces (phase T): keepsakes, what they teach her to make, and their gifts. */
type Newcomers =
  | 'stampAlbum'
  | 'parcelStack'
  | 'smoothStones'
  | 'crossedOars'
  | 'toolRack'
  | 'carvedOwl'
  | 'orrery'
  | 'moonGlobe'
  | 'pigeonholes'
  | 'lilyLantern'
  | 'pumpkinStool'
  | 'starChart'
  | 'writingDesk'
  | 'bubbleTank'
  | 'pumpkinClock'
  | 'telescope';

/** Where a piece goes: standing on the floor, lying flat on it, or hanging on the wall. */
export type Layer = 'floor' | 'rug' | 'wall';

/**
 * How a piece turns. A `mirror` piece faces the other way when turned; a `four` piece has a side and
 * a back too, and a piece longer one way than the other swaps its footprint on its sides. A piece
 * with neither looks the same whichever way it's turned.
 */
export type Turns = 'mirror' | 'four';

export interface FurnitureRow {
  name: string;
  /** Shown in the shop and the storage chest. Warm and a little silly, never snarky. */
  description: string;
  layer: Layer;
  /** In tiles: floor tiles for a floor piece or rug, wall tiles for a wall piece. */
  size: { w: number; h: number };
  turns?: Turns;
  /** What she hears or thinks when she walks up to it at home. */
  says?: string;
  /**
   * What it costs in a shop. Furniture is never sold back: it waits in her storage chest. A piece
   * she makes at her workbench, or has from the start, has no price: no shop sells it.
   */
  price?: number;
}

/**
 * Pieces her neighbours give her (phase 9): one from each at ten hearts, by mail, and a cake on her
 * birthday. Given, so no shop sells them and they have no price.
 */
const GIFTED: Record<Gifted, FurnitureRow> = {
  ghostStories: {
    name: 'Ghost stories',
    description:
      'A stack of well-thumbed ghost stories, with a candle to read them by. All true, apparently.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You read a page by candlelight. Oooh. Then another. Just one more.',
  },
  moonBouquet: {
    name: 'Full-moon bouquet',
    description: 'Roses and moonflowers in a stone jug, arranged with enormous, careful paws.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The moonflowers glow a little brighter when you lean in.',
  },
  coffinCake: {
    name: 'Coffin cake',
    description:
      'A cake shaped like a coffin: lavender sponge, cream filling, and a lid. Too pretty to eat.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You lift the lid, just a peek. It smells like vanilla. You put the lid back.',
  },
  broomstick: {
    name: "Agatha's spare broom",
    description: 'A broom that has flown a thousand miles, now happy to lean in a corner. Mostly.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The broom twitches. It would very much like to go for a fly.',
  },
  // Where her own broom rests by the door (0.2's P1): walking up to it flies her out again.
  broomStand: {
    name: 'Broom stand',
    description:
      'A little cauldron by the door for your broom to stand in, bristles up. Walk up to it to fly out.',
    layer: 'floor',
    size: { w: 1, h: 1 },
  },
  boneGnome: {
    name: 'Bone gnome',
    description: 'A garden gnome who is also a skeleton, pointy hat and all. He is very proud.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The bone gnome keeps a close eye on things. Both sockets.',
  },
  codyPortrait: {
    name: 'Portrait of Cody',
    description:
      'Cody, looking dashing and a little smug, in a gilt frame. There is a brass plate.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'The brass plate reads: PIMP DADDY FRANCIS. Of course it does.',
  },
  birthdayCake: {
    name: 'Birthday cake',
    description:
      'Three tiers of vanilla sponge, with every name in town piped on in icing. The candles ' +
      'never go out.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You make a wish. The whole town is sure it will come true.',
  },
  lunaMothLamp: {
    name: 'Luna moth lamp',
    description:
      'A luna moth of pale green glass on a brass stand, a lamp that glows all night long.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The luna moth lamp glows softly. It makes the whole room feel like midnight in June.',
  },
  curiosityCabinet: {
    name: 'Curiosity cabinet',
    description:
      'A museum in miniature: a tiny moth, orb, frog, beetle, fish and bat, each in a glass ' +
      'nook of its own. They wave.',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'Every little critter in the cabinet waves at you. You wave back.',
  },
  // Cody's, on their anniversary (decisions.md 20). What it says counts the years since 2020.
  foreverOrbs: {
    name: 'Forever orbs',
    description:
      'A green orb and a blue one in a glass globe. They drift around each other and never ' +
      'drift apart.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The two orbs circle each other, glowing. {years} years, and counting.',
  },
  holidayTree: {
    name: 'Little spooky tree',
    description:
      'A little black Christmas tree, hung with bats, baubles and a skull on top. Its lights ' +
      'twinkle all year round.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The lights twinkle. The little skull on top looks very pleased to be here.',
  },
};

/**
 * Pieces from her neighbours' houses (phase H): each stands in its owner's home, and once they're
 * close enough they let her have one just like it (`data/interiors.ts`). Given, so unpriced.
 */
const KEEPSAKES: Record<Keepsake, FurnitureRow> = {
  floatingCandles: {
    name: 'Floating candles',
    description: "Three candles that hang in the air all by themselves, from Maude's library.",
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'The candles bob a little, as if they are reading over your shoulder.',
  },
  wingbackChair: {
    name: 'Wingback reading chair',
    description: "A tall blue armchair made for ghost stories. Maude's has a dip where she floats.",
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'You curl up in the wingback chair. One more chapter. Just one.',
  },
  roseBucket: {
    name: 'Bucket of roses',
    description: 'A tin bucket of red and pink roses, fresh from Rufus. They never seem to wilt.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The roses smell like a summer evening.',
  },
  pawPrintRug: {
    name: 'Paw-print rug',
    description:
      'A round rug with big muddy-looking paw prints woven in. Not actual mud. Rufus checked.',
    layer: 'rug',
    size: { w: 2, h: 1 },
  },
  potionShelf: {
    name: 'Potion shelf',
    description: "A little shelf of Agatha's potions, gently glowing. Please don't drink them.",
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'One bottle glows pink, one green, one blue. One is labelled "Tuesday".',
  },
  witchHatLamp: {
    name: 'Witch-hat lamp',
    description: 'A lamp with a pointy purple hat for a shade. It tilts it at you, jauntily.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The lamp tips its hat to you. How polite.',
  },
  seedlingTray: {
    name: 'Seedling tray',
    description: "A tray of Barty's seedlings, each with a tiny name tag. This one says 'Gregory'.",
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The seedlings lean toward you, the way they lean toward the sun.',
  },
  skullPlanter: {
    name: 'Skull planter',
    description: 'A friendly skull with a succulent growing out of the top. Barty calls it a hat.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The skull planter grins. Its succulent is doing very well.',
  },
  velvetSettee: {
    name: 'Velvet settee',
    description: "A deep red velvet sofa from Cody's manor, with bat-wing arms. Made for two.",
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'You sink into the velvet. There is room for two, and a Cody-shaped dent.',
  },
  stainedGlass: {
    name: 'Stained-glass bat',
    description: 'A bat in stained glass, in plum and gold. After dark, it glows like a lantern.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'The glass bat catches the light and throws little colours everywhere.',
  },
  cupcakeTower: {
    name: 'Cupcake tower',
    description: "Three tiers of Wrapunzel's cupcakes, with a bat on top. For looking at, mostly.",
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You count the cupcakes. Then you count them again. Still all there. Good.',
  },
  mummyTeapot: {
    name: 'Mummy teapot',
    description: "A teapot wrapped up in bandages, like its owner. It's always just brewed.",
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The mummy teapot steams contentedly. Chamomile, by the smell.',
  },
};

/**
 * The newcomers' pieces (phase T): two keepsakes in each of their homes, the piece each teaches her
 * to make at three hearts, and the piece each gives her at ten. None is sold.
 */
const NEWCOMERS: Record<Newcomers, FurnitureRow> = {
  stampAlbum: {
    name: 'Stamp album',
    description:
      "Ollie's album of stamps from every town he's carried post in, open on a little stand.",
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'A stamp with a bat on it, a stamp with a moon, and one with a very small ghost. Lovely.',
  },
  parcelStack: {
    name: 'Stack of parcels',
    description: 'Parcels tied up in string, waiting to go out. One of them is ticking gently.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The top parcel says "FRAGILE: CONTAINS WHISPERS". Best not shake it.',
  },
  smoothStones: {
    name: 'Bowl of smooth stones',
    description: 'The smoothest stones from the bottom of the lake, each one checked by Nessa.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The stones are cool and perfectly smooth. You pick one up, and feel very calm.',
  },
  crossedOars: {
    name: 'Crossed oars',
    description:
      'Two old oars crossed on the wall, painted teal, with a little lantern between them.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'The oars have names painted on them: "Left" and "Also Left".',
  },
  toolRack: {
    name: 'Tool rack',
    description:
      "Gourdon's saw, hammer and chisel, hung on the wall by size, with a spot for a spare head.",
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'Every tool is polished and hung just so. The spare-head hook is empty. Just in case.',
  },
  carvedOwl: {
    name: 'Carved owl',
    description:
      "An owl whittled from a single block of oak. It looks a bit like Agatha's. It knows.",
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The carved owl looks at you. You look at the carved owl. The owl wins.',
  },
  orrery: {
    name: 'Orrery',
    description:
      'Brass planets on little arms round a golden sun. Turn the handle and they go round.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You turn the handle. The planets go round. A tiny moon goes round a tiny planet. Wow.',
  },
  moonGlobe: {
    name: 'Moon globe',
    description: "A globe of the moon, every crater labelled in Hazel's tiny handwriting.",
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'One crater is labelled "KEVIN". Rufus must have helped.',
  },
  pigeonholes: {
    name: 'Pigeonholes',
    description:
      'A wall of little cubbies for letters, like the post office has. Every letter gets a home.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'Every letter tucked in its own little cubby. Very tidy. Ollie would be proud.',
  },
  lilyLantern: {
    name: 'Lily-pad lantern',
    description:
      'A candle on a lily pad, with a moonflower tucked in. Floats on the lake, glows at home.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The little lantern glows, soft and green, like the lake at night.',
  },
  pumpkinStool: {
    name: 'Pumpkin stool',
    description: 'Three sturdy legs and a pumpkin for a seat, carved with a smile to sit on.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You sit on the pumpkin stool. It seems pleased about it.',
  },
  starChart: {
    name: 'Star chart',
    description:
      'Every star over McFrancisVille, joined up and named. One small, bright one has your name.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'You find your star. Small, but very bright. Hazel was right.',
  },
  writingDesk: {
    name: 'Writing desk',
    description:
      'A little desk with a quill, a pot of plum ink and a stack of envelopes ready to go.',
    layer: 'floor',
    size: { w: 2, h: 1 },
    turns: 'mirror',
    says: 'The quill is ready and the ink is plum. Who to write to first?',
  },
  bubbleTank: {
    name: 'Bubble tank',
    description: 'A tall tank of lake water, with a lantern fish in it who asked to come.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The lantern fish blows you a bubble. You think it means hello.',
  },
  pumpkinClock: {
    name: 'Pumpkin clock',
    description:
      'A tall oak clock with a pumpkin for a pendulum. It swings a bit slow, on purpose.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'Tick… tock. The good times ought to last, Gourdon says.',
  },
  telescope: {
    name: 'Telescope',
    description: 'A brass telescope on three legs, pointed at a star with your name on it.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'You peek through the telescope. A star winks back.',
  },
};

/**
 * Everything that can go in her home. The two-headed duck is hers from the first day, because she
 * keeps real ones out at home (personal_touches.md, "Her home"); the corkboard waits for the mayor's
 * mystery (decisions.md 19); the marble run is the one from the videos she loves.
 */
export const FURNITURE: Record<FurnitureId, FurnitureRow> = {
  ...GIFTED,
  ...KEEPSAKES,
  ...NEWCOMERS,
  batBed: {
    name: 'Bat-wing bed',
    description: 'A four-poster with a bat-wing headboard and a quilt of little moons.',
    layer: 'floor',
    size: { w: 2, h: 2 },
    says: 'You fluff the pillows. Perfect for a sleep-in.',
    price: 900,
  },
  twoHeadedDuck: {
    name: 'Duckworth & Duckworth',
    description:
      'A two-headed duck under a glass dome. Each head thinks it is the handsome one. Both are right.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'Duckworth & Duckworth look very pleased with themselves. Both of them.',
    price: 666,
  },
  pumpkinChair: {
    name: 'Pumpkin armchair',
    description: 'A squashy pumpkin you can sit in. The stalk makes a handy armrest.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'four',
    says: 'You sink into the pumpkin armchair. Squish.',
    price: 350,
  },
  coffinBookshelf: {
    name: 'Coffin bookshelf',
    description: 'A coffin stood on end and filled with books. Every one of them a page-turner.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'So many books, so many cozy nights in.',
    price: 600,
  },
  cauldron: {
    name: 'Cauldron',
    description: 'A little iron cauldron, always bubbling. It smells like hot cocoa.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'Bubble, bubble… mm, hot cocoa.',
    price: 480,
  },
  batLamp: {
    name: 'Bat lamp',
    description: 'A lamp with a bat perched on the shade. It glows softly after dark.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    price: 420,
  },
  marbleRun: {
    name: 'Marble run',
    description: 'A tall wooden marble run. The commentary comes free.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'Boom tap boom tap boom!',
    price: 500,
  },
  recordPlayer: {
    name: 'Record player',
    description: 'A little record player on a cabinet, for the records you collect.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    price: 700,
  },
  monstera: {
    name: 'Monstera',
    description:
      'A big, cheerful monstera. Its leaves have little holes, like it was nibbled by moths.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    price: 300,
  },
  snakePlant: {
    name: 'Snake plant',
    description: 'Tall, stripy and completely unbothered. It hisses at nobody.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    price: 260,
  },
  venusFlytrap: {
    name: 'Venus flytrap',
    description: 'A potted flytrap with a big grin. It only eats bad moods.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'The flytrap snaps at the air, then looks a bit embarrassed.',
    price: 320,
  },
  succulents: {
    name: 'Potted succulents',
    description:
      'A little crowd of succulents in mismatched pots. The plants that thrive with you.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The succulents are thriving. Of course they are.',
    price: 280,
  },
  skeletonFriend: {
    name: 'Skeleton friend',
    description: 'A sitting skeleton with a party hat. Great listener. Terrible at cards.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'Your skeleton friend is all ears. Well, no ears. But listening.',
    price: 560,
  },
  candelabra: {
    name: 'Candelabra',
    description: 'Three tall candles on a curly stand. They never drip and never go out.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    price: 440,
  },
  crystalBall: {
    name: 'Crystal ball',
    description: 'A glowing crystal ball on a little stand. Its predictions are mostly about naps.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The crystal ball says: a nap is in your future.',
    price: 520,
  },
  tombstone: {
    name: 'Tombstone',
    description: 'A foam tombstone that reads "Rest In Pumpkins". Very convincing. Very light.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'Rest In Pumpkins. Nobody knows who it was for.',
    price: 300,
  },
  moonRug: {
    name: 'Moon rug',
    description: 'A round blue rug with a sleepy crescent moon on it.',
    layer: 'rug',
    size: { w: 2, h: 2 },
    price: 380,
  },
  spiderwebRug: {
    name: 'Spiderweb rug',
    description: 'A big soft rug woven like a spiderweb. No spider included, unless you want one.',
    layer: 'rug',
    size: { w: 3, h: 3 },
    price: 450,
  },
  ghostPortrait: {
    name: 'Great-Aunt Boo-nice',
    description: 'A portrait of a very distinguished ghost in her best pearls.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    price: 400,
  },
  catPortrait: {
    name: 'Portrait of a cat',
    description: 'A black cat in a frilly ruff, looking thoroughly important.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    price: 380,
  },
  moonPainting: {
    name: 'Moonlit painting',
    description: 'A little painting of a full moon over the hills.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    price: 360,
  },
  batClock: {
    name: 'Bat clock',
    description: 'A round clock with bat wings. Tick, tock, flap.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    price: 340,
  },
  wallShelf: {
    name: 'Little shelf',
    description: 'A little wall shelf of jars: eyeballs (gummy), newts (gummy), and buttons.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    price: 260,
  },
  pothos: {
    name: 'Hanging pothos',
    description: 'A pothos in a hanging pot, trailing happily down the wall.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    price: 280,
  },
  gothicMirror: {
    name: 'Gothic mirror',
    description: 'A tall oval mirror in a curly frame. It always says you look lovely.',
    layer: 'wall',
    size: { w: 1, h: 2 },
    price: 460,
  },
  mysteryCorkboard: {
    name: 'Mystery corkboard',
    description:
      'A corkboard with pins and red string, for the case of the mayor nobody has met. Walk up ' +
      'to it to look over the clues.',
    layer: 'wall',
    size: { w: 2, h: 1 },
  },
  // The user's (personal_touches.md, "After phase I"): hers from the first day, by her armchair.
  floralLamp: {
    name: 'Stained-glass lamp',
    description:
      'An old-fashioned lamp with a shade of stained-glass flowers: roses and leaves on ' +
      'honey-gold glass. After dark it glows like a little garden.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The glass roses glow warm and gold. The best reading light in town.',
  },
  batGarland: {
    name: 'Bat garland',
    description: 'A string of paper bats, flapping gently in no breeze at all.',
    layer: 'wall',
    size: { w: 2, h: 1 },
    price: 240,
  },
  // Hers from the first day, where she makes things (phase 8). Walking up to it opens it.
  workbench: {
    name: 'Workbench',
    description: 'A sturdy old workbench with a vice, a jar of beads and a very small hammer.',
    layer: 'floor',
    size: { w: 2, h: 1 },
    turns: 'mirror',
  },
  // Hers from the first day, where she cooks (phase R). Walking up to it opens it.
  stove: {
    name: 'Little black stove',
    description:
      'A cast-iron stove with bat-wing handles and a kettle that whistles a spooky little tune. ' +
      'Everything cooked on it comes out cozy.',
    layer: 'floor',
    size: { w: 1, h: 1 },
  },
  // Made at her workbench, and sold nowhere.
  stumpStool: {
    name: 'Stump stool',
    description: 'A tree stump, sanded smooth. The tree says it is happy to help.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You sit on the stump for a moment. Very grounding.',
  },
  jackOLantern: {
    name: "Jack-o'-lantern",
    description: 'A pumpkin from your own garden, carved with a big friendly grin.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: "The jack-o'-lantern grins at you. You grin back.",
  },
  catLantern: {
    name: "Cat-o'-lantern",
    description:
      'Your pumpkin from the patch, carved into a cat: pointy ears, big eyes and whiskers. It ' +
      'glows after dark.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: "The cat-o'-lantern gives you a slow blink. That means it loves you.",
  },
  roseVase: {
    name: 'Vase of roses',
    description: 'Roses from your garden in a stone vase. They will never wilt. Nothing here does.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The roses smell like a summer evening.',
  },
  pressedFlowers: {
    name: 'Pressed flowers',
    description: 'A moonpetal, a forget-me-boo and a ghost daisy, pressed and framed.',
    layer: 'wall',
    size: { w: 1, h: 1 },
  },
  stoneHearth: {
    name: 'Stone hearth',
    description: 'A little stone fireplace with a crackling fire. The coziest thing you own.',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'You warm your hands by the fire. Toasty.',
  },
  moonflowerLamp: {
    name: 'Moonflower lamp',
    description: 'Moonflowers in a stone lamp. They glow all night, like they swallowed the moon.',
    layer: 'floor',
    size: { w: 1, h: 1 },
  },
  candyCornWreath: {
    name: 'Candy-corn wreath',
    description: "A wreath of candy corn on a twig ring. Resist nibbling it. Or don't.",
    layer: 'wall',
    size: { w: 1, h: 1 },
  },
  hostaPlanter: {
    name: 'Hosta planter',
    description:
      'A hosta from the farm in a wooden planter. Happy in the shade, like a true hosta.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'Hosta la vista, baby.',
  },
  littleGargoyle: {
    name: 'Little gargoyle',
    description: 'A small stone gargoyle with big ears. He guards the house from bad moods.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The little gargoyle is on duty. He takes it very seriously.',
  },
  blueRoseDome: {
    name: 'Blue rose under glass',
    description: 'Your rarest rose, kept under a glass dome. It glows a little after dark.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The blue rose glows softly under its dome.',
  },
  // Her inside jokes and Dolly nods (phase 12, personal_touches.md), sold at Cobweb Corner.
  longNeckYoshi: {
    name: 'Long neck Yoshi',
    description:
      'A soft green plushie with a very, very long neck. Named by a little someone, and the name ' +
      'stuck.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'Long neck Yoshi! His neck is as long as ever. Longer, maybe.',
    price: 480,
  },
  butterflyFrame: {
    name: 'Butterfly in a frame',
    description:
      'A blue butterfly under glass, in a gilt frame. Pinned with love, and a wink at a certain ' +
      'coat of many colours.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: "The butterfly's wings shimmer. You'd swear it winked.",
    price: 360,
  },
  rhinestoneGuitar: {
    name: 'Rhinestone guitar',
    description: 'A sky-blue guitar covered in rhinestones. It plays in three chords and sparkles.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'You strum a chord. It sparkles more than it plays, and that is fine by you.',
    price: 640,
  },
  pepperGarland: {
    name: 'Ghost-pepper garland',
    description: 'A string of ghost peppers, each lit from inside. They look a little surprised.',
    layer: 'wall',
    size: { w: 2, h: 1 },
  },
};

export interface SurfaceRow {
  name: string;
  price: number;
}

export const WALLPAPERS: Record<WallpaperId, SurfaceRow> = {
  plumStripes: { name: 'Plum stripes', price: 300 },
  batDamask: { name: 'Bat damask', price: 420 },
  ghostPolka: { name: 'Ghost polka dots', price: 380 },
  moonlitBlue: { name: 'Moonlit blue', price: 400 },
  mossPanels: { name: 'Moss panels', price: 360 },
  // The Muse's, black and gold (personal_touches.md, "After phase H").
  goldDamask: { name: 'Black & gold damask', price: 480 },
};

export const FLOORINGS: Record<FlooringId, SurfaceRow> = {
  oakBoards: { name: 'Oak boards', price: 300 },
  checkerboard: { name: 'Checkerboard', price: 420 },
  bluePlanks: { name: 'Blue planks', price: 400 },
  mossCarpet: { name: 'Moss carpet', price: 360 },
  cobblestone: { name: 'Cobblestone', price: 380 },
};

/** How many ways a piece can face. */
export function turnCount(id: FurnitureId): number {
  const turns = FURNITURE[id].turns;
  return turns === 'four' ? 4 : turns === 'mirror' ? 2 : 1;
}
