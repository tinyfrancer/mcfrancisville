import type { PatchStage } from '../data/pumpkinPatch';
import type { CalendarId } from '../data/calendar';
import type { BroomLook } from '../data/broom';
import type { Placed } from '../data/home';
import type { DecorId } from '../data/holidays';
import type { ClueId } from '../data/mystery';
import type { Effect } from '../data/dishes';
import type { Made } from '../data/recipes';
import type { Ware } from '../data/shop';
import type { Held } from '../data/tools';
import type { VisitGift } from '../data/visits';
import type { Weather } from '../data/weather';
import type { OutCritter } from '../systems/critters';
import type { DayWindow } from '../systems/clock';
import type { Taken } from '../systems/crafting';
import type { Refusal } from '../systems/decor';
import type { StallSnapshot, StallStack } from '../systems/passive';
import type { FestivalDay } from '../systems/calendar';
import type { Tile } from '../systems/pathfinding';
import type { Letter, Reaction, Sender } from '../systems/friendship';
import type { Opens } from '../data/interiors';
import type {
  BuriedId,
  CritterId,
  DishId,
  FixtureId,
  CropId,
  FurnitureId,
  HappeningId,
  ItemId,
  LostId,
  MapZoneId,
  OutfitId,
  PetId,
  PotPlantId,
  PropId,
  RecipeId,
  ShelfId,
  ShopId,
  VillagerId,
  ZoneId,
} from '../types/ids';
import type { Atlas } from './Atlas';
import type { Stack } from './Bag';
import type { Today } from './services/Calendar';
import type { Cabinet } from './Cabinet';
import type { Casebook } from './Casebook';
import type { Friends } from './Friends';
import type { Home } from './Home';
import type { Pets } from './Pets';

/** Where something she gathered came from: a tree or rock, a flower patch, or the night's snack. */
export type GatherSource = PropId | 'flowers' | 'snack' | 'bone';

/**
 * Moments the view draws and the sound plays; state the view reads off the world instead. `at` is
 * the prop she was tapped over to, when she walked to one rather than to open ground. `resting` is
 * something that has already given what it gives this window, and will again when it's `back`. A `bead` is one
 * found as well, in a rock or a tree.
 *
 * In the garden, `tilled` and `bare` are a bed waiting for a seed, which the HUD asks her to pick;
 * `days` is how many mornings until a crop is ripe. In a shop, `candy` is what a sale brought in.
 *
 * At home, `piece` is the furniture she walked up to, and `says` what it says; `entered` is going
 * through a door into another zone; `played` is the record player putting on one of her records
 * (null if she has none yet), with `dance` for the one she dances to; and `refused` is a piece she
 * tried to put somewhere it won't go while decorating.
 *
 * At the workbench, `made` is something she made, and `grew` her house getting bigger.
 *
 * Out in town, `villager` is the neighbour she walked up to, to talk; `mail` is a letter come to
 * her mailbox.
 *
 * With her net, `caught` is a critter caught (`first` if it's new to her Curiosity Cabinet), and
 * `fled` one that fluttered off before she could, not far. With her rod (phase Q), `cast` is her
 * float going in (with a `hint` of what to wait for, until she has caught a fish), `nibble` and
 * `bite` what the fish does, `letGo` a bite she let pass (`first` since she cast), `reeled` a tap
 * too soon, and `caught` a fish landed.
 *
 * With her pets, `pet` is the one she walked up to. At her door, `potted` is a new plant in her pots.
 *
 * Inside a building, `fixture` is what stands there for good that she walked up to, and `opens`
 * the sheet it opens (a shop, the salon, the museum); `keepsake` is a piece a neighbour let her
 * have one like.
 *
 * In the mayor's mystery, `clue` is one pinned to her corkboard, and `wesGone` is Wes, gone from
 * where he was lurking by the time she got near, once his button is already on the board.
 */
export type WorldEvent =
  | {
      kind: 'arrived';
      tx: number;
      ty: number;
      at?: PropId;
      piece?: FurnitureId;
      villager?: VillagerId;
      pet?: PetId;
      /** Something standing in a building for good, and the sheet it opens, if any. */
      fixture?: FixtureId;
      opens?: Opens;
      /** What the piece she walked up to says, filled in: the orbs count the years. */
      says?: string;
      /** The place the signpost she walked up to names (0.2's C1). */
      sign?: MapZoneId;
    }
  /** A neighbour let her have a piece just like one in their house, into her storage chest. */
  | { kind: 'keepsake'; piece: FurnitureId; from: VillagerId }
  | { kind: 'mail'; from: Sender }
  | { kind: 'clue'; clue: ClueId }
  | { kind: 'wesGone'; line: number }
  | { kind: 'wesDropped' }
  | { kind: 'crowned'; villager: VillagerId }
  | { kind: 'photo'; with: VillagerId; caption: string }
  /** A new window of the day began while she played (phase N), and what's on today. */
  | { kind: 'window'; window: DayWindow; happening: CalendarId[]; festival: FestivalDay | null }
  /** It's a rainy or foggy day, told the first time she's outdoors in it (phase L). */
  | { kind: 'weather'; weather: Exclude<Weather, 'clear'>; storm?: true }
  /** A far-off rumble of thunder on a stormy day, a moment after a flash (0.2's K1). */
  | { kind: 'thunder' }
  | { kind: 'entered'; scene: ZoneId; happening?: HappeningId }
  /**
   * She flew somewhere (0.2's P1): home or back again by broom, or anywhere by the world map, and
   * what she called out as she hopped on, if she called anything.
   */
  | { kind: 'flew'; to: ZoneId; call?: string }
  /** She got somewhere for the first time. */
  | { kind: 'found'; zone: ZoneId }
  /** A shut place has opened to her. */
  | { kind: 'opened'; zone: ZoneId }
  /** She came to the way into a place that's still shut. */
  | { kind: 'shut'; zone: ZoneId }
  /** She stepped onto the ice without her skates, and slid back to the bank (phase B1). */
  | { kind: 'slipped' }
  | { kind: 'played'; record: ItemId | null; dance?: true }
  | { kind: 'refused'; why: Refusal }
  | { kind: 'gathered'; from: GatherSource; item: ItemId; count: number; bead?: ItemId }
  | { kind: 'resting'; from: GatherSource; item: ItemId; back: DayWindow }
  | { kind: 'tilled'; tx: number; ty: number }
  | { kind: 'bare'; tx: number; ty: number }
  /** `quick` where it grows best, a day sooner (0.2's N1). */
  | { kind: 'planted'; crop: CropId; tx: number; ty: number; quick?: true }
  | { kind: 'watered'; crop: CropId; days: number }
  | { kind: 'growing'; crop: CropId; days: number; rained?: true; sprinkled?: true }
  /** She planted the seed in her hand along a row of beds (phase P). */
  | { kind: 'sowedRow'; crop: CropId; count: number }
  /** She stood a sprinkler in a bed's corner, reaching `beds` beds (phase P). */
  | { kind: 'fitted'; beds: number }
  /** She took a sprinkler back out, into her bag. */
  | { kind: 'unfitted' }
  | { kind: 'harvested'; crop: CropId; item: ItemId; count: number; seed: ItemId; first: boolean }
  | { kind: 'bought'; shop: ShopId; ware: Ware; price: number }
  /** She answered a note on the noticeboard (phase N), and was paid in Candy. */
  | { kind: 'answered'; from: VillagerId; item: ItemId; count: number; candy: number }
  | { kind: 'sold'; item: ItemId; count: number; candy: number }
  | { kind: 'made'; recipe: RecipeId; made: Made }
  /** She cooked a dish at a stove (phase R), from what it `used`; `night` if a late-night one. */
  | { kind: 'cooked'; recipe: RecipeId; item: DishId; used: Taken[]; night: boolean }
  /** She ate something from her bag, and it does its small thing till the window turns. */
  | { kind: 'ate'; item: ItemId; effect: Effect; until: DayWindow }
  | { kind: 'caught'; critter: CritterId; first: boolean }
  | { kind: 'fled'; critter: CritterId }
  | { kind: 'cast'; hint?: true }
  | { kind: 'nibble' }
  | { kind: 'bite' }
  | { kind: 'letGo'; first?: true }
  | { kind: 'reeled' }
  /** She swapped what's growing in the pots by her door. */
  | { kind: 'potted'; plant: PotPlantId }
  /** She dug up something buried, into her bag. */
  | { kind: 'dug'; buried: BuriedId; item: ItemId }
  /** A day turned while she played: another visit, and its gift (phase O). */
  | { kind: 'visit'; count: number; gift: VisitGift }
  /**
   * She shook the candy tree: what fell, or nothing yet and when there'll be more (phase O), and
   * in October a sweet with it (0.2's J2), and now and then a sapling (0.2's E1).
   */
  | { kind: 'shook'; candy: number; back?: DayWindow; sweet?: ItemId; sapling?: true }
  /**
   * She came to a ring of earth in her yard (0.2's E1): she planted a sapling, it's still growing
   * (so many days to go), or it waits for one.
   */
  | { kind: 'sapling'; did: 'planted' | 'growing' | 'waiting'; days?: number }
  | { kind: 'patch'; stage: PatchStage; picked?: boolean }
  /** She came by the honesty stall, and took the Candy for what sold from its tin (phase O). */
  | { kind: 'stallSold'; sold: StallStack[]; candy: number }
  /** She found something a neighbour lost in town, to carry back to them (phase S2). */
  | { kind: 'foundLost'; lost: LostId }
  /** A newcomer has moved in today (phase T). */
  | { kind: 'movedIn'; villager: VillagerId }
  /** A holiday's decorations went up this morning, told when she's first out in town (phase U). */
  | { kind: 'decorated'; decor: DecorId }
  /** The park pond froze over for skating this morning, told as the decorations are (phase U). */
  | { kind: 'frozen' }
  /** Neighbours put their costumes on this morning, told as the decorations are (0.2's J2). */
  | { kind: 'dressedUp'; villagers: VillagerId[] }
  /** She found one of Easter's eggs: how many so far, and how many still hidden (phase U). */
  | { kind: 'foundEgg'; found: number; left: number }
  /**
   * She knocked at a neighbour's door on a festival evening (0.2's J2): the sweet she was handed,
   * by them if they were `home` or from the bowl on the step, and what happened, as it's read.
   */
  | { kind: 'trickOrTreat'; villager: VillagerId; item: ItemId; home: boolean; line: string };

/** The state the HUD follows (decisions.md 9). */
export interface WorldState extends Record<string, unknown> {
  bag: readonly Stack[];
  candy: number;
  /** Where she is, as she goes from one zone to another. */
  scene: ZoneId;
  /** Her home changed: a piece moved, turned, came out or went away, or the walls or floor did. */
  home: Home;
  /** Decorating began, ended, or picked up a different piece. */
  decorating: Decorating | null;
  /** She learned a recipe. */
  recipes: readonly RecipeId[];
  /** How many letters are waiting in her mailbox, unread. */
  mail: number;
  /** A friendship grew. */
  friends: Friends;
  /** She caught something new, or put something on show. */
  cabinet: Cabinet;
  /** A pet was named, dressed, taken for a walk or sent home, or given a bone back. */
  pets: Pets;
  /** A clue was pinned to her corkboard. */
  mystery: Casebook;
  /** She found a place, or one opened to her. */
  atlas: Atlas;
  /** A piece of clothing came to her closet. */
  closet: readonly OutfitId[];
  /** What she's holding changed (the quick bar). */
  held: Held;
  /** Something new arrived on one of her collections, or she looked at one. */
  fresh: Record<ShelfId, number>;
  /** A new window of the day began: the day, its window, and what's on. */
  today: Today;
  /** The honesty stall's stock or tin changed. */
  stall: StallSnapshot;
  /** A bed's pop-up went up, or came down with null (phase P). */
  bed: Tile | null;
  /** Her broom's colours changed (0.2's P1). */
  broom: BroomLook;
}

/**
 * What one part of the world tells another that it did, for a part that cares to act on it (the
 * mystery pins a clue when she buys from the Moon Pie Man). Never seen outside the world.
 */
export interface Signals extends Record<string, unknown> {
  bought: { shop: ShopId; ware: Ware };
  /** She opened a letter for the first time. */
  opened: { letter: string };
  /** One of the big moments that gets her rocking out (personal_touches.md, "Her, drawn bigger"). */
  thrilled: { by: Thrill };
  /** She went from one place to another, and is standing in the new one. */
  crossed: { from: ZoneId; to: ZoneId };
  /** A piece of furniture was moved across her room (`to`), or put away in the chest (null). */
  moved: { piece: FurnitureId; from: Tile; to: Tile | null };
}

/** A critter out in town now, where it is, and what its catch is remembered by. */
export interface Critter extends OutCritter {
  key: string;
}

/** A rare catch, a loved gift, the first of a crop, or a letter from Cody. */
export type Thrill = 'catch' | 'gift' | 'harvest' | 'letter' | 'find';

/** What a villager said as she talked to them. `bonus` is the day's first talk, which counts. */
export interface Chat {
  line: string;
  bonus: boolean;
  /** They let one go (Cody, mostly). */
  puff: boolean;
  /** Something they handed her, at one of their happenings. */
  gift?: ItemId;
  /** The Candy they gave her for handing back something they'd lost. */
  candy?: number;
}

/** How a villager took a gift, or that they'd rather she kept it for another day. */
export type GiftResult =
  { declined: false; reaction: Reaction; line: string } | { declined: true; line: string };

/** A letter in her mailbox, as she reads it. */
export interface MailView extends Letter {
  id: string;
  on: string;
  opened: boolean;
}

/** She's decorating, and this is the piece she has picked up, if any. */
export interface Decorating {
  selected: Placed | null;
}

/** She got where she was going; what she walked up to is filled in as it's used. */
export type Arrived = Extract<WorldEvent, { kind: 'arrived' }>;
