import { TILE_SIZE } from '../../config/world';
import { ITEM_ART } from '../../sprites/items';
import { PALETTE } from '../../sprites/palette';
import { tileCentre, type World } from '../../world/World';
import { bakeIcon } from '../items';
import type { Drawable } from '../scene';
import type { Pass } from './pass';

/** The night's snack sits in a small pool of light of its own, so it can be spotted from afar. */
const SNACK_LIGHT = { radius: 36, strength: 0.9 };

/**
 * Tonight's snack, which only ever waits in town (phase O): bobbing gently where it waits, lit so
 * it can't be missed, what she might want behind a crown, and a little star winking above it over
 * the light, so it reads as a treat from across the square.
 */
export function snackPass(world: World, town: boolean): Pass {
  const snack = () => (town ? world.gathering.snack() : null);
  let stood: Drawable[] = [];
  return {
    name: 'snack',
    stand({ nowMs }) {
      const s = snack();
      if (!s) return (stood = []);
      const art = ITEM_ART[s.item];
      const sprite = bakeIcon(`item:${s.item}`, art.source, art.palette);
      const bob = 2 * Math.round(Math.sin(nowMs / 400));
      const x = s.tx * TILE_SIZE;
      const y = s.ty * TILE_SIZE - 6 + bob;
      return (stood = [{ footY: s.ty * TILE_SIZE + 18, sprite, x, y, glow: sprite }]);
    },
    wanted: () => stood,
    lights() {
      const s = snack();
      if (!s) return [];
      const { x, y } = tileCentre(s);
      return [{ x, y: y - 8, radius: SNACK_LIGHT.radius, strength: SNACK_LIGHT.strength }];
    },
    lit(ctx, { cam, nowMs }) {
      const s = snack();
      if (!s || Math.floor(nowMs / 350) % 3 === 0) return;
      const x = s.tx * TILE_SIZE + 26 - cam.x;
      const y = s.ty * TILE_SIZE - 6 - cam.y;
      const px = 2;
      ctx.fillStyle = PALETTE.candleBright;
      ctx.fillRect(x - px, y, px * 3, px);
      ctx.fillRect(x, y - px, px, px * 3);
    },
  };
}
