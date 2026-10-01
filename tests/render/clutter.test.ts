import { describe, expect, it } from 'vitest';
import { CLUTTER } from '../../src/data/clutter';
import { ZONES } from '../../src/data/zones';
import { decalsOf } from '../../src/render/clutter';
import { DECAL_ART } from '../../src/sprites/clutter';
import { parseMap, tileAt } from '../../src/systems/grid';
import type { MapZoneId } from '../../src/types/ids';

const PLACES = (Object.keys(CLUTTER) as MapZoneId[]).map((id) => {
  const map = parseMap(ZONES[id].map!);
  return { id, map, decals: decalsOf(map, CLUTTER[id], (d) => DECAL_ART[d].length) };
});

describe('the clutter on the ground', () => {
  it('scatters something in every place outdoors', () => {
    for (const { id, decals } of PLACES) expect(decals.length, id).toBeGreaterThan(10);
  });

  it('lies only on its own ground, never under a prop or on flowers', () => {
    for (const { id, map, decals } of PLACES) {
      const patches = new Set(map.patches.map((p) => `${p.tx},${p.ty}`));
      for (const d of decals) {
        const ons = CLUTTER[id].filter((r) => r.decal === d.decal).map((r) => r.on);
        expect(ons, `${id} ${d.decal}`).toContain(tileAt(map, d.tx, d.ty));
        expect(patches.has(`${d.tx},${d.ty}`)).toBe(false);
        const under = map.props.some(
          (p) => d.tx >= p.tx && d.tx < p.tx + p.w && d.ty >= p.ty && d.ty < p.ty + p.h,
        );
        expect(under, `${id} ${d.decal} at ${d.tx},${d.ty}`).toBe(false);
        expect(d.look).toBeLessThan(DECAL_ART[d.decal].length);
      }
    }
  });

  it('drops fallen leaves only beside the trees, and round the well', () => {
    for (const { map, decals } of PLACES) {
      for (const d of decals.filter((d) => d.decal === 'leaves')) {
        const tree = map.props.some(
          (p) =>
            ['tree', 'oldTree', 'willow', 'well'].includes(p.id) &&
            d.tx >= p.tx - 1 &&
            d.tx <= p.tx + p.w &&
            d.ty >= p.ty - 1 &&
            d.ty <= p.ty + p.h,
        );
        expect(tree).toBe(true);
      }
    }
  });

  it('is the same every time', () => {
    const { map, id } = PLACES[0]!;
    expect(decalsOf(map, CLUTTER[id], (d) => DECAL_ART[d].length)).toEqual(PLACES[0]!.decals);
  });
});
