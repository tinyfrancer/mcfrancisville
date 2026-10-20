import type { PlacedProp } from '../../systems/grid';
import type { MapZone } from '../../world/zones/MapZone';
import { chimneysOf, drawShimmer, drawSmoke, drawTufts, type Life } from '../life';
import type { Pass } from './pass';

/**
 * What moves over the ground (phase L): glints on the water and swaying long grass on the ground,
 * and over everything standing the smoke from every chimney, the lots' houses' too.
 */
export function lifePass(zone: MapZone): Pass {
  /** The life of the place with the chimneys on its lots, for the lots as they stood last. */
  let lotLife: { lots: readonly PlacedProp[]; life: Life } | null = null;
  /** The place's life with the chimneys of the houses on its lots. */
  const withLots = (life: Life): Life => {
    const lots = zone.lots?.props();
    if (!lots?.length) return life;
    if (lotLife?.lots !== lots) {
      lotLife = { lots, life: { ...life, chimneys: [...life.chimneys, ...chimneysOf(lots)] } };
    }
    return lotLife.life;
  };
  return {
    name: 'life',
    ground(ctx, { life, cam, nowMs, weather, season }) {
      drawShimmer(ctx, life, cam, nowMs, weather === 'rain');
      drawTufts(ctx, life, cam, nowMs, weather === 'rain', season);
    },
    over(ctx, { life, cam, nowMs, weather }) {
      drawSmoke(ctx, withLots(life), cam, nowMs, weather === 'rain');
    },
  };
}
