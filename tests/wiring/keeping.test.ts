import { describe, expect, it } from 'vitest';
import type { Hud } from '../../src/hud/Hud';
import { FakeClock } from '../../src/systems/clock';
import { keepTown } from '../../src/wiring/keeping';
import { World } from '../../src/world/World';

/**
 * Her town is stamped by the world's clock (1.3's F6): on her phone that is the real one, and
 * under a dev build's `?day=` it is the day the town was played on, so it is saved as played then.
 */
describe('keepTown stamps', () => {
  const hud = () => ({}) as Hud;

  it("a new town is stamped by the world's clock, not the phone's", () => {
    const clock = new FakeClock(new Date(2026, 0, 15, 12));
    const keeping = keepTown(new World({ clock }), null, hud);
    const save = keeping.currentSave();
    expect(save.updatedAt).toBe(clock.now());
    expect(save.lastPlayedAt).toBe(clock.now());
    // When the town was made is the phone's own time, which the weekly nudge counts from.
    expect(keeping.createdAt()).toBeGreaterThan(clock.now());
    keeping.autosave.stop();
    keeping.cloud.stop();
  });

  it('each save takes the time then, keeping when the town was first saved', () => {
    const clock = new FakeClock(new Date(2026, 1, 3, 19));
    const keeping = keepTown(new World({ clock }), null, hud);
    const first = keeping.currentSave();
    clock.advance(90_000);
    const later = keeping.currentSave();
    expect(later.updatedAt).toBe(first.updatedAt + 90_000);
    expect(later.lastPlayedAt).toBe(later.updatedAt);
    expect(later.createdAt).toBe(first.createdAt);
    keeping.autosave.stop();
    keeping.cloud.stop();
  });
});
