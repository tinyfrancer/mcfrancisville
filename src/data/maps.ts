import type { MapZoneId, PatchId, PropId, TileId, ZoneId } from '../types/ids';

/** A tile of a map, by column and row. */
export interface Tile {
  tx: number;
  ty: number;
}

export interface LegendEntry {
  tile: TileId;
  prop?: PropId;
  /** A solid tile can't be walked on. Props are solid over their whole footprint regardless. */
  solid?: boolean;
  /** Wildflowers growing on the tile, picked by walking onto it. */
  patch?: PatchId;
  /**
   * Grass kept for the farm's extension row `plot` (0.2's N1, the first is 1): beds once she has
   * built that far, solid then and tended like the rest.
   */
  plot?: number;
}

/**
 * A way out at the edge of a map: a run of open tiles she walks onto to go through to `to`. Coming
 * back, she steps in onto the tile inside the same place (decisions.md 90).
 */
export interface ExitSource {
  to: ZoneId;
  tx: number;
  ty: number;
  /** How many tiles it runs across or down the edge; one if not given. */
  w?: number;
  h?: number;
  /**
   * An iron gate hangs across it between two posts, shut while the place beyond is and open once
   * it opens (the castle hill's, phase I).
   */
  gate?: true;
}

/**
 * A signpost (`s`) and the place it points to, one of the ways out of its map (0.2's C1): the
 * place's word is on its board, pointing the way, and walking up to it reads its line
 * (`data/signposts.ts`).
 */
export interface SignSource {
  tx: number;
  ty: number;
  to: MapZoneId;
}

/**
 * A building she walks up to and goes in by, into `to`. She comes back out onto the tile in front
 * of its door (`doorStep`).
 */
export interface DoorSource {
  prop: PropId;
  to: ZoneId;
}

export interface MapSource {
  rows: readonly string[];
  legend: Readonly<Record<string, LegendEntry>>;
  /** Where the player stands on arrival: the tile in front of her door. */
  spawn: { tx: number; ty: number };
  /** Where the night's snack may turn up, one of them each night. */
  snackSpots?: readonly { tx: number; ty: number }[];
  /**
   * Where the pop-up shop may stand, by the top-left of its three-by-two footprint. Each is open
   * ground, and its door opens onto the tile below the middle of it.
   */
  popUpLots?: readonly { tx: number; ty: number }[];
  /**
   * Where the Moon Pie Man may set up his cart, by the top-left of its two-by-two footprint: open
   * ground, clear of every pop-up lot.
   */
  peddlerSpots?: readonly { tx: number; ty: number }[];
  /** Whether her neighbours live here; their schedules (`data/villagers.ts`) are in its tiles. */
  neighbours?: boolean;
  /**
   * Where a newcomer's house will stand (phase T), by the top-left of its footprint: open ground in
   * the rows until they move in. Whose it is comes from the building's inside (`owner` in
   * `data/interiors.ts`), and its door is in `doors` like any other building's.
   */
  lots?: readonly { prop: PropId; tx: number; ty: number }[];
  /** Its ways out at the edges, into the zones beside it. */
  exits?: readonly ExitSource[];
  /** Its signposts, each by the way to a place and naming it. */
  signs?: readonly SignSource[];
  /** Places in it with names, where her neighbours are to be found (`SPOTS`). */
  spots?: Readonly<Record<string, Tile>>;
  /** The buildings she goes into from here. */
  doors?: readonly DoorSource[];
  /**
   * How many monarch butterflies flutter about it by day, round its flowers and its buildings:
   * something to see, not to catch (the castle hill's, phase I).
   */
  butterflies?: number;
  /**
   * Her yard (0.3's H5): the grass round her house, by the box of tiles it is, where she puts
   * out pieces of her own (`systems/yard.ts` says which of its tiles take one).
   */
  yard?: { tx: number; ty: number; w: number; h: number };
}

/**
 * How many tiles a prop stands on. A multi-tile prop is written as a block of its letter. A
 * building's `door` is the column of its footprint its front door is over, counted from the left.
 */
export const PROP_FOOTPRINT: Record<PropId, { w: number; h: number; door?: number }> = {
  tree: { w: 1, h: 1 },
  rock: { w: 1, h: 1 },
  pumpkin: { w: 1, h: 1 },
  lantern: { w: 1, h: 1 },
  gravestone: { w: 1, h: 1 },
  fence: { w: 1, h: 1 },
  fencePost: { w: 1, h: 1 },
  roseBush: { w: 1, h: 1 },
  hosta: { w: 1, h: 1 },
  farmSign: { w: 1, h: 1 },
  // Four tiles across since 0.2's K1, so it holds the middle of the square.
  well: { w: 4, h: 2 },
  homeHouse: { w: 5, h: 4, door: 2 },
  shopHouse: { w: 5, h: 4, door: 2 },
  salonHouse: { w: 5, h: 4, door: 2 },
  // Never written in a map: it stands on one of the map's `popUpLots` on the days it's in town.
  popUpShop: { w: 3, h: 2, door: 1 },
  // Never written in a map either: it stands in the corner of her room (`data/home.ts`).
  storageChest: { w: 1, h: 1 },
  mailbox: { w: 1, h: 1 },
  bakery: { w: 6, h: 4, door: 2 },
  // Never written in a map: it stands on one of the map's `peddlerSpots` on the days he's in town.
  moonPieCart: { w: 2, h: 2 },
  // The big willow: its trunk is two tiles across, and its fronds hang well past them.
  willow: { w: 2, h: 1 },
  fountain: { w: 2, h: 2 },
  // Skelly stands on his two big feet; the rest of him towers over the yard.
  skelly: { w: 2, h: 1 },
  pottedPlant: { w: 1, h: 1 },
  // Her neighbours' houses (phase G), each after its owner.
  maudeHouse: { w: 4, h: 3, door: 2 },
  rufusHouse: { w: 5, h: 3, door: 2 },
  agathaHouse: { w: 4, h: 3, door: 1 },
  bartyHouse: { w: 4, h: 3, door: 1 },
  codyHouse: { w: 5, h: 4, door: 2 },
  // The places beyond the town (phase I).
  toadstools: { w: 1, h: 1 },
  oldTree: { w: 2, h: 2 },
  floatLantern: { w: 1, h: 1 },
  reeds: { w: 1, h: 1 },
  rowboat: { w: 2, h: 1 },
  mound: { w: 1, h: 1 },
  gatePost: { w: 1, h: 1 },
  castle: { w: 9, h: 5, door: 4 },
  weddingArch: { w: 2, h: 1 },
  // Never written in a map: it hangs across a way out with a `gate`, one tile in, while the place
  // beyond is shut, and as wide as the way.
  gate: { w: 2, h: 1 },
  // Clutter (phase L): a bench and a fallen log are two tiles long.
  bush: { w: 1, h: 1 },
  stump: { w: 1, h: 1 },
  log: { w: 2, h: 1 },
  bench: { w: 2, h: 1 },
  signpost: { w: 1, h: 1 },
  // The noticeboard by the square (phase N), where her neighbours pin their requests.
  noticeboard: { w: 2, h: 1 },
  barrel: { w: 1, h: 1 },
  hayBale: { w: 1, h: 1 },
  scarecrow: { w: 1, h: 1 },
  // A porch goose (0.2's K1): hers by her path, and Barty's by his door.
  goose: { w: 1, h: 1 },
  // The pumpkin patch on her farm (0.2's J3), a raised bed that grows through October.
  pumpkinPatch: { w: 3, h: 2 },
  // Passive Candy (phase O): the candy tree in her front yard, the honesty stall at the farm gate.
  candyTree: { w: 1, h: 1 },
  // Where a candy sapling grows into a tree of its own (0.2's E1).
  saplingPlot: { w: 1, h: 1 },
  honestyStall: { w: 2, h: 1 },
  // Newcomers' houses (phase T), never written in a map: each stands on its lot (`lots`) once its
  // owner moves in. Until then a sign stands on the lot, at its door, and on moving day their
  // boxes are stacked beside it.
  ollieHouse: { w: 4, h: 3, door: 1 },
  nessaHouse: { w: 4, h: 3, door: 1 },
  gourdonHouse: { w: 5, h: 3, door: 2 },
  hazelHouse: { w: 4, h: 3, door: 1 },
  boothovenHouse: { w: 4, h: 3, door: 1 },
  lotSign: { w: 1, h: 1 },
  soldSign: { w: 1, h: 1 },
  movingBoxes: { w: 1, h: 1 },
  // What stands in the square while a holiday's decorations are up (phase U), never written in a
  // map: `DECOR` in `data/holidays.ts` says where.
  spookyTree: { w: 1, h: 1 },
  heartArch: { w: 2, h: 1 },
  potOfGold: { w: 1, h: 1 },
  eggTree: { w: 1, h: 1 },
  flagPole: { w: 1, h: 1 },
  pumpkinTower: { w: 1, h: 1 },
  harvestTable: { w: 3, h: 1 },
  glitterBall: { w: 1, h: 1 },
  // What's set out for a happening, all its day (0.2's J3): film night's screen and popcorn.
  filmScreen: { w: 4, h: 1 },
  popcornTable: { w: 2, h: 1 },
  // And the Halloween finale's (J4): the contest's stage, the chili, her carving round the square.
  contestStage: { w: 4, h: 1 },
  chiliTable: { w: 2, h: 1 },
  catPumpkin: { w: 1, h: 1 },
  // The Hollow Fairground's (0.2's M1). Each stall is walked up to at its counter.
  fairStage: { w: 6, h: 2 },
  ringTossStall: { w: 3, h: 1 },
  cornDogStall: { w: 3, h: 1 },
  hookAGhostStall: { w: 3, h: 1 },
  toffeeAppleStall: { w: 3, h: 1 },
  // Market day's table, by the stage (0.2's M3).
  marketStall: { w: 3, h: 1 },
  fortuneTent: { w: 3, h: 2, door: 1 },
  ferrisWheel: { w: 5, h: 2 },
  lightPole: { w: 1, h: 1 },
  // Boo Acres' (0.3's F1). The greenhouse's door goes in from F2, the farmhouse's from F3.
  farmhouse: { w: 5, h: 4, door: 2 },
  barn: { w: 6, h: 4 },
  greenhouse: { w: 5, h: 3, door: 2 },
  seedCart: { w: 2, h: 1 },
  farmWell: { w: 2, h: 1 },
  appleTree: { w: 1, h: 1 },
  pearTree: { w: 1, h: 1 },
  plumTree: { w: 1, h: 1 },
  persimmonTree: { w: 1, h: 1 },
};

export const LEGEND: Record<string, LegendEntry> = {
  '#': { tile: 'hedge', solid: true },
  '.': { tile: 'grass' },
  ',': { tile: 'grass', patch: 'moonpetals' },
  ';': { tile: 'grass', patch: 'forgetMeBoos' },
  ':': { tile: 'grass', patch: 'ghostDaisies' },
  '=': { tile: 'path' },
  '~': { tile: 'water', solid: true },
  // The far bank of a pond, from before the ground drew its own banks: plain water now.
  '^': { tile: 'water', solid: true },
  '%': { tile: 'cliff', solid: true },
  '+': { tile: 'steps' },
  T: { tile: 'grass', prop: 'tree' },
  R: { tile: 'grass', prop: 'rock' },
  p: { tile: 'grass', prop: 'pumpkin' },
  L: { tile: 'grass', prop: 'lantern' },
  l: { tile: 'path', prop: 'lantern' },
  g: { tile: 'grass', prop: 'gravestone' },
  f: { tile: 'grass', prop: 'fence' },
  '|': { tile: 'grass', prop: 'fencePost' },
  W: { tile: 'path', prop: 'well' },
  H: { tile: 'grass', prop: 'homeHouse' },
  S: { tile: 'grass', prop: 'shopHouse' },
  M: { tile: 'grass', prop: 'salonHouse' },
  x: { tile: 'bed', solid: true },
  // Grass kept for the farm's extensions (0.2's N1), a row of beds each once it's built.
  '1': { tile: 'grass', plot: 1 },
  '2': { tile: 'grass', plot: 2 },
  B: { tile: 'grass', prop: 'roseBush' },
  h: { tile: 'grass', prop: 'hosta' },
  F: { tile: 'grass', prop: 'farmSign' },
  m: { tile: 'grass', prop: 'mailbox' },
  b: { tile: 'grass', prop: 'bakery' },
  Y: { tile: 'grass', prop: 'willow' },
  O: { tile: 'water', prop: 'fountain' },
  k: { tile: 'grass', prop: 'skelly' },
  u: { tile: 'grass', prop: 'pottedPlant' },
  Q: { tile: 'grass', prop: 'maudeHouse' },
  U: { tile: 'grass', prop: 'rufusHouse' },
  A: { tile: 'grass', prop: 'agathaHouse' },
  Z: { tile: 'grass', prop: 'bartyHouse' },
  C: { tile: 'grass', prop: 'codyHouse' },
  // The places beyond the town (phase I). The frozen creek is walked on, and gone along with
  // skates; the pier stands in the lake.
  '-': { tile: 'ice' },
  '"': { tile: 'boards' },
  t: { tile: 'grass', prop: 'toadstools' },
  G: { tile: 'grass', prop: 'oldTree' },
  n: { tile: 'water', prop: 'floatLantern' },
  r: { tile: 'water', prop: 'reeds' },
  w: { tile: 'water', prop: 'rowboat' },
  X: { tile: 'grass', prop: 'mound' },
  P: { tile: 'grass', prop: 'gatePost' },
  K: { tile: 'grass', prop: 'castle' },
  a: { tile: 'grass', prop: 'weddingArch' },
  e: { tile: 'grass', patch: 'milkweed' },
  // Clutter (phase L).
  v: { tile: 'grass', prop: 'bush' },
  q: { tile: 'grass', prop: 'stump' },
  o: { tile: 'grass', prop: 'log' },
  j: { tile: 'grass', prop: 'bench' },
  s: { tile: 'grass', prop: 'signpost' },
  d: { tile: 'grass', prop: 'barrel' },
  y: { tile: 'grass', prop: 'hayBale' },
  c: { tile: 'grass', prop: 'scarecrow' },
  N: { tile: 'grass', prop: 'noticeboard' },
  J: { tile: 'grass', prop: 'candyTree' },
  V: { tile: 'grass', prop: 'saplingPlot' },
  E: { tile: 'grass', prop: 'honestyStall' },
  i: { tile: 'grass', prop: 'pumpkinPatch' },
  z: { tile: 'grass', prop: 'goose' },
};

/**
 * Where things happen in the town, by name: where her neighbours stand, and where everyone gathers
 * round the well on her birthday. A schedule names a spot rather than a tile, so moving a building
 * moves one line here (decisions.md 93).
 */
export const TOWN_SPOTS = {
  // Her house and garden.
  herPath: { tx: 6, ty: 10 },
  byHerHouse: { tx: 7, ty: 10 },
  farmHostas: { tx: 12, ty: 5 },
  farmNorth: { tx: 15, ty: 1 },
  farmGate: { tx: 16, ty: 12 },
  lookout: { tx: 30, ty: 3 },
  // The square, and the shops round it.
  squareNorth: { tx: 21, ty: 19 },
  squareEast: { tx: 23, ty: 20 },
  squareWest: { tx: 16, ty: 23 },
  squareSouth: { tx: 18, ty: 25 },
  byTheWell: { tx: 21, ty: 24 },
  shopFront: { tx: 9, ty: 23 },
  shopSide: { tx: 11, ty: 21 },
  salonFront: { tx: 29, ty: 23 },
  bakeryFront: { tx: 29, ty: 30 },
  bakeryField: { tx: 37, ty: 26 },
  avenue: { tx: 21, ty: 30 },
  westMeadow: { tx: 7, ty: 28 },
  eastMeadow: { tx: 37, ty: 26 },
  // The graveyard garden.
  graveyardGate: { tx: 7, ty: 35 },
  graves: { tx: 8, ty: 40 },
  gravesWest: { tx: 3, ty: 41 },
  gravesEast: { tx: 11, ty: 43 },
  gravesSouth: { tx: 8, ty: 45 },
  // The park.
  pondWest: { tx: 19, ty: 42 },
  pondEast: { tx: 33, ty: 41 },
  willow: { tx: 20, ty: 37 },
  parkSouth: { tx: 26, ty: 47 },
  // Where the newcomers are to be found (phase T).
  postRound: { tx: 5, ty: 12 },
  byNoticeboard: { tx: 24, ty: 18 },
  southRoad: { tx: 20, ty: 35 },
  pondNorth: { tx: 29, ty: 37 },
  lookoutEast: { tx: 34, ty: 4 },
  eastRoad: { tx: 37, ty: 31 },
  pastTheBakery: { tx: 37, ty: 28 },
  squareCorner: { tx: 25, ty: 23 },
  // Boothoven's (0.2's L1): by the salon at noon, listening to the fountain at dusk.
  bySalonCorner: { tx: 27, ty: 21 },
  pondNorthEast: { tx: 31, ty: 37 },
  // Film night's seats on the avenue (0.2's J3), two rows before the screen.
  filmFrontLeft: { tx: 20, ty: 29 },
  filmFrontMiddle: { tx: 21, ty: 29 },
  filmFrontRight: { tx: 22, ty: 29 },
  filmFrontEnd: { tx: 23, ty: 29 },
  filmFrontAisle: { tx: 19, ty: 29 },
  filmFrontCorner: { tx: 18, ty: 30 },
  filmBackLeft: { tx: 19, ty: 30 },
  filmBackMiddle: { tx: 20, ty: 30 },
  filmBackRight: { tx: 21, ty: 30 },
  filmBackEnd: { tx: 22, ty: 30 },
  filmBackCorner: { tx: 23, ty: 30 },
  // Scarah's seat (0.3's F3), at the end of the back row.
  filmBackFar: { tx: 24, ty: 30 },
  // All round the well, for her birthday party.
  wellNorthWest: { tx: 18, ty: 20 },
  wellNorthEast: { tx: 21, ty: 20 },
  wellWest: { tx: 17, ty: 22 },
  wellEast: { tx: 22, ty: 22 },
  wellSouthWest: { tx: 18, ty: 23 },
  wellSouthEast: { tx: 21, ty: 23 },
  wellBackLeft: { tx: 19, ty: 20 },
  wellBackRight: { tx: 20, ty: 20 },
  wellFrontLeft: { tx: 19, ty: 23 },
  wellFrontRight: { tx: 20, ty: 23 },
  wellEastUp: { tx: 22, ty: 21 },
  wellWestUp: { tx: 17, ty: 21 },
} as const satisfies Record<string, Tile>;

/**
 * The town, re-laid as the hub (phase F), with its buildings drawn bigger in phase G. Her house is
 * top-left (H), with her potted plants (u) either side of the path to her door, her mailbox (m)
 * and Skelly (k) in the front yard, beside Hosta La Vista Farm: two rows of garden beds (x), and
 * grass kept for two more she can build (1 below them, 2 along the top, outside the fence), inside
 * a path and a fence, hostas (h) along the top, the rose bush (B) in the corner, the pumpkin patch (i)
 * below the beds and the sign (F) at the gate, with the candy tree (J) in her front yard and the honesty stall (E) outside the
 * gate. Up the cliff (%) by the steps (+) is the lookout, where Maude's library (Q) stands, and
 * the gate between two posts (P) up to the castle hill. Below the cliff, Barty's cottage (Z) and
 * Cody's manor (C) face the main road, which runs east out to Whisperwood and west to Boo Acres
 * (0.3's F1). The lantern-lit square with its
 * well is in the middle, Cobweb Corner (S) to the west, the Muse Hair Salon (M) to the east and
 * Crumbs & Curios (b), Wrapunzel's bakery with her museum beside it, below that. Rufus's cottage
 * (U) and Agatha's (A) are in the west meadow. The graveyard garden is bottom-left, and the park
 * bottom-right, round the pond with its fountain (O) lit at night and the big willow (Y) on its
 * bank (personal_touches.md, "After phase E"), and past the park, at the bottom of the road down
 * its east side, a gate between two posts (P) to the Hollow Fairground (0.2's M1). Wildflowers grow in patches (`,` moonpetals, `;`
 * blue forget-me-boos by her house, `:` ghost daisies in the graveyard), and rocks (R) sit about
 * the edges.
 */
export const TOWN: MapSource = {
  legend: LEGEND,
  neighbours: true,
  spawn: { tx: 4, ty: 9 },
  spots: TOWN_SPOTS,
  // Her yard (0.3's H5): round her house, from the hedge to the farm's fence and the road.
  yard: { tx: 1, ty: 1, w: 8, h: 13 },
  // The main road runs east out of town into Whisperwood and west to Boo Acres, the lookout's gate
  // up to the castle and the park's down to the fairground; every building's door goes in.
  exits: [
    { to: 'whisperwood', tx: 39, ty: 14, h: 2 },
    { to: 'booAcres', tx: 0, ty: 14, h: 2 },
    { to: 'castleHill', tx: 28, ty: 0, w: 2, gate: true },
    { to: 'fairground', tx: 34, ty: 49, w: 2, gate: true },
  ],
  signs: [
    { tx: 38, ty: 13, to: 'whisperwood' },
    { tx: 30, ty: 2, to: 'castleHill' },
    { tx: 37, ty: 47, to: 'fairground' },
    { tx: 1, ty: 16, to: 'booAcres' },
  ],
  doors: [
    { prop: 'homeHouse', to: 'home' },
    { prop: 'shopHouse', to: 'cobwebCorner' },
    { prop: 'salonHouse', to: 'muse' },
    { prop: 'bakery', to: 'crumbs' },
    { prop: 'maudeHouse', to: 'library' },
    { prop: 'rufusHouse', to: 'rufusCabin' },
    { prop: 'agathaHouse', to: 'agathaCottage' },
    { prop: 'bartyHouse', to: 'bartyCottage' },
    { prop: 'codyHouse', to: 'codyManor' },
    { prop: 'ollieHouse', to: 'ollieCottage' },
    { prop: 'gourdonHouse', to: 'gourdonPumpkin' },
    { prop: 'boothovenHouse', to: 'boothovenParlour' },
  ],
  // Ollie's, below Agatha's in the west meadow, Gourdon's pumpkin past the bakery, and
  // Boothoven's east of the square, beside the salon.
  lots: [
    { prop: 'ollieHouse', tx: 13, ty: 30 },
    { prop: 'gourdonHouse', tx: 31, ty: 30 },
    { prop: 'boothovenHouse', tx: 35, ty: 21 },
  ],
  // Beside her door, at the top of the square, below the well, and by the willow.
  snackSpots: [
    { tx: 2, ty: 9 },
    { tx: 19, ty: 17 },
    { tx: 22, ty: 25 },
    { tx: 24, ty: 37 },
  ],
  // The west meadow, the corner of the square, by the south road, the meadow below the lookout,
  // along the south road, and past the pond.
  popUpLots: [
    { tx: 16, ty: 28 },
    { tx: 15, ty: 19 },
    { tx: 5, ty: 30 },
    { tx: 35, ty: 35 },
    { tx: 23, ty: 31 },
    { tx: 36, ty: 42 },
  ],
  // West of the square, in the field by the bakery, the south meadow, and out east.
  peddlerSpots: [
    { tx: 10, ty: 17 },
    { tx: 27, ty: 31 },
    { tx: 9, ty: 31 },
    { tx: 37, ty: 17 },
  ],
  rows: [
    '############################==##########',
    '###...................%####P==P.....%###',
    '##.T.......22222222..T%QQQQ.==s,....%###',
    '#........ffffffffffff.%QQQQ.==...T..%T.#',
    '#........|hhhhhhhhhB|.%QQQQ.==..R...%..#',
    '#.HHHHH..|==========|.%..=====......%..#',
    '#.HHHHH..|=xxxxxxxx=|.%%%%%%++%%%%%%%..#',
    '#.HHHHH..|=xxxxxxxx=|.%%%%%%++%%%%%%%.T#',
    '#.HHHHH..|==========|.......==.CCCCC...#',
    '#..u=umkk|iii111111.|.ZZZZ..==.CCCCC...#',
    '#.;p=z..y|iiic......|.ZZZZ..==.CCCCC.R.#',
    '#;V.=.;J.ffffF==fffff.ZZZZ..==.CCCCC...#',
    '#.;.=....V..EE==......:=z...==...=.....#',
    '#..L=...p..L..==..p...L=..p.==...=.L..s#',
    '========================================',
    '========================================',
    '#s.................==..................#',
    '#vT..........p.....==..NN.pjj..........#',
    '#....SSSSS....l==========l....MMMMM....#',
    '#...dSSSSS....============....MMMMM....#',
    '#...dSSSSS..T.============....MMMMM...T#',
    '#.:..SSSSS....====WWWW====....MMMMM....#',
    '#......===========WWWW===========......#',
    '#.............============.............#',
    '#............T============.R...........#',
    '#.UUUUU....,..============....bbbbbb.d.#',
    '#.UUUUU...;...l==========l....bbbbbb...#',
    '#.UUUUU..AAAAp.....==.....=..dbbbbbb.,.#',
    '#...=....AAAA......==.....=...bbbbbb,..#',
    '#.R.=....AAAA......==...T.=======....T.#',
    '#...=.....=........==..................#',
    '#T..=.....=......L.==.L...............v#',
    '#...=.....=........==..................#',
    '#T..=================================..#',
    '#.q.=================================..#',
    '#......==.v.v......==..................#',
    '#......==........==================....#',
    '#.fffff==fffff...=.........,.....L=....#',
    '#.|..........|...=YY..~~~~~~~.....=.T..#',
    '#.|.g.g...g..|.q.=...~~~~~~~~~~...=....#',
    '#.|.........p|.T.=..~~~~~~~~~~~~..=....#',
    '#.|...::::...|...=..~~~~~OO~~~~~..=R.v.#',
    '#.|.g.::::.g.|...=..~~~~~OO~~~~~..=....#',
    '#.|.....:....|...=..~~~~~~~~~~~~..=....#',
    '#.|p..g...g.p|.T.=...~~~~~~~~~~~;.=....#',
    '#.|..........|...=....~~~~~~~~~...=....#',
    '#.ffffffffffff...=..jj..~~~~~jj...=..T.#',
    '##....v.......T..=L...,..........L==.s##',
    '###..............================P==P###',
    '##################################==####',
  ],
};

/**
 * Whisperwood (phase I): old trees close together, some very old indeed, with sleepy faces (G);
 * toadstools (t) in clumps; a path winding in from the town's east road, north to the herb glade
 * and south to the frozen creek (-), which she skates down to Lantern Shore, with four beds (x) in
 * the shade beside it. From the herb glade a
 * path lined with toadstools leads east and up to a gap in the thicket at the top, two tiles wide
 * and marked by a lantern (0.2's C1): the hidden way to the clearing, which isn't on her map until
 * she finds it.
 */
export const WHISPERWOOD_SPOTS = {
  // Where Rufus picks wildflowers in the morning, and Agatha gathers herbs by moonlight.
  wildflowers: { tx: 5, ty: 6 },
  herbs: { tx: 12, ty: 7 },
  creekside: { tx: 16, ty: 28 },
  starGlade: { tx: 9, ty: 6 },
} as const satisfies Record<string, Tile>;

export const WHISPERWOOD: MapSource = {
  legend: LEGEND,
  spots: WHISPERWOOD_SPOTS,
  spawn: { tx: 1, ty: 17 },
  exits: [
    { to: 'town', tx: 0, ty: 17, h: 2 },
    { to: 'lanternShore', tx: 17, ty: 37, w: 2 },
    { to: 'hiddenClearing', tx: 21, ty: 0, w: 2 },
  ],
  // By the way in from town, and at the crossroads: up to the clearing, and down to the creek.
  signs: [
    { tx: 2, ty: 16, to: 'town' },
    { tx: 12, ty: 16, to: 'hiddenClearing' },
    { tx: 12, ty: 19, to: 'lanternShore' },
  ],
  doors: [{ prop: 'hazelHouse', to: 'hazelObservatory' }],
  // Hazel's observatory, in the glade at the top of the woods where the trees open to the sky.
  lots: [{ prop: 'hazelHouse', tx: 5, ty: 2 }],
  rows: [
    '#####################==###',
    '####################L==###',
    '#TT.........T..TT..##==#T#',
    '#TGG......T..T.TTT...==.T#',
    '#.GG.....R...........==tT#',
    '#.T.....:..============..#',
    '#.T....,...=..t.t.t.t....#',
    '#...T......=.......v.....#',
    '#TTT.......=............T#',
    '#T..T.t....=.....TTT..TtT#',
    '#T......T..=....TTT.TTTTT#',
    '#TTGGTT..T.=........TTTT.#',
    '#..GGTTT.T.=..GG,..RT..T.#',
    '#T....TtT..=..GG......TT.#',
    '#.......TT.=...t....TTGG.#',
    '#....TTTTT.=..........GG.#',
    '#.s...q....=s.T.....T.T..#',
    '============.....TTT..T..#',
    '============....TT.......#',
    '#.........==sTTTT.TTT.T..#',
    '#..oo.....==......T.TT.T.#',
    '#..;;.....==..T...t.TT...#',
    '#.....v,..==.............#',
    '#....GG...==.T...TT.TTT..#',
    '#....GG...==.T.........v.#',
    '#T.t......==...T.--------#',
    '#.T...T...==.TTT.--------#',
    '#.T..TT...==.T...--......#',
    '#.TTT.TT..==xxxx.--..X...#',
    '#..TT..T..=======--......#',
    '#..T..TT..=======--.....T#',
    '#T..q............--.....T#',
    '#T.;.....TTT..T..--...T..#',
    '#...........GG...--.ooT.T#',
    '#T..R...t.TTGG...--.TTT.T#',
    '#........T...T.T.--.TTT..#',
    '#T.TTTTTTTT......--..TT.T#',
    '#################--#######',
  ],
};

/**
 * Lantern Shore (phase I): the frozen creek comes down from Whisperwood into a still lake, with
 * lamps along the shore, reeds in the shallows (r), lanterns afloat on
 * lily pads that light up after dark (n), and a pier (") out into the middle with a rowboat (w)
 * tied beside it. A path runs along the south shore from its foot, and below is a meadow. Four
 * beds (x) stand up the west bank, beside the way round the lake rather than across it, with a
 * lamp at their corner (0.3's F0, decision 240).
 */
export const LANTERN_SHORE_SPOTS = {
  pierEnd: { tx: 12, ty: 14 },
  shoreWest: { tx: 2, ty: 13 },
  meadow: { tx: 9, ty: 29 },
  shoreEast: { tx: 23, ty: 12 },
  lakeSouth: { tx: 17, ty: 23 },
  pierMiddle: { tx: 12, ty: 19 },
} as const satisfies Record<string, Tile>;

export const LANTERN_SHORE: MapSource = {
  legend: LEGEND,
  spots: LANTERN_SHORE_SPOTS,
  spawn: { tx: 14, ty: 6 },
  exits: [{ to: 'whisperwood', tx: 12, ty: 0, w: 2 }],
  signs: [{ tx: 14, ty: 2, to: 'whisperwood' }],
  doors: [{ prop: 'nessaHouse', to: 'nessaBoathouse' }],
  // Nessa's boathouse, down on the east bank at the water's edge (0.2's K1), the lake lapping
  // at its side and a little jetty out from its step.
  lots: [{ prop: 'nessaHouse', tx: 20, ty: 7 }],
  rows: [
    '############--############',
    '#T....TT.TT.--......T....#',
    '#.T..TT.....--s.......TTT#',
    '#.R.T.......--......T....#',
    '#.T..TT..T..--..TT..T.T..#',
    '#.......L...--...L.......#',
    '#.....jj....--...........#',
    '#...........--...........#',
    '#.......~~~~--~~r........#',
    '#..L..~~~~~~~~~~~~~~.....#',
    '#....~~~~~~~~~~~~n"".....#',
    '#....~~~n~~~~~~~~~~~..L..#',
    '#...~r~~~~~~~~~~~~~~~....#',
    '#...~~~~~~~~""~~~~~~~..,.#',
    '#..~~~~~~~~~""~~~~~~~~...#',
    '#..~~~~~~~n~""ww~~~~~~...#',
    '#;.~~~~~~~~~""~~~~~~r~...#',
    '#...~~~~~~~~""~~~~~~~....#',
    '#...~~~n~~~~""~~~~~~~....#',
    '#xx..~~~~~~~""~~~~n~.....#',
    '#xx..~~~~~~~""~~~~~r.....#',
    '#..L..r~~~~~""~~~~~......#',
    '#.......~~~~""~~~....L...#',
    '#...........""....jj.....#',
    '#....================....#',
    '#...........==...........#',
    '#.v.........==...........#',
    '#...........==.........TT#',
    '#.TT.================...T#',
    '#T.T..oo.....q.......v...#',
    '#..,.......TT...T..T..T..#',
    '#...,TT..T..T.,..T.;T..TT#',
    '#.TT..TR....T....TT.;..TT#',
    '#....TT.T.:...TT.........#',
    '#..T.TT.T.T......T.TT.R..#',
    '#..T....T..T....T..TTT...#',
    '#.TTTTT..T.TT....TTT...TT#',
    '##########################',
  ],
};

/**
 * The hidden clearing (phase I), up the hidden way from Whisperwood: a ring of toadstools in the
 * moonlight round a mound where something is buried (X), a little pool, and wildflowers, with a
 * worn path down to the way back.
 */
export const HIDDEN_CLEARING: MapSource = {
  legend: LEGEND,
  spawn: { tx: 9, ty: 21 },
  exits: [{ to: 'whisperwood', tx: 9, ty: 23, w: 2 }],
  signs: [{ tx: 8, ty: 22, to: 'whisperwood' }],
  rows: [
    '#########==#######',
    '#TTTTTTTT..TTTTTT#',
    '#TTTTTTTT.TTTTTTT#',
    '#TTGGTT....TTTTTT#',
    '#.TGG...v...~~~TT#',
    '#.T..,.....~~~~.T#',
    '#.T.,.......~~...#',
    '#.T............TT#',
    '#..........,...TT#',
    '#TT....t.t......T#',
    '#.....t...t......#',
    '#T......X......TT#',
    '#TT...t...t......#',
    '#T..;....t.....TT#',
    '#..q..oo.........#',
    '#TT.........:...T#',
    '#TT.,........:...#',
    '#T.............TT#',
    '#........==......#',
    '#TT..TT..==.T...T#',
    '#TT.T.T..==.TT.TT#',
    '#...T.TT.==LTT.TT#',
    '#TT.....s==..T...#',
    '#########==#######',
  ],
};

/**
 * The castle hill (phase I), up through the gate at the town's lookout (P, the posts): a meadow,
 * a cliff with steps up it, then the castle garden, beds of milkweed (e) for the monarchs and
 * rose bushes, hedged, with the wedding arch (a) in a nook, and Castle Mac-A-Boo (K) at the top,
 * whose doors go into its hall (phase U).
 */
export const CASTLE_HILL: MapSource = {
  legend: LEGEND,
  spawn: { tx: 13, ty: 9 },
  exits: [{ to: 'town', tx: 13, ty: 41, w: 2, gate: true }],
  signs: [{ tx: 15, ty: 31, to: 'town' }],
  // The castle's great doors (phase U), into the hall, locked till she has the heart key.
  doors: [{ prop: 'castle', to: 'castleHall' }],
  butterflies: 14,
  rows: [
    '############################',
    '#..........................#',
    '#.T.T..................T.T.#',
    '#.T.T.................TT.TT#',
    '#..T.....KKKKKKKKK.....T...#',
    '#.T.TT...KKKKKKKKK....TT.T.#',
    '#TT..T...KKKKKKKKK......T..#',
    '#..T.....KKKKKKKKK.....TTT.#',
    '#T...T...KKKKKKKKK.......T.#',
    '#..T.T.......==.......T..T.#',
    '#.T.........L==L.........TT#',
    '#TT..........==.....aa.....#',
    '#TT.BeeeeeeB.==.eee.=......#',
    '#.T..eeeeee..==.eee.=......#',
    '#....eeeeee..==.eee.=....T.#',
    '#T......jj...==.....=.....T#',
    '#...p==================p...#',
    '#T...........==..........T.#',
    '#T..BeeeeeeB.==.eeeeeeB....#',
    '#....eeeeee..==.eeeeee.....#',
    '#.T..eeeeee..==.eeeeee....T#',
    '#............==..jj........#',
    '#.T..######..==.######...TT#',
    '#.....v......==......v.....#',
    '#...........L==L...........#',
    '#............==..........T.#',
    '#.......p....==....p.....T.#',
    '#............==..........T.#',
    '#T.....T.....==........T...#',
    '#%%%%%%%%%%%%++%%%%%%%%%%%%#',
    '#%%%%%%%%%%%%++%%%%%%%%%%%%#',
    '#T..T........==s.....TT....#',
    '#..RTTTTTT...==...T....T.T.#',
    '#T.T..T.,...L==L..T..:....T#',
    '#...,...TT...==.....T....TT#',
    '#.....T......==...T..T,T..T#',
    '#..T.T..TTq..==...T.T.....T#',
    '#.T.TT;......==....TT......#',
    '#.......oo..L==L..TT.T..RT.#',
    '#.T...TT.....==...TT...T...#',
    '#.T.T...TT..P==P...T..T..T.#',
    '#############==#############',
  ],
};

/**
 * The Hollow Fairground (0.2's M1), through the gate at the town's south-east, beyond the graveyard
 * and the park. The way in comes down from the gate (P, the posts) on the west to the midway: an
 * avenue all round, lit by poles with string lights between them (!), with a ring of stalls facing
 * in (3 ring toss, 4 corn dogs, 5 hook-a-ghost, 6 toffee apples) and an aisle down the middle. The
 * stage (D) is at the top, with a square before it for an audience, and the fortune teller's tent
 * (I) beside it, whose flap goes in. Below the midway is a meadow with the big wheel (7) and a
 * pumpkin field.
 */
export const FAIR_LEGEND: Record<string, LegendEntry> = {
  ...LEGEND,
  D: { tile: 'grass', prop: 'fairStage' },
  I: { tile: 'grass', prop: 'fortuneTent' },
  '3': { tile: 'grass', prop: 'ringTossStall' },
  '4': { tile: 'grass', prop: 'cornDogStall' },
  '5': { tile: 'grass', prop: 'hookAGhostStall' },
  '6': { tile: 'grass', prop: 'toffeeAppleStall' },
  '7': { tile: 'grass', prop: 'ferrisWheel' },
  '8': { tile: 'grass', prop: 'marketStall' },
  '!': { tile: 'grass', prop: 'lightPole' },
};

/**
 * Where things are at the fairground, by name: before the stage, at each stall's counter (M2's
 * games are played there), by the tent's flap and the big wheel, and about the midway.
 */
export const FAIRGROUND_SPOTS = {
  stageFront: { tx: 14, ty: 6 },
  stageLeft: { tx: 11, ty: 7 },
  stageRight: { tx: 18, ty: 7 },
  ringToss: { tx: 7, ty: 12 },
  cornDogs: { tx: 22, ty: 12 },
  hookAGhost: { tx: 7, ty: 17 },
  toffeeApples: { tx: 22, ty: 17 },
  tentFlap: { tx: 25, ty: 7 },
  bigWheel: { tx: 5, ty: 27 },
  midway: { tx: 15, ty: 15 },
  pumpkinField: { tx: 21, ty: 27 },
  // Market day's stall, at its counter (0.2's M3).
  market: { tx: 7, ty: 5 },
  // The costume contest's line-up, along the front of the stage (0.2's M3).
  lineUp1: { tx: 10, ty: 6 },
  lineUp2: { tx: 11, ty: 6 },
  lineUp3: { tx: 12, ty: 6 },
  lineUp4: { tx: 13, ty: 6 },
  lineUp5: { tx: 14, ty: 6 },
  lineUp6: { tx: 15, ty: 6 },
  lineUp7: { tx: 16, ty: 6 },
  lineUp8: { tx: 17, ty: 6 },
  lineUp9: { tx: 18, ty: 6 },
  lineUp10: { tx: 19, ty: 6 },
  lineUp11: { tx: 20, ty: 6 },
  // The town's gatherings before the stage, a place each (`STAGE_SPOTS`).
  crowdFront: { tx: 14, ty: 7 },
  crowdFrontLeft: { tx: 13, ty: 7 },
  crowdFrontRight: { tx: 16, ty: 7 },
  crowdMiddleLeft: { tx: 12, ty: 8 },
  crowdMiddleRight: { tx: 17, ty: 8 },
  crowdMiddle: { tx: 15, ty: 8 },
  crowdBackLeft: { tx: 10, ty: 9 },
  crowdBackRight: { tx: 19, ty: 9 },
  crowdBack: { tx: 14, ty: 9 },
  crowdBackMiddle: { tx: 16, ty: 9 },
} as const satisfies Record<string, Tile>;

export const FAIRGROUND: MapSource = {
  legend: FAIR_LEGEND,
  spots: FAIRGROUND_SPOTS,
  spawn: { tx: 4, ty: 4 },
  exits: [{ to: 'town', tx: 3, ty: 0, w: 2, gate: true }],
  signs: [{ tx: 5, ty: 2, to: 'town' }],
  doors: [{ prop: 'fortuneTent', to: 'fortuneTent' }],
  rows: [
    '###==#########################',
    '#TP==P...............T.......#',
    '#T.==s..............,......T.#',
    '#..==..,....DDDDDD...........#',
    '#..==.888...DDDDDD.....III...#',
    '#..==...y.==========p..III...#',
    '#.L==.....==========....=..L.#',
    '#..==.!..!==========.!..!....#',
    '#..========================..#',
    '#..========================..#',
    '#..==.........==.........==.T#',
    '#..==.333...,.==.p...444.==..#',
    '#T.==.........==.........==,.#',
    '#..==.....jj..==..jj.....==..#',
    '#..==..,,.....==....d....==..#',
    '#,.==.........==.........==.T#',
    '#..==.555.....==.....666.==..#',
    '#..==.........==.........==..#',
    '#T.==......y..==..d......==v.#',
    '#..==....y....==.....,,..==..#',
    '#..==.........==.........==.T#',
    '#..==!..!..!..==..!..!..!==..#',
    '#.v========================..#',
    '#..========================..#',
    '#....=...L..oo.=....L.....T..#',
    '#T...=.........=.............#',
    '#....=....,,...=....p...p....#',
    '#....=..T...,..=..p..........#',
    '#..77777.......=......p...p..#',
    '#..77777....L..====p.........#',
    '#....................p.p.....#',
    '#T........T......,.........T.#',
    '#............T..........q....#',
    '##############################',
  ],
};

/**
 * Boo Acres (0.3's F1, decision 241), down the main road west of town: the road comes in from
 * the east past the seed cart (6) to the farmyard, where Scarah's farmhouse (I) and the barn (D)
 * stand round the well (7), with hay (y) and barrels by the barn. The orchard is up to the
 * north-east, four kinds of fruit tree in rows (@ apples, $ pears, & plums, * persimmons). South
 * of the road, through a gate in the fence, are the fields: four long rows of beds (x) with paths
 * between, grass kept for two more rows (3, 4) she can build, and a scarecrow (c). The pond is
 * to the west, with reeds (r), and the greenhouse (5) to the east, its door at the end of a path.
 */
export const FARM_LEGEND: Record<string, LegendEntry> = {
  ...LEGEND,
  I: { tile: 'grass', prop: 'farmhouse' },
  D: { tile: 'grass', prop: 'barn' },
  '5': { tile: 'grass', prop: 'greenhouse' },
  '6': { tile: 'grass', prop: 'seedCart' },
  '7': { tile: 'grass', prop: 'farmWell' },
  '@': { tile: 'grass', prop: 'appleTree' },
  $: { tile: 'grass', prop: 'pearTree' },
  '&': { tile: 'grass', prop: 'plumTree' },
  '*': { tile: 'grass', prop: 'persimmonTree' },
  // The farm's extension rows go on from the town's two (0.2's N1): the third and fourth.
  '3': { tile: 'grass', plot: 3 },
  '4': { tile: 'grass', plot: 4 },
};

/** Where her neighbours are to be found at Boo Acres, Scarah most of all (F3). */
export const BOO_ACRES_SPOTS = {
  fields: { tx: 18, ty: 23 },
  orchard: { tx: 25, ty: 8 },
  pondBank: { tx: 6, ty: 23 },
  seedCart: { tx: 28, ty: 13 },
  porch: { tx: 4, ty: 8 },
  barnDoors: { tx: 15, ty: 8 },
  byTheWell: { tx: 10, ty: 9 },
  greenhouseDoor: { tx: 27, ty: 21 },
} as const satisfies Record<string, Tile>;

export const BOO_ACRES: MapSource = {
  legend: FARM_LEGEND,
  spots: BOO_ACRES_SPOTS,
  spawn: { tx: 32, ty: 14 },
  exits: [{ to: 'town', tx: 33, ty: 14, h: 2 }],
  signs: [{ tx: 32, ty: 13, to: 'town' }],
  // The greenhouse's glass door (0.3's F2), and Scarah's at the farmhouse (F3).
  doors: [
    { prop: 'greenhouse', to: 'greenhouse' },
    { prop: 'farmhouse', to: 'scarahFarmhouse' },
  ],
  rows: [
    '##################################',
    '#T.....T...........v..,..........#',
    '#...............................T#',
    '#..IIIII...DDDDDD....@..$..&..*..#',
    '#..IIIII...DDDDDD...........,....#',
    '#T.IIIII..dDDDDDDy...............#',
    '#..IIIII..dDDDDDDyy..*..@..$..&..#',
    '#....=.......==..................#',
    '#....=..77...==..................#',
    '#...,=.......==......&..*..@..$..#',
    '#....==========................v.#',
    '#T...=...y...==...........,......#',
    '#....=.......==............66....#',
    '#.,..=..L....==....L............s#',
    '#..===============================',
    '#..===============================',
    '#.........L..==.......=........L.#',
    '#.v.....fffff==fffff..=.55555....#',
    '#.....,.f==========f..=.55555....#',
    '#.......f.xxxxxx.y.f..=.55555..,.#',
    '#..~~~..f.xxxxxx...f..=====......#',
    '#.~~~r..f==========f.............#',
    '#.~~~~..f.xxxxxx.c.f....,.......T#',
    '#.r~~~..f.xxxxxx...fv....oo......#',
    '#.~~~~..f==========f.........T...#',
    '#..~r...f.333333...f.p.....p.....#',
    '#.......f.444444.d.f...q......p..#',
    '#.......f==========f........jj..T#',
    '#..;.;..ffffffffffff....p........#',
    '#.T..................T...T....,..#',
    '#.....Tv..jj,..,.;...............#',
    '##################################',
  ],
};

/** Every place's named spots, so a schedule can only name a spot in the place it's in. */
export const SPOTS = {
  town: TOWN_SPOTS,
  whisperwood: WHISPERWOOD_SPOTS,
  lanternShore: LANTERN_SHORE_SPOTS,
  castleHill: {},
  hiddenClearing: {},
  fairground: FAIRGROUND_SPOTS,
  booAcres: BOO_ACRES_SPOTS,
} as const satisfies Record<MapZoneId, Readonly<Record<string, Tile>>>;

/** The names of the spots in a place. */
export type SpotName<Z extends MapZoneId> = keyof (typeof SPOTS)[Z] & string;

/** The tile in front of a building's front door, where she stands to go in and comes back out. */
export function doorStep(prop: { id: PropId; tx: number; ty: number; h: number }): Tile {
  const door = PROP_FOOTPRINT[prop.id].door ?? 0;
  return { tx: prop.tx + door, ty: prop.ty + prop.h };
}

/** Where a named spot is. */
export function spotOf<Z extends MapZoneId>(zone: Z, name: SpotName<Z>): Tile {
  return spotIn(zone, name);
}

/** `spotOf` for a name already checked against its place, as a `Stop`'s is by its type. */
export function spotIn(zone: MapZoneId, name: string): Tile {
  const spot = (SPOTS[zone] as Readonly<Record<string, Tile>>)[name];
  if (!spot) throw new Error(`no spot '${name}' in ${zone}`);
  return spot;
}
