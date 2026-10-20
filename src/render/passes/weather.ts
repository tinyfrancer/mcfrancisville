import type { World } from '../../world/World';
import { drawFireworks } from '../holidays';
import { drawMeteors } from '../meteors';
import { drawFlash, drawSnow, drawWeatherAir, drawWeatherGround } from '../weather';
import { REDUCED, type Pass } from './pass';

/**
 * The weather and what's in the sky (phase L, phase U, V1's R3): rain's splashes on the ground,
 * the rain or fog in the air over everything standing, snow falling (winter's rain, a holiday's or
 * a snow day's), and over the light the fireworks, a meteor shower after dark and a storm's flash,
 * which only the day's own weather brings (`asked`, the page's `?weather=`, has none).
 */
export function weatherPass(world: World, asked: boolean): Pass {
  return {
    name: 'weather',
    ground(ctx, { weather, snowing, cam, nowMs }) {
      if (!snowing) drawWeatherGround(ctx, weather, cam, nowMs);
    },
    over(ctx, { weather, snowing, cam, nowMs }) {
      if (!snowing) drawWeatherAir(ctx, weather, cam, nowMs);
      const sky = world.holidays.sky();
      // A rare event's sky (V1's R3): a snow day's snow, or a meteor shower after dark.
      const rareSky = world.rareEvents.sky();
      if (sky === 'snow' || snowing || rareSky === 'snow') drawSnow(ctx, cam, nowMs);
    },
    lit(ctx, { cam, nowMs }) {
      if (world.holidays.sky() === 'fireworks') drawFireworks(ctx, cam, nowMs);
      if (world.rareEvents.sky() === 'meteors') drawMeteors(ctx, cam, nowMs);
      if (!asked) drawFlash(ctx, world.weather.sinceFlash(), REDUCED());
    },
  };
}
