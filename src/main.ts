import { galleryRequested, hourRequested, manualLoopRequested } from './config/flags';
import { mountHud } from './hud/Hud';
import type { LookApi } from './hud/pickers';
import type { SaveApi } from './hud/SettingsSheet';
import { newSave, saveService, type SaveState } from './persistence';
import { AutoSaver } from './persistence/autosave';
import { decodeBackup, encodeBackup } from './persistence/backup';
import { requestPersistence, runningStandalone } from './persistence/persist';
import { registerServiceWorker } from './pwa';
import { drawDollPreview } from './render/doll';
import { showGallery } from './render/gallery';
import { fitPixelScale } from './render/pixelScale';
import { TownView } from './render/TownView';
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
  const town = new Town({ player: loaded?.player, closet: loaded ?? undefined });
  const view = new TownView(town, canvas, { hour: hourRequested(location.search) });
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
  const hud = mountHud(root, { save: saveApi, looks, standalone: runningStandalone() });
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

  const onWorldEvents = (events: WorldEvent[]) => {
    for (const event of events) {
      if (event.kind !== 'arrived') continue;
      autosave.markDirty();
      if (event.at === 'salonHouse') hud.openSalon();
    }
  };

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
