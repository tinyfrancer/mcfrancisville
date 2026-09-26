import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LocalStorageSaveService,
  SAVE_KEY,
  UNREADABLE_PREFIX,
} from '../../src/persistence/LocalStorageSaveService';
import { newSave, SAVE_VERSION } from '../../src/persistence/SaveState';

const SAVE = newSave(1000, { tx: 4, ty: 6, facing: 'left' });

function setAside(): string[] {
  const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)!);
  return keys.filter((k) => k.startsWith(UNREADABLE_PREFIX));
}

describe('LocalStorageSaveService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('round-trips a save', () => {
    const service = new LocalStorageSaveService();
    expect(service.load()).toBeNull();
    service.save(SAVE);
    expect(service.load()).toEqual(SAVE);
  });

  it('moves a corrupt save aside rather than deleting it', () => {
    localStorage.setItem(SAVE_KEY, '{not json');
    expect(new LocalStorageSaveService().load()).toBeNull();
    expect(localStorage.getItem(SAVE_KEY)).toBeNull();
    const kept = setAside();
    expect(kept).toHaveLength(1);
    expect(localStorage.getItem(kept[0]!)).toBe('{not json');
  });

  it('moves a save from a newer build aside too', () => {
    const future = JSON.stringify({ ...SAVE, version: SAVE_VERSION + 1 });
    localStorage.setItem(SAVE_KEY, future);
    expect(new LocalStorageSaveService().load()).toBeNull();
    expect(localStorage.getItem(setAside()[0]!)).toBe(future);
  });

  it('leaves an unreadable save where it is if it cannot be copied', () => {
    localStorage.setItem(SAVE_KEY, '{not json');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(new LocalStorageSaveService().load()).toBeNull();
    expect(localStorage.getItem(SAVE_KEY)).toBe('{not json');
  });

  it('shrugs off storage that is full or blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => new LocalStorageSaveService().save(SAVE)).not.toThrow();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(new LocalStorageSaveService().load()).toBeNull();
  });
});
