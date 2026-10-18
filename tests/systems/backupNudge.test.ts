import { describe, expect, it } from 'vitest';
import {
  BACKUP_STALE_MS,
  backedUpLine,
  NUDGE_EVERY_MS,
  nudgeFor,
  type Keeping,
} from '../../src/systems/backupNudge';
import { FakeClock } from '../../src/systems/clock';

const DAY = 24 * 60 * 60 * 1000;
const START = new Date(2026, 9, 1, 10).getTime();

/** Her phone on `day` days after the town began, installed and backed up the day it began. */
function phone(day: number, over: Partial<Keeping> = {}): Keeping {
  return {
    now: START + day * DAY,
    standalone: true,
    backedUpAt: START,
    since: START,
    nudgedAt: null,
    ...over,
  };
}

describe("Cody's backup nudge (V1's S3)", () => {
  it('asks a phone playing in a browser tab to add it to the Home Screen first', () => {
    expect(nudgeFor(phone(1, { standalone: false }))).toBe('install');
  });

  it('leaves an installed phone with a fresh code be', () => {
    expect(nudgeFor(phone(13))).toBeNull();
  });

  it('mentions a new code once the last is a fortnight old', () => {
    expect(nudgeFor(phone(14))).toBe('backup');
    expect(BACKUP_STALE_MS).toBe(14 * DAY);
  });

  it('gives a new town a fortnight before mentioning a code it never had', () => {
    expect(nudgeFor(phone(10, { backedUpAt: null }))).toBeNull();
    expect(nudgeFor(phone(15, { backedUpAt: null }))).toBe('backup');
  });

  it('says it about once a week at most, however long it goes unheeded', () => {
    const clock = new FakeClock(START);
    let nudgedAt: number | null = null;
    const said: number[] = [];
    // She opens it every day for two months, in a browser tab, never backing up.
    for (let day = 0; day < 60; day++) {
      clock.set(START + day * DAY);
      const nudge = nudgeFor(phone(day, { standalone: false, backedUpAt: null, nudgedAt }));
      if (nudge) {
        nudgedAt = clock.now();
        said.push(day);
      }
    }
    expect(said).toEqual([0, 7, 14, 21, 28, 35, 42, 49, 56]);
    expect(NUDGE_EVERY_MS).toBe(7 * DAY);
  });

  it('stops once she backs up, until the next code is a fortnight old', () => {
    const nudgedAt = START + 14 * DAY;
    expect(nudgeFor(phone(22, { backedUpAt: START + 15 * DAY, nudgedAt }))).toBeNull();
    expect(nudgeFor(phone(29, { backedUpAt: START + 15 * DAY, nudgedAt }))).toBe('backup');
  });
});

describe('the Backup tab\'s "last backed up"', () => {
  it('says never, today, yesterday or how many days', () => {
    expect(backedUpLine(START, null)).toMatch(/yet/);
    expect(backedUpLine(START + 3_600_000, START)).toBe('Last backed up today.');
    expect(backedUpLine(START + DAY, START)).toBe('Last backed up yesterday.');
    expect(backedUpLine(START + 9 * DAY, START)).toBe('Last backed up 9 days ago.');
  });

  it('counts days from 5am, as the town does', () => {
    const lateNight = new Date(2026, 9, 1, 23).getTime();
    const smallHours = new Date(2026, 9, 2, 3).getTime();
    expect(backedUpLine(smallHours, lateNight)).toBe('Last backed up today.');
  });
});
