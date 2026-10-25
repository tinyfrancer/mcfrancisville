import type { SkyApi } from '../../hud/SkySheet';
import { drawConstellationMark } from '../../render/items';
import { drawSky, starPoints, starTapped } from '../../render/stargazing';
import { dayKey } from '../../systems/clock';
import type { ApiWiring, SheetApis } from './shared';

/** The night sky through a telescope (1.5's G4). */
export function skyApis({ world, changed }: ApiWiring): Pick<SheetApis, 'sky'> {
  const sky: SkyApi = {
    tonight: () => world.stargazing.tonight(),
    tracedOn: (id) => world.stargazing.tracedOn(id),
    begin: (id) => world.stargazing.begin(id) !== null,
    trace: () => world.stargazing.trace,
    tap(id, fx, fy) {
      const star = starTapped(id, fx, fy);
      if (star === null) return null;
      const result = world.stargazing.tap(star);
      if (result?.kind === 'done') changed();
      return result;
    },
    stage: (canvas, shape) =>
      drawSky(canvas, {
        day: dayKey(world.clock.now()),
        nowMs: performance.now(),
        shape,
        showers: world.stargazing.tonight().showers,
      }),
    mark: drawConstellationMark,
    points: starPoints,
    now: () => performance.now(),
  };
  return { sky };
}
