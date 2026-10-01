import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import { FIXTURES, INTERIOR_IDS, INTERIORS, KEEPSAKE_HEARTS } from '../../src/data/interiors';
import { doorStep, PROP_FOOTPRINT } from '../../src/data/maps';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { ZONE_IDS, ZONES } from '../../src/data/zones';
import { LOTS, lotFor } from '../../src/systems/lots';
import { covers } from '../../src/world/zones/Zone';
import { parseMap, walkable } from '../../src/systems/grid';
import { keepsakes } from '../../src/systems/interiors';
import { findPath } from '../../src/systems/pathfinding';
import type { InteriorId, MapZoneId } from '../../src/types/ids';
import { boxOf, layerOf, RoomZone } from '../../src/world/zones/RoomZone';

const outdoors = ZONE_IDS.filter((id): id is MapZoneId => ZONES[id].map !== undefined);

describe('the insides of buildings', () => {
  it.each(INTERIOR_IDS)('has a way into %s from one building outdoors, and back out', (id) => {
    const row = INTERIORS[id];
    const places = outdoors.filter((z) => ZONES[z].map!.doors?.some((d) => d.to === id));
    expect(places, id).toHaveLength(1);
    const map = parseMap(ZONES[places[0]!].map!);
    const doors = map.doors.filter((d) => d.to === id);
    expect(doors).toHaveLength(1);
    expect(doors[0]!.prop).toBe(row.building);
    // A newcomer's house stands on its lot once they've moved in (phase T).
    const lot = lotFor(row.building);
    const buildings = lot ? [lot.house] : map.props.filter((p) => p.id === row.building);
    expect(buildings).toHaveLength(1);
    expect(PROP_FOOTPRINT[row.building].door, id).toBeDefined();
    const step = doorStep(buildings[0]!);
    const canWalk = (x: number, y: number) =>
      walkable(map, x, y) && !LOTS.some((l) => l.zone === places[0] && covers(l.house, x, y));
    expect(canWalk(step.tx, step.ty), `${id}'s door step`).toBe(true);
    expect(findPath(map.spawn, step, canWalk, map.width, map.height)).not.toBeNull();
    expect(ZONES[id].map).toBeUndefined();
  });

  it.each(INTERIOR_IDS)('fits everything in %s, with none overlapping', (id: InteriorId) => {
    const zone = new RoomZone(id);
    const { room } = zone;
    const taken = new Map<string, string>();
    for (const thing of zone.things) {
      const box = boxOf(thing);
      const layer = layerOf(thing);
      const name = 'fixture' in thing ? thing.fixture.id : thing.piece.id;
      for (let ty = box.ty; ty < box.ty + box.h; ty++) {
        for (let tx = box.tx; tx < box.tx + box.w; tx++) {
          expect(tx >= 0 && tx < room.width, `${name} across`).toBe(true);
          if (layer === 'wall')
            expect(ty >= 0 && ty < room.wallRows, `${name} on the wall`).toBe(true);
          else expect(ty >= room.wallRows && ty < room.height, `${name} on the floor`).toBe(true);
          expect(
            tx === room.mat.tx && ty === room.mat.ty && layer !== 'wall',
            `${name} on the mat`,
          ).toBe(false);
          const key = `${layer === 'wall' ? 'wall' : layer}:${tx},${ty}`;
          expect(taken.get(key), `${name} over ${taken.get(key)}`).toBeUndefined();
          taken.set(key, name);
        }
      }
    }
  });

  it.each(INTERIOR_IDS)('leaves every bit of floor in %s reachable, and everything in it', (id) => {
    const zone = new RoomZone(id);
    const { room } = zone;
    const reach = (to: { tx: number; ty: number }) =>
      findPath(room.mat, to, zone.canWalk, room.width, room.height) !== null;
    for (let ty = room.wallRows; ty < room.height; ty++) {
      for (let tx = 0; tx < room.width; tx++) {
        if (zone.canWalk(tx, ty)) expect(reach({ tx, ty }), `${tx},${ty}`).toBe(true);
      }
    }
    for (const thing of zone.things) {
      const box = boxOf(thing);
      const beside = zone.standBeside(box.tx, box.ty);
      const name = 'fixture' in thing ? thing.fixture.id : thing.piece.id;
      expect(beside.some(reach), `somewhere to stand at ${name}`).toBe(true);
    }
  });

  it('has a counter for the shop, a chair for the salon and a case for each family at the museum', () => {
    const opened = (id: InteriorId) =>
      INTERIORS[id].fixtures.map((f) => FIXTURES[f.id].opens).filter((o) => o !== undefined);
    expect(opened('cobwebCorner')).toContainEqual({ shop: 'corner' });
    expect(opened('muse')).toContainEqual({ sheet: 'salon' });
    const cases = INTERIORS.crumbs.fixtures.filter((f) => f.id === 'museumCase');
    expect(new Set(cases.map((c) => c.shows))).toEqual(
      new Set(['moth', 'bat', 'frog', 'orb', 'beetle', 'fish']),
    );
    for (const id of Object.keys(FIXTURES) as (keyof typeof FIXTURES)[]) {
      const row = FIXTURES[id];
      expect(row.opens ?? row.says ?? row.plays, id).toBeDefined();
    }
  });

  it('gives every neighbour a home with two keepsakes, each hers to have one like just once', () => {
    const owners = INTERIOR_IDS.map((id) => INTERIORS[id].owner).filter((o) => o !== undefined);
    expect(new Set(owners)).toEqual(new Set(VILLAGER_IDS));
    const all = keepsakes();
    for (const owner of VILLAGER_IDS) {
      const theirs = [...all].filter(([, k]) => k.owner === owner);
      expect(theirs.map(([, k]) => k.hearts).sort(), owner).toEqual([...KEEPSAKE_HEARTS]);
    }
    const placed = INTERIOR_IDS.flatMap((id) => INTERIORS[id].furniture)
      .filter((p) => p.keepsake !== undefined)
      .map((p) => p.id);
    expect(new Set(placed).size).toBe(placed.length);
    for (const id of placed) expect(FURNITURE[id].price, id).toBeUndefined();
  });
});
