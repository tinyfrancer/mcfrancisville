import type {
  AccessoryId,
  CritterId,
  FlooringId,
  FurnitureId,
  ItemId,
  OutfitId,
  RecipeId,
  ShopId,
  WallpaperId,
} from '../types/ids';
import type { FestivalId, TownEventId } from './calendar';
import { CRITTER_IDS, CRITTERS } from './critters';
import { BEADS } from './gathering';
import { DISPLAY_WARES } from './display';
import { SURFACE_WARES, TRINKET_WARES } from './tabletop';
import { YARD_WARES } from './yard';
import { ACCESSORY_IDS, ACCESSORIES } from './pets';
import { RECIPES } from './recipes';

/**
 * Something a shop sells: a thing for her bag, a piece of clothing for her closet, a piece of
 * furniture for her storage chest, a wallpaper or flooring that's hers to put up, a recipe card
 * for her workbench, or something for one of her pets to wear.
 */
export type Ware =
  | { item: ItemId }
  | { outfit: OutfitId }
  | { furniture: FurnitureId }
  | { wallpaper: WallpaperId }
  | { flooring: FlooringId }
  | { recipe: RecipeId }
  | { accessory: AccessoryId };

/**
 * What a new game starts with: enough for a record, a squishy or a bandana on the first day,
 * because the first visit to the shop should end with something in her hands (decisions.md 77).
 * A save from before the shops was given 100 (save v5).
 */
export const STARTING_CANDY = 300;

/**
 * What the shops pay for one of each thing, in Candy. Anything a shop sells costs twice this. Purse
 * butter is worth nothing to anyone but her, so it can't be sold (see `canSell`).
 */
export const ITEM_VALUE: Record<ItemId, number> = {
  // What she gathers is small change, a few Candy a tap wherever she is, so a place with more
  // trees is only more walking (decisions.md 128). Candy comes from growing, catching and her
  // neighbours.
  wood: 2,
  stone: 3,
  moonpetal: 4,
  forgetMeBoo: 4,
  ghostDaisy: 4,
  purseButter: 0,
  // Fibi's, and she'd like it back.
  fibisBone: 0,
  // A keepsake: not for sale at any price.
  iceSkates: 0,
  broom: 0,
  candySapling: 0,
  castleKey: 0,
  hallKey: 0,
  // The holidays' treats (phase U).
  chocolateEgg: 12,
  chocolateHeart: 15,
  shamrock: 8,
  icePop: 10,
  gingerbreadBat: 15,
  // October's sweets (0.2's J2): the gummy cluster is the one she hopes for.
  gummyCluster: 30,
  chewyDots: 10,
  sourGhouls: 10,
  // The pick of the pumpkin patch (0.2's J3): a little more than one from her beds.
  patchPumpkin: 60,
  popcorn: 15,
  whiteChickenChili: 20,
  // The fairground's (0.2's M2): its snacks, and its games' top prizes, hers to keep.
  cornDog: 12,
  friedPickles: 10,
  vinegarFries: 10,
  toffeeApple: 12,
  ringTossRosette: 0,
  plushGhost: 0,
  sprinkler: 30,
  // Phase R's dishes: more than what goes in them, by a quarter at least (0.2's E1).
  pumpkinSoup: 55,
  fishChowder: 70,
  moonpetalCake: 70,
  midnightPlate: 60,
  ghostChili: 100,
  pumpkinPie: 150,
  toadstoolStew: 60,
  roseJam: 200,
  moonflowerTea: 45,
  spaghetti: 120,
  chipsAndGuac: 130,
  roastGourd: 120,
  lavenderShortbread: 100,
  toadstool: 4,
  milkweed: 4,
  midnightPizza: 20,
  batWingCookie: 15,
  pumpkinPudding: 15,
  ghostMallow: 15,
  // A harvest is worth about 20 a day of growing, and her flowers a little more.
  pumpkin: 40,
  ghostPepper: 20,
  candyCorn: 40,
  batWingBean: 20,
  rose: 40,
  blueRose: 300,
  moonflower: 30,
  snapdragon: 30,
  spiderLily: 40,
  hosta: 40,
  batFlower: 30,
  tomato: 20,
  garlic: 30,
  basil: 20,
  avocado: 40,
  sweetcorn: 40,
  glowGourd: 60,
  sunflower: 80,
  blackTulip: 30,
  lavender: 20,
  marigold: 30,
  christmasRose: 40,
  iris: 30,
  pumpkinSeed: 5,
  ghostPepperSeed: 10,
  candyCornSeed: 12,
  batWingBeanSeed: 10,
  roseSeed: 12,
  moonflowerSeed: 10,
  snapdragonSeed: 10,
  spiderLilyBulb: 12,
  hostaDivision: 8,
  batFlowerSeed: 10,
  tomatoSeed: 10,
  garlicClove: 10,
  basilSeed: 10,
  avocadoPit: 12,
  sweetcornSeed: 12,
  glowGourdSeed: 12,
  sunflowerSeed: 12,
  tulipBulb: 10,
  lavenderSeed: 10,
  marigoldSeed: 10,
  christmasRoseSeed: 12,
  irisBulb: 10,
  jackOLanternPizza: 30,
  ghostGooBall: 60,
  pumpkinGooBall: 60,
  blueMoonGooBall: 60,
  swampGooBall: 60,
  eyeballSquish: 60,
  booBao: 60,
  xiaoLongBoo: 60,
  batGyoza: 60,
  vampDoll: 80,
  stitchDoll: 80,
  wolfDoll: 80,
  mummyDoll: 80,
  ghostDoll: 80,
  witchDoll: 80,
  gorgonDoll: 80,
  seaDoll: 80,
  recordGhoulyParton: 90,
  recordLadyGhoulga: 90,
  recordFleetwoodMacabre: 90,
  recordScreamDion: 90,
  recordBoneJovi: 90,
  recordBoolafonte: 90,
  heartBead: 10,
  loveBeads: 15,
  smileyBead: 10,
  tigerFootballBead: 12,
  scarletFootballBead: 12,
  batBead: 10,
  ghostBead: 10,
  // A bracelet is worth a little more than its beads, for the stringing.
  loveBracelet: 50,
  smileyBracelet: 45,
  friendshipBracelet: 60,
  tigersBracelet: 50,
  scarletBracelet: 50,
  spookyBracelet: 55,
  recordWalkTheTomb: 90,
  recordBoonlightSonata: 90,
  burritoBowl: 30,
  moonPie: 25,
  moonPieMini: 15,
  ...critterValues(),
};

function critterValues(): Record<CritterId, number> {
  const values = {} as Record<CritterId, number>;
  for (const id of CRITTER_IDS) values[id] = CRITTERS[id].value;
  return values;
}

/**
 * What each piece of clothing the shops sell costs. Clothes are never sold back: once a piece is in
 * her closet it stays there (decisions.md 11).
 */
export const OUTFIT_PRICE: Partial<Record<OutfitId, number>> = {
  teeBoneJovi: 240,
  jerseyScarlet: 320,
  sundressDots: 360,
  glitterHeels: 480,
  velvetPumps: 400,
  platformMaryJanes: 420,
  batBowFlats: 340,
  rhinestoneBoots: 520,
  kneeHighBoots: 440,
  moonbeamSandals: 360,
  witchHat: 300,
  catEars: 220,
  skeletonTee: 260,
  jackOLanternDress: 400,
  manyColoursCoat: 450,
  // The Halloween shelf (0.2's J2): a whole costume for about what a pair of fancy shoes is.
  bugCatcherHat: 240,
  bugCatcherShirt: 240,
  butterflyAntennae: 220,
  butterflyWings: 380,
  ringmasterHat: 260,
  ringmasterCoat: 320,
  lionMane: 340,
  clueTurtleneck: 240,
  clueGlasses: 220,
  scaredyTee: 220,
  // Cooler clothes (0.2's W3): the everyday ones about what a band tee or a dress is, a jacket a
  // little more, and the boutique's whole looks dear, a treat to save up for, but each piece
  // still within a day's rounds (decision 128).
  walkTheTombHoodie: 300,
  corsetTop: 360,
  tulleSkirt: 340,
  batSkirt: 260,
  fishnets: 220,
  stripyTights: 220,
  motoJacket: 480,
  denimJacket: 380,
  velvetDress: 800,
  operaCoat: 900,
  ballGown: 1300,
  tiara: 700,
  spaceSuit: 1200,
  spaceHelmet: 650,
  platformBoots: 560,
  vampireCape: 340,
  batWings: 280,
  mummyWraps: 360,
  devilHorns: 220,
};

const items = (...ids: ItemId[]): Ware[] => ids.map((item) => ({ item }));
const outfits = (...ids: OutfitId[]): Ware[] => ids.map((outfit) => ({ outfit }));

/** The pop-up's Halloween shelf, out every day of the festival (0.2's J2). */
const HALLOWEEN_COSTUMES = outfits(
  'bugCatcherHat',
  'bugCatcherShirt',
  'butterflyAntennae',
  'butterflyWings',
  'ringmasterHat',
  'ringmasterCoat',
  'lionMane',
  'clueTurtleneck',
  'clueGlasses',
  'scaredyTee',
  'vampireCape',
  'batWings',
  'mummyWraps',
  'devilHorns',
);

/** Cobweb Corner's clothes, two a day: band merch, a jacket, a corset and tulle, tights. */
const CLOTHES = outfits(
  'teeBoneJovi',
  'jerseyScarlet',
  'sundressDots',
  'manyColoursCoat',
  'walkTheTombHoodie',
  'corsetTop',
  'tulleSkirt',
  'batSkirt',
  'fishnets',
  'stripyTights',
  'motoJacket',
  'denimJacket',
);

/**
 * The boutique's whole looks (0.2's W3, question 72: fancy, pricey outfits, like a spaceman suit),
 * one a week, every piece of it together.
 */
const BOUTIQUE_LOOKS: readonly (readonly OutfitId[])[] = [
  ['spaceSuit', 'spaceHelmet'],
  ['ballGown', 'tiara'],
  ['velvetDress', 'operaCoat'],
  ['corsetTop', 'tulleSkirt', 'fishnets', 'platformBoots'],
];

const SEEDS = items(
  'pumpkinSeed',
  'ghostPepperSeed',
  'candyCornSeed',
  'batWingBeanSeed',
  'roseSeed',
  'moonflowerSeed',
  'snapdragonSeed',
  'spiderLilyBulb',
  'hostaDivision',
  'batFlowerSeed',
  'tomatoSeed',
  'garlicClove',
  'basilSeed',
  'avocadoPit',
  'sweetcornSeed',
  'glowGourdSeed',
  'sunflowerSeed',
  'tulipBulb',
  'lavenderSeed',
  'marigoldSeed',
  'christmasRoseSeed',
  'irisBulb',
);

/** She loves shoes, so both shops always have a pair or two (personal_touches.md). */
const FANCY_SHOES = outfits(
  'glitterHeels',
  'velvetPumps',
  'platformMaryJanes',
  'batBowFlats',
  'rhinestoneBoots',
  'kneeHighBoots',
  'moonbeamSandals',
  'platformBoots',
);

const SQUISHIES = items(
  'ghostGooBall',
  'pumpkinGooBall',
  'blueMoonGooBall',
  'swampGooBall',
  'eyeballSquish',
  'booBao',
  'xiaoLongBoo',
  'batGyoza',
);

/** Her monster dolls (0.2's F2): a season's shelf finished sends one, and the rest are sold here. */
export const DOLLS = items(
  'vampDoll',
  'stitchDoll',
  'wolfDoll',
  'mummyDoll',
  'ghostDoll',
  'witchDoll',
  'gorgonDoll',
  'seaDoll',
);

const furniture = (...ids: FurnitureId[]): Ware[] => ids.map((id) => ({ furniture: id }));

/** What Cobweb Corner has for her home: things that stand, lie and hang. */
const FOR_THE_FLOOR = furniture(
  'batBed',
  'pumpkinChair',
  'coffinBookshelf',
  'cauldron',
  'batLamp',
  'marbleRun',
  'recordPlayer',
  'monstera',
  'snakePlant',
  'venusFlytrap',
  'succulents',
  'moonRug',
  'spiderwebRug',
  'longNeckYoshi',
  'rhinestoneGuitar',
  'tealMixer',
  'makeupChair',
);

const FOR_THE_WALLS = furniture(
  'ghostPortrait',
  'catPortrait',
  'moonPainting',
  'batClock',
  'wallShelf',
  'pothos',
  'gothicMirror',
  'butterflyFrame',
);

/** Every wallpaper and flooring but the ones her house starts with. */
const WALLPAPERS: Ware[] = (
  ['batDamask', 'ghostPolka', 'moonlitBlue', 'mossPanels', 'goldDamask'] as const
).map((wallpaper) => ({ wallpaper }));
const FLOORINGS: Ware[] = (
  ['checkerboard', 'bluePlanks', 'mossCarpet', 'cobblestone'] as const
).map((flooring) => ({ flooring }));

/**
 * The pop-up's spooky decor, and a second two-headed duck for anyone who wants a pair
 * (personal_touches.md, "Her home").
 */
const SPOOKY_DECOR = furniture(
  'skeletonFriend',
  'candelabra',
  'crystalBall',
  'tombstone',
  'batGarland',
  'twoHeadedDuck',
);

const RECORDS = items(
  'recordGhoulyParton',
  'recordLadyGhoulga',
  'recordFleetwoodMacabre',
  'recordScreamDion',
  'recordBoneJovi',
  'recordBoolafonte',
);

/** What Cobweb Corner's special may be: something for her home, a squishy, a record or clothes. */
const SPECIALS: Ware[] = [...FOR_THE_FLOOR, ...FOR_THE_WALLS, ...SQUISHIES, ...RECORDS, ...CLOTHES];

/** Market day's table: a bit of everything, the pop-up's decor among it. */
const MARKET_TABLE: Ware[] = [...SPECIALS, ...SPOOKY_DECOR, ...WALLPAPERS, ...FLOORINGS];

/** A special is this much off, so a check-in in any window can find a bargain. */
export const SPECIAL_OFF = 0.25;

/** Every recipe card for her workbench: each recipe that isn't known from the start. */
const RECIPE_CARDS: Ware[] = (Object.keys(RECIPES) as RecipeId[])
  .filter((id) => RECIPES[id].card !== undefined && RECIPES[id].at === undefined)
  .map((recipe) => ({ recipe }));

/** Every recipe card for her stove (phase R), on a shelf of their own. */
const COOKBOOK: Ware[] = (Object.keys(RECIPES) as RecipeId[])
  .filter((id) => RECIPES[id].card !== undefined && RECIPES[id].at === 'stove')
  .map((recipe) => ({ recipe }));

/** Every accessory that's sold: all but the ones she has from the start. */
const FOR_THE_PETS: Ware[] = ACCESSORY_IDS.filter((id) => ACCESSORIES[id].price !== undefined).map(
  (accessory) => ({ accessory }),
);

/**
 * `count` wares a day, picked from `from` by the day key; or, with `sets`, `count` of those dealt
 * whole, every ware of each (a boutique look), `from` then being all of them.
 */
export interface Pick {
  from: readonly Ware[];
  count: number;
  sets?: readonly (readonly Ware[])[];
}

/** One of `looks` a time, dealt whole. */
function looks(sets: readonly (readonly OutfitId[])[]): Pick {
  const wares = sets.map((set) => outfits(...set));
  return { from: wares.flat(), count: 1, sets: wares };
}

export interface ShelfRow {
  /** `{window}` is this window's name: "This afternoon's special". */
  name: string;
  picks: readonly Pick[];
  /** Dealt afresh each window (decisions.md 81) rather than once a day. */
  everyWindow?: true;
  /** Dealt once a week, new on Monday at 5am (0.2's W3), rather than once a day. */
  everyWeek?: true;
  /** How much less than its price it's sold for, as a fraction: a special's. */
  off?: number;
  /** Put out only on the days of a town event (market day's table) or a festival. */
  on?: TownEventId | FestivalId;
  /** Put out at this shop instead once the fairground is open (market day's table, 0.2's M3). */
  moves?: ShopId;
}

export interface ShopRow {
  name: string;
  /** Said at the top of the sheet. Warm, silly, never pushy. */
  greeting: string;
  shelves: readonly ShelfRow[];
}

/**
 * The shops and what each one's shelves may carry. What is on them today is picked by the day key
 * (`systems/shop.ts`), the same all day and new at 5am, but for a special, new each window. The mystery corkboard isn't sold anywhere:
 * it's hers from the start, waiting for the mayor's mystery (decisions.md 19).
 */
export const SHOPS: Record<ShopId, ShopRow> = {
  corner: {
    name: 'Cobweb Corner',
    greeting: 'Welcome in! New things every morning at 5, and a new special every few hours.',
    shelves: [
      {
        name: "This {window}'s special",
        picks: [{ from: SPECIALS, count: 1 }],
        everyWindow: true,
        off: SPECIAL_OFF,
      },
      {
        name: 'Market table',
        picks: [{ from: MARKET_TABLE, count: 3 }],
        on: 'marketDay',
        moves: 'market',
      },
      // Six of the twenty-two a day (0.2's N2), so any seed turns up within the week.
      { name: 'Seeds', picks: [{ from: SEEDS, count: 6 }] },
      { name: 'Fancy shoes', picks: [{ from: FANCY_SHOES, count: 2 }] },
      { name: "This week's boutique", picks: [looks(BOUTIQUE_LOOKS)], everyWeek: true },
      { name: 'Clothes', picks: [{ from: CLOTHES, count: 2 }] },
      {
        name: 'Goodies',
        picks: [
          { from: items('jackOLanternPizza'), count: 1 },
          // Someone in town can't get enough of these (personal_touches.md, "Cody's villager").
          { from: items('burritoBowl'), count: 1 },
          { from: SQUISHIES, count: 1 },
          { from: DOLLS, count: 1 },
          { from: RECORDS, count: 1 },
        ],
      },
      {
        name: 'Furniture',
        picks: [
          { from: FOR_THE_FLOOR, count: 2 },
          { from: FOR_THE_WALLS, count: 1 },
          // What shows off what she has (0.3's H2): a set piece or a display piece a day.
          { from: furniture(...DISPLAY_WARES), count: 1 },
        ],
      },
      // Things on tables (0.3's H3): a table or the like, and two small things to stand on it.
      {
        name: 'Little things',
        picks: [
          { from: furniture(...SURFACE_WARES), count: 1 },
          { from: furniture(...TRINKET_WARES), count: 2 },
        ],
      },
      // Her yard (0.3's H5): two pieces a day to stand out on the lawn.
      { name: 'For the yard', picks: [{ from: furniture(...YARD_WARES), count: 2 }] },
      {
        name: 'Crafting',
        picks: [
          { from: items(...BEADS), count: 2 },
          { from: RECIPE_CARDS, count: 1 },
        ],
      },
      { name: 'Cookbook', picks: [{ from: COOKBOOK, count: 1 }] },
      { name: 'For the pets', picks: [{ from: FOR_THE_PETS, count: 2 }] },
      {
        name: 'Walls & floors',
        picks: [
          { from: WALLPAPERS, count: 1 },
          { from: FLOORINGS, count: 1 },
        ],
      },
    ],
  },
  // Market day's stall at the fairground (0.2's M3): Cobweb Corner's market table, carried out to
  // a stall by the stage once the gate is open. It has no shelves of its own.
  market: {
    name: 'The market stall',
    greeting: 'Market day! A bit of everything, fresh off the cart. Have a rummage, love.',
    shelves: [],
  },
  // A parody of the costume shops that pop up in empty stores for a season (personal_touches.md),
  // in a town where the season never ends.
  popUp: {
    name: 'Spirit Halloweenie',
    greeting: 'NOW OPEN! (temporarily.) Seasonal costumes, for a season that never ends.',
    shelves: [
      {
        name: 'Costumes',
        picks: [
          { from: outfits('witchHat', 'catEars', 'skeletonTee', 'jackOLanternDress'), count: 2 },
        ],
      },
      {
        name: 'Halloween',
        picks: [{ from: HALLOWEEN_COSTUMES, count: 5 }],
        on: 'halloweenFestival',
      },
      { name: 'Fancy shoes', picks: [{ from: FANCY_SHOES, count: 1 }] },
      { name: 'Spooky decor', picks: [{ from: SPOOKY_DECOR, count: 2 }] },
    ],
  },
  // The mysterious snack peddler, who turns up on random days (personal_touches.md, "Characters to
  // place") and is, one day, a suspect on the mayor's corkboard.
  moonPie: {
    name: 'The Chocolate Banana Watermelon Moon Pie Man',
    greeting: "Chocolate. Banana. Watermelon. Moon pie. …Don't ask where I get them.",
    shelves: [
      {
        name: 'From the cart',
        picks: [
          { from: items('moonPie'), count: 1 },
          { from: items('moonPieMini'), count: 1 },
          {
            from: items('batWingCookie', 'pumpkinPudding', 'ghostMallow', 'midnightPizza'),
            count: 2,
          },
        ],
      },
    ],
  },
};

/** The pop-up is in town on about this many days in seven, and which days is up to the day key. */
export const POP_UP_DAYS_IN_SEVEN = 4;

/** Its busy season, when it's in town every day (0.2's J2). */
export const POP_UP_SEASON: FestivalId = 'halloweenFestival';

/** The Moon Pie Man turns up on about this many days in seven. */
export const MOON_PIE_DAYS_IN_SEVEN = 2;
