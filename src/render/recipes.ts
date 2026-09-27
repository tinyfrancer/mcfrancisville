import { RECIPES } from '../data/recipes';
import { bake } from '../sprites/bake';
import { BLUEPRINT, BLUEPRINT_PALETTE } from '../sprites/items';
import type { RecipeId } from '../types/ids';
import { drawFurnitureIcon } from './furniture';
import { drawItemIcon } from './items';

/** What a recipe makes, at 1×: the thing itself, or for an extension, the plans for it. */
export function drawRecipeIcon(canvas: HTMLCanvasElement, id: RecipeId): void {
  const made = RECIPES[id].makes;
  if ('item' in made) return drawItemIcon(canvas, made.item);
  if ('furniture' in made) return drawFurnitureIcon(canvas, made.furniture);
  const sprite = bake('blueprint', BLUEPRINT, BLUEPRINT_PALETTE);
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  canvas.getContext('2d')?.drawImage(sprite, 0, 0);
}
