import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { DEFAULT_LOOK } from '../../src/data/outfits';
import { harness } from './harness';

describe('film night (0.2 J3)', () => {
  it("sets the screen and the popcorn out on its day only, solid while they're there", () => {
    const h = harness(TOWN);
    const town = h.world.zones.outdoor('town')!;
    h.clock.set(new Date(2026, 9, 10, 12));
    const set = town.decorations!.props().map((p) => p.id);
    expect(set).toContain('filmScreen');
    expect(set).toContain('popcornTable');
    expect(town.canWalk(19, 28)).toBe(false);
    h.clock.set(new Date(2026, 9, 11, 12));
    expect(town.decorations!.props().map((p) => p.id)).not.toContain('filmScreen');
    expect(town.canWalk(19, 28)).toBe(true);
  });

  it('seats the town facing the screen, and Cody hands her popcorn', () => {
    const h = harness(TOWN, { closet: { look: { ...DEFAULT_LOOK, name: 'Em' } } });
    h.clock.set(new Date(2026, 9, 10, 20));
    h.tick(1);
    h.until(
      () => h.world.neighbourhood.neighbours.every((n) => n.zone !== 'town' || !n.moving),
      'everyone in their seats',
      600_000,
    );
    h.tick(2);
    const cody = h.world.neighbourhood.neighbour('cody');
    expect(cody.zone).toBe('town');
    expect(cody.tile.ty).toBeGreaterThan(28);
    expect(cody.facing).toBe('up');
    h.world.tapTile(cody.tile.tx, cody.tile.ty);
    h.until(() => h.world.neighbourhood.talkingTo === 'cody', 'walking up to Cody', 120_000);
    h.world.neighbourhood.talk('cody');
    expect(h.world.bag.count('popcorn')).toBe(1);
  });
});
