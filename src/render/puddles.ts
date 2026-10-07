import { TILE_SIZE } from '../config/world';
import { PUDDLE_ART } from '../sprites/puddles';
import { spriteSize } from '../sprites/sprite';
import { tileHash } from '../sprites/terrain';
import { tileAt, type TileMap } from '../systems/grid';

/** A puddle on a rainy day: the tile it lies in, which of the shapes, and where in the tile. */
export interface Puddle {
  tx: number;
  ty: number;
  look: number;
  x: number;
  y: number;
}

/** About one path tile in this many holds a puddle when it rains. */
const ONE_IN = 6;

/**
 * Where the puddles lie on a rainy day (V1's L3): on about one open path tile in six, the same
 * tiles every rainy day, never under something standing, each wholly inside its tile.
 */
export function puddlesOf(map: TileMap): Puddle[] {
  const covered = new Set<string>();
  for (const p of map.props) {
    for (let ty = p.ty; ty < p.ty + p.h; ty++) {
      for (let tx = p.tx; tx < p.tx + p.w; tx++) covered.add(`${tx},${ty}`);
    }
  }
  const puddles: Puddle[] = [];
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      if (tileAt(map, tx, ty) !== 'path' || covered.has(`${tx},${ty}`)) continue;
      const h = tileHash(tx * 3 + 1, ty * 7 + 5);
      if (h % ONE_IN !== 0) continue;
      const look = (h >>> 8) % PUDDLE_ART.length;
      const { width, height } = spriteSize(PUDDLE_ART[look]!);
      puddles.push({
        tx,
        ty,
        look,
        x: tx * TILE_SIZE + ((h >>> 12) % (TILE_SIZE - width + 1)),
        y: ty * TILE_SIZE + ((h >>> 20) % (TILE_SIZE - height + 1)),
      });
    }
  }
  return puddles;
}
