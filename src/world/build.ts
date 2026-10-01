import { TOWN } from '../data/maps';
import { ZONE_IDS, ZONES } from '../data/zones';
import { FURNITURE } from '../data/furniture';
import { INTERIOR_IDS } from '../data/interiors';
import { CRITTER_IDS, isFish } from '../data/critters';
import type { SavedPlayer } from '../persistence/SaveState';
import { systemClock, type Clock } from '../systems/clock';
import { parseMap, type TileMap } from '../systems/grid';
import { lurksOf } from '../systems/mystery';
import type { TalkScene } from '../systems/dialogue';
import type { UnlockFacts } from '../systems/zones';
import type { FurnitureId, MapZoneId, VillagerId, ZoneId } from '../types/ids';
import type { WorldOptions, WorldSave } from './options';
import { Atlas } from './Atlas';
import { Bag } from './Bag';
import { Cabinet } from './Cabinet';
import { Casebook } from './Casebook';
import { worldContext, type WorldContext } from './context';
import { Dug } from './Dug';
import type { WorldState } from './events';
import { EventBus } from './eventBus';
import { Farm } from './Farm';
import { Friends } from './Friends';
import { Home } from './Home';
import { Keepsakes } from './Keepsakes';
import { Letters } from './Letters';
import { Movement, tileOf } from './Movement';
import { Pets } from './Pets';
import { Porch } from './Porch';
import { Wardrobe } from './Wardrobe';
import { Belongings } from './services/Belongings';
import { Calendar } from './services/Calendar';
import { CandyTree } from './services/CandyTree';
import { Collecting } from './services/Collecting';
import { Decorator } from './services/Decorator';
import { Digging } from './services/Digging';
import { Fishing } from './services/Fishing';
import { Forecast } from './services/Forecast';
import { Fountain } from './services/Fountain';
import { Garden } from './services/Garden';
import { Gathering } from './services/Gathering';
import { Hands } from './services/Hands';
import { Holidays } from './services/Holidays';
import { HonestyStall } from './services/HonestyStall';
import { Interiors } from './services/Interiors';
import { Kitchen } from './services/Kitchen';
import { Mailbox } from './services/Mailbox';
import { Milestones } from './services/Milestones';
import { Mystery } from './services/Mystery';
import { Neighbourhood } from './services/Neighbourhood';
import { Noticeboard } from './services/Noticeboard';
import { Novelty } from './services/Novelty';
import { PetCare } from './services/PetCare';
import { Poses } from './services/Poses';
import { Sitting } from './services/Sitting';
import { RecordPlayer } from './services/RecordPlayer';
import { Instruments } from './services/Instruments';
import { Shops } from './services/Shops';
import { SmallEvents } from './services/SmallEvents';
import { Takings } from './services/Takings';
import { Travel } from './services/Travel';
import { Broom } from './services/Broom';
import { TrickOrTreat } from './services/TrickOrTreat';
import { PumpkinPatch } from './services/PumpkinPatch';
import { Finale } from './services/Finale';
import { Baking } from './services/Baking';
import { Activities } from './services/Activities';
import { Visits } from './services/Visits';
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

/** What a service reads of her and her neighbours, the same for each that asks. */
interface TownReads {
  name: () => string;
  scene: () => ZoneId;
  zoneOf: (villager: VillagerId) => ZoneId;
  hearts: (villager: VillagerId) => number;
  thank: (villager: VillagerId, points: number) => void;
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
  /** Whether the pond's fountain is playing for her, after dark (0.2's H2). */
  readonly fountain: Fountain;
  /** The day's window, what's on today, and the calendar (phase N). */
  readonly calendar: Calendar;
  /** The notes on the board by the square, and answering them (phase N). */
  readonly noticeboard: Noticeboard;
  /** The holidays in town: the decorations, the sky, Easter's eggs (phase U). */
  readonly holidays: Holidays;
  /** A sweet at each neighbour's door on the Halloween Festival's evenings (0.2's J2). */
  readonly trickOrTreat: TrickOrTreat;
  /** The pumpkin patch on the farm, growing over October for carving (0.2's J3). */
  readonly pumpkinPatch: PumpkinPatch;
  /** The Halloween Festival's finale: the contest she judges, Cody's half, their photo (J4). */
  readonly finale: Finale;
  readonly baking: Baking;
  /** The Hollow Fairground's games, fortune and snack stalls (0.2's M2). */
  readonly activities: Activities;
  /** Her neighbours: their walks, talking, gifts, favours and friendships. */
  readonly neighbourhood: Neighbourhood;
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
  /** Her piano, the hall's and its music box: whatever `plays` (0.2's G2). */
  readonly instruments: Instruments;
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
  /** Sitting down on a seat, and getting up again (0.2's G1). */
  readonly sitting: Sitting;
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
  /** Her shelves to finish, and the letters that come when she does (0.2's F2). */
  readonly milestones: Milestones;
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
    // What the services that talk with her neighbours read of the town, each when it's asked, so
    // they can be made before the neighbourhood is.
    const town: TownReads = {
      name: () => this.name,
      scene: () => this.scene,
      zoneOf: (villager) => this.neighbourhood.neighbour(villager).zone,
      hearts: (villager) => this.friends.hearts(villager),
      thank: (villager, points) => this.neighbourhood.thank(villager, points),
    };
    this.map = parseMap(options.map ?? TOWN);
    this.clock = options.clock ?? systemClock;
    this.ctx = worldContext(this.clock);
    this.events = this.ctx.events;
    this.bag = new Bag(options.finds?.bag);
    // Her skates are hers from the first day (decision 211), in a bag from before then too.
    if (this.bag.count('iceSkates') === 0) this.bag.add('iceSkates', 1);
    this.wardrobe = new Wardrobe(options.closet, (id) => this.bag.count(id));
    this.bag.keepWorn((id) => this.wardrobe.wearing(id));
    this.takings = new Takings(this.clock, options.finds?.taken);
    this.home = new Home(options.home);
    const beyond = ZONE_IDS.filter(
      (id): id is MapZoneId => id !== 'town' && ZONES[id].map !== undefined,
    ).map((id) => ({ id, map: parseMap(ZONES[id].map!) }));
    this.farm = new Farm(
      {
        beds: Object.fromEntries([
          ['town', this.map.beds],
          ...beyond.map(({ id, map }) => [id, map.beds]),
        ]),
        rows: this.map.plots,
        planters: () => this.home.placed.filter((p) => FURNITURE[p.id].planter),
      },
      {
        beds: options.beds,
        harvested: options.harvested,
        sprinklers: options.sprinklers,
        rows: options.farmRows,
      },
    );
    this.friends = new Friends(options.friends);
    this.letters = new Letters(options.friends?.mail);
    this.cabinet = new Cabinet(options.cabinet);
    this.pets = new Pets(options.pets);
    this.casebook = new Casebook(options.mystery);
    this.wallet = new Wallet(this.events, options.candy);
    this.stall = new HonestyStall(this.ctx, { bag: this.bag, wallet: this.wallet }, options.stall);
    this.workbench = new Workbench(
      this.ctx,
      { bag: this.bag, home: this.home, farm: this.farm, stall: this.stall },
      options.recipes,
    );
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
    this.stalls = new Stalls(this.clock, this.map);
    // Travel is made after the zones; until then (as she's first stood somewhere) every gate is open.
    const isOpen = (zone: ZoneId) => (this.travel ? this.travel.isOpen(zone) : true);
    const lotsIn = (zone: MapZoneId) => new Lots(zone);
    const hers = (piece: FurnitureId) =>
      this.home.placed.some((p) => p.id === piece) || this.home.stored.some((s) => s.id === piece);
    this.townZone = new MapZone(
      'town',
      this.map,
      this.stalls,
      isOpen,
      lotsIn('town'),
      // The square's holiday pieces stand in the town's own map, not a test's small one.
      (options.map ?? TOWN) === TOWN ? new Decorations(() => this.clock.now(), hers) : null,
      () => this.farm.rows,
    );
    this.homeZone = new HomeZone(this.home);
    this.zones = new Zones(
      this.homeZone,
      [
        this.townZone,
        ...beyond.map(({ id, map }) => {
          // What's set out for a happening at the fairground's stage (0.2's M3).
          const set =
            id === 'fairground' ? new Decorations(() => this.clock.now(), hers, id) : null;
          return new MapZone(id, map, null, isOpen, lotsIn(id), set);
        }),
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
    this.smallEvents = new SmallEvents(
      this.ctx,
      {
        wallet: this.wallet,
        takings: this.takings,
        thank: town.thank,
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
        scene: () => this.talkScene(),
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
      thank: town.thank,
    });
    this.weather = new Forecast(this.ctx, () => this.zones.outdoor(this.scene)?.id ?? null);
    this.fountain = new Fountain(this.ctx, () => {
      const zone = this.zones.outdoor(this.scene);
      if (!zone) return null;
      return {
        props: zone.map.props,
        tile: tileOf(this.movement.player.x, this.movement.player.y),
      };
    });
    this.holidays = new Holidays(
      this.ctx,
      { bag: this.bag, takings: this.takings },
      () => this.zones.outdoor(this.scene)?.id ?? null,
    );
    this.trickOrTreat = new TrickOrTreat(
      this.ctx,
      { bag: this.bag, takings: this.takings },
      {
        ...town,
        hosting: (zone) => this.neighbourhood.happeningIn(zone) !== null,
        isIn: (villager, zone) =>
          this.neighbourhood.neighbours.some((n) => n.id === villager && n.zone === zone),
      },
    );
    this.pumpkinPatch = new PumpkinPatch(this.ctx, { bag: this.bag, takings: this.takings });
    this.finale = new Finale(this.ctx, this.takings, { ...town, look: () => this.wardrobe.look });
    this.baking = new Baking(
      this.ctx,
      { bag: this.bag, wallet: this.wallet, takings: this.takings },
      { ...town, bakerAt: () => town.zoneOf('wrapunzel') },
    );
    this.activities = new Activities(
      this.ctx,
      { bag: this.bag, wallet: this.wallet, takings: this.takings },
      {
        name: town.name,
        weather: () => this.weather.today(),
        agathaAt: () => town.zoneOf('agatha'),
        caught: (id) => this.cabinet.caughtOn(id) !== null,
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
      hearts: town.hearts,
      name: town.name,
    });
    this.recordPlayer = new RecordPlayer(this.ctx, this.bag);
    this.instruments = new Instruments(this.ctx, this.takings, town, options.tunes);
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
    this.novelty.mark('closet', this.wardrobe.added);
    this.visits = new Visits(
      this.ctx,
      { bag: this.bag, wallet: this.wallet, belongings: this.belongings, name: town.name },
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
    this.milestones = new Milestones(
      this.ctx,
      { bag: this.bag, cabinet: this.cabinet, mailbox: this.mailbox },
      options.collected,
    );
    this.candyTree = new CandyTree(
      this.ctx,
      { wallet: this.wallet, bag: this.bag },
      options.candyTree,
    );
    this.sitting = new Sitting(() => this.scene);
    this.poses = new Poses(this.ctx, {
      moving: () => this.movement.player.moving,
      seated: () => this.sitting.seat !== null,
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

  /** What's going on round her, for what a neighbour brings up (0.2's D2). */
  private talkScene(): TalkScene {
    const walker = this.pets.walking;
    const beside = walker !== null && this.petCare.here().some((p) => p.id === walker);
    return {
      weather: this.weather.today(),
      storm: this.weather.stormy(),
      holding: this.hands.held,
      caught: this.collecting.caughtToday(),
      pet: beside ? this.pets.nameOf(walker) : null,
    };
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
      left: this.travel.left,
      ...this.broom.snapshot(),
      ...this.milestones.snapshot(),
      ...this.instruments.snapshot(),
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
