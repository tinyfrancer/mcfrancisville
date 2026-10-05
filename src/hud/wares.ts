import { FLOORINGS, FURNITURE, WALLPAPERS } from '../data/furniture';
import { ITEMS } from '../data/items';
import { colourList, OUTFITS, recolours } from '../data/outfits';
import { ACCESSORIES } from '../data/pets';
import { recipeName } from '../data/recipes';
import type { Ware } from '../data/shop';
import type {
  AccessoryId,
  FlooringId,
  FurnitureId,
  ItemId,
  OutfitId,
  RecipeId,
  WallpaperId,
} from '../types/ids';
import { aboutFood } from './food';
import { ripensIn } from './SeedSheet';

/** How a sheet that shows wares (a shop's shelves, Ollie's catalogue) draws each kind of one. */
export interface WareArt {
  /** Draws an item's picture into a canvas at 1×, for the sheet to scale up. */
  icon(canvas: HTMLCanvasElement, id: ItemId): void;
  /** Draws her wearing a piece, close up on where it's worn, at 1×. */
  tryOn(canvas: HTMLCanvasElement, outfit: OutfitId): void;
  /** Draws a piece of furniture into a square canvas at 1×. */
  pieceIcon(canvas: HTMLCanvasElement, id: FurnitureId): void;
  /** Draws what a recipe makes at 1×. */
  recipeIcon(canvas: HTMLCanvasElement, id: RecipeId): void;
  /** Draws a tile of a wallpaper or a flooring at 1×. */
  surfaceIcon(
    canvas: HTMLCanvasElement,
    surface: { wallpaper: WallpaperId } | { flooring: FlooringId },
  ): void;
  /** Draws a pet's accessory at 1×. */
  accessoryIcon(canvas: HTMLCanvasElement, id: AccessoryId): void;
}

/** Draws a ware's picture at 1×. */
export function drawWare(canvas: HTMLCanvasElement, art: WareArt, ware: Ware): void {
  if ('item' in ware) art.icon(canvas, ware.item);
  else if ('furniture' in ware) art.pieceIcon(canvas, ware.furniture);
  else if ('recipe' in ware) art.recipeIcon(canvas, ware.recipe);
  else if ('outfit' in ware) art.tryOn(canvas, ware.outfit);
  else if ('accessory' in ware) art.accessoryIcon(canvas, ware.accessory);
  else art.surfaceIcon(canvas, ware);
}

/** A ware as a row says it: its name, a line about it, and whether it's hers for good already. */
export interface WareFace {
  name: string;
  about: string;
  owned: boolean;
}

/** What a row says about a ware, given how many of a thing she has and what's hers for good. */
export function faceOf(
  ware: Ware,
  has: { count(id: ItemId): number; owns(ware: Ware): boolean },
): WareFace {
  if ('item' in ware) {
    const kind = ITEMS[ware.item].kind;
    const have = has.count(ware.item);
    const about = kind === 'seed' ? `${ripensIn(ware.item)}.` : aboutFood(ware.item);
    const name = ITEMS[ware.item].name;
    return { name, about: have > 0 ? `${about} You have ${have}.` : about, owned: false };
  }
  if ('furniture' in ware) {
    const row = FURNITURE[ware.furniture];
    return { name: row.name, about: row.description, owned: false };
  }
  const owned = has.owns(ware);
  if ('recipe' in ware) {
    const about = owned
      ? 'You know this one already.'
      : 'A recipe card, to make it at your workbench.';
    return { name: `Recipe: ${recipeName(ware.recipe)}`, about, owned };
  }
  if ('outfit' in ware) {
    const outfit = OUTFITS[ware.outfit];
    const colours = recolours(ware.outfit) ? ` Comes in ${colourList(ware.outfit)}.` : '';
    const about = owned ? 'In your closet already.' : `${outfit.description}${colours}`;
    return { name: outfit.name, about, owned };
  }
  if ('accessory' in ware) {
    const about = owned ? 'Yours already.' : ACCESSORIES[ware.accessory].description;
    return { name: ACCESSORIES[ware.accessory].name, about, owned };
  }
  const name =
    'wallpaper' in ware
      ? `${WALLPAPERS[ware.wallpaper].name} wallpaper`
      : `${FLOORINGS[ware.flooring].name} flooring`;
  const about = owned ? 'Yours already.' : 'For your home. Yours to keep once it’s bought.';
  return { name, about, owned };
}
