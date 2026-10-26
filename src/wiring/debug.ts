import type { SoundBoard } from '../audio/SoundBoard';
import type { FixedStep } from '../loop';
import type { AutoSaver } from '../persistence/autosave';
import type { Effects } from '../render/effects';
import { playerDrawable, type SceneView } from '../render/scene';
import type { Transitions } from '../render/transition';
import { stanceOf } from '../systems/neighbourLife';
import type { DebugView } from '../types/debugView';
import type { ZoneId } from '../types/ids';
import type { World } from '../world/World';

/** What a dev build's handles reach: the loop, the views and what's drawn over them. */
export interface Debugging {
  world: World;
  sound: SoundBoard;
  steps: FixedStep;
  tick: (stepMs: number) => void;
  drawFrame: (now: number) => void;
  view: () => SceneView;
  views: ReadonlyMap<ZoneId, SceneView>;
  autosave: AutoSaver;
  effects: Effects;
  transitions: Transitions;
}

/**
 * A dev build's handles on `window` (CLAUDE.md, "Dev handles"): `world`, `view` (a `DebugView`,
 * which cranks the loop under `?loop=manual` and reads what's drawn) and `sound`.
 */
export function exposeForDebugging(d: Debugging): void {
  const { world, sound, steps, tick, drawFrame, view, views, autosave, effects, transitions } = d;
  const debug: DebugView = {
    step(deltaMs, frames = 1) {
      for (let i = 0; i < frames; i++) steps.advance(deltaMs, tick);
      drawFrame(performance.now());
    },
    draw: () => drawFrame(performance.now()),
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
    effects: () => ({
      shown: effects.shown(),
      particles: effects.particles(world.scene),
      footprints: effects.footprints(world.scene),
      perched: effects.perched(),
      fireflies: effects.fireflyCount(world.scene),
    }),
    cawed: () => world.delights.cawed(),
    rainbow: () => world.weather.rainbow(),
    transition: () => transitions.state(),
    motion: () => view().motion?.() ?? { props: [], flyers: 0, leaves: 0 },
    season: () => view().seasonNow?.() ?? null,
    figures: () =>
      world.neighbourhood.neighboursIn(world.scene).map((n) => ({
        id: n.id,
        moving: n.moving,
        stance: JSON.stringify(
          stanceOf({ ...n, seated: n.seat !== null }, performance.now()) ?? 'walking',
        ),
      })),
    faces: () => ({
      her: world.poses.face(),
      neighbours: world.neighbourhood
        .neighboursIn(world.scene)
        .map((n) => ({ id: n.id, feel: world.talk.feelingOf(n.id) ?? world.snow.feelingOf(n.id) })),
    }),
  };
  Object.assign(window, { world, view: debug, sound });
}
