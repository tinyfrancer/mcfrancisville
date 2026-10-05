import type {
  BedroomPiece,
  KitchenPiece,
  LibraryPiece,
  SuiteId,
  SuitePiece,
  WitchPiece,
} from '../types/ids';
import type { FurnitureRow } from './furniture';

/*
 * Furniture sets (0.3's S3): four rooms' worth of pieces drawn to go together, each sold on its
 * own at Cobweb Corner and in Gourdon's book, and dealt whole as Cobweb Corner's set of the week.
 * ("Suite" in the code, since H2's `SetPiece` is a piece that shows a set of what she owns.)
 */

export interface SuiteRow {
  /** What the shelf and the decision call it. */
  name: string;
  pieces: readonly SuitePiece[];
}

/** A cosy kitchen in cream and sage, with copper and a pumpkin or two. */
const KITCHEN: Record<KitchenPiece, FurnitureRow> = {
  cauldronStove: {
    name: 'Cauldron stove',
    description:
      'A little iron range with a cauldron bubbling on top and a fire in its belly. Soup, stew or potion: it is not fussy.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The cauldron burbles. It smells of pumpkin soup today.',
    price: 720,
  },
  batFridge: {
    name: 'Bat-magnet icebox',
    description:
      'A round-shouldered icebox in sage green, with a bat magnet holding up a shopping list. It hums to itself.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The list says: milk, eggs, more cake. A very good list.',
    price: 680,
  },
  cosyCounter: {
    name: 'Cosy counter',
    description:
      'A sage cupboard with heart cut-outs in its doors under a butcher-block top. Room up there for a kettle or a cake.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You wipe the counter down. It was already clean, but it is nice to be sure.',
    price: 440,
  },
  cosySink: {
    name: 'Farmhouse sink',
    description:
      'A deep white sink with a curly brass tap, and a gingham curtain underneath to hide the sponges.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'Drip. Drip. You tighten the tap. Drip. Oh well.',
    price: 560,
  },
  kettleShelf: {
    name: 'Kettle shelf',
    description:
      'A little wooden shelf of teapots and kettles, with mugs hung underneath on hooks.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'Which mug today? The pumpkin one. It is always the pumpkin one.',
    price: 360,
  },
  copperKettle: {
    name: 'Copper kettle',
    description: 'A round copper kettle with a whistle that sounds a bit like an owl.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'Hoo-hoooo! Tea is ready.',
    price: 300,
  },
  ghostCookieJar: {
    name: 'Ghost cookie jar',
    description:
      'A cookie jar shaped like a little ghost, its lid its head. It says "BOO" when opened.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'Boo! You take a cookie anyway. The ghost does not mind.',
    price: 280,
  },
};

/** A bedroom in lavender and rose, with a canopy to dream under. */
const BEDROOM: Record<BedroomPiece, FurnitureRow> = {
  canopyBed: {
    name: 'Canopy bed',
    description:
      'A big soft bed under a rose canopy, its curtains tied back with bows, and a quilt of little hearts.',
    layer: 'floor',
    size: { w: 2, h: 2 },
    says: 'You fluff the pillows. Then you fluff them again. Perfect.',
    price: 900,
  },
  wardrobe: {
    name: 'Moonlit wardrobe',
    description:
      'A tall wardrobe painted with a moon and stars across both doors. Room for every dress and then some.',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'You peek inside. Something sparkly is hanging at the back. Ooh.',
    price: 780,
  },
  vanity: {
    name: 'Vanity table',
    description:
      "A skirted vanity with a mirror ringed in little bulbs, like a star's dressing room. Room on top for the pretty things.",
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'The mirror bulbs twinkle. You look lovely. You always do.',
    price: 740,
  },
  nightstand: {
    name: 'Nightstand',
    description:
      'A little bedside cupboard on curly legs, a moon on its drawer and room on top for a lamp.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You open the drawer: a hair tie, a sweet, and a very old bookmark.',
    price: 400,
  },
  tasselLamp: {
    name: 'Tasselled lamp',
    description: 'A little lamp with a rose shade trimmed in tassels. It glows pink after dark.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You flick a tassel. It swings. You flick it again.',
    price: 340,
  },
  heartRug: {
    name: 'Fluffy heart rug',
    description: 'A rug shaped like a heart, so fluffy your toes get lost in it.',
    layer: 'rug',
    size: { w: 2, h: 1 },
    says: 'You wiggle your toes in it. Bliss.',
    price: 460,
  },
  dreamSampler: {
    name: 'Sweet dreams hoop',
    description: 'An embroidery hoop stitched with DREAM, a sleepy moon and a few stars.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'Every stitch is tiny and neat. Somebody was very patient.',
    price: 300,
  },
};

/** A library in deep teal and old wood, brass and leather. */
const LIBRARY: Record<LibraryPiece, FurnitureRow> = {
  tallBookcase: {
    name: 'Library bookcase',
    description:
      'A tall bookcase with an arched top, full to the brim. Stand a few side by side for a wall of books.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You pull out a book at random. It is exactly the one you wanted.',
    price: 620,
  },
  readingChair: {
    name: 'Reading chair',
    description:
      'A deep teal chair, buttoned and squashy, with a footstool to match. Made for one more chapter.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'You sink in. You may never get up again.',
    price: 640,
    seat: { height: 13 },
  },
  brassGlobe: {
    name: 'Brass globe',
    description: 'A little globe in a brass ring. It spins and spins. Somewhere on it is home.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You spin the globe and stop it with a finger. Next holiday: there.',
    price: 360,
  },
  libraryLadder: {
    name: 'Library ladder',
    description:
      'A rolling ladder for the top shelves, with little wheels and a brass rail. Wheee.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'You climb up two rungs and look very scholarly.',
    price: 420,
  },
  libraryDesk: {
    name: 'Library desk',
    description:
      'A wide desk with a green leather top and brass handles, for letters, puzzles and lamps.',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'You straighten the blotter. Very official.',
    price: 700,
  },
  bankersLamp: {
    name: 'Green glass lamp',
    description: 'A brass desk lamp with a green glass shade, for reading late into the night.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'Click. A soft green glow. Just one more chapter.',
    price: 320,
  },
  townMap: {
    name: 'Map of McFrancisVille',
    description:
      'An old map of the town in a gold frame: the pond, the square, the woods, and a little X where nobody remembers why.',
    layer: 'wall',
    size: { w: 2, h: 1 },
    says: 'You trace the path from your door to the square. You know it by heart.',
    price: 480,
  },
};

/** A witch's corner in plum and moss, with potions that glow. */
const WITCHS_CORNER: Record<WitchPiece, FurnitureRow> = {
  potionRack: {
    name: 'Potion rack',
    description:
      'A tall rack of potions, each corked and labelled in curly writing: pink ones, green ones, a pumpkin one. A few of them glow.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'One bottle says "FOR EMERGENCIES". It smells of hot chocolate.',
    price: 660,
  },
  seeingStone: {
    name: 'Seeing stone',
    description:
      'A crystal ball on a little velvet cushion, held up by a brass bat. It shows only nice things.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'You peer in. You see… a nap, in your future. Lovely.',
    price: 380,
  },
  hatStand: {
    name: 'Hat stand',
    description: 'A twisty wooden stand with a witch hat on top and a stripy scarf on a peg.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    turns: 'mirror',
    says: 'You try the hat on. It suits you. It always did.',
    price: 440,
  },
  broomHook: {
    name: 'Broom hook',
    description: 'A peg on the wall with a spare broom hung up, ready for a quick spin round town.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'The broom twitches. It would like to go out, please.',
    price: 340,
  },
  spellLectern: {
    name: 'Spellbook lectern',
    description:
      'A carved stand with a big spellbook open on it, its pages glowing a little. Today it is open at biscuits.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The book turns its own page for you. How kind.',
    price: 600,
  },
  herbBundles: {
    name: 'Drying herbs',
    description:
      'Bundles of lavender, sage and rosemary hung up to dry. The whole room smells lovely.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'You breathe in. Lavender, mostly. Mmm.',
    price: 300,
  },
  moonPhaseRug: {
    name: 'Moon phase rug',
    description: 'A plum rug woven with the moon in all its shapes, new to full and back again.',
    layer: 'rug',
    size: { w: 2, h: 1 },
    says: 'You hop from new moon to full moon. Eight hops. A good night.',
    price: 480,
  },
};

/** Every piece of 0.3's S3, spread into `FURNITURE`. */
export const SET_FURNITURE: Record<SuitePiece, FurnitureRow> = {
  ...KITCHEN,
  ...BEDROOM,
  ...LIBRARY,
  ...WITCHS_CORNER,
};

/** The four sets, each dealt whole as Cobweb Corner's set of the week. */
export const SUITES: Record<SuiteId, SuiteRow> = {
  cosyKitchen: { name: 'Cosy kitchen', pieces: Object.keys(KITCHEN) as KitchenPiece[] },
  bedroom: { name: 'Bedroom', pieces: Object.keys(BEDROOM) as BedroomPiece[] },
  library: { name: 'Library', pieces: Object.keys(LIBRARY) as LibraryPiece[] },
  witchsCorner: { name: "Witch's corner", pieces: Object.keys(WITCHS_CORNER) as WitchPiece[] },
};

/** Every set's pieces, for the shelves that deal from all of them. */
export const SET_WARES = Object.keys(SET_FURNITURE) as SuitePiece[];
