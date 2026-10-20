import { TILE_SIZE } from '../../config/world';
import { bake } from '../../sprites/bake';
import { PROP_ART } from '../../sprites/props';
import type { MapZone } from '../../world/zones/MapZone';
import { glowOf, type Drawable } from '../scene';
import { bakeFigure } from '../villagers';
import type { Pass } from './pass';
import { moved, movingOf, shadowOf, stallLights } from './standing';

/**
 * The pop-up shop, where it stands today. It moves, so unlike the other buildings its shadow is
 * drawn with it rather than baked into the ground.
 */
export function popUpPass(zone: MapZone): Pass {
  const popUp = PROP_ART.popUpShop;
  /** The pop-up shop, baked once and drawn wherever it stands today. */
  const popUpSprite = bake('prop:popUpShop:0', popUp.source, popUp.palette);
  const popUpGlow = popUp.glow
    ? glowOf('glow:popUpShop', popUp.source, popUp.palette, popUp.glow)
    : undefined;
  return {
    name: 'popUp',
    stand({ nowMs }) {
      const lot = zone.stalls?.popUp();
      if (!lot) return [];
      const art = PROP_ART.popUpShop;
      const sprite = popUpSprite;
      const footY = (lot.ty + lot.h) * TILE_SIZE;
      const x = lot.tx * TILE_SIZE + (lot.w * TILE_SIZE - sprite.width) / 2;
      const d: Drawable = {
        footY,
        sprite,
        x,
        y: footY - sprite.height,
        shadow: shadowOf(x + sprite.width / 2, footY, art.shadow),
      };
      if (popUpGlow) d.glow = popUpGlow;
      if (!art.frames) return [d];
      return [moved(d, movingOf(lot, art.source, art.palette, 'prop:popUpShop:0'), nowMs)];
    },
    lights() {
      const popUp = zone.stalls?.popUp();
      return popUp ? stallLights(popUp, popUpSprite, 'popUpShop') : [];
    },
  };
}

/**
 * The Moon Pie Man and his cart, where they are today. He stands behind the counter, which hides
 * him from the waist down.
 */
export function cartPass(zone: MapZone): Pass {
  return {
    name: 'cart',
    stand() {
      const cart = zone.stalls?.moonPieCart();
      if (!cart) return [];
      const art = PROP_ART.moonPieCart;
      const sprite = bake('prop:moonPieCart:0', art.source, art.palette);
      const footY = (cart.ty + cart.h) * TILE_SIZE;
      const x = cart.tx * TILE_SIZE + (cart.w * TILE_SIZE - sprite.width) / 2;
      const man = bakeFigure('moonPieMan', 'down', 0);
      const cartDrawable: Drawable = {
        footY,
        sprite,
        x,
        y: footY - sprite.height,
        shadow: shadowOf(x + sprite.width / 2, footY, art.shadow),
      };
      if (art.glow) {
        cartDrawable.glow = glowOf('glow:moonPieCart', art.source, art.palette, art.glow);
      }
      return [
        {
          footY: footY - 1,
          sprite: man,
          x: x + (sprite.width - man.width) / 2,
          y: footY - 12 - man.height,
        },
        cartDrawable,
      ];
    },
    lights() {
      const cart = zone.stalls?.moonPieCart();
      if (!cart) return [];
      const sprite = bake(
        'prop:moonPieCart:0',
        PROP_ART.moonPieCart.source,
        PROP_ART.moonPieCart.palette,
      );
      return stallLights(cart, sprite, 'moonPieCart');
    },
  };
}
