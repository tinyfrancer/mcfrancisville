import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import type { Placed } from '../../src/data/home';
import { EGG_SPOTS } from '../../src/data/holidays';
import { doorStep, TOWN, TOWN_SPOTS } from '../../src/data/maps';
import { LOST_SPOTS } from '../../src/data/smallEvents';
import { SURFACES, SMALL } from '../../src/data/tabletop';
import { OUTDOOR, YARD_WARES } from '../../src/data/yard';
import { covers } from '../../src/systems/decor';
import { parseMap, walkable } from '../../src/systems/grid';
import type { Tile } from '../../src/systems/pathfinding';
import { inBox, standsOn, yardFit, yardOf, yardRefusal } from '../../src/systems/yard';
import type { FurnitureId } from '../../src/types/ids';

const map = parseMap(TOWN);
const ground = yardOf(map)!;
const at = (id: FurnitureId, tx: number, ty: number, turn = 0): Placed => ({ id, tx, ty, turn });
const lawn = () =>
  [...ground.lawn].map((i) => ({ tx: i % map.width, ty: Math.floor(i / map.width) }));
const key = (t: Tile) => `${t.tx},${t.ty}`;

/** Every tile reached on foot from her door, with her pieces standing where they are. */
function reached(placed: readonly Placed[]): Set<string> {
  const seen = new Set([key(map.spawn)]);
  const queue: Tile[] = [map.spawn];
  for (let i = 0; i < queue.length; i++) {
    const { tx, ty } = queue[i]!;
    for (const next of [
      { tx: tx + 1, ty },
      { tx: tx - 1, ty },
      { tx, ty: ty + 1 },
      { tx, ty: ty - 1 },
    ]) {
      if (!walkable(map, next.tx, next.ty) || standsOn(placed, next.tx, next.ty)) continue;
      if (seen.has(key(next))) continue;
      seen.add(key(next));
      queue.push(next);
    }
  }
  return seen;
}

describe('her yard (0.3’s H5)', () => {
  it('is the grass round her house, in the town’s map', () => {
    expect(map.yard).not.toBeNull();
    const house = map.props.find((p) => p.id === 'homeHouse')!;
    for (const corner of [
      { tx: house.tx - 1, ty: house.ty },
      { tx: house.tx + house.w, ty: house.ty + house.h - 1 },
      doorStep(house),
    ]) {
      expect(inBox(ground.box, corner.tx, corner.ty), key(corner)).toBe(true);
    }
    expect(lawn().length).toBeGreaterThan(30);
  });

  it('takes pieces only on open grass, clear of every spot the town keeps there', () => {
    const kept = [
      map.spawn,
      ...map.snackSpots,
      ...Object.values(TOWN_SPOTS),
      ...EGG_SPOTS,
      ...LOST_SPOTS.map((s) => s.at),
      ...map.patches,
    ].map(key);
    for (const t of lawn()) {
      expect(inBox(ground.box, t.tx, t.ty), key(t)).toBe(true);
      expect(map.tiles[t.ty * map.width + t.tx], key(t)).toBe('grass');
      expect(walkable(map, t.tx, t.ty), key(t)).toBe(true);
      expect(kept, key(t)).not.toContain(key(t));
    }
    // Her path, the candy tree, Skelly and the mailbox are never lawn.
    for (const id of ['candyTree', 'skelly', 'mailbox', 'pottedPlant', 'goose'] as const) {
      const prop = map.props.find((p) => p.id === id)!;
      expect(ground.lawn.has(prop.ty * map.width + prop.tx), id).toBe(false);
    }
  });

  it('keeps the grass hidden behind her house clear, so nothing of hers is lost behind the roof', () => {
    const house = map.props.find((p) => p.id === 'homeHouse')!;
    for (let tx = house.tx; tx < house.tx + house.w; tx++) {
      expect(ground.lawn.has((house.ty - 1) * map.width + tx), `${tx}`).toBe(false);
    }
  });

  it('takes only what may stand outdoors', () => {
    const t = { tx: 6, ty: 12 };
    expect(yardRefusal(ground, [], at('batBed', t.tx, t.ty), null)).toBe('indoors');
    expect(yardRefusal(ground, [], at('cauldron', t.tx, t.ty), null)).toBe('indoors');
    expect(yardRefusal(ground, [], at('birdbath', t.tx, t.ty), null)).toBeNull();
    expect(yardRefusal(ground, [], at('boneGnome', t.tx, t.ty), null)).toBeNull();
    for (const id of OUTDOOR) expect(FURNITURE[id].layer, id).toBe('floor');
    for (const id of YARD_WARES) expect(FURNITURE[id].price, id).toBeGreaterThan(0);
  });

  it('keeps her path, her door step and where she stands clear', () => {
    expect(yardRefusal(ground, [], at('birdbath', 4, 11), null)).toBe('noRoom');
    expect(yardRefusal(ground, [], at('birdbath', map.spawn.tx, map.spawn.ty), null)).toBe(
      'noRoom',
    );
    expect(yardRefusal(ground, [], at('birdbath', 6, 12), { tx: 6, ty: 12 })).toBe('standing');
    expect(yardRefusal(ground, [at('birdbath', 6, 12)], at('flowerPots', 6, 12), null)).toBe(
      'noRoom',
    );
  });

  it('never cuts off anywhere in town, nor anything walked up to', () => {
    // The one way behind her house, and on to the top of the farm, is down its west side.
    expect(yardRefusal(ground, [], at('picketFence', 1, 7), null)).toBe('inTheWay');
    expect(yardRefusal(ground, [], at('picketFence', 7, 7), null)).toBeNull();
    // The corner by the farm's fence is reached past the candy tree only.
    expect(yardRefusal(ground, [], at('gardenBench', 6, 12), null)).toBe('inTheWay');
    // Filling every bit of lawn that will take a fence leaves every tile reached that was.
    const placed: Placed[] = [];
    for (const t of lawn()) {
      const fence = at('picketFence', t.tx, t.ty);
      if (yardRefusal(ground, placed, fence, null) === null) placed.push(fence);
    }
    expect(placed.length).toBeGreaterThan(10);
    const before = reached([]);
    const after = reached(placed);
    for (const t of before) {
      const [tx, ty] = t.split(',').map(Number) as [number, number];
      if (!standsOn(placed, tx, ty)) expect(after.has(t), t).toBe(true);
    }
    // The candy tree, the sapling rings, Skelly, the mailbox and the pots each keep a side open.
    for (const prop of map.props.filter((p) => inBox(ground.box, p.tx, p.ty))) {
      const beside: Tile[] = [];
      for (let ty = prop.ty - 1; ty <= prop.ty + prop.h; ty++) {
        for (let tx = prop.tx - 1; tx <= prop.tx + prop.w; tx++) beside.push({ tx, ty });
      }
      const open = beside.filter((t) => walkable(map, t.tx, t.ty) && before.has(key(t)));
      if (open.length === 0) continue;
      expect(
        open.some((t) => after.has(key(t))),
        `${prop.id} ${prop.tx},${prop.ty}`,
      ).toBe(true);
    }
  });

  it('finds the nearest room for a piece taken out of the chest, or says there is none', () => {
    const bench = yardFit(ground, [], 'gardenBench', { tx: 6, ty: 12 }, { tx: 4, ty: 12 });
    expect(bench).not.toBeNull();
    expect(yardRefusal(ground, [], bench!, { tx: 4, ty: 12 })).toBeNull();
    expect(Math.abs(bench!.tx - 6) + Math.abs(bench!.ty - 12)).toBeLessThanOrEqual(1);
    expect(yardFit(ground, [], 'batBed', { tx: 6, ty: 12 }, null)).toBeNull();
  });

  it('lets a lantern or a pot of flowers stand on the picnic table', () => {
    expect(SURFACES.picnicTable).toBeGreaterThan(0);
    expect(SMALL.has('yardLantern') && SMALL.has('flowerPots')).toBe(true);
    const table = at('picnicTable', 5, 13);
    expect(yardRefusal(ground, [], table, null)).toBeNull();
    const lantern: Placed = { ...at('yardLantern', 6, 13), on: true };
    expect(yardRefusal(ground, [table], lantern, null)).toBeNull();
    expect(yardRefusal(ground, [table, lantern], { ...lantern }, null)).toBe('noRoom');
    expect(covers(table, 6, 13)).toBe(true);
    // A pumpkin pile is no small thing: it stands on the grass.
    expect(yardRefusal(ground, [table], { ...at('pumpkinPile', 6, 13), on: true }, null)).toBe(
      'noRoom',
    );
  });
});
