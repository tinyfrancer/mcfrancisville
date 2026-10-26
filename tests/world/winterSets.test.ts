import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../../src/config/world';
import type { FurnitureId } from '../../src/types/ids';
import type { WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Her room with a winter set's pieces out, and her standing at its foot. */
function homeWith(placed: { id: FurnitureId; tx: number; ty: number }[]): Harness {
  const home = { rooms: { main: { placed: placed.map((p) => ({ ...p, turn: 0 })) } } };
  return harness(undefined, { home, player: { zone: 'home', tx: 6, ty: 8, facing: 'up' } });
}

function walkTo(h: Harness, tx: number, ty: number): WorldEvent[] {
  expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(2));
}

describe("the winter sets at home (1.4's G2)", () => {
  it('plays the starlight lullaby on the telescope, every time', () => {
    const h = homeWith([{ id: 'brassTelescope', tx: 6, ty: 3 }]);
    for (let i = 0; i < 2; i++) {
      walkTo(h, 6, 6);
      const events = walkTo(h, 6, 3);
      expect(events).toContainEqual(
        expect.objectContaining({ kind: 'arrived', piece: 'brassTelescope' }),
      );
      expect(events).toContainEqual(
        expect.objectContaining({ kind: 'tune', tune: 'starlightLullaby' }),
      );
    }
  });

  it('sits her in the rocking chair and on the velvet chaise', () => {
    const h = homeWith([
      { id: 'rockingChair', tx: 3, ty: 4 },
      { id: 'velvetChaise', tx: 7, ty: 4 },
    ]);
    walkTo(h, 3, 4);
    expect(h.world.sitting.seat?.floor).toBe(5 * TILE_SIZE);
    expect(h.world.poses.pose()).toBe('sit');
    h.world.tapTile(6, 7);
    h.until(() => h.world.sitting.seat === null, 'standing up');
    walkTo(h, 7, 4);
    expect(h.world.sitting.seat?.floor).toBe(5 * TILE_SIZE);
  });

  it('stands the mug tree, the little moon and the candles on a table, as small things do', () => {
    const h = homeWith([{ id: 'teaTable', tx: 5, ty: 6 }]);
    h.tick(1);
    (['mugTree', 'lunarGlobe', 'candleCluster'] as const).forEach((id, i) => {
      h.world.home.store(id);
      expect(h.world.decorating.takeOut(id), id).toBe(true);
      expect(h.world.decorating.tap(5, 6), id).toBe(true);
      const placed = h.world.home.rooms.placed.find((p) => p.id === id);
      expect(placed, id).toMatchObject({ tx: 5, ty: 6, on: true });
      // Down on the floor again, a tile apart, to clear the table for the next.
      expect(h.world.decorating.tap(3 + i * 2, 9), id).toBe(true);
      expect(placed, id).toEqual({ id, tx: 3 + i * 2, ty: 9, turn: 0 });
    });
  });
});
