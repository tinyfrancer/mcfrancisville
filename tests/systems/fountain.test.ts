import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { parseMap } from '../../src/systems/grid';
import { byFountain, fountainLit } from '../../src/systems/fountain';

describe("the fountain's music box (0.2's H2)", () => {
  const map = parseMap(TOWN);
  const fountain = map.props.find((p) => p.id === 'fountain')!;
  const at = (tx: number, ty: number) => map.tiles[ty * map.width + tx];

  it('plays after dark only, once its lamps are lit', () => {
    expect(fountainLit(12)).toBe(false);
    expect(fountainLit(17)).toBe(false);
    expect(fountainLit(19)).toBe(true);
    expect(fountainLit(23.5)).toBe(true);
    expect(fountainLit(3)).toBe(true);
    expect(fountainLit(7.5)).toBe(false);
  });

  it('is heard from anywhere on the bank round its pond, and not from the square', () => {
    expect(fountain).toBeDefined();
    let banks = 0;
    for (let ty = 1; ty < map.height - 1; ty++) {
      for (let tx = 1; tx < map.width - 1; tx++) {
        if (map.solid[ty * map.width + tx]) continue;
        const touches = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => at(tx + dx!, ty + dy!) === 'water');
        const near = Math.abs(tx - fountain.tx) < 10 && Math.abs(ty - fountain.ty) < 10;
        if (!touches || !near) continue;
        banks++;
        expect(byFountain(map.props, { tx, ty }), `${tx},${ty}`).toBe(true);
      }
    }
    expect(banks).toBeGreaterThan(10);
    expect(byFountain(map.props, map.spawn)).toBe(false);
    expect(byFountain(map.props, { tx: fountain.tx + 12, ty: fountain.ty })).toBe(false);
  });
});
