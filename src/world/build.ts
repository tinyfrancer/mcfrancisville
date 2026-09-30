import { TOWN, type MapSource } from '../data/maps';
import { ZONE_IDS, ZONES } from '../data/zones';
import { INTERIOR_IDS } from '../data/interiors';
import { CRITTER_IDS, isFish } from '../data/critters';
import type { HomeSnapshot } from '../data/home';
import type { PetsSnapshot } from '../data/pets';
import type { SavedPlayer, SaveState } from '../persistence/SaveState';
import { systemClock, type Clock } from '../systems/clock';
import { parseMap, type TileMap } from '../systems/grid';
import { lurksOf } from '../systems/mystery';
import type { Meals } from '../systems/cooking';
import type { StallSnapshot } from '../systems/passive';
import type { Arrivals as NewcomerArrivals } from '../systems/newcomers';
import type { UnlockFacts } from '../systems/zones';
import type { FurnitureId, MapZoneId, ZoneId } from '../types/ids';
import { Atlas, type AtlasSnapshot } from './Atlas';
import { Bag, type Stack } from './Bag';
import { Cabinet, type CabinetSnapshot } from './Cabinet';
import { Casebook, type MysterySnapshot } from './Casebook';
import { worldContext, type WorldContext } from './context';
import { Dug } from './Dug';
import type { WorldState } from './events';
import { EventBus } from './eventBus';
import { Farm, type SavedBed, type SavedSprinkler } from './Farm';
import { Friends, type FriendsSnapshot } from './Friends';
import { Home } from './Home';
import { Keepsakes } from './Keepsakes';
import { Letters, type MailEntry } from './Letters';
import { Movement, tileOf } from './Movement';
import { Pets } from './Pets';
import { Porch, type PorchSnapshot } from './Porch';
import { Wardrobe, type ClosetSnapshot } from './Wardrobe';
import { Belongings } from './services/Belongings';
import { Calendar } from './services/Calendar';
import { CandyTree, type CandyTreeSnapshot } from './services/CandyTree';
import { Collecting } from './services/Collecting';
import { Decorator } from './services/Decorator';
import { Digging } from './services/Digging';
import { Fishing } from './services/Fishing';
import { Forecast } from './services/Forecast';
import { Garden } from './services/Garden';
import { Gathering } from './services/Gathering';
import { Hands } from './services/Hands';
import { Holidays } from './services/Holidays';
import { HonestyStall } from './services/HonestyStall';
import { Interiors } from './services/Interiors';
import { Kitchen } from './services/Kitchen';
import { Mailbox } from './services/Mailbox';
import { Mystery } from './services/Mystery';
import { Neighbourhood } from './services/Neighbourhood';
import { Newcomers } from './services/Newcomers';
import { Noticeboard } from './services/Noticeboard';
import { Novelty, type FreshSnapshot } from './services/Novelty';
import { PetCare } from './services/PetCare';
import { Poses } from './services/Poses';
import { RecordPlayer } from './services/RecordPlayer';
import { Shops } from './services/Shops';
import { SmallEvents } from './services/SmallEvents';
import { Takings } from './services/Takings';
import { Travel } from './services/Travel';
import { Broom } from './services/Broom';
import type { BroomLook } from '../data/broom';
import { TrickOrTreat } from './services/TrickOrTreat';
import { Visits, type VisitsSnapshot } from './services/Visits';
import { Wallet } from './services/Wallet';
import { Workbench } from './services/Workbench';
import { Decorations } from './zones/Decorations';
import { HomeZone } from './zones/HomeZone';
import { Lots } from './zones/Lots';
import { MapZone } from './zones/MapZone';
import { RoomZone } from './zones/RoomZone';
import type { Zone } from './zones/Zone';
import { Stalls } from './zones/Stalls';
import { Zones } from './zones/Zones';

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
  /** When each newcomer wrote to say they were coming, and when the month to the next began. */
  newcomers?: Partial<NewcomerArrivals>;
  /** Where she last flew home from by broom. */
  left?: SavedPlayer | null;
  /** Her broom's colours. */
  broom?: Partial<BroomLook>;
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
    newcomers: save.newcomers,
    left: save.left,
    broom: save.broom as Partial<BroomLook>,
  };
}

/**
 * The world's parts and how they're wired (decisions.md 139): every keeper, zone and service, made
 * in an order that matters, and what of them is saved. `World` extends this with what she does in
 * it (a tap, a walk, an arrival, the step); nothing here reaches back into that but `forget`.
 */
export abstract class WorldParts {
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
  /** Her rod, and her line in the water (phase Q). */
  readonly fishing: Fishing;
  /** Today's weather, rain or fog or clear, the same everywhere (phase L). */
  readonly weather: Forecast;
  /** The day's window, what's on today, and the calendar (phase N). */
  readonly calendar: Calendar;
  /** The notes on the board by the square, and answering them (phase N). */
  readonly noticeboard: Noticeboard;
  /** The holidays in town: the decorations, the sky, Easter's eggs (phase U). */
  readonly holidays: Holidays;
  /** A sweet at each neighbour's door on the Halloween Festival's evenings (0.2's J2). */
  readonly trickOrTreat: TrickOrTreat;
  /** Her neighbours: their walks, talking, gifts, favours and friendships. */
  readonly neighbourhood: Neighbourhood;
  /** Who has moved to town since her first day, and who's due next (phase T). */
  readonly newcomers: Newcomers;
  /** The window's small event: a neighbour's news, or something one of them has lost. */
  readonly smallEvents: SmallEvents;
  /** Their pets: the one out with her, those at home, and Fibi's bones. */
  readonly petCare: PetCare;
  /** What every service shares: the clock, the state bus, signals and waiting moments. */
  readonly ctx: WorldContext;
  readonly events: EventBus<WorldState>;
  /** Her recipes, and making things at her workbench. */
  readonly workbench: Workbench;
  /** Her stove: cooking dishes, and eating them for a small effect (phase R). */
  readonly kitchen: Kitchen;
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
  /** The keepsakes she has been given from her neighbours' houses. */
  readonly keepsakes: Keepsakes;
  /** Inside the town's buildings: counters, chairs, cases and keepsakes. */
  readonly interiors: Interiors;
  /** The buried things she has dug up. */
  readonly dug: Dug;
  /** Digging up what's buried. */
  readonly digging: Digging;
  /** How she stands: her phone or her arms crossed while she waits, and rocking out. */
  readonly poses: Poses;
  /** What she has taken today, by key; see `systems/gathering.ts`. */
  readonly takings: Takings;
  /** What she's holding, from the quick bar. */
  readonly hands: Hands;
  /** What's new on her collections until she looks. */
  readonly novelty: Novelty;
  /** Her visits, a gift for each, and Cody's greeting as she opens the game (phase O). */
  readonly visits: Visits;
  /** Her broom home and out again, and its colours (0.2's P1). */
  readonly broom: Broom;
  /** The candy tree by her house, which fills a little each window (phase O). */
  readonly candyTree: CandyTree;
  /** The honesty stall at the farm gate, which sells what she grows while she's away (phase O). */
  readonly stall: HonestyStall;

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
    this.farm = new Farm(this.map.beds, options.beds, options.harvested, options.sprinklers);
    this.home = new Home(options.home);
    this.friends = new Friends(options.friends);
    this.letters = new Letters(options.friends?.mail);
    this.cabinet = new Cabinet(options.cabinet);
    this.pets = new Pets(options.pets);
    this.casebook = new Casebook(options.mystery);
    this.workbench = new Workbench(this.ctx, this.bag, this.home, options.recipes);
    this.kitchen = new Kitchen(
      this.ctx,
      { bag: this.bag, workbench: this.workbench, takings: this.takings },
      options.kitchen,
    );
    this.belongings = new Belongings(this.events, {
      bag: this.bag,
      wardrobe: this.wardrobe,
      home: this.home,
      workbench: this.workbench,
      pets: this.pets,
    });
    this.wallet = new Wallet(this.events, options.candy);
    this.stalls = new Stalls(this.clock, this.map);
    // Travel is made after the zones; until then (as she's first stood somewhere) every gate is open.
    const isOpen = (zone: ZoneId) => (this.travel ? this.travel.isOpen(zone) : true);
    // Newcomers are made after the zones; until then nobody has moved in.
    const lotsIn = (zone: MapZoneId) =>
      new Lots(
        zone,
        (v) => (this.newcomers ? this.newcomers.moving(v) : 'away'),
        () => this.clock.now(),
        () => (this.newcomers ? this.newcomers.written : -1),
      );
    this.townZone = new MapZone(
      'town',
      this.map,
      this.stalls,
      isOpen,
      lotsIn('town'),
      // The square's holiday pieces stand in the town's own map, not a test's small one.
      (options.map ?? TOWN) === TOWN ? new Decorations(() => this.clock.now()) : null,
    );
    this.homeZone = new HomeZone(this.home);
    const beyond = ZONE_IDS.filter(
      (id): id is MapZoneId => id !== 'town' && ZONES[id].map !== undefined,
    );
    this.zones = new Zones(
      this.homeZone,
      [
        this.townZone,
        ...beyond.map((id) => new MapZone(id, parseMap(ZONES[id].map!), null, isOpen, lotsIn(id))),
      ],
      INTERIOR_IDS.map((id) => new RoomZone(id)),
    );
    this.atlas = new Atlas(options.atlas);
    this.porch = new Porch(options.porch);
    this.garden = new Garden(this.ctx, this.bag, this.farm);
    this.gathering = new Gathering(this.ctx, this.bag, this.takings, this.map);
    this.shops = new Shops(this.ctx, this.wallet, this.bag, this.belongings, this.stalls);
    const source = options.map ?? TOWN;
    this.mailbox = new Mailbox(this.ctx, this.letters, this.belongings, this.wardrobe);
    const facts: UnlockFacts = {
      has: (item) => this.bag.count(item) > 0,
      hearts: (villager) => this.friends.hearts(villager),
      found: (z) => this.atlas.hasFound(z),
      caughtKinds: () => this.cabinet.found,
    };
    this.newcomers = new Newcomers(this.ctx, { mailbox: this.mailbox, facts }, options.newcomers);
    this.smallEvents = new SmallEvents(
      this.ctx,
      {
        wallet: this.wallet,
        takings: this.takings,
        thank: (villager, points) => this.neighbourhood.thank(villager, points),
      },
      options.errand,
    );
    this.neighbourhood = new Neighbourhood(
      this.ctx,
      {
        friends: this.friends,
        bag: this.bag,
        wallet: this.wallet,
        mailbox: this.mailbox,
        wardrobe: this.wardrobe,
        takings: this.takings,
        smallEvents: this.smallEvents,
        town: this.newcomers,
      },
      this.zones,
      source.neighbours === true,
      () => this.scene,
    );
    this.calendar = new Calendar(this.ctx, this.stalls);
    this.noticeboard = new Noticeboard(this.ctx, {
      bag: this.bag,
      wallet: this.wallet,
      takings: this.takings,
      thank: (villager, points) => this.neighbourhood.thank(villager, points),
    });
    this.weather = new Forecast(this.ctx, () => this.zones.outdoor(this.scene)?.id ?? null);
    this.holidays = new Holidays(
      this.ctx,
      { bag: this.bag, takings: this.takings },
      () => this.zones.outdoor(this.scene)?.id ?? null,
      () => this.newcomers.residents(),
    );
    this.trickOrTreat = new TrickOrTreat(
      this.ctx,
      { bag: this.bag, takings: this.takings },
      {
        livesHere: (villager) => this.newcomers.residents().includes(villager),
        hosting: (zone) => this.neighbourhood.happeningIn(zone) !== null,
        isIn: (villager, zone) =>
          this.neighbourhood.neighbours.some((n) => n.id === villager && n.zone === zone),
        name: () => this.name,
      },
    );
    this.collecting = new Collecting(
      this.ctx,
      { bag: this.bag, takings: this.takings, cabinet: this.cabinet, mailbox: this.mailbox },
      this.zones.outdoors,
      source.neighbours === true,
      () => this.zones.outdoor(this.scene)?.id ?? null,
      { lure: () => this.kitchen.lure(), standing: () => this.movement.tile },
    );
    this.fishing = new Fishing(this.ctx, {
      collecting: this.collecting,
      walking: () => this.movement.walking,
      hasFished: () => CRITTER_IDS.some((id) => isFish(id) && this.cabinet.caughtOn(id) !== null),
      eager: () => this.kitchen.eager(),
    });
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
        facts,
      },
      start,
      options.left ?? null,
    );
    // Whatever she was on her way to do is left behind, wherever she went.
    this.ctx.signals.on('crossed', () => this.forget());
    this.keepsakes = new Keepsakes(options.keepsakes);
    this.dug = new Dug(options.dug);
    this.digging = new Digging(this.ctx, this.dug, this.bag);
    this.interiors = new Interiors(this.ctx, {
      keepsakes: this.keepsakes,
      belongings: this.belongings,
      hearts: (villager) => this.friends.hearts(villager),
      name: () => this.name,
    });
    this.recordPlayer = new RecordPlayer(this.ctx, this.bag);
    this.decorating = new Decorator(this.ctx, this.home, {
      standing: () => this.movement.tile,
      atHome: () => this.scene === 'home',
      settle: () => {
        this.movement.halt();
        this.forget();
      },
    });
    this.hands = new Hands(this.ctx, this.bag, options.held);
    this.novelty = new Novelty(
      this.ctx,
      {
        bag: () => this.bag.contents.map((s) => s.id),
        closet: () => this.wardrobe.owned,
        storage: () => [...this.home.placed.map((p) => p.id), ...this.home.stored.map((s) => s.id)],
        cabinet: () => CRITTER_IDS.filter((id) => this.cabinet.caughtOn(id) !== null),
        recipes: () => this.workbench.known,
      },
      options.fresh,
    );
    this.visits = new Visits(
      this.ctx,
      { bag: this.bag, wallet: this.wallet, belongings: this.belongings, name: () => this.name },
      options.visits,
    );
    this.broom = new Broom(
      this.ctx,
      {
        bag: this.bag,
        home: this.home,
        mailbox: this.mailbox,
        travel: this.travel,
        visits: () => this.visits.count,
        standing: () => (this.scene === 'home' ? this.movement.tile : null),
      },
      options.broom,
    );
    this.candyTree = new CandyTree(
      this.ctx,
      { wallet: this.wallet, bag: this.bag },
      options.candyTree,
    );
    this.stall = new HonestyStall(this.ctx, { bag: this.bag, wallet: this.wallet }, options.stall);
    this.poses = new Poses(this.ctx, {
      moving: () => this.movement.player.moving,
      busy: () =>
        this.neighbourhood.talkingTo !== null ||
        this.petCare.pettingNow !== null ||
        this.decorating.state !== null ||
        this.recordPlayer.dance() !== null ||
        this.fishing.line !== null,
    });
    this.petCare = new PetCare(this.ctx, {
      pets: this.pets,
      bag: this.bag,
      takings: this.takings,
      movement: this.movement,
      homeZone: this.homeZone,
      townZone: this.townZone,
      habitats: this.collecting.habitatsIn('town'),
      where: () => this.scene,
      zone: () => this.zone,
    });
  }

  /** Leaves behind whatever she was on her way to do: she crossed somewhere, or is decorating. */
  protected abstract forget(): void;

  /** Everything to save, from each part that keeps something. */
  save(): WorldSave {
    return {
      player: this.snapshot(),
      ...this.wardrobe.snapshot(),
      bag: this.bag.snapshot(),
      // Yesterday's takings are dropped, since they no longer mean anything.
      ...this.takings.snapshot(),
      ...this.garden.snapshot(),
      ...this.wallet.snapshot(),
      home: this.home.snapshot(),
      ...this.workbench.snapshot(),
      ...this.friends.snapshot(),
      ...this.letters.snapshot(),
      cabinet: this.cabinet.snapshot(),
      pets: this.pets.snapshot(),
      mystery: this.casebook.snapshot(),
      atlas: this.atlas.snapshot(),
      porch: this.porch.snapshot(),
      ...this.keepsakes.snapshot(),
      ...this.dug.snapshot(),
      ...this.hands.snapshot(),
      ...this.novelty.snapshot(),
      ...this.visits.snapshot(),
      ...this.candyTree.snapshot(),
      ...this.stall.snapshot(),
      ...this.kitchen.snapshot(),
      ...this.smallEvents.snapshot(),
      ...this.newcomers.snapshot(),
      left: this.travel.left,
      ...this.broom.snapshot(),
    };
  }

  /** What of her is worth saving: the tile she is on and the way she faces. */
  snapshot(): SavedPlayer {
    const { tx, ty } = tileOf(this.movement.player.x, this.movement.player.y);
    return { tx, ty, facing: this.movement.player.facing, zone: this.scene };
  }

  /** The place she is in now. */
  get scene(): ZoneId {
    return this.travel.here;
  }

  /** The zone she's in now. */
  get zone(): Zone {
    return this.travel.zone;
  }

  /** The name she typed, which her neighbours call her (all but Cody, who says babe). */
  get name(): string {
    return this.wardrobe.look.name;
  }

  private townWalk = (tx: number, ty: number): boolean => this.townZone.canWalk(tx, ty);
}
