import type { Raster } from './sprite';

/** A piece of the scale sheet: art at the new density, to be judged before the redraw goes on. */
export interface SheetPiece {
  name: string;
  draw: () => Raster;
}

export const SCALE_SHEET: readonly SheetPiece[] = [];
