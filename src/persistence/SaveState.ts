import { STARTER_HOME, type HomeSnapshot } from '../data/home';
import { STARTER_BAG } from '../data/items';
import { STARTER_PETS, type PetsSnapshot } from '../data/pets';
import { STARTING_CANDY } from '../data/shop';
import { STARTER_WARDROBE } from '../data/outfits';
import type { Planting } from '../systems/farming';
import type { CropId, Facing, ItemId, OutfitId, RecipeId, VillagerId, ZoneId } from '../types/ids';
import type { AtlasSnapshot } from '../world/Atlas';
import type { CabinetSnapshot } from '../world/Cabinet';
import type { MysterySnapshot } from '../world/Casebook';
import type { Friendship } from '../world/Friends';
import type { MailEntry } from '../world/Letters';
import type { Look } from '../types/look';

/**
 * Bump when `SaveState` changes shape or meaning, and add the step that upgrades the old shape to
 * `migrations.ts` with a test. A save with no chain to this version is set aside, not loaded.
 */
export const SAVE_VERSION = 14;

/**
 * Version 0.1's first save (decisions.md 80). Versions 1 to 11 were version 0's test saves, which
 * aren't carried into the re-laid, re-scaled world: they are set aside, never deleted. Counting on
 * from 12 rather than starting again at 1 means no v0 save can be mistaken for one of 0.1's.
 */
export const FIRST_VERSION = 12;

export interface SavedPlayer {
  /** The tile she stands on. Mid-step she is saved on the tile she's in. */
  tx: number;
  ty: number;
  facing: Facing;
  /**
   * The zone she was in, whose tiles `tx` and `ty` are. Only checked to be a string: one this build
   * doesn't know puts her back at her door.
   */
  zone: ZoneId;
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
   * How she looks, and the name she typed; null until she has been through the creator. The
   * ids are only checked to be strings here: the `Wardrobe` swaps any it doesn't know for the
   * default's, rather than a whole town being set aside over one retired sock.
   */
  look: Look | null;
  /** The ids of the clothes she owns. */
  wardrobe: OutfitId[];
  /**
   * What's in her bag, in the order she found it. Ids are only checked to be strings here;
   * the `Bag` leaves out any it doesn't know.
   */
  bag: { id: ItemId; count: number }[];
  /** What she has taken today, by its key, to the day key she took it on. */
  taken: Record<string, string>;
  /**
   * The garden beds she has tilled, and what's growing in each. A crop id is only checked to
   * be a string here; the `Farm` drops any it doesn't know, and any bed the map no longer has.
   */
  beds: { tx: number; ty: number; planting: Planting | null }[];
  /**
   * Every crop she has ever picked, so the first of each is a moment (save v13). Ids are only
   * checked to be strings; the `Farm` leaves out any it doesn't know.
   */
  harvested: CropId[];
  /** Her Candy, which the shops take and pay. */
  candy: number;
  /**
   * Her home: what stands and hangs where, what's in the storage chest, and her walls and floor
   *. Ids are only checked to be strings here; the `Home` leaves out any it doesn't know, and
   * puts a piece that no longer fits where it was in the chest. It says how big she has built it.
   */
  home: HomeSnapshot;
  /**
   * The recipes she knows for her workbench. Every game knows the starting ones whether or
   * not they're here; ids are only checked to be strings, and the town leaves out any it doesn't
   * know.
   */
  recipes: RecipeId[];
  /**
   * Her friendship with each neighbour she has met: its points, and the day of the last talk, gift
   * and favour. A villager id is only checked to be a string; the town leaves out any it
   * doesn't know.
   */
  friends: Partial<Record<VillagerId, Friendship>>;
  /** The letters in her mailbox, by id, the day each came, and whether she has opened it. */
  mail: MailEntry[];
  /**
   * Her Curiosity Cabinet: the day she first caught each critter, and which are on show at the
   * museum. Ids are only checked to be strings; the cabinet leaves out any it doesn't know.
   */
  cabinet: CabinetSnapshot;
  /**
   * Her pets: which is out walking with her, the names she has given them, what each wears, the
   * accessories she owns, and Fibi's bones brought back. Ids are only checked to be strings;
   * the pets leave out any they don't know.
   */
  pets: PetsSnapshot;
  /**
   * The mayor's mystery: the day each clue was pinned to her corkboard. Ids are only checked
   * to be strings; the casebook leaves out any it doesn't know.
   */
  mystery: MysterySnapshot;
  /**
   * The places she has found, and the shut ones opened to her (save v14). Ids are only checked to
   * be strings; the atlas leaves out any it doesn't know.
   */
  atlas: AtlasSnapshot;
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
    harvested: [],
    candy: STARTING_CANDY,
    home: structuredClone(STARTER_HOME),
    recipes: [],
    friends: {},
    mail: [],
    cabinet: { caught: {}, donated: [] },
    pets: structuredClone(STARTER_PETS),
    mystery: { clues: {} },
    atlas: { found: ['town', 'home'], opened: [] },
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
    typeof l.freckles === 'boolean' &&
    typeof l.nosePiercing === 'boolean' &&
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

function isStringList(value: unknown): boolean {
  return Array.isArray(value) && value.every((id) => typeof id === 'string');
}

function isHomeShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const h = value as Record<string, unknown>;
  return (
    Array.isArray(h.placed) &&
    h.placed.every((piece) => {
      if (typeof piece !== 'object' || piece === null) return false;
      const p = piece as Record<string, unknown>;
      return (
        typeof p.id === 'string' &&
        Number.isInteger(p.tx) &&
        Number.isInteger(p.ty) &&
        Number.isInteger(p.turn)
      );
    }) &&
    isBagShape(h.stored) &&
    typeof h.wallpaper === 'string' &&
    typeof h.flooring === 'string' &&
    isStringList(h.wallpapers) &&
    isStringList(h.floorings) &&
    Number.isInteger(h.size)
  );
}

const dayOrNull = (value: unknown) => value === null || typeof value === 'string';

function isFriendsShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  return Object.values(value).every((friend) => {
    if (typeof friend !== 'object' || friend === null) return false;
    const f = friend as Record<string, unknown>;
    return (
      typeof f.points === 'number' &&
      Number.isFinite(f.points) &&
      f.points >= 0 &&
      dayOrNull(f.talked) &&
      dayOrNull(f.gifted) &&
      dayOrNull(f.favour)
    );
  });
}

function isMailShape(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((entry) => {
      if (typeof entry !== 'object' || entry === null) return false;
      const m = entry as Record<string, unknown>;
      return typeof m.id === 'string' && typeof m.on === 'string' && typeof m.opened === 'boolean';
    })
  );
}

function isCabinetShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.caught === 'object' &&
    c.caught !== null &&
    !Array.isArray(c.caught) &&
    Object.values(c.caught).every((day) => typeof day === 'string') &&
    isStringList(c.donated)
  );
}

function isStringRecord(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === 'string')
  );
}

function isPetsShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    (p.walking === null || typeof p.walking === 'string') &&
    isStringRecord(p.names) &&
    isStringRecord(p.wearing) &&
    isStringList(p.accessories) &&
    Number.isInteger(p.bones) &&
    (p.bones as number) >= 0 &&
    dayOrNull(p.happy)
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
    typeof p.zone === 'string' &&
    (s.look === null || isLookShape(s.look)) &&
    Array.isArray(s.wardrobe) &&
    s.wardrobe.every((id) => typeof id === 'string') &&
    isBagShape(s.bag) &&
    isTakenShape(s.taken) &&
    isBedsShape(s.beds) &&
    isStringList(s.harvested) &&
    Number.isInteger(s.candy) &&
    (s.candy as number) >= 0 &&
    isHomeShape(s.home) &&
    isStringList(s.recipes) &&
    isFriendsShape(s.friends) &&
    isMailShape(s.mail) &&
    isCabinetShape(s.cabinet) &&
    isPetsShape(s.pets) &&
    typeof s.mystery === 'object' &&
    s.mystery !== null &&
    isStringRecord((s.mystery as Record<string, unknown>).clues) &&
    typeof s.atlas === 'object' &&
    s.atlas !== null &&
    isStringList((s.atlas as Record<string, unknown>).found) &&
    isStringList((s.atlas as Record<string, unknown>).opened)
  );
}
