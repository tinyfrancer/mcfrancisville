import { describe, expect, it } from 'vitest';
import { CLUTTER } from '../../src/data/clutter';
import { doorStep, PROP_FOOTPRINT, TOWN } from '../../src/data/maps';
import { lawnOf, toneOfNoise } from '../../src/render/lawn';
import { overview } from '../../src/render/overview';
import { blendAt, MID, toneAt, WORN } from '../../src/sprites/lawn';
import { parseMap } from '../../src/systems/grid';
import { ZONES } from '../../src/data/zones';
import type { MapZoneId } from '../../src/types/ids';

describe('the lawn', () => {
  const town = parseMap(TOWN);
  const lawn = lawnOf(town);

  // The plan's test is the town's (42% before, 15% after); every place outdoors is held to it.
  it.each(
    Object.entries(ZONES).flatMap(([id, z]) => (z.map ? [[id as MapZoneId, z.map] as const] : [])),
  )("keeps %s's single most common colour under a quarter of its pixels", (id, source) => {
    const { data, width, height } = overview(source, CLUTTER[id]);
    const counts = new Map<number, number>();
    for (let i = 0; i < data.length; i += 4) {
      const rgb = (data[i]! << 16) | (data[i + 1]! << 8) | data[i + 2]!;
      counts.set(rgb, (counts.get(rgb) ?? 0) + 1);
    }
    const most = Math.max(...counts.values());
    expect(most / (width * height)).toBeLessThan(0.25);
  });

  it('lays the dark, mid and light greens in blobs of about a third each', () => {
    const seen = [0, 0, 0, 0];
    let changes = 0;
    for (let y = 0; y < 60; y++) {
      for (let x = 0; x < 60; x++) {
        const t = toneOfNoise(x, y);
        seen[t]!++;
        if (x > 0 && t !== toneOfNoise(x - 1, y)) changes++;
      }
    }
    for (const t of [1, 2, 3]) expect(seen[t]! / 3600, `tone ${t}`).toBeGreaterThan(0.2);
    for (const t of [1, 2, 3]) expect(seen[t]! / 3600, `tone ${t}`).toBeLessThan(0.47);
    // Low frequency: along a row the tone changes about once every few tiles, not every tile.
    expect(changes / (60 * 59)).toBeLessThan(0.3);
  });

  it('shades the grass under every tree and wears it thin at every door', () => {
    for (const p of town.props.filter((q) => q.id === 'tree')) {
      expect(lawn.corner(p.tx + 1, p.ty + 1), `tree ${p.tx},${p.ty}`).toBe(0);
    }
    const doors = town.props.filter((p) => PROP_FOOTPRINT[p.id].door !== undefined);
    expect(doors.length).toBeGreaterThan(5);
    for (const p of doors) {
      const step = doorStep(p);
      expect(lawn.corner(step.tx, step.ty + 1), `door of ${p.id}`).toBe(WORN);
    }
    // Off the map, the lawn is the plain mid green.
    expect(lawn.corner(-3, 4)).toBe(MID);
  });

  it('blends a tile into the next with no seam, and steps between tones in a few pixels', () => {
    const left = [1, 3, 1, 3];
    const right = [3, 2, 3, 2];
    for (let y = 0; y < 32; y++) {
      expect(Math.abs(blendAt(left, 31, y) - blendAt(right, 0, y))).toBeLessThan(0.1);
    }
    // Where two corners agree, the edge between them is that tone throughout.
    for (let x = 0; x < 32; x++) expect(toneAt([2, 2, 1, 3], x, 0)).toBe(2);
  });
});
