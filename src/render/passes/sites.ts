import { TILE_SIZE } from '../../config/world';
import type { MapZone } from '../../world/zones/MapZone';
import type { World } from '../../world/World';
import type { WorldLight } from '../scene';
import { filmFrame, showing } from './filmNight';
import type { Pass } from './pass';
import { stallLights, standing } from './standing';

/**
 * The houses on the place's lots (phase T), in the square a holiday's piece while its decorations
 * are up (phase U) and film night's screen, and the town's projects as they stand (V1's R4), each
 * with its lamplight.
 */
export function sitesPass(world: World, zone: MapZone): Pass {
  const props = () => [
    ...(zone.lots?.props() ?? []),
    ...(zone.decorations?.props() ?? []),
    ...(zone.sites?.props() ?? []),
  ];
  return {
    name: 'sites',
    stand({ nowMs, season }) {
      const film = filmFrame(world);
      return [
        ...props().map((p) =>
          p.id === 'filmScreen' && film !== null
            ? showing(p, film, season)
            : standing(p, season, nowMs),
        ),
        // A built footbridge is walked on: drawn from its top edge, under anyone on it.
        ...(zone.sites?.flat() ?? []).map((p) => ({
          ...standing(p, season, nowMs),
          footY: p.ty * TILE_SIZE + 1,
        })),
      ];
    },
    lights({ season }) {
      const lights: WorldLight[] = [];
      for (const p of props()) lights.push(...stallLights(p, standing(p, season).sprite, p.id));
      return lights;
    },
  };
}
