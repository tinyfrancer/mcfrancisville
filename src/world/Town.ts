import { PROP_FOOTPRINT, TOWN, type MapSource } from '../data/maps';
import type { SavedPlayer } from '../persistence/SaveState';
import { TILE_SIZE } from '../config/world';
import { cropFromSeed, CROPS } from '../data/crops';
import { FURNITURE } from '../data/furniture';
import { CHEST, type HomeSnapshot, type Placed } from '../data/home';
import { CRITTERS, flies, isCritter } from '../data/critters';
import { MUSEUM_LABELS, MUSEUM_LETTERS, MUSEUM_SPECIAL } from '../data/museum';
import { ITEMS } from '../data/items';
import { PATCHES, PROP_YIELDS, type Yield } from '../data/gathering';
import { RECIPE_IDS, RECIPES, STARTER_RECIPES, type Made } from '../data/recipes';
import { STARTING_CANDY, type Ware } from '../data/shop';
import { VILLAGER_IDS, VILLAGERS, type Favour } from '../data/villagers';
import { PET_IDS, type PetsSnapshot } from '../data/pets';
import { dayKey, hourOf, systemClock, type Clock } from '../systems/clock';
import { cantMake, type CantMake } from '../systems/crafting';
import { BONE_KEY, boneLine, lostBone, patLine, type LostBone } from '../systems/pets';
import {
  critterKey,
  crittersOut,
  flutterTo,
  townHabitats,
  type Habitats,
  type OutCritter,
} from '../systems/critters';
import {
  bonusOf,
  canWater,
  daysToRipe,
  plantingSeed,
  stageOf,
  water,
  yieldOf,
} from '../systems/farming';
import {
  hashString,
  isReady,
  patchKey,
  propKey,
  pruneTaken,
  SNACK_KEY,
  snackTonight,
  type Snack,
} from '../systems/gathering';
import { parseMap, walkable, type PlacedProp, type TileMap } from '../systems/grid';
import { findPath, type Tile } from '../systems/pathfinding';
import { footprint, type Refusal } from '../systems/decor';
import {
  declineLine,
  favourCandy,
  favourOf,
  FAVOUR_POINTS,
  fill,
  GIFT_POINTS,
  giftLine,
  letterOf,
  lineFor,
  PUFF_MS,
  puffingAt,
  puffLine,
  puffsOnTalk,
  reactionTo,
  rewardsBetween,
  specialLetterId,
  stopOf,
  TALK_POINTS,
  yearsMarried,
  type Letter,
  type Reaction,
  type Sender,
} from '../systems/friendship';
import { MAYOR_LETTERS, VISITOR_BOOK_CRITTERS, type ClueId } from '../data/mystery';
import {
  lurksOf,
  secondLetterDue,
  WES_SLOT_MS,
  WES_SPOOKS_AT,
  wesSpot,
  type Lurk,
} from '../systems/mystery';
import { Casebook, type MysterySnapshot } from './Casebook';
import {
  canSell,
  peddlerSpot,
  popUpLot,
  sameWare,
  sellValue,
  stockOf,
  type Shelf,
} from '../systems/shop';
import type {
  AccessoryId,
  CritterId,
  CropId,
  Facing,
  FurnitureId,
  ItemId,
  PetId,
  PropId,
  RecipeId,
  SceneId,
  ShopId,
  VillagerId,
} from '../types/ids';
import { Bag, type Stack } from './Bag';
import { EventBus } from './eventBus';
import { bedKey, Farm, type SavedBed } from './Farm';
import { Cabinet, type CabinetSnapshot } from './Cabinet';
import { Friends, type FriendsSnapshot } from './Friends';
import { Home } from './Home';
import { nearestOpen, Pet } from './Pet';
import { Pets } from './Pets';
import { facingFor, Neighbour, type Ground } from './Neighbour';
import { Wardrobe, type ClosetSnapshot } from './Wardrobe';

/** Four tiles a second: brisk enough to cross town in under ten, slow enough to feel like a stroll. */
export const WALK_SPEED = 4 * TILE_SIZE;

/** Where something she gathered came from: a tree or rock, a flower patch, or the night's snack. */
export type GatherSource = PropId | 'flowers' | 'snack' | 'bone';

/**
 * Moments the view draws and the sound plays; state the view reads off the town instead. `at` is
 * the prop she was tapped over to, when she walked to one rather than to open ground. `resting` is
 * something that has already given what it gives today, and will again tomorrow. A `bead` is one
 * found as well, in a rock or a tree.
 *
 * In the garden, `tilled` and `bare` are a bed waiting for a seed, which the HUD asks her to pick;
 * `days` is how many mornings until a crop is ripe. In a shop, `candy` is what a sale brought in.
 *
 * At home, `piece` is the furniture she walked up to, and `says` what it says; `entered` is going in or out of her door;
 * `played` is the record player putting on one of her records (null if she has none yet); and
 * `refused` is a piece she tried to put somewhere it won't go while decorating.
 *
 * At the workbench, `made` is something she made, and `grew` her house getting bigger.
 *
 * Out in town, `villager` is the neighbour she walked up to, to talk; `mail` is a letter come to
 * her mailbox.
 *
 * With her net, `caught` is a critter caught (`first` if it's new to her Curiosity Cabinet), and
 * `fled` one that fluttered off before she could, not far.
 *
 * With her pets, `pet` is the one she walked up to.
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
  | { kind: 'entered'; scene: SceneId }
  | { kind: 'played'; record: ItemId | null }
  | { kind: 'refused'; why: Refusal }
  | { kind: 'gathered'; from: GatherSource; item: ItemId; count: number; bead?: ItemId }
  | { kind: 'resting'; from: GatherSource; item: ItemId }
  | { kind: 'tilled'; tx: number; ty: number }
  | { kind: 'bare'; tx: number; ty: number }
  | { kind: 'planted'; crop: CropId; tx: number; ty: number }
  | { kind: 'watered'; crop: CropId; days: number }
  | { kind: 'growing'; crop: CropId; days: number }
  | { kind: 'harvested'; crop: CropId; item: ItemId; count: number; seed: ItemId }
  | { kind: 'bought'; shop: ShopId; ware: Ware; price: number }
  | { kind: 'sold'; item: ItemId; count: number; candy: number }
  | { kind: 'made'; recipe: RecipeId; made: Made }
  | { kind: 'caught'; critter: CritterId; first: boolean }
  | { kind: 'fled'; critter: CritterId };

/** The state the HUD follows (decisions.md 9). */
export interface TownState extends Record<string, unknown> {
  bag: readonly Stack[];
  candy: number;
  /** Where she is, as she goes in or out. */
  scene: SceneId;
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
}

/** A critter out in town now, where it is, and what its catch is remembered by. */
export interface Critter extends OutCritter {
  key: string;
}

/** How long a swing of her net takes. */
export const NET_MS = 420;

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

/** What of her finds is saved: the bag, and what she has taken today. */
export interface FindsSnapshot {
  bag: Stack[];
  taken: Record<string, string>;
}

export interface Player {
  /** World pixels, at the centre of her feet's tile when she stands still. */
  x: number;
  y: number;
  facing: Facing;
  moving: boolean;
  /** Time spent walking since she last stood still; the walk cycle is read off it. */
  walkMs: number;
}

export function tileCentre(t: Tile): { x: number; y: number } {
  return { x: t.tx * TILE_SIZE + TILE_SIZE / 2, y: t.ty * TILE_SIZE + TILE_SIZE / 2 };
}

export function tileOf(x: number, y: number): Tile {
  return { tx: Math.floor(x / TILE_SIZE), ty: Math.floor(y / TILE_SIZE) };
}

export interface TownOptions {
  map?: MapSource;
  /** Where she was when the game was last saved; out in town unless it says she was indoors. */
  player?: Omit<SavedPlayer, 'indoors'> & { indoors?: boolean };
  closet?: Partial<ClosetSnapshot>;
  finds?: Partial<FindsSnapshot>;
  /** Her garden beds as they were saved. */
  beds?: readonly SavedBed[];
  /** The Candy she had saved; a new game starts with a little. */
  candy?: number;
  /** Her home as it was saved; a new game's is already furnished. */
  home?: Partial<HomeSnapshot>;
  /** The recipes she has learned, beyond the ones everyone knows. */
  recipes?: readonly string[];
  /** Her friendships and her mail. */
  friends?: Partial<FriendsSnapshot>;
  /** Her Curiosity Cabinet: what she has caught, and what's on show at the museum. */
  cabinet?: Partial<CabinetSnapshot>;
  /** Her pets' names and accessories, and which is out walking with her. */
  pets?: Partial<PetsSnapshot>;
  /** The clues pinned to her corkboard. */
  mystery?: Partial<MysterySnapshot>;
  clock?: Clock;
}

/**
 * Where she is walking to: a prop to use, a garden bed to tend, a piece of furniture at home, or a
 * neighbour to talk to (who may have wandered off by the time she gets there, so she tries again).
 */
type Visit =
  | { prop: PlacedProp }
  | { bed: Tile }
  | { piece: Placed }
  | { villager: VillagerId; tries: number }
  | { critter: string }
  | { pet: PetId };

/** How many times she follows a neighbour who has moved on before she gives up. */
const FOLLOW_TRIES = 4;

/** The storage chest, as a prop, so walking up to it arrives `at` it like any other. */
const CHEST_PROP: PlacedProp = { id: 'storageChest', ...CHEST, w: 1, h: 1 };

/**
 * The town and everyone in it, with no idea it is being drawn (decisions.md 9). The view reads it
 * once a frame and calls `tapTile`; nothing else reaches in.
 */
export class Town {
  readonly map: TileMap;
  readonly player: Player;
  readonly wardrobe: Wardrobe;
  /** The phone's clock, or a test's (decisions.md 4). */
  readonly clock: Clock;
  readonly bag: Bag;
  readonly farm: Farm;
  readonly home: Home;
  readonly friends: Friends;
  readonly cabinet: Cabinet;
  /** Her pets' names, what they wear, and which is walking with her. */
  readonly pets: Pets;
  /** The clues on her corkboard. */
  readonly casebook: Casebook;
  /** Where Wes can lurk, beside the trees; none in a town without neighbours. */
  private readonly lurks: readonly Lurk[];
  /** The minute Wes's whereabouts were last worked out for, and where he is in it, if anywhere. */
  private wesSlot = -1;
  private wesHere: Lurk | null = null;
  /** Where critters can be in town, from the map. */
  readonly habitats: Habitats;
  /** Her neighbours, out in town. */
  readonly neighbours: readonly Neighbour[];
  /** Her pets themselves, wherever each one is: at home, or out with her. */
  readonly petList: readonly Pet[];
  readonly events = new EventBus<TownState>();
  /** Out in town or at home. The player's position is in whichever one this is. */
  private where: SceneId = 'town';
  private decor: Decorating | null = null;
  /** Moments from a tap rather than a step (a piece that won't go there), handed out by `update`. */
  private pending: WorldEvent[] = [];
  /** How many records she has put on this visit, so the player works through her collection. */
  private plays = 0;
  /** What she has taken, and on which day; see `systems/gathering.ts`. */
  private taken: Record<string, string>;
  private purse: number;
  private readonly learned = new Set<RecipeId>(STARTER_RECIPES);
  /** Today's pop-up, worked out at most once a minute: pathfinding asks for it on every step. */
  private popUpCache: { minute: number; prop: PlacedProp | null } | null = null;
  private cartCache: { minute: number; prop: PlacedProp | null } | null = null;
  /** The pet whose sheet is open, who waits while it is. */
  private petting: PetId | null = null;
  /** How many times she has petted each, so they do something different each time. */
  private pats = new Map<PetId, number>();
  /** How long she has been standing still, which the pets notice. */
  private stillMs = 0;
  /** Who she is talking to, who waits while she does. */
  private talking: VillagerId | null = null;
  /** How many times she has talked to each neighbour today, so they don't repeat themselves. */
  private talks = new Map<VillagerId, { day: string; count: number }>();
  /** When Cody's last puff clears. */
  private puffUntil = 0;
  /** The hour's critters, dealt once an hour, before today's catches are taken out. */
  private critterCache: { hour: string; out: OutCritter[] } | null = null;
  /** Critters that have fluttered off this hour, by their day and key: where to, and how often. */
  private fluttered = new Map<string, { tile: Tile; times: number }>();
  /** When her net's last swing ends. */
  private netUntil = 0;
  /** The day the mailbox was last checked for a special day's letter. */
  private mailDay: string | null = null;
  /** Where she is headed, for the view's sparkle. Null once she arrives. */
  target: Tile | null = null;
  private path: Tile[] = [];
  /** The prop or bed she is walking to, used on arrival. */
  private visiting: Visit | undefined;
  /** An arrival with no walk, made by the next `update` so every arrival comes from one place. */
  private arrivedInPlace: Tile | null = null;

  /**
   * `saved` puts her back where she was. If that tile has stopped being somewhere she can stand (a
   * later map put a tree on it), she starts at her door instead of inside the tree.
   */
  constructor(options: TownOptions = {}) {
    const saved = options.player;
    this.map = parseMap(options.map ?? TOWN);
    this.clock = options.clock ?? systemClock;
    this.wardrobe = new Wardrobe(options.closet);
    this.bag = new Bag(options.finds?.bag);
    this.taken = { ...options.finds?.taken };
    this.farm = new Farm(this.map.beds, options.beds);
    this.home = new Home(options.home);
    this.friends = new Friends(options.friends);
    this.cabinet = new Cabinet(options.cabinet);
    this.pets = new Pets(options.pets);
    this.casebook = new Casebook(options.mystery);
    this.ground = { canWalk: this.townWalk, width: this.map.width, height: this.map.height };
    const now = this.clock.now();
    const source = options.map ?? TOWN;
    this.habitats = townHabitats(this.map, source.neighbours === true);
    this.neighbours = source.neighbours
      ? VILLAGER_IDS.map((id) => new Neighbour(id, stopOf(id, hourOf(now), dayKey(now))))
      : [];
    this.lurks = source.neighbours ? lurksOf(this.map, (tx, ty) => this.townWalk(tx, ty)) : [];
    for (const id of options.recipes ?? []) if (id in RECIPES) this.learned.add(id as RecipeId);
    const candy = options.candy ?? STARTING_CANDY;
    this.purse = Number.isInteger(candy) && candy >= 0 ? candy : STARTING_CANDY;
    if (saved?.indoors) this.where = 'home';
    const inside = this.where === 'home';
    const fallback = inside ? this.home.room.mat : this.map.spawn;
    const startTile = saved && this.canWalk(saved.tx, saved.ty) ? saved : fallback;
    const facing = saved?.facing ?? 'down';
    this.player = { ...tileCentre(startTile), facing, moving: false, walkMs: 0 };
    const roam = this.roamTiles();
    this.petList = PET_IDS.map(
      (id) => new Pet(id, roam[hashString(`pet:${id}`) % roam.length] ?? this.home.room.mat),
    );
    this.bringWalker();
  }

  /** What of her is worth saving: the tile she is on and the way she faces. */
  snapshot(): SavedPlayer {
    const { tx, ty } = tileOf(this.player.x, this.player.y);
    return { tx, ty, facing: this.player.facing, indoors: this.where === 'home' };
  }

  /** Her home, for saving. */
  homeSnapshot(): { home: HomeSnapshot } {
    return { home: this.home.snapshot() };
  }

  get scene(): SceneId {
    return this.where;
  }

  /** The size of where she is, in tiles. */
  get size(): { width: number; height: number } {
    return this.where === 'home'
      ? { width: this.home.room.width, height: this.home.room.height }
      : { width: this.map.width, height: this.map.height };
  }

  /** Her bag, and today's takings; yesterday's are dropped, since they no longer mean anything. */
  finds(): FindsSnapshot {
    return { bag: this.bag.snapshot(), taken: pruneTaken(this.taken, this.clock.now()) };
  }

  /** Her garden, for saving. */
  garden(): { beds: SavedBed[] } {
    return { beds: this.farm.snapshot() };
  }

  /** Her Candy, for saving. */
  wallet(): { candy: number } {
    return { candy: this.purse };
  }

  get candy(): number {
    return this.purse;
  }

  /** Her friendships and mail, for saving. */
  friendsSnapshot(): FriendsSnapshot {
    return this.friends.snapshot();
  }

  /** Her Curiosity Cabinet, for saving. */
  cabinetSnapshot(): { cabinet: CabinetSnapshot } {
    return { cabinet: this.cabinet.snapshot() };
  }

  /** Her pets, for saving. */
  petsSnapshot(): { pets: PetsSnapshot } {
    return { pets: this.pets.snapshot() };
  }

  /** Her corkboard's clues, for saving. */
  mysterySnapshot(): { mystery: MysterySnapshot } {
    return { mystery: this.casebook.snapshot() };
  }

  /** Pins a clue to her corkboard, the first time it's found. */
  private pinClue(id: ClueId): boolean {
    if (!this.casebook.pin(id, dayKey(this.clock.now()))) return false;
    this.pending.push({ kind: 'clue', clue: id });
    this.events.emit('mystery', this.casebook);
    return true;
  }

  /**
   * The mayor's mystery, as it moves on: the mayor's first letter once she has a name, the second
   * a week later, and the clues her friendships and her Curiosity Cabinet turn up.
   */
  private checkMystery(): void {
    if (!this.wardrobe.created) return;
    const day = dayKey(this.clock.now());
    if (!this.friends.has('mayor:0')) this.post('mayor:0', day);
    const first = this.friends.mail.find((m) => m.id === 'mayor:0');
    if (first && !this.friends.has('mayor:1') && secondLetterDue(first.on, day)) {
      this.post('mayor:1', day);
    }
    if (!this.casebook.foundOn('rumour') && VILLAGER_IDS.some((v) => this.friends.hearts(v) >= 3)) {
      this.pinClue('rumour');
    }
    if (this.cabinet.found >= VISITOR_BOOK_CRITTERS) this.pinClue('visitorBook');
  }

  /** Where Wes is lurking, if she's out in town and he's about. */
  wes(): Lurk | null {
    return this.where === 'town' ? this.wesHere : null;
  }

  /**
   * Wes turns up now and then, at the edge of where she can see, and is gone by the time she gets
   * near. The first time, he leaves a button behind.
   */
  private stepWes(): void {
    const now = this.clock.now();
    const slot = Math.floor(now / WES_SLOT_MS);
    const her = tileOf(this.player.x, this.player.y);
    if (slot !== this.wesSlot) {
      this.wesSlot = slot;
      const taken = this.neighbours.map((n) => n.tile);
      const free = this.lurks.filter((l) => !taken.some((t) => t.tx === l.tx && t.ty === l.ty));
      this.wesHere = this.where === 'town' ? wesSpot(slot, free, her) : null;
    }
    const wes = this.wes();
    if (!wes || reach(her, wes) > WES_SPOOKS_AT) return;
    this.wesHere = null;
    if (!this.pinClue('button')) {
      this.pending.push({ kind: 'wesGone', line: hashString(`wesGone@${slot}`) });
    }
  }

  /** Wes, on a tile in town: at his feet, or his hat just above. */
  private wesAt(tx: number, ty: number): Lurk | null {
    const wes = this.wes();
    return wes && wes.tx === tx && (wes.ty === ty || wes.ty - 1 === ty) ? wes : null;
  }

  pet(id: PetId): Pet {
    return this.petList.find((p) => p.id === id)!;
  }

  /** The pets where she is now: all those at home when she's in, and the one out walking with her. */
  petsHere(): Pet[] {
    return this.petList.filter((p) => p.scene === this.where);
  }

  /** The pet on a tile where she is, if any. */
  petAt(tx: number, ty: number): Pet | undefined {
    return this.petsHere().find((p) => {
      const t = p.tile;
      return t.tx === tx && t.ty === ty;
    });
  }

  /** Whose sheet is open, if anyone's. */
  get pettingNow(): PetId | null {
    return this.petting;
  }

  /** She's done with a pet's sheet, and it can go back to what it was doing. */
  endPet(): void {
    this.petting = null;
  }

  /** Pets one: what it does about it. */
  patPet(id: PetId): string {
    const count = this.pats.get(id) ?? 0;
    this.pats.set(id, count + 1);
    this.pet(id).say('heart', this.clock.now(), 1600);
    return patLine(id, this.pets.nameOf(id), count);
  }

  /**
   * Takes a pet out walking with her, or with null, sends whoever was home. Only one walks with
   * her at a time (decisions.md 67); the one who was goes home, and the new one comes to her side.
   */
  walkWith(id: PetId | null): void {
    const was = this.pets.walking;
    if (was === id) return;
    if (was) {
      const pet = this.pet(was);
      if (pet.scene !== 'home') {
        pet.scene = 'home';
        const roam = this.roamTiles();
        pet.place(roam[hashString(`pet:${was}`) % roam.length] ?? this.home.room.mat);
      }
    }
    this.pets.walking = id;
    if (id && this.pet(id).scene !== this.where) this.bringWalker();
    this.events.emit('pets', this.pets);
  }

  /** Gives a pet a name; an empty one gives them back their own. The name they have now. */
  renamePet(id: PetId, name: string): string {
    const named = this.pets.rename(id, name);
    this.events.emit('pets', this.pets);
    return named;
  }

  /** Dresses a pet in an accessory she owns, or with null, takes it off. */
  dressPet(id: PetId, what: AccessoryId | null): boolean {
    if (!this.pets.dress(id, what)) return false;
    this.events.emit('pets', this.pets);
    return true;
  }

  /** Gives Fibi back one of her bones, which makes her day. What she does, or null without one. */
  returnBone(): string | null {
    if (!this.bag.remove('fibisBone')) return null;
    const now = this.clock.now();
    this.pets.boneBack(dayKey(now));
    this.pet('fibi').say('heart', now, 2400);
    this.events.emit('bag', this.bag.contents);
    this.events.emit('pets', this.pets);
    return boneLine(this.pets.nameOf('fibi'), this.pets.bones);
  }

  /** Where Fibi's bone is waiting today, until she finds it; null on a day Fibi kept hold of it. */
  lostBone(): LostBone | null {
    if (!this.isReady(BONE_KEY)) return null;
    return lostBone(dayKey(this.clock.now()), this.townBoneSpots(), this.homeBoneSpots());
  }

  /** Somewhere odd in town: beside a tree, a pumpkin or a gravestone. */
  private townBoneSpots(): Tile[] {
    const { trees, pumpkins, graves } = this.habitats;
    return [...trees, ...pumpkins, ...graves].filter((t) => this.townWalk(t.tx, t.ty));
  }

  /** Under the furniture: the open floor in front of each standing piece at home. */
  private homeBoneSpots(): Tile[] {
    const spots: Tile[] = [];
    const mat = this.home.room.mat;
    for (const piece of this.home.placed) {
      if (FURNITURE[piece.id].layer !== 'floor') continue;
      const { w, h } = footprint(piece.id, piece.turn);
      const t = { tx: piece.tx + Math.floor((w - 1) / 2), ty: piece.ty + h };
      const onMat = t.tx === mat.tx && t.ty === mat.ty;
      if (!onMat && this.home.canWalk(t.tx, t.ty)) spots.push(t);
    }
    return spots;
  }

  /** The open floor at home a pet can wander to: anywhere but the door mat. */
  private roamTiles(): Tile[] {
    const room = this.home.room;
    const tiles: Tile[] = [];
    for (let ty = 0; ty < room.height; ty++) {
      for (let tx = 0; tx < room.width; tx++) {
        const mat = tx === room.mat.tx && ty === room.mat.ty;
        if (!mat && this.home.canWalk(tx, ty)) tiles.push({ tx, ty });
      }
    }
    return tiles;
  }

  /** The pet walking with her comes to wherever she is, and sits beside her. */
  private bringWalker(): void {
    const id = this.pets.walking;
    if (!id) return;
    const pet = this.pet(id);
    pet.scene = this.where;
    const here = tileOf(this.player.x, this.player.y);
    const [dx, dy] = FACING_STEP[this.player.facing];
    const back = { tx: here.tx - dx, ty: here.ty - dy };
    const spot = this.canWalk(back.tx, back.ty)
      ? back
      : (nearestOpen(here, this.groundHere()) ?? here);
    pet.place(spot);
    pet.pose = 'sit';
  }

  /** Where she is, as a pet walks it. */
  private groundHere(): Ground {
    const { width, height } = this.size;
    return { canWalk: this.canWalk, width, height };
  }

  /**
   * Her pets, where she is, each up to whatever it's up to: the one walking with her follows her,
   * and those at home potter about. One she's walking up to, or whose sheet is open, waits.
   */
  private stepPets(deltaMs: number): void {
    if (this.player.moving) this.stillMs = 0;
    else this.stillMs += deltaMs;
    const here = this.petsHere();
    if (here.length === 0) return;
    const now = this.clock.now();
    const p = this.player;
    const her = { x: p.x, y: p.y, facing: p.facing, moving: p.moving, stillMs: this.stillMs };
    const heading = this.visiting && 'pet' in this.visiting ? this.visiting.pet : null;
    const surroundings = {
      now,
      ground: this.groundHere(),
      her,
      villagers: this.where === 'town' ? this.neighbours.map((n) => n.tile) : [],
      roam: this.where === 'home' ? this.roamTiles() : [],
      happy: this.pets.fibiHappy(dayKey(now)),
    };
    for (const pet of here) {
      pet.update(deltaMs, {
        ...surroundings,
        following: pet.id === this.pets.walking,
        held: pet.id === this.petting || pet.id === heading,
      });
    }
  }

  /** Walks up beside a pet, to see to it. */
  private approach(pet: Pet): boolean {
    const at = pet.tile;
    const here = tileOf(this.player.x, this.player.y);
    if (reach(here, at) === 1) return this.walkTo([here], { pet: pet.id });
    const goals: Tile[] = [];
    for (let y = at.ty - 1; y <= at.ty + 1; y++) {
      for (let x = at.tx - 1; x <= at.tx + 1; x++) {
        if ((x !== at.tx || y !== at.ty) && this.canWalk(x, y)) goals.push({ tx: x, ty: y });
      }
    }
    return this.walkTo(goals, { pet: pet.id });
  }

  /** The name she typed, which her neighbours call her (all but Cody, who says babe). */
  get name(): string {
    return this.wardrobe.look.name;
  }

  /** The recipes she knows, for saving. */
  recipeBook(): { recipes: RecipeId[] } {
    return { recipes: this.recipes };
  }

  /** Every recipe she knows, in the order the workbench shows them. */
  get recipes(): RecipeId[] {
    return RECIPE_IDS.filter((id) => this.learned.has(id));
  }

  knows(id: RecipeId): boolean {
    return this.learned.has(id);
  }

  /** Learns a recipe, from a card or a friend. False if she already knew it. */
  learn(id: RecipeId): boolean {
    if (this.learned.has(id)) return false;
    this.learned.add(id);
    this.events.emit('recipes', this.recipes);
    return true;
  }

  /** Why she can't make something now, or null if she can. */
  cantMake(id: RecipeId): CantMake | null {
    return cantMake(id, {
      knows: (r) => this.knows(r),
      count: (item) => this.bag.count(item),
      roomSize: this.home.room.size,
    });
  }

  /**
   * Makes something at her workbench, at once: what it needs comes out of her bag, and what it
   * makes goes into her bag or her storage chest, or builds onto her house. Null, and nothing
   * taken, if she can't make it now.
   */
  craft(id: RecipeId): WorldEvent | null {
    if (this.cantMake(id) !== null) return null;
    const row = RECIPES[id];
    for (const { item, count } of row.needs) this.bag.remove(item, count);
    const made = row.makes;
    if ('item' in made) this.bag.add(made.item, 1);
    else if ('furniture' in made) this.home.store(made.furniture);
    else this.home.grow();
    this.events.emit('bag', this.bag.contents);
    if (!('item' in made)) this.events.emit('home', this.home);
    return { kind: 'made', recipe: id, made };
  }

  /** Where the pop-up shop stands today, solid over its footprint, or null if it isn't in town. */
  popUp(): PlacedProp | null {
    const now = this.clock.now();
    const minute = Math.floor(now / 60_000);
    if (this.popUpCache?.minute !== minute) {
      const lot = popUpLot(this.map.popUpLots, now);
      const prop: PlacedProp | null = lot
        ? { id: 'popUpShop', ...lot, ...PROP_FOOTPRINT.popUpShop }
        : null;
      this.popUpCache = { minute, prop };
    }
    return this.popUpCache.prop;
  }

  /** Where the Moon Pie Man's cart stands today, solid over its footprint, or null if he's away. */
  moonPieCart(): PlacedProp | null {
    const now = this.clock.now();
    const minute = Math.floor(now / 60_000);
    if (this.cartCache?.minute !== minute) {
      const spot = peddlerSpot(this.map.peddlerSpots, now);
      const prop: PlacedProp | null = spot
        ? { id: 'moonPieCart', ...spot, ...PROP_FOOTPRINT.moonPieCart }
        : null;
      this.cartCache = { minute, prop };
    }
    return this.cartCache.prop;
  }

  /**
   * Whether a shop is open to her today. Cobweb Corner always is; the pop-up and the Moon Pie Man
   * only when they're in town.
   */
  isOpen(shop: ShopId): boolean {
    if (shop === 'popUp') return this.popUp() !== null;
    if (shop === 'moonPie') return this.moonPieCart() !== null;
    return true;
  }

  /** What a shop has on its shelves today. */
  stock(shop: ShopId): Shelf[] {
    return stockOf(shop, dayKey(this.clock.now()));
  }

  /**
   * Buys one of something on a shop's shelves today: into her bag, her storage chest, or her closet,
   * walls and floors or recipes for good. Null, and nothing spent, if the shop is shut, it isn't on
   * the shelves today, she can't afford it, or it's something bought once that she already has.
   */
  buy(shop: ShopId, ware: Ware): WorldEvent | null {
    if (!this.isOpen(shop)) return null;
    const offer = this.stock(shop)
      .flatMap((shelf) => shelf.offers)
      .find((o) => sameWare(o.ware, ware));
    if (!offer || offer.price > this.purse) return null;
    if (!this.receive(ware)) return null;
    this.purse -= offer.price;
    this.events.emit('candy', this.purse);
    if (shop === 'moonPie') this.pinClue('wrapper');
    return { kind: 'bought', shop, ware, price: offer.price };
  }

  /**
   * Puts something she was sold or given where it belongs: her bag, her storage chest, or her
   * closet, walls and floors or recipes for good. False for something kept once that she has.
   */
  private receive(ware: Ware): boolean {
    if ('outfit' in ware) return this.wardrobe.give(ware.outfit);
    if ('wallpaper' in ware) return this.home.giveWallpaper(ware.wallpaper);
    if ('flooring' in ware) return this.home.giveFlooring(ware.flooring);
    if ('recipe' in ware) return this.learn(ware.recipe);
    if ('accessory' in ware) {
      if (!this.pets.give(ware.accessory)) return false;
      this.events.emit('pets', this.pets);
      return true;
    }
    if ('furniture' in ware) {
      this.home.store(ware.furniture);
      this.events.emit('home', this.home);
    } else {
      this.bag.add(ware.item, 1);
      this.events.emit('bag', this.bag.contents);
    }
    return true;
  }

  /**
   * The neighbour standing on a tile out in town, by their feet, or by their head where that isn't
   * over something else she might have meant, like the mailbox.
   */
  villagerAt(tx: number, ty: number): Neighbour | undefined {
    if (this.where !== 'town') return undefined;
    const heads = this.propAt(tx, ty) === undefined;
    return this.neighbours.find((n) => {
      const t = n.tile;
      return t.tx === tx && (t.ty === ty || (heads && t.ty - 1 === ty));
    });
  }

  neighbour(id: VillagerId): Neighbour {
    return this.neighbours.find((n) => n.id === id)!;
  }

  /** Who she's talking to, if anyone. */
  get talkingTo(): VillagerId | null {
    return this.talking;
  }

  /** She's done talking, and they can be on their way. */
  endTalk(): void {
    this.talking = null;
  }

  private talksToday(id: VillagerId): number {
    const t = this.talks.get(id);
    return t && t.day === dayKey(this.clock.now()) ? t.count : 0;
  }

  /**
   * Talks to a neighbour: what they say, and whether it was the day's first talk, which brings
   * them a little closer. Cody lets one go now and then.
   */
  talk(id: VillagerId): Chat {
    const now = this.clock.now();
    const day = dayKey(now);
    const talks = this.talksToday(id);
    const bonus = this.friends.of(id).talked !== day;
    if (bonus) this.befriend(id, TALK_POINTS, { talked: day });
    const puff = id === 'cody' && puffsOnTalk(day, talks);
    const said = puff
      ? puffLine(day, talks)
      : lineFor(id, { hearts: this.friends.hearts(id), day, hour: hourOf(now), talks });
    this.talks.set(id, { day, count: talks + 1 });
    if (puff) this.puffUntil = now + PUFF_MS;
    return { line: fill(said, { name: this.name, years: yearsMarried(day) }), bonus, puff };
  }

  /** Whether Cody has just let one go, for the view to draw the puff. */
  puffing(): boolean {
    const now = this.clock.now();
    return now < this.puffUntil || puffingAt(now);
  }

  /**
   * Gives a neighbour something from her bag. Only the first gift of the day counts; a second is
   * politely turned down, and stays in her bag. Null if she hasn't got it.
   */
  give(id: VillagerId, item: ItemId): GiftResult | null {
    if (this.bag.count(item) === 0 || item === 'fibisBone') return null;
    const day = dayKey(this.clock.now());
    if (this.friends.of(id).gifted === day) {
      return { declined: true, line: fill(declineLine(id), { name: this.name }) };
    }
    this.bag.remove(item);
    this.events.emit('bag', this.bag.contents);
    const reaction = reactionTo(id, item);
    this.befriend(id, GIFT_POINTS[reaction], { gifted: day });
    return { declined: false, reaction, line: fill(giftLine(id, item), { name: this.name }) };
  }

  /** What a neighbour has to ask of her today, until she's done it. */
  favour(id: VillagerId): Favour | null {
    const day = dayKey(this.clock.now());
    if (this.friends.of(id).favour === day) return null;
    return favourOf(id, day);
  }

  /**
   * Hands over what a neighbour asked for, and takes their thanks and some Candy. Null if they
   * asked nothing today or she hasn't enough of it.
   */
  doFavour(id: VillagerId): { line: string; candy: number } | null {
    const favour = this.favour(id);
    if (!favour || !this.bag.remove(favour.item, favour.count)) return null;
    const candy = favourCandy(favour);
    this.purse += candy;
    this.events.emit('bag', this.bag.contents);
    this.events.emit('candy', this.purse);
    this.befriend(id, FAVOUR_POINTS, { favour: dayKey(this.clock.now()) });
    return { line: fill(VILLAGERS[id].thanks, { name: this.name }), candy };
  }

  /** Adds to a friendship, and posts a letter for each milestone it passes. */
  private befriend(id: VillagerId, points: number, change: Parameters<Friends['update']>[1]): void {
    const before = this.friends.of(id).points;
    this.friends.update(id, { ...change, points: before + points });
    const day = dayKey(this.clock.now());
    for (const reward of rewardsBetween(id, before, this.friends.of(id).points)) {
      this.post(`${id}:${reward.hearts}`, day);
    }
    this.events.emit('friends', this.friends);
  }

  private post(id: string, day: string): void {
    const letter = letterOf(id);
    if (!letter || !this.friends.send(id, day)) return;
    this.pending.push({ kind: 'mail', from: letter.from });
    this.events.emit('mail', this.friends.unread);
  }

  /** A special day's letter, the first time the town is stepped on that day. */
  private checkMail(): void {
    this.checkMystery();
    const day = dayKey(this.clock.now());
    if (day === this.mailDay) return;
    this.mailDay = day;
    const id = specialLetterId(day);
    if (id) this.post(id, day);
  }

  /** Her mail, newest first, as she reads it. */
  get mail(): MailView[] {
    const name = this.name;
    return this.friends.mail
      .map((m) => {
        const letter = letterOf(m.id)!;
        const text = fill(letter.text, { name, years: yearsMarried(m.on) });
        return { ...letter, text, ...m };
      })
      .reverse();
  }

  /**
   * Opens a letter: the first time, whatever came with it goes where it belongs. False if there's
   * no such letter or it was already open.
   */
  openLetter(id: string): boolean {
    if (!this.friends.open(id)) return false;
    const gift = letterOf(id)?.gift;
    if (gift) this.receive(gift);
    const [key, n] = id.split(':');
    const mayor = key === 'mayor' ? MAYOR_LETTERS[Number(n)] : undefined;
    if (mayor) this.pinClue(mayor.clue);
    this.events.emit('mail', this.friends.unread);
    return true;
  }

  /** Sells `count` of something in her bag, if she has that many and a shop will take it. */
  sell(item: ItemId, count = 1): WorldEvent | null {
    if (!canSell(item) || !this.bag.remove(item, count)) return null;
    const candy = sellValue(item) * count;
    this.purse += candy;
    this.events.emit('bag', this.bag.contents);
    this.events.emit('candy', this.purse);
    return { kind: 'sold', item, count, candy };
  }

  /** Whether a tree, rock or patch (by its key in `systems/gathering.ts`) has anything to give today. */
  isReady(key: string): boolean {
    return isReady(this.taken, key, this.clock.now());
  }

  /** Tonight's snack, where it waits, until she finds it. Null by day. */
  snack(): Snack | null {
    return snackTonight(this.map.snackSpots, this.taken, this.clock.now());
  }

  /**
   * The critters out in town now, and where, less any she has caught this hour. The hour's are
   * dealt once (decisions.md 4); one that has fluttered off is wherever it went.
   */
  critters(): Critter[] {
    const now = this.clock.now();
    const day = dayKey(now);
    const hour = Math.floor(hourOf(now));
    const which = `${day}@${hour}`;
    if (this.critterCache?.hour !== which) {
      this.critterCache = {
        hour: which,
        out: crittersOut(day, hour, this.habitats, this.critterCanBe),
      };
      this.fluttered.clear();
    }
    const out: Critter[] = [];
    for (const c of this.critterCache.out) {
      const key = critterKey(hour, c.slot);
      if (!this.isReady(key)) continue;
      const moved = this.fluttered.get(key);
      out.push(moved ? { ...c, ...moved.tile, key } : { ...c, key });
    }
    return out;
  }

  /**
   * Where a critter may be today: open ground nothing is standing on, or the pond where it can be
   * reached from open ground.
   */
  private critterCanBe = (t: Tile): boolean => {
    if (this.townWalk(t.tx, t.ty)) return true;
    if (walkable(this.map, t.tx, t.ty)) return false;
    for (let y = t.ty - 1; y <= t.ty + 1; y++) {
      for (let x = t.tx - 1; x <= t.tx + 1; x++) if (this.townWalk(x, y)) return true;
    }
    return false;
  };

  /** The critter on a tile out in town; one that flies can be tapped in the air above it too. */
  critterAt(tx: number, ty: number): Critter | undefined {
    if (this.where !== 'town') return undefined;
    const air =
      this.propAt(tx, ty) === undefined &&
      !this.map.patches.some((p) => p.tx === tx && p.ty === ty);
    return this.critters().find(
      (c) => c.tx === tx && (c.ty === ty || (air && flies(c.critter) && c.ty - 1 === ty)),
    );
  }

  /** Whether her net is mid-swing, and how far through: 0 as it starts, 1 as it ends. */
  netSwing(): number | null {
    const left = this.netUntil - this.clock.now();
    return left > 0 && left <= NET_MS ? 1 - left / NET_MS : null;
  }

  /** Creeps up within reach of a critter, to catch it. */
  private stalk(critter: Critter): boolean {
    const here = tileOf(this.player.x, this.player.y);
    if (reach(here, critter) <= 1) return this.walkTo([here], { critter: critter.key });
    const goals: Tile[] = [];
    for (let y = critter.ty - 1; y <= critter.ty + 1; y++) {
      for (let x = critter.tx - 1; x <= critter.tx + 1; x++) {
        if ((x !== critter.tx || y !== critter.ty) && this.canWalk(x, y))
          goals.push({ tx: x, ty: y });
      }
    }
    return this.walkTo(goals, { critter: critter.key });
  }

  /**
   * A swing of her net at a critter within reach. A wary one flutters off to somewhere near the
   * first time or two; otherwise it's caught, into her bag and her Curiosity Cabinet.
   */
  private swing(critter: Critter): WorldEvent {
    const now = this.clock.now();
    const day = dayKey(now);
    this.netUntil = now + NET_MS;
    const id = critter.critter;
    const row = CRITTERS[id];
    const times = this.fluttered.get(critter.key)?.times ?? 0;
    if (times < row.wary) {
      const others = new Set(this.critters().map((c) => `${c.tx},${c.ty}`));
      const to = flutterTo(
        critter,
        this.habitats[row.habitat],
        (t) => this.critterCanBe(t) && !others.has(`${t.tx},${t.ty}`),
      );
      if (to) {
        this.fluttered.set(critter.key, { tile: to, times: times + 1 });
        return { kind: 'fled', critter: id };
      }
    }
    this.taken[critter.key] = day;
    this.bag.add(id, 1);
    const first = this.cabinet.record(id, day);
    this.events.emit('bag', this.bag.contents);
    if (first) this.events.emit('cabinet', this.cabinet);
    return { kind: 'caught', critter: id, first };
  }

  /**
   * Gives a critter from her bag to Wrapunzel's museum, to go on show: what its label says, or null
   * if she hasn't one, or one is already on show. Wrapunzel writes as the cases fill.
   */
  donate(id: CritterId): string | null {
    if (!isCritter(id) || this.cabinet.isDonated(id) || !this.bag.remove(id)) return null;
    this.cabinet.donate(id);
    this.events.emit('bag', this.bag.contents);
    this.events.emit('cabinet', this.cabinet);
    const day = dayKey(this.clock.now());
    for (const letter of MUSEUM_LETTERS) {
      if (this.cabinet.onShow >= letter.donated) this.post(`museum:${letter.donated}`, day);
    }
    const label = MUSEUM_SPECIAL[id] ?? MUSEUM_LABELS[hashString(id) % MUSEUM_LABELS.length]!;
    return label.replaceAll('{critter}', CRITTERS[id].name.toLowerCase());
  }

  /**
   * Open ground, and not where the pop-up shop or the Moon Pie Man's cart happens to be standing
   * today; or open floor at home.
   */
  canWalk = (tx: number, ty: number): boolean =>
    this.where === 'home' ? this.home.canWalk(tx, ty) : this.townWalk(tx, ty);

  private townWalk = (tx: number, ty: number): boolean =>
    walkable(this.map, tx, ty) &&
    !covers(this.popUp(), tx, ty) &&
    !covers(this.moonPieCart(), tx, ty);

  /** The town, as her neighbours walk it, wherever she happens to be. */
  private readonly ground: Ground;

  /**
   * Walk to a tapped tile. A tap on something solid (a tree, a house, a garden bed) walks to the
   * open tile beside it that is quickest to reach, and she uses it when she gets there. Returns
   * false when there is nowhere to go.
   */
  tapTile(tx: number, ty: number): boolean {
    if (this.decor) return this.decorTap(tx, ty);
    this.talking = null;
    this.petting = null;
    const neighbour = this.villagerAt(tx, ty);
    if (neighbour) return this.follow(neighbour, 0);
    // She sets off after Wes; he'll be gone by the time she's near.
    const wes = this.wesAt(tx, ty);
    if (wes) return this.walkTo([wes], undefined);
    const critter = this.critterAt(tx, ty);
    if (critter) return this.stalk(critter);
    const pet = this.petAt(tx, ty);
    if (pet) return this.approach(pet);
    const prop = this.propAt(tx, ty);
    const piece = this.where === 'home' ? this.home.pieceAt(tx, ty) : undefined;
    const goals = this.canWalk(tx, ty) ? [{ tx, ty }] : this.openTilesBeside(tx, ty);
    const bed = { tx, ty };
    let visit: Visit | undefined;
    if (prop) visit = { prop };
    else if (piece && FURNITURE[piece.id].layer !== 'rug') visit = { piece };
    else if (this.where === 'town' && this.farm.isBed(bed)) visit = { bed };
    return this.walkTo(goals, visit);
  }

  /** Walks up beside a neighbour, to talk. */
  private follow(neighbour: Neighbour, tries: number): boolean {
    const at = neighbour.tile;
    const here = tileOf(this.player.x, this.player.y);
    const goals: Tile[] = [];
    for (let y = at.ty - 1; y <= at.ty + 1; y++) {
      for (let x = at.tx - 1; x <= at.tx + 1; x++) {
        if ((x !== at.tx || y !== at.ty) && this.canWalk(x, y)) goals.push({ tx: x, ty: y });
      }
    }
    // Already beside them: no walk, just a hello.
    if (goals.some((g) => g.tx === here.tx && g.ty === here.ty))
      goals.splice(0, goals.length, here);
    return this.walkTo(goals, { villager: neighbour.id, tries });
  }

  /** Sets off by the quickest way to whichever of `goals` is nearest, to do `visit` there. */
  private walkTo(goals: readonly Tile[], visit: Visit | undefined): boolean {
    const here = tileOf(this.player.x, this.player.y);
    const { width, height } = this.size;
    let best: Tile[] | null = null;
    for (const goal of goals) {
      const path = findPath(here, goal, this.canWalk, width, height);
      if (path && (!best || path.length < best.length)) best = path;
    }
    if (!best) return false;
    this.visiting = visit;
    this.arrivedInPlace = null;

    // Back to the middle of her own tile first: heading straight for the next one from part way
    // along a step could shave the corner of whatever she is walking past.
    const centre = tileCentre(here);
    const offCentre = centre.x !== this.player.x || centre.y !== this.player.y;
    this.path = offCentre ? [here, ...best] : best;
    this.target = best.at(-1) ?? here;
    if (this.path.length === 0) {
      this.stop();
      this.arrivedInPlace = here;
    } else {
      this.player.moving = true;
    }
    return true;
  }

  update(deltaMs: number): WorldEvent[] {
    this.checkMail();
    this.stepWes();
    this.stepNeighbours(deltaMs);
    this.stepPets(deltaMs);
    const events: WorldEvent[] = this.pending;
    this.pending = [];
    if (this.arrivedInPlace) {
      events.push(...this.arrival(this.arrivedInPlace));
      this.arrivedInPlace = null;
    }
    if (this.path.length === 0) return events;
    const p = this.player;
    let budget = (WALK_SPEED * deltaMs) / 1000;
    p.moving = true;
    p.walkMs += deltaMs;

    // Spend the frame's whole travel, across as many tiles as it covers, so a long frame on a slow
    // phone lands exactly where a smooth one would.
    while (budget > 0 && this.path.length > 0) {
      const next = tileCentre(this.path[0]!);
      const dx = next.x - p.x;
      const dy = next.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) p.facing = facingFor(dx, dy);
      if (dist <= budget) {
        p.x = next.x;
        p.y = next.y;
        budget -= dist;
        this.path.shift();
      } else {
        p.x += (dx / dist) * budget;
        p.y += (dy / dist) * budget;
        budget = 0;
      }
    }

    if (this.path.length === 0) {
      this.stop();
      events.push(...this.arrival(tileOf(p.x, p.y)));
    }
    return events;
  }

  /**
   * Each neighbour walks to where the clock says they should be. One she's talking to, or walking
   * up to, waits for her; one she's standing near turns to look at her.
   */
  private stepNeighbours(deltaMs: number): void {
    const now = this.clock.now();
    const hour = hourOf(now);
    const day = dayKey(now);
    const heading = this.visiting && 'villager' in this.visiting ? this.visiting.villager : null;
    const outside = this.where === 'town';
    const me = tileOf(this.player.x, this.player.y);
    for (const n of this.neighbours) {
      const held = n.id === this.talking || n.id === heading;
      n.step(deltaMs, stopOf(n.id, hour, day), this.ground, held);
      const t = n.tile;
      const near = Math.max(Math.abs(t.tx - me.tx), Math.abs(t.ty - me.ty)) <= 2;
      if (outside && (held || near)) n.face(this.player.x, this.player.y);
    }
  }

  /**
   * She has arrived, and anything there that gives something is gathered: the tree or rock she
   * walked up to, the flowers she walked onto, or the night's snack where it waits.
   */
  private arrival(here: Tile): WorldEvent[] {
    const events = this.arriveAt(here);
    const bone = this.lostBone();
    if (
      events.length > 0 &&
      bone?.scene === this.where &&
      bone.tx === here.tx &&
      bone.ty === here.ty
    ) {
      events.push(this.gather(BONE_KEY, 'bone', { item: 'fibisBone', count: 1 }));
    }
    return events;
  }

  private arriveAt(here: Tile): WorldEvent[] {
    const arrived: WorldEvent = { kind: 'arrived', tx: here.tx, ty: here.ty };
    const events: WorldEvent[] = [arrived];
    const visit = this.visiting;
    this.visiting = undefined;
    if (visit && 'bed' in visit) return [arrived, this.tend(visit.bed)];
    if (visit && 'pet' in visit) {
      const pet = this.pet(visit.pet);
      if (pet.scene === this.where && reach(here, pet.tile) <= 1) {
        arrived.pet = pet.id;
        this.petting = pet.id;
        if (reach(here, pet.tile) > 0) {
          this.player.facing = facingFor(pet.x - this.player.x, pet.y - this.player.y);
        }
        pet.face(this.player.x);
      }
      return events;
    }
    if (visit && 'critter' in visit) {
      // Gone by the time she got there, if the hour turned on the way.
      const critter = this.critters().find((c) => c.key === visit.critter);
      if (!critter || reach(here, critter) > 1) return events;
      const at = tileCentre(critter);
      if (reach(here, critter) > 0) {
        this.player.facing = facingFor(at.x - this.player.x, at.y - this.player.y);
      }
      events.push(this.swing(critter));
      return events;
    }
    if (visit && 'villager' in visit) {
      const n = this.neighbour(visit.villager);
      const t = n.tile;
      if (Math.max(Math.abs(t.tx - here.tx), Math.abs(t.ty - here.ty)) <= 1) {
        arrived.villager = n.id;
        this.talking = n.id;
        this.player.facing = facingFor(n.x - this.player.x, n.y - this.player.y);
        n.face(this.player.x, this.player.y);
        return events;
      }
      // They'd moved on by the time she got there: after them, a few times, then let them go.
      if (visit.tries + 1 < FOLLOW_TRIES && this.follow(n, visit.tries + 1)) return [];
      return events;
    }
    if (visit && 'piece' in visit) {
      arrived.piece = visit.piece.id;
      const says = FURNITURE[visit.piece.id].says;
      if (says) {
        const years = yearsMarried(dayKey(this.clock.now()));
        arrived.says = fill(says, { name: this.name, years });
      }
      if (visit.piece.id === 'recordPlayer') events.push(this.playRecord());
      return events;
    }
    if (this.where === 'home') {
      if (visit?.prop) arrived.at = visit.prop.id;
      else if (here.tx === this.home.room.mat.tx && here.ty === this.home.room.mat.ty) {
        events.push(this.goOut());
      }
      return events;
    }

    const prop = visit?.prop;
    if (prop?.id === 'homeHouse') {
      arrived.at = prop.id;
      events.push(this.goIn());
      return events;
    }
    if (prop) {
      arrived.at = prop.id;
      const give = PROP_YIELDS[prop.id];
      if (give) events.push(this.gather(propKey(prop), prop.id, give));
    }
    const patch = this.map.patches.find((p) => p.tx === here.tx && p.ty === here.ty);
    if (patch && !prop) {
      events.push(this.gather(patchKey(patch), 'flowers', PATCHES[patch.id]));
    }
    const snack = this.snack();
    if (snack && snack.tx === here.tx && snack.ty === here.ty && !prop) {
      events.push(this.gather(SNACK_KEY, 'snack', { item: snack.item, count: 1 }));
    }
    return events;
  }

  /**
   * Something rare (a blue rose) or found as well (a bead) is read from where and which day, so
   * it's fixed all day.
   */
  private gather(key: string, from: GatherSource, give: Yield): WorldEvent {
    if (!this.isReady(key)) return { kind: 'resting', from, item: give.item };
    const today = dayKey(this.clock.now());
    const { item, count } = yieldOf(give, `${key}@${today}`);
    this.taken[key] = today;
    this.bag.add(item, count);
    const gathered: WorldEvent = { kind: 'gathered', from, item, count };
    const bead = bonusOf(give, `${key}@${today}`);
    if (bead) {
      this.bag.add(bead, 1);
      gathered.bead = bead;
    }
    this.events.emit('bag', this.bag.contents);
    return gathered;
  }

  /**
   * She has walked up to a garden bed: she tills it if it's wild, picks what's ripe (and keeps a
   * seed back to plant again), or waters what's growing, once a day. An empty bed waits for her to
   * choose a seed, which the HUD asks her and hands to `plant`.
   */
  private tend(bed: Tile): WorldEvent {
    const now = this.clock.now();
    const { tx, ty } = bed;
    if (!this.farm.isTilled(bed)) {
      this.farm.till(bed);
      return { kind: 'tilled', tx, ty };
    }
    const planting = this.farm.planting(bed);
    if (!planting) return { kind: 'bare', tx, ty };
    const { crop } = planting;
    const row = CROPS[crop];
    if (stageOf(planting, now) === 'ripe') {
      const { item, count } = yieldOf(row.harvest, plantingSeed(bedKey(bed), planting));
      this.bag.add(item, count);
      this.bag.add(row.seed, 1);
      this.farm.set(bed, null);
      this.events.emit('bag', this.bag.contents);
      return { kind: 'harvested', crop, item, count, seed: row.seed };
    }
    if (canWater(planting, now)) {
      const watered = water(planting, now);
      this.farm.set(bed, watered);
      return { kind: 'watered', crop, days: daysToRipe(watered, now) };
    }
    return { kind: 'growing', crop, days: daysToRipe(planting, now) };
  }

  /**
   * Plants a seed from her bag in a tilled, empty bed. Null, and nothing taken, if the bed isn't
   * ready for one or she has none of that seed.
   */
  plant(tx: number, ty: number, seed: ItemId): WorldEvent | null {
    const bed = { tx, ty };
    const crop = cropFromSeed(seed);
    if (!crop || !this.farm.isTilled(bed) || this.farm.planting(bed)) return null;
    if (!this.bag.remove(seed)) return null;
    this.farm.set(bed, { crop, plantedAt: this.clock.now(), waterings: 0, lastWatered: null });
    this.events.emit('bag', this.bag.contents);
    return { kind: 'planted', crop, tx, ty };
  }

  /** In through her front door, onto the mat, facing into the room. */
  private goIn(): WorldEvent {
    this.where = 'home';
    this.standAt(this.home.room.mat, 'up');
    this.bringWalker();
    this.events.emit('scene', 'home');
    return { kind: 'entered', scene: 'home' };
  }

  /** Out of her front door, onto the step in front of it. */
  private goOut(): WorldEvent {
    this.stopDecorating();
    this.where = 'town';
    this.standAt(this.map.spawn, 'down');
    this.bringWalker();
    this.events.emit('scene', 'town');
    return { kind: 'entered', scene: 'town' };
  }

  private standAt(tile: Tile, facing: Facing): void {
    Object.assign(this.player, tileCentre(tile), { facing });
    this.path = [];
    this.stop();
  }

  /** The next of her records, round and round her collection. */
  private playRecord(): WorldEvent {
    const records = this.bag.contents.filter((s) => ITEMS[s.id].kind === 'record');
    const record = records[this.plays % Math.max(1, records.length)]?.id ?? null;
    if (record) this.plays += 1;
    return { kind: 'played', record };
  }

  /** Where she's decorating, and what she has picked up; null when she isn't. */
  get decorating(): Decorating | null {
    return this.decor;
  }

  /** Starts decorating her home: she stops where she is, and taps pick up and put down pieces. */
  startDecorating(selected: Placed | null = null): boolean {
    if (this.where !== 'home') return false;
    this.path = [];
    this.visiting = undefined;
    this.arrivedInPlace = null;
    this.stop();
    this.decor = { selected };
    this.events.emit('decorating', this.decor);
    return true;
  }

  stopDecorating(): void {
    if (!this.decor) return;
    this.decor = null;
    this.events.emit('decorating', null);
  }

  /**
   * A tap while decorating. A tap on a piece picks it up, and a tap on it again puts it down; with
   * a piece picked up, a tap on somewhere else it could go moves it there.
   */
  private decorTap(tx: number, ty: number): boolean {
    const decor = this.decor!;
    const selected = decor.selected;
    const there = this.home.pieceAt(tx, ty);
    if (selected && there === selected) {
      this.select(null);
      return true;
    }
    // A floor piece can be put down on a rug, and a rug slid under nothing.
    const onto =
      there &&
      selected &&
      FURNITURE[there.id].layer === 'rug' &&
      FURNITURE[selected.id].layer === 'floor';
    if (there && !onto) {
      this.select(there);
      return true;
    }
    if (!selected) return false;
    const why = this.home.move(selected, tx, ty, this.standing());
    if (why) this.pending.push({ kind: 'refused', why });
    else this.events.emit('home', this.home);
    return why === null;
  }

  private select(piece: Placed | null): void {
    this.decor = { selected: piece };
    this.events.emit('decorating', this.decor);
  }

  private standing(): Tile {
    return tileOf(this.player.x, this.player.y);
  }

  /** Turns the piece she has picked up. */
  turnSelected(): boolean {
    const piece = this.decor?.selected;
    if (!piece) return false;
    const why = this.home.turn(piece, this.standing());
    if (why) this.pending.push({ kind: 'refused', why });
    else this.events.emit('home', this.home);
    return why === null;
  }

  /** Puts the piece she has picked up back in the chest. */
  putAwaySelected(): boolean {
    const piece = this.decor?.selected;
    if (!piece) return false;
    this.home.putAway(piece);
    this.select(null);
    this.events.emit('home', this.home);
    return true;
  }

  /**
   * Takes a piece out of the storage chest and sets it down near her, picked up so the next tap
   * moves it. Starts decorating if she wasn't.
   */
  takeOut(id: FurnitureId): boolean {
    if (this.where !== 'home') return false;
    const here = this.standing();
    const piece = this.home.takeOut(id, here, here);
    if (!piece) {
      this.pending.push({ kind: 'refused', why: 'noRoom' });
      return false;
    }
    this.events.emit('home', this.home);
    if (this.decor) this.select(piece);
    else this.startDecorating(piece);
    return true;
  }

  private propAt(tx: number, ty: number): PlacedProp | undefined {
    if (this.where === 'home') {
      return tx === CHEST.tx && ty === CHEST.ty ? CHEST_PROP : undefined;
    }
    const popUp = this.popUp();
    if (covers(popUp, tx, ty)) return popUp!;
    const cart = this.moonPieCart();
    if (covers(cart, tx, ty)) return cart!;
    return this.map.props.find((p) => covers(p, tx, ty));
  }

  private stop(): void {
    this.player.moving = false;
    this.player.walkMs = 0;
    this.target = null;
  }

  /** The footprint of the piece of furniture at a tile at home, as a box. */
  private pieceBox(tx: number, ty: number): PlacedProp | undefined {
    const piece = this.where === 'home' ? this.home.pieceAt(tx, ty) : undefined;
    if (!piece) return undefined;
    return { id: 'storageChest', tx: piece.tx, ty: piece.ty, ...footprint(piece.id, piece.turn) };
  }

  private openTilesBeside(tx: number, ty: number): Tile[] {
    const box = this.propAt(tx, ty) ?? this.pieceBox(tx, ty) ?? { tx, ty, w: 1, h: 1 };
    // Something on the wall is looked at from the floor just below it.
    const wallRows = this.home.room.wallRows;
    if (this.where === 'home' && box.ty < wallRows) {
      const open: Tile[] = [];
      for (let x = box.tx - 1; x <= box.tx + box.w; x++) {
        if (this.canWalk(x, wallRows)) open.push({ tx: x, ty: wallRows });
      }
      return open;
    }
    const open: Tile[] = [];
    for (let y = box.ty - 1; y <= box.ty + box.h; y++) {
      for (let x = box.tx - 1; x <= box.tx + box.w; x++) {
        const inside = x >= box.tx && x < box.tx + box.w && y >= box.ty && y < box.ty + box.h;
        if (!inside && this.canWalk(x, y)) open.push({ tx: x, ty: y });
      }
    }
    return open;
  }
}

const FACING_STEP: Record<Facing, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

/** How many steps apart two tiles are, diagonals counting one. */
function reach(a: Tile, b: Tile): number {
  return Math.max(Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty));
}

function covers(p: PlacedProp | null, tx: number, ty: number): boolean {
  return p !== null && tx >= p.tx && tx < p.tx + p.w && ty >= p.ty && ty < p.ty + p.h;
}
