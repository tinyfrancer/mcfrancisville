import { TOWN, type MapSource } from '../data/maps';
import type { SavedPlayer } from '../persistence/SaveState';
import { FURNITURE } from '../data/furniture';
import type { HomeSnapshot, Placed } from '../data/home';
import { ITEMS } from '../data/items';
import { PET_IDS, type PetsSnapshot } from '../data/pets';
import { dayKey, systemClock, type Clock } from '../systems/clock';
import { BONE_KEY, boneLine, lostBone, patLine, type LostBone } from '../systems/pets';
import { hashString } from '../systems/gathering';
import { parseMap, type PlacedProp, type TileMap } from '../systems/grid';
import type { Tile } from '../systems/pathfinding';
import { footprint } from '../systems/decor';
import { fill, yearsMarried } from '../systems/friendship';
import { lurksOf } from '../systems/mystery';
import { Casebook, type MysterySnapshot } from './Casebook';
import type {
  AccessoryId,
  Facing,
  FurnitureId,
  ItemId,
  PetId,
  ZoneId,
  VillagerId,
} from '../types/ids';
import { Bag, type Stack } from './Bag';
import { EventBus } from './eventBus';
import { Farm, type SavedBed } from './Farm';
import { Cabinet, type CabinetSnapshot } from './Cabinet';
import { Friends, type FriendsSnapshot } from './Friends';
import { Letters, type MailEntry } from './Letters';
import { Home } from './Home';
import { nearestOpen, Pet } from './Pet';
import { Pets } from './Pets';
import { facingFor, Neighbour, type Ground } from './Neighbour';
import { Wardrobe, type ClosetSnapshot } from './Wardrobe';
import { Movement, reach, tileCentre, tileOf, type Player } from './Movement';
import { HomeZone } from './zones/HomeZone';
import { TownZone } from './zones/TownZone';
import type { Zone } from './zones/Zone';
import { Belongings } from './services/Belongings';
import { Garden } from './services/Garden';
import { Gathering } from './services/Gathering';
import { Collecting } from './services/Collecting';
import { Mailbox } from './services/Mailbox';
import { Neighbourhood } from './services/Neighbourhood';
import { Mystery } from './services/Mystery';
import { Shops } from './services/Shops';
import { Stalls } from './zones/Stalls';
import { Takings } from './services/Takings';
import { Workbench } from './services/Workbench';
import { worldContext, type WorldContext } from './context';
import { Wallet } from './services/Wallet';
import type { Critter, Decorating, WorldEvent, WorldState as TownState } from './events';

export { tileCentre, tileOf, WALK_SPEED, type Player } from './Movement';

/** The record she dances to, and about how long it plays (personal_touches.md, "The shop"). */
export const DANCE_RECORD: ItemId = 'recordWalkTheTomb';
export const DANCE_MS = 26_500;

export { NET_MS } from './services/Collecting';

export type {
  Chat,
  Critter,
  Decorating,
  GatherSource,
  GiftResult,
  MailView,
  WorldEvent,
  WorldState as TownState,
} from './events';

/** What of her finds is saved: the bag, and what she has taken today. */
export interface FindsSnapshot {
  bag: Stack[];
  taken: Record<string, string>;
}

export interface TownOptions {
  map?: MapSource;
  /** Where she was when the game was last saved. */
  player?: SavedPlayer;
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
  friends?: Partial<FriendsSnapshot & { mail: MailEntry[] }>;
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

/**
 * The town and everyone in it, with no idea it is being drawn (decisions.md 9). The view reads it
 * once a frame and calls `tapTile`; nothing else reaches in.
 */
export class Town {
  readonly map: TileMap;
  /** Her walking: where she is, the way she faces, and her path. */
  readonly movement: Movement;
  /** The places she can be (decisions.md 78). */
  readonly townZone: TownZone;
  readonly homeZone: HomeZone;
  readonly wardrobe: Wardrobe;
  /** The phone's clock, or a test's (decisions.md 4). */
  readonly clock: Clock;
  readonly bag: Bag;
  readonly farm: Farm;
  readonly home: Home;
  readonly friends: Friends;
  readonly letters: Letters;
  readonly cabinet: Cabinet;
  /** Her pets' names, what they wear, and which is walking with her. */
  readonly pets: Pets;
  /** The clues on her corkboard. */
  readonly casebook: Casebook;
  /** Her mailbox: letters posted, read and opened. */
  readonly mailbox: Mailbox;
  /** The mayor's mystery: the clues and Wes. */
  readonly mystery: Mystery;
  /** Her net, the critters out this hour, and giving them to the museum. */
  readonly collecting: Collecting;
  /** Her neighbours: their walks, talking, gifts, favours and friendships. */
  readonly neighbourhood: Neighbourhood;
  /** Her pets themselves, wherever each one is: at home, or out with her. */
  readonly petList: readonly Pet[];
  /** What every service shares: the clock, the state bus, signals and waiting moments. */
  readonly ctx: WorldContext;
  readonly events: EventBus<TownState>;
  /** Her recipes, and making things at her workbench. */
  readonly workbench: Workbench;
  /** Where something bought or given goes. */
  readonly belongings: Belongings;
  /** What stands in town only on some days: the pop-up and the Moon Pie cart. */
  readonly stalls: Stalls;
  /** Her beds at Hosta La Vista Farm: tending and planting. */
  readonly garden: Garden;
  /** The shops' stock, and buying and selling. */
  readonly shops: Shops;
  /** What she picks up by arriving: trees, rocks, flowers, the night's snack and Fibi's bone. */
  readonly gathering: Gathering;
  /** Out in town or at home. The player's position is in whichever one this is. */
  private where: ZoneId = 'town';
  private decor: Decorating | null = null;
  /** How many records she has put on this visit, so the player works through her collection. */
  private plays = 0;
  /** Her Candy. */
  readonly wallet: Wallet;
  /** What she has taken today, by key; see `systems/gathering.ts`. */
  readonly takings: Takings;
  /** Today's pop-up, worked out at most once a minute: pathfinding asks for it on every step. */
  /** The pet whose sheet is open, who waits while it is. */
  private petting: PetId | null = null;
  /** How many times she has petted each, so they do something different each time. */
  private pats = new Map<PetId, number>();
  /** How long she has been standing still, which the pets notice. */
  private stillMs = 0;
  /** When the dance ends, and where Cody, come over from next door, dances beside her. */
  private danceUntil = 0;
  private danceCody: Tile | null = null;
  /** Where she is headed, for the view's sparkle. Null once she arrives. */
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
    this.ctx = worldContext(this.clock);
    this.events = this.ctx.events;
    this.wardrobe = new Wardrobe(options.closet);
    this.bag = new Bag(options.finds?.bag);
    this.takings = new Takings(this.clock, options.finds?.taken);
    this.farm = new Farm(this.map.beds, options.beds);
    this.home = new Home(options.home);
    this.friends = new Friends(options.friends);
    this.letters = new Letters(options.friends?.mail);
    this.cabinet = new Cabinet(options.cabinet);
    this.pets = new Pets(options.pets);
    this.casebook = new Casebook(options.mystery);
    this.workbench = new Workbench(this.ctx, this.bag, this.home, options.recipes);
    this.belongings = new Belongings(this.events, {
      bag: this.bag,
      wardrobe: this.wardrobe,
      home: this.home,
      workbench: this.workbench,
      pets: this.pets,
    });
    this.wallet = new Wallet(this.events, options.candy);
    this.stalls = new Stalls(this.clock, this.map);
    this.townZone = new TownZone(this.map, this.stalls);
    this.homeZone = new HomeZone(this.home);
    this.garden = new Garden(this.ctx, this.bag, this.farm);
    this.gathering = new Gathering(this.ctx, this.bag, this.takings, this.map);
    this.shops = new Shops(this.ctx, this.wallet, this.bag, this.belongings, this.stalls);
    const source = options.map ?? TOWN;
    this.mailbox = new Mailbox(this.ctx, this.letters, this.belongings, this.wardrobe);
    this.neighbourhood = new Neighbourhood(
      this.ctx,
      {
        friends: this.friends,
        bag: this.bag,
        wallet: this.wallet,
        mailbox: this.mailbox,
        wardrobe: this.wardrobe,
      },
      this.townZone,
      source.neighbours === true,
      () => this.where === 'town',
    );
    this.collecting = new Collecting(
      this.ctx,
      { bag: this.bag, takings: this.takings, cabinet: this.cabinet, mailbox: this.mailbox },
      this.townZone,
      source.neighbours === true,
      () => this.where === 'town',
    );
    const lurks = source.neighbours ? lurksOf(this.map, (tx, ty) => this.townWalk(tx, ty)) : [];
    this.mystery = new Mystery(
      this.ctx,
      this.casebook,
      {
        mailbox: this.mailbox,
        friends: this.friends,
        cabinet: this.cabinet,
        wardrobe: this.wardrobe,
        outside: () => this.where === 'town',
      },
      lurks,
    );
    if (saved?.zone === 'home') this.where = 'home';
    const inside = this.where === 'home';
    const fallback = inside ? this.home.room.mat : this.map.spawn;
    const startTile = saved && this.canWalk(saved.tx, saved.ty) ? saved : fallback;
    const facing = saved?.facing ?? 'down';
    this.movement = new Movement(startTile, facing);
    const roam = this.roamTiles();
    this.petList = PET_IDS.map(
      (id) => new Pet(id, roam[hashString(`pet:${id}`) % roam.length] ?? this.home.room.mat),
    );
    this.bringWalker();
  }

  /** What of her is worth saving: the tile she is on and the way she faces. */
  snapshot(): SavedPlayer {
    const { tx, ty } = tileOf(this.player.x, this.player.y);
    return { tx, ty, facing: this.player.facing, zone: this.where };
  }

  /** Her home, for saving. */
  homeSnapshot(): { home: HomeSnapshot } {
    return { home: this.home.snapshot() };
  }

  get scene(): ZoneId {
    return this.where;
  }

  /** The size of where she is, in tiles. */
  get size(): { width: number; height: number } {
    return { width: this.zone.width, height: this.zone.height };
  }

  /** Her bag, and today's takings; yesterday's are dropped, since they no longer mean anything. */
  finds(): FindsSnapshot {
    return { bag: this.bag.snapshot(), ...this.takings.snapshot() };
  }

  /** Her friendships and mail, for saving. */
  friendsSnapshot(): FriendsSnapshot & { mail: MailEntry[] } {
    return { ...this.friends.snapshot(), ...this.letters.snapshot() };
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
    if (!this.takings.isReady(BONE_KEY)) return null;
    return lostBone(dayKey(this.clock.now()), this.townBoneSpots(), this.homeBoneSpots());
  }

  /** Somewhere odd in town: beside a tree, a pumpkin or a gravestone. */
  private townBoneSpots(): Tile[] {
    const { trees, pumpkins, graves } = this.collecting.habitats;
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
      villagers: this.where === 'town' ? this.neighbourhood.neighbours.map((n) => n.tile) : [],
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
   * Open ground, and not where the pop-up shop or the Moon Pie Man's cart happens to be standing
   * today; or open floor at home.
   */
  /** The zone she's in now. */
  get zone(): Zone {
    return this.where === 'home' ? this.homeZone : this.townZone;
  }

  /** Where she is, and which way she faces, for the view to draw. */
  get player(): Player {
    return this.movement.player;
  }

  /** Where she is headed, for the view's sparkle. Null once she arrives. */
  get target(): Tile | null {
    return this.movement.target;
  }

  canWalk = (tx: number, ty: number): boolean => this.zone.canWalk(tx, ty);

  private townWalk = (tx: number, ty: number): boolean => this.townZone.canWalk(tx, ty);

  /**
   * Walk to a tapped tile. A tap on something solid (a tree, a house, a garden bed) walks to the
   * open tile beside it that is quickest to reach, and she uses it when she gets there. Returns
   * false when there is nowhere to go.
   */
  tapTile(tx: number, ty: number): boolean {
    if (this.decor) return this.decorTap(tx, ty);
    this.danceUntil = 0;
    this.neighbourhood.endTalk();
    this.petting = null;
    const neighbour = this.neighbourhood.villagerAt(tx, ty);
    if (neighbour) return this.follow(neighbour, 0);
    // She sets off after Wes; he'll be gone by the time she's near.
    const wes = this.mystery.wesAt(tx, ty);
    if (wes) return this.walkTo([wes], undefined);
    const critter = this.collecting.critterAt(tx, ty);
    if (critter) return this.stalk(critter);
    const pet = this.petAt(tx, ty);
    if (pet) return this.approach(pet);
    const prop = this.zone.propAt(tx, ty);
    const piece = this.where === 'home' ? this.home.pieceAt(tx, ty) : undefined;
    const goals = this.canWalk(tx, ty) ? [{ tx, ty }] : this.zone.standBeside(tx, ty);
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
    if (!this.movement.walkTo(goals, this.zone)) return false;
    this.visiting = visit;
    this.arrivedInPlace = this.movement.walking ? null : this.movement.tile;
    return true;
  }

  update(deltaMs: number): WorldEvent[] {
    this.mystery.check();
    this.mailbox.checkSpecialDay();
    this.mystery.step(
      this.movement.tile,
      this.neighbourhood.neighbours.map((n) => n.tile),
    );
    const heading = this.visiting && 'villager' in this.visiting ? this.visiting.villager : null;
    this.neighbourhood.step(deltaMs, this.player, heading);
    this.stepPets(deltaMs);
    const events = this.ctx.moments.drain();
    if (this.arrivedInPlace) {
      events.push(...this.arrival(this.arrivedInPlace));
      this.arrivedInPlace = null;
    }
    const arrivedAt = this.movement.step(deltaMs);
    if (arrivedAt) events.push(...this.arrival(arrivedAt));
    return events;
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
      events.push(this.gathering.gather(BONE_KEY, 'bone', { item: 'fibisBone', count: 1 }));
    }
    return events;
  }

  private arriveAt(here: Tile): WorldEvent[] {
    const arrived: WorldEvent = { kind: 'arrived', tx: here.tx, ty: here.ty };
    const events: WorldEvent[] = [arrived];
    const visit = this.visiting;
    this.visiting = undefined;
    if (visit && 'bed' in visit) return [arrived, this.garden.tend(visit.bed)];
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
      const critter = this.collecting.find(visit.critter);
      if (!critter || reach(here, critter) > 1) return events;
      const at = tileCentre(critter);
      if (reach(here, critter) > 0) {
        this.player.facing = facingFor(at.x - this.player.x, at.y - this.player.y);
      }
      events.push(this.collecting.swing(critter));
      return events;
    }
    if (visit && 'villager' in visit) {
      const n = this.neighbourhood.neighbour(visit.villager);
      const t = n.tile;
      if (Math.max(Math.abs(t.tx - here.tx), Math.abs(t.ty - here.ty)) <= 1) {
        arrived.villager = n.id;
        this.neighbourhood.startTalk(n.id);
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
    if (prop) arrived.at = prop.id;
    events.push(...this.gathering.arriveAt(here, prop));
    return events;
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
    this.danceUntil = 0;
    this.where = 'town';
    this.standAt(this.map.spawn, 'down');
    this.bringWalker();
    this.events.emit('scene', 'town');
    return { kind: 'entered', scene: 'town' };
  }

  private standAt(tile: Tile, facing: Facing): void {
    this.movement.standAt(tile, facing);
  }

  /**
   * The next of her records, round and round her collection. The one they danced to the night
   * they met gets her dancing, and Cody comes over from next door to dance with her.
   */
  private playRecord(): WorldEvent {
    const records = this.bag.contents.filter((s) => ITEMS[s.id].kind === 'record');
    const record = records[this.plays % Math.max(1, records.length)]?.id ?? null;
    if (record) this.plays += 1;
    this.danceUntil = 0;
    if (record !== DANCE_RECORD) return { kind: 'played', record };
    const here = this.standing();
    const beside = [-1, 1, -2, 2].map((dx) => ({ tx: here.tx + dx, ty: here.ty }));
    this.danceCody = beside.find((t) => this.canWalk(t.tx, t.ty)) ?? null;
    this.danceUntil = this.clock.now() + DANCE_MS;
    return { kind: 'played', record, dance: true };
  }

  /** Whether she's dancing, and where Cody is dancing with her, if there was room. */
  dance(): { cody: Tile | null } | null {
    if (this.where !== 'home' || this.clock.now() >= this.danceUntil) return null;
    return { cody: this.danceCody };
  }

  /** Where she's decorating, and what she has picked up; null when she isn't. */
  get decorating(): Decorating | null {
    return this.decor;
  }

  /** Starts decorating her home: she stops where she is, and taps pick up and put down pieces. */
  startDecorating(selected: Placed | null = null): boolean {
    if (this.where !== 'home') return false;
    this.movement.halt();
    this.visiting = undefined;
    this.arrivedInPlace = null;
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
    if (why) this.ctx.moments.push({ kind: 'refused', why });
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
    if (why) this.ctx.moments.push({ kind: 'refused', why });
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
      this.ctx.moments.push({ kind: 'refused', why: 'noRoom' });
      return false;
    }
    this.events.emit('home', this.home);
    if (this.decor) this.select(piece);
    else this.startDecorating(piece);
    return true;
  }
}

const FACING_STEP: Record<Facing, readonly [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};
