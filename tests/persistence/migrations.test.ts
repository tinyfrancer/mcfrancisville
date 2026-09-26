import { describe, expect, it } from 'vitest';
import { STARTER_WARDROBE } from '../../src/data/outfits';
import { MIGRATIONS, migrateSave } from '../../src/persistence/migrations';
import { isSaveState, newSave, SAVE_VERSION } from '../../src/persistence/SaveState';

const SAVE = newSave(1000, { tx: 4, ty: 6, facing: 'down' });

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
    expect(migrateSave(structuredClone(V1))?.player).toEqual(V1.player);
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

  it('starts the bag with the purse butter every new bag has, and nothing taken', () => {
    const v3 = migrateSave(structuredClone(V2));
    expect(v3).toEqual({
      ...V2,
      version: 3,
      bag: [{ id: 'purseButter', count: 5 }],
      taken: {},
    });
  });

  it('matches what a new game starts with', () => {
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
