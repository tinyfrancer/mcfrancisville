import { describe, expect, it } from 'vitest';
import { migrateSave } from '../../src/persistence/migrations';
import { newSave, SAVE_VERSION } from '../../src/persistence/SaveState';

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
    const upgraded = migrateSave(SAVE, 3, steps) as unknown as Record<string, unknown>;
    expect(upgraded).toMatchObject({ version: 3, a: 1, b: 2 });
    expect(migrateSave(SAVE, 3, { 2: steps[2] })).toBeNull();
  });
});
