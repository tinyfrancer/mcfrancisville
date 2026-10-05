import { describe, expect, it } from 'vitest';
import { ITEMS } from '../../src/data/items';
import { BOO_ACRES } from '../../src/data/maps';
import { CORNELIUS_SAYS } from '../../src/data/scarah';
import { VILLAGERS } from '../../src/data/villagers';
import { parseMap } from '../../src/systems/grid';
import { dayKey } from '../../src/systems/clock';
import { stopOf } from '../../src/systems/schedules';
import type { ItemId } from '../../src/types/ids';
import { fromSave, World } from '../../src/world/World';
import { harness, type Harness } from './harness';

/*
 * Scarah, the scarecrow who comes with 0.3 (0.3's F3, decision 243): at home at Boo Acres from
 * the first day, her farmhouse through its door, and her packet of every seed at three hearts.
 */

function walkTo(h: Harness, tx: number, ty: number) {
  h.world.tapTile(tx, ty);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(1));
}

const ACRES = parseMap(BOO_ACRES);
const EVERY_SEED = (Object.keys(ITEMS) as ItemId[]).filter((id) => ITEMS[id].kind === 'seed');

describe("Scarah (0.3's F3)", () => {
  it('lives at Boo Acres: the fields at first light, her cart in the morning, home at night', () => {
    // Wednesday 30 September 2026, a plain weekday.
    const day = dayKey(new Date(2026, 8, 30, 12).getTime());
    const cart = BOO_ACRES.spots!.seedCart!;
    expect(stopOf('scarah', 6, day)).toMatchObject({ zone: 'booAcres' });
    expect(stopOf('scarah', 10, day)).toEqual({ zone: 'booAcres', ...cart });
    expect(stopOf('scarah', 22, day).zone).toBe('scarahFarmhouse');
  });

  it('goes into her farmhouse by its door at the middle, and back out onto the step', () => {
    const h = harness(undefined, {
      player: { zone: 'booAcres', ...BOO_ACRES.spawn, facing: 'down' },
    });
    const house = ACRES.props.find((p) => p.id === 'farmhouse')!;
    expect(BOO_ACRES.doors).toContainEqual({ prop: 'farmhouse', to: 'scarahFarmhouse' });
    expect(walkTo(h, house.tx + 2, house.ty + 2)).toContainEqual({
      kind: 'entered',
      scene: 'scarahFarmhouse',
    });
    const mat = h.world.zones.room('scarahFarmhouse').room.mat;
    walkTo(h, mat.tx, mat.ty - 1);
    expect(walkTo(h, mat.tx, mat.ty)).toContainEqual({ kind: 'entered', scene: 'booAcres' });
    expect(h.world.movement.tile).toEqual({ tx: house.tx + 2, ty: house.ty + house.h });
  });

  it('sends a packet of every seed there is at three hearts, once, into her bag', () => {
    const h = harness();
    h.world.friends.update('scarah', { points: 295 });
    h.world.neighbourhood.talk('scarah');
    h.world.neighbourhood.endTalk();
    const before = EVERY_SEED.map((id) => h.world.bag.count(id));
    expect(h.world.mailbox.open('scarah:3')).toBe(true);
    expect(EVERY_SEED.map((id) => h.world.bag.count(id))).toEqual(before.map((n) => n + 1));
    expect(h.world.mailbox.open('scarah:3')).toBe(false);
    expect(EVERY_SEED.map((id) => h.world.bag.count(id))).toEqual(before.map((n) => n + 1));
    const back = new World({ ...fromSave(h.world.save()), clock: h.clock });
    expect(EVERY_SEED.map((id) => back.bag.count(id))).toEqual(before.map((n) => n + 1));
  });

  it('has Cornelius say his one word, and only that', () => {
    const lines = JSON.stringify(VILLAGERS.scarah);
    const quoted = [...lines.matchAll(/says \\"([^"\\]+)\.?\\"/g)].map((m) =>
      m[1]!.replace(/[.!]$/, ''),
    );
    expect(quoted.length).toBeGreaterThan(3);
    for (const word of quoted) expect(word).toBe(CORNELIUS_SAYS);
  });
});
