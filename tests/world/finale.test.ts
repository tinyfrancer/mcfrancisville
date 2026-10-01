import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { DEFAULT_LOOK, STARTER_WARDROBE } from '../../src/data/outfits';
import { codyHalf, finaleLetterId, herHalf } from '../../src/systems/finale';
import { letterOf, lettersOn } from '../../src/systems/friendship';
import type { Look } from '../../src/types/look';
import { harness } from './harness';

const inWings: Look = {
  ...DEFAULT_LOOK,
  name: 'Em',
  outfit: { ...DEFAULT_LOOK.outfit, top: { id: 'butterflyWings', fabric: 'pumpkin' } },
};

/** The town on Halloween at an hour, everyone where they should be. */
function halloween(hour: number, look: Look = { ...DEFAULT_LOOK, name: 'Em' }) {
  const wardrobe = [...STARTER_WARDROBE, 'butterflyWings' as const];
  const h = harness(TOWN, { closet: { look, wardrobe } });
  h.clock.set(new Date(2026, 9, 31, hour, 30));
  h.tick(1);
  h.until(
    () => h.world.neighbourhood.neighbours.every((n) => n.zone !== 'town' || !n.moving),
    'everyone in their places',
    600_000,
  );
  h.tick(2);
  return h;
}

describe('the costume contest (0.2 J4)', () => {
  it('lines the town up before the stage on the 31st, facing her, the judge', () => {
    const h = halloween(18);
    const town = h.world.zones.outdoor('town')!;
    expect(town.decorations!.props().map((p) => p.id)).toContain('contestStage');
    const rufus = h.world.neighbourhood.neighbour('rufus');
    expect(rufus.zone).toBe('town');
    expect(rufus.tile.ty).toBeGreaterThanOrEqual(29);
    expect(rufus.facing).toBe('down');
  });

  it('lets her crown one neighbour a night, who is thrilled, closer, and sparkles', () => {
    const h = halloween(18);
    const before = h.world.friends.of('rufus').points;
    expect(h.world.finale.canCrown('rufus')).toBe(true);
    const crowned = h.world.finale.crown('rufus')!;
    expect(crowned.line).toMatch(/SHEEP/);
    expect(crowned.aside).toMatch(/Rufus wins best costume, and takes home the Golden Gourd!/);
    expect(h.tick(1)).toContainEqual({ kind: 'crowned', villager: 'rufus' });
    expect(h.world.finale.crowned()).toBe('rufus');
    expect(h.world.friends.of('rufus').points).toBe(before + 50);
    expect(h.world.finale.canCrown('barty')).toBe(false);
    expect(h.world.finale.crown('barty')).toBeNull();
  });

  it('is only on Halloween night', () => {
    const h = harness(TOWN, { closet: { look: { ...DEFAULT_LOOK, name: 'Em' } } });
    h.clock.set(new Date(2026, 9, 31, 12));
    h.tick(1);
    expect(h.world.finale.canCrown('rufus')).toBe(false);
    h.clock.set(new Date(2026, 9, 30, 18, 30));
    h.tick(1);
    expect(h.world.finale.canCrown('rufus')).toBe(false);
  });
});

describe('the party (0.2 J4)', () => {
  it("puts out the chili and the pumpkins round the square, and hers only if she's carved it", () => {
    const h = halloween(21);
    const set = () =>
      h.world.zones
        .outdoor('town')!
        .decorations!.props()
        .map((p) => p.id);
    expect(set()).toContain('chiliTable');
    expect(set().filter((id) => id === 'pumpkin').length).toBeGreaterThanOrEqual(6);
    expect(set()).not.toContain('catPumpkin');
    h.world.home.store('catLantern', 1);
    expect(set()).toContain('catPumpkin');
  });

  it('has Cody in the other half of her costume, and his chili, and their photo', () => {
    const h = halloween(21, inWings);
    expect(h.world.finale.costumeOf('cody')).toBe('bugCatcher');
    expect(h.world.finale.costumeOf('rufus')).toBe('own');
    const cody = h.world.neighbourhood.neighbour('cody');
    h.world.tapTile(cody.tile.tx, cody.tile.ty);
    h.until(() => h.world.neighbourhood.talkingTo === 'cody', 'walking up to Cody', 120_000);
    // His Halloween line and treat come first; the party's, and his chili, after.
    h.world.neighbourhood.talk('cody');
    expect(h.world.neighbourhood.talk('cody').line).toMatch(/chili/);
    expect(h.world.bag.count('whiteChickenChili')).toBe(1);
    expect(h.world.finale.canPhoto('cody')).toBe(true);
    expect(h.world.finale.photo()).toEqual({
      kind: 'photo',
      with: 'cody',
      caption: 'Halloween 2026: a butterfly and a bug catcher',
    });
  });

  it('dresses Cody as his own lion outside the finale, or with her out of costume', () => {
    expect(codyHalf({ ...DEFAULT_LOOK })).toBe('lion');
    expect(herHalf({ ...DEFAULT_LOOK })).toBeNull();
    expect(codyHalf(inWings)).toBe('bugCatcher');
    expect(herHalf(inWings)).toBe('butterfly');
    const h = halloween(12, inWings);
    expect(h.world.finale.costumeOf('cody')).toBe('own');
  });
});

describe("Cody's letter the morning after (0.2 J4)", () => {
  it('comes on 1 November with their photo framed, and only then', () => {
    expect(finaleLetterId('2026-11-01')).toBe('halloweenFestival:2026');
    expect(finaleLetterId('2026-10-31')).toBeNull();
    expect(finaleLetterId('2026-11-02')).toBeNull();
    expect(lettersOn('2026-11-01')).toContain('halloweenFestival:2026');
    expect(letterOf('halloweenFestival:2026')).toMatchObject({
      from: 'cody',
      gift: { furniture: 'halloweenPhoto' },
    });
  });
});

describe('the finale at the fairground (0.2 M3)', () => {
  /** Halloween at an hour, the fairground open and her there. */
  function atTheFair(hour: number) {
    const h = harness(TOWN, {
      closet: { look: { ...DEFAULT_LOOK, name: 'Em' } },
      atlas: { found: ['fairground'], opened: ['fairground'] },
    });
    h.clock.set(new Date(2026, 9, 31, hour, 30));
    h.tick(1);
    expect(h.world.travel.go('fairground')).toBe(true);
    // Long enough for the whole town to walk in from the gate and take their places.
    h.tick(6000);
    return h;
  }

  it('lines the town up before the stage, with no stage put up in town', () => {
    const h = atTheFair(18);
    const town = h.world.zones
      .outdoor('town')!
      .decorations!.props()
      .map((p) => p.id);
    expect(town).not.toContain('contestStage');
    expect(town).not.toContain('chiliTable');
    const rufus = h.world.neighbourhood.neighbour('rufus');
    expect(rufus.tile.ty).toBe(6);
    expect(rufus.facing).toBe('down');
    expect(h.world.finale.canCrown('rufus')).toBe(true);
    expect(h.world.finale.canPhoto('cody')).toBe(true);
  });

  it('has the party there after, with the chili and the pumpkins round the stage', () => {
    const h = atTheFair(21);
    const fair = h.world.zones.outdoor('fairground')!;
    expect(fair.decorations!.props().map((p) => p.id)).toContain('chiliTable');
    expect(h.world.neighbourhood.happeningIn('fairground')).toBe('halloweenParty');
    expect(h.world.neighbourhood.whereIs('maude')!.doing).toEqual({ happening: 'halloweenParty' });
  });
});
