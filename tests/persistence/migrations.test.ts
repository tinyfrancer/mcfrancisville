import { describe, expect, it } from 'vitest';
import { STARTER_PETS } from '../../src/data/pets';
import { isVersionZero, MIGRATIONS, migrateSave } from '../../src/persistence/migrations';
import { FIRST_VERSION, newSave, SAVE_VERSION } from '../../src/persistence/SaveState';

const SAVE = newSave(1000, { tx: 4, ty: 6, facing: 'down', zone: 'town' });

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
    const old = { ...SAVE, version: FIRST_VERSION };
    const upgraded = migrateSave(old, FIRST_VERSION + 2, {
      [FIRST_VERSION]: steps[1],
      [FIRST_VERSION + 1]: steps[2],
    }) as unknown as Record<string, unknown>;
    expect(upgraded).toMatchObject({ version: FIRST_VERSION + 2, a: 1, b: 2 });
    expect(migrateSave(old, FIRST_VERSION + 2, { [FIRST_VERSION + 1]: steps[2] })).toBeNull();
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
  freckles: true,
  nosePiercing: true,
  outfit: { top: { id: 'teeScreamDion', fabric: 'blue' } },
};

describe('the phase D1 step (12 to 13)', () => {
  it('keeps the face she chose, and starts a record of what she has picked', () => {
    const before: Record<string, unknown> = { ...LOOK };
    delete before.freckles;
    delete before.nosePiercing;
    const v12 = { ...structuredClone(SAVE), version: 12, look: before } as Record<string, unknown>;
    delete v12.harvested;
    const up = migrateSave(v12);
    expect(up?.look).toEqual({ ...before, freckles: false, nosePiercing: false });
    expect(up?.harvested).toEqual([]);
  });

  it('upgrades a save from before the creator', () => {
    const v12 = { ...structuredClone(SAVE), version: 12, look: null } as Record<string, unknown>;
    delete v12.harvested;
    expect(migrateSave(v12)?.look).toBeNull();
  });
});

describe('the phase E step (13 to 14)', () => {
  it('has found the town and her home, and opened nothing shut', () => {
    const v13 = { ...structuredClone(SAVE), version: 13 } as Record<string, unknown>;
    delete v13.atlas;
    expect(migrateSave(v13)?.atlas).toEqual({ found: ['town', 'home'], opened: [] });
  });

  it('refuses an atlas of the wrong shape', () => {
    expect(migrateSave({ ...SAVE, atlas: { found: 'town', opened: [] } })).toBeNull();
    expect(migrateSave({ ...SAVE, atlas: null })).toBeNull();
  });
});

describe('version 0 saves (decisions.md 80)', () => {
  it('sets aside every one of them, whatever it holds', () => {
    for (let version = 1; version < FIRST_VERSION; version++) {
      const v0 = { ...structuredClone(SAVE), version };
      expect(isVersionZero(v0), String(version)).toBe(true);
      expect(migrateSave(v0), String(version)).toBeNull();
    }
    expect(isVersionZero(SAVE)).toBe(false);
  });

  it('has no steps left for them', () => {
    expect(
      Object.keys(MIGRATIONS)
        .map(Number)
        .every((v) => v >= FIRST_VERSION),
    ).toBe(true);
  });
});

describe('the shape check', () => {
  it('refuses a player with no zone, and keeps one in a zone it does not know for the world to repair', () => {
    expect(migrateSave({ ...SAVE, player: { ...SAVE.player, zone: undefined } })).toBeNull();
    const attic = { ...SAVE.player, zone: 'attic' };
    expect(migrateSave({ ...SAVE, player: attic })?.player).toEqual(attic);
    const home = { ...SAVE.player, zone: 'home' };
    expect(migrateSave({ ...SAVE, player: home })?.player).toEqual(home);
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

  it('refuses Candy that is not a whole number of it', () => {
    for (const candy of [-1, 1.5, '100', null]) {
      expect(migrateSave({ ...SAVE, candy }), String(candy)).toBeNull();
    }
  });

  it('refuses a home of the wrong shape, and keeps a piece it does not know for the home', () => {
    const home = SAVE.home;
    expect(migrateSave({ ...SAVE, home: null })).toBeNull();
    expect(migrateSave({ ...SAVE, home: { ...home, placed: [{ id: 'bed', tx: 1 }] } })).toBeNull();
    expect(
      migrateSave({ ...SAVE, home: { ...home, stored: [{ id: 'bed', count: 0 }] } }),
    ).toBeNull();
    expect(migrateSave({ ...SAVE, home: { ...home, wallpaper: 3 } })).toBeNull();
    expect(migrateSave({ ...SAVE, home: { ...home, floorings: 'oak' } })).toBeNull();
    const later = [{ id: 'hotTub', tx: 1, ty: 4, turn: 0 }];
    expect(migrateSave({ ...SAVE, home: { ...home, placed: later } })?.home.placed).toEqual(later);
  });

  it('refuses recipes or a size of the wrong shape', () => {
    expect(migrateSave({ ...SAVE, recipes: 'stool' })).toBeNull();
    expect(migrateSave({ ...SAVE, recipes: [3] })).toBeNull();
    expect(migrateSave({ ...SAVE, home: { ...SAVE.home, size: 'big' } })).toBeNull();
    expect(migrateSave({ ...SAVE, recipes: ['someDayRecipe'] })?.recipes).toEqual([
      'someDayRecipe',
    ]);
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

  it('refuses a cabinet of the wrong shape, and keeps a critter it does not know', () => {
    expect(migrateSave({ ...SAVE, cabinet: [] })).toBeNull();
    expect(migrateSave({ ...SAVE, cabinet: { caught: [], donated: [] } })).toBeNull();
    expect(migrateSave({ ...SAVE, cabinet: { caught: { lunaMoth: 3 }, donated: [] } })).toBeNull();
    expect(migrateSave({ ...SAVE, cabinet: { caught: {}, donated: 'all' } })).toBeNull();
    const later = { caught: { someDayMoth: '2026-09-27' }, donated: ['someDayMoth'] };
    expect(migrateSave({ ...SAVE, cabinet: later })?.cabinet).toEqual(later);
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

  it('refuses a mystery of the wrong shape, and keeps a clue it does not know', () => {
    expect(migrateSave({ ...SAVE, mystery: [] })).toBeNull();
    expect(migrateSave({ ...SAVE, mystery: { clues: { rumour: 3 } } })).toBeNull();
    expect(migrateSave({ ...SAVE, mystery: { clues: [] } })).toBeNull();
    const later = { clues: { someDayClue: '2026-09-27' } };
    expect(migrateSave({ ...SAVE, mystery: later })?.mystery).toEqual(later);
  });
});
