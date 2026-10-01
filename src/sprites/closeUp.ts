import type { Slot } from '../types/ids';
import type { Look } from '../types/look';
import { dollLayers } from './doll';
import { rasterizeLayers, type Raster } from './sprite';

/** A square of her picture (hat room and all), framed on a piece she's wearing. */
export interface CloseUp {
  x: number;
  y: number;
  /** Each goes into the closet's 48-pixel picture a whole number of times. */
  size: 16 | 24 | 48;
}

/**
 * Where a piece sits on her, framed to the piece itself (0.2's K2): the pixels that change when
 * she takes it off, centred, at the smallest side that holds them. Shoes and a necklace come
 * close, a dress further out, and a hat is the hat rather than mostly her face.
 */
export function closeUpOf(look: Look, slot: Slot): CloseUp {
  const on = rasterizeLayers(dollLayers(look, 'down', 0));
  const box = pieceBox(look, slot, on);
  if (!box) return { x: 4, y: on.height - 48 + 22, size: 24 };
  const long = Math.max(box.right - box.left, box.bottom - box.top) + 1;
  const short = Math.min(box.right - box.left, box.bottom - box.top) + 1;
  // A wide brim or a pair of wings may lose its tips at 24, rather than show all of her at 48.
  const size = long <= 16 ? 16 : short <= 24 && long <= 32 ? 24 : 48;
  const centre = (from: number, to: number) => Math.round((from + to + 1) / 2 - size / 2);
  return {
    x: clamp(centre(box.left, box.right), on.width, size),
    // Above her is clear air, so a hat is centred in its frame rather than pushed down onto her.
    y: Math.min(centre(box.top, box.bottom), clamp(centre(box.top, box.bottom), on.height, size)),
    size,
  };
}

/** The box round the pixels of her picture that a piece changes, or null if it changes none. */
export function pieceBox(
  look: Look,
  slot: Slot,
  on: Raster = rasterizeLayers(dollLayers(look, 'down', 0)),
): Box | null {
  const rest = { ...look.outfit };
  delete rest[slot];
  return changed(on, rasterizeLayers(dollLayers({ ...look, outfit: rest }, 'down', 0)));
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Kept on the picture where it fits; a frame wider than her is centred on her. */
function clamp(at: number, span: number, size: number): number {
  if (size >= span) return Math.round((span - size) / 2);
  return Math.min(Math.max(at, 0), span - size);
}

/** The box round every pixel of `on` that differs from `off`, both standing on the same feet. */
function changed(on: Raster, off: Raster): Box | null {
  const lift = on.height - off.height;
  let left = Infinity;
  let top = Infinity;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < on.height; y++) {
    for (let x = 0; x < on.width; x++) {
      const a = (y * on.width + x) * 4;
      const oy = y - lift;
      const b = oy >= 0 && oy < off.height ? (oy * off.width + x) * 4 : -1;
      let same = true;
      for (let k = 0; k < 4; k++) {
        const theirs = b < 0 ? 0 : off.data[b + k]!;
        if (on.data[a + k] !== theirs) same = false;
      }
      if (same) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return right < 0 ? null : { left, top, right, bottom };
}
