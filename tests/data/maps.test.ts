import { describe, expect, it } from 'vitest';
import { PATCHES } from '../../src/data/gathering';
import { PROP_FOOTPRINT, TOWN } from '../../src/data/maps';
import { parseMap, walkable } from '../../src/systems/grid';
import { PROP_ART } from '../../src/sprites/props';
import { TILE_SIZE } from '../../src/config/world';
import { propScale } from '../../src/render/legacy';
import type { PropId } from '../../src/types/ids';
import { exitAt } from '../../src/systems/zones';
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

  it('is closed in by solid ground all round its edge, but for its ways out', () => {
    const shut = (tx: number, ty: number) =>
      !walkable(map, tx, ty) || exitAt(map.exits, { tx, ty });
    for (let tx = 0; tx < map.width; tx++) {
      expect(shut(tx, 0)).toBeTruthy();
      expect(shut(tx, map.height - 1)).toBeTruthy();
    }
    for (let ty = 0; ty < map.height; ty++) {
      expect(shut(0, ty)).toBeTruthy();
      expect(shut(map.width - 1, ty)).toBeTruthy();
    }
  });

  it('spawns her on open ground right in front of her door', () => {
    const { tx, ty } = map.spawn;
    expect(walkable(map, tx, ty)).toBe(true);
    const home = map.props.find((p) => p.id === 'homeHouse')!;
    expect(ty).toBe(home.ty + home.h);
    expect(tx).toBe(home.tx + Math.floor(home.w / 2));
  });

  /** Every walkable tile she can't reach from her door, with `blocked` standing in the way too. */
  function stranded(blocked: (tx: number, ty: number) => boolean = () => false): string[] {
    const open = (tx: number, ty: number) => walkable(map, tx, ty) && !blocked(tx, ty);
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
        if (open(nx, ny) && !seen.has(at)) {
          seen.add(at);
          queue.push({ tx: nx, ty: ny });
        }
      }
    }
    const lost: string[] = [];
    for (let ty = 0; ty < map.height; ty++) {
      for (let tx = 0; tx < map.width; tx++) {
        if (open(tx, ty) && !seen.has(ty * map.width + tx)) lost.push(`${tx},${ty}`);
      }
    }
    return lost;
  }

  it('has nowhere walkable that she cannot reach', () => {
    expect(stranded()).toEqual([]);
  });

  it('has lots for the pop-up shop on open ground, each with a door she can reach', () => {
    const { w, h } = PROP_FOOTPRINT.popUpShop;
    expect(map.popUpLots.length).toBeGreaterThanOrEqual(4);
    for (const lot of map.popUpLots) {
      const label = `${lot.tx},${lot.ty}`;
      const inside = (tx: number, ty: number) =>
        tx >= lot.tx && tx < lot.tx + w && ty >= lot.ty && ty < lot.ty + h;
      for (let ty = lot.ty; ty < lot.ty + h; ty++) {
        for (let tx = lot.tx; tx < lot.tx + w; tx++) {
          expect(walkable(map, tx, ty), `${label}: ${tx},${ty}`).toBe(true);
          expect(
            map.patches.some((p) => p.tx === tx && p.ty === ty),
            label,
          ).toBe(false);
          expect(
            map.snackSpots.some((p) => p.tx === tx && p.ty === ty),
            label,
          ).toBe(false);
        }
      }
      expect(walkable(map, lot.tx + 1, lot.ty + h), `${label}: door`).toBe(true);
      // With the shop standing there, the rest of town is still all within her reach.
      expect(stranded(inside), label).toEqual([]);
    }
  });

  it('leaves the night snack only where she can walk to it, and not on flowers', () => {
    expect(map.snackSpots.length).toBeGreaterThan(0);
    for (const spot of map.snackSpots) {
      expect(walkable(map, spot.tx, spot.ty), `${spot.tx},${spot.ty}`).toBe(true);
      expect(map.patches.some((p) => p.tx === spot.tx && p.ty === spot.ty)).toBe(false);
    }
  });

  it('grows every kind of wildflower, and has trees and rocks to gather from', () => {
    for (const id of Object.keys(PATCHES)) {
      expect(
        map.patches.some((p) => p.id === id),
        id,
      ).toBe(true);
    }
    expect(map.props.filter((p) => p.id === 'tree').length).toBeGreaterThan(10);
    expect(map.props.filter((p) => p.id === 'rock').length).toBeGreaterThan(3);
  });

  it('has garden beds she can reach, each from beside it', () => {
    expect(map.beds.length).toBeGreaterThanOrEqual(12);
    for (const { tx, ty } of map.beds) {
      expect(walkable(map, tx, ty), `${tx},${ty}`).toBe(false);
      const beside = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ].some(([dx, dy]) => walkable(map, tx + dx!, ty + dy!));
      expect(beside, `${tx},${ty}`).toBe(true);
    }
  });

  it('grows hostas along the farm, with one rose bush and a sign at the gate', () => {
    expect(map.props.filter((p) => p.id === 'roseBush')).toHaveLength(1);
    expect(map.props.filter((p) => p.id === 'farmSign')).toHaveLength(1);
    expect(map.props.filter((p) => p.id === 'hosta').length).toBeGreaterThan(3);
    // The sign stands in the fence, beside the gap she walks in through.
    const sign = map.props.find((p) => p.id === 'farmSign')!;
    expect(walkable(map, sign.tx + 1, sign.ty) || walkable(map, sign.tx - 1, sign.ty)).toBe(true);
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
    for (const [id, { w }] of Object.entries(PROP_FOOTPRINT) as [PropId, { w: number }][]) {
      const width = PROP_ART[id].source.rows[0]!.length * propScale(id);
      expect(width, id).toBeGreaterThanOrEqual(w * TILE_SIZE);
    }
  });
});
