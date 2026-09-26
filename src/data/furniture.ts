import type { FlooringId, FurnitureId, WallpaperId } from '../types/ids';

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
  /** What it costs in a shop. Furniture is never sold back: it waits in her storage chest. */
  price: number;
}

/**
 * Everything that can go in her home. The two-headed duck is hers from the first day, because she
 * keeps real ones out at home (personal_touches.md, "Her home"); the corkboard waits for the mayor's
 * mystery (decisions.md 19); the marble run is the one from the videos she loves.
 */
export const FURNITURE: Record<FurnitureId, FurnitureRow> = {
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
    turns: 'mirror',
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
    description: 'A corkboard with pins and red string, waiting for a mystery. Nothing on it yet…',
    layer: 'wall',
    size: { w: 2, h: 1 },
    price: 500,
  },
  batGarland: {
    name: 'Bat garland',
    description: 'A string of paper bats, flapping gently in no breeze at all.',
    layer: 'wall',
    size: { w: 2, h: 1 },
    price: 240,
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
