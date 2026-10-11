import { doorStep, PROP_FOOTPRINT } from '../data/maps';
import { MID, WORN, type LawnField } from '../sprites/lawn';
import { tileHash } from '../sprites/terrain';
import type { TileMap } from '../systems/grid';
import type { PropId } from '../types/ids';

/*
 * Which tone each corner of a place's lawn takes (V1's L2, decision 293), worked out once from
 * its map when its ground is made: low-frequency noise over the world's tiles for the dark, mid
 * and light greens, so tones lie in soft blobs several tiles across; the shade of every tree's
 * crown round its foot; and the grass trodden thin in front of every door, at a gate and round a
 * well. The ground is baked from it (`sprites/lawn.ts`), never drawn per frame.
 */

/** How far apart the noise's knots are, in tiles: the coarse blobs and the finer ones on them. */
const COARSE = 6;
const FINE = 2.5;

/** Where the noise steps from dark to mid and mid to light: about a third of the lawn each. */
const DARK_BELOW = -0.1;
const LIGHT_ABOVE = 0.12;

/** A tree's shade round its foot, in tiles across (and three-quarters of that down), by tree. */
const SHADE: Partial<Record<PropId, number>> = {
  tree: 1.5,
  oldTree: 2.6,
  willow: 2.8,
  appleTree: 1.3,
  pearTree: 1.3,
  plumTree: 1.3,
  persimmonTree: 1.3,
  candyTree: 1.1,
};

/** What wears the grass round it, and how far, in tiles from its edge. */
const TRODDEN: Partial<Record<PropId, number>> = { well: 1.3, farmWell: 1.3 };
/** How far the grass is worn round a door's step and a gate's way through, in tiles. */
const DOOR_WEAR = 1.8;

function knot(x: number, y: number): number {
  return (tileHash(x * 7 + 3, y * 13 + 11) / 0xffffffff) * 2 - 1;
}

/** Smooth value noise from −1 to 1 at a point, knots `scale` apart, the same every time. */
function noise(x: number, y: number, scale: number): number {
  const gx = x / scale;
  const gy = y / scale;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const ease = (t: number) => t * t * (3 - 2 * t);
  const fx = ease(gx - x0);
  const fy = ease(gy - y0);
  const top = knot(x0, y0) * (1 - fx) + knot(x0 + 1, y0) * fx;
  const bottom = knot(x0, y0 + 1) * (1 - fx) + knot(x0 + 1, y0 + 1) * fx;
  return top * (1 - fy) + bottom * fy;
}

/** The lawn's green at a corner from the noise alone: dark, mid or light. */
export function toneOfNoise(cx: number, cy: number): number {
  const n = noise(cx, cy, COARSE) * 0.7 + noise(cx + 101, cy + 57, FINE) * 0.3;
  return n < DARK_BELOW ? 1 : n > LIGHT_ABOVE ? 3 : MID;
}

/** A box of tiles' distance from a point, in tiles: zero inside it. */
function fromBox(x: number, y: number, box: { tx: number; ty: number; w: number; h: number }) {
  const dx = Math.max(box.tx - x, 0, x - (box.tx + box.w));
  const dy = Math.max(box.ty - y, 0, y - (box.ty + box.h));
  return Math.hypot(dx, dy);
}

/** A place's lawn, a tone at every corner of its tiles. */
export function lawnOf(map: TileMap): LawnField {
  const cols = map.width + 1;
  const tones = new Uint8Array(cols * (map.height + 1));
  for (let cy = 0; cy <= map.height; cy++) {
    for (let cx = 0; cx <= map.width; cx++) tones[cy * cols + cx] = toneOfNoise(cx, cy);
  }
  const each = (
    box: { x0: number; y0: number; x1: number; y1: number },
    within: (cx: number, cy: number) => boolean,
    tone: number,
  ) => {
    for (let cy = Math.max(0, Math.floor(box.y0)); cy <= Math.min(map.height, box.y1); cy++) {
      for (let cx = Math.max(0, Math.floor(box.x0)); cx <= Math.min(map.width, box.x1); cx++) {
        if (within(cx, cy)) tones[cy * cols + cx] = tone;
      }
    }
  };
  // The shade round each tree's foot, a little to the right, as its shadow falls.
  for (const p of map.props) {
    const r = SHADE[p.id];
    if (r === undefined) continue;
    const fx = p.tx + p.w / 2 + 0.25;
    const fy = p.ty + p.h - 0.2;
    const ry = r * 0.75;
    each(
      { x0: fx - r, y0: fy - ry, x1: fx + r, y1: fy + ry },
      (cx, cy) => ((cx - fx) / r) ** 2 + ((cy - fy) / ry) ** 2 <= 1,
      0,
    );
  }
  // Worn where she and everyone else walk most: a door's step, a gate's way, round a well.
  const worn: { tx: number; ty: number; w: number; h: number; reach: number }[] = [];
  for (const p of map.props) {
    if (PROP_FOOTPRINT[p.id].door !== undefined) {
      worn.push({ ...doorStep(p), w: 1, h: 1, reach: DOOR_WEAR });
    }
    const round = TRODDEN[p.id];
    if (round !== undefined) worn.push({ tx: p.tx, ty: p.ty, w: p.w, h: p.h, reach: round });
  }
  for (const e of map.exits) if (e.gate) worn.push({ ...e, reach: DOOR_WEAR });
  for (const w of worn) {
    each(
      {
        x0: w.tx - w.reach,
        y0: w.ty - w.reach,
        x1: w.tx + w.w + w.reach,
        y1: w.ty + w.h + w.reach,
      },
      (cx, cy) => fromBox(cx, cy, w) <= w.reach - 0.5,
      WORN,
    );
  }
  return {
    corner: (cx, cy) =>
      cx < 0 || cy < 0 || cx > map.width || cy > map.height ? MID : tones[cy * cols + cx]!,
  };
}
