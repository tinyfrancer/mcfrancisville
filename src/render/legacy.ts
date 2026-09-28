import { OLD_TILE, TILE_SIZE } from '../config/world';
import type { FurnitureId, PropId } from '../types/ids';
import { bake, bakeLayers } from '../sprites/bake';
import type { Layer, Palette, RasterOptions, SpriteSource } from '../sprites/sprite';

/**
 * The bridge from version 0's art (decisions.md 86). Art drawn for 16-pixel tiles is baked this
 * many times bigger in the world, and every length measured against it (an offset, a shadow, a
 * light's reach) goes through `old`. When a phase redraws a sprite at the new density, its
 * `bakeOld` and `old` calls go, and nothing here needs to change until the last one does.
 */
export const OLD = TILE_SIZE / OLD_TILE;

/** A length measured against the old 16-pixel art, in world pixels. */
export function old(n: number): number {
  return n * OLD;
}

/** `bake` for a grid drawn at the old density, into the world. */
export function bakeOld(
  key: string,
  source: SpriteSource,
  palette: Palette,
  options: RasterOptions = {},
): HTMLCanvasElement {
  return bake(key, source, palette, { ...options, scale: OLD });
}

/** `bakeLayers` for layers drawn at the old density, into the world. */
export function bakeLayersOld(
  key: string,
  layers: () => readonly Layer[],
  options: RasterOptions = {},
): HTMLCanvasElement {
  return bakeLayers(key, layers, { ...options, scale: OLD });
}

/**
 * Something drawn whole at the old density, such as the ground or a room's walls and floor,
 * redrawn `OLD` times bigger with every pixel kept crisp.
 */
export function enlargeCanvas(small: HTMLCanvasElement): HTMLCanvasElement {
  const big = document.createElement('canvas');
  big.width = small.width * OLD;
  big.height = small.height * OLD;
  const g = big.getContext('2d');
  if (!g) throw new Error('no 2d context');
  g.imageSmoothingEnabled = false;
  g.drawImage(small, 0, 0, big.width, big.height);
  return big;
}

/** The props still drawn at the old density; each phase that redraws one takes it off. */
const OLD_PROPS: ReadonlySet<PropId> = new Set<PropId>([
  'pumpkin',
  'lantern',
  'gravestone',
  'fence',
  'fencePost',
  'well',
  'storageChest',
  'mailbox',
]);

/** How many world pixels a pixel of a prop's grid is. */
export function propScale(id: PropId): number {
  return OLD_PROPS.has(id) ? OLD : 1;
}

/**
 * The pieces of furniture still drawn at the old density (phase J redraws them at 32, taking each
 * off as it goes).
 */
const OLD_FURNITURE: ReadonlySet<FurnitureId> = new Set<FurnitureId>([
  'ghostStories',
  'moonBouquet',
  'coffinCake',
  'broomstick',
  'boneGnome',
  'codyPortrait',
  'birthdayCake',
  'lunaMothLamp',
  'curiosityCabinet',
  'foreverOrbs',
  'floatingCandles',
  'wingbackChair',
  'roseBucket',
  'pawPrintRug',
  'potionShelf',
  'witchHatLamp',
  'seedlingTray',
  'skullPlanter',
  'velvetSettee',
  'stainedGlass',
  'cupcakeTower',
  'mummyTeapot',
  'workbench',
  'stumpStool',
  'jackOLantern',
  'roseVase',
  'pressedFlowers',
  'stoneHearth',
  'moonflowerLamp',
  'candyCornWreath',
  'hostaPlanter',
  'littleGargoyle',
  'blueRoseDome',
  'longNeckYoshi',
  'butterflyFrame',
  'rhinestoneGuitar',
  'pepperGarland',
]);

/** How many world pixels a pixel of a piece of furniture's grid is. */
export function furnitureScale(id: FurnitureId): number {
  return OLD_FURNITURE.has(id) ? OLD : 1;
}
