import { describe, expect, it } from 'vitest';
import { ITEMS, STARTER_BAG } from '../../src/data/items';
import { STARTER_WARDROBE } from '../../src/data/outfits';
import { STARTER_PETS } from '../../src/data/pets';
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

  it('gives her the Candy a new game started with then, and leaves the rest alone', () => {
    const v5 = MIGRATIONS[4]!(structuredClone(V4));
    expect(v5).toEqual({ ...V4, candy: 100 });
    expect(migrateSave(structuredClone(V4))).toMatchObject({
      ...V4,
      version: SAVE_VERSION,
      candy: 100,
    });
  });

  it('refuses Candy that is not a whole number of it', () => {
    for (const candy of [-1, 1.5, '100', null]) {
      expect(migrateSave({ ...SAVE, candy }), String(candy)).toBeNull();
    }
  });
});

/** The first day's home as save v6 wrote it, before the workbench and extensions. */
const V6_HOME = {
  placed: [
    { id: 'batBed', tx: 10, ty: 3, turn: 0 },
    { id: 'twoHeadedDuck', tx: 8, ty: 3, turn: 0 },
    { id: 'moonRug', tx: 3, ty: 6, turn: 0 },
    { id: 'pumpkinChair', tx: 3, ty: 6, turn: 0 },
    { id: 'ghostPortrait', tx: 2, ty: 1, turn: 0 },
    { id: 'wallShelf', tx: 4, ty: 1, turn: 0 },
    { id: 'moonPainting', tx: 6, ty: 1, turn: 0 },
    { id: 'batClock', tx: 8, ty: 0, turn: 0 },
    { id: 'mysteryCorkboard', tx: 10, ty: 1, turn: 0 },
  ],
  stored: [{ id: 'succulents', count: 1 }],
  wallpaper: 'plumStripes',
  flooring: 'oakBoards',
  wallpapers: ['plumStripes'],
  floorings: ['oakBoards'],
};

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
      home: V6_HOME,
    });
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

describe('v6 to v7: crafting', () => {
  const V6 = {
    version: 6,
    createdAt: 1000,
    updatedAt: 2000,
    lastPlayedAt: 2000,
    player: { tx: 6, ty: 13, facing: 'up', indoors: true },
    look: LOOK,
    wardrobe: ['jeans'],
    bag: [{ id: 'wood', count: 30 }],
    taken: {},
    beds: [],
    candy: 250,
    home: V6_HOME,
  };

  it('knows no recipes of its own, keeps the house its size, and puts out her workbench', () => {
    const v7 = MIGRATIONS[6]!(structuredClone(V6));
    expect(v7).toEqual({
      ...V6,
      recipes: [],
      home: {
        ...V6_HOME,
        size: 0,
        placed: [...V6_HOME.placed, { id: 'workbench', tx: 4, ty: 3, turn: 0 }],
      },
    });
    expect(migrateSave(structuredClone(V6))).toEqual({
      ...v7,
      version: SAVE_VERSION,
      friends: {},
      mail: [],
      cabinet: { caught: {}, donated: [] },
      pets: STARTER_PETS,
      mystery: { clues: {} },
    });
  });

  it('leaves a home of the wrong shape for the shape check to refuse', () => {
    expect(MIGRATIONS[6]!({ ...V6, home: 'cozy' }).home).toBe('cozy');
    expect(migrateSave({ ...V6, home: { ...V6_HOME, placed: 'everywhere' } })).toBeNull();
  });

  it('refuses recipes or a size of the wrong shape', () => {
    expect(migrateSave({ ...SAVE, recipes: 'stool' })).toBeNull();
    expect(migrateSave({ ...SAVE, recipes: [3] })).toBeNull();
    expect(migrateSave({ ...SAVE, home: { ...SAVE.home, size: 'big' } })).toBeNull();
    expect(migrateSave({ ...SAVE, recipes: ['someDayRecipe'] })?.recipes).toEqual([
      'someDayRecipe',
    ]);
  });
});

describe('v7 to v8: her neighbours', () => {
  const V7 = { ...structuredClone(SAVE), version: 7 } as Record<string, unknown>;
  delete V7.friends;
  delete V7.mail;
  delete V7.cabinet;
  delete V7.pets;

  it('starts every friendship at nothing, with an empty mailbox, and leaves the rest alone', () => {
    const v8 = MIGRATIONS[7]!(structuredClone(V7));
    expect(v8).toEqual({ ...V7, friends: {}, mail: [] });
    expect(migrateSave(structuredClone(V7))).toEqual({
      ...v8,
      version: SAVE_VERSION,
      cabinet: { caught: {}, donated: [] },
      pets: STARTER_PETS,
    });
  });

  it('refuses friendships or mail of the wrong shape, and keeps a neighbour it does not know', () => {
    const friend = { points: 120, talked: '2026-09-27', gifted: null, favour: null };
    expect(migrateSave({ ...SAVE, friends: [] })).toBeNull();
    expect(migrateSave({ ...SAVE, friends: { cody: { ...friend, points: -1 } } })).toBeNull();
    expect(migrateSave({ ...SAVE, friends: { cody: { ...friend, talked: 5 } } })).toBeNull();
    expect(migrateSave({ ...SAVE, mail: [{ id: 'cody:3', on: '2026-09-27' }] })).toBeNull();
    expect(migrateSave({ ...SAVE, friends: { someDayFriend: friend } })?.friends).toEqual({
      someDayFriend: friend,
    });
  });
});

describe('v8 to v9: critters', () => {
  const V8 = { ...structuredClone(SAVE), version: 8 } as Record<string, unknown>;
  delete V8.cabinet;
  delete V8.pets;

  it('starts with nothing caught and nothing on show, and leaves the rest alone', () => {
    const v9 = MIGRATIONS[8]!(structuredClone(V8));
    expect(v9).toEqual({ ...V8, cabinet: { caught: {}, donated: [] } });
    expect(migrateSave(structuredClone(V8))).toEqual({
      ...v9,
      version: SAVE_VERSION,
      pets: STARTER_PETS,
    });
  });

  it('refuses a cabinet of the wrong shape, and keeps a critter it does not know', () => {
    expect(migrateSave({ ...SAVE, cabinet: [] })).toBeNull();
    expect(migrateSave({ ...SAVE, cabinet: { caught: [], donated: [] } })).toBeNull();
    expect(migrateSave({ ...SAVE, cabinet: { caught: { lunaMoth: 3 }, donated: [] } })).toBeNull();
    expect(migrateSave({ ...SAVE, cabinet: { caught: {}, donated: 'all' } })).toBeNull();
    const later = { caught: { someDayMoth: '2026-09-27' }, donated: ['someDayMoth'] };
    expect(migrateSave({ ...SAVE, cabinet: later })?.cabinet).toEqual(later);
  });
});

describe('v9 to v10: her pets', () => {
  const V9 = { ...structuredClone(SAVE), version: 9 } as Record<string, unknown>;
  delete V9.pets;

  it('gives her the pets a new game has, all at home, and leaves the rest alone', () => {
    const v10 = MIGRATIONS[9]!(structuredClone(V9));
    expect(v10).toEqual({ ...V9, pets: STARTER_PETS });
    expect(migrateSave(structuredClone(V9))).toEqual({ ...v10, version: SAVE_VERSION });
  });

  it('refuses pets of the wrong shape, and keeps a pet or accessory it does not know', () => {
    const pets = STARTER_PETS;
    expect(migrateSave({ ...SAVE, pets: [] })).toBeNull();
    expect(migrateSave({ ...SAVE, pets: { ...pets, walking: 3 } })).toBeNull();
    expect(migrateSave({ ...SAVE, pets: { ...pets, names: { fibi: 7 } } })).toBeNull();
    expect(migrateSave({ ...SAVE, pets: { ...pets, bones: -1 } })).toBeNull();
    expect(migrateSave({ ...SAVE, pets: { ...pets, accessories: 'all' } })).toBeNull();
    const later = { ...pets, walking: 'someDayPet', accessories: ['someDayHat'] };
    expect(migrateSave({ ...SAVE, pets: later })?.pets).toEqual(later);
  });
});

describe('v10 to v11: the mayor', () => {
  const V10 = { ...structuredClone(SAVE), version: 10 } as Record<string, unknown>;
  delete V10.mystery;

  it('starts with nothing pinned to her corkboard, and leaves the rest alone', () => {
    const v11 = MIGRATIONS[10]!(structuredClone(V10));
    expect(v11).toEqual({ ...V10, mystery: { clues: {} } });
    expect(migrateSave(structuredClone(V10))).toEqual({ ...v11, version: 11 });
  });

  it('refuses a mystery of the wrong shape, and keeps a clue it does not know', () => {
    expect(migrateSave({ ...SAVE, mystery: [] })).toBeNull();
    expect(migrateSave({ ...SAVE, mystery: { clues: { rumour: 3 } } })).toBeNull();
    expect(migrateSave({ ...SAVE, mystery: { clues: [] } })).toBeNull();
    const later = { clues: { someDayClue: '2026-09-27' } };
    expect(migrateSave({ ...SAVE, mystery: later })?.mystery).toEqual(later);
  });
});
