import { describe, expect, it } from 'vitest';
import { STARTER_RECIPES, stationOf } from '../../src/data/recipes';
import { harness } from './harness';

/** Walks her in through her front door. */
function goHome(h = harness()) {
  const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
  h.world.tapTile(house.tx + 1, house.ty + 1);
  h.until(() => h.world.scene === 'home', 'going in');
  return h;
}

describe('the workbench', () => {
  it('stands in her home from the first day, and she arrives at it', () => {
    const h = goHome();
    expect(h.world.home.pieceAt(4, 3)?.id).toBe('workbench');
    h.world.tapTile(5, 3);
    const events = h.until(() => !h.world.player.moving, 'walking to the workbench');
    expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', piece: 'workbench' }));
  });
});

describe('making things', () => {
  it('knows the starting recipes, and remembers any she has learned', () => {
    const h = harness();
    expect(h.world.workbench.recipes).toEqual(
      STARTER_RECIPES.filter((id) => stationOf(id) === 'bench'),
    );
    expect(h.world.workbench.learn('stoneHearth')).toBe(true);
    expect(h.world.workbench.learn('stoneHearth')).toBe(false);
    const back = harness(undefined, h.world.workbench.snapshot());
    expect(back.world.workbench.knows('stoneHearth')).toBe(true);
    expect(
      harness(undefined, { recipes: ['hotTub', 'pepperGarland'] }).world.workbench.recipes,
    ).toContain('pepperGarland');
  });

  it('strings a bracelet from her beads, into her bag', () => {
    const h = harness(undefined, { finds: { bag: [{ id: 'smileyBead', count: 4 }] } });
    expect(h.world.workbench.craft('smileyBracelet')).toEqual({
      kind: 'made',
      recipe: 'smileyBracelet',
      made: { item: 'smileyBracelet' },
    });
    expect(h.world.bag.count('smileyBead')).toBe(1);
    expect(h.world.bag.count('smileyBracelet')).toBe(1);
    expect(h.world.workbench.craft('smileyBracelet')).toBeNull();
    expect(h.world.bag.count('smileyBead')).toBe(1);
  });

  it('makes furniture into her storage chest', () => {
    const h = harness(undefined, { finds: { bag: [{ id: 'wood', count: 6 }] } });
    expect(h.world.workbench.craft('stumpStool')).not.toBeNull();
    // All but her skates, which she always has (decision 211).
    expect(h.world.bag.contents).toEqual([{ id: 'iceSkates', count: 1 }]);
    expect(h.world.home.stored).toContainEqual({ id: 'stumpStool', count: 1 });
  });

  it('only makes a recipe she has learned', () => {
    const h = harness(undefined, { finds: { bag: [{ id: 'stone', count: 20 }] } });
    expect(h.world.workbench.craft('littleGargoyle')).toBeNull();
    h.world.workbench.learn('littleGargoyle');
    expect(h.world.workbench.craft('littleGargoyle')).not.toBeNull();
    expect(h.world.bag.count('stone')).toBe(8);
  });

  it('builds her house bigger, twice, and tells the HUD her home changed', () => {
    const bag = [
      { id: 'wood' as const, count: 180 },
      { id: 'stone' as const, count: 60 },
    ];
    const h = harness(undefined, { finds: { bag } });
    let changed = 0;
    h.world.events.on('home', () => changed++);
    expect(h.world.workbench.craft('grandExtension')).toBeNull();
    expect(h.world.workbench.craft('roomyExtension')).toMatchObject({ made: { room: 1 } });
    expect(h.world.home.room.size).toBe(1);
    expect(h.world.workbench.craft('roomyExtension')).toBeNull();
    expect(h.world.workbench.craft('grandExtension')).toMatchObject({ made: { room: 2 } });
    expect(h.world.home.room.size).toBe(2);
    // All but her skates, which she always has (decision 211).
    expect(h.world.bag.contents).toEqual([{ id: 'iceSkates', count: 1 }]);
    expect(changed).toBe(2);
    expect(h.world.save().home.size).toBe(2);
  });
});

describe('recipe cards', () => {
  it('turn up at Cobweb Corner, and are bought once and learned', () => {
    const h = harness(undefined, { candy: 5000 });
    const cardToday = () =>
      h.world.shops
        .stock('corner')
        .flatMap((s) => s.offers)
        .flatMap((o) => ('recipe' in o.ware ? [o.ware.recipe] : []))[0];
    for (let d = 0; d < 30 && !cardToday(); d++) h.clock.advance(24 * 3600_000);
    const recipe = cardToday()!;
    expect(recipe).toBeDefined();
    expect(h.world.shops.buy('corner', { recipe })).toMatchObject({ kind: 'bought' });
    expect(h.world.workbench.knows(recipe)).toBe(true);
    expect(h.world.shops.buy('corner', { recipe })).toBeNull();
  });
});
