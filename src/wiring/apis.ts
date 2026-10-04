import type { TitleApi } from '../hud/TitleScreen';
import type { NotesApi } from '../hud/NotesCard';
import { drawTitleScene } from '../render/title';
import { DEDICATION } from '../data/greetings';
import type { StallApi } from '../hud/StallSheet';
import type { FairApi } from '../hud/FairSheet';
import { stallTakes } from '../systems/passive';
import { drawRedOne } from '../render/greetings';
import { drawBedPicture } from '../render/garden';
import type { BagApi, FreshApi } from '../hud/BagSheet';
import type { CabinetApi } from '../hud/CabinetSheet';
import type { CalendarApi } from '../hud/CalendarSheet';
import type { MysteryApi } from '../hud/CorkboardSheet';
import type { NoticeApi } from '../hud/NoticeSheet';
import type { CraftApi } from '../hud/CraftSheet';
import type { HomeApi } from '../hud/HomeSheets';
import type { DisplayApi } from '../hud/DisplaySheet';
import { isDisplayPiece } from '../data/display';
import type { HudOptions } from '../hud/Hud';
import type { MailApi } from '../hud/MailSheet';
import type { MapApi } from '../hud/MapSheet';
import { ateToast, cookedToast, countdown, madeToast } from '../hud/messages';
import { CALENDAR } from '../data/calendar';
import type { PetApi } from '../hud/PetSheet';
import type { QuickApi } from '../hud/QuickBar';
import type { BedApi } from '../hud/BedCard';
import type { LookApi } from '../hud/pickers';
import type { FarmApi } from '../hud/SeedSheet';
import type { ShopApi } from '../hud/ShopSheet';
import type { TalkApi } from '../hud/TalkSheet';
import type { NeighboursApi } from '../hud/NeighboursSheet';
import { CUES, voiceOf } from '../audio/cues';
import type { SoundBoard } from '../audio/SoundBoard';
import { ITEMS } from '../data/items';
import { OUTFITS } from '../data/outfits';
import { drawSilhouette } from '../render/critters';
import { drawDollPreview, drawWornDetail } from '../render/doll';
import {
  drawFixtureIcon,
  drawFurnitureIcon,
  drawShowcaseIcon,
  drawSurfaceIcon,
} from '../render/furniture';
import {
  drawBroomIcon,
  drawCalendarMark,
  drawPlainMark,
  drawItemIcon,
  drawRodIcon,
  drawToolIcon,
} from '../render/items';
import { paintedRod, paintRod } from '../render/scene';
import { readRodColour, writeRodColour } from '../persistence/rod';
import type { RodApi } from '../hud/RodSheet';
import type { BroomApi } from '../hud/BroomSheet';
import { ZONES } from '../data/zones';
import { drawAccessoryIcon, drawPetPortrait } from '../render/pets';
import { drawRecipeIcon } from '../render/recipes';
import { drawPortrait } from '../render/villagers';
import { VILLAGER_IDS } from '../data/villagers';
import { dayKey, hourOf } from '../systems/clock';
import { isAbout } from '../systems/critters';
import { suspectsOf } from '../systems/mystery';
import type { Plot } from '../world/Farm';
import { sellValue } from '../systems/shop';
import { isBracelet, wear, WRIST_MAX } from '../systems/wardrobe';
import type { Stack } from '../world/Bag';
import type { World, WorldEvent } from '../world/World';

/** What the sheets' Apis need beyond the world. */
export interface ApiWiring {
  world: World;
  sound: SoundBoard;
  /** Something changed that the next save should keep. */
  changed: () => void;
  /** Moments a sheet made (a planting, a purchase), played as the loop's are. */
  play: (events: WorldEvent[]) => void;
  waiting: Waiting;
}

/** What's waiting on a sheet: the bed she's standing at, for the seed she picks. */
export interface Waiting {
  bed: Plot | null;
}

/** The seeds in her bag. */
export function seedsIn(world: World): Stack[] {
  return world.bag.contents.filter((s) => ITEMS[s.id].kind === 'seed');
}

/** What in her bag the quick bar holds: her seeds, then her sprinklers (phase P). */
export function holdablesIn(world: World): Stack[] {
  const gear = world.bag.contents.filter((s) => ITEMS[s.id].kind === 'gear');
  return [...seedsIn(world), ...gear];
}

/**
 * Every sheet's Api, built from the world's services, so a sheet reaches the game only through its
 * interface and never the World (`docs/architecture.md`, "The HUD").
 */
export function sheetApis({
  world,
  sound,
  changed,
  play,
  waiting,
}: ApiWiring): Omit<HudOptions, 'save' | 'sound' | 'standalone'> {
  const looks: LookApi = {
    look: () => world.wardrobe.look,
    owned: () => world.wardrobe.owned,
    bracelets: () =>
      world.bag.contents.flatMap((s) => (isBracelet(s.id) ? [{ id: s.id, count: s.count }] : [])),
    apply(look) {
      world.wardrobe.setLook(look);
      changed();
    },
    preview: drawDollPreview,
    detail(canvas, look, outfit) {
      const owned = [...world.wardrobe.owned, outfit];
      drawWornDetail(canvas, wear(look, outfit, owned), OUTFITS[outfit].slot);
    },
    isNew: (id) => world.novelty.isNew('closet', id),
    seen: () => world.novelty.seen('closet'),
  };
  const bag: BagApi = {
    contents: () => world.bag.contents,
    canEat: (id) => world.kitchen.canEat(id),
    eat(id) {
      const ate = world.kitchen.eat(id);
      if (!ate || ate.kind !== 'ate') return null;
      changed();
      sound.cue(CUES.munch);
      return ateToast(ate.item, ate.effect, ate.until).text;
    },
    worn: (id) => world.wardrobe.wearing(id),
    canWear: (id) =>
      isBracelet(id) && world.bag.spare(id) > 0 && world.wardrobe.look.wrist.length < WRIST_MAX,
    wear(id) {
      if (!isBracelet(id) || !world.wardrobe.wearBracelet(id)) return false;
      changed();
      return true;
    },
    takeOff(id) {
      if (!isBracelet(id) || !world.wardrobe.takeOffBracelet(id)) return false;
      changed();
      return true;
    },
    icon: (canvas, id) =>
      id === 'broom' ? drawBroomIcon(canvas, world.broom.look) : drawItemIcon(canvas, id),
    canPutAway: (id) => world.chest.canPutAway(id),
    putAway(id, count) {
      if (!world.chest.putAway(id, count)) return false;
      changed();
      sound.cue(CUES.goIn);
      return true;
    },
    isNew: (id) => world.novelty.isNew('bag', id),
    seen: () => world.novelty.seen('bag'),
  };
  const fresh: FreshApi = {
    counts: () => world.novelty.counts(),
    onChange: (listener) => world.events.on('fresh', listener),
  };
  const farm: FarmApi = {
    seeds: () => seedsIn(world),
    icon: drawItemIcon,
    plant(seed) {
      const bed = waiting.bed;
      if (!bed) return;
      const planted = world.garden.plant(bed, seed);
      waiting.bed = null;
      if (planted) play([planted]);
    },
  };
  const shop: ShopApi = {
    candy: () => world.wallet.candy,
    onCandy: (listener) => world.events.on('candy', listener),
    stock: (id) => world.shops.stock(id),
    bag: () => world.bag.spares,
    owns: (ware) => world.belongings.owns(ware),
    sellValue: (item) => world.shops.pays(item),
    wanted: () => world.shops.wanted(),
    buy(id, ware) {
      const bought = world.shops.buy(id, ware);
      if (bought) play([bought]);
      return bought !== null;
    },
    sell(item, count) {
      const sold = world.shops.sell(item, count);
      if (sold) play([sold]);
      return sold !== null;
    },
    icon: drawItemIcon,
    pieceIcon: drawFurnitureIcon,
    recipeIcon: drawRecipeIcon,
    surfaceIcon: drawSurfaceIcon,
    accessoryIcon: drawAccessoryIcon,
    tryOn(canvas, outfit) {
      const owned = [...world.wardrobe.owned, outfit];
      drawWornDetail(canvas, wear(world.wardrobe.look, outfit, owned), OUTFITS[outfit].slot);
    },
  };
  const home: HomeApi = {
    indoors: () => world.scene === 'home',
    onChange(listener) {
      const stops = [
        world.events.on('scene', listener),
        world.events.on('decorating', listener),
        world.events.on('home', listener),
      ];
      return () => stops.forEach((stop) => stop());
    },
    stored: () => world.home.stored,
    selected: () => (world.decorating.state ? world.decorating.state.selected : undefined),
    startDecorating: () => world.decorating.start(),
    stopDecorating: () => world.decorating.stop(),
    takeOut: (id) => world.decorating.takeOut(id),
    turn: () => world.decorating.turnSelected(),
    putAway: () => world.decorating.putAwaySelected(),
    wallpapers: () => world.home.wallpapers,
    floorings: () => world.home.floorings,
    wallpaper: () => world.home.wallpaper,
    flooring: () => world.home.flooring,
    paper(id) {
      if (world.home.paper(id)) changed();
    },
    lay(id) {
      if (world.home.lay(id)) changed();
    },
    isNew: (id) => world.novelty.isNew('storage', id),
    seen: () => world.novelty.seen('storage'),
    icon: drawFurnitureIcon,
    surfaceIcon: drawSurfaceIcon,
    items: () => world.chest.items,
    takeOutItem(id, count) {
      if (!world.chest.takeOut(id, count)) return false;
      changed();
      sound.cue(CUES.goOut);
      return true;
    },
    itemIcon: drawItemIcon,
  };
  const display: DisplayApi = {
    piece() {
      const piece = world.display.piece;
      if (!piece || !isDisplayPiece(piece.id)) return null;
      return { id: piece.id, shows: piece.shows ?? null };
    },
    offers: () => world.display.offers(),
    show(id) {
      if (!world.display.show(id)) return false;
      changed();
      sound.cue(CUES.pick);
      return true;
    },
    empty() {
      if (!world.display.empty()) return false;
      changed();
      sound.cue(CUES.goOut);
      return true;
    },
    picture(canvas) {
      const piece = world.display.piece;
      if (piece && isDisplayPiece(piece.id)) {
        drawShowcaseIcon(canvas, piece.id, world.display.contents(piece));
      }
    },
    itemIcon: drawItemIcon,
  };
  const craft: CraftApi = {
    recipes: () => world.workbench.recipes,
    cantMake: (id) => world.workbench.cantMake(id),
    needs: (id) => world.workbench.needs(id),
    make(id) {
      const made = world.workbench.craft(id);
      if (!made || made.kind !== 'made') return null;
      // The sheet says what was made; a toast behind it would only be half seen.
      changed();
      return madeToast(made.made).text;
    },
    isNew: (id) => world.novelty.isNew('recipes', id),
    seen: () => world.novelty.seen('recipes'),
    icon: drawRecipeIcon,
    itemIcon: drawItemIcon,
  };
  const stove: CraftApi = {
    recipes: () => world.kitchen.recipes,
    cantMake: (id) => world.kitchen.cantCook(id),
    needs: (id) => world.workbench.needs(id),
    make(id) {
      const cooked = world.kitchen.cook(id);
      if (!cooked || cooked.kind !== 'cooked') return null;
      changed();
      sound.cue(CUES.cooked);
      return cookedToast(cooked).text;
    },
    isNew: (id) => world.novelty.isNew('recipes', id),
    seen: () => world.novelty.seen('recipes'),
    icon: drawRecipeIcon,
    itemIcon: drawItemIcon,
  };
  const talk: TalkApi = {
    hearts: (id) => world.friends.hearts(id),
    talk(id) {
      changed();
      const chat = world.neighbourhood.talk(id);
      sound.cue(voiceOf(id, chat.line));
      return chat;
    },
    bag: () => world.bag.spares,
    give(id, item) {
      changed();
      const given = world.neighbourhood.give(id, item);
      if (given && !given.declined && given.reaction === 'loved') sound.cue(CUES.heart);
      else if (given) sound.cue(voiceOf(id, given.line));
      return given;
    },
    favour: (id) => world.neighbourhood.favour(id),
    doFavour(id) {
      changed();
      return world.neighbourhood.doFavour(id);
    },
    endTalk: () => world.neighbourhood.endTalk(),
    icon: drawItemIcon,
    portrait: (canvas, id) => drawPortrait(canvas, id, world.finale.costumeOf(id)),
    redOne: drawRedOne,
    canCrown: (id) => world.finale.canCrown(id),
    crown(id) {
      changed();
      return world.finale.crown(id);
    },
    canBake: (id) => world.baking.canBake(id),
    bake(id) {
      changed();
      return world.baking.bake(id);
    },
    canLearn: (id) => world.instruments.canLearn(id),
    learn(id) {
      changed();
      return world.instruments.learn(id);
    },
    canPhoto: (id) => world.finale.canPhoto(id),
    photo: () => {
      world.finale.photo();
    },
  };
  const neighbours: NeighboursApi = {
    neighbours: () =>
      VILLAGER_IDS.map((id) => ({
        id,
        hearts: world.friends.hearts(id),
        where: world.neighbourhood.whereIs(id),
      })),
    today: () => dayKey(world.clock.now()),
    found: (zone) => world.atlas.hasFound(zone),
    seek: (id) => world.seek(id),
    portrait: (canvas, id) => drawPortrait(canvas, id, world.finale.costumeOf(id)),
    icon: drawItemIcon,
    gift(canvas, ware) {
      if ('item' in ware) drawItemIcon(canvas, ware.item);
      else if ('furniture' in ware) drawFurnitureIcon(canvas, ware.furniture);
      else if ('recipe' in ware) drawRecipeIcon(canvas, ware.recipe);
      else if ('accessory' in ware) drawAccessoryIcon(canvas, ware.accessory);
      else if ('outfit' in ware) {
        const owned = [...world.wardrobe.owned, ware.outfit];
        const look = wear(world.wardrobe.look, ware.outfit, owned);
        drawWornDetail(canvas, look, OUTFITS[ware.outfit].slot);
      } else drawSurfaceIcon(canvas, ware);
    },
  };
  const mail: MailApi = {
    mail: () => world.mailbox.view(),
    open(id) {
      changed();
      return world.mailbox.open(id);
    },
  };
  const cabinet: CabinetApi = {
    critter: (id) => ({
      caughtOn: world.cabinet.caughtOn(id),
      donated: world.cabinet.isDonated(id),
      outNow: isAbout(
        id,
        dayKey(world.clock.now()),
        hourOf(world.clock.now()),
        world.weather.today(),
      ),
    }),
    inBag: (id) => world.bag.count(id),
    donate(id) {
      changed();
      return world.collecting.donate(id);
    },
    isNew: (id) => world.novelty.isNew('cabinet', id),
    seen: () => world.novelty.seen('cabinet'),
    icon: drawItemIcon,
    silhouette: drawSilhouette,
    shelf: (id) => world.milestones.progress(id),
    hasHad: (id) => world.milestones.hasHad(id),
    item: drawItemIcon,
  };
  const pets: PetApi = {
    pet: (id) => ({
      name: world.pets.nameOf(id),
      wearing: world.pets.wearing(id),
      walking: world.pets.walking === id,
    }),
    pat(id) {
      sound.cue(CUES.heart);
      return world.petCare.patPet(id);
    },
    rename(id, name) {
      changed();
      return world.petCare.rename(id, name);
    },
    walk(id, on) {
      changed();
      world.petCare.walkWith(on ? id : null);
    },
    indoors: () => world.scene === 'home',
    accessories: () => world.pets.accessories,
    dress(id, accessory) {
      changed();
      world.petCare.dress(id, accessory);
    },
    hasBone: () => world.bag.count('fibisBone') > 0,
    returnBone() {
      changed();
      return world.petCare.returnBone();
    },
    endPet: () => world.petCare.endPet(),
    portrait: drawPetPortrait,
    accessoryIcon: drawAccessoryIcon,
  };
  const mystery: MysteryApi = {
    foundOn: (id) => world.casebook.foundOn(id),
    suspects: () => suspectsOf(world.casebook.found),
    portrait: drawPortrait,
  };
  const quick: QuickApi = {
    held: () => world.hands.held,
    seeds: () => holdablesIn(world),
    hold(held) {
      if (world.hands.hold(held)) changed();
    },
    shown: () => world.zones.outdoor(world.scene) !== undefined,
    onChange(listener) {
      const stops = [
        world.events.on('held', listener),
        world.events.on('bag', listener),
        world.events.on('scene', listener),
        world.events.on('broom', listener),
      ];
      return () => stops.forEach((stop) => stop());
    },
    toolIcon: drawToolIcon,
    itemIcon: drawItemIcon,
    hasBroom: () => world.broom.has,
    flyHome() {
      if (world.broom.flyHome()) changed();
    },
    broomIcon: (canvas) => drawBroomIcon(canvas, world.broom.look),
  };
  paintRod(readRodColour());
  const rod: RodApi = {
    colour: paintedRod,
    paint(colour) {
      paintRod(colour);
      writeRodColour(colour);
    },
    icon: drawRodIcon,
  };
  const broom: BroomApi = {
    look: () => world.broom.look,
    dress(look) {
      if (world.broom.dress(look)) changed();
    },
    backTo() {
      const zone = world.broom.backTo;
      return zone ? ZONES[zone].name : null;
    },
    flyBack() {
      if (world.broom.flyBack()) changed();
    },
    icon: drawBroomIcon,
  };
  const bed: BedApi = {
    look() {
      const at = world.garden.looking;
      return at && at.zone === world.scene ? world.garden.look(at, world.hands.held) : null;
    },
    go(job) {
      const at = world.garden.looking;
      if (at) world.tendBed(at, job);
    },
    close: () => world.garden.lookAt(null),
    picture(canvas) {
      const at = world.garden.looking;
      return at ? drawBedPicture(canvas, world, at) : false;
    },
    onChange(listener) {
      const stops = [
        world.events.on('bed', listener),
        world.events.on('held', listener),
        world.events.on('bag', listener),
        world.events.on('scene', listener),
      ];
      return () => stops.forEach((stop) => stop());
    },
    itemIcon: drawItemIcon,
  };
  const map: MapApi = {
    places: () => world.travel.places(),
    waysOut: () => world.travel.waysOut(),
    go: (id) => world.travel.go(id),
  };
  const notices: NoticeApi = {
    notices: () => world.noticeboard.notices(),
    wanted: () => world.shops.wanted(),
    posters: () => world.noticeboard.posters(),
    bag: () => world.bag.spares,
    answer(slot) {
      const answered = world.noticeboard.answer(slot);
      if (answered) play([answered]);
      return answered !== null;
    },
    icon: drawItemIcon,
    portrait: drawPortrait,
  };
  const stall: StallApi = {
    stall: () => world.stall.view(),
    wares: () => world.bag.spares.filter((s) => stallTakes(s.id)),
    price: sellValue,
    leave(item, count) {
      changed();
      return world.stall.leave(item, count);
    },
    takeBack(item) {
      changed();
      return world.stall.takeBack(item);
    },
    icon: drawItemIcon,
  };
  const fair: FairApi = {
    candy: () => world.wallet.candy,
    round: (id) => world.activities.round(id),
    start: (id) => world.activities.start(id),
    toss(id, target) {
      changed();
      return world.activities.toss(id, target);
    },
    readToday: () => world.activities.readToday,
    readFortune() {
      changed();
      return world.activities.readFortune();
    },
    menu: (id) => world.activities.menu(id),
    buy(id, item) {
      changed();
      return world.activities.buy(id, item);
    },
    count: (item) => world.bag.count(item),
    icon: drawItemIcon,
    reader(canvas) {
      if (world.neighbourhood.neighbour('agatha').zone === 'fortuneTent') {
        drawPortrait(canvas, 'agatha');
      } else drawFixtureIcon(canvas, 'fortuneTable');
    },
  };
  const calendar: CalendarApi = {
    today: () => world.calendar.today(),
    month: (year, month) => world.calendar.month(year, month),
    comingUp: () => world.calendar.comingUp(),
    mark: drawCalendarMark,
    plain: drawPlainMark,
    birthdays: () => [...VILLAGER_IDS],
    onChange: (listener) => world.events.on('today', listener),
  };
  const title: TitleApi = {
    art: (canvas) => drawTitleScene(canvas, world.wardrobe.look),
    dedication: DEDICATION,
    festival: () => {
      const { festival } = world.calendar.today();
      if (!festival) return null;
      const row = CALENDAR[festival.id];
      return { name: `${row.icon} ${row.name}`, countdown: `${countdown(festival)}!` };
    },
  };
  const notes: NotesApi = {
    name: () => world.wardrobe.look.name,
    hasTown: () => world.wardrobe.created,
  };
  return {
    title,
    notes,
    stall,
    fair,
    looks,
    bag,
    fresh,
    quick,
    broom,
    rod,
    bed,
    farm,
    shop,
    home,
    display,
    craft,
    stove,
    talk,
    neighbours,
    mail,
    cabinet,
    pets,
    mystery,
    map,
    calendar,
    notices,
  };
}
