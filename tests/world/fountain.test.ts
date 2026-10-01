import { describe, expect, it } from 'vitest';
import { TOWN_SPOTS } from '../../src/data/maps';
import { harness } from './harness';

describe("the fountain playing (0.2's H2)", () => {
  const bank = TOWN_SPOTS.pondWest;

  it('plays for her standing on the bank after dark, and not by day or away from it', () => {
    const h = harness(undefined, { player: { zone: 'town', ...bank, facing: 'right' } });
    expect(h.world.fountain.playing()).toBe(false);
    h.clock.set(new Date(2026, 9, 3, 21));
    expect(h.world.fountain.playing()).toBe(true);
    h.clock.set(new Date(2026, 9, 4, 8));
    expect(h.world.fountain.playing()).toBe(false);
  });

  it('is quiet for her at her door, and indoors', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 3, 21));
    expect(h.world.fountain.playing()).toBe(false);
    const home = harness(undefined, { player: { zone: 'home', tx: 3, ty: 4, facing: 'down' } });
    home.clock.set(new Date(2026, 9, 3, 21));
    expect(home.world.fountain.playing()).toBe(false);
  });
});
