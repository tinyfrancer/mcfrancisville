import type {
  FlooringId,
  FurnitureId,
  ItemId,
  OutfitId,
  RecipeId,
  ShopId,
  WallpaperId,
} from '../types/ids';
import { BEADS } from './gathering';
import { RECIPES } from './recipes';

/**
 * Something a shop sells: a thing for her bag, a piece of clothing for her closet, a piece of
 * furniture for her storage chest, a wallpaper or flooring that's hers to put up, or a recipe card
 * for her workbench.
 */
export type Ware =
  | { item: ItemId }
  | { outfit: OutfitId }
  | { furniture: FurnitureId }
  | { wallpaper: WallpaperId }
  | { flooring: FlooringId }
  | { recipe: RecipeId };

/** What a new game starts with, and what a save from before the shops was given (save v5). */
export const STARTING_CANDY = 100;

/**
 * What the shops pay for one of each thing, in Candy. Anything a shop sells costs twice this. Purse
 * butter is worth nothing to anyone but her, so it can't be sold (see `canSell`).
 */
export const ITEM_VALUE: Record<ItemId, number> = {
  wood: 4,
  stone: 5,
  moonpetal: 8,
  forgetMeBoo: 8,
  ghostDaisy: 8,
  purseButter: 0,
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
  jackOLanternPizza: 30,
  ghostGooBall: 60,
  pumpkinGooBall: 60,
  blueMoonGooBall: 60,
  swampGooBall: 60,
  eyeballSquish: 60,
  booBao: 60,
  xiaoLongBoo: 60,
  batGyoza: 60,
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
};

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
};

const items = (...ids: ItemId[]): Ware[] => ids.map((item) => ({ item }));
const outfits = (...ids: OutfitId[]): Ware[] => ids.map((outfit) => ({ outfit }));

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
);

const FOR_THE_WALLS = furniture(
  'ghostPortrait',
  'catPortrait',
  'moonPainting',
  'batClock',
  'wallShelf',
  'pothos',
  'gothicMirror',
);

/** Every wallpaper and flooring but the ones her house starts with. */
const WALLPAPERS: Ware[] = (['batDamask', 'ghostPolka', 'moonlitBlue', 'mossPanels'] as const).map(
  (wallpaper) => ({ wallpaper }),
);
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

/** Every recipe card: each recipe that isn't known from the start. */
const RECIPE_CARDS: Ware[] = (Object.keys(RECIPES) as RecipeId[])
  .filter((id) => RECIPES[id].card !== undefined)
  .map((recipe) => ({ recipe }));

/** `count` wares a day, picked from `from` by the day key. */
export interface Pick {
  from: readonly Ware[];
  count: number;
}

export interface ShelfRow {
  name: string;
  picks: readonly Pick[];
}

export interface ShopRow {
  name: string;
  /** Said at the top of the sheet. Warm, silly, never pushy. */
  greeting: string;
  shelves: readonly ShelfRow[];
}

/**
 * The shops and what each one's shelves may carry. What is on them today is picked by the day key
 * (`systems/shop.ts`), the same all day and new at 5am. The mystery corkboard isn't sold anywhere:
 * it's hers from the start, waiting for the mayor's mystery (decisions.md 19).
 */
export const SHOPS: Record<ShopId, ShopRow> = {
  corner: {
    name: 'Cobweb Corner',
    greeting: 'Welcome in! New things on the shelves every morning at 5.',
    shelves: [
      { name: 'Seeds', picks: [{ from: SEEDS, count: 4 }] },
      { name: 'Fancy shoes', picks: [{ from: FANCY_SHOES, count: 2 }] },
      {
        name: 'Clothes',
        picks: [{ from: outfits('teeBoneJovi', 'jerseyScarlet', 'sundressDots'), count: 1 }],
      },
      {
        name: 'Goodies',
        picks: [
          { from: items('jackOLanternPizza'), count: 1 },
          { from: SQUISHIES, count: 1 },
          { from: RECORDS, count: 1 },
        ],
      },
      {
        name: 'Furniture',
        picks: [
          { from: FOR_THE_FLOOR, count: 2 },
          { from: FOR_THE_WALLS, count: 1 },
        ],
      },
      {
        name: 'Crafting',
        picks: [
          { from: items(...BEADS), count: 2 },
          { from: RECIPE_CARDS, count: 1 },
        ],
      },
      {
        name: 'Walls & floors',
        picks: [
          { from: WALLPAPERS, count: 1 },
          { from: FLOORINGS, count: 1 },
        ],
      },
    ],
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
      { name: 'Fancy shoes', picks: [{ from: FANCY_SHOES, count: 1 }] },
      { name: 'Spooky decor', picks: [{ from: SPOOKY_DECOR, count: 2 }] },
    ],
  },
};

/** The pop-up is in town on about this many days in seven, and which days is up to the day key. */
export const POP_UP_DAYS_IN_SEVEN = 4;
