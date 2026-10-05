import { photoOf } from './render/photo';
import type { Tile } from './systems/pathfinding';
import {
  galleryRequested,
  dayRequested,
  hourRequested,
  manualLoopRequested,
  titleSkipped,
  weatherRequested,
} from './config/flags';
import { mountHud } from './hud/Hud';
import type { SaveApi } from './hud/SettingsSheet';
import { newSave, saveService, type SaveState } from './persistence';
import { AutoSaver } from './persistence/autosave';
import { decodeBackup, encodeBackup } from './persistence/backup';
import { requestPersistence, runningStandalone } from './persistence/persist';
import { registerServiceWorker } from './pwa';
import { voiceOf } from './audio/cues';
import { musicFor, tuneOf, type MusicKey } from './audio/music';
import { SoundBoard } from './audio/SoundBoard';
import { showGallery } from './render/gallery';
import { fitPixelScale, placeBetweenBars } from './render/pixelScale';
import { HomeView } from './render/HomeView';
import { RoomView } from './render/RoomView';
import { playerDrawable, type SceneView } from './render/scene';
import { OutdoorView } from './render/OutdoorView';
import { clockFromDay, clockFromHour, dayKey, systemClock, windowOf } from './systems/clock';
import { specialDayOf } from './systems/friendship';
import { visitLine } from './hud/messages';
import type { Welcome } from './world/services/Visits';
import type { DebugView } from './types/debugView';
import type { ZoneId } from './types/ids';
import { fromSave, tileOf, World, type WorldEvent } from './world/World';
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
  const weather = weatherRequested(location.search);
  const day = import.meta.env.DEV ? dayRequested(location.search) : null;
  const clock = !import.meta.env.DEV
    ? systemClock
    : day !== null
      ? clockFromDay(day, hour)
      : hour !== null
        ? clockFromHour(hour)
        : systemClock;
  const world = new World({ clock, ...fromSave(loaded) });
  // Each place's view is made the first time she goes there, and kept; a view she has left rests,
  // letting go of its ground until she's back.
  const views = new Map<ZoneId, SceneView>();
  let shown: SceneView | null = null;
  const view = (): SceneView => {
    const zone = world.scene;
    let made = views.get(zone);
    if (!made) {
      const room = world.zones.inside(zone);
      const outdoors = world.zones.outdoor(zone);
      if (zone === 'home') made = new HomeView(world, canvas, { hour });
      else if (room) made = new RoomView(world, room, canvas, { hour });
      else made = new OutdoorView(world, outdoors!, canvas, { hour, weather, fountainBeat });
      views.set(zone, made);
    }
    if (made !== shown) {
      shown?.rest?.();
      shown = made;
    }
    return made;
  };
  const sound = new SoundBoard();
  sound.listen(root);
  let musicKey: MusicKey | null = null;
  const music = () => {
    musicKey = musicFor(world.scene, windowOf(clock.now()), {
      festivals: world.holidays.festivals(),
      decor: world.holidays.decor(),
      fountain: world.fountain.playing(),
      special: specialDayOf(dayKey(clock.now())),
    });
    sound.setMusic(musicKey);
  };
  music();
  // The fountain's lights pulse to its music box, on the beat it's playing, or (with the music
  // off) to the beat it would be (0.2's H2).
  const fountainBeat = (): number | null => {
    if (!musicKey?.endsWith('@musicBox')) return null;
    const heard = sound.musicPlaying === musicKey ? sound.musicBeat() : null;
    return heard ?? (performance.now() / 60_000) * tuneOf(musicKey).bpm;
  };
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
  world.events.on('yard', () => autosave.markDirty());
  const changed = () => autosave.markDirty();
  const waiting: Waiting = { bed: null };
  const snapshot = (tiles: readonly Tile[]) => photoOf(canvas, view(), tiles);
  const play = (events: WorldEvent[]) =>
    playMoments(events, { world, hud, sound, changed, waiting, snapshot });
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
  // Cody's greeting, with what today's visit brought (decisions.md 24, 114, 115).
  const greet = ({ greeting, visit }: Welcome) => {
    hud.greet({
      from: 'cody',
      line: greeting.line,
      reply: greeting.reply,
      ...(visit && { gift: visitLine(visit.count, visit.gift) }),
      ...(greeting.after && { after: greeting.after }),
      ...(greeting.kind === 'redOne' && { redOne: true }),
    });
    changed();
  };
  // No look yet means she hasn't met the creator: a new game, or a save from before phase 3. Once
  // she has, Cody says hello; after that, he welcomes her back each time.
  const enter = () => {
    if (!world.wardrobe.created) {
      hud.openCreator(() => {
        autosave.flush();
        const welcome = world.visits.welcome(null);
        greet(welcome);
        sound.cue(voiceOf('cody', welcome.greeting.line));
      });
    } else {
      greet(world.visits.welcome(loaded?.lastPlayedAt ?? null));
    }
  };
  // The title screen first, every time (phase V), then the mayor's notes on a new version
  // (decision 142); a dev build's `?skiptitle` goes straight in.
  if (import.meta.env.DEV && titleSkipped(location.search)) enter();
  else hud.openTitle(() => hud.whatsNew(enter));

  // The world is drawn in the room between the bars (0.2's U1), from a whole device pixel.
  const resize = () => {
    const dpr = window.devicePixelRatio;
    const room = placeBetweenBars(
      root.getBoundingClientRect(),
      hud.viewport.getBoundingClientRect(),
      dpr,
    );
    const fit = fitPixelScale(room.width, room.height, dpr);
    canvas.width = fit.width;
    canvas.height = fit.height;
    canvas.style.left = `${room.left}px`;
    canvas.style.top = `${room.top}px`;
    canvas.style.width = `${fit.cssWidth}px`;
    canvas.style.height = `${fit.cssHeight}px`;
    view().draw(performance.now());
  };
  // On the root and the room rather than the window: iOS's toolbar showing and hiding changes the
  // dvh box without a window resize, and the bars grow and shrink as the quick bar comes and goes.
  const resizing = new ResizeObserver(resize);
  resizing.observe(root);
  resizing.observe(hud.viewport);
  resize();

  let press: { id: number; x: number; y: number; at: number; travel: number } | null = null;
  canvas.addEventListener('pointerdown', (e) => {
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

  // A bed's pop-up rides over its bed as the camera eases after her.
  const placeBed = () => {
    const { tx, ty } = tileOf(world.player.x, world.player.y);
    hud.playerAt(view().tileToClient(tx, ty).y);
    const at = world.garden.looking;
    if (!at || at.zone !== world.scene) return;
    const middle = view().tileToClient(at.tx, at.ty);
    const below = view().tileToClient(at.tx, at.ty + 1);
    const height = below.y - middle.y;
    hud.placeBed({ x: middle.x, top: middle.y - height / 2, height });
  };

  const steps = new FixedStep();
  const tick = (stepMs: number) => {
    play(world.update(stepMs));
    music();
    view().follow(stepMs);
  };
  let last = performance.now();
  const frame = (now: number) => {
    const delta = Math.min(now - last, MAX_FRAME_MS);
    last = now;
    if (!manual) steps.advance(delta, tick);
    view().draw(now);
    placeBed();
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
      groundMemory: () => {
        let chunks = 0;
        let bytes = 0;
        for (const v of views.values()) {
          const m = v.groundMemory?.();
          if (!m) continue;
          chunks += m.chunks;
          bytes += m.bytes;
        }
        return { chunks, bytes };
      },
      groundSeams: () => view().groundSeams?.() ?? null,
      seeThroughCrowns: () => view().seeThroughCrowns?.() ?? [],
    };
    Object.assign(window, { world, view: debug, sound });
  }
}
