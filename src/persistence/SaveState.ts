import { STARTER_HOME, type HomeSnapshot } from '../data/home';
import { STARTER_BAG } from '../data/items';
import { STARTER_PETS, type PetsSnapshot } from '../data/pets';
import { STARTING_CANDY } from '../data/shop';
import { STARTER_WARDROBE } from '../data/outfits';
import type { SavedBed, SavedSprinkler } from '../world/Farm';
import type {
  BuriedId,
  CropId,
  Facing,
  FurnitureId,
  ItemId,
  OutfitId,
  RecipeId,
  VillagerId,
  ZoneId,
} from '../types/ids';
import type { AtlasSnapshot } from '../world/Atlas';
import { noneFresh, SHELF_IDS } from '../data/shelves';
import type { FreshSnapshot } from '../world/services/Novelty';
import type { PorchSnapshot } from '../world/Porch';
import type { CabinetSnapshot } from '../world/Cabinet';
import type { MysterySnapshot } from '../world/Casebook';
import type { Friendship } from '../world/Friends';
import type { MailEntry } from '../world/Letters';
import type { Look } from '../types/look';
import type { VisitsSnapshot } from '../world/services/Visits';
import type { CandyTreeSnapshot } from '../world/services/CandyTree';
import type { StallSnapshot } from '../systems/passive';
import type { Meals } from '../systems/cooking';
import { FIRST_BROOM } from '../data/broom';
import type { TuneId } from '../data/instruments';

/**
 * Bump when `SaveState` changes shape or meaning, and add the step that upgrades the old shape to
 * `migrations.ts` with a test. A save with no chain to this version is set aside, not loaded.
 */
export const SAVE_VERSION = 39;

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
   * The garden beds she has tilled, by place (save v29), and what's growing in each. A crop id is
   * only checked to be a string here; the `Farm` drops any it doesn't know, and gives back the
   * seed of what grew in any bed no longer there.
   */
  beds: SavedBed[];
  /**
   * Every crop she has ever picked, so the first of each is a moment (save v13). Ids are only
   * checked to be strings; the `Farm` leaves out any it doesn't know.
   */
  harvested: CropId[];
  /**
   * The sprinklers in her beds' corners (save v22), and the day key each has watered from. A
   * sprinkler in a bed the map no longer has goes back in her bag.
   */
  sprinklers: SavedSprinkler[];
  /** How many of the farm's extension rows she has built (save v29). */
  farmRows: number;
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
  /**
   * What's growing in the pots by her door (save v16). The id is only checked to be a string;
   * the porch puts the mums back for one it doesn't know.
   */
  porch: PorchSnapshot;
  /**
   * The keepsakes from her neighbours' houses she has been given one like (save v17). Ids are only
   * checked to be strings; the keeper leaves out any it doesn't know as a keepsake.
   */
  keepsakes: FurnitureId[];
  /**
   * The buried things she has dug up (save v18). Ids are only checked to be strings; the keeper
   * leaves out any it doesn't know.
   */
  dug: BuriedId[];
  /**
   * What she's holding on the quick bar (save v20): a tool, or a seed. Only checked to be a
   * string; one this build doesn't know, or a seed she has run out of, is her hands.
   */
  held: string;
  /**
   * What's new on each of her collections that she hasn't looked at yet (save v20). Ids are only
   * checked to be strings; a mark on something she no longer has is let go.
   */
  fresh: FreshSnapshot;
  /** How many days she has visited, and the day key of the last (save v21). */
  visits: VisitsSnapshot;
  /**
   * When she last shook the candy tree, or null if she never has (save v21), and the saplings
   * she has planted in her yard (save v31).
   */
  candyTree: CandyTreeSnapshot;
  /**
   * The honesty stall (save v21): what's on it, when its sales were last worked out, and what
   * sold since she last came by, with its tin, and its shelves built on (save v31). Ids are only
   * checked to be strings; the stall leaves out any it doesn't know.
   */
  stall: StallSnapshot;
  /**
   * When she last ate for each effect of a meal (save v23): a spring in her step, eager fish, and
   * the family a lure brings out. Only checked for shape; a family this build doesn't lure is let go.
   */
  kitchen: Meals;
  /**
   * The lost thing she's carrying back to one of her neighbours, or null (save v24). Only checked
   * to be a string; one this build doesn't know is let go.
   */
  errand: string | null;
  /**
   * Where she last flew home from by broom, to fly back to, or null (save v26, 0.2's P1). Checked
   * as a player's spot is; a place this build doesn't know is let go.
   */
  left: SavedPlayer | null;
  /**
   * Her broom's colours (save v26). Only checked to be strings; one this build doesn't know is the
   * colour it came in.
   */
  broom: { ribbon: string; bristles: string };
  /**
   * Every squishy and monster doll she has ever had, for the sets she collects (save v30, 0.2's
   * F2). Only checked to be strings; one this build doesn't know is let go.
   */
  collected: ItemId[];
  /**
   * The tunes Boothoven has taught her, and their duet once they've played it (save v33, 0.2's
   * L2). Only checked to be strings; one this build doesn't know is let go.
   */
  tunes: TuneId[];
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
    sprinklers: [],
    farmRows: 0,
    candy: STARTING_CANDY,
    home: structuredClone(STARTER_HOME),
    recipes: [],
    friends: {},
    mail: [],
    cabinet: { caught: {}, donated: [] },
    pets: structuredClone(STARTER_PETS),
    mystery: { clues: {} },
    atlas: { found: ['town', 'home'], opened: [] },
    porch: { plant: 'mums' },
    keepsakes: [],
    dug: [],
    held: 'hands',
    fresh: noneFresh(),
    visits: { count: 0, last: '' },
    candyTree: { shaken: null, saplings: [] },
    stall: { stock: [], since: now, sold: [], tin: 0, shelves: 0 },
    kitchen: { pep: null, bites: null, lure: null },
    errand: null,
    left: null,
    broom: { ...FIRST_BROOM },
    collected: [],
    tunes: [],
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
    (l.splitColour === null || typeof l.splitColour === 'string') &&
    typeof l.stripesArm === 'string' &&
    Array.isArray(l.wrist) &&
    l.wrist.every((id) => typeof id === 'string') &&
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
    (p.lastWatered === null || typeof p.lastWatered === 'string') &&
    (p.quick === undefined || p.quick === true)
  );
}

function isBedsShape(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((bed) => {
      if (typeof bed !== 'object' || bed === null) return false;
      const b = bed as Record<string, unknown>;
      return (
        typeof b.zone === 'string' &&
        Number.isInteger(b.tx) &&
        Number.isInteger(b.ty) &&
        isPlantingShape(b.planting)
      );
    })
  );
}

function isSprinklersShape(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((s) => {
      if (typeof s !== 'object' || s === null) return false;
      const r = s as Record<string, unknown>;
      return (
        typeof r.zone === 'string' &&
        Number.isInteger(r.tx) &&
        Number.isInteger(r.ty) &&
        typeof r.since === 'string'
      );
    })
  );
}

function isStringList(value: unknown): boolean {
  return Array.isArray(value) && value.every((id) => typeof id === 'string');
}

function isPlacedList(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every((piece) => {
      if (typeof piece !== 'object' || piece === null) return false;
      const p = piece as Record<string, unknown>;
      return (
        typeof p.id === 'string' &&
        Number.isInteger(p.tx) &&
        Number.isInteger(p.ty) &&
        Number.isInteger(p.turn) &&
        // What a display piece has on show (0.3's H2, v36), if anything.
        (p.shows === undefined || typeof p.shows === 'string') &&
        // A small piece standing on a surface (0.3's H3, v37).
        (p.on === undefined || p.on === true)
      );
    })
  );
}

/** One room of her home (0.3's H4): what's in it, its walls and floor, and its size. */
function isRoomShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const r = value as Record<string, unknown>;
  return (
    isPlacedList(r.placed) &&
    typeof r.wallpaper === 'string' &&
    typeof r.flooring === 'string' &&
    Number.isInteger(r.size)
  );
}

function isHomeShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const h = value as Record<string, unknown>;
  const rooms = h.rooms;
  return (
    typeof rooms === 'object' &&
    rooms !== null &&
    !Array.isArray(rooms) &&
    isRoomShape((rooms as Record<string, unknown>).main) &&
    Object.values(rooms).every(isRoomShape) &&
    typeof h.here === 'string' &&
    isBagShape(h.stored) &&
    isBagShape(h.items) &&
    isStringList(h.wallpapers) &&
    isStringList(h.floorings)
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
      dayOrNull(f.favour) &&
      (f.wears === undefined || typeof f.wears === 'string')
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

function isFreshShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const f = value as Record<string, unknown>;
  return SHELF_IDS.every((shelf) => isStringList(f[shelf]));
}

function isStallShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    isBagShape(s.stock) &&
    isBagShape(s.sold) &&
    typeof s.since === 'number' &&
    Number.isInteger(s.tin) &&
    (s.tin as number) >= 0 &&
    Number.isInteger(s.shelves) &&
    (s.shelves as number) >= 0
  );
}

function isKitchenShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const k = value as Record<string, unknown>;
  const time = (t: unknown) => t === null || (typeof t === 'number' && Number.isFinite(t));
  const lure = k.lure as Record<string, unknown> | null;
  return (
    time(k.pep) &&
    time(k.bites) &&
    (lure === null ||
      (typeof lure === 'object' && typeof lure.family === 'string' && time(lure.at)))
  );
}

function isCandyTreeShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const { shaken, saplings } = value as Record<string, unknown>;
  const time = (t: unknown) => t === null || (typeof t === 'number' && Number.isFinite(t));
  return (
    time(shaken) &&
    Array.isArray(saplings) &&
    saplings.every((s: Record<string, unknown> | null) => {
      if (typeof s !== 'object' || s === null) return false;
      return (
        Number.isInteger(s.tx) &&
        Number.isInteger(s.ty) &&
        typeof s.planted === 'number' &&
        time(s.shaken)
      );
    })
  );
}

function isVisitsShape(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return Number.isInteger(v.count) && (v.count as number) >= 0 && typeof v.last === 'string';
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
    isSprinklersShape(s.sprinklers) &&
    Number.isInteger(s.farmRows) &&
    (s.farmRows as number) >= 0 &&
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
    isStringList((s.atlas as Record<string, unknown>).opened) &&
    typeof s.porch === 'object' &&
    s.porch !== null &&
    typeof (s.porch as Record<string, unknown>).plant === 'string' &&
    isStringList(s.keepsakes) &&
    isStringList(s.dug) &&
    typeof s.held === 'string' &&
    isFreshShape(s.fresh) &&
    isVisitsShape(s.visits) &&
    isCandyTreeShape(s.candyTree) &&
    isStallShape(s.stall) &&
    isKitchenShape(s.kitchen) &&
    (s.errand === null || typeof s.errand === 'string') &&
    (s.left === null || isSpotShape(s.left)) &&
    isBroomShape(s.broom) &&
    isStringList(s.collected) &&
    isStringList(s.tunes)
  );
}

function isSpotShape(value: unknown): value is SavedPlayer {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Number.isInteger(v.tx) &&
    Number.isInteger(v.ty) &&
    typeof v.facing === 'string' &&
    FACINGS.includes(v.facing) &&
    typeof v.zone === 'string'
  );
}

function isBroomShape(value: unknown): value is SaveState['broom'] {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.ribbon === 'string' && typeof v.bristles === 'string';
}
