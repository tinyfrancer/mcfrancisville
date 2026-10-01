import { HOLIDAY_PROP_ART } from './holidays';
import type { MapZoneId, PropId } from '../types/ids';
import { formOf, variantOf } from './terrain';
import { FARM_SIGN, FARM_SIGN_PALETTE, HOSTA, HOSTA_LEAVES } from './garden';
import {
  ACCENT,
  ACCENT_TWO,
  buildingPalette,
  darkOf,
  fillOf,
  finish,
  lightOf,
  ROOF,
  STONE,
  WINDOWS_LIT,
} from './buildings';
import { bevelIn, slab } from './furnish';

export { MAILBOX_FULL } from './townProps';
import {
  FENCE,
  FENCE_JOINS,
  FENCE_PALETTE,
  FENCE_POST,
  GRAVESTONE_FORMS,
  GRAVESTONE_VARIANTS,
  LAMP_PALETTE,
  LAMP_POST,
  MAILBOX,
  MAILBOX_PALETTE,
  PUMPKIN_FORMS,
  PUMPKIN_LIT,
  PUMPKIN_PALETTE,
  WELL,
  WELL_PALETTE,
} from './townProps';
import { Sketch } from './sketch';
import { GOOSE_ART } from './geese';

/** Agatha's brew, which glows a little after dark. */
const CAULDRON = fillOf(ACCENT);
import {
  CART,
  CART_PALETTE,
  COBWEB_CORNER,
  COBWEB_CORNER_PALETTE,
  CRUMBS_AND_CURIOS,
  CRUMBS_AND_CURIOS_PALETTE,
  MUSE,
  MUSE_PALETTE,
  POP_UP,
  POP_UP_LIT,
  POP_UP_PALETTE,
} from './shops';
import {
  AGATHA_HOUSE,
  AGATHA_HOUSE_PALETTE,
  BARTY_HOUSE,
  BARTY_HOUSE_PALETTE,
  CODY_HOUSE,
  CODY_HOUSE_PALETTE,
  MAUDE_HOUSE,
  MAUDE_HOUSE_PALETTE,
  RUFUS_HOUSE,
  RUFUS_HOUSE_PALETTE,
} from './neighbourHouses';
import { HER_HOUSE, HER_HOUSE_PALETTE, POT_ART, SKELLY, SKELLY_PALETTE } from './houses';
import { FOUNTAIN, FOUNTAIN_GLOW, FOUNTAIN_PALETTE } from './park';
import { CASTLE, CASTLE_PALETTE, WEDDING_ARCH, WEDDING_ARCH_PALETTE } from './castle';
import {
  DUG,
  FLOAT_LANTERN,
  GATE_PALETTE,
  GATE_SHUT,
  FLOAT_LANTERN_GLOW,
  FLOAT_LANTERN_PALETTE,
  GATE_POST,
  GATE_POST_PALETTE,
  MOUND,
  MOUND_GLOW,
  MOUND_PALETTE,
  REEDS,
  REEDS_PALETTE,
  ROWBOAT,
  ROWBOAT_PALETTE,
  TOADSTOOL_GLOW,
  TOADSTOOL_STUBS,
  TOADSTOOL_VARIANTS,
  TOADSTOOLS_ART,
} from './wilds';
import {
  OLD_TREE,
  OLD_TREE_LEAVES,
  PEBBLES,
  ROCK,
  ROCK_PALETTE,
  BUSH_FORMS,
  BUSH_LEAVES,
  ROSE_BUSH,
  ROSE_BUSH_BARE,
  ROSE_BUSH_PALETTE,
  TREE,
  TREE_FORMS,
  TREE_LEAVES,
  WILLOW,
  WILLOW_PALETTE,
} from './nature';
import { PALETTE as C } from './palette';
import {
  BARREL_FORMS,
  BENCH,
  NOTICEBOARD,
  CLUTTER_PALETTE,
  HAY_BALE,
  LOG,
  SCARECROW,
  SCARECROW_PALETTE,
  SIGNPOST,
  signpostTo,
  STUMP,
} from './clutter';
import type { Palette, SpriteSource } from './sprite';
import { CANDY_TREE, CANDY_TREE_PALETTE, SAPLING_PALETTE, SAPLING_PLOT } from './nature';
import { PUMPKIN_PATCH_ART, PUMPKIN_PATCH_PALETTE } from './pumpkinPatch';
import { FILM_PALETTE, FILM_SCREEN, POPCORN_TABLE, POPCORN_TABLE_PALETTE } from './filmNight';
import {
  CAT_PUMPKIN_ART,
  CHILI_TABLE,
  CHILI_TABLE_PALETTE,
  CONTEST_STAGE,
  CONTEST_STAGE_PALETTE,
} from './finale';
import { HONESTY_STALL, HONESTY_STALL_PALETTE } from './clutter';
import { BOOTHOVEN_HOUSE, BOOTHOVEN_HOUSE_PALETTE } from './boothoven';
import {
  CORN_DOG_PALETTE,
  CORN_DOG_STALL,
  FAIR_STAGE,
  FAIR_STAGE_PALETTE,
  FERRIS_WHEEL,
  FERRIS_WHEEL_PALETTE,
  FORTUNE_TENT,
  FORTUNE_TENT_PALETTE,
  HOOK_A_GHOST_PALETTE,
  HOOK_A_GHOST_STALL,
  LIGHT_POLE,
  LIGHT_POLE_LIT,
  LIGHT_POLE_PALETTE,
  RING_TOSS_PALETTE,
  RING_TOSS_STALL,
  STALL_LIT,
  TOFFEE_APPLE_PALETTE,
  TOFFEE_APPLE_STALL,
  MARKET_PALETTE,
  MARKET_STALL,
} from './fairground';
import {
  GOURDON_GLOW,
  GOURDON_HOUSE,
  GOURDON_HOUSE_PALETTE,
  HAZEL_HOUSE,
  HAZEL_HOUSE_PALETTE,
  LOT_PALETTE,
  LOT_SIGN,
  MOVING_BOXES,
  NESSA_HOUSE,
  NESSA_HOUSE_PALETTE,
  OLLIE_HOUSE,
  OLLIE_HOUSE_PALETTE,
  SOLD_SIGN,
} from './newcomerHouses';

/** A pool of lamplight after dusk, in the sprite's own pixels. */
export interface PropLight {
  x: number;
  y: number;
  radius: number;
}

export interface PropArt {
  source: SpriteSource;
  /** How it looks by day, lamps out. */
  palette: Palette;
  /**
   * The keys that light up after dusk, in their lit colours. They are baked as a layer of their
   * own and drawn over the night, so a lit window stays bright however dark the town gets.
   */
  glow?: Palette;
  lights?: readonly PropLight[];
  /** The soft shadow it stands in, centred under its base, in the grid's own pixels. */
  shadow: { w: number; h: number; dy?: number };
  /** How it looks once it has given what it gives for the day, if that shows. */
  spent?: SpriteSource;
  /** Other colourings, one picked for each by where it stands, so a row of them isn't a copy. */
  variants?: readonly Palette[];
  /** Where its front door is, frame and all, in its own pixels: a building's. */
  door?: { x: number; y: number; w: number; h: number };
  /** Other shapes, `source` first, one picked for each by where it stands, as `variants` are. */
  forms?: readonly SpriteSource[];
  /** The tops of its chimneys, in its own pixels, where smoke curls up from (phase L). */
  smoke?: readonly { x: number; y: number }[];
  /** A shape for each way it can join its own kind (`joins`, a fence's), by that mask. */
  joined?: readonly SpriteSource[];
  /** A building with no roof to string lights under (Gourdon's pumpkin), for `eaveLights`. */
  noEaves?: true;
}

/** Her storage chest: a plum trunk with iron bands and a little bat on the latch. */
/**
 * Her storage chest (phase J): a plum trunk with a rounded lid, iron bands and corners, and a
 * brass lock with a little bat on it.
 */
const STORAGE_CHEST = (() => {
  const s = new Sketch(32, 30);
  s.ellipse(16, 8, 14, 5, fillOf(ROOF)).rect(2, 8, 28, 5, fillOf(ROOF));
  bevelIn(s, 0, 0, 32, 13, ROOF);
  s.rect(2, 12, 28, 1, darkOf(ROOF));
  slab(s, 2, 13, 28, 16, ROOF);
  for (const x of [6, 24]) s.rect(x, 4, 3, 25, fillOf(STONE)).rect(x, 4, 1, 25, lightOf(STONE));
  s.rect(2, 26, 28, 3, fillOf(STONE)).rect(2, 26, 28, 1, lightOf(STONE));
  slab(s, 13, 11, 7, 7, ACCENT_TWO);
  s.rect(16, 14, 1, 2, darkOf(ACCENT_TWO))
    .set(15, 13, darkOf(ACCENT_TWO))
    .set(17, 13, darkOf(ACCENT_TWO));
  return finish(s);
})();

export const PROP_ART: Record<PropId, PropArt> = {
  ...HOLIDAY_PROP_ART,
  tree: {
    source: TREE,
    palette: TREE_LEAVES[0]!,
    variants: TREE_LEAVES,
    forms: TREE_FORMS,
    shadow: { w: 44, h: 12 },
  },
  willow: { source: WILLOW, palette: WILLOW_PALETTE, shadow: { w: 104, h: 16 } },
  // It stands in the pond, so its shadow falls on the water.
  fountain: {
    source: FOUNTAIN,
    palette: FOUNTAIN_PALETTE,
    glow: FOUNTAIN_GLOW,
    lights: [
      { x: 32, y: 40, radius: 70 },
      { x: 32, y: 66, radius: 40 },
    ],
    shadow: { w: 56, h: 10 },
  },
  rock: { source: ROCK, palette: ROCK_PALETTE, spent: PEBBLES, shadow: { w: 28, h: 7 } },
  // The town's small things, drawn at 32 in phase L.
  pumpkin: {
    source: PUMPKIN_FORMS[0]!,
    forms: PUMPKIN_FORMS,
    palette: PUMPKIN_PALETTE,
    glow: PUMPKIN_LIT,
    lights: [{ x: 16, y: 22, radius: 28 }],
    shadow: { w: 28, h: 7 },
  },
  lantern: {
    source: LAMP_POST,
    palette: LAMP_PALETTE,
    glow: WINDOWS_LIT,
    lights: [{ x: 16, y: 15, radius: 60 }],
    shadow: { w: 20, h: 7 },
  },
  gravestone: {
    source: GRAVESTONE_FORMS[0]!,
    forms: GRAVESTONE_FORMS,
    palette: GRAVESTONE_VARIANTS[0]!,
    variants: GRAVESTONE_VARIANTS,
    shadow: { w: 26, h: 7 },
  },
  fence: { source: FENCE, palette: FENCE_PALETTE, joined: FENCE_JOINS, shadow: { w: 32, h: 5 } },
  fencePost: {
    source: FENCE_POST,
    palette: FENCE_PALETTE,
    joined: FENCE_JOINS,
    shadow: { w: 10, h: 5 },
  },
  well: {
    source: WELL,
    palette: WELL_PALETTE,
    shadow: { w: 96, h: 14 },
  },
  roseBush: {
    source: ROSE_BUSH,
    palette: ROSE_BUSH_PALETTE,
    spent: ROSE_BUSH_BARE,
    shadow: { w: 30, h: 9 },
  },
  hosta: {
    source: HOSTA,
    palette: HOSTA_LEAVES[0]!,
    variants: HOSTA_LEAVES,
    shadow: { w: 28, h: 8 },
  },
  farmSign: { source: FARM_SIGN, palette: FARM_SIGN_PALETTE, shadow: { w: 26, h: 5 } },
  // Drawn at 32 (phase G): her house, Skelly in the yard and the pots by her door.
  homeHouse: {
    ...HER_HOUSE,
    palette: HER_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 46, y: 124, radius: 40 },
      { x: 130, y: 124, radius: 40 },
      { x: 114, y: 132, radius: 26 },
    ],
    smoke: [{ x: 131, y: 6 }],
    shadow: { w: 168, h: 18 },
  },
  skelly: { source: SKELLY, palette: SKELLY_PALETTE, shadow: { w: 52, h: 10 } },
  pottedPlant: { ...POT_ART.mums, shadow: { w: 22, h: 6, dy: 6 } },
  shopHouse: {
    ...COBWEB_CORNER,
    palette: COBWEB_CORNER_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 46, y: 138, radius: 44 },
      { x: 130, y: 138, radius: 44 },
      { x: 88, y: 150, radius: 30 },
    ],
    shadow: { w: 168, h: 18 },
  },
  salonHouse: {
    ...MUSE,
    palette: MUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 44, y: 136, radius: 44 },
      { x: 132, y: 136, radius: 44 },
      { x: 88, y: 46, radius: 26 },
    ],
    shadow: { w: 168, h: 18 },
  },
  storageChest: {
    source: STORAGE_CHEST,
    palette: buildingPalette({
      wall: C.cream,
      roof: C.plum,
      trim: C.bark,
      door: C.berry,
      stone: C.iron,
      accentTwo: C.gold,
    }),
    shadow: { w: 28, h: 8 },
  },
  mailbox: { source: MAILBOX, palette: MAILBOX_PALETTE, shadow: { w: 22, h: 6 } },
  // Wrapunzel's bakery, with a museum beside it (personal_touches.md, "The neighbours").
  bakery: {
    ...CRUMBS_AND_CURIOS,
    palette: CRUMBS_AND_CURIOS_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 45, y: 142, radius: 44 },
      { x: 168, y: 124, radius: 36 },
      { x: 88, y: 150, radius: 28 },
    ],
    smoke: [{ x: 37, y: 14 }],
    shadow: { w: 200, h: 18 },
  },
  moonPieCart: {
    source: CART,
    palette: CART_PALETTE,
    glow: WINDOWS_LIT,
    lights: [{ x: 55, y: 25, radius: 30 }],
    shadow: { w: 64, h: 10 },
  },
  popUpShop: {
    ...POP_UP,
    palette: POP_UP_PALETTE,
    glow: POP_UP_LIT,
    lights: [
      { x: 27, y: 67, radius: 30 },
      { x: 85, y: 67, radius: 30 },
      { x: 56, y: 88, radius: 30 },
    ],
    shadow: { w: 104, h: 14 },
  },
  // Her neighbours' houses (phase G), each after its owner, their windows lit after dark.
  maudeHouse: {
    ...MAUDE_HOUSE,
    palette: MAUDE_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 36, y: 118, radius: 40 },
      { x: 72, y: 40, radius: 24 },
      { x: 62, y: 112, radius: 22 },
    ],
    shadow: { w: 136, h: 16 },
  },
  rufusHouse: {
    ...RUFUS_HOUSE,
    palette: RUFUS_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 41, y: 103, radius: 36 },
      { x: 135, y: 103, radius: 36 },
      { x: 64, y: 104, radius: 22 },
    ],
    shadow: { w: 168, h: 16 },
  },
  agathaHouse: {
    ...AGATHA_HOUSE,
    palette: AGATHA_HOUSE_PALETTE,
    glow: { ...WINDOWS_LIT, [CAULDRON]: C.orbGreenLight },
    lights: [
      { x: 103, y: 125, radius: 34 },
      { x: 72, y: 54, radius: 22 },
      { x: 106, y: 160, radius: 28 },
    ],
    shadow: { w: 136, h: 16 },
  },
  bartyHouse: {
    ...BARTY_HOUSE,
    palette: BARTY_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 113, y: 110, radius: 44 },
      { x: 29, y: 107, radius: 28 },
    ],
    smoke: [{ x: 26, y: 16 }],
    shadow: { w: 136, h: 16 },
  },
  codyHouse: {
    ...CODY_HOUSE,
    palette: CODY_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 38, y: 129, radius: 38 },
      { x: 138, y: 129, radius: 38 },
      { x: 60, y: 128, radius: 22 },
      { x: 114, y: 128, radius: 22 },
    ],
    smoke: [
      { x: 32, y: 20 },
      { x: 144, y: 20 },
    ],
    shadow: { w: 168, h: 18 },
  },
  // The places beyond the town (phase I), drawn at 32.
  toadstools: {
    source: TOADSTOOLS_ART,
    palette: TOADSTOOL_VARIANTS[0]!,
    variants: TOADSTOOL_VARIANTS,
    spent: TOADSTOOL_STUBS,
    glow: TOADSTOOL_GLOW,
    lights: [{ x: 12, y: 18, radius: 16 }],
    shadow: { w: 26, h: 6 },
  },
  oldTree: {
    source: OLD_TREE,
    palette: OLD_TREE_LEAVES[0]!,
    variants: OLD_TREE_LEAVES,
    shadow: { w: 110, h: 18 },
  },
  floatLantern: {
    source: FLOAT_LANTERN,
    palette: FLOAT_LANTERN_PALETTE,
    glow: FLOAT_LANTERN_GLOW,
    lights: [{ x: 16, y: 15, radius: 34 }],
    shadow: { w: 0, h: 0 },
  },
  reeds: { source: REEDS, palette: REEDS_PALETTE, shadow: { w: 22, h: 5 } },
  rowboat: { source: ROWBOAT, palette: ROWBOAT_PALETTE, shadow: { w: 0, h: 0 } },
  mound: {
    source: MOUND,
    palette: MOUND_PALETTE,
    spent: DUG,
    glow: MOUND_GLOW,
    shadow: { w: 0, h: 0 },
  },
  gatePost: { source: GATE_POST, palette: GATE_POST_PALETTE, shadow: { w: 22, h: 6 } },
  castle: {
    ...CASTLE,
    palette: CASTLE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 100, y: 172, radius: 44 },
      { x: 188, y: 172, radius: 44 },
      { x: 110, y: 190, radius: 24 },
      { x: 174, y: 190, radius: 24 },
      { x: 144, y: 120, radius: 30 },
    ],
    shadow: { w: 280, h: 22 },
  },
  weddingArch: { source: WEDDING_ARCH, palette: WEDDING_ARCH_PALETTE, shadow: { w: 60, h: 8 } },
  gate: { source: GATE_SHUT, palette: GATE_PALETTE, shadow: { w: 0, h: 0 } },
  // Clutter (phase L), placed by hand in each place.
  bush: {
    source: BUSH_FORMS[0]!,
    forms: BUSH_FORMS,
    palette: BUSH_LEAVES[0]!,
    variants: BUSH_LEAVES,
    shadow: { w: 30, h: 8 },
  },
  stump: { source: STUMP, palette: CLUTTER_PALETTE, shadow: { w: 28, h: 7 } },
  log: { source: LOG, palette: CLUTTER_PALETTE, shadow: { w: 58, h: 8 } },
  bench: { source: BENCH, palette: CLUTTER_PALETTE, shadow: { w: 60, h: 8 } },
  signpost: { source: SIGNPOST, palette: CLUTTER_PALETTE, shadow: { w: 18, h: 6 } },
  noticeboard: { source: NOTICEBOARD, palette: CLUTTER_PALETTE, shadow: { w: 58, h: 8 } },
  barrel: {
    source: BARREL_FORMS[0]!,
    forms: BARREL_FORMS,
    palette: CLUTTER_PALETTE,
    shadow: { w: 24, h: 7 },
  },
  hayBale: { source: HAY_BALE, palette: CLUTTER_PALETTE, shadow: { w: 30, h: 7 } },
  scarecrow: { source: SCARECROW, palette: SCARECROW_PALETTE, shadow: { w: 26, h: 7 } },
  // Film night's set (0.2's J3); the view shows the film on the screen while it's on.
  filmScreen: { source: FILM_SCREEN, palette: FILM_PALETTE, shadow: { w: 120, h: 8 } },
  popcornTable: { source: POPCORN_TABLE, palette: POPCORN_TABLE_PALETTE, shadow: { w: 56, h: 8 } },
  // The Halloween finale's (J4): the contest's stage, the chili, and her carving in the square.
  contestStage: { source: CONTEST_STAGE, palette: CONTEST_STAGE_PALETTE, shadow: { w: 120, h: 8 } },
  chiliTable: { source: CHILI_TABLE, palette: CHILI_TABLE_PALETTE, shadow: { w: 56, h: 8 } },
  catPumpkin: CAT_PUMPKIN_ART,
  // Drawn as it's coming on today by the view; this is how it rests most of the year.
  pumpkinPatch: {
    source: PUMPKIN_PATCH_ART.resting,
    palette: PUMPKIN_PATCH_PALETTE,
    shadow: { w: 0, h: 0 },
  },
  // Passive Candy (phase O): drawn as it is now by the view, laden and stocked here.
  candyTree: { source: CANDY_TREE.laden, palette: CANDY_TREE_PALETTE, shadow: { w: 34, h: 10 } },
  // 0.2's E1: drawn by the view as it is now, an empty plot, a sapling or a candy tree.
  saplingPlot: { source: SAPLING_PLOT, palette: SAPLING_PALETTE, shadow: { w: 0, h: 0 } },
  honestyStall: {
    source: HONESTY_STALL.stocked,
    palette: HONESTY_STALL_PALETTE,
    shadow: { w: 60, h: 8 },
  },
  // Newcomers' houses (phase T), and what stands on a lot until they move in.
  ollieHouse: {
    ...OLLIE_HOUSE,
    palette: OLLIE_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 102, y: 102, radius: 36 },
      { x: 78, y: 96, radius: 24 },
      { x: 72, y: 42, radius: 18 },
    ],
    smoke: [{ x: 106, y: 20 }],
    shadow: { w: 136, h: 16 },
  },
  nessaHouse: {
    ...NESSA_HOUSE,
    palette: NESSA_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 32, y: 96, radius: 28 },
      { x: 80, y: 96, radius: 28 },
      { x: 103, y: 110, radius: 32 },
    ],
    shadow: { w: 136, h: 14 },
  },
  gourdonHouse: {
    ...GOURDON_HOUSE,
    palette: GOURDON_HOUSE_PALETTE,
    glow: { ...WINDOWS_LIT, ...GOURDON_GLOW },
    lights: [
      { x: 52, y: 82, radius: 30 },
      { x: 124, y: 82, radius: 30 },
      { x: 88, y: 106, radius: 36 },
    ],
    smoke: [{ x: 110, y: 36 }],
    noEaves: true,
    shadow: { w: 150, h: 16 },
  },
  hazelHouse: {
    ...HAZEL_HOUSE,
    palette: HAZEL_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 101, y: 100, radius: 34 },
      { x: 78, y: 100, radius: 24 },
    ],
    shadow: { w: 128, h: 16 },
  },
  boothovenHouse: {
    ...BOOTHOVEN_HOUSE,
    palette: BOOTHOVEN_HOUSE_PALETTE,
    glow: WINDOWS_LIT,
    lights: [
      { x: 102, y: 112, radius: 34 },
      { x: 72, y: 48, radius: 22 },
      { x: 76, y: 104, radius: 24 },
    ],
    smoke: [{ x: 106, y: 26 }],
    shadow: { w: 128, h: 16 },
  },
  // The Hollow Fairground's (0.2's M1), its bulbs lit after dark.
  fairStage: {
    source: FAIR_STAGE,
    palette: FAIR_STAGE_PALETTE,
    glow: LIGHT_POLE_LIT,
    lights: [
      { x: 60, y: 80, radius: 44 },
      { x: 132, y: 80, radius: 44 },
    ],
    shadow: { w: 184, h: 14 },
  },
  ringTossStall: stall(RING_TOSS_STALL, RING_TOSS_PALETTE),
  cornDogStall: stall(CORN_DOG_STALL, CORN_DOG_PALETTE),
  hookAGhostStall: stall(HOOK_A_GHOST_STALL, HOOK_A_GHOST_PALETTE),
  toffeeAppleStall: stall(TOFFEE_APPLE_STALL, TOFFEE_APPLE_PALETTE),
  marketStall: stall(MARKET_STALL, MARKET_PALETTE),
  fortuneTent: {
    ...FORTUNE_TENT,
    palette: FORTUNE_TENT_PALETTE,
    glow: WINDOWS_LIT,
    lights: [{ x: 48, y: 102, radius: 36 }],
    noEaves: true,
    shadow: { w: 92, h: 14 },
  },
  ferrisWheel: {
    source: FERRIS_WHEEL,
    palette: FERRIS_WHEEL_PALETTE,
    glow: LIGHT_POLE_LIT,
    lights: [{ x: 80, y: 76, radius: 80 }],
    shadow: { w: 130, h: 14 },
  },
  lightPole: {
    source: LIGHT_POLE,
    palette: LIGHT_POLE_PALETTE,
    glow: LIGHT_POLE_LIT,
    lights: [{ x: 64, y: 8, radius: 40 }],
    shadow: { w: 14, h: 5 },
  },
  // Dressed by the day in `OutdoorView`; this is how the catalogue and the overview show it.
  goose: { ...GOOSE_ART.scarf, shadow: { w: 22, h: 6 } },
  lotSign: { source: LOT_SIGN, palette: LOT_PALETTE, shadow: { w: 26, h: 6 } },
  soldSign: { source: SOLD_SIGN, palette: LOT_PALETTE, shadow: { w: 26, h: 6 } },
  movingBoxes: { source: MOVING_BOXES, palette: LOT_PALETTE, shadow: { w: 32, h: 7 } },
};

/** A stall at the fairground, its bulbs and lamp lit after dark. */
function stall(source: SpriteSource, palette: Palette): PropArt {
  return {
    source,
    palette,
    glow: STALL_LIT,
    lights: [{ x: 48, y: 50, radius: 36 }],
    shadow: { w: 92, h: 10 },
  };
}

/** A prop where it stands, as much of it as its look depends on. */
export interface StandingProp {
  id: PropId;
  tx: number;
  ty: number;
  sign?: { to: MapZoneId; way: 'left' | 'right' };
  joins?: number;
}

/**
 * How a prop looks where it stands: its colouring and shape picked by its tile, or a signpost's
 * board by the place it names. `key` is what it's baked under.
 */
export function lookOf(prop: StandingProp): {
  source: SpriteSource;
  palette: Palette;
  form: number;
  key: string;
} {
  const art = PROP_ART[prop.id];
  if (prop.sign) {
    const { to, way } = prop.sign;
    return {
      source: signpostTo(to, way),
      palette: art.palette,
      form: 0,
      key: `prop:${prop.id}:${to}:${way}`,
    };
  }
  if (art.joined && prop.joins !== undefined) {
    return {
      source: art.joined[prop.joins]!,
      palette: art.palette,
      form: prop.joins,
      key: `prop:fence:${prop.joins}`,
    };
  }
  const v = art.variants ? variantOf(prop.tx, prop.ty, art.variants.length) : 0;
  const f = art.forms ? formOf(prop.tx, prop.ty, art.forms.length) : 0;
  return {
    source: art.forms?.[f] ?? art.source,
    palette: art.variants?.[v] ?? art.palette,
    form: f,
    key: `prop:${prop.id}:${v}:${f}`,
  };
}
