import type {
  FixtureId,
  FlooringId,
  InteriorId,
  PropId,
  ShopId,
  VillagerId,
  WallpaperId,
} from '../types/ids';
import type { Tile } from './maps';
import type { Family } from './critters';
import type { Placed } from './home';
import type { Instrument } from './instruments';
import type { ActivityId } from './activities';

/**
 * What walking up to a fixture opens: a shop's counter, her salon chair, the museum's cases, and
 * the bakery's oven, which she may cook at (phase R).
 */
export type Opens =
  | { shop: ShopId }
  | { sheet: 'salon' | 'museum' | 'stove' }
  /** Ollie's catalogue (0.3's S1), at his post counter. */
  | { sheet: 'catalogue' }
  /** One of the fairground's activities (0.2's M2): the fortune table. */
  | { activity: ActivityId };

export interface FixtureRow {
  name: string;
  /** Standing on the floor, or hanging on the back wall. */
  layer: 'floor' | 'wall';
  /** In tiles, as a piece of furniture's is. */
  size: { w: number; h: number };
  /** What she hears or thinks when she walks up to it, if it opens nothing. */
  says?: string;
  opens?: Opens;
  /** What it plays when she walks up to it (0.2's G2), as a piano does. */
  plays?: Instrument;
  /** A bed of hers (0.3's F2): a raised bed in the greenhouse, tended as any bed is. */
  planter?: true;
}

/** The greenhouse's own (0.3's F2, decision 242). */
const GREENHOUSE_FIXTURES: Record<Extract<FixtureId, 'raisedBed' | 'glassPanes'>, FixtureRow> = {
  raisedBed: { name: 'Raised bed', layer: 'floor', size: { w: 1, h: 1 }, planter: true },
  glassPanes: {
    name: 'Glass',
    layer: 'wall',
    size: { w: 2, h: 2 },
    says: 'Sunshine through the glass, warm as July whatever the month. A vine is trying the door.',
  },
};

/** Scarah's own (0.3's F3), in her farmhouse. */
const SCARAH_FIXTURES: Record<Extract<FixtureId, 'seedDrawers'>, FixtureRow> = {
  seedDrawers: {
    name: 'Seed drawers',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: "A hundred little drawers, each labelled in neat stitches: BEANS, MORE BEANS, CORN, and CORNELIUS'S (KEEP OUT).",
  },
};

/**
 * What stands in the town's buildings for good (phase H): the counters, shelves and chairs the
 * shops and the salon are run from, the museum's cases, and a piece in each neighbour's house that
 * is most like them. Drawn at 32 in `sprites/interiors.ts`.
 */
export const FIXTURES: Record<FixtureId, FixtureRow> = {
  shopCounter: {
    name: 'Counter',
    layer: 'floor',
    size: { w: 3, h: 1 },
    opens: { shop: 'corner' },
  },
  goodsShelf: {
    name: 'Shelves',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'Jars of eyeball gumballs, tins of bat biscuits, and a very dusty snow globe. Ooh.',
  },
  clothesRack: {
    name: 'Clothes rack',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'Everything on the rack is your size. What are the chances! Ask at the counter.',
  },
  salonChair: {
    name: 'Salon chair',
    layer: 'floor',
    size: { w: 1, h: 1 },
    opens: { sheet: 'salon' },
  },
  salonMirror: {
    name: 'Mirror',
    layer: 'wall',
    size: { w: 1, h: 2 },
    says: 'Looking good, {name}. Looking really good.',
  },
  hoodDryer: {
    name: 'Hood dryer',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The hood dryer hums a little tune. It only knows the one.',
  },
  washBasin: {
    name: 'Wash basin',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'A deep basin and a comfy neck rest. The best part of any appointment.',
  },
  bakeryCounter: {
    name: 'Cake counter',
    layer: 'floor',
    size: { w: 3, h: 1 },
    says: "Coffin cakes, bat-wing biscuits and a tray of sugar skulls. Wrapunzel's finest, all of it.",
  },
  bakeryOven: {
    name: 'Oven',
    layer: 'floor',
    size: { w: 2, h: 1 },
    // Wrapunzel lets her bake in it whenever she likes (phase R).
    opens: { sheet: 'stove' },
  },
  museumCase: {
    name: 'Display case',
    layer: 'floor',
    size: { w: 3, h: 1 },
    opens: { sheet: 'museum' },
  },
  libraryShelf: {
    name: 'Bookshelves',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'Floor-to-ceiling ghost stories, sorted by how many shivers each one gives.',
  },
  flowerBuckets: {
    name: 'Flower buckets',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'Roses, moonflowers and forget-me-boos, sorted by colour with enormous, careful paws.',
  },
  bigCauldron: {
    name: 'Great cauldron',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'It bubbles and smells of toffee apples. A little voice from inside says "not yet!"',
  },
  pottingBench: {
    name: 'Potting bench',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'Trowels, twine and a hundred little pots, each with a seedling and a name tag.',
  },
  // Her, as a pin-up (personal_touches.md, "After phase H"), painted from her look as it is.
  // The newcomers' own pieces (phase T).
  sortingTable: {
    name: 'Sorting table',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'Letters in three piles: NOW, SOON and GHOSTS. The GHOSTS pile is see-through.',
  },
  lanternRack: {
    name: 'Lantern rack',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'Lanterns waiting to be lit, each with a name tag: Bob, Bobbi, Bobbins and Gerald.',
  },
  // Gourdon's workshop (0.3's S2): fresh from the bench, and his book, made to order.
  carpentersBench: {
    name: "Carpenter's bench",
    layer: 'floor',
    size: { w: 2, h: 1 },
    opens: { shop: 'workshop' },
  },
  // Ollie's (0.3's S1): the catalogue of everything she has ever had, to order again.
  postCounter: {
    name: 'Post counter',
    layer: 'floor',
    size: { w: 2, h: 1 },
    opens: { sheet: 'catalogue' },
  },
  bigTelescope: {
    name: 'Great telescope',
    layer: 'floor',
    size: { w: 2, h: 1 },
    says: 'A telescope as long as a canoe, pointed at a star called Kevin.',
  },
  pinUpPortrait: {
    name: 'Pin-up portrait',
    layer: 'wall',
    size: { w: 2, h: 2 },
    says: "{name}, as a pin-up. Stunning. Obviously. The Muse's best advertisement.",
  },
  // Boothoven's (0.2's L1), its lid up and its keys a little see-through.
  grandPiano: {
    name: 'Grand piano',
    layer: 'floor',
    size: { w: 3, h: 2 },
    plays: 'piano',
  },
  pipeOrgan: {
    name: 'Pipe organ',
    layer: 'floor',
    size: { w: 3, h: 1 },
    says: 'You press a key. It plays the first four notes of a love song, dramatically.',
  },
  // Castle Mac-A-Boo's hall (phase U), set for their anniversary (personal_touches.md, "After
  // phase I"). Question 30 may yet say what should be in it.
  weddingCake: {
    name: 'Wedding cake',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'A wedding cake, three tiers tall, with two little figures on top. It never goes stale. It knows it matters.',
  },
  weddingPortrait: {
    name: 'Wedding portrait',
    layer: 'wall',
    size: { w: 3, h: 2 },
    says: 'You and Cody, with monarchs all round. {years} years, and he still looks at you like that.',
  },
  musicBox: {
    name: 'Music box',
    layer: 'floor',
    size: { w: 1, h: 1 },
    plays: 'musicBox',
  },
  hallPiano: {
    name: 'Grand piano',
    layer: 'floor',
    size: { w: 3, h: 2 },
    plays: 'piano',
  },
  // The fortune tent's (0.2's M1), where the crystal ball reads her fortune (M2).
  fortuneTable: {
    name: 'Fortune table',
    layer: 'floor',
    size: { w: 2, h: 1 },
    opens: { activity: 'fortune' },
  },
  starCharts: {
    name: 'Star charts',
    layer: 'wall',
    size: { w: 2, h: 2 },
    says: "The moon's faces and the stars that make a cat, a cauldron and, if you squint, Cody.",
  },
  hallWindow: {
    name: 'Stained glass',
    layer: 'wall',
    size: { w: 2, h: 2 },
    says: 'Monarchs in coloured glass. When the sun comes through, the whole floor flutters.',
  },
  ...GREENHOUSE_FIXTURES,
  ...SCARAH_FIXTURES,
};

/** A fixture where it stands. A museum case says which family of critter it shows. */
export interface PlacedFixture {
  id: FixtureId;
  tx: number;
  ty: number;
  shows?: Family;
}

/**
 * A piece of furniture where it stands in a building. A `keepsake` is one the owner lets her have
 * one just like once a friendship has so many hearts, into her storage chest.
 */
export interface InteriorPiece extends Placed {
  keepsake?: number;
}

export interface InteriorRow {
  /** The building outdoors whose door leads in. */
  building: PropId;
  /** Whose it is, for a neighbour's house and its keepsakes. */
  owner?: VillagerId;
  /** Its floor, in tiles, under a back wall three tiles tall. */
  width: number;
  floorRows: number;
  wallpaper: WallpaperId;
  flooring: FlooringId;
  fixtures: readonly PlacedFixture[];
  furniture: readonly InteriorPiece[];
  /**
   * Where her neighbours stand when they're in (phase S): the first for whoever keeps it, the rest
   * for anyone in to browse or visit. Clear of the mat, of where she stands to use what opens a
   * sheet, and of the tile under anything, where a tap on it would be a hello instead.
   */
  stands: readonly Tile[];
  /** What she finds as she comes in. */
  welcome: string;
  /** Under glass (0.3's F2): every crop planted in its beds grows as if in its own season. */
  underGlass?: true;
}

/** The hearts at which a neighbour lets her have a keepsake like theirs: the first, and the second. */
export const KEEPSAKE_HEARTS = [2, 5] as const;

const [FIRST, SECOND] = KEEPSAKE_HEARTS;

/**
 * Inside the town's buildings (phase H). Every room has its door mat in the middle of its front
 * edge, and the rows in the back three are wall. A neighbour's house is furnished after them, with
 * two keepsakes she can have ones like once they're close (`KEEPSAKE_HEARTS`).
 */
/**
 * The greenhouse at Boo Acres (0.3's F2, decision 242): two blocks of raised beds under the glass,
 * a path round them, the potting bench and buckets of cut flowers by the door.
 */
const GREENHOUSE: InteriorRow = {
  building: 'greenhouse',
  width: 11,
  floorRows: 7,
  wallpaper: 'mossPanels',
  flooring: 'cobblestone',
  underGlass: true,
  stands: [
    { tx: 5, ty: 5 },
    { tx: 0, ty: 4 },
    { tx: 10, ty: 6 },
  ],
  welcome:
    'The greenhouse. Warm and green and smelling of tomato leaves, and every season at once under the glass.',
  fixtures: [
    { id: 'glassPanes', tx: 0, ty: 1 },
    { id: 'glassPanes', tx: 3, ty: 1 },
    { id: 'glassPanes', tx: 6, ty: 1 },
    { id: 'glassPanes', tx: 9, ty: 1 },
    ...[1, 2, 3, 7, 8, 9].flatMap((tx) => [
      { id: 'raisedBed' as const, tx, ty: 4 },
      { id: 'raisedBed' as const, tx, ty: 6 },
    ]),
    { id: 'pottingBench', tx: 0, ty: 8 },
    { id: 'flowerBuckets', tx: 9, ty: 8 },
  ],
  furniture: [
    { id: 'monstera', tx: 0, ty: 9, turn: 0 },
    { id: 'monstera', tx: 10, ty: 9, turn: 0 },
  ],
};

/**
 * Scarah's farmhouse at Boo Acres (0.3's F3): her seed drawers by the wall, the hearth with an
 * armchair beside it, a tea table, and her keepsakes, Cornelius's perch and the harvest moon quilt.
 */
const SCARAH_FARMHOUSE: InteriorRow = {
  building: 'farmhouse',
  owner: 'scarah',
  width: 9,
  floorRows: 6,
  wallpaper: 'ghostPolka',
  flooring: 'oakBoards',
  stands: [
    { tx: 4, ty: 5 },
    { tx: 2, ty: 4 },
    { tx: 6, ty: 7 },
  ],
  welcome:
    "Scarah's farmhouse. It smells of fresh bread and hay, and there's a crow-sized cushion by the fire.",
  fixtures: [{ id: 'seedDrawers', tx: 0, ty: 3 }],
  furniture: [
    { id: 'crowPerch', tx: 8, ty: 3, turn: 0, keepsake: FIRST },
    { id: 'harvestQuilt', tx: 1, ty: 1, turn: 0, keepsake: SECOND },
    { id: 'stoneHearth', tx: 4, ty: 3, turn: 0 },
    { id: 'pumpkinChair', tx: 6, ty: 3, turn: 0 },
    { id: 'teaTable', tx: 1, ty: 6, turn: 0 },
    { id: 'pumpkinPile', tx: 0, ty: 8, turn: 0 },
    { id: 'flowerPots', tx: 8, ty: 7, turn: 0 },
    { id: 'wallShelf', tx: 6, ty: 1, turn: 0 },
  ],
};

export const INTERIORS: Record<InteriorId, InteriorRow> = {
  cobwebCorner: {
    building: 'shopHouse',
    width: 11,
    floorRows: 7,
    wallpaper: 'batDamask',
    flooring: 'oakBoards',
    stands: [
      { tx: 7, ty: 4 },
      { tx: 3, ty: 6 },
      { tx: 8, ty: 6 },
    ],
    welcome: 'Cobweb Corner. The bell over the door says "boo!", very politely.',
    fixtures: [
      { id: 'goodsShelf', tx: 0, ty: 3 },
      { id: 'goodsShelf', tx: 2, ty: 3 },
      { id: 'clothesRack', tx: 8, ty: 3 },
      { id: 'shopCounter', tx: 4, ty: 5 },
    ],
    furniture: [
      { id: 'batClock', tx: 5, ty: 1, turn: 0 },
      { id: 'batGarland', tx: 4, ty: 0, turn: 0 },
      { id: 'gothicMirror', tx: 7, ty: 1, turn: 0 },
      { id: 'jackOLantern', tx: 10, ty: 3, turn: 0 },
      { id: 'monstera', tx: 0, ty: 8, turn: 0 },
      { id: 'pumpkinChair', tx: 10, ty: 8, turn: 0 },
      { id: 'spiderwebRug', tx: 7, ty: 5, turn: 0 },
    ],
  },
  muse: {
    building: 'salonHouse',
    width: 11,
    floorRows: 7,
    wallpaper: 'goldDamask',
    flooring: 'checkerboard',
    stands: [
      { tx: 3, ty: 4 },
      { tx: 7, ty: 4 },
      { tx: 9, ty: 5 },
    ],
    welcome: 'The Muse Hair Salon. Your salon! Black and gold, and smelling of rose shampoo.',
    fixtures: [
      { id: 'salonMirror', tx: 2, ty: 1 },
      { id: 'salonChair', tx: 2, ty: 3 },
      { id: 'salonMirror', tx: 5, ty: 1 },
      { id: 'salonChair', tx: 5, ty: 3 },
      { id: 'pinUpPortrait', tx: 8, ty: 1 },
      { id: 'washBasin', tx: 0, ty: 3 },
      { id: 'hoodDryer', tx: 8, ty: 7 },
      { id: 'hoodDryer', tx: 9, ty: 7 },
    ],
    furniture: [
      { id: 'candelabra', tx: 10, ty: 3, turn: 0 },
      { id: 'candelabra', tx: 1, ty: 3, turn: 0 },
      { id: 'roseVase', tx: 4, ty: 3, turn: 0 },
      { id: 'snakePlant', tx: 0, ty: 8, turn: 0 },
      { id: 'monstera', tx: 10, ty: 8, turn: 0 },
      { id: 'batGarland', tx: 3, ty: 0, turn: 0 },
    ],
  },
  crumbs: {
    building: 'bakery',
    owner: 'wrapunzel',
    width: 20,
    floorRows: 7,
    wallpaper: 'plumStripes',
    flooring: 'checkerboard',
    stands: [
      { tx: 2, ty: 4 },
      { tx: 7, ty: 4 },
      { tx: 9, ty: 7 },
      { tx: 5, ty: 7 },
    ],
    welcome:
      "Crumbs & Curios: warm bread on the left, Wrapunzel's museum on the right. Mind the crumbs.",
    fixtures: [
      { id: 'bakeryOven', tx: 0, ty: 3 },
      { id: 'bakeryCounter', tx: 1, ty: 5 },
      { id: 'museumCase', tx: 11, ty: 3, shows: 'moth' },
      { id: 'museumCase', tx: 14, ty: 3, shows: 'bat' },
      { id: 'museumCase', tx: 17, ty: 3, shows: 'orb' },
      { id: 'museumCase', tx: 11, ty: 8, shows: 'frog' },
      { id: 'museumCase', tx: 14, ty: 8, shows: 'beetle' },
      { id: 'museumCase', tx: 17, ty: 8, shows: 'fish' },
    ],
    furniture: [
      { id: 'cupcakeTower', tx: 4, ty: 3, turn: 0, keepsake: FIRST },
      { id: 'mummyTeapot', tx: 5, ty: 3, turn: 0, keepsake: SECOND },
      { id: 'coffinCake', tx: 6, ty: 3, turn: 0 },
      { id: 'candelabra', tx: 8, ty: 3, turn: 0 },
      { id: 'catPortrait', tx: 3, ty: 1, turn: 0 },
      { id: 'ghostPortrait', tx: 8, ty: 1, turn: 0 },
      { id: 'moonPainting', tx: 10, ty: 1, turn: 0 },
      { id: 'stumpStool', tx: 1, ty: 8, turn: 0 },
      { id: 'stumpStool', tx: 3, ty: 8, turn: 0 },
      { id: 'lunaMothLamp', tx: 10, ty: 4, turn: 0 },
    ],
  },
  library: {
    building: 'maudeHouse',
    owner: 'maude',
    width: 9,
    floorRows: 6,
    wallpaper: 'moonlitBlue',
    flooring: 'bluePlanks',
    stands: [
      { tx: 5, ty: 4 },
      { tx: 2, ty: 6 },
      { tx: 7, ty: 6 },
    ],
    welcome: "Maude's library. Hush! The books are sleeping. (They aren't. They're listening.)",
    fixtures: [
      { id: 'libraryShelf', tx: 0, ty: 3 },
      { id: 'libraryShelf', tx: 2, ty: 3 },
      { id: 'libraryShelf', tx: 7, ty: 3 },
    ],
    furniture: [
      { id: 'floatingCandles', tx: 5, ty: 1, turn: 0, keepsake: FIRST },
      { id: 'wingbackChair', tx: 5, ty: 5, turn: 0, keepsake: SECOND },
      { id: 'ghostStories', tx: 6, ty: 5, turn: 0 },
      { id: 'batLamp', tx: 4, ty: 5, turn: 0 },
      { id: 'coffinBookshelf', tx: 0, ty: 7, turn: 0 },
      { id: 'ghostPortrait', tx: 3, ty: 1, turn: 0 },
      { id: 'moonRug', tx: 4, ty: 6, turn: 0 },
    ],
  },
  rufusCabin: {
    building: 'rufusHouse',
    owner: 'rufus',
    width: 9,
    floorRows: 6,
    wallpaper: 'mossPanels',
    flooring: 'oakBoards',
    stands: [
      { tx: 3, ty: 4 },
      { tx: 7, ty: 4 },
      { tx: 2, ty: 6 },
    ],
    welcome: "Rufus's cabin. Roses everywhere, and a dog bed the size of a sofa.",
    fixtures: [{ id: 'flowerBuckets', tx: 0, ty: 3 }],
    furniture: [
      { id: 'roseBucket', tx: 8, ty: 3, turn: 0, keepsake: FIRST },
      { id: 'pawPrintRug', tx: 3, ty: 6, turn: 0, keepsake: SECOND },
      { id: 'stoneHearth', tx: 4, ty: 3, turn: 0 },
      { id: 'moonBouquet', tx: 8, ty: 7, turn: 0 },
      { id: 'hostaPlanter', tx: 0, ty: 7, turn: 0 },
      { id: 'pressedFlowers', tx: 2, ty: 1, turn: 0 },
      { id: 'moonPainting', tx: 6, ty: 1, turn: 0 },
      { id: 'stumpStool', tx: 6, ty: 5, turn: 0 },
    ],
  },
  agathaCottage: {
    building: 'agathaHouse',
    owner: 'agatha',
    width: 9,
    floorRows: 6,
    wallpaper: 'batDamask',
    flooring: 'cobblestone',
    stands: [
      { tx: 5, ty: 4 },
      { tx: 2, ty: 5 },
      { tx: 6, ty: 5 },
    ],
    welcome: "Agatha's cottage. Something in the cauldron says hello. You say hello back.",
    fixtures: [{ id: 'bigCauldron', tx: 3, ty: 4 }],
    furniture: [
      { id: 'potionShelf', tx: 1, ty: 1, turn: 0, keepsake: FIRST },
      { id: 'witchHatLamp', tx: 8, ty: 3, turn: 0, keepsake: SECOND },
      { id: 'broomstick', tx: 0, ty: 3, turn: 0 },
      { id: 'crystalBall', tx: 7, ty: 6, turn: 0 },
      { id: 'candelabra', tx: 6, ty: 3, turn: 0 },
      { id: 'venusFlytrap', tx: 0, ty: 7, turn: 0 },
      { id: 'batClock', tx: 6, ty: 1, turn: 0 },
      { id: 'spiderwebRug', tx: 3, ty: 5, turn: 0 },
    ],
  },
  bartyCottage: {
    building: 'bartyHouse',
    owner: 'barty',
    width: 9,
    floorRows: 6,
    wallpaper: 'mossPanels',
    flooring: 'mossCarpet',
    stands: [
      { tx: 2, ty: 4 },
      { tx: 4, ty: 5 },
      { tx: 6, ty: 5 },
    ],
    welcome: "Barty's cottage. More plants than floor, and every one of them doing beautifully.",
    fixtures: [{ id: 'pottingBench', tx: 0, ty: 3 }],
    furniture: [
      { id: 'seedlingTray', tx: 3, ty: 3, turn: 0, keepsake: FIRST },
      { id: 'skullPlanter', tx: 8, ty: 3, turn: 0, keepsake: SECOND },
      { id: 'boneGnome', tx: 7, ty: 6, turn: 0 },
      { id: 'monstera', tx: 0, ty: 7, turn: 0 },
      { id: 'snakePlant', tx: 8, ty: 7, turn: 0 },
      { id: 'succulents', tx: 5, ty: 3, turn: 0 },
      { id: 'hostaPlanter', tx: 6, ty: 3, turn: 0 },
      { id: 'pothos', tx: 2, ty: 1, turn: 0 },
      { id: 'pressedFlowers', tx: 5, ty: 1, turn: 0 },
    ],
  },
  codyManor: {
    building: 'codyHouse',
    owner: 'cody',
    width: 11,
    floorRows: 7,
    wallpaper: 'batDamask',
    flooring: 'checkerboard',
    stands: [
      { tx: 6, ty: 4 },
      { tx: 3, ty: 6 },
      { tx: 8, ty: 6 },
    ],
    welcome: "Cody's manor. Velvet, candles, and a coffin he swears is just for show.",
    fixtures: [{ id: 'pipeOrgan', tx: 0, ty: 3 }],
    furniture: [
      { id: 'velvetSettee', tx: 5, ty: 5, turn: 0, keepsake: FIRST },
      { id: 'stainedGlass', tx: 5, ty: 1, turn: 0, keepsake: SECOND },
      { id: 'codyPortrait', tx: 8, ty: 1, turn: 0 },
      { id: 'candelabra', tx: 4, ty: 3, turn: 0 },
      { id: 'candelabra', tx: 7, ty: 3, turn: 0 },
      { id: 'tombstone', tx: 10, ty: 3, turn: 0 },
      { id: 'skeletonFriend', tx: 10, ty: 8, turn: 0 },
      { id: 'spiderwebRug', tx: 4, ty: 6, turn: 0 },
      { id: 'batGarland', tx: 1, ty: 0, turn: 0 },
    ],
  },
  // The newcomers' homes (phase T), gone into once each has moved in.
  ollieCottage: {
    building: 'ollieHouse',
    owner: 'ollie',
    width: 9,
    floorRows: 6,
    wallpaper: 'plumStripes',
    flooring: 'oakBoards',
    stands: [
      { tx: 3, ty: 5 },
      { tx: 6, ty: 5 },
      { tx: 2, ty: 7 },
    ],
    welcome:
      "Ollie's cottage. Letters everywhere, in very neat piles, and a bicycle bell on the door.",
    fixtures: [
      { id: 'sortingTable', tx: 0, ty: 3 },
      { id: 'postCounter', tx: 0, ty: 6 },
    ],
    furniture: [
      { id: 'stampAlbum', tx: 3, ty: 3, turn: 0, keepsake: FIRST },
      { id: 'parcelStack', tx: 8, ty: 3, turn: 0, keepsake: SECOND },
      { id: 'writingDesk', tx: 5, ty: 3, turn: 0 },
      { id: 'pigeonholes', tx: 1, ty: 1, turn: 0 },
      { id: 'moonPainting', tx: 6, ty: 1, turn: 0 },
      { id: 'batLamp', tx: 8, ty: 7, turn: 0 },
      { id: 'pothos', tx: 4, ty: 1, turn: 0 },
    ],
  },
  nessaBoathouse: {
    building: 'nessaHouse',
    owner: 'nessa',
    width: 9,
    floorRows: 6,
    wallpaper: 'moonlitBlue',
    flooring: 'bluePlanks',
    stands: [
      { tx: 4, ty: 5 },
      { tx: 2, ty: 6 },
      { tx: 6, ty: 6 },
    ],
    welcome:
      "Nessa's boathouse. It smells of the lake, and the kettle is always just about to boil.",
    fixtures: [{ id: 'lanternRack', tx: 0, ty: 3 }],
    furniture: [
      { id: 'smoothStones', tx: 3, ty: 3, turn: 0, keepsake: FIRST },
      { id: 'crossedOars', tx: 6, ty: 1, turn: 0, keepsake: SECOND },
      { id: 'bubbleTank', tx: 8, ty: 3, turn: 0 },
      { id: 'lilyLantern', tx: 6, ty: 3, turn: 0 },
      { id: 'lunaMothLamp', tx: 8, ty: 7, turn: 0 },
      { id: 'pothos', tx: 2, ty: 1, turn: 0 },
    ],
  },
  gourdonPumpkin: {
    building: 'gourdonHouse',
    owner: 'gourdon',
    width: 9,
    floorRows: 6,
    wallpaper: 'mossPanels',
    flooring: 'oakBoards',
    stands: [
      { tx: 5, ty: 4 },
      { tx: 2, ty: 6 },
      { tx: 6, ty: 6 },
    ],
    welcome: "Gourdon's pumpkin. It's roomier on the inside, and smells of pie and sawdust.",
    fixtures: [{ id: 'carpentersBench', tx: 0, ty: 3 }],
    furniture: [
      { id: 'toolRack', tx: 1, ty: 1, turn: 0, keepsake: FIRST },
      { id: 'carvedOwl', tx: 8, ty: 3, turn: 0, keepsake: SECOND },
      { id: 'pumpkinClock', tx: 7, ty: 3, turn: 0 },
      { id: 'pumpkinStool', tx: 3, ty: 3, turn: 0 },
      { id: 'jackOLantern', tx: 8, ty: 7, turn: 0 },
      { id: 'stumpStool', tx: 0, ty: 7, turn: 0 },
      { id: 'moonPainting', tx: 5, ty: 1, turn: 0 },
    ],
  },
  hazelObservatory: {
    building: 'hazelHouse',
    owner: 'hazel',
    width: 9,
    floorRows: 6,
    wallpaper: 'moonlitBlue',
    flooring: 'cobblestone',
    stands: [
      { tx: 4, ty: 4 },
      { tx: 2, ty: 6 },
      { tx: 6, ty: 6 },
    ],
    welcome: "Hazel's observatory. The roof opens to the sky, and every wall is covered in stars.",
    fixtures: [{ id: 'bigTelescope', tx: 6, ty: 3 }],
    furniture: [
      { id: 'orrery', tx: 0, ty: 3, turn: 0, keepsake: FIRST },
      { id: 'moonGlobe', tx: 2, ty: 3, turn: 0, keepsake: SECOND },
      { id: 'starChart', tx: 3, ty: 1, turn: 0 },
      { id: 'telescope', tx: 8, ty: 7, turn: 0 },
      { id: 'candelabra', tx: 0, ty: 7, turn: 0 },
      { id: 'moonPainting', tx: 6, ty: 1, turn: 0 },
    ],
  },
  boothovenParlour: {
    building: 'boothovenHouse',
    owner: 'boothoven',
    width: 9,
    floorRows: 6,
    wallpaper: 'plumStripes',
    flooring: 'oakBoards',
    stands: [
      { tx: 4, ty: 5 },
      { tx: 2, ty: 6 },
      { tx: 6, ty: 6 },
    ],
    welcome:
      "Boothoven's parlour. Sheet music on every surface, a grand piano by the window, and a tune that hasn't quite finished.",
    fixtures: [{ id: 'grandPiano', tx: 5, ty: 3 }],
    furniture: [
      { id: 'musicStand', tx: 1, ty: 3, turn: 0, keepsake: FIRST },
      { id: 'sheetMusic', tx: 2, ty: 1, turn: 0, keepsake: SECOND },
      { id: 'moonPainting', tx: 4, ty: 1, turn: 0 },
      { id: 'recordPlayer', tx: 0, ty: 7, turn: 0 },
      { id: 'candelabra', tx: 8, ty: 7, turn: 0 },
      { id: 'candelabra', tx: 3, ty: 3, turn: 0 },
    ],
  },
  // The fortune teller's tent at the Hollow Fairground (0.2's M1): Agatha's, at weekends, behind
  // her table, and anyone's to sit in and wonder the rest of the week.
  fortuneTent: {
    building: 'fortuneTent',
    width: 7,
    floorRows: 5,
    wallpaper: 'plumStripes',
    flooring: 'mossCarpet',
    stands: [
      { tx: 3, ty: 3 },
      { tx: 1, ty: 5 },
      { tx: 5, ty: 6 },
    ],
    welcome:
      'The fortune tent. Candlelight, a crystal ball, and the smell of incense and toffee apples.',
    fixtures: [
      { id: 'starCharts', tx: 1, ty: 1 },
      { id: 'fortuneTable', tx: 3, ty: 4 },
    ],
    furniture: [
      { id: 'candelabra', tx: 0, ty: 3, turn: 0 },
      { id: 'candelabra', tx: 6, ty: 3, turn: 0 },
      { id: 'floatingCandles', tx: 4, ty: 1, turn: 0 },
      { id: 'catPortrait', tx: 5, ty: 1, turn: 0 },
      { id: 'moonRug', tx: 2, ty: 5, turn: 0 },
    ],
  },
  // Castle Mac-A-Boo's great hall (phase U), for their anniversary, behind the heart key.
  castleHall: {
    building: 'castle',
    width: 13,
    floorRows: 7,
    wallpaper: 'goldDamask',
    flooring: 'cobblestone',
    // The first is at the piano's upper end, where Boothoven sits for their anniversary duet (0.2's
    // L2), leaving the lower end, where walking up to it puts her, for her (V1).
    stands: [
      { tx: 3, ty: 5 },
      { tx: 6, ty: 6 },
      { tx: 9, ty: 7 },
    ],
    welcome:
      "Castle Mac-A-Boo's great hall, all candlelight and roses, set just so for an anniversary. Yours.",
    fixtures: [
      { id: 'hallWindow', tx: 1, ty: 1 },
      { id: 'weddingPortrait', tx: 5, ty: 1 },
      { id: 'hallWindow', tx: 10, ty: 1 },
      { id: 'weddingCake', tx: 6, ty: 4 },
      { id: 'musicBox', tx: 11, ty: 3 },
      { id: 'hallPiano', tx: 0, ty: 5 },
    ],
    furniture: [
      { id: 'candelabra', tx: 4, ty: 3, turn: 0 },
      { id: 'candelabra', tx: 8, ty: 3, turn: 0 },
      { id: 'roseVase', tx: 0, ty: 3, turn: 0 },
      { id: 'roseVase', tx: 12, ty: 3, turn: 0 },
      { id: 'floatingCandles', tx: 3, ty: 1, turn: 0 },
      { id: 'floatingCandles', tx: 9, ty: 1, turn: 0 },
      { id: 'monstera', tx: 0, ty: 9, turn: 0 },
      { id: 'monstera', tx: 12, ty: 9, turn: 0 },
    ],
  },
  greenhouse: GREENHOUSE,
  scarahFarmhouse: SCARAH_FARMHOUSE,
};

export const INTERIOR_IDS = Object.keys(INTERIORS) as InteriorId[];

/** Her beds in a room (0.3's F2): a tile for each fixture there that is one. */
export function bedsInRoom(id: InteriorId): Tile[] {
  return INTERIORS[id].fixtures
    .filter((f) => FIXTURES[f.id].planter)
    .map(({ tx, ty }) => ({ tx, ty }));
}

export function isInterior(zone: string): zone is InteriorId {
  return zone in INTERIORS;
}
