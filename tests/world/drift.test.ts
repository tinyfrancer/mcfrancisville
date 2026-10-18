import { describe, expect, it } from 'vitest';
import { CRITTERS } from '../../src/data/critters';
import { CREEP_TILES, drifts, HOP_MS } from '../../src/systems/drift';
import type { Tile } from '../../src/systems/pathfinding';
import type { Critter } from '../../src/world/World';
import { harness, type Harness } from './harness';

/*
 * V1's R6a (decision 316): a shy critter drifts a tile away from her as she rushes up, hopping
 * there, and settles; creeping up on it, she nets it. Nothing about it is ever more than a tile.
 */

/**
 * A shy critter out in town on open ground, with a spot `away` tiles south of it she can stand
 * on and walk up from: found by trying the hours of a few days.
 */
function shyOne(h: Harness, away: number): { critter: Critter; from: Tile } {
  for (let day = 0; day < 20; day++) {
    for (let hour = 6; hour < 24; hour++) {
      h.clock.set(new Date(2026, 8, 26 + day, hour, 5));
      for (const c of h.world.collecting.critters()) {
        if (!drifts(c.critter) || !h.world.canWalk(c.tx, c.ty)) continue;
        if (CRITTERS[c.critter].wary > 0) continue;
        const from = { tx: c.tx, ty: c.ty + away };
        const clear = (t: Tile) =>
          h.world.canWalk(t.tx, t.ty) && !h.world.neighbourhood.villagerAt(t.tx, t.ty);
        if (!clear(from)) continue;
        // The way up to it is open, straight north.
        let open = true;
        for (let y = c.ty + 1; y < from.ty; y++) open &&= clear({ tx: c.tx, ty: y });
        if (open) return { critter: c, from };
      }
    }
  }
  throw new Error('no shy critter out on open ground');
}

/** Stands her still on a tile, facing north, long enough to have stood there. */
function standAt(h: Harness, at: Tile): void {
  h.world.movement.standAt(at, 'up');
  h.tick(2);
}

describe('a shy critter', () => {
  it('drifts a tile away with a hop as she rushes up, and she can creep up and net it after', () => {
    const h = harness();
    const { critter, from } = shyOne(h, CREEP_TILES + 3);
    standAt(h, from);
    expect(h.world.tapTile(critter.tx, critter.ty)).toBe(true);
    const events = h.until(() => !h.world.player.moving, 'she runs up');
    expect(events).toContainEqual({ kind: 'drifted', critter: critter.critter, first: true });
    expect(events.some((e) => e.kind === 'caught')).toBe(false);
    expect(h.world.bag.count(critter.critter)).toBe(0);
    const moved = h.world.collecting.find(critter.key)!;
    const step = Math.max(Math.abs(moved.tx - critter.tx), Math.abs(moved.ty - critter.ty));
    expect(step).toBe(1);
    // Further from her than it was.
    expect(moved.ty).toBeLessThanOrEqual(critter.ty);

    // Now she's standing near: a tap creeps up, and it's hers.
    expect(h.world.tapTile(moved.tx, moved.ty)).toBe(true);
    const crept = h.until(() => !h.world.player.moving, 'she creeps up');
    expect(crept.some((e) => e.kind === 'drifted')).toBe(false);
    expect(crept).toContainEqual(
      expect.objectContaining({ kind: 'caught', critter: critter.critter }),
    );
  });

  it('is drawn hopping, from where it was, for a moment, then settled', () => {
    const h = harness();
    const { critter, from } = shyOne(h, CREEP_TILES + 3);
    standAt(h, from);
    h.world.tapTile(critter.tx, critter.ty);
    h.until(
      () =>
        h.world.collecting.find(critter.key)?.tx !== critter.tx ||
        h.world.collecting.find(critter.key)?.ty !== critter.ty,
      'it drifts',
    );
    const hopping = h.world.collecting.find(critter.key)!;
    expect(hopping.hop).toEqual({ tx: critter.tx, ty: critter.ty, t: 0 });
    h.clock.advance(HOP_MS / 2);
    expect(h.world.collecting.find(critter.key)!.hop?.t).toBeCloseTo(0.5);
    h.clock.advance(HOP_MS);
    expect(h.world.collecting.find(critter.key)!.hop).toBeUndefined();
  });

  it('lets her near when she stops a few tiles away and creeps up', () => {
    const h = harness();
    const { critter, from } = shyOne(h, CREEP_TILES + 1);
    standAt(h, from);
    h.world.tapTile(critter.tx, critter.ty);
    const events = h.until(() => !h.world.player.moving, 'she creeps up');
    expect(events.some((e) => e.kind === 'drifted')).toBe(false);
    expect(events).toContainEqual(
      expect.objectContaining({ kind: 'caught', critter: critter.critter }),
    );
  });

  it('gets used to her after drifting twice in its hour', () => {
    const h = harness();
    const { critter, from } = shyOne(h, CREEP_TILES + 3);
    let drifted = 0;
    for (let tries = 0; tries < 4; tries++) {
      standAt(h, from);
      const now = h.world.collecting.find(critter.key);
      if (!now) break;
      h.world.tapTile(now.tx, now.ty);
      const events = h.until(() => !h.world.player.moving, 'she runs up');
      drifted += events.filter((e) => e.kind === 'drifted').length;
      if (events.some((e) => e.kind === 'caught')) break;
    }
    expect(drifted).toBeLessThanOrEqual(2);
    expect(h.world.bag.count(critter.critter)).toBe(1);
  });
});
