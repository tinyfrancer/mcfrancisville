import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTOSAVE_DEBOUNCE_MS, AutoSaver } from '../../src/persistence/autosave';

describe('AutoSaver', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('collapses a burst of changes into one save, a moment after the last', () => {
    const write = vi.fn();
    const saver = new AutoSaver(write);
    saver.markDirty();
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS - 1);
    saver.markDirty();
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS - 1);
    expect(write).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('saves at once on flush, and cancels the pending save', () => {
    const write = vi.fn();
    const saver = new AutoSaver(write);
    saver.markDirty();
    saver.flush();
    expect(write).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS * 2);
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('never saves again once stopped, so a restore is not overwritten on the way out', () => {
    const write = vi.fn();
    const saver = new AutoSaver(write);
    saver.markDirty();
    saver.stop();
    saver.flush();
    saver.markDirty();
    vi.advanceTimersByTime(AUTOSAVE_DEBOUNCE_MS * 2);
    expect(write).not.toHaveBeenCalled();
  });
});
