import { describe, expect, it } from 'vitest';
import { INTERIORS } from '../../src/data/interiors';
import { doorStep } from '../../src/data/maps';
import type { FixtureId, FurnitureId, InteriorId, PropId } from '../../src/types/ids';
import { fromSave, World, type WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Walks her to a tile and lets her arrive; every moment on the way. */
function walkTo(h: Harness, tx: number, ty: number): WorldEvent[] {
  expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(2));
}

/** Walks her up to a building in town, and in. */
function goIn(h: Harness, building: PropId): WorldEvent[] {
  const prop = h.world.map.props.find((p) => p.id === building)!;
  return walkTo(h, prop.tx, prop.ty);
}

/** Walks her up to the first of a fixture in the room she's in. */
function useFixture(h: Harness, id: FixtureId): WorldEvent[] {
  const room = h.world.zones.inside(h.world.scene)!;
  const thing = room.things.find((t) => 'fixture' in t && t.fixture.id === id)!;
  const { tx, ty } = 'fixture' in thing ? thing.fixture : thing.piece;
  return walkTo(h, tx, ty);
}

/** Walks her up to a piece of furniture in the room she's in. */
function usePiece(h: Harness, id: FurnitureId): WorldEvent[] {
  const room = h.world.zones.inside(h.world.scene)!;
  const thing = room.things.find((t) => 'piece' in t && t.piece.id === id)!;
  const { tx, ty } = 'piece' in thing ? thing.piece : thing.fixture;
  return walkTo(h, tx, ty);
}

const arrivals = (events: WorldEvent[]) =>
  events.filter((e): e is Extract<WorldEvent, { kind: 'arrived' }> => e.kind === 'arrived');

describe('the insides of buildings', () => {
  it.each(Object.entries(INTERIORS) as [InteriorId, (typeof INTERIORS)[InteriorId]][])(
    'goes into %s by its door, and back out onto the step in front of it',
    (id, row) => {
      const h = harness();
      const events = goIn(h, row.building);
      expect(events).toContainEqual({ kind: 'entered', scene: id });
      expect(events.some((e) => e.kind === 'found')).toBe(false);
      expect(h.world.atlas.hasFound(id)).toBe(false);
      expect(h.world.scene).toBe(id);
      const room = h.world.zones.room(id).room;
      expect(h.world.movement.tile).toEqual(room.mat);
      expect(h.world.player.facing).toBe('up');
      // A step in, and back onto the mat, goes out.
      walkTo(h, room.mat.tx, room.mat.ty - 1);
      const out = walkTo(h, room.mat.tx, room.mat.ty);
      expect(out).toContainEqual({ kind: 'entered', scene: 'town' });
      const building = h.world.map.props.find((p) => p.id === row.building)!;
      expect(h.world.movement.tile).toEqual(doorStep(building));
      expect(h.world.player.facing).toBe('down');
    },
  );

  it("opens Cobweb Corner's shop at its counter, not at its door", () => {
    const h = harness();
    const door = arrivals(goIn(h, 'shopHouse'));
    expect(door.some((a) => a.opens)).toBe(false);
    const counter = arrivals(useFixture(h, 'shopCounter'));
    expect(counter.at(-1)).toMatchObject({ fixture: 'shopCounter', opens: { shop: 'corner' } });
  });

  it('opens the salon at her salon chair, and the museum at any of its cases', () => {
    const h = harness();
    goIn(h, 'salonHouse');
    expect(arrivals(useFixture(h, 'salonChair')).at(-1)?.opens).toEqual({ sheet: 'salon' });
    const mirror = arrivals(useFixture(h, 'salonMirror')).at(-1)!;
    expect(mirror.opens).toBeUndefined();
    expect(mirror.says).toContain(h.world.name);
    const portrait = arrivals(useFixture(h, 'pinUpPortrait')).at(-1)!;
    expect(portrait.says).toMatch(/as a pin-up/);
    expect(portrait.says).toContain(h.world.name);

    const bakery = harness();
    goIn(bakery, 'bakery');
    expect(arrivals(useFixture(bakery, 'museumCase')).at(-1)?.opens).toEqual({ sheet: 'museum' });
    expect(arrivals(useFixture(bakery, 'bakeryOven')).at(-1)?.says).toMatch(/cinnamon/);
  });

  it("hints at a keepsake until they're close enough, then gives her one just like it, once", () => {
    const h = harness();
    goIn(h, 'maudeHouse');
    const hint = arrivals(usePiece(h, 'floatingCandles')).at(-1)!;
    expect(hint.says).toMatch(/Maude's floating candles/);
    expect(h.world.home.stored.some((s) => s.id === 'floatingCandles')).toBe(false);

    h.world.friends.update('maude', { points: 200 });
    walkTo(h, 4, 7);
    const given = usePiece(h, 'floatingCandles');
    expect(given).toContainEqual({ kind: 'keepsake', piece: 'floatingCandles', from: 'maude' });
    expect(h.world.home.stored.find((s) => s.id === 'floatingCandles')?.count).toBe(1);
    // Her second is still waiting on a closer friendship.
    expect(arrivals(usePiece(h, 'wingbackChair')).at(-1)?.says).toMatch(/good friends/);

    walkTo(h, 4, 7);
    const again = usePiece(h, 'floatingCandles');
    expect(again.some((e) => e.kind === 'keepsake')).toBe(false);
    expect(arrivals(again).at(-1)?.says).toMatch(/bob/);
    expect(h.world.home.stored.find((s) => s.id === 'floatingCandles')?.count).toBe(1);

    const back = new World({ ...fromSave(h.world.save()), clock: h.clock });
    expect(back.keepsakes.has('floatingCandles')).toBe(true);
  });

  it('says Cody is saving his for her', () => {
    const h = harness();
    goIn(h, 'codyHouse');
    expect(arrivals(usePiece(h, 'velvetSettee')).at(-1)?.says).toMatch(/saving one/);
  });

  it('has nobody to talk to inside, and nothing to gather', () => {
    const h = harness();
    goIn(h, 'bartyHouse');
    const room = h.world.zones.room('bartyCottage');
    expect(h.world.neighbourhood.villagerAt(4, 5)).toBeUndefined();
    expect(room.propAt()).toBeUndefined();
    const events = walkTo(h, 4, 5);
    expect(events.some((e) => e.kind === 'gathered')).toBe(false);
  });

  it('brings the pet out walking with her inside, which counts as in town on the map', () => {
    const h = harness();
    h.world.petCare.walkWith('dolly');
    goIn(h, 'salonHouse');
    expect(h.world.petCare.pet('dolly').scene).toBe('muse');
    expect(h.world.travel.places().find((p) => p.here)?.id).toBe('town');
    expect(h.world.travel.go('town')).toBe(false);
    expect(h.world.scene).toBe('muse');
  });

  it('puts her back inside where she was when a save is loaded', () => {
    const h = harness();
    goIn(h, 'agathaHouse');
    walkTo(h, 5, 7);
    const back = new World({ ...fromSave(h.world.save()), clock: h.clock });
    expect(back.scene).toBe('agathaCottage');
    expect(back.movement.tile).toEqual({ tx: 5, ty: 7 });
  });
});
