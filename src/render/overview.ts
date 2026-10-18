import { TILE_SIZE } from '../config/world';
import { PROP_FOOTPRINT, type MapSource } from '../data/maps';
import { ZONES } from '../data/zones';
import type { Entry } from '../sprites/catalogue';
import { BED_FORMS, patchLook } from '../sprites/flowerBeds';

import { rasterize, type Raster } from '../sprites/sprite';
import { formOf } from '../sprites/terrain';
import { seasonLook, seasonPieces } from '../sprites/seasons';
import { GROUND_LOOKS, type GroundLookId } from '../data/seasons';
import { parseMap, tileAt } from '../systems/grid';
import type { MapZoneId } from '../types/ids';
import type { ClutterRule } from '../data/clutter';
import { CLUTTER } from '../data/clutter';
import { DECAL_ART, DECAL_PALETTE } from '../sprites/clutter';
import { decalsOf } from './clutter';
import { lawnOf } from './lawn';

/**
 * A place outdoors drawn whole, as the game lays it but without the light, the shadows or anyone
 * in it: the ground and its clutter, the flowers and every prop, for judging a layout at a glance
 * (`npm run sprite -- 'place:*'`). Pure, so it runs in Node as well as the browser.
 */
export function overview(
  source: MapSource,
  clutter: readonly ClutterRule[] = [],
  looks: GroundLookId = 'autumn',
): Raster {
  const map = parseMap(source);
  // In a season (V1's L4): its colours, what lies on its lawn and its snow. Autumn is October's.
  const { season, snow = false, hides, adds } = GROUND_LOOKS[looks];
  const width = map.width * TILE_SIZE;
  const height = map.height * TILE_SIZE;
  const data = new Uint8ClampedArray(width * height * 4);
  const blit = (r: Raster, left: number, top: number) => {
    for (let j = 0; j < r.height; j++) {
      const y = top + j;
      if (y < 0 || y >= height) continue;
      for (let i = 0; i < r.width; i++) {
        const x = left + i;
        const from = (j * r.width + i) * 4;
        if (x < 0 || x >= width || r.data[from + 3] === 0) continue;
        data.set(r.data.subarray(from, from + 4), (y * width + x) * 4);
      }
    }
  };
  const drawn = new Map<string, Raster>();
  const once = (key: string, draw: () => Raster) => {
    let r = drawn.get(key);
    if (!r) drawn.set(key, (r = draw()));
    return r;
  };

  const at = (tx: number, ty: number) => tileAt(map, tx, ty);
  const lawn = lawnOf(map);
  for (let ty = 0; ty < map.height; ty++) {
    for (let tx = 0; tx < map.width; tx++) {
      for (const p of seasonPieces(at, tx, ty, lawn, season, snow)) {
        blit(
          once(p.key, () => rasterize(p.source, p.palette)),
          tx * TILE_SIZE,
          ty * TILE_SIZE,
        );
      }
    }
  }
  const decals = decalsOf(map, [...clutter, ...adds], (id) => DECAL_ART[id].length);
  for (const d of decals.filter((x) => !hides.includes(x.decal))) {
    const art = DECAL_ART[d.decal][d.look]!;
    const r = once(`decal:${d.decal}:${d.look}`, () => rasterize(art, DECAL_PALETTE));
    blit(r, d.tx * TILE_SIZE, d.ty * TILE_SIZE);
  }
  for (const patch of map.patches) {
    const look = patchLook(map.patches, patch, true, formOf(patch.tx, patch.ty, BED_FORMS));
    const r = once(look.key, () => rasterize(look.source, look.palette));
    blit(r, patch.tx * TILE_SIZE, patch.ty * TILE_SIZE);
  }
  // Newcomers' houses are drawn up on their lots, as they'll be once everyone has moved in.
  const lots = (source.lots ?? []).map((l) => ({
    id: l.prop,
    tx: l.tx,
    ty: l.ty,
    ...PROP_FOOTPRINT[l.prop],
  }));
  const props = [...map.props, ...lots].sort((a, b) => a.ty + a.h - (b.ty + b.h));
  for (const prop of props) {
    const { source, palette, key } = seasonLook(prop, season);
    const r = once(key, () => rasterize(source, palette));
    const footY = (prop.ty + prop.h) * TILE_SIZE;
    blit(r, prop.tx * TILE_SIZE + (prop.w * TILE_SIZE - r.width) / 2, footY - r.height);
  }
  return { width, height, data };
}

/** Every place outdoors, drawn whole, for `npm run sprite`. */
export function placeOverviews(): Entry[] {
  return (Object.keys(ZONES) as (keyof typeof ZONES)[])
    .filter((id): id is MapZoneId => ZONES[id].map !== undefined)
    .flatMap((id) => [
      { name: `place:${id}`, draw: () => overview(ZONES[id].map!, CLUTTER[id]) },
      // Each place in the other seasons (V1's L4): `npm run sprite -- 'season:*:town'`.
      ...SEASON_REVIEW.map((look) => ({
        name: `season:${look}:${id}`,
        draw: () => overview(ZONES[id].map!, CLUTTER[id], look),
      })),
    ]);
}

/** The looks a place is drawn in for review besides its own: winter, spring, summer, November. */
const SEASON_REVIEW: readonly GroundLookId[] = ['winter', 'spring', 'summer', 'lateAutumn'];
