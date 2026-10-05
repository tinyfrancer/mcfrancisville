import { describe, expect, it } from 'vitest';
import { INTERIOR_IDS, isInterior } from '../../src/data/interiors';
import { LANTERN_SHORE_SPOTS } from '../../src/data/maps';
import { ITEMS } from '../../src/data/items';
import { VILLAGERS } from '../../src/data/villagers';
import { SIGNPOSTS } from '../../src/data/signposts';
import { ZONE_IDS, ZONES, type Unlock } from '../../src/data/zones';
import { parseMap, tileAt, walkable, type TileMap } from '../../src/systems/grid';
import { findPath } from '../../src/systems/pathfinding';
import { landingOf, linksBetween } from '../../src/systems/zones';
import { LOTS } from '../../src/systems/lots';
import type { Tile } from '../../src/systems/pathfinding';
import { Lots } from '../../src/world/zones/Lots';
import { MapZone } from '../../src/world/zones/MapZone';
import type { MapZoneId, ZoneId } from '../../src/types/ids';

const outdoors = ZONE_IDS.filter((id): id is MapZoneId => ZONES[id].map !== undefined);
const maps = new Map<MapZoneId, TileMap>(outdoors.map((id) => [id, parseMap(ZONES[id].map!)]));
const mapOf = (id: MapZoneId) => maps.get(id)!;

/**
 * The banks she reaches only over the ice, on purpose, by a tile on each: Whisperwood's far side of
 * the creek, where she skates across to dig up the heart key (decision 240). Anything else cut off
 * on foot is a break (decision 217).
 */
const ACROSS_THE_ICE: Partial<Record<MapZoneId, readonly Tile[]>> = {
  whisperwood: [{ tx: 20, ty: 28 }],
};

/**
 * Each open tile of a place she can walk to from each of `from` as it stands at its fullest: every
 * lot's house up and every row kept for the farm built, and over the ice only if `skating`.
 */
function walkedFrom(id: MapZoneId, from: readonly Tile[], skating: boolean) {
  const map = mapOf(id);
  const zone = new MapZone(
    id,
    map,
    null,
    () => true,
    new Lots(id),
    null,
    () => map.plots.length,
  );
  const open = (x: number, y: number) =>
    zone.canWalk(x, y) && (skating || tileAt(map, x, y) !== 'ice');
  const key = (t: Tile) => t.ty * map.width + t.tx;
  const reached = new Set(from.map(key));
  const queue = [...from];
  for (let i = 0; i < queue.length; i++) {
    const { tx, ty } = queue[i]!;
    for (const next of [
      { tx: tx + 1, ty },
      { tx: tx - 1, ty },
      { tx, ty: ty + 1 },
      { tx, ty: ty - 1 },
    ]) {
      if (!open(next.tx, next.ty) || reached.has(key(next))) continue;
      reached.add(key(next));
      queue.push(next);
    }
  }
  const cut: string[] = [];
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      if (open(tx, ty) && !reached.has(key({ tx, ty }))) cut.push(`${id} ${tx},${ty}`);
    }
  }
  return { reached: (t: Tile) => reached.has(key(t)), cut };
}

/** Whether one tile can be walked to from another. */
function joined(map: TileMap, from: { tx: number; ty: number }, to: { tx: number; ty: number }) {
  const canWalk = (x: number, y: number) => walkable(map, x, y);
  return findPath(from, to, canWalk, map.width, map.height) !== null;
}

describe('the places', () => {
  it('are every one outdoors but her home and the insides of buildings, which are rooms', () => {
    expect(ZONES.home.map).toBeUndefined();
    expect(outdoors).toEqual(ZONE_IDS.filter((id) => id !== 'home' && !isInterior(id)));
    for (const id of INTERIOR_IDS) expect(ZONES[id].map, id).toBeUndefined();
  });

  it('have ways out along their edges, on open ground', () => {
    for (const id of outdoors) {
      const map = mapOf(id);
      for (const exit of map.exits) {
        const label = `${id} to ${exit.to}`;
        const onEdge =
          exit.tx === 0 ||
          exit.ty === 0 ||
          exit.tx + exit.w === map.width ||
          exit.ty + exit.h === map.height;
        expect(onEdge, label).toBe(true);
        expect(exit.w === 1 || exit.h === 1, label).toBe(true);
        for (let y = exit.ty; y < exit.ty + exit.h; y++) {
          for (let x = exit.tx; x < exit.tx + exit.w; x++) {
            expect(walkable(map, x, y), `${label} ${x},${y}`).toBe(true);
          }
        }
      }
    }
  });

  it('are joined both ways, each way out with one back from the other side', () => {
    for (const id of outdoors) {
      for (const exit of mapOf(id).exits) {
        const to = exit.to as MapZoneId;
        const back = mapOf(to).exits.filter((e) => e.to === id);
        expect(back, `${id} to ${to}`).toHaveLength(1);
        expect(Math.max(back[0]!.w, back[0]!.h), `${id} to ${to}`).toBe(Math.max(exit.w, exit.h));
      }
    }
  });

  it('have every way out worn to the edge, with a signpost by it naming where it goes', () => {
    for (const id of outdoors) {
      const map = mapOf(id);
      for (const exit of map.exits) {
        const label = `${id} to ${exit.to}`;
        for (let y = exit.ty; y < exit.ty + exit.h; y++) {
          for (let x = exit.tx; x < exit.tx + exit.w; x++) {
            expect(['path', 'steps', 'ice'], `${label} ${x},${y}`).toContain(tileAt(map, x, y));
          }
        }
        const posts = map.props.filter((p) => p.sign?.to === exit.to);
        expect(posts.length, label).toBeGreaterThan(0);
      }
    }
  });

  it('mark the hidden way to the clearing with a lantern, two tiles wide', () => {
    const map = mapOf('whisperwood');
    const gap = map.exits.find((e) => e.to === 'hiddenClearing')!;
    expect(gap.w).toBe(2);
    const lit = map.props.some(
      (p) => p.id === 'lantern' && Math.abs(p.tx - gap.tx) <= 2 && Math.abs(p.ty - gap.ty) <= 2,
    );
    expect(lit).toBe(true);
  });

  it('say plainly on their signposts where they go, in a word that fits the board', () => {
    for (const id of outdoors) {
      const row = SIGNPOSTS[id];
      expect(row.line, id).toContain(ZONES[id].name);
      expect(row.word, id).toMatch(/^[A-Z]{3,6}$/);
    }
  });

  it('let her step in on open ground from every way in, and reach all of it from there', () => {
    for (const id of outdoors) {
      const map = mapOf(id);
      expect(walkable(map, map.spawn.tx, map.spawn.ty), `${id} spawn`).toBe(true);
      for (const exit of map.exits) {
        for (let along = 0; along < Math.max(exit.w, exit.h); along++) {
          const { tile } = landingOf(exit, map, along);
          const label = `${id} from ${exit.to} (${along})`;
          expect(walkable(map, tile.tx, tile.ty), label).toBe(true);
          expect(joined(map, map.spawn, tile), label).toBe(true);
        }
      }
      for (let ty = 0; ty < map.height; ty++) {
        for (let tx = 0; tx < map.width; tx++) {
          if (!walkable(map, tx, ty)) continue;
          expect(joined(map, map.spawn, { tx, ty }), `${id} ${tx},${ty}`).toBe(true);
        }
      }
    }
  });

  it('let her walk all of each place on foot, round every house and bed, ice aside', () => {
    for (const id of outdoors) {
      const { cut } = walkedFrom(id, [mapOf(id).spawn, ...(ACROSS_THE_ICE[id] ?? [])], false);
      expect(cut, id).toEqual([]);
    }
  });

  it('keep only the banks named for it across the ice, and those joined by it', () => {
    for (const [id, banks] of Object.entries(ACROSS_THE_ICE) as [MapZoneId, Tile[]][]) {
      const onFoot = walkedFrom(id, [mapOf(id).spawn], false);
      const skating = walkedFrom(id, [mapOf(id).spawn], true);
      for (const bank of banks) {
        expect(onFoot.reached(bank), `${id} ${bank.tx},${bank.ty}`).toBe(false);
        expect(skating.reached(bank), `${id} ${bank.tx},${bank.ty}`).toBe(true);
      }
    }
  });

  it("have the way round Lantern Shore's lake whole, past its beds (decision 217)", () => {
    const shore = mapOf('lanternShore');
    const { reached } = walkedFrom('lanternShore', [shore.spawn], false);
    expect(reached(LANTERN_SHORE_SPOTS.shoreWest)).toBe(true);
    expect(shore.beds).toHaveLength(4);
    for (const { tx, ty } of shore.beds) {
      const beside = [
        { tx: tx + 1, ty },
        { tx: tx - 1, ty },
        { tx, ty: ty + 1 },
        { tx, ty: ty - 1 },
      ];
      expect(beside.some(reached), `${tx},${ty}`).toBe(true);
    }
  });

  it('has every door a building in its place: a prop it has, or a house on one of its lots', () => {
    for (const id of outdoors) {
      for (const door of mapOf(id).doors) {
        const standing = mapOf(id).props.some((p) => p.id === door.prop);
        const onLot = LOTS.some((l) => l.zone === id && l.house.id === door.prop);
        expect(standing || onLot, door.prop).toBe(true);
      }
    }
  });

  it('opens by rules that name things that exist, with a hint while shut', () => {
    const check = (rule: Unlock, zone: ZoneId): void => {
      if ('has' in rule) expect(ITEMS[rule.has], zone).toBeDefined();
      if ('with' in rule) expect(VILLAGERS[rule.with], zone).toBeDefined();
      if ('found' in rule) expect(ZONES[rule.found], zone).toBeDefined();
      if ('all' in rule) rule.all.forEach((r) => check(r, zone));
    };
    for (const id of ZONE_IDS) {
      const row = ZONES[id];
      check(row.unlock, id);
      if (!('open' in row.unlock)) {
        expect(row.shut, id).toBeTruthy();
        expect(row.opened, id).toBeTruthy();
      }
    }
  });

  it('puts every place outdoors on the world map, apart and inside it', () => {
    const spots = outdoors.map((id) => ZONES[id].onMap!);
    for (const [i, at] of spots.entries()) {
      expect(at, outdoors[i]).toBeDefined();
      expect(at.x).toBeGreaterThanOrEqual(10);
      expect(at.x).toBeLessThanOrEqual(90);
      expect(at.y).toBeGreaterThanOrEqual(10);
      expect(at.y).toBeLessThanOrEqual(90);
    }
    expect(new Set(spots.map((s) => `${s.x},${s.y}`)).size).toBe(spots.length);
    expect(linksBetween()).toContainEqual(['town', 'whisperwood']);
  });

  it('can all be walked to from the town', () => {
    const seen = new Set<ZoneId>(['town']);
    const queue: ZoneId[] = ['town'];
    while (queue.length > 0) {
      const here = queue.shift()!;
      for (const [a, b] of linksBetween()) {
        const next = a === here ? b : b === here ? a : null;
        if (next && !seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    for (const id of outdoors) expect(seen.has(id), id).toBe(true);
  });
});
