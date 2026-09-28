import { describe, expect, it } from 'vitest';
import { POT_PLANT_IDS } from '../../src/data/porch';
import { fromSave, type WorldEvent } from '../../src/world/World';
import { Porch } from '../../src/world/Porch';
import { harness } from './harness';

/** Walks her up to the pot by her door and back to the step, and returns what happened. */
function tendPots(h: ReturnType<typeof harness>): WorldEvent[] {
  const pot = h.world.map.props.find((p) => p.id === 'pottedPlant')!;
  h.world.tapTile(pot.tx, pot.ty);
  // She's already beside it on her step, so the arrival comes with the next step.
  return [...h.tick(1), ...h.until(() => !h.world.movement.walking, 'walking up to the pots')];
}

describe('the pots by her door', () => {
  it('start with the mums, and put the next plant round in them each time she walks up', () => {
    const h = harness();
    expect(h.world.porch.plant).toBe('mums');
    const seen: string[] = [];
    for (let i = 0; i < POT_PLANT_IDS.length; i++) {
      const potted = tendPots(h).find((e) => e.kind === 'potted');
      expect(potted, `visit ${i}`).toBeDefined();
      seen.push(h.world.porch.plant);
    }
    // Every plant came round once, and then the mums again.
    expect(new Set(seen)).toEqual(new Set(POT_PLANT_IDS));
    expect(seen.at(-1)).toBe('mums');
  });

  it('are saved, and a plant this build does not know gives back the mums', () => {
    const h = harness();
    tendPots(h);
    const saved = h.world.save();
    expect(saved.porch).toEqual({ plant: 'plumMums' });
    expect(harness(undefined, fromSave(saved)).world.porch.plant).toBe('plumMums');
    expect(new Porch({ plant: 'venusFlytrap' as never }).plant).toBe('mums');
  });
});
