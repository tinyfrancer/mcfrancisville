import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, STARTER_WARDROBE } from '../../src/data/outfits';
import type { Stack } from '../../src/world/Bag';
import { World, fromSave } from '../../src/world/World';
import { harness } from './harness';

const dressed = { ...DEFAULT_LOOK, name: 'Her' };

function withBracelets(bag: { id: string; count: number }[], wrist: string[] = []) {
  const look = { ...dressed, wrist } as typeof dressed;
  return harness(undefined, {
    closet: { look, wardrobe: [...STARTER_WARDROBE] },
    finds: { bag: bag as Stack[] },
  });
}

describe('bracelets on her wrist', () => {
  it('stacks up to three, nearest her hand the last put on', () => {
    const { world } = withBracelets([
      { id: 'loveBracelet', count: 2 },
      { id: 'smileyBracelet', count: 1 },
      { id: 'spookyBracelet', count: 1 },
    ]);
    expect(world.wardrobe.wearBracelet('loveBracelet')).toBe(true);
    expect(world.wardrobe.wearBracelet('loveBracelet')).toBe(true);
    expect(world.wardrobe.wearBracelet('smileyBracelet')).toBe(true);
    expect(world.wardrobe.wearBracelet('spookyBracelet')).toBe(false);
    expect(world.wardrobe.look.wrist).toEqual(['smileyBracelet', 'loveBracelet', 'loveBracelet']);
  });

  it("can't wear more of one than she has", () => {
    const { world } = withBracelets([{ id: 'loveBracelet', count: 1 }]);
    expect(world.wardrobe.wearBracelet('loveBracelet')).toBe(true);
    expect(world.wardrobe.wearBracelet('loveBracelet')).toBe(false);
    expect(world.wardrobe.wearBracelet('smileyBracelet')).toBe(false);
  });

  it('keeps a worn one in her bag, never sold or given until she takes it off', () => {
    const { world } = withBracelets([{ id: 'loveBracelet', count: 2 }], ['loveBracelet']);
    expect(world.bag.count('loveBracelet')).toBe(2);
    expect(world.bag.spare('loveBracelet')).toBe(1);
    expect(world.shops.sell('loveBracelet', 2)).toBeNull();
    expect(world.shops.sell('loveBracelet')).not.toBeNull();
    expect(world.bag.spares.find((s) => s.id === 'loveBracelet')).toBeUndefined();
    expect(world.neighbourhood.give('cody', 'loveBracelet')).toBeNull();
    expect(world.bag.count('loveBracelet')).toBe(1);

    expect(world.wardrobe.takeOffBracelet('loveBracelet')).toBe(true);
    expect(world.wardrobe.look.wrist).toEqual([]);
    expect(world.neighbourhood.give('cody', 'loveBracelet')).not.toBeNull();
    expect(world.bag.count('loveBracelet')).toBe(0);
  });

  it('comes off her wrist if the bag no longer has it, from a save', () => {
    const { world } = withBracelets(
      [{ id: 'loveBracelet', count: 1 }],
      ['loveBracelet', 'loveBracelet', 'smileyBracelet', 'pumpkin'],
    );
    expect(world.wardrobe.look.wrist).toEqual(['loveBracelet']);
  });

  it('is saved, and comes back on her wrist', () => {
    const { world, clock } = withBracelets([{ id: 'scarletBracelet', count: 1 }]);
    world.wardrobe.wearBracelet('scarletBracelet');
    const again = new World({ ...fromSave(world.save()), clock });
    expect(again.wardrobe.look.wrist).toEqual(['scarletBracelet']);
    expect(again.bag.spare('scarletBracelet')).toBe(0);
  });

  it('is worn by a neighbour she gives one to, and saved', () => {
    const { world, clock } = withBracelets([{ id: 'friendshipBracelet', count: 1 }]);
    expect(world.neighbourhood.give('cody', 'friendshipBracelet')?.declined).toBe(false);
    expect(world.friends.of('cody').wears).toBe('friendshipBracelet');
    const again = new World({ ...fromSave(world.save()), clock });
    expect(again.friends.of('cody').wears).toBe('friendshipBracelet');
  });
});
