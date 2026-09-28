import { describe, expect, it } from 'vitest';
import { fromSave, World } from '../../src/world/World';
import { harness } from './harness';

describe('what is new', () => {
  it('is nothing in a new game', () => {
    const { world } = harness();
    expect(world.novelty.counts()).toEqual({
      bag: 0,
      closet: 0,
      storage: 0,
      cabinet: 0,
      recipes: 0,
    });
  });

  it('marks what arrives on a shelf until she has looked at it', () => {
    const { world } = harness();
    const counts: number[] = [];
    world.events.on('fresh', (c) => counts.push(c.bag));
    world.belongings.receive({ item: 'blueRose' });
    expect(world.novelty.isNew('bag', 'blueRose')).toBe(true);
    expect(world.novelty.isNew('bag', 'purseButter')).toBe(false);
    world.novelty.seen('bag');
    expect(world.novelty.isNew('bag', 'blueRose')).toBe(false);
    expect(counts).toEqual([1, 0]);
  });

  it('never marks more of something she already had', () => {
    const { world } = harness();
    const had = world.bag.contents[0]!.id;
    world.belongings.receive({ item: had });
    expect(world.novelty.isNew('bag', had)).toBe(false);
  });

  it('marks new clothes, furniture and recipes on their own shelves', () => {
    const { world } = harness();
    world.belongings.receive({ outfit: 'manyColoursCoat' });
    world.belongings.receive({ furniture: 'stumpStool' });
    world.belongings.receive({ recipe: 'stoneHearth' });
    expect(world.novelty.isNew('closet', 'manyColoursCoat')).toBe(true);
    expect(world.novelty.isNew('storage', 'stumpStool')).toBe(true);
    expect(world.novelty.isNew('recipes', 'stoneHearth')).toBe(true);
    expect(world.novelty.counts().bag).toBe(0);
  });

  it('lets go of a mark on something that has gone', () => {
    const { world } = harness();
    world.belongings.receive({ item: 'blueRose' });
    world.bag.remove('blueRose');
    world.events.emit('bag', world.bag.contents);
    expect(world.novelty.counts().bag).toBe(0);
  });

  it('keeps its marks in the save', () => {
    const { world } = harness();
    world.belongings.receive({ item: 'blueRose' });
    const again = new World(fromSave(world.save()));
    expect(again.novelty.isNew('bag', 'blueRose')).toBe(true);
  });
});
