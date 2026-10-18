import { describe, expect, it } from 'vitest';
import { DECOR, EGG_SPOTS } from '../../src/data/holidays';
import { HAPPENINGS } from '../../src/data/happenings';
import { PROP_FOOTPRINT, SPOTS, doorStep } from '../../src/data/maps';
import { PROJECT_IDS, PROJECT_STAGES, PROJECTS } from '../../src/data/projects';
import { PASSERS, WANDERING_STALL_AT } from '../../src/data/rareEvents';
import { LOST_SPOTS } from '../../src/data/smallEvents';
import { ZONES } from '../../src/data/zones';
import { parseMap, tileAt, walkable, type TileMap } from '../../src/systems/grid';
import { piecesAt, siteOf } from '../../src/systems/projects';
import type { MapZoneId, PropId } from '../../src/types/ids';

/*
 * V1's R4 (decision 314): a project goes up where nothing else is ever wanted. Every tile of every
 * stage stands on open ground (the footbridge on the creek's ice), clear of every spot a neighbour
 * keeps, every way in and door, lot, stall, set piece, egg and dig spot; and nothing it puts up, at
 * any stage, cuts anywhere off. A habitat may run under a site (her greenhouse is in her yard,
 * every tile of which is one): a critter is never dealt where something stands (`Collecting`).
 */

const key = (tx: number, ty: number) => `${tx},${ty}`;

function box(into: Set<string>, b: { tx: number; ty: number; w?: number; h?: number }): void {
  for (let y = b.ty; y < b.ty + (b.h ?? 1); y++) {
    for (let x = b.tx; x < b.tx + (b.w ?? 1); x++) into.add(key(x, y));
  }
}

/** Every tile in a place something else needs. */
function taken(id: MapZoneId, map: TileMap): Set<string> {
  const used = new Set<string>();
  for (const spot of Object.values(SPOTS[id] as Record<string, { tx: number; ty: number }>)) {
    box(used, spot);
  }
  box(used, map.spawn);
  for (const t of [...map.snackSpots, ...map.digSpots]) box(used, t);
  for (const e of map.exits) box(used, e);
  for (const p of map.props) if (PROP_FOOTPRINT[p.id].door !== undefined) box(used, doorStep(p));
  for (const lot of ZONES[id].map!.lots ?? []) box(used, { ...lot, ...PROP_FOOTPRINT[lot.prop] });
  for (const lot of map.popUpLots) box(used, { ...lot, ...PROP_FOOTPRINT.popUpShop });
  for (const spot of map.peddlerSpots) box(used, { ...spot, ...PROP_FOOTPRINT.moonPieCart });
  for (const row of map.plots) for (const t of row) box(used, t);
  const set = (p: { prop: PropId; tx: number; ty: number }) =>
    box(used, { ...p, ...PROP_FOOTPRINT[p.prop] });
  for (const row of Object.values(HAPPENINGS)) {
    const zone = 'inside' in row.where ? null : 'zone' in row.where ? row.where.zone : 'town';
    if (zone === id) for (const p of row.set ?? []) set(p);
  }
  if (id === 'town') {
    for (const row of Object.values(DECOR)) for (const p of row.pieces) set(p);
    for (const t of EGG_SPOTS) box(used, t);
    for (const { at } of LOST_SPOTS) box(used, at);
    set({ prop: 'wanderingStall', ...WANDERING_STALL_AT });
  }
  for (const row of Object.values(PASSERS))
    if (row.zone === id) for (const t of row.at) box(used, t);
  return used;
}

/** Every tile reached on foot from the spawn, ice and all, with `blocked` standing. */
function reached(map: TileMap, blocked: Set<string>): Set<string> {
  const seen = new Set<string>([key(map.spawn.tx, map.spawn.ty)]);
  const queue = [map.spawn];
  while (queue.length > 0) {
    const t = queue.pop()!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const tx = t.tx + dx;
      const ty = t.ty + dy;
      const k = key(tx, ty);
      if (seen.has(k) || blocked.has(k) || !walkable(map, tx, ty)) continue;
      seen.add(k);
      queue.push({ tx, ty });
    }
  }
  return seen;
}

describe("the town's projects' sites (V1's R4)", () => {
  for (const id of PROJECT_IDS) {
    const row = PROJECTS[id];
    const map = parseMap(ZONES[row.zone].map!);

    it(`puts ${id} on open ground, clear of everything else in ${row.zone}`, () => {
      const used = taken(row.zone, map);
      const onIce = new Set((row.deck ?? []).map((t) => key(t.tx, t.ty)));
      for (const t of siteOf(id)) {
        const ground = tileAt(map, t.tx, t.ty);
        const open = onIce.has(key(t.tx, t.ty)) ? ground === 'ice' : ground === 'grass';
        expect(open, `${id} ${t.tx},${t.ty} is ${ground}`).toBe(true);
        expect(walkable(map, t.tx, t.ty), `${id} ${t.tx},${t.ty} open`).toBe(true);
        expect(map.props.some((p) => key(p.tx, p.ty) === key(t.tx, t.ty))).toBe(false);
        expect(used.has(key(t.tx, t.ty)), `${id} ${t.tx},${t.ty} clear`).toBe(false);
      }
    });

    it(`cuts nowhere off in ${row.zone} at any stage of ${id}`, () => {
      const before = reached(map, new Set());
      for (const stage of PROJECT_STAGES) {
        const blocked = new Set<string>();
        for (const p of piecesAt(id, stage)) if (p.id !== 'footbridge') box(blocked, p);
        if (stage === 'done') for (const b of row.beds ?? []) box(blocked, b);
        const after = reached(map, blocked);
        for (const k of before) {
          if (!blocked.has(k)) expect(after.has(k), `${id} ${stage}: ${k}`).toBe(true);
        }
        // What's walked up to has somewhere to stand beside it.
        for (const p of piecesAt(id, stage)) {
          const ring = [];
          for (let y = p.ty - 1; y <= p.ty + p.h; y++) {
            for (let x = p.tx - 1; x <= p.tx + p.w; x++) if (after.has(key(x, y))) ring.push(1);
          }
          expect(ring.length, `${id} ${stage} ${p.id}`).toBeGreaterThan(0);
        }
      }
    });
  }
});
