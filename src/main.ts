import { galleryRequested, hourRequested, manualLoopRequested } from './config/flags';
import type { BagApi } from './hud/BagSheet';
import { mountHud } from './hud/Hud';
import { eventToast, FARM_SIGN, NO_SEEDS } from './hud/messages';
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
import { drawDollPreview, drawWornDetail } from './render/doll';
import { drawItemIcon } from './render/items';
import { showGallery } from './render/gallery';
import { fitPixelScale } from './render/pixelScale';
import { TownView } from './render/TownView';
import { clockFromHour, systemClock } from './systems/clock';
import { sellValue } from './systems/shop';
import { wear } from './systems/wardrobe';
import type { DebugView } from './types/debugView';
import { Town, type WorldEvent } from './world/Town';

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
  const town = new Town({
    clock: import.meta.env.DEV && hour !== null ? clockFromHour(hour) : systemClock,
    player: loaded?.player,
    closet: loaded ?? undefined,
    finds: loaded ?? undefined,
    beds: loaded?.beds,
    candy: loaded?.candy,
  });
  const view = new TownView(town, canvas, { hour });
  const manual = import.meta.env.DEV && manualLoopRequested(location.search);

  // What was loaded is kept so `createdAt` survives; the rest is rebuilt from the town each save.
  let save: SaveState = loaded ?? newSave(Date.now(), town.snapshot());
  const currentSave = (): SaveState => {
    const now = Date.now();
    save = {
      ...save,
      updatedAt: now,
      lastPlayedAt: now,
      player: town.snapshot(),
      ...town.wardrobe.snapshot(),
      ...town.finds(),
      ...town.garden(),
      ...town.wallet(),
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
    look: () => town.wardrobe.look,
    owned: () => town.wardrobe.owned,
    apply(look) {
      town.wardrobe.setLook(look);
      autosave.markDirty();
    },
    preview: drawDollPreview,
  };
  const bag: BagApi = {
    contents: () => town.bag.contents,
    icon: drawItemIcon,
    onChange: (listener) => town.events.on('bag', listener),
  };
  // The bed she's standing at, waiting for her to pick a seed.
  let emptyBed: { tx: number; ty: number } | null = null;
  const seeds = () => town.bag.contents.filter((s) => ITEMS[s.id].kind === 'seed');
  const farm: FarmApi = {
    seeds,
    icon: drawItemIcon,
    plant(seed) {
      if (!emptyBed) return;
      const planted = town.plant(emptyBed.tx, emptyBed.ty, seed);
      emptyBed = null;
      if (planted) onWorldEvents([planted]);
    },
  };
  const shop: ShopApi = {
    candy: () => town.candy,
    onCandy: (listener) => town.events.on('candy', listener),
    stock: (id) => town.stock(id),
    bag: () => town.bag.contents,
    owns: (outfit) => town.wardrobe.owned.includes(outfit),
    sellValue,
    buy(id, ware) {
      const bought = town.buy(id, ware);
      if (bought) onWorldEvents([bought]);
      return bought !== null;
    },
    sell(item, count) {
      const sold = town.sell(item, count);
      if (sold) onWorldEvents([sold]);
      return sold !== null;
    },
    icon: drawItemIcon,
    tryOn(canvas, outfit) {
      const owned = [...town.wardrobe.owned, outfit];
      drawWornDetail(canvas, wear(town.wardrobe.look, outfit, owned), OUTFITS[outfit].slot);
    },
  };
  const hud = mountHud(root, {
    save: saveApi,
    looks,
    bag,
    farm,
    shop,
    standalone: runningStandalone(),
  });
  // No look yet means she hasn't met the creator: a new game, or a save from before phase 3.
  if (!town.wardrobe.created) hud.openCreator(() => autosave.flush());

  const resize = () => {
    const fit = fitPixelScale(root.clientWidth, root.clientHeight, window.devicePixelRatio);
    canvas.width = fit.width;
    canvas.height = fit.height;
    canvas.style.width = `${fit.cssWidth}px`;
    canvas.style.height = `${fit.cssHeight}px`;
    view.draw(performance.now());
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
    if (tap) view.tap(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointercancel', () => (press = null));

  function onWorldEvents(events: WorldEvent[]): void {
    for (const event of events) {
      autosave.markDirty();
      if (event.kind === 'arrived' && event.at === 'salonHouse') hud.openSalon();
      if (event.kind === 'arrived' && event.at === 'shopHouse') hud.openShop('corner');
      if (event.kind === 'arrived' && event.at === 'popUpShop') hud.openShop('popUp');
      if (event.kind === 'arrived' && event.at === 'farmSign') hud.toast(FARM_SIGN);
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

  let last = performance.now();
  const frame = (now: number) => {
    const delta = Math.min(now - last, MAX_FRAME_MS);
    last = now;
    if (!manual) onWorldEvents(town.update(delta));
    view.draw(now);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  if (import.meta.env.DEV) {
    const debug: DebugView = {
      step(deltaMs, frames = 1) {
        for (let i = 0; i < frames; i++) onWorldEvents(town.update(deltaMs));
        view.draw(performance.now());
      },
      tileToClient: (tx, ty) => view.tileToClient(tx, ty),
      cameraOrigin: () => view.cameraOrigin(),
      saveNow: () => autosave.flush(),
    };
    Object.assign(window, { world: town, view: debug });
  }
}
