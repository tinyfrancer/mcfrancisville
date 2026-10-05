import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DECOR } from '../../src/data/holidays';
import { EGG_SPOTS } from '../../src/data/holidays';
import { HAPPENINGS } from '../../src/data/happenings';
import { PROP_FOOTPRINT, SPOTS, doorStep } from '../../src/data/maps';
import { LOST_SPOTS } from '../../src/data/smallEvents';
import { ZONE_IDS, ZONES } from '../../src/data/zones';
import { placeHabitats, townHabitats } from '../../src/systems/critters';
import { parseMap, tileAt, walkable, type TileMap } from '../../src/systems/grid';
import type { MapZoneId, PropId } from '../../src/types/ids';

/*
 * 0.3's C1 (decision 250): the day's mound stands on one of a place's `digSpots`, and it's solid,
 * so each spot must be somewhere a mound can never be in the way: open grass with nothing beside
 * it, clear of every habitat (no critter is dealt under it), every spot a neighbour stands at,
 * every way in, door, lot, stall, set piece and egg, and her yard and the farm's kept rows; and
 * out from under the trees' crowns, so it can be seen.
 */

const places = ZONE_IDS.filter((id): id is MapZoneId => ZONES[id].map !== undefined);

const key = (tx: number, ty: number) => `${tx},${ty}`;

/** Every tile within `pad` of a box. */
function around(
  box: { tx: number; ty: number; w?: number; h?: number },
  pad: number,
  into: Set<string>,
): void {
  for (let y = box.ty - pad; y < box.ty + (box.h ?? 1) + pad; y++) {
    for (let x = box.tx - pad; x < box.tx + (box.w ?? 1) + pad; x++) into.add(key(x, y));
  }
}

/** Where a mound must never stand in a place, worked out from everything else that's there. */
function keptClear(id: MapZoneId, map: TileMap): Set<string> {
  const clear = new Set<string>();
  const habitats = id === 'town' ? townHabitats(map, true) : placeHabitats(id, map);
  for (const tiles of Object.values(habitats)) for (const t of tiles) clear.add(key(t.tx, t.ty));
  for (const spot of Object.values(SPOTS[id] as Record<string, { tx: number; ty: number }>)) {
    around(spot, 1, clear);
  }
  around(map.spawn, 1, clear);
  for (const t of map.snackSpots) around(t, 1, clear);
  for (const e of map.exits) around(e, 2, clear);
  for (const p of map.props)
    if (PROP_FOOTPRINT[p.id].door !== undefined) around(doorStep(p), 1, clear);
  for (const lot of ZONES[id].map!.lots ?? [])
    around({ ...lot, ...PROP_FOOTPRINT[lot.prop] }, 1, clear);
  for (const lot of map.popUpLots) around({ ...lot, ...PROP_FOOTPRINT.popUpShop }, 1, clear);
  for (const spot of map.peddlerSpots) around({ ...spot, ...PROP_FOOTPRINT.moonPieCart }, 1, clear);
  for (const row of map.plots) for (const t of row) around(t, 1, clear);
  if (map.yard) around(map.yard, 1, clear);
  const set = (p: { prop: PropId; tx: number; ty: number }) =>
    around({ ...p, ...PROP_FOOTPRINT[p.prop] }, 1, clear);
  if (id === 'town' || id === 'fairground') {
    for (const row of Object.values(HAPPENINGS)) {
      for (const p of row.set ?? []) set(p);
      for (const p of row.fair?.set ?? []) set(p);
    }
  }
  if (id === 'town') {
    for (const row of Object.values(DECOR)) for (const p of row.pieces) set(p);
    for (const t of EGG_SPOTS) around(t, 1, clear);
    for (const { at } of LOST_SPOTS) around(at, 1, clear);
  }
  return clear;
}

/**
 * What has a crown that hangs over the tiles behind it (as `OutdoorView` draws it), and how far:
 * tiles to each side of its trunk, and rows up.
 */
const CROWNED: Partial<Record<PropId, { side: number; up: number }>> = {
  tree: { side: 1, up: 3 },
  candyTree: { side: 1, up: 3 },
  appleTree: { side: 1, up: 3 },
  pearTree: { side: 1, up: 3 },
  plumTree: { side: 1, up: 3 },
  persimmonTree: { side: 1, up: 3 },
  oldTree: { side: 2, up: 4 },
  willow: { side: 2, up: 4 },
};

/** Whether a tree's crown hangs over a tile, so a mound there would be hidden under its leaves. */
function underCrown(map: TileMap, tx: number, ty: number): boolean {
  return map.props.some((p) => {
    const crown = CROWNED[p.id];
    return (
      crown !== undefined &&
      tx >= p.tx - crown.side &&
      tx < p.tx + p.w + crown.side &&
      ty >= p.ty - crown.up &&
      ty < p.ty
    );
  });
}

/** Whether a mound could stand on a tile: open grass, everything round it open too. */
function openAround(map: TileMap, tx: number, ty: number): boolean {
  if (tileAt(map, tx, ty) !== 'grass') return false;
  const patches = new Set(map.patches.map((p) => key(p.tx, p.ty)));
  for (let y = ty - 1; y <= ty + 1; y++) {
    for (let x = tx - 1; x <= tx + 1; x++) {
      const tile = tileAt(map, x, y);
      if (!walkable(map, x, y) || patches.has(key(x, y))) return false;
      if (tile === 'water' || tile === 'ice' || tile === 'bed') return false;
    }
  }
  return true;
}

describe("the day's mound", () => {
  for (const id of places) {
    const map = parseMap(ZONES[id].map!);
    it(`has a few spots in ${id}, each open and clear of everything`, () => {
      const clear = keptClear(id, map);
      expect(map.digSpots.length, id).toBeGreaterThanOrEqual(4);
      expect(new Set(map.digSpots.map((t) => key(t.tx, t.ty))).size, id).toBe(map.digSpots.length);
      for (const { tx, ty } of map.digSpots) {
        expect(openAround(map, tx, ty), `${id} ${tx},${ty} open`).toBe(true);
        expect(clear.has(key(tx, ty)), `${id} ${tx},${ty} clear`).toBe(false);
        expect(underCrown(map, tx, ty), `${id} ${tx},${ty} out from under the trees`).toBe(false);
      }
    });
  }

  it.skipIf(!process.env.DIG_CANDIDATES)('lists where a spot could go', () => {
    const out: string[] = [];
    for (const id of places) {
      const map = parseMap(ZONES[id].map!);
      const clear = keptClear(id, map);
      const rows: string[] = [];
      for (let ty = 0; ty < map.height; ty++) {
        let row = '';
        for (let tx = 0; tx < map.width; tx++) {
          const ok = openAround(map, tx, ty) && !clear.has(key(tx, ty)) && !underCrown(map, tx, ty);
          row += ok ? '*' : walkable(map, tx, ty) ? (clear.has(key(tx, ty)) ? '-' : '.') : '#';
        }
        rows.push(row);
      }
      out.push(`${id}\n${rows.map((r, i) => `${String(i).padStart(2)} ${r}`).join('\n')}`);
    }
    writeFileSync(process.env.DIG_CANDIDATES!, out.join('\n\n'));
  });
});
