import type { BroomLook } from '../data/broom';
import type { HomeInput } from '../data/home';
import type { MapSource } from '../data/maps';
import type { PetsSnapshot } from '../data/pets';
import type { YardSnapshot } from '../data/yard';
import type { SavedPlayer, SaveState } from '../persistence/SaveState';
import type { Clock } from '../systems/clock';
import type { Meals } from '../systems/cooking';
import type { StallSnapshot } from '../systems/passive';
import type { FurnitureId } from '../types/ids';
import type { AtlasSnapshot } from './Atlas';
import type { Stack } from './Bag';
import type { CabinetSnapshot } from './Cabinet';
import type { MysterySnapshot } from './Casebook';
import type { SavedBed, SavedSprinkler } from './Farm';
import type { FriendsSnapshot } from './Friends';
import type { MailEntry } from './Letters';
import type { PorchSnapshot } from './Porch';
import type { CandyTreeSnapshot } from './services/CandyTree';
import type { FreshSnapshot } from './services/Novelty';
import type { VisitsSnapshot } from './services/Visits';
import type { ClosetSnapshot } from './Wardrobe';

/** What of her finds is saved: the bag, and what she has taken today. */
export interface FindsSnapshot {
  bag: Stack[];
  taken: Record<string, string>;
}

export interface WorldOptions {
  map?: MapSource;
  /** Where she was when the game was last saved. */
  player?: SavedPlayer;
  closet?: Partial<ClosetSnapshot>;
  finds?: Partial<FindsSnapshot>;
  /** Her garden beds as they were saved. */
  beds?: readonly SavedBed[];
  /** The crops she has picked before. */
  harvested?: readonly string[];
  /** The sprinklers in her beds. */
  sprinklers?: readonly SavedSprinkler[];
  /** How many of the farm's extension rows she has built (0.2's N1). */
  farmRows?: number;
  /** The Candy she had saved; a new game starts with a little. */
  candy?: number;
  /** Her home as it was saved; a new game's is already furnished. */
  home?: HomeInput;
  /** The recipes she has learned, beyond the ones everyone knows. */
  recipes?: readonly string[];
  /** Her friendships and her mail. */
  friends?: Partial<FriendsSnapshot & { mail: MailEntry[] }>;
  /** Her Curiosity Cabinet: what she has caught, and what's on show at the museum. */
  cabinet?: Partial<CabinetSnapshot>;
  /** Her pets' names and accessories, and which is out walking with her. */
  pets?: Partial<PetsSnapshot>;
  /** The clues pinned to her corkboard. */
  mystery?: Partial<MysterySnapshot>;
  /** The places she has found, and those opened to her. */
  atlas?: Partial<AtlasSnapshot>;
  /** What's growing in the pots by her door. */
  porch?: Partial<PorchSnapshot>;
  /** The keepsakes from her neighbours' houses she has been given. */
  keepsakes?: readonly FurnitureId[];
  /** The buried things she has dug up. */
  dug?: readonly string[];
  /** What she was holding on the quick bar. */
  held?: string;
  /** What's new on her collections that she hasn't looked at yet. */
  fresh?: Partial<FreshSnapshot>;
  /** How many days she has visited, and the last. */
  visits?: Partial<VisitsSnapshot>;
  /** When she last shook the candy tree. */
  candyTree?: Partial<CandyTreeSnapshot>;
  /** What's on the honesty stall, and in its tin. */
  stall?: Partial<StallSnapshot>;
  /** When she last ate for each of a meal's effects. */
  kitchen?: Partial<Meals>;
  /** The lost thing she's carrying back to its owner. */
  errand?: string | null;
  /** Where she last flew home from by broom. */
  left?: SavedPlayer | null;
  /** Her broom's colours. */
  broom?: Partial<BroomLook>;
  /** Every squishy and monster doll she has ever had (0.2's F2). */
  collected?: readonly string[];
  /** The tunes Boothoven has taught her, and their duet (0.2's L2). */
  tunes?: readonly string[];
  /** What stands out in her yard (0.3's H5). */
  yard?: Partial<YardSnapshot>;
  clock?: Clock;
}

/** Everything of the world a save keeps; the save itself adds only its version and times. */
export type WorldSave = Omit<SaveState, 'version' | 'createdAt' | 'updatedAt' | 'lastPlayedAt'>;

/** What puts a saved world back as it was, or a new one if there's no save. */
export function fromSave(save: WorldSave | null): WorldOptions {
  if (!save) return {};
  return {
    player: save.player,
    closet: save,
    finds: save,
    beds: save.beds,
    harvested: save.harvested,
    sprinklers: save.sprinklers,
    farmRows: save.farmRows,
    candy: save.candy,
    home: save.home,
    recipes: save.recipes,
    friends: save,
    cabinet: save.cabinet,
    pets: save.pets,
    mystery: save.mystery,
    atlas: save.atlas,
    porch: save.porch,
    keepsakes: save.keepsakes,
    dug: save.dug,
    held: save.held,
    fresh: save.fresh,
    visits: save.visits,
    candyTree: save.candyTree,
    stall: save.stall,
    kitchen: save.kitchen,
    errand: save.errand,
    left: save.left,
    broom: save.broom as Partial<BroomLook>,
    collected: save.collected,
    tunes: save.tunes,
    yard: save.yard,
  };
}
