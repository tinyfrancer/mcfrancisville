import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS, type Habitat } from '../../src/data/critters';
import { ITEMS } from '../../src/data/items';
import { TOWN } from '../../src/data/maps';
import { ITEM_VALUE } from '../../src/data/shop';
import { dayKey } from '../../src/systems/clock';
import {
  CRITTERS_PER_HOUR,
  crittersOut,
  flutterTo,
  habitatsOf,
  hoursOf,
  isOut,
  townHabitats,
} from '../../src/systems/critters';
import { parseMap, walkable } from '../../src/systems/grid';
import { findPath, type Tile } from '../../src/systems/pathfinding';
import type { CritterId } from '../../src/types/ids';
import { tinyMap } from '../world/harness';

const map = parseMap(TOWN);
const habitats = townHabitats(map, true);

/** Two months of day keys. */
const DAYS = Array.from({ length: 60 }, (_, i) => dayKey(new Date(2026, 8, 26 + i, 12).getTime()));

describe('when critters are out', () => {
  it('reads their hours round midnight', () => {
    expect(isOut('lunaMoth', 20)).toBe(true);
    expect(isOut('lunaMoth', 3.9)).toBe(true);
    expect(isOut('lunaMoth', 4)).toBe(false);
    expect(isOut('lunaMoth', 12)).toBe(false);
    expect(isOut('lilyFrog', 6)).toBe(true);
    expect(isOut('lilyFrog', 19)).toBe(false);
    for (let h = 0; h < 24; h++) expect(isOut('ghostMinnow', h)).toBe(true);
    expect(isOut('firefly', 23.5)).toBe(true);
    expect(isOut('firefly', 0)).toBe(false);
  });

  it('says their hours as a clock would', () => {
    expect(hoursOf('lunaMoth')).toBe('8pm–4am');
    expect(hoursOf('ghostMinnow')).toBe('All day');
    expect(hoursOf('firefly')).toBe('7pm–midnight');
    expect(hoursOf('skullBeetle')).toBe('6am–5pm');
  });

  it('keeps the luna moth and the orbs to the night', () => {
    for (const id of ['lunaMoth', 'greenOrb', 'blueOrb', 'orbPair'] as CritterId[]) {
      for (let h = 7; h < 19; h++) expect(isOut(id, h), `${id} ${h}:00`).toBe(false);
    }
  });

  it('has at least four kinds about at every hour, day or night', () => {
    for (let h = 0; h < 24; h++) {
      const about = CRITTER_IDS.filter((id) => isOut(id, h));
      expect(about.length, `${h}:00`).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('the critters', () => {
  it('are each something for her bag, with a value', () => {
    for (const id of CRITTER_IDS) {
      expect(ITEMS[id].kind).toBe('critter');
      expect(ITEMS[id].name).toBe(CRITTERS[id].name);
      expect(ITEM_VALUE[id]).toBeGreaterThan(0);
    }
  });

  it('number between fifteen and twenty, a luna moth, and green, blue and paired orbs', () => {
    expect(CRITTER_IDS.length).toBeGreaterThanOrEqual(15);
    expect(CRITTER_IDS.length).toBeLessThanOrEqual(20);
    expect(CRITTERS.orbPair.rarity).toBe('rare');
    expect(CRITTERS.orbPair.description).toMatch(/green/);
    expect(CRITTERS.orbPair.description).toMatch(/blue/);
    expect(CRITTERS.lunaMoth.family).toBe('moth');
  });

  it('are only wary when they are rare', () => {
    for (const id of CRITTER_IDS) {
      if (CRITTERS[id].wary > 0) expect(CRITTERS[id].rarity, id).toBe('rare');
    }
  });
});

describe('the habitats', () => {
  it('each have room for a few critters in the town', () => {
    for (const [habitat, tiles] of Object.entries(habitats)) {
      expect(tiles.length, habitat).toBeGreaterThanOrEqual(4);
    }
  });

  it('can all be reached, and the pond from its bank', () => {
    const reachable = (t: Tile) =>
      findPath(map.spawn, t, (x, y) => walkable(map, x, y), map.width, map.height) !== null;
    for (const [habitat, tiles] of Object.entries(habitats)) {
      for (const t of tiles) {
        const from =
          habitat === 'pond'
            ? [-1, 0, 1].flatMap((dx) => [-1, 0, 1].map((dy) => ({ tx: t.tx + dx, ty: t.ty + dy })))
            : [t];
        const ok = from.some((f) => walkable(map, f.tx, f.ty) && reachable(f));
        expect(ok, `${habitat} ${t.tx},${t.ty}`).toBe(true);
      }
    }
  });

  it('keep clear of her door, the snack spots and the flower patches', () => {
    const all = Object.values(habitats).flat();
    for (const t of [map.spawn, ...map.snackSpots, ...map.patches]) {
      expect(all.some((a) => a.tx === t.tx && a.ty === t.ty)).toBe(false);
    }
  });

  it('are found from the map: beside a tree, and water beside the bank', () => {
    const tiny = parseMap(tinyMap(['#######', '#.T...#', '#.....#', '#######'], { tx: 5, ty: 2 }));
    const found = habitatsOf(tiny);
    expect(found.trees).toContainEqual({ tx: 1, ty: 1 });
    expect(found.trees).toContainEqual({ tx: 3, ty: 2 });
    expect(found.trees).not.toContainEqual({ tx: 4, ty: 1 });
    expect(found.pond).toEqual([]);
  });
});

describe('the critters out each hour', () => {
  it('are the same all hour and change with the hour and the day', () => {
    const a = crittersOut('2026-09-27', 21, habitats);
    expect(crittersOut('2026-09-27', 21.9, habitats)).toEqual(a);
    expect(crittersOut('2026-09-27', 22, habitats)).not.toEqual(a);
    expect(crittersOut('2026-09-28', 21, habitats)).not.toEqual(a);
  });

  it('are about at that hour, each a different kind, on its own tile of its habitat', () => {
    for (const day of DAYS) {
      for (let h = 0; h < 24; h++) {
        const out = crittersOut(day, h, habitats);
        expect(out.length).toBeGreaterThanOrEqual(4);
        expect(out.length).toBeLessThanOrEqual(CRITTERS_PER_HOUR);
        expect(new Set(out.map((c) => c.critter)).size).toBe(out.length);
        expect(new Set(out.map((c) => `${c.tx},${c.ty}`)).size).toBe(out.length);
        for (const c of out) {
          expect(isOut(c.critter, h)).toBe(true);
          const tiles = habitats[CRITTERS[c.critter].habitat as Habitat];
          expect(tiles).toContainEqual({ tx: c.tx, ty: c.ty });
        }
      }
    }
  });

  it('turn up rare now and then: every critter within two months of evenings and days', () => {
    const seen = new Set<CritterId>();
    for (const day of DAYS) {
      for (let h = 0; h < 24; h++)
        for (const c of crittersOut(day, h, habitats)) seen.add(c.critter);
    }
    expect([...seen].sort()).toEqual([...CRITTER_IDS].sort());
  });

  it('keep off tiles something else is standing on', () => {
    const blocked = (t: { tx: number; ty: number }) => t.tx % 2 === 0;
    for (const c of crittersOut('2026-09-27', 22, habitats, (t) => !blocked(t))) {
      expect(blocked(c)).toBe(false);
    }
  });
});

describe('a wary critter', () => {
  it('flutters to the nearest free tile of its habitat, at least two tiles off', () => {
    const tiles = [
      { tx: 0, ty: 0 },
      { tx: 1, ty: 0 },
      { tx: 3, ty: 0 },
      { tx: 9, ty: 0 },
    ];
    expect(flutterTo({ tx: 0, ty: 0 }, tiles, () => true)).toEqual({ tx: 3, ty: 0 });
    expect(flutterTo({ tx: 0, ty: 0 }, tiles, (t) => t.tx !== 3)).toEqual({ tx: 9, ty: 0 });
    expect(flutterTo({ tx: 0, ty: 0 }, tiles.slice(0, 2), () => true)).toBeNull();
  });
});
