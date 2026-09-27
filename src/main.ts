import { galleryRequested, hourRequested, manualLoopRequested } from './config/flags';
import type { BagApi } from './hud/BagSheet';
import { mountHud } from './hud/Hud';
import { eventToast, FARM_SIGN, madeToast, NO_SEEDS } from './hud/messages';
import type { CabinetApi } from './hud/CabinetSheet';
import type { MailApi } from './hud/MailSheet';
import type { TalkApi } from './hud/TalkSheet';
import { WELCOMES } from './data/specialDays';
import type { CraftApi } from './hud/CraftSheet';
import type { HomeApi } from './hud/HomeSheets';
import type { FarmApi } from './hud/SeedSheet';
import type { LookApi } from './hud/pickers';
import type { SaveApi } from './hud/SettingsSheet';
import type { ShopApi } from './hud/ShopSheet';
import { ITEMS } from './data/items';
import { OUTFITS } from './data/outfits';
import { newSave, saveService, type SaveState } from './persistence';
import { AutoSaver } from './persistence/autosave';
import { decodeBackup, encodeBackup } from './persistence/backup';
import { requestPersistence, runningStandalone } from './persistence/persist';
import { registerServiceWorker } from './pwa';
import { CUES, cueOf, MUSIC, voiceOf } from './audio/cues';
import { isRecord, RECORD_TUNES } from './audio/records';
import { SoundBoard } from './audio/SoundBoard';
import { drawDollPreview, drawWornDetail } from './render/doll';
import { drawFurnitureIcon, drawSurfaceIcon } from './render/furniture';
import { drawItemIcon } from './render/items';
import { drawAccessoryIcon, drawPetPortrait } from './render/pets';
import type { PetApi } from './hud/PetSheet';
import type { MysteryApi } from './hud/CorkboardSheet';
import { suspectsOf } from './systems/mystery';
import { drawRecipeIcon } from './render/recipes';
import { showGallery } from './render/gallery';
import { fitPixelScale } from './render/pixelScale';
import { HomeView } from './render/HomeView';
import { playerDrawable, type SceneView } from './render/scene';
import { TownView } from './render/TownView';
import { clockFromHour, dayKey, hourOf, systemClock } from './systems/clock';
import { isOut } from './systems/critters';
import { drawSilhouette } from './render/critters';
import { welcomeLine } from './systems/friendship';
import { drawPortrait } from './render/villagers';
import { sellValue } from './systems/shop';
import { wear } from './systems/wardrobe';
import type { DebugView } from './types/debugView';
import type { ZoneId } from './types/ids';
import { fromSave, World, type WorldEvent } from './world/World';
import { FixedStep } from './loop';

/** A frame longer than this is a tab coming back from the background, not a frame to simulate. */
const MAX_FRAME_MS = 100;

/** How far a finger may wander, and how long it may rest, and still be a tap (from the MMO). */
const TAP_SLOP_PX = 8;
const TAP_MAX_MS = 500;

const root = document.getElementById('app') as HTMLElement;
const canvas = document.getElementById('game') as HTMLCanvasElement;

if (galleryRequested(location.search)) {
  showGallery(root);
} else {
  startGame();
}

if (import.meta.env.PROD) registerServiceWorker();

function startGame(): void {
  const loaded = saveService.load();
  const hour = hourRequested(location.search);
  const world = new World({
    clock: import.meta.env.DEV && hour !== null ? clockFromHour(hour) : systemClock,
    ...fromSave(loaded),
  });
  const views: Record<ZoneId, SceneView> = {
    town: new TownView(world, canvas, { hour }),
    home: new HomeView(world, canvas, { hour }),
  };
  const view = () => views[world.scene];
  const sound = new SoundBoard();
  sound.listen(root);
  sound.setMusic(MUSIC);
  const manual = import.meta.env.DEV && manualLoopRequested(location.search);

  // What was loaded is kept so `createdAt` survives; the rest is rebuilt from the town each save.
  let save: SaveState = loaded ?? newSave(Date.now(), world.snapshot());
  const currentSave = (): SaveState => {
    const now = Date.now();
    save = {
      ...save,
      updatedAt: now,
      lastPlayedAt: now,
      ...world.save(),
    };
    return save;
  };
  const autosave = new AutoSaver(() => saveService.save(currentSave()));
  // `pagehide` is the one iOS reliably fires as a Home Screen app is swiped away; a tab being
  // hidden is the last moment anything is guaranteed to run at all.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') autosave.flush();
  });
  window.addEventListener('pagehide', () => autosave.flush());
  const persisted = requestPersistence();

  const saveApi: SaveApi = {
    backupCode: () => encodeBackup(currentSave()),
    async restore(code) {
      const decoded = await decodeBackup(code);
      if (!decoded.ok) return decoded;
      autosave.stop();
      saveService.save(decoded.save);
      location.reload();
      return { ok: true };
    },
    status: async () => ({ persisted: await persisted, standalone: runningStandalone() }),
  };
  const looks: LookApi = {
    look: () => world.wardrobe.look,
    owned: () => world.wardrobe.owned,
    apply(look) {
      world.wardrobe.setLook(look);
      autosave.markDirty();
    },
    preview: drawDollPreview,
  };
  const bag: BagApi = {
    contents: () => world.bag.contents,
    icon: drawItemIcon,
    onChange: (listener) => world.events.on('bag', listener),
  };
  // The bed she's standing at, waiting for her to pick a seed.
  let emptyBed: { tx: number; ty: number } | null = null;
  const seeds = () => world.bag.contents.filter((s) => ITEMS[s.id].kind === 'seed');
  const farm: FarmApi = {
    seeds,
    icon: drawItemIcon,
    plant(seed) {
      if (!emptyBed) return;
      const planted = world.garden.plant(emptyBed.tx, emptyBed.ty, seed);
      emptyBed = null;
      if (planted) onWorldEvents([planted]);
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
      if (bought) onWorldEvents([bought]);
      return bought !== null;
    },
    sell(item, count) {
      const sold = world.shops.sell(item, count);
      if (sold) onWorldEvents([sold]);
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
  // A piece moved while decorating is no moment in `update`'s list, but it's worth keeping.
  world.events.on('home', () => autosave.markDirty());
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
      if (world.home.paper(id)) autosave.markDirty();
    },
    lay(id) {
      if (world.home.lay(id)) autosave.markDirty();
    },
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
      autosave.markDirty();
      return madeToast(made.made).text;
    },
    icon: drawRecipeIcon,
    itemIcon: drawItemIcon,
  };
  const talk: TalkApi = {
    hearts: (id) => world.friends.hearts(id),
    talk(id) {
      autosave.markDirty();
      const chat = world.neighbourhood.talk(id);
      sound.cue(voiceOf(id, chat.line));
      return chat;
    },
    bag: () => world.bag.contents,
    give(id, item) {
      autosave.markDirty();
      const given = world.neighbourhood.give(id, item);
      if (given && !given.declined && given.reaction === 'loved') sound.cue(CUES.heart);
      else if (given) sound.cue(voiceOf(id, given.line));
      return given;
    },
    favour: (id) => world.neighbourhood.favour(id),
    doFavour(id) {
      autosave.markDirty();
      return world.neighbourhood.doFavour(id);
    },
    endTalk: () => world.neighbourhood.endTalk(),
    icon: drawItemIcon,
    portrait: drawPortrait,
  };
  const mail: MailApi = {
    mail: () => world.mailbox.view(),
    open(id) {
      autosave.markDirty();
      return world.mailbox.open(id);
    },
  };
  const cabinet: CabinetApi = {
    critter: (id) => ({
      caughtOn: world.cabinet.caughtOn(id),
      donated: world.cabinet.isDonated(id),
      outNow: isOut(id, hourOf(world.clock.now())),
    }),
    inBag: (id) => world.bag.count(id),
    donate(id) {
      autosave.markDirty();
      return world.collecting.donate(id);
    },
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
      autosave.markDirty();
      return world.petCare.rename(id, name);
    },
    walk(id, on) {
      autosave.markDirty();
      world.petCare.walkWith(on ? id : null);
    },
    indoors: () => world.scene === 'home',
    accessories: () => world.pets.accessories,
    dress(id, accessory) {
      autosave.markDirty();
      world.petCare.dress(id, accessory);
    },
    hasBone: () => world.bag.count('fibisBone') > 0,
    returnBone() {
      autosave.markDirty();
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
  const hud = mountHud(root, {
    save: saveApi,
    sound: {
      effects: () => sound.effects,
      music: () => sound.musicOn,
      setEffects: (on) => sound.setEffectsOn(on),
      setMusic: (on) => sound.setMusicOn(on),
    },
    looks,
    bag,
    farm,
    shop,
    home,
    craft,
    talk,
    mail,
    cabinet,
    pets,
    mystery,
    standalone: runningStandalone(),
  });
  // No look yet means she hasn't met the creator: a new game, or a save from before phase 3. Once
  // she has, Cody says hello; after that, he welcomes her back each time (decisions.md 24).
  if (!world.wardrobe.created) {
    hud.openCreator(() => {
      autosave.flush();
      hud.greet('cody', WELCOMES.first, 'Hi, Cody!');
      sound.cue(voiceOf('cody', WELCOMES.first));
    });
  } else if (loaded) {
    const now = Date.now();
    const line = welcomeLine(now - loaded.lastPlayedAt, dayKey(now), world.name);
    hud.greet('cody', line, 'Hi, Cody!');
  }

  const resize = () => {
    const fit = fitPixelScale(root.clientWidth, root.clientHeight, window.devicePixelRatio);
    canvas.width = fit.width;
    canvas.height = fit.height;
    canvas.style.width = `${fit.cssWidth}px`;
    canvas.style.height = `${fit.cssHeight}px`;
    view().draw(performance.now());
  };
  // On the root rather than the window: iOS's toolbar showing and hiding changes the dvh box
  // without a window resize.
  new ResizeObserver(resize).observe(root);
  resize();

  const title = document.querySelector('.title');
  const fadeTitle = () => title?.classList.add('faded');
  setTimeout(fadeTitle, 2500);

  let press: { id: number; x: number; y: number; at: number; travel: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    fadeTitle();
    if (press) return;
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, at: e.timeStamp, travel: 0 };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id) return;
    press.travel += Math.hypot(e.clientX - press.x, e.clientY - press.y);
    press.x = e.clientX;
    press.y = e.clientY;
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!press || e.pointerId !== press.id) return;
    const tap = press.travel <= TAP_SLOP_PX && e.timeStamp - press.at <= TAP_MAX_MS;
    press = null;
    if (tap) view().tap(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointercancel', () => (press = null));

  function onWorldEvents(events: WorldEvent[]): void {
    for (const event of events) {
      autosave.markDirty();
      const cue = cueOf(event);
      if (cue) sound.cue(CUES[cue]);
      if (event.kind === 'played' && event.record && isRecord(event.record)) {
        sound.playRecord(RECORD_TUNES[event.record]);
      }
      if (event.kind === 'entered' && event.scene === 'town') sound.stopRecord();
      if (event.kind === 'arrived' && event.at === 'salonHouse') hud.openSalon();
      if (event.kind === 'arrived' && event.at === 'shopHouse') hud.openShop('corner');
      if (event.kind === 'arrived' && event.at === 'popUpShop') hud.openShop('popUp');
      if (event.kind === 'arrived' && event.at === 'farmSign') hud.toast(FARM_SIGN);
      if (event.kind === 'arrived' && event.at === 'bakery') hud.openMuseum();
      if (event.kind === 'arrived' && event.at === 'mailbox') hud.openMail();
      if (event.kind === 'arrived' && event.at === 'moonPieCart') hud.openShop('moonPie');
      // With a sheet already up, she can't talk now, so they needn't wait for her.
      if (event.kind === 'arrived' && event.villager && !hud.openTalk(event.villager)) {
        world.neighbourhood.endTalk();
      }
      if (event.kind === 'arrived' && event.pet && !hud.openPet(event.pet)) world.petCare.endPet();
      if (event.kind === 'arrived' && event.at === 'storageChest') hud.openStorage();
      if (event.kind === 'arrived' && event.piece === 'workbench') hud.openWorkbench();
      if (event.kind === 'arrived' && event.piece === 'mysteryCorkboard') hud.openCorkboard();
      if (event.kind === 'tilled' || event.kind === 'bare') {
        emptyBed = { tx: event.tx, ty: event.ty };
        // The sheet says it all; a toast behind it would only be half seen.
        if (seeds().length > 0) {
          hud.openSeeds();
          continue;
        }
        if (event.kind === 'bare') {
          hud.toast(NO_SEEDS);
          continue;
        }
      }
      const toast = eventToast(event);
      if (toast) hud.toast(toast);
    }
  }

  const steps = new FixedStep();
  const tick = (stepMs: number) => {
    onWorldEvents(world.update(stepMs));
    view().follow(stepMs);
  };
  let last = performance.now();
  const frame = (now: number) => {
    const delta = Math.min(now - last, MAX_FRAME_MS);
    last = now;
    if (!manual) steps.advance(delta, tick);
    view().draw(now);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  if (import.meta.env.DEV) {
    const debug: DebugView = {
      step(deltaMs, frames = 1) {
        for (let i = 0; i < frames; i++) steps.advance(deltaMs, tick);
        view().draw(performance.now());
      },
      draw: () => view().draw(performance.now()),
      tileToClient: (tx, ty) => view().tileToClient(tx, ty),
      cameraOrigin: () => view().cameraOrigin(),
      playerDrawnAt: () => {
        const { x, y } = playerDrawable(world);
        return { x, y };
      },
      saveNow: () => autosave.flush(),
    };
    Object.assign(window, { world, view: debug, sound });
  }
}
