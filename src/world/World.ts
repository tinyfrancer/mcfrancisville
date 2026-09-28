import { TOWN, type MapSource } from '../data/maps';
import { ZONE_IDS, ZONES } from '../data/zones';
import type { SavedPlayer, SaveState } from '../persistence/SaveState';
import { FURNITURE } from '../data/furniture';
import type { HomeSnapshot, Placed } from '../data/home';
import type { PetsSnapshot } from '../data/pets';
import { dayKey, systemClock, type Clock } from '../systems/clock';
import { BONE_KEY } from '../systems/pets';
import { parseMap, type PlacedProp, type TileMap } from '../systems/grid';
import type { Tile } from '../systems/pathfinding';
import { fill, yearsMarried } from '../systems/friendship';
import { lurksOf } from '../systems/mystery';
import { Casebook, type MysterySnapshot } from './Casebook';
import type { MapZoneId, PetId, ZoneId, VillagerId } from '../types/ids';
import { Bag, type Stack } from './Bag';
import { EventBus } from './eventBus';
import { Farm, type SavedBed } from './Farm';
import { Cabinet, type CabinetSnapshot } from './Cabinet';
import { Friends, type FriendsSnapshot } from './Friends';
import { Letters, type MailEntry } from './Letters';
import { Home } from './Home';
import type { Pet } from './Pet';
import { Pets } from './Pets';
import { facingFor, type Neighbour } from './Neighbour';
import { Wardrobe, type ClosetSnapshot } from './Wardrobe';
import { Movement, reach, tileCentre, tileOf, type Player } from './Movement';
import { Atlas, type AtlasSnapshot } from './Atlas';
import { Porch, type PorchSnapshot } from './Porch';
import { HomeZone } from './zones/HomeZone';
import { MapZone } from './zones/MapZone';
import type { Zone } from './zones/Zone';
import { Zones } from './zones/Zones';
import { Travel } from './services/Travel';
import { Belongings } from './services/Belongings';
import { Garden } from './services/Garden';
import { Gathering } from './services/Gathering';
import { Collecting } from './services/Collecting';
import { Decorator } from './services/Decorator';
import { Mailbox } from './services/Mailbox';
import { RecordPlayer } from './services/RecordPlayer';
import { PetCare } from './services/PetCare';
import { Neighbourhood } from './services/Neighbourhood';
import { Mystery } from './services/Mystery';
import { Poses } from './services/Poses';
import { Shops } from './services/Shops';
import { Stalls } from './zones/Stalls';
import { Takings } from './services/Takings';
import { Workbench } from './services/Workbench';
import { worldContext, type WorldContext } from './context';
import { Wallet } from './services/Wallet';
import type { Critter, WorldEvent, WorldState } from './events';

export { tileCentre, tileOf, WALK_SPEED, type Player } from './Movement';

export { DANCE_MS, DANCE_RECORD } from './services/RecordPlayer';

export { NET_MS } from './services/Collecting';

export type {
  Chat,
  Critter,
  Decorating,
  GatherSource,
  GiftResult,
  MailView,
  WorldEvent,
  WorldState,
} from './events';

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
  /** The places she has found, and those opened to her. */
  atlas?: Partial<AtlasSnapshot>;
  /** What's growing in the pots by her door. */
  porch?: Partial<PorchSnapshot>;
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
    candy: save.candy,
    home: save.home,
    recipes: save.recipes,
    friends: save,
    cabinet: save.cabinet,
    pets: save.pets,
    mystery: save.mystery,
    atlas: save.atlas,
    porch: save.porch,
  };
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
export class World {
  readonly map: TileMap;
  /** Her walking: where she is, the way she faces, and her path. */
  readonly movement: Movement;
  /** The places she can be (decisions.md 78, 90). */
  readonly zones: Zones;
  readonly townZone: MapZone;
  readonly homeZone: HomeZone;
  /** The places she has found, and those opened to her. */
  readonly atlas: Atlas;
  /** The pots by her door, and what's in them. */
  readonly porch: Porch;
  /** Where she is, and going from place to place. */
  readonly travel: Travel;
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
  /** Their pets: the one out with her, those at home, and Fibi's bones. */
  readonly petCare: PetCare;
  /** What every service shares: the clock, the state bus, signals and waiting moments. */
  readonly ctx: WorldContext;
  readonly events: EventBus<WorldState>;
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
  /** Decorating her home: picking up, moving, turning and putting away pieces. */
  readonly decorating: Decorator;
  /** Her record player, and the dance. */
  readonly recordPlayer: RecordPlayer;
  /** Her Candy. */
  readonly wallet: Wallet;
  /** How she stands: her phone or her arms crossed while she waits, and rocking out. */
  readonly poses: Poses;
  /** What she has taken today, by key; see `systems/gathering.ts`. */
  readonly takings: Takings;
  /** The prop or bed she is walking to, used on arrival. */
  private visiting: Visit | undefined;
  /** An arrival with no walk, made by the next `update` so every arrival comes from one place. */
  private arrivedInPlace: Tile | null = null;

  /**
   * `saved` puts her back where she was. If that tile has stopped being somewhere she can stand (a
   * later map put a tree on it), she starts at her door instead of inside the tree.
   */
  constructor(options: WorldOptions = {}) {
    const saved = options.player;
    this.map = parseMap(options.map ?? TOWN);
    this.clock = options.clock ?? systemClock;
    this.ctx = worldContext(this.clock);
    this.events = this.ctx.events;
    this.wardrobe = new Wardrobe(options.closet);
    this.bag = new Bag(options.finds?.bag);
    this.takings = new Takings(this.clock, options.finds?.taken);
    this.farm = new Farm(this.map.beds, options.beds, options.harvested);
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
    this.townZone = new MapZone('town', this.map, this.stalls);
    this.homeZone = new HomeZone(this.home);
    const beyond = ZONE_IDS.filter((id): id is MapZoneId => id !== 'town' && id !== 'home');
    this.zones = new Zones(this.homeZone, [
      this.townZone,
      ...beyond.map((id) => new MapZone(id, parseMap(ZONES[id].map!))),
    ]);
    this.atlas = new Atlas(options.atlas);
    this.porch = new Porch(options.porch);
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
      this.zones,
      source.neighbours === true,
      () => this.scene,
    );
    this.collecting = new Collecting(
      this.ctx,
      { bag: this.bag, takings: this.takings, cabinet: this.cabinet, mailbox: this.mailbox },
      this.townZone,
      source.neighbours === true,
      () => this.scene === 'town',
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
        outside: () => this.scene === 'town',
      },
      lurks,
    );
    // A place a later build added, that this one doesn't know, puts her back at her door.
    const known = saved && (ZONE_IDS as string[]).includes(saved.zone);
    const start: ZoneId = known ? saved.zone : 'town';
    const zone = this.zones.get(start);
    const startTile = known && zone.canWalk(saved.tx, saved.ty) ? saved : zone.entry(null).tile;
    const facing = saved?.facing ?? 'down';
    this.movement = new Movement(startTile, facing);
    this.travel = new Travel(
      this.ctx,
      {
        zones: this.zones,
        atlas: this.atlas,
        movement: this.movement,
        mailbox: this.mailbox,
        facts: {
          has: (item) => this.bag.count(item) > 0,
          hearts: (villager) => this.friends.hearts(villager),
          found: (z) => this.atlas.hasFound(z),
          caughtKinds: () => this.cabinet.found,
        },
      },
      start,
    );
    // Whatever she was on her way to do is left behind, wherever she went.
    this.ctx.signals.on('crossed', () => {
      this.visiting = undefined;
      this.arrivedInPlace = null;
    });
    this.recordPlayer = new RecordPlayer(this.ctx, this.bag);
    this.decorating = new Decorator(this.ctx, this.home, {
      standing: () => this.movement.tile,
      atHome: () => this.scene === 'home',
      settle: () => {
        this.movement.halt();
        this.visiting = undefined;
        this.arrivedInPlace = null;
      },
    });
    this.poses = new Poses(this.ctx, {
      moving: () => this.movement.player.moving,
      busy: () =>
        this.neighbourhood.talkingTo !== null ||
        this.petCare.pettingNow !== null ||
        this.decorating.state !== null ||
        this.recordPlayer.dance() !== null,
    });
    this.petCare = new PetCare(this.ctx, {
      pets: this.pets,
      bag: this.bag,
      takings: this.takings,
      movement: this.movement,
      homeZone: this.homeZone,
      townZone: this.townZone,
      habitats: this.collecting.habitats,
      where: () => this.scene,
      zone: () => this.zone,
    });
  }

  /** Everything to save, from each part that keeps something. */
  save(): WorldSave {
    return {
      player: this.snapshot(),
      ...this.wardrobe.snapshot(),
      ...this.finds(),
      ...this.garden.snapshot(),
      ...this.wallet.snapshot(),
      ...this.homeSnapshot(),
      ...this.workbench.snapshot(),
      ...this.friendsSnapshot(),
      ...this.cabinetSnapshot(),
      ...this.petsSnapshot(),
      ...this.mysterySnapshot(),
      atlas: this.atlas.snapshot(),
      porch: this.porch.snapshot(),
    };
  }

  /** What of her is worth saving: the tile she is on and the way she faces. */
  snapshot(): SavedPlayer {
    const { tx, ty } = tileOf(this.player.x, this.player.y);
    return { tx, ty, facing: this.player.facing, zone: this.scene };
  }

  /** Her home, for saving. */
  homeSnapshot(): { home: HomeSnapshot } {
    return { home: this.home.snapshot() };
  }

  /** The place she is in now. */
  get scene(): ZoneId {
    return this.travel.here;
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

  /** Walks up beside a pet, to see to it. */
  private approach(pet: Pet): boolean {
    const here = this.movement.tile;
    if (reach(here, pet.tile) === 1) return this.walkTo([here], { pet: pet.id });
    return this.walkTo(this.around(pet.tile), { pet: pet.id });
  }

  /** The open tiles around `at`, where she can stand to reach something there. */
  private around(at: Tile): Tile[] {
    const tiles: Tile[] = [];
    for (let ty = at.ty - 1; ty <= at.ty + 1; ty++) {
      for (let tx = at.tx - 1; tx <= at.tx + 1; tx++) {
        if ((tx !== at.tx || ty !== at.ty) && this.canWalk(tx, ty)) tiles.push({ tx, ty });
      }
    }
    return tiles;
  }

  /** The name she typed, which her neighbours call her (all but Cody, who says babe). */
  get name(): string {
    return this.wardrobe.look.name;
  }

  /** Creeps up within reach of a critter, to catch it. */
  private stalk(critter: Critter): boolean {
    const here = this.movement.tile;
    if (reach(here, critter) <= 1) return this.walkTo([here], { critter: critter.key });
    return this.walkTo(this.around(critter), { critter: critter.key });
  }

  /** The zone she's in now. */
  get zone(): Zone {
    return this.travel.zone;
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
    this.poses.stir();
    if (this.decorating.state) return this.decorating.tap(tx, ty);
    this.recordPlayer.stop();
    this.neighbourhood.endTalk();
    this.petCare.endPet();
    const neighbour = this.neighbourhood.villagerAt(tx, ty);
    if (neighbour) return this.follow(neighbour, 0);
    // She sets off after Wes; he'll be gone by the time she's near.
    const wes = this.mystery.wesAt(tx, ty);
    if (wes) return this.walkTo([wes], undefined);
    const critter = this.collecting.critterAt(tx, ty);
    if (critter) return this.stalk(critter);
    const pet = this.petCare.petAt(tx, ty);
    if (pet) return this.approach(pet);
    const prop = this.zone.propAt(tx, ty);
    const piece = this.scene === 'home' ? this.home.pieceAt(tx, ty) : undefined;
    const goals = this.canWalk(tx, ty) ? [{ tx, ty }] : this.zone.standBeside(tx, ty);
    const bed = { tx, ty };
    let visit: Visit | undefined;
    if (prop) visit = { prop };
    else if (piece && FURNITURE[piece.id].layer !== 'rug') visit = { piece };
    else if (this.scene === 'town' && this.farm.isBed(bed)) visit = { bed };
    return this.walkTo(goals, visit);
  }

  /** Walks up beside a neighbour, to talk. */
  private follow(neighbour: Neighbour, tries: number): boolean {
    // Gone on somewhere else altogether: she lets them go.
    if (neighbour.zone !== this.scene) return false;
    const here = this.movement.tile;
    // Already beside them: no walk, just a hello.
    const goals = reach(here, neighbour.tile) === 1 ? [here] : this.around(neighbour.tile);
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
    this.travel.check();
    this.mystery.check();
    this.mailbox.checkSpecialDay();
    this.mystery.step(
      this.movement.tile,
      this.neighbourhood.neighboursIn('town').map((n) => n.tile),
    );
    const heading = this.visiting && 'villager' in this.visiting ? this.visiting.villager : null;
    this.neighbourhood.step(deltaMs, this.player, heading);
    this.petCare.step(
      deltaMs,
      this.visiting && 'pet' in this.visiting ? this.visiting.pet : null,
      this.neighbourhood.neighboursIn(this.scene).map((n) => n.tile),
    );
    const events = this.ctx.moments.drain();
    if (this.arrivedInPlace) {
      events.push(...this.arrival(this.arrivedInPlace));
      this.arrivedInPlace = null;
    }
    const arrivedAt = this.movement.step(deltaMs);
    if (arrivedAt) events.push(...this.arrival(arrivedAt));
    this.poses.step(deltaMs);
    return events;
  }

  /**
   * She has arrived, and anything there that gives something is gathered: the tree or rock she
   * walked up to, the flowers she walked onto, or the night's snack where it waits.
   */
  private arrival(here: Tile): WorldEvent[] {
    const events = this.arriveAt(here);
    const bone = this.petCare.lostBone();
    if (
      events.length > 0 &&
      bone?.scene === this.scene &&
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
      const pet = this.petCare.pet(visit.pet);
      if (pet.scene === this.scene && reach(here, pet.tile) <= 1) {
        arrived.pet = pet.id;
        this.petCare.startPet(pet.id);
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
      if (n.zone === this.scene && reach(t, here) <= 1) {
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
      if (visit.piece.id === 'recordPlayer') {
        const here = this.movement.tile;
        const beside = [-1, 1, -2, 2]
          .map((dx) => ({ tx: here.tx + dx, ty: here.ty }))
          .filter((t) => this.canWalk(t.tx, t.ty));
        events.push(this.recordPlayer.play(beside));
      }
      return events;
    }
    const prop = visit?.prop;
    if (prop) arrived.at = prop.id;
    if (prop?.id === 'pottedPlant') {
      events.push({ kind: 'potted', plant: this.porch.swap() });
      return events;
    }
    const crossing = this.zone.doorAt(here, prop);
    if (crossing) {
      events.push(this.travel.cross(crossing));
      return events;
    }
    if (this.scene === 'home') return events;
    events.push(...this.gathering.arriveAt(this.zones.map(this.scene), here, prop));
    return events;
  }
}
