import { describe, expect, it } from 'vitest';
import { STARTER_RECIPES } from '../../src/data/recipes';
import { harness } from './harness';

/** Walks her in through her front door. */
function goHome(h = harness()) {
  const house = h.town.map.props.find((p) => p.id === 'homeHouse')!;
  h.town.tapTile(house.tx + 1, house.ty + 1);
  h.until(() => h.town.scene === 'home', 'going in');
  return h;
}

describe('the workbench', () => {
  it('stands in her home from the first day, and she arrives at it', () => {
    const h = goHome();
    expect(h.town.home.pieceAt(4, 3)?.id).toBe('workbench');
    h.town.tapTile(5, 3);
    const events = h.until(() => !h.town.player.moving, 'walking to the workbench');
    expect(events).toContainEqual(expect.objectContaining({ kind: 'arrived', piece: 'workbench' }));
  });
});

describe('making things', () => {
  it('knows the starting recipes, and remembers any she has learned', () => {
    const h = harness();
    expect(h.town.recipes).toEqual(STARTER_RECIPES);
    expect(h.town.learn('stoneHearth')).toBe(true);
    expect(h.town.learn('stoneHearth')).toBe(false);
    const back = harness(undefined, h.town.recipeBook());
    expect(back.town.knows('stoneHearth')).toBe(true);
    expect(harness(undefined, { recipes: ['hotTub', 'pepperGarland'] }).town.recipes).toContain(
      'pepperGarland',
    );
  });

  it('strings a bracelet from her beads, into her bag', () => {
    const h = harness(undefined, { finds: { bag: [{ id: 'smileyBead', count: 4 }] } });
    expect(h.town.craft('smileyBracelet')).toEqual({
      kind: 'made',
      recipe: 'smileyBracelet',
      made: { item: 'smileyBracelet' },
    });
    expect(h.town.bag.count('smileyBead')).toBe(1);
    expect(h.town.bag.count('smileyBracelet')).toBe(1);
    expect(h.town.craft('smileyBracelet')).toBeNull();
    expect(h.town.bag.count('smileyBead')).toBe(1);
  });

  it('makes furniture into her storage chest', () => {
    const h = harness(undefined, { finds: { bag: [{ id: 'wood', count: 6 }] } });
    expect(h.town.craft('stumpStool')).not.toBeNull();
    expect(h.town.bag.contents).toEqual([]);
    expect(h.town.home.stored).toContainEqual({ id: 'stumpStool', count: 1 });
  });

  it('only makes a recipe she has learned', () => {
    const h = harness(undefined, { finds: { bag: [{ id: 'stone', count: 20 }] } });
    expect(h.town.craft('littleGargoyle')).toBeNull();
    h.town.learn('littleGargoyle');
    expect(h.town.craft('littleGargoyle')).not.toBeNull();
    expect(h.town.bag.count('stone')).toBe(8);
  });

  it('builds her house bigger, twice, and tells the HUD her home changed', () => {
    const bag = [
      { id: 'wood' as const, count: 180 },
      { id: 'stone' as const, count: 60 },
    ];
    const h = harness(undefined, { finds: { bag } });
    let changed = 0;
    h.town.events.on('home', () => changed++);
    expect(h.town.craft('grandExtension')).toBeNull();
    expect(h.town.craft('roomyExtension')).toMatchObject({ made: { room: 1 } });
    expect(h.town.home.room.size).toBe(1);
    expect(h.town.craft('roomyExtension')).toBeNull();
    expect(h.town.craft('grandExtension')).toMatchObject({ made: { room: 2 } });
    expect(h.town.home.room.size).toBe(2);
    expect(h.town.bag.contents).toEqual([]);
    expect(changed).toBe(2);
    expect(h.town.homeSnapshot().home.size).toBe(2);
  });
});

describe('recipe cards', () => {
  it('turn up at Cobweb Corner, and are bought once and learned', () => {
    const h = harness(undefined, { candy: 5000 });
    const cardToday = () =>
      h.town
        .stock('corner')
        .flatMap((s) => s.offers)
        .flatMap((o) => ('recipe' in o.ware ? [o.ware.recipe] : []))[0];
    for (let d = 0; d < 30 && !cardToday(); d++) h.clock.advance(24 * 3600_000);
    const recipe = cardToday()!;
    expect(recipe).toBeDefined();
    expect(h.town.buy('corner', { recipe })).toMatchObject({ kind: 'bought' });
    expect(h.town.knows(recipe)).toBe(true);
    expect(h.town.buy('corner', { recipe })).toBeNull();
  });
});
