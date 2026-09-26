import { describe, expect, it } from 'vitest';
import { PROP_FOOTPRINT, TOWN } from '../../src/data/maps';
import { parseMap, walkable } from '../../src/systems/grid';
import { PROP_ART } from '../../src/sprites/props';
import { TILE_SIZE } from '../../src/config/world';
import { tinyMap } from '../world/harness';

describe('parseMap', () => {
  it('refuses a ragged row, an unknown character and a half-drawn prop', () => {
    expect(() => parseMap(tinyMap(['...', '..']))).toThrow(/row 1/);
    expect(() => parseMap(tinyMap(['..?']))).toThrow(/'\?'/);
    expect(() => parseMap(tinyMap(['.W.', '...']))).toThrow(/well/);
  });

  it('makes a prop solid over its whole footprint', () => {
    const map = parseMap(tinyMap(['.WW.', '.WW.', '....']));
    expect(map.props).toEqual([{ id: 'well', tx: 1, ty: 0, w: 2, h: 2 }]);
    expect(walkable(map, 2, 1)).toBe(false);
    expect(walkable(map, 3, 1)).toBe(true);
  });
});

describe('the town', () => {
  const map = parseMap(TOWN);

  it('is closed in by solid ground all round its edge', () => {
    for (let tx = 0; tx < map.width; tx++) {
      expect(walkable(map, tx, 0)).toBe(false);
      expect(walkable(map, tx, map.height - 1)).toBe(false);
    }
    for (let ty = 0; ty < map.height; ty++) {
      expect(walkable(map, 0, ty)).toBe(false);
      expect(walkable(map, map.width - 1, ty)).toBe(false);
    }
  });

  it('spawns her on open ground right in front of her door', () => {
    const { tx, ty } = map.spawn;
    expect(walkable(map, tx, ty)).toBe(true);
    const home = map.props.find((p) => p.id === 'homeHouse')!;
    expect(ty).toBe(home.ty + home.h);
    expect(tx).toBe(home.tx + Math.floor(home.w / 2));
  });

  it('has nowhere walkable that she cannot reach', () => {
    const seen = new Set<number>();
    const queue = [map.spawn];
    seen.add(map.spawn.ty * map.width + map.spawn.tx);
    while (queue.length > 0) {
      const { tx, ty } = queue.pop()!;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const nx = tx + dx;
        const ny = ty + dy;
        const at = ny * map.width + nx;
        if (walkable(map, nx, ny) && !seen.has(at)) {
          seen.add(at);
          queue.push({ tx: nx, ty: ny });
        }
      }
    }
    const stranded: string[] = [];
    for (let ty = 0; ty < map.height; ty++) {
      for (let tx = 0; tx < map.width; tx++) {
        if (walkable(map, tx, ty) && !seen.has(ty * map.width + tx)) stranded.push(`${tx},${ty}`);
      }
    }
    expect(stranded).toEqual([]);
  });

  it('has a shop, a salon, a home and a well, once each', () => {
    for (const id of ['homeHouse', 'shopHouse', 'salonHouse', 'well'] as const) {
      expect(
        map.props.filter((p) => p.id === id),
        id,
      ).toHaveLength(1);
    }
  });

  it('draws every prop at least as wide as the ground it stands on', () => {
    for (const [id, { w }] of Object.entries(PROP_FOOTPRINT)) {
      const width = PROP_ART[id as keyof typeof PROP_ART].source.rows[0]!.length;
      expect(width, id).toBe(w * TILE_SIZE);
    }
  });
});
