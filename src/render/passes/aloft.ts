import { monarchsOn } from '../../systems/calendar';
import { dayKey, hourOf } from '../../systems/clock';
import type { World } from '../../world/World';
import type { MapZone } from '../../world/zones/MapZone';
import { butterflyDrawables, fluttersOf } from '../butterflies';
import { leafDrawables, leavesFall } from '../leaves';
import type { Drawable } from '../scene';
import { overheadOn, perchDrawables, skyDrawables } from '../sky';
import { drawOverhead } from '../stargazing';
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

/** How long since the crow on the scarecrow here cawed at her (1.6's X5), or null. */
function cawSince(world: World): number | null {
  const caw = world.delights.cawed();
  return caw ? world.clock.now() - caw.at : null;
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
        ...perchDrawables(scarecrows, nowMs, at, cawSince(world)),
      ];
      count = flyers.length;
      return flyers;
    },
    drawn: () => count,
  };
}

/**
 * The month's constellation faint over the castle hill at night once she has traced it (1.5's
 * G4), fixed to the view as the sky is, over the light so it shines in the dark.
 */
export function starsPass(world: World, zone: MapZone, hour: number | null): Pass {
  return {
    name: 'stars',
    lit(ctx, { weather, nowMs }) {
      const now = world.clock.now();
      const id = overheadOn(
        zone.id,
        dayKey(now),
        hour ?? hourOf(now),
        weather,
        (c) => world.cabinet.tracedOn(c) !== null,
      );
      if (id) drawOverhead(ctx, id, nowMs);
    },
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
