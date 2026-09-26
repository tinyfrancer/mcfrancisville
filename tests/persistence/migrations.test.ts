import { describe, expect, it } from 'vitest';
import { ITEMS, STARTER_BAG } from '../../src/data/items';
import { STARTER_HOME } from '../../src/data/home';
import { STARTER_WARDROBE } from '../../src/data/outfits';
import { STARTING_CANDY } from '../../src/data/shop';
import { MIGRATIONS, migrateSave } from '../../src/persistence/migrations';
import { isSaveState, newSave, SAVE_VERSION } from '../../src/persistence/SaveState';

const SAVE = newSave(1000, { tx: 4, ty: 6, facing: 'down', indoors: false });

describe('migrateSave', () => {
  it('passes a current save through untouched', () => {
    expect(migrateSave(structuredClone(SAVE))).toEqual(SAVE);
  });

  it('refuses things that are not saves', () => {
    for (const raw of [null, 3, 'save', [], {}, { version: '1' }, { version: 1.5 }]) {
      expect(migrateSave(raw), JSON.stringify(raw)).toBeNull();
    }
  });

  it('refuses a save from a newer build', () => {
    expect(migrateSave({ ...SAVE, version: SAVE_VERSION + 1 })).toBeNull();
  });

  it('refuses a current-version save with the wrong shape', () => {
    expect(migrateSave({ ...SAVE, player: { tx: 1, ty: 'two', facing: 'down' } })).toBeNull();
    expect(migrateSave({ ...SAVE, player: { tx: 1, ty: 2, facing: 'sideways' } })).toBeNull();
  });

  it('walks a chain of steps one version at a time, and stops at a gap', () => {
    const steps = {
      1: (s: Record<string, unknown>) => ({ ...s, a: 1 }),
      2: (s: Record<string, unknown>) => ({ ...s, b: (s.a as number) + 1 }),
    };
    const old = { ...SAVE, version: 1 };
    const upgraded = migrateSave(old, 3, steps) as unknown as Record<string, unknown>;
    expect(upgraded).toMatchObject({ version: 3, a: 1, b: 2 });
    expect(migrateSave(old, 3, { 2: steps[2] })).toBeNull();
  });

  it('refuses a look or wardrobe of the wrong shape', () => {
    expect(migrateSave({ ...SAVE, look: 'splitDye' })).toBeNull();
    expect(migrateSave({ ...SAVE, look: { ...LOOK, gauges: 'yes' } })).toBeNull();
    expect(migrateSave({ ...SAVE, look: { ...LOOK, outfit: { top: 'jeans' } } })).toBeNull();
    expect(migrateSave({ ...SAVE, wardrobe: 'jeans' })).toBeNull();
    expect(migrateSave({ ...SAVE, wardrobe: [3] })).toBeNull();
  });

  it('keeps a look with ids it does not know, for the wardrobe to repair', () => {
    const later = { ...LOOK, hairStyle: 'mohawk', outfit: { top: { id: 'cape', fabric: 'gold' } } };
    expect(migrateSave({ ...SAVE, look: later })?.look).toEqual(later);
  });
});

const LOOK = {
  name: 'Her',
  skin: 'peach',
  eyes: 'brown',
  hairStyle: 'long',
  hairColour: 'splitDye',
  gauges: true,
  tattoos: 'sleeves',
  outfit: { top: { id: 'teeScreamDion', fabric: 'blue' } },
};

describe('v1 to v2: her look and her clothes', () => {
  const V1 = {
    version: 1,
    createdAt: 1000,
    updatedAt: 2000,
    lastPlayedAt: 2000,
    player: { tx: 9, ty: 12, facing: 'up' },
  };

  it('has no look, so the creator asks her for one, and owns the phase 3 starters', () => {
    const v2 = MIGRATIONS[1]!(structuredClone(V1));
    expect(v2).toEqual({ ...V1, look: null, wardrobe: [...STARTER_WARDROBE] });
    expect(isSaveState(migrateSave(structuredClone(V1)))).toBe(true);
  });

  it('leaves where she stood alone', () => {
    expect(migrateSave(structuredClone(V1))?.player).toEqual({ ...V1.player, indoors: false });
  });
});

describe('v2 to v3: her bag', () => {
  const V2 = {
    version: 2,
    createdAt: 1000,
    updatedAt: 2000,
    lastPlayedAt: 2000,
    player: { tx: 9, ty: 12, facing: 'up' },
    look: LOOK,
    wardrobe: ['jeans'],
  };

  it('starts the bag with the purse butter every new bag had, and nothing taken', () => {
    const v3 = MIGRATIONS[2]!(structuredClone(V2));
    expect(v3).toEqual({ ...V2, bag: [{ id: 'purseButter', count: 5 }], taken: {} });
  });

  it('matches what a new game starts with, once it has come the rest of the way', () => {
    expect(migrateSave(structuredClone(V2))?.bag).toEqual(SAVE.bag);
  });

  it('refuses a bag or takings of the wrong shape', () => {
    expect(migrateSave({ ...SAVE, bag: 'wood' })).toBeNull();
    expect(migrateSave({ ...SAVE, bag: [{ id: 'wood', count: 0 }] })).toBeNull();
    expect(migrateSave({ ...SAVE, bag: [{ id: 'wood', count: 1.5 }] })).toBeNull();
    expect(migrateSave({ ...SAVE, taken: [] })).toBeNull();
    expect(migrateSave({ ...SAVE, taken: { snack: 3 } })).toBeNull();
  });

  it('keeps an item it does not know, for the bag to leave out', () => {
    const later = [{ id: 'moonstone', count: 1 }];
    expect(migrateSave({ ...SAVE, bag: later })?.bag).toEqual(later);
  });
});

describe('v3 to v4: her garden', () => {
  const V3 = {
    version: 3,
    createdAt: 1000,
    updatedAt: 2000,
    lastPlayedAt: 2000,
    player: { tx: 9, ty: 12, facing: 'up' },
    look: LOOK,
    wardrobe: ['jeans'],
    bag: [
      { id: 'purseButter', count: 3 },
      { id: 'wood', count: 6 },
    ],
    taken: { 'prop:2,2': '2026-09-26' },
  };

  it('has no beds tilled, and adds the starter seeds after what she already carries', () => {
    const v4 = migrateSave(structuredClone(V3))!;
    expect(v4.version).toBe(SAVE_VERSION);
    expect(v4.beds).toEqual([]);
    expect(v4.bag.slice(0, 2)).toEqual(V3.bag);
    expect(v4.bag.slice(2)).toEqual(STARTER_BAG.filter((s) => ITEMS[s.id].kind === 'seed'));
    expect(v4.taken).toEqual(V3.taken);
  });

  it('leaves a bag of the wrong shape for the shape check to refuse', () => {
    expect(migrateSave({ ...V3, bag: 'wood' })).toBeNull();
  });

  it('refuses beds of the wrong shape, and keeps a crop it does not know for the farm', () => {
    const planting = { crop: 'pumpkin', plantedAt: 5, waterings: 1, lastWatered: '2026-09-26' };
    expect(migrateSave({ ...SAVE, beds: {} })).toBeNull();
    expect(migrateSave({ ...SAVE, beds: [{ tx: 1, ty: 'a', planting: null }] })).toBeNull();
    expect(migrateSave({ ...SAVE, beds: [{ tx: 1, ty: 1, planting: { crop: 3 } }] })).toBeNull();
    expect(
      migrateSave({ ...SAVE, beds: [{ tx: 1, ty: 1, planting: { ...planting, waterings: -1 } }] }),
    ).toBeNull();
    const later = [{ tx: 1, ty: 1, planting: { ...planting, crop: 'turnip' } }];
    expect(migrateSave({ ...SAVE, beds: later })?.beds).toEqual(later);
  });
});

describe('v4 to v5: her Candy', () => {
  const V4 = {
    version: 4,
    createdAt: 1000,
    updatedAt: 2000,
    lastPlayedAt: 2000,
    player: { tx: 9, ty: 12, facing: 'up' },
    look: LOOK,
    wardrobe: ['jeans'],
    bag: [{ id: 'purseButter', count: 3 }],
    taken: {},
    beds: [{ tx: 10, ty: 5, planting: null }],
  };

  it('gives her the Candy every new game starts with, and leaves the rest alone', () => {
    const v5 = MIGRATIONS[4]!(structuredClone(V4));
    expect(v5).toEqual({ ...V4, candy: STARTING_CANDY });
    expect(migrateSave(structuredClone(V4))).toMatchObject({
      ...V4,
      version: 6,
      candy: STARTING_CANDY,
    });
  });

  it('refuses Candy that is not a whole number of it', () => {
    for (const candy of [-1, 1.5, '100', null]) {
      expect(migrateSave({ ...SAVE, candy }), String(candy)).toBeNull();
    }
  });
});

describe('v5 to v6: her home', () => {
  const V5 = {
    version: 5,
    createdAt: 1000,
    updatedAt: 2000,
    lastPlayedAt: 2000,
    player: { tx: 9, ty: 12, facing: 'up' },
    look: LOOK,
    wardrobe: ['jeans'],
    bag: [{ id: 'purseButter', count: 3 }],
    taken: {},
    beds: [],
    candy: 250,
  };

  it('stands her in town, in a home furnished as a new one is, and leaves the rest alone', () => {
    const v6 = MIGRATIONS[5]!(structuredClone(V5));
    expect(v6).toEqual({
      ...V5,
      player: { ...V5.player, indoors: false },
      home: STARTER_HOME,
    });
    expect(migrateSave(structuredClone(V5))).toEqual({ ...v6, version: 6 });
  });

  it('leaves a player of the wrong shape for the shape check to refuse', () => {
    expect(MIGRATIONS[5]!({ ...V5, player: 'somewhere' }).player).toBe('somewhere');
    expect(migrateSave({ ...V5, player: 'somewhere' })).toBeNull();
  });

  it('refuses a home of the wrong shape, and keeps a piece it does not know for the home', () => {
    const home = SAVE.home;
    expect(migrateSave({ ...SAVE, home: null })).toBeNull();
    expect(migrateSave({ ...SAVE, player: { ...SAVE.player, indoors: 'yes' } })).toBeNull();
    expect(migrateSave({ ...SAVE, home: { ...home, placed: [{ id: 'bed', tx: 1 }] } })).toBeNull();
    expect(
      migrateSave({ ...SAVE, home: { ...home, stored: [{ id: 'bed', count: 0 }] } }),
    ).toBeNull();
    expect(migrateSave({ ...SAVE, home: { ...home, wallpaper: 3 } })).toBeNull();
    expect(migrateSave({ ...SAVE, home: { ...home, floorings: 'oak' } })).toBeNull();
    const later = [{ id: 'hotTub', tx: 1, ty: 4, turn: 0 }];
    expect(migrateSave({ ...SAVE, home: { ...home, placed: later } })?.home.placed).toEqual(later);
  });
});
