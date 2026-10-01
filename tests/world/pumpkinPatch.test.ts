import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { RECIPES } from '../../src/data/recipes';
import { parseMap } from '../../src/systems/grid';
import { harness, type Harness } from './harness';

const patch = parseMap(TOWN).props.find((p) => p.id === 'pumpkinPatch')!;

function walkUp(h: Harness) {
  h.world.tapTile(patch.tx + 1, patch.ty);
  return h.until(() => !h.world.player.moving, 'walking to the patch').concat(h.tick(1));
}

describe('the pumpkin patch', () => {
  it('stands on her farm', () => {
    expect(patch).toMatchObject({ w: 3, h: 2 });
  });

  it('says how it is coming on until it is ripe, and gives nothing', () => {
    const h = harness(TOWN);
    expect(walkUp(h)).toContainEqual({ kind: 'patch', stage: 'resting' });
    h.clock.set(new Date(2026, 9, 9, 12));
    expect(walkUp(h)).toContainEqual({ kind: 'patch', stage: 'flowering' });
    expect(h.world.bag.count('patchPumpkin')).toBe(0);
  });

  it('gives a pumpkin a day once it is ripe, for carving into her cat', () => {
    const h = harness(TOWN);
    h.clock.set(new Date(2026, 9, 16, 12));
    expect(walkUp(h)).toContainEqual({ kind: 'patch', stage: 'ripe', picked: true });
    h.world.tapTile(4, 12);
    h.until(() => !h.world.player.moving, 'walking away');
    expect(walkUp(h)).toContainEqual({ kind: 'patch', stage: 'ripe', picked: false });
    expect(h.world.bag.count('patchPumpkin')).toBe(1);
    h.clock.set(new Date(2026, 9, 17, 12));
    expect(walkUp(h)).toContainEqual({ kind: 'patch', stage: 'ripe', picked: true });
    expect(h.world.bag.count('patchPumpkin')).toBe(2);
    expect(RECIPES.catLantern.needs).toEqual([{ item: 'patchPumpkin', count: 1 }]);
  });
});
