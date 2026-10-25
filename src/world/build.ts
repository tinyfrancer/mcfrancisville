import type { Joining } from './services/Joining';
import type { PostRound } from './services/PostRound';
import { TOWN } from '../data/maps';
import { ZONE_IDS, ZONES } from '../data/zones';
import type { SavedPlayer } from '../persistence/SaveState';
import { systemClock, type Clock } from '../systems/clock';
import { parseMap, type TileMap } from '../systems/grid';
import type { Around } from '../systems/dialogue';
import type { Had } from '../systems/milestones';
import type { MapZoneId, ZoneId } from '../types/ids';
import { festivals } from './areas/calendar';
import { catching } from './areas/collecting';
import { fairground } from './areas/fairground';
import { firstDay } from './areas/firstDay';
import { upNow } from './areas/upNow';
import { her } from './areas/her';
import { homeServices } from './areas/home';
import { making } from './areas/making';
import { mystery, tellTheMayor } from './areas/mystery';
import { neighbours } from './areas/neighbours';
import { outdoors } from './areas/outdoors';
import { passive } from './areas/passive';
import { petServices } from './areas/pets';
import { places } from './areas/places';
import { shopping } from './areas/shopping';
import { keepersOf, type Shared, type TownReads } from './areas/shared';
import { going } from './areas/travel';
import type { WorldOptions, WorldSave } from './options';
import type { AreaName } from './areas/order';
import { arrivalsOf, type PropArrivals } from './arrivals';
import type { Atlas } from './Atlas';
import type { Bag } from './Bag';
import type { Cabinet } from './Cabinet';
import type { Casebook } from './Casebook';
import { worldContext, type WorldContext } from './context';
import type { Dug } from './Dug';
import type { WorldState } from './events';
import type { EventBus } from './eventBus';
import { placeOf, type Farm, type Plot } from './Farm';
import type { Friends } from './Friends';
import type { Home } from './Home';
import type { Keepsakes } from './Keepsakes';
import type { Lately } from './Lately';
import type { Marriage } from './services/Marriage';
import { PET_IDS } from '../data/pets';
import type { Letters } from './Letters';
import { tileOf, type Movement } from './Movement';
import type { Pets } from './Pets';
import type { Porch } from './Porch';
import type { Wardrobe } from './Wardrobe';
import type { Activities } from './services/Activities';
import type { Baking } from './services/Baking';
import type { Belongings } from './services/Belongings';
import type { Broom } from './services/Broom';
import type { Calendar } from './services/Calendar';
import type { Catalogue } from './services/Catalogue';
import type { Workshop } from './services/Workshop';
import type { Figurines } from './services/Figurines';
import type { CandyTree } from './services/CandyTree';
import type { Chest } from './services/Chest';
import type { Display } from './services/Display';
import type { Collecting } from './services/Collecting';
import type { Fossils } from './services/Fossils';
import type { Decorator } from './services/Decorator';
import type { Deliveries } from './services/Deliveries';
import type { Digging } from './services/Digging';
import type { Finale } from './services/Finale';
import type { Fishing } from './services/Fishing';
import type { FirstDay } from './services/FirstDay';
import type { UpNow } from './services/UpNow';
import type { RareEvents } from './services/RareEvents';
import { Projects } from './services/Projects';
import type { Forecast } from './services/Forecast';
import type { Fountain } from './services/Fountain';
import { Garden } from './services/Garden';
import { Barn } from './services/Barn';
import { Gathering } from './services/Gathering';
import type { Hands } from './services/Hands';
import type { Holidays } from './services/Holidays';
import type { HonestyStall } from './services/HonestyStall';
import type { Instruments } from './services/Instruments';
import type { Interiors } from './services/Interiors';
import type { Kitchen } from './services/Kitchen';
import { Mailbox } from './services/Mailbox';
import type { Milestones } from './services/Milestones';
import type { Mystery } from './services/Mystery';
import type { Neighbourhood } from './services/Neighbourhood';
import type { Talk } from './services/Talk';
import type { Noticeboard } from './services/Noticeboard';
import type { Novelty } from './services/Novelty';
import type { PetCare } from './services/PetCare';
import type { Poses } from './services/Poses';
import type { PumpkinPatch } from './services/PumpkinPatch';
import type { RecordPlayer } from './services/RecordPlayer';
import { Shops } from './services/Shops';
import type { Sitting } from './services/Sitting';
import type { SmallEvents } from './services/SmallEvents';
import type { Takings } from './services/Takings';
import type { Travel } from './services/Travel';
import type { TrickOrTreat } from './services/TrickOrTreat';
import type { Visits } from './services/Visits';
import type { Wallet } from './services/Wallet';
import type { Workbench } from './services/Workbench';
import type { HomeZone } from './zones/HomeZone';
import type { Yard } from './Yard';
import type { MapZone } from './zones/MapZone';
import type { Stalls } from './zones/Stalls';
import type { Zone } from './zones/Zone';
import type { Zones } from './zones/Zones';

/**
 * The world's parts and how they're wired (decisions.md 139): every keeper, zone and service, made
 * by area (`areas/`) in an order that matters (decisions.md 218), and what of them is saved. `World` extends this with what she does in
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
  /** Joining in at her neighbours' happenings, and what they remember of it (V1's P4). */
  readonly joining: Joining;
  /** Ollie walking her post to her mailbox while she's in town (V1's P4). */
  readonly postRound: PostRound;
  /** The Hollow Fairground's games, fortune and snack stalls (0.2's M2). */
  readonly activities: Activities;
  /** Her neighbours: where each is, and their walks. */
  readonly neighbourhood: Neighbourhood;
  /** Talking with them: the hello, heart moments, questions, gifts, favours and friendships. */
  readonly talk: Talk;
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
  /** Ollie's round: what she ordered, in her mailbox the next morning (0.3's S1). */
  readonly deliveries: Deliveries;
  /** Ollie's catalogue: everything she has ever had, to order again (0.3's S1). */
  readonly catalogue: Catalogue;
  /** Gourdon's book: any piece he makes, made to order and brought round (0.3's S2). */
  readonly workshop: Workshop;
  /** Gourdon's figurines: three of a kind carved into one, at his bench (0.3's C3). */
  readonly figurines: Figurines;
  /** What she picks up by arriving: trees, rocks, flowers, the night's snack and Fibi's bone. */
  readonly gathering: Gathering;
  /** Decorating her home: picking up, moving, turning and putting away pieces. */
  readonly decorating: Decorator;
  /** What stands out in her yard (0.3's H5). */
  readonly yard: Yard;
  /** Things from her bag put away in her storage chest, and taken out again (0.3's H1). */
  readonly chest: Chest;
  /** What her shelves and display pieces show off (0.3's H2). */
  readonly display: Display;
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
  /** The day's mounds, and the fossils in them (0.3's C1). */
  readonly fossils: Fossils;
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
  /** The barn's wall at Boo Acres: her sprinklers, and the fields to sprinkle (0.3's F2). */
  readonly barn: Barn;
  /** What she has done lately, which her neighbours remember (V1's P1). */
  readonly lately: Lately;
  /** Cody, married to her: his evening question, their story, and nights in (V1's P5). */
  readonly marriage: Marriage;
  /** Cody's thread over her first day in a new town (V1's R1). */
  readonly firstDay: FirstDay;
  /** What's up now, for the calendar's Today tab (V1's R2). */
  readonly upNow: UpNow;
  /** What's out of the ordinary today, and who's passing through (V1's R3). */
  readonly rareEvents: RareEvents;
  /** The town's projects, funded at the noticeboard and built where they stand (V1's R4). */
  readonly projects: Projects;
  /** What walking up to each kind of prop does, given by the areas (1.1's W1, decision 340). */
  protected readonly propArrivals: PropArrivals;

  constructor(options: WorldOptions = {}) {
    // What the services that talk with her neighbours read of the town, each when it's asked, so
    // they can be made before the neighbourhood is.
    const town: TownReads = {
      name: () => this.name,
      scene: () => this.scene,
      zoneOf: (villager) => this.neighbourhood.neighbour(villager).zone,
      hearts: (villager) => this.friends.hearts(villager),
      thank: (villager, points) => this.talk.thank(villager, points),
    };
    // Told as each area is made, in `AREAS`' order (`areas/order.ts`), which a test holds.
    const areaMade = (area: AreaName) => options.areaMade?.(area);
    this.map = parseMap(options.map ?? TOWN);
    this.clock = options.clock ?? systemClock;
    this.ctx = worldContext(this.clock);
    const { ctx } = this;
    this.events = ctx.events;
    const beyond = ZONE_IDS.filter(
      (id): id is MapZoneId => id !== 'town' && ZONES[id].map !== undefined,
    ).map((id) => ({ id, map: parseMap(ZONES[id].map!) }));
    const keepers = keepersOf(ctx, options, this.map, beyond);
    ({ bag: this.bag, wardrobe: this.wardrobe, takings: this.takings, home: this.home } = keepers);
    ({ farm: this.farm, friends: this.friends, letters: this.letters } = keepers);
    ({ cabinet: this.cabinet, pets: this.pets, casebook: this.casebook } = keepers);
    tellTheMayor(this.casebook);
    ({ wallet: this.wallet, atlas: this.atlas, porch: this.porch } = keepers);
    ({ keepsakes: this.keepsakes, dug: this.dug, yard: this.yard } = keepers);
    this.lately = keepers.lately;
    areaMade('keepers');
    const shared: Shared = {
      ...keepers,
      ctx,
      town,
      options,
      map: this.map,
      beyond,
      peopled: (options.map ?? TOWN).neighbours === true,
      movement: () => this.movement,
    };
    // Each area's services, in the order `AREAS` names with the why (decisions.md 210, 218; 1.1's
    // W3): what a service listens for is heard in the order they were made, and a read of one made
    // later is a getter.
    const made = making(shared);
    ({ stall: this.stall, workbench: this.workbench, kitchen: this.kitchen } = made);
    this.belongings = made.belongings;
    areaMade('making');
    const passed = passive(shared, this.belongings);
    ({ visits: this.visits, candyTree: this.candyTree } = passed);
    areaMade('passive');
    this.firstDay = firstDay(shared, { ...made, visits: this.visits, candyTree: this.candyTree });
    areaMade('firstDay');
    // Travel is made after the places; until then (as she's first stood somewhere) every gate is
    // open.
    const place = places(shared, (zone) => (this.travel ? this.travel.isOpen(zone) : true));
    ({ stalls: this.stalls, townZone: this.townZone, homeZone: this.homeZone } = place);
    this.zones = place.zones;
    areaMade('places');
    const { zones } = this;
    const outside = () => zones.outdoor(this.scene)?.id ?? null;
    // Her greenhouse's planters, once it's built, are under glass (V1's R4).
    const glass = (bed: Plot) =>
      placeOf(bed) !== 'home' &&
      this.zones.outdoor(placeOf(bed))?.sites?.isBed(bed.tx, bed.ty) === true;
    this.garden = new Garden(ctx, this.bag, this.farm, glass);
    this.barn = new Barn(this.bag, this.garden);
    this.gathering = new Gathering(ctx, this.bag, this.takings, this.map);
    this.shops = new Shops(ctx, this.wallet, this.bag, this.belongings, this.stalls);
    this.mailbox = new Mailbox(ctx, this.letters, this.belongings, this.wardrobe);
    const { mailbox, belongings } = this;
    this.projects = new Projects(ctx, {
      works: keepers.works,
      bag: this.bag,
      wallet: this.wallet,
      mailbox,
      yard: keepers.yard,
    });
    areaMade('everyday');
    const hasHad = (id: Had) => this.milestones.hasHad(id);
    const shop = shopping(shared, { mailbox, belongings, hasHad });
    ({ deliveries: this.deliveries, catalogue: this.catalogue, workshop: this.workshop } = shop);
    this.figurines = shop.figurines;
    areaMade('shopping');
    const near = neighbours(shared, {
      mailbox,
      belongings,
      zones,
      talk: () => this.talkScene(),
      learnt: () => this.instruments.learnt,
      dance: () => {
        const her = this.movement.player;
        const zone = this.zones.get(this.scene);
        this.recordPlayer.ourSong(tileOf(her.x, her.y), (tx, ty) => zone.canWalk(tx, ty));
      },
      pets: () => this.petCare.here().map((p) => p.tile),
      visits: () => this.visits.count,
    });
    this.joining = near.joining;
    this.marriage = near.marriage;
    this.postRound = near.postRound;
    ({ smallEvents: this.smallEvents, neighbourhood: this.neighbourhood, talk: this.talk } = near);
    ({ noticeboard: this.noticeboard, baking: this.baking, interiors: this.interiors } = near);
    areaMade('neighbours');
    this.mystery = mystery(shared, mailbox, this.townZone);
    areaMade('mystery');
    const festival = festivals(shared, {
      stalls: this.stalls,
      neighbourhood: this.neighbourhood,
      outside,
      mailbox,
    });
    ({
      calendar: this.calendar,
      holidays: this.holidays,
      trickOrTreat: this.trickOrTreat,
    } = festival);
    ({ pumpkinPatch: this.pumpkinPatch, finale: this.finale } = festival);
    this.rareEvents = festival.rareEvents;
    areaMade('festivals');
    ({ weather: this.weather, fountain: this.fountain } = outdoors(shared, zones, outside));
    areaMade('outdoors');
    this.activities = fairground(shared, this.weather).activities;
    areaMade('fairground');
    const caught = catching(shared, { mailbox, zones, kitchen: this.kitchen, outside, hasHad });
    ({ collecting: this.collecting, fishing: this.fishing, fossils: this.fossils } = caught);
    this.digging = caught.digging;
    areaMade('catching');
    const gone = going(shared, { zones, mailbox, visits: this.visits });
    ({ movement: this.movement, travel: this.travel, broom: this.broom } = gone);
    areaMade('going');
    // Whatever she was on her way to do is left behind, wherever she went.
    ctx.signals.on('crossed', () => this.forget());
    areaMade('forget');
    const homes = homeServices(shared, () => this.forget());
    ({ recordPlayer: this.recordPlayer, instruments: this.instruments } = homes);
    this.decorating = homes.decorating;
    this.chest = homes.chest;
    this.display = homes.display;
    areaMade('homeServices');
    this.propArrivals = arrivalsOf(
      made.arrivals,
      passed.arrivals,
      festival.arrivals,
      caught.arrivals,
      homes.arrivals,
    );
    this.petCare = petServices(shared, {
      ...place,
      ...gone,
      collecting: this.collecting,
      fossils: this.fossils,
      smallEvents: this.smallEvents,
    }).petCare;
    areaMade('petServices');
    const { workbench, neighbourhood, petCare, decorating, recordPlayer, fishing } = this;
    const hers = her(shared, {
      workbench,
      mailbox,
      talk: this.talk,
      petCare,
      decorating,
      recordPlayer,
      fishing,
      collecting: this.collecting,
    });
    ({ hands: this.hands, novelty: this.novelty, milestones: this.milestones } = hers);
    ({ sitting: this.sitting, poses: this.poses } = hers);
    areaMade('her');
    const { candyTree, stall, garden, noticeboard, fossils, shops, calendar } = this;
    const today = { candyTree, stall, garden, noticeboard, fossils, shops, calendar };
    this.upNow = upNow(shared, {
      ...today,
      neighbourhood,
      talk: this.talk,
      firstDay: this.firstDay,
      hasHad,
      rareEvents: this.rareEvents,
      stalls: this.stalls,
      projects: this.projects,
      activities: this.activities,
      collecting: this.collecting,
    });
    areaMade('upNow');
  }

  /**
   * What's going on round her, for what a neighbour brings up (0.2's D2), and what she has done
   * and worn lately, which they remember (V1's P1).
   */
  private talkScene(): Around {
    const walker = this.pets.walking;
    const beside = walker !== null && this.petCare.here().some((p) => p.id === walker);
    return {
      weather: this.weather.today(),
      storm: this.weather.stormy(),
      holding: this.hands.held,
      caught: this.collecting.caughtToday(),
      shiny: this.collecting.shinyToday(),
      pet: beside ? this.pets.nameOf(walker) : null,
      wearing: Object.values(this.wardrobe.look.outfit).map((worn) => worn.id),
      ...this.lately.last,
      visits: this.visits.count,
      clue: this.casebook.newest,
      met: this.mystery.met(),
      // For what only her husband brings up (V1's P5).
      here: this.scene,
      pets: PET_IDS.map((id) => this.pets.nameOf(id)),
      yard: this.yard.placed.map((p) => p.id),
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
      yard: this.yard.snapshot(),
      ...this.belongings.snapshot(),
      ...this.deliveries.snapshot(),
      ...this.lately.snapshot(),
      ...this.joining.snapshot(),
      ...this.firstDay.snapshot(),
      ...this.projects.snapshot(),
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
}
