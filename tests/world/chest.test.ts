import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOK, STARTER_WARDROBE } from '../../src/data/outfits';
import { stowable } from '../../src/systems/chest';
import { FakeClock } from '../../src/systems/clock';
import type { Stack } from '../../src/world/Bag';
import { Home } from '../../src/world/Home';
import { fromSave, World } from '../../src/world/World';
import { harness } from './harness';

/** Her bag for these: wood to put away, her skates, a bracelet, and a record. */
const BAG: Stack[] = [
  { id: 'wood', count: 5 },
  { id: 'iceSkates', count: 1 },
  { id: 'loveBracelet', count: 2 },
  { id: 'recordBoneJovi', count: 1 },
];

/** Walks her in through her front door, from the step outside it. */
function atHome(bag: Stack[] = BAG, wrist: string[] = []) {
  const look = { ...DEFAULT_LOOK, name: 'Her', wrist } as typeof DEFAULT_LOOK;
  const h = harness(undefined, {
    finds: { bag },
    closet: { look, wardrobe: [...STARTER_WARDROBE] },
    home: { placed: [{ id: 'recordPlayer', tx: 6, ty: 3, turn: 0 }] },
  });
  const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
  h.world.tapTile(house.tx + 1, house.ty + 1);
  h.until(() => h.world.scene === 'home', 'going in');
  return h;
}

describe('the storage chest takes things from her bag (0.3’s H1)', () => {
  it('keeps nothing of hers to keep with her, and all she can spare of the rest', () => {
    expect(stowable('wood', 5)).toBe(5);
    expect(stowable('iceSkates', 1)).toBe(0);
    expect(stowable('broom', 1)).toBe(0);
    expect(stowable('castleKey', 1)).toBe(0);
    expect(stowable('wood', 0)).toBe(0);
  });

  it('puts some away and takes them back out, nothing lost on the way', () => {
    const { world } = atHome();
    expect(world.chest.canPutAway('wood')).toBe(5);
    expect(world.chest.putAway('wood', 3)).toBe(true);
    expect(world.bag.count('wood')).toBe(2);
    expect(world.chest.items).toEqual([{ id: 'wood', count: 3 }]);
    expect(world.chest.putAway('wood', 2)).toBe(true);
    expect(world.bag.count('wood')).toBe(0);
    expect(world.chest.items).toEqual([{ id: 'wood', count: 5 }]);
    expect(world.chest.takeOut('wood', 6)).toBe(false);
    expect(world.chest.takeOut('wood', 4)).toBe(true);
    expect(world.bag.count('wood')).toBe(4);
    expect(world.chest.takeOut('wood', 1)).toBe(true);
    expect(world.chest.items).toEqual([]);
    expect(world.bag.count('wood')).toBe(5);
  });

  it('takes nothing away from home, of what she wears, or of what she keeps with her', () => {
    const outside = harness(undefined, { finds: { bag: BAG } });
    expect(outside.world.chest.canPutAway('wood')).toBe(0);
    expect(outside.world.chest.putAway('wood', 1)).toBe(false);

    const { world } = atHome(BAG, ['loveBracelet']);
    expect(world.chest.canPutAway('iceSkates')).toBe(0);
    expect(world.chest.putAway('iceSkates', 1)).toBe(false);
    expect(world.chest.canPutAway('loveBracelet')).toBe(1);
    expect(world.chest.putAway('loveBracelet', 2)).toBe(false);
    expect(world.chest.putAway('wood', 0)).toBe(false);
    expect(world.chest.putAway('wood', 1.5)).toBe(false);
    expect(world.bag.count('loveBracelet')).toBe(2);
    expect(world.bag.count('iceSkates')).toBe(1);
  });

  it('keeps what she put away in the save', () => {
    const { world } = atHome();
    world.chest.putAway('wood', 4);
    const clock = new FakeClock(new Date(2026, 8, 26, 12));
    const again = new World({ clock, ...fromSave(world.save()) });
    expect(again.chest.items).toEqual([{ id: 'wood', count: 4 }]);
    expect(again.bag.count('wood')).toBe(1);
  });

  it('lets go of a saved thing it no longer knows, or a count that is no count', () => {
    const home = new Home({
      items: [
        { id: 'wood', count: 2 },
        { id: 'someDayThing' as never, count: 1 },
        { id: 'stone', count: 0 },
        { id: 'wood', count: 1 },
      ],
    });
    expect(home.items).toEqual([{ id: 'wood', count: 3 }]);
  });

  it('plays a record put away, being home too', () => {
    const { world, until, tick } = atHome();
    world.chest.putAway('recordBoneJovi', 1);
    world.tapTile(6, 3);
    const events = [...until(() => !world.player.moving, 'walking to it'), ...tick(1)];
    expect(events).toContainEqual({ kind: 'played', record: 'recordBoneJovi' });
  });

  it('marks nothing new that comes back out of the chest', () => {
    const { world } = atHome();
    world.novelty.seen('bag');
    world.chest.putAway('wood', 5);
    world.chest.takeOut('wood', 5);
    expect(world.novelty.isNew('bag', 'wood')).toBe(false);
  });
});
