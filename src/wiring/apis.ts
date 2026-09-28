import type { BagApi, FreshApi } from '../hud/BagSheet';
import type { CabinetApi } from '../hud/CabinetSheet';
import type { MysteryApi } from '../hud/CorkboardSheet';
import type { CraftApi } from '../hud/CraftSheet';
import type { HomeApi } from '../hud/HomeSheets';
import type { HudOptions } from '../hud/Hud';
import type { MailApi } from '../hud/MailSheet';
import type { MapApi } from '../hud/MapSheet';
import { madeToast } from '../hud/messages';
import type { PetApi } from '../hud/PetSheet';
import type { QuickApi } from '../hud/QuickBar';
import type { LookApi } from '../hud/pickers';
import type { FarmApi } from '../hud/SeedSheet';
import type { ShopApi } from '../hud/ShopSheet';
import type { TalkApi } from '../hud/TalkSheet';
import { CUES, voiceOf } from '../audio/cues';
import type { SoundBoard } from '../audio/SoundBoard';
import { ITEMS } from '../data/items';
import { OUTFITS } from '../data/outfits';
import { drawSilhouette } from '../render/critters';
import { drawDollPreview, drawWornDetail } from '../render/doll';
import { drawFurnitureIcon, drawSurfaceIcon } from '../render/furniture';
import { drawItemIcon, drawToolIcon } from '../render/items';
import { drawAccessoryIcon, drawPetPortrait } from '../render/pets';
import { drawRecipeIcon } from '../render/recipes';
import { drawPortrait } from '../render/villagers';
import { hourOf } from '../systems/clock';
import { isOut, likesWeather } from '../systems/critters';
import { suspectsOf } from '../systems/mystery';
import type { Tile } from '../systems/pathfinding';
import { sellValue } from '../systems/shop';
import { wear } from '../systems/wardrobe';
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
  bed: Tile | null;
}

/** The seeds in her bag. */
export function seedsIn(world: World): Stack[] {
  return world.bag.contents.filter((s) => ITEMS[s.id].kind === 'seed');
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
    icon: drawItemIcon,
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
      const planted = world.garden.plant(bed.tx, bed.ty, seed);
      waiting.bed = null;
      if (planted) play([planted]);
    },
  };
  const shop: ShopApi = {
    candy: () => world.wallet.candy,
    onCandy: (listener) => world.events.on('candy', listener),
    stock: (id) => world.shops.stock(id),
    bag: () => world.bag.contents,
    owns: (ware) => world.belongings.owns(ware),
    sellValue,
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
  };
  const craft: CraftApi = {
    recipes: () => world.workbench.recipes,
    cantMake: (id) => world.workbench.cantMake(id),
    count: (item) => world.bag.count(item),
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
  const talk: TalkApi = {
    hearts: (id) => world.friends.hearts(id),
    talk(id) {
      changed();
      const chat = world.neighbourhood.talk(id);
      sound.cue(voiceOf(id, chat.line));
      return chat;
    },
    bag: () => world.bag.contents,
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
    portrait: drawPortrait,
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
      outNow: isOut(id, hourOf(world.clock.now())) && likesWeather(id, world.weather.today()),
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
    seeds: () => seedsIn(world),
    hold(held) {
      if (world.hands.hold(held)) changed();
    },
    shown: () => world.zones.outdoor(world.scene) !== undefined,
    onChange(listener) {
      const stops = [
        world.events.on('held', listener),
        world.events.on('bag', listener),
        world.events.on('scene', listener),
      ];
      return () => stops.forEach((stop) => stop());
    },
    toolIcon: drawToolIcon,
    itemIcon: drawItemIcon,
  };
  const map: MapApi = {
    places: () => world.travel.places(),
    go: (id) => world.travel.go(id),
  };
  return {
    looks,
    bag,
    fresh,
    quick,
    farm,
    shop,
    home,
    craft,
    talk,
    mail,
    cabinet,
    pets,
    mystery,
    map,
  };
}
