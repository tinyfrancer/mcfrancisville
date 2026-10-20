import { TILE_SIZE } from '../../config/world';
import { bake } from '../../sprites/bake';
import { BED_FORMS, patchLook } from '../../sprites/flowerBeds';
import { PATCH_ART } from '../../sprites/nature';
import { formOf } from '../../sprites/terrain';
import { patchKey } from '../../systems/gathering';
import type { World } from '../../world/World';
import type { MapZone } from '../../world/zones/MapZone';
import { glowOf, type Drawable, type WorldLight } from '../scene';
import type { Pass } from './pass';

/** Moonpetals glow a little, once the moon is out, and so do moonflowers in bloom. */
export const MOONPETAL_LIGHT = { radius: 20, strength: 0.5 };

/** Anything outdoors that gives something once a window, and how it looks before and after. */
export interface Giver {
  key: string;
  drawable: Drawable;
  ready: HTMLCanvasElement;
  spent: HTMLCanvasElement;
  /** Its bloom's own glow and light, for a patch that glows at night. */
  readyGlow?: HTMLCanvasElement;
  light?: WorldLight;
}

/** The place's flower patches, each giving once a window. */
export function patchGivers(zone: MapZone): Giver[] {
  const givers: Giver[] = [];
  for (const patch of zone.map.patches) {
    const art = PATCH_ART[patch.id];
    // A patch among more of its kind is a flower bed (V1's L6), each tile in a layout of its own.
    const form = formOf(patch.tx, patch.ty, BED_FORMS);
    const look = patchLook(zone.map.patches, patch, true, form);
    const bare = patchLook(zone.map.patches, patch, false, form);
    const ready = bake(look.key, look.source, look.palette);
    const shoots = bake(bare.key, bare.source, bare.palette);
    const x = patch.tx * TILE_SIZE;
    const y = patch.ty * TILE_SIZE;
    // Flat on the ground: anything standing on or below the tile covers it.
    const drawable: Drawable = { footY: y + 1, sprite: ready, x, y };
    const giver: Giver = { key: patchKey(patch, zone.id), drawable, ready, spent: shoots };
    if (art.glows) {
      giver.readyGlow = glowOf(`glow:${look.key}`, look.source, look.palette, {
        f: art.palette.f ?? null,
        F: art.palette.F ?? null,
      });
      giver.light = {
        x: x + TILE_SIZE / 2,
        y: y + TILE_SIZE / 2,
        radius: MOONPETAL_LIGHT.radius,
      };
    }
    givers.push(giver);
  }
  return givers;
}

/**
 * Each tree, rock and patch as it is now: ready to give, or resting until the next window; what's
 * ready is what she might want behind a crown, and a moonpetal patch in bloom glows.
 */
export function giversPass(world: World, givers: readonly Giver[]): Pass {
  let stood: Drawable[] = [];
  return {
    name: 'givers',
    stand() {
      stood = givers.map((g) => {
        const ready = world.takings.isReady(g.key);
        const d = { ...g.drawable, sprite: ready ? g.ready : g.spent };
        if (ready && g.readyGlow) d.glow = g.readyGlow;
        return d;
      });
      return stood;
    },
    wanted: () => stood.filter((d, i) => d.sprite === givers[i]!.ready),
    lights() {
      const lights: WorldLight[] = [];
      for (const g of givers) {
        if (g.light && world.takings.isReady(g.key)) {
          lights.push({ ...g.light, strength: MOONPETAL_LIGHT.strength });
        }
      }
      return lights;
    },
  };
}
