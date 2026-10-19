import { describe, expect, it } from 'vitest';
import { CLUTTER } from '../../src/data/clutter';
import { TOWN } from '../../src/data/maps';
import type { SeasonId } from '../../src/data/seasons';
import { ZONES } from '../../src/data/zones';
import { lawnOf } from '../../src/render/lawn';
import { overview } from '../../src/render/overview';
import { lookOf } from '../../src/sprites/props';
import { PUMPKIN_LIT, SNOW_LANTERN_FORMS } from '../../src/sprites/townProps';
import {
  seasonLook,
  seasonPieces,
  SEASON_TONES,
  turnsWithSeasons,
} from '../../src/sprites/seasons';
import { groundPieces } from '../../src/sprites/terrain';
import { parseMap, tileAt } from '../../src/systems/grid';
import type { MapZoneId, TileId } from '../../src/types/ids';

const SEASONS: readonly SeasonId[] = ['winter', 'spring', 'summer', 'autumn'];

const town = parseMap(TOWN);
const lawn = lawnOf(town);
const at = (tx: number, ty: number) => tileAt(town, tx, ty);

/** The first tile of a kind in the town. */
function first(kind: TileId): { tx: number; ty: number } {
  for (let ty = 0; ty < town.height; ty++)
    for (let tx = 0; tx < town.width; tx++) if (at(tx, ty) === kind) return { tx, ty };
  throw new Error(`no ${kind}`);
}

describe('the seasons on the ground', () => {
  it('gives the lawn its own colours in every season', () => {
    const fills = SEASONS.map((s) => SEASON_TONES[s].mid.fill);
    expect(new Set(fills).size).toBe(SEASONS.length);
  });

  it('bakes a tile of grass, a hedge and long grass under a key and palette of each season', () => {
    for (const kind of ['grass', 'hedge'] as const) {
      const { tx, ty } = first(kind);
      const pieces = SEASONS.map((s) => seasonPieces(at, tx, ty, lawn, s, s === 'winter'));
      const top = pieces.map((p) => p[p.length - 1]!);
      expect(new Set(top.map((p) => p.key)).size, kind).toBe(SEASONS.length);
      const colours = top.map((p) => JSON.stringify(p.palette));
      expect(new Set(colours).size, kind).toBe(SEASONS.length);
    }
  });

  it('leaves autumn as the ground always was', () => {
    const { tx, ty } = first('grass');
    expect(seasonPieces(at, tx, ty, lawn, 'autumn', false)).toEqual(groundPieces(at, tx, ty, lawn));
  });

  it('drifts snow onto a track in winter, and only in winter', () => {
    const { tx, ty } = first('path');
    const snowOn = (s: SeasonId) =>
      seasonPieces(at, tx, ty, lawn, s, s === 'winter').some((p) =>
        p.key.startsWith('ground:snow'),
      );
    expect(snowOn('winter')).toBe(true);
    for (const s of ['spring', 'summer', 'autumn'] as const) expect(snowOn(s), s).toBe(false);
  });

  // `tests/render/lawn.test.ts` holds each place's overview to it; a winter all one white mustn't.
  it.each(
    Object.entries(ZONES).flatMap(([id, z]) => (z.map ? [[id as MapZoneId, z.map] as const] : [])),
  )("keeps %s's commonest colour under a quarter of its pixels under snow", (id, source) => {
    const { data, width, height } = overview(source, CLUTTER[id], 'winter');
    const counts = new Map<number, number>();
    for (let i = 0; i < data.length; i += 4) {
      const rgb = (data[i]! << 16) | (data[i + 1]! << 8) | data[i + 2]!;
      counts.set(rgb, (counts.get(rgb) ?? 0) + 1);
    }
    expect(Math.max(...counts.values()) / (width * height)).toBeLessThan(0.25);
  });
});

describe('the seasons on what stands', () => {
  const trees = town.props.filter((p) => p.id === 'tree');

  it('turns every tree in each season but autumn, which is as it always was', () => {
    for (const tree of trees) {
      const looks = SEASONS.map((s) => seasonLook(tree, s));
      const autumn = looks[SEASONS.indexOf('autumn')]!;
      expect(autumn).toEqual(lookOf(tree));
      expect(new Set(looks.map((l) => l.key)).size).toBeGreaterThanOrEqual(3);
      expect(looks[SEASONS.indexOf('winter')]!.key).toMatch(/@winter$/);
    }
  });

  it('blossoms pink and white on the trees and the orchard in spring', () => {
    const blossom = (p: { palette: Record<string, string | null> }) => p.palette[3];
    const pinks = new Set(trees.map((t) => blossom(seasonLook(t, 'spring'))));
    expect(pinks.size).toBeGreaterThan(1);
    const orchard = parseMap(ZONES.booAcres.map!).props.filter((p) => p.id.endsWith('Tree'));
    expect(orchard.length).toBeGreaterThan(0);
    for (const tree of orchard) {
      expect(seasonLook(tree, 'spring').key).toMatch(/@spring$/);
      expect(seasonLook(tree, 'spring').palette[3]).not.toBe(seasonLook(tree, 'autumn').palette[3]);
    }
  });

  // 1.1's A2 (decision 351): the broken tree's heartwood takes a cap of snow, as a roof does.
  it('caps the broken tree’s break with snow in winter, and only then', () => {
    const broken = town.props.find((p) => p.id === 'tree' && lookOf(p).form === 8)!;
    expect(broken).toBeDefined();
    expect(lookOf(broken).source.rows.some((row) => row.includes('x'))).toBe(true);
    const snow = seasonLook(broken, 'winter').palette.x;
    for (const s of ['spring', 'summer', 'autumn'] as const) {
      expect(seasonLook(broken, s).palette.x, s).not.toBe(snow);
    }
    expect(snow).toBe(seasonLook(broken, 'winter').palette[3]);
  });

  it('lays snow on the roofs in winter, but not on a pumpkin with no roof', () => {
    const house = town.props.find((p) => p.id === 'homeHouse')!;
    expect(seasonLook(house, 'winter').key).toMatch(/@winter$/);
    expect(seasonLook(house, 'summer').key).not.toMatch(/@/);
    expect(turnsWithSeasons('gourdonHouse')).toBe(false);
    expect(turnsWithSeasons('well')).toBe(true);
  });

  // 1.0.1 (decision 327): no jack-o'-lantern sits in the snow.
  it('makes the jack-o-lanterns snow lanterns in winter, each its own face, lit as before', () => {
    const lanterns = town.props.filter((p) => p.id === 'pumpkin');
    expect(lanterns.length).toBeGreaterThan(0);
    expect(turnsWithSeasons('pumpkin')).toBe(true);
    const faces = new Set<number>();
    for (const lantern of lanterns) {
      const carved = lookOf(lantern);
      for (const s of ['spring', 'summer', 'autumn'] as const) {
        expect(seasonLook(lantern, s), s).toEqual(carved);
      }
      const winter = seasonLook(lantern, 'winter');
      expect(winter.key).toBe(`${carved.key}@winter`);
      expect(winter.form).toBe(carved.form);
      expect(winter.source).toBe(SNOW_LANTERN_FORMS[carved.form]);
      expect(winter.source).not.toBe(carved.source);
      faces.add(winter.form);
      // Its face is in the keys that glow after dark, as the pumpkin's is.
      const glows = Object.keys(PUMPKIN_LIT);
      expect(winter.source.rows.some((row) => glows.some((k) => row.includes(k)))).toBe(true);
    }
    expect(faces.size).toBeGreaterThan(1);
  });
});
