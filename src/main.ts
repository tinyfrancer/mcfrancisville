import { galleryRequested, hourRequested, manualLoopRequested } from './config/flags';
import { mountHud } from './hud/Hud';
import { WELCOMES } from './data/specialDays';
import type { SaveApi } from './hud/SettingsSheet';
import { newSave, saveService, type SaveState } from './persistence';
import { AutoSaver } from './persistence/autosave';
import { decodeBackup, encodeBackup } from './persistence/backup';
import { requestPersistence, runningStandalone } from './persistence/persist';
import { registerServiceWorker } from './pwa';
import { MUSIC, voiceOf } from './audio/cues';
import { SoundBoard } from './audio/SoundBoard';
import { showGallery } from './render/gallery';
import { fitPixelScale } from './render/pixelScale';
import { HomeView } from './render/HomeView';
import { RoomView } from './render/RoomView';
import { playerDrawable, type SceneView } from './render/scene';
import { OutdoorView } from './render/OutdoorView';
import { clockFromHour, dayKey, systemClock } from './systems/clock';
import { welcomeLine } from './systems/friendship';
import type { DebugView } from './types/debugView';
import type { ZoneId } from './types/ids';
import { fromSave, World, type WorldEvent } from './world/World';
import { sheetApis, type Waiting } from './wiring/apis';
import { playMoments } from './wiring/moments';
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
  // Each place's view is made the first time she goes there, and kept: its ground is baked once.
  const views = new Map<ZoneId, SceneView>();
  const view = (): SceneView => {
    const zone = world.scene;
    let made = views.get(zone);
    if (!made) {
      const room = world.zones.inside(zone);
      const outdoors = world.zones.outdoor(zone);
      if (zone === 'home') made = new HomeView(world, canvas, { hour });
      else if (room) made = new RoomView(world, room, canvas, { hour });
      else made = new OutdoorView(world, outdoors!, canvas, { hour });
      views.set(zone, made);
    }
    return made;
  };
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
  // A piece moved while decorating is no moment in `update`'s list, but it's worth keeping.
  world.events.on('home', () => autosave.markDirty());
  const changed = () => autosave.markDirty();
  const waiting: Waiting = { bed: null };
  const play = (events: WorldEvent[]) =>
    playMoments(events, { world, hud, sound, changed, waiting });
  const hud = mountHud(root, {
    save: saveApi,
    sound: {
      effects: () => sound.effects,
      music: () => sound.musicOn,
      setEffects: (on) => sound.setEffectsOn(on),
      setMusic: (on) => sound.setMusicOn(on),
    },
    ...sheetApis({ world, sound, changed, play, waiting }),
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

  const steps = new FixedStep();
  const tick = (stepMs: number) => {
    play(world.update(stepMs));
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
