import { describe, expect, it } from 'vitest';
import { doorStep } from '../../src/data/maps';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { LOTS, lotOf } from '../../src/systems/lots';
import { harness } from './harness';

const DAY = 86_400_000;

describe('everyone lives in town from the first day (decision 211)', () => {
  it('has all her neighbours here, and every house up on its lot', () => {
    const h = harness();
    h.tick(1);
    expect(h.world.neighbourhood.neighbours.map((n) => n.id)).toEqual(VILLAGER_IDS);
    for (const lot of LOTS) {
      const zone = h.world.zones.outdoor(lot.zone)!;
      expect(zone.propAt(lot.house.tx, lot.house.ty)?.id, lot.owner).toBe(lot.house.id);
    }
  });

  it('posts nobody a letter to say they are coming, however long she plays', () => {
    const h = harness();
    h.tick(1);
    for (let day = 0; day < 60; day++) {
      h.clock.advance(DAY);
      h.tick(2);
    }
    const ids = h.world.mailbox.view().map((m) => m.id);
    for (const id of VILLAGER_IDS) expect(ids, id).not.toContain(`${id}:0`);
  });

  it('has their houses to go into, and back out onto the step', () => {
    const h = harness();
    h.tick(1);
    const house = lotOf('ollie')!.house;
    expect(h.world.tapTile(house.tx, house.ty)).toBe(true);
    const events = h.until(() => h.world.scene === 'ollieCottage', 'going in to Ollie');
    expect(events).toContainEqual({ kind: 'entered', scene: 'ollieCottage' });
    const { mat } = h.world.zones.room('ollieCottage').room;
    h.world.tapTile(mat.tx, mat.ty - 1);
    h.until(() => !h.world.player.moving, 'a step in');
    h.world.tapTile(mat.tx, mat.ty);
    h.until(() => h.world.scene === 'town', 'going back out');
    expect(h.world.movement.tile).toEqual(doorStep(house));
  });
});
