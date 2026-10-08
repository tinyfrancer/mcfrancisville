import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../../src/config/world';
import { TOWN, LANTERN_SHORE, WHISPERWOOD } from '../../src/data/maps';
import { lifeOf } from '../../src/render/life';
import { parseMap, tileAt } from '../../src/systems/grid';

const town = parseMap(TOWN);
const life = lifeOf(town);

describe('the life of a place', () => {
  it('grows long grass on about one grass tile in four, only on open grass', () => {
    const grass = town.tiles.filter((t) => t === 'grass').length;
    expect(life.tufts.length).toBeGreaterThan(grass * 0.12);
    expect(life.tufts.length).toBeLessThan(grass * 0.3);
    const patches = new Set(town.patches.map((p) => `${p.tx},${p.ty}`));
    const lawn = ['grass', 'meadow', 'longGrass'];
    for (const t of life.tufts) {
      const tx = Math.floor(t.x / TILE_SIZE);
      const ty = Math.floor((t.y - 1) / TILE_SIZE);
      expect(lawn).toContain(tileAt(town, tx, ty));
      expect(patches.has(`${tx},${ty}`)).toBe(false);
      expect(
        town.props.some((p) => tx >= p.tx && tx < p.tx + p.w && ty >= p.ty && ty < p.ty + p.h),
      ).toBe(false);
    }
  });

  it('grows a tuft on every tile of long grass she can walk on, and more of them in a meadow', () => {
    const tuftsOn = (id: string) =>
      life.tufts.filter(
        (t) => tileAt(town, Math.floor(t.x / TILE_SIZE), Math.floor((t.y - 1) / TILE_SIZE)) === id,
      ).length;
    const count = (id: string) => town.tiles.filter((t) => t === id).length;
    expect(tuftsOn('longGrass')).toBeGreaterThanOrEqual(count('longGrass'));
    expect(tuftsOn('meadow') / count('meadow')).toBeGreaterThan(tuftsOn('grass') / count('grass'));
  });

  it('puts smoke on the chimneys of her house, the bakery, Barty and Cody', () => {
    expect(life.chimneys).toHaveLength(5);
    const house = town.props.find((p) => p.id === 'homeHouse')!;
    const top = life.chimneys.find(
      (c) => c.x > house.tx * TILE_SIZE && c.x < (house.tx + house.w) * TILE_SIZE,
    )!;
    expect(top.y).toBeLessThan(house.ty * TILE_SIZE);
  });

  it('glints on open water and ice, never under something standing in it', () => {
    expect(life.water.filter((w) => !w.ice).length).toBeGreaterThan(40);
    expect(lifeOf(parseMap(WHISPERWOOD)).water.every((w) => w.ice)).toBe(true);
    const shore = parseMap(LANTERN_SHORE);
    const standing = new Set(shore.props.map((p) => `${p.tx},${p.ty}`));
    for (const w of lifeOf(shore).water) expect(standing.has(`${w.tx},${w.ty}`)).toBe(false);
  });
});
