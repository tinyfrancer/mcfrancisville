import type { SAFE_KEEPING } from '../data/greetings';
import { dayKey } from './clock';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Cody mentions keeping the town safe at most this often (V1's S3). */
export const NUDGE_EVERY_MS = 7 * DAY_MS;

/** A backup code older than this is worth making again. */
export const BACKUP_STALE_MS = 14 * DAY_MS;

/** What he'd mention: putting the game on her Home Screen, or making a fresh backup code. */
export type Nudge = keyof typeof SAFE_KEEPING;

/** What this phone knows about keeping her town safe. None of it is in the save. */
export interface Keeping {
  now: number;
  /** Opened from the Home Screen, where her town is kept from Safari's seven-day wipe. */
  standalone: boolean;
  /** When a backup code was last copied or shared on this phone. */
  backedUpAt: number | null;
  /** When her town was begun: a new town isn't nudged about a backup in its first fortnight. */
  since: number;
  /** When he last mentioned it on this phone. */
  nudgedAt: number | null;
}

/**
 * Whether Cody's greeting mentions keeping the town safe (V1's S3): never twice in a week; first
 * the Home Screen, while it's in a browser tab (installed is what keeps her save); then, once
 * it's installed, a fresh backup code when the last is a fortnight old, or there never was one
 * and the town is.
 */
export function nudgeFor(k: Keeping): Nudge | null {
  if (k.nudgedAt !== null && k.now - k.nudgedAt < NUDGE_EVERY_MS) return null;
  if (!k.standalone) return 'install';
  return k.now - (k.backedUpAt ?? k.since) >= BACKUP_STALE_MS ? 'backup' : null;
}

/** Whole days from one 5am day to another's. */
function daysBetween(from: number, to: number): number {
  return Math.round((Date.parse(dayKey(to)) - Date.parse(dayKey(from))) / DAY_MS);
}

/** The Backup tab's line: when a code was last copied or shared on this phone. */
export function backedUpLine(now: number, at: number | null): string {
  if (at === null) return 'No backup code saved from this phone yet.';
  const days = Math.max(0, daysBetween(at, now));
  if (days === 0) return 'Last backed up today.';
  if (days === 1) return 'Last backed up yesterday.';
  return `Last backed up ${days} days ago.`;
}
