import type { Facing } from '../types/ids';

/**
 * Bump when `SaveState` changes shape or meaning, and add the step that upgrades the old shape to
 * `migrations.ts` with a test. A save with no chain to this version is set aside, not loaded.
 */
export const SAVE_VERSION = 1;

export interface SavedPlayer {
  /** The tile she stands on. Mid-step she is saved on the tile she's in. */
  tx: number;
  ty: number;
  facing: Facing;
}

export interface SaveState {
  version: number;
  /** Epoch milliseconds. */
  createdAt: number;
  updatedAt: number;
  /** When she last had the game open; the welcome back is written from this (decisions.md 24). */
  lastPlayedAt: number;
  player: SavedPlayer;
}

export function newSave(now: number, player: SavedPlayer): SaveState {
  return { version: SAVE_VERSION, createdAt: now, updatedAt: now, lastPlayedAt: now, player };
}

const FACINGS: readonly string[] = ['down', 'up', 'left', 'right'];

/** The shape check a save must pass after migrating, before the game will stand her in it. */
export function isSaveState(value: unknown): value is SaveState {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  const p = s.player as Record<string, unknown> | undefined;
  return (
    typeof s.version === 'number' &&
    typeof s.createdAt === 'number' &&
    typeof s.updatedAt === 'number' &&
    typeof s.lastPlayedAt === 'number' &&
    typeof p === 'object' &&
    p !== null &&
    Number.isInteger(p.tx) &&
    Number.isInteger(p.ty) &&
    typeof p.facing === 'string' &&
    FACINGS.includes(p.facing)
  );
}
