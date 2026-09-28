import type { Placed } from '../data/home';
import type { ClueId } from '../data/mystery';
import type { Made } from '../data/recipes';
import type { Ware } from '../data/shop';
import type { OutCritter } from '../systems/critters';
import type { Refusal } from '../systems/decor';
import type { Letter, Reaction, Sender } from '../systems/friendship';
import type {
  CritterId,
  CropId,
  FurnitureId,
  ItemId,
  PetId,
  PotPlantId,
  PropId,
  RecipeId,
  ShopId,
  VillagerId,
  ZoneId,
} from '../types/ids';
import type { Atlas } from './Atlas';
import type { Stack } from './Bag';
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
 * something that has already given what it gives today, and will again tomorrow. A `bead` is one
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
 * `fled` one that fluttered off before she could, not far.
 *
 * With her pets, `pet` is the one she walked up to. At her door, `potted` is a new plant in her pots.
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
      /** What the piece she walked up to says, filled in: the orbs count the years. */
      says?: string;
    }
  | { kind: 'mail'; from: Sender }
  | { kind: 'clue'; clue: ClueId }
  | { kind: 'wesGone'; line: number }
  | { kind: 'entered'; scene: ZoneId }
  /** She got somewhere for the first time. */
  | { kind: 'found'; zone: ZoneId }
  /** A shut place has opened to her. */
  | { kind: 'opened'; zone: ZoneId }
  /** She came to the way into a place that's still shut. */
  | { kind: 'shut'; zone: ZoneId }
  | { kind: 'played'; record: ItemId | null; dance?: true }
  | { kind: 'refused'; why: Refusal }
  | { kind: 'gathered'; from: GatherSource; item: ItemId; count: number; bead?: ItemId }
  | { kind: 'resting'; from: GatherSource; item: ItemId }
  | { kind: 'tilled'; tx: number; ty: number }
  | { kind: 'bare'; tx: number; ty: number }
  | { kind: 'planted'; crop: CropId; tx: number; ty: number }
  | { kind: 'watered'; crop: CropId; days: number }
  | { kind: 'growing'; crop: CropId; days: number }
  | { kind: 'harvested'; crop: CropId; item: ItemId; count: number; seed: ItemId; first: boolean }
  | { kind: 'bought'; shop: ShopId; ware: Ware; price: number }
  | { kind: 'sold'; item: ItemId; count: number; candy: number }
  | { kind: 'made'; recipe: RecipeId; made: Made }
  | { kind: 'caught'; critter: CritterId; first: boolean }
  | { kind: 'fled'; critter: CritterId }
  /** She swapped what's growing in the pots by her door. */
  | { kind: 'potted'; plant: PotPlantId };

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
}

/** A critter out in town now, where it is, and what its catch is remembered by. */
export interface Critter extends OutCritter {
  key: string;
}

/** A rare catch, a loved gift, the first of a crop, or a letter from Cody. */
export type Thrill = 'catch' | 'gift' | 'harvest' | 'letter';

/** What a villager said as she talked to them. `bonus` is the day's first talk, which counts. */
export interface Chat {
  line: string;
  bonus: boolean;
  /** Cody let one go. */
  puff: boolean;
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
