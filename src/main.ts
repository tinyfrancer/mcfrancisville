import { photoOf } from './render/photo';
import type { Tile } from './systems/pathfinding';
import {
  galleryPage,
  galleryRequested,
  dayRequested,
  hourRequested,
  manualLoopRequested,
  perfRequested,
  titleSkipped,
  weatherRequested,
} from './config/flags';
import { mountHud } from './hud/Hud';
import { tickOnPress } from './hud/dom';
import { saveService } from './persistence';
import { runningStandalone } from './persistence/persist';
import { registerServiceWorker } from './pwa';
import { SoundBoard } from './audio/SoundBoard';
import { showGallery } from './render/gallery';
import { fitPixelScale, fitRoom, placeBetweenBars, TILES_ACROSS } from './render/pixelScale';
import { readCloseness, writeCloseness } from './settings';
import { HomeView } from './render/HomeView';
import { RoomView } from './render/RoomView';
import type { SceneView } from './render/scene';
import { OutdoorView } from './render/OutdoorView';
import { Effects, resolverFor } from './render/effects';
import { Transitions } from './render/transition';
import { feelTap } from './wiring/taps';
import { Chatter } from './wiring/chatter';
import { Pats } from './wiring/codyHome';
import { Hearing } from './wiring/hearing';
import { clockFromDay, clockFromHour, systemClock } from './systems/clock';
import type { ZoneId } from './types/ids';
import { fromSave, tileOf, World, type WorldEvent } from './world/World';
import { sheetApis, type Waiting } from './wiring/apis';
import { saveApi, soundApi } from './wiring/apis/settings';
import { playMoments } from './wiring/moments';
import { keepTown } from './wiring/keeping';
import { enterer } from './wiring/greeting';
import { listenForTaps } from './wiring/touch';
import { Music } from './wiring/music';
import { exposeForDebugging } from './wiring/debug';
import { FixedStep } from './loop';
import { catchErrors } from './errorNotes';
import { showPerf } from './wiring/perf';

/** A frame longer than this is a tab coming back from the background, not a frame to simulate. */
const MAX_FRAME_MS = 100;

/** Her feet are this far below her tile's centre (as `render/scene.ts` stands her). */
const HER_FEET = 14;

const root = document.getElementById('app') as HTMLElement;
const canvas = document.getElementById('game') as HTMLCanvasElement;

// Whatever goes wrong uncaught is noted for Settings to mention, and the game carries on (V1's S3).
catchErrors(window);

if (galleryRequested(location.search)) {
  showGallery(root, galleryPage(location.search));
} else {
  startGame();
}

if (import.meta.env.PROD) registerServiceWorker();

/**
 * The boot sequence, the loop and the views: the town from the save, a view for each place she
 * goes, the HUD over them, and a fixed step. What each sheet asks of the town, the save and the
 * cloud, going in, touch and the dev handles are `wiring/`'s.
 */
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
  // Her phone asking for less motion: the effects calm down, and the reel sweeps gentler (1.0.1).
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const world = new World({ clock, ...fromSave(loaded), slow: reduced });
  // What the moments look like where they happen (V1's E1), shared by every view.
  const effects = new Effects({ reduced });
  // Two neighbours standing together chatter, a bubble at a time (V1's E3).
  const chatter = new Chatter();
  // Cody pats her pets at hers of an evening (V1's P5).
  const pats = new Pats();
  // Between places, an iris on her and her broom seen flying; a wash as the day turns (V1's E4).
  const transitions = new Transitions(canvas, { reduced });
  const ctx = canvas.getContext('2d');
  const leaving = () =>
    transitions.leaving(`${world.scene}:${world.scene === 'home' ? world.home.rooms.here : ''}`);
  // A frame: the view, then over it any transition under way (only then), and where it drew her.
  // A frame drawn after she has gone somewhere, before its moment plays, keeps the one she left.
  const drawFrame = (now: number) => {
    leaving();
    view().draw(now);
    const cam = view().cameraOrigin();
    const { x, y } = world.player;
    transitions.seen({ x: x - cam.x, y: y + HER_FEET - cam.y });
    if (ctx) transitions.draw(ctx);
  };
  // The place's ambience and her footsteps (V1's S1).
  const hearing = new Hearing();
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
      if (zone === 'home') made = new HomeView(world, canvas, { hour, weather, effects });
      else if (room) made = new RoomView(world, room, canvas, { hour, effects });
      else {
        const options = { hour, weather, fountainBeat: music.fountainBeat, effects };
        made = new OutdoorView(world, outdoors!, canvas, options);
      }
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
  // What plays, told where she is (decisions 172, 173), after every step.
  const music = new Music(world, sound, clock);
  music.play();
  const manual = import.meta.env.DEV && manualLoopRequested(location.search);

  // Saved as she plays and kept in the cloud (decision 323); the HUD, made below, is read late.
  const keeping = keepTown(world, loaded, () => hud);
  const { autosave } = keeping;
  let closeness = readCloseness();
  // The ?perf corner (V1's S3): her phone's frame times, from her first tap.
  const perf = perfRequested(location.search) ? showPerf(root) : null;
  // A piece moved while decorating is no moment in `update`'s list, but it's worth keeping.
  world.events.on('home', () => autosave.markDirty());
  world.events.on('yard', () => autosave.markDirty());
  const changed = () => autosave.markDirty();
  const waiting: Waiting = { bed: null };
  const snapshot = (tiles: readonly Tile[]) => photoOf(canvas, view(), tiles);
  const play = (events: WorldEvent[]) =>
    playMoments(events, { world, hud, sound, changed, waiting, snapshot, effects, transitions });
  const hud = mountHud(root, {
    save: saveApi(keeping),
    sound: soundApi(sound),
    view: {
      closeness: () => closeness,
      setCloseness(chosen) {
        closeness = chosen;
        writeCloseness(chosen);
        resize();
      },
    },
    ...sheetApis({ world, sound, changed, play, waiting }),
    standalone: runningStandalone(),
  });
  // Every button in the HUD ticks softly as it's pressed (V1's S1).
  tickOnPress(root, () => sound.uiTick());
  const lastPlayedAt = loaded?.lastPlayedAt ?? null;
  const enter = enterer({ world, hud, sound, keeping, lastPlayedAt, changed });
  // The title screen first, every time (phase V), then the mayor's notes on a new version
  // (decision 142); a dev build's `?skiptitle` goes straight in.
  if (import.meta.env.DEV && titleSkipped(location.search)) {
    keeping.pastTitle();
    enter();
  } else hud.openTitle(() => hud.whatsNew(() => keeping.afterCloud(enter)));

  // The world is drawn in the room between the bars (0.2's U1), from a whole device pixel, as
  // close as she chose (decision 290); a room indoors is fitted to show it whole.
  const indoors = () =>
    world.scene === 'home' ? world.home.rooms.room : world.zones.inside(world.scene)?.room;
  const fitFor = () => {
    const inside = indoors();
    return `${closeness}:${inside ? `${inside.width}x${inside.height}` : 'out'}`;
  };
  let fitted = '';
  const resize = () => {
    // Refitted for a place she has just gone to: the frame she left is kept before it's cleared.
    leaving();
    const dpr = window.devicePixelRatio;
    const room = placeBetweenBars(
      root.getBoundingClientRect(),
      hud.viewport.getBoundingClientRect(),
      dpr,
    );
    const inside = indoors();
    const tiles = TILES_ACROSS[closeness];
    const fit = inside
      ? fitRoom(room.width, room.height, dpr, inside, tiles)
      : fitPixelScale(room.width, room.height, dpr, tiles);
    fitted = fitFor();
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

  listenForTaps(
    canvas,
    (x, y) => feelTap(view().tap(x, y), { world, effects, sound }),
    () => perf?.start(),
  );

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
    music.play();
    if (fitFor() !== fitted) resize();
    view().follow(stepMs);
    effects.walking(world.scene, world.player, world.zones.outdoor(world.scene) !== undefined);
    chatter.show(world, effects);
    pats.show(world, effects);
    hearing.step(world, sound, clock.now());
    effects.step(stepMs, resolverFor(world));
    transitions.step(stepMs);
  };
  let last = performance.now();
  const frame = (now: number) => {
    const started = performance.now();
    const delta = Math.min(now - last, MAX_FRAME_MS);
    last = now;
    if (!manual) steps.advance(delta, tick);
    if (fitFor() !== fitted) resize();
    drawFrame(now);
    placeBed();
    perf?.frame(now, performance.now() - started);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  if (import.meta.env.DEV) {
    exposeForDebugging({
      world,
      sound,
      steps,
      tick,
      drawFrame,
      view,
      views,
      autosave,
      effects,
      transitions,
    });
  }
}
