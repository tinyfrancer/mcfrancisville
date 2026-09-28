import { TILE_SIZE } from '../config/world';
import { CRITTER_ART } from '../sprites/critters';
import { bake } from '../sprites/bake';
import { isOut } from '../systems/critters';
import { tileHash } from '../sprites/terrain';
import type { TileMap } from '../systems/grid';
import type { Drawable } from './scene';

/** Where a butterfly flutters round, and how: a centre, how far it strays, and its own rhythm. */
export interface Flutter {
  x: number;
  y: number;
  reach: number;
  speed: number;
  phase: number;
}

/**
 * Where a place's monarchs flutter (personal_touches.md, "Places": orange and black monarch
 * butterflies, everywhere): round its flower patches and over its buildings, spread from the map
 * the same way every time. They're only to be seen, so nothing in the world knows of them.
 */
export function fluttersOf(map: TileMap, count: number): Flutter[] {
  const anchors = [
    ...map.patches.map((p) => ({ x: p.tx * TILE_SIZE + 16, y: p.ty * TILE_SIZE })),
    ...map.props
      .filter((p) => p.w * p.h >= 2)
      .map((p) => ({ x: (p.tx + p.w / 2) * TILE_SIZE, y: p.ty * TILE_SIZE })),
  ];
  if (anchors.length === 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const h = tileHash(i * 7 + 3, count);
    const at = anchors[h % anchors.length]!;
    return {
      x: at.x + ((h >>> 8) % 40) - 20,
      y: at.y + ((h >>> 14) % 24) - 12,
      reach: 20 + ((h >>> 4) % 28),
      speed: 0.6 + ((h >>> 20) % 50) / 100,
      phase: (h % 628) / 100,
    };
  });
}

/** Each butterfly where it is now, looping round its centre and flapping, while monarchs are out. */
export function butterflyDrawables(flutters: readonly Flutter[], nowMs: number, hour: number) {
  if (!isOut('monarch', hour)) return [];
  const art = CRITTER_ART.monarch;
  return flutters.map((f): Drawable => {
    const t = (nowMs / 1000) * f.speed + f.phase;
    const x = Math.round(f.x + Math.sin(t) * f.reach + Math.sin(t * 2.3) * 6);
    const y = Math.round(f.y + Math.cos(t * 0.8) * f.reach * 0.45 + Math.sin(t * 3.1) * 4);
    const frame = Math.floor(nowMs / 140 + f.phase * 10) % 2;
    const sprite = bake(`butterfly:${frame}`, art.frames[frame]!, art.palette);
    // Always aloft, over whatever stands below.
    return { footY: y + 48, sprite, x: x - 8, y: y - 8 };
  });
}
