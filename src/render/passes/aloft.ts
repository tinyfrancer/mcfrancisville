import { monarchsOn } from '../../systems/calendar';
import { dayKey, hourOf } from '../../systems/clock';
import type { World } from '../../world/World';
import type { MapZone } from '../../world/zones/MapZone';
import { butterflyDrawables, fluttersOf } from '../butterflies';
import { leafDrawables, leavesFall } from '../leaves';
import type { Drawable } from '../scene';
import { perchDrawables, skyDrawables } from '../sky';
import type { Pass } from './pass';

/*
 * What's in the air, sorted in among everything standing: the monarchs, crows and bats crossing
 * the sky with a crow on the scarecrow now and then, and autumn's falling leaves (V1's E5). `hour`
 * is the page's `?hour=`, or null for the clock's.
 */

/** A pass that says how many of what it drew the last frame, for the smoke check. */
export interface CountingPass extends Pass {
  drawn(): number;
}

/** The monarchs fluttering about, where the place has any. */
export function butterfliesPass(world: World, zone: MapZone, hour: number | null): Pass {
  const monarchs = monarchsOn(dayKey(world.clock.now()), zone.map.butterflies);
  const flutters = fluttersOf(zone.map, monarchs);
  return {
    name: 'butterflies',
    stand: ({ nowMs }) => butterflyDrawables(flutters, nowMs, hour ?? hourOf(world.clock.now())),
  };
}

/** Crows and bats crossing the sky, and a crow on the scarecrow now and then (V1's E5). */
export function flyersPass(
  world: World,
  zone: MapZone,
  scarecrows: readonly Drawable[],
  hour: number | null,
): CountingPass {
  let count = 0;
  return {
    name: 'flyers',
    stand({ me, cam, canvas, nowMs }) {
      const at = hour ?? hourOf(world.clock.now());
      const her = { x: me.x, y: me.y, w: me.sprite.width, h: me.sprite.height };
      const flyers = [
        ...skyDrawables(zone.id, cam, canvas, her, nowMs, at),
        ...perchDrawables(scarecrows, nowMs, at),
      ];
      count = flyers.length;
      return flyers;
    },
    drawn: () => count,
  };
}

/** Leaves falling under the trees, in autumn (V1's E5). */
export function leavesPass(world: World, shedding: readonly Drawable[]): CountingPass {
  let count = 0;
  return {
    name: 'leaves',
    stand({ nowMs }) {
      const falling = leavesFall(dayKey(world.clock.now())) ? leafDrawables(shedding, nowMs) : [];
      count = falling.length;
      return falling;
    },
    drawn: () => count,
  };
}
