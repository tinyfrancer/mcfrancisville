import { STARTER_WARDROBE } from '../data/outfits';
import type { Facing, OutfitId } from '../types/ids';
import type { Look } from '../types/look';

/**
 * Bump when `SaveState` changes shape or meaning, and add the step that upgrades the old shape to
 * `migrations.ts` with a test. A save with no chain to this version is set aside, not loaded.
 */
export const SAVE_VERSION = 2;

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
  /**
   * How she looks, and the name she typed; null until she has been through the creator (v2). The
   * ids are only checked to be strings here: the `Wardrobe` swaps any it doesn't know for the
   * default's, rather than a whole town being set aside over one retired sock.
   */
  look: Look | null;
  /** The ids of the clothes she owns (v2). */
  wardrobe: OutfitId[];
}

export function newSave(
  now: number,
  player: SavedPlayer,
  look: Look | null = null,
  wardrobe: readonly OutfitId[] = STARTER_WARDROBE,
): SaveState {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    lastPlayedAt: now,
    player,
    look,
    wardrobe: [...wardrobe],
  };
}

const LOOK_STRINGS = ['name', 'skin', 'eyes', 'hairStyle', 'hairColour'] as const;

function isLookShape(value: unknown): value is Look {
  if (typeof value !== 'object' || value === null) return false;
  const l = value as Record<string, unknown>;
  const outfit = l.outfit;
  return (
    LOOK_STRINGS.every((key) => typeof l[key] === 'string') &&
    typeof l.gauges === 'boolean' &&
    (l.tattoos === null || typeof l.tattoos === 'string') &&
    typeof outfit === 'object' &&
    outfit !== null &&
    !Array.isArray(outfit) &&
    Object.values(outfit).every(
      (w) =>
        typeof w === 'object' &&
        w !== null &&
        typeof (w as Record<string, unknown>).id === 'string' &&
        typeof (w as Record<string, unknown>).fabric === 'string',
    )
  );
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
    FACINGS.includes(p.facing) &&
    (s.look === null || isLookShape(s.look)) &&
    Array.isArray(s.wardrobe) &&
    s.wardrobe.every((id) => typeof id === 'string')
  );
}
