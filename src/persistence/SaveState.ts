import { STARTER_BAG } from '../data/items';
import { STARTER_WARDROBE } from '../data/outfits';
import type { Planting } from '../systems/farming';
import type { Facing, ItemId, OutfitId } from '../types/ids';
import type { Look } from '../types/look';

/**
 * Bump when `SaveState` changes shape or meaning, and add the step that upgrades the old shape to
 * `migrations.ts` with a test. A save with no chain to this version is set aside, not loaded.
 */
export const SAVE_VERSION = 4;

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
  /**
   * What's in her bag, in the order she found it (v3). Ids are only checked to be strings here;
   * the `Bag` leaves out any it doesn't know.
   */
  bag: { id: ItemId; count: number }[];
  /** What she has taken today, by its key, to the day key she took it on (v3). */
  taken: Record<string, string>;
  /**
   * The garden beds she has tilled, and what's growing in each (v4). A crop id is only checked to
   * be a string here; the `Farm` drops any it doesn't know, and any bed the map no longer has.
   */
  beds: { tx: number; ty: number; planting: Planting | null }[];
}

export function newSave(
  now: number,
  player: SavedPlayer,
  look: Look | null = null,
  wardrobe: readonly OutfitId[] = STARTER_WARDROBE,
  bag: readonly { id: ItemId; count: number }[] = STARTER_BAG,
): SaveState {
  return {
    version: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    lastPlayedAt: now,
    player,
    look,
    wardrobe: [...wardrobe],
    bag: bag.map((s) => ({ ...s })),
    taken: {},
    beds: [],
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

function isBagShape(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((stack) => {
      if (typeof stack !== 'object' || stack === null) return false;
      const s = stack as Record<string, unknown>;
      return typeof s.id === 'string' && Number.isInteger(s.count) && (s.count as number) > 0;
    })
  );
}

function isTakenShape(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((day) => typeof day === 'string')
  );
}

function isPlantingShape(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.crop === 'string' &&
    typeof p.plantedAt === 'number' &&
    Number.isInteger(p.waterings) &&
    (p.waterings as number) >= 0 &&
    (p.lastWatered === null || typeof p.lastWatered === 'string')
  );
}

function isBedsShape(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((bed) => {
      if (typeof bed !== 'object' || bed === null) return false;
      const b = bed as Record<string, unknown>;
      return Number.isInteger(b.tx) && Number.isInteger(b.ty) && isPlantingShape(b.planting);
    })
  );
}

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
    s.wardrobe.every((id) => typeof id === 'string') &&
    isBagShape(s.bag) &&
    isTakenShape(s.taken) &&
    isBedsShape(s.beds)
  );
}
