import type { ClutterRule, DecalId } from '../data/clutter';
import { tileHash } from '../sprites/terrain';
import { tileAt, type TileMap } from '../systems/grid';

/** A decal on a tile, and which of its looks. */
export interface Decal {
  tx: number;
  ty: number;
  decal: DecalId;
  look: number;
}

/**
 * Where a place's decals lie (phase L): each tile takes the first of `rules` that lands on it by
 * its hash, never under something standing, on flowers or on a garden bed. Worked out once, when
 * the ground is baked, and the same every time.
 */
export function decalsOf(
  map: TileMap,
  rules: readonly ClutterRule[],
  looks: (d: DecalId) => number,
): Decal[] {
  const standing = new Set<string>();
  for (const p of map.props) {
    for (let y = p.ty; y < p.ty + p.h; y++)
      for (let x = p.tx; x < p.tx + p.w; x++) standing.add(`${x},${y}`);
  }
  const near = new Map<string, Set<string>>();
  const besides = (ids: readonly string[]) => {
    const key = ids.join();
    let found = near.get(key);
    if (!found) {
      found = new Set();
      for (const p of map.props.filter((q) => ids.includes(q.id))) {
        for (let y = p.ty - 1; y <= p.ty + p.h; y++)
          for (let x = p.tx - 1; x <= p.tx + p.w; x++) found.add(`${x},${y}`);
      }
      near.set(key, found);
    }
    return found;
  };
  const skip = new Set([...standing, ...map.patches.map((p) => `${p.tx},${p.ty}`)]);
  const decals: Decal[] = [];
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      const key = `${tx},${ty}`;
      if (skip.has(key)) continue;
      const tile = tileAt(map, tx, ty);
      // Something afloat keeps off the bank, which rounds in over the water's edge (V1's L6).
      if (tile === 'water' && !onOpenWater(map, tx, ty)) continue;
      for (const [i, rule] of rules.entries()) {
        if (rule.on !== tile) continue;
        if (rule.near && !besides(rule.near).has(key)) continue;
        const h = tileHash(tx * 13 + i * 101, ty * 7 + 17);
        if (h % rule.oneIn !== 0) continue;
        decals.push({ tx, ty, decal: rule.decal, look: (h >>> 8) % looks(rule.decal) });
        break;
      }
    }
  }
  return decals;
}

/** Whether a tile of water has water on all four sides, and so no bank across it. */
function onOpenWater(map: TileMap, tx: number, ty: number): boolean {
  return [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ].every(([dx, dy]) => {
    const id = tileAt(map, tx + dx!, ty + dy!);
    return id === 'water' || id === 'ice' || id === 'boards' || id === undefined;
  });
}
