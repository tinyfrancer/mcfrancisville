import { TILE_SIZE } from '../../config/world';
import { ITEM_ART } from '../../sprites/items';
import { tileCentre, type World } from '../../world/World';
import type { MapZone } from '../../world/zones/MapZone';
import { critterDrawable, critterLight, drawNet } from '../critters';
import { bakeIcon } from '../items';
import { boneDrawable, drawPetBubbles, petDrawable } from '../pets';
import { drawTarget, type Drawable, type WorldLight } from '../scene';
import {
  bakeFigure,
  drawLostGlint,
  drawNeighbourBubbles,
  drawPuffs,
  drawSpellSparkles,
  neighbourDrawables,
} from '../villagers';
import type { Pass } from './pass';

/*
 * Who's about where she is, and her: each sorted in among everything standing, the ones she might
 * want behind a crown said so, and what's drawn over them (their puffs and bubbles, her net).
 */

/** Where she's walking to, on the ground under everything. */
export function targetPass(world: World): Pass {
  return {
    name: 'target',
    ground(ctx, { cam, nowMs }) {
      drawTarget(ctx, world, cam, nowMs);
    },
  };
}

/** Her, as she's drawn this frame. */
export const herPass: Pass = { name: 'her', stand: ({ me }) => [me] };

/** Whoever is passing through and stands here (V1's R3), facing her way. */
export function passersPass(world: World, zone: MapZone): Pass {
  return {
    name: 'passers',
    stand: () =>
      world.rareEvents.passers(zone.id).map((p) => {
        const sprite = bakeFigure(p.id, 'down', 0);
        const { x } = tileCentre(p);
        const footY = p.ty * TILE_SIZE + 28;
        return { footY, sprite, x: x - sprite.width / 2, y: footY - sprite.height };
      }),
  };
}

/** A critter gone astray (V1's R3), bobbing where it waits, lit so it can be found. */
export function strayPass(world: World, zone: MapZone): Pass {
  return {
    name: 'stray',
    stand({ nowMs }) {
      const stray = world.rareEvents.stray();
      if (!stray || stray.zone !== zone.id) return [];
      const art = ITEM_ART[stray.critter];
      const sprite = bakeIcon(`item:${stray.critter}`, art.source, art.palette);
      const bob = 2 * Math.round(Math.sin(nowMs / 450));
      const footY = stray.ty * TILE_SIZE + 18;
      return [
        { footY, sprite, x: stray.tx * TILE_SIZE, y: stray.ty * TILE_SIZE - 6 + bob, glow: sprite },
      ];
    },
  };
}

/**
 * Her neighbours where she is, the puffs they let go and their spells' sparkles over everything,
 * and over the light what they're saying.
 */
export function neighboursPass(world: World, zone: MapZone): Pass {
  let stood: Drawable[] = [];
  return {
    name: 'neighbours',
    stand: ({ nowMs }) => (stood = neighbourDrawables(world, zone.id, nowMs)),
    wanted: () => stood,
    over(ctx, { cam, nowMs }) {
      drawPuffs(ctx, world, zone.id, cam, nowMs);
      drawSpellSparkles(ctx, world, zone.id, cam, nowMs);
    },
    lit(ctx, { cam, nowMs }) {
      drawNeighbourBubbles(ctx, world, zone.id, cam, nowMs);
    },
  };
}

/** Something lost to hand back, glinting where it lies, over the light. */
export function lostPass(world: World, zone: MapZone): Pass {
  return {
    name: 'lost',
    lit(ctx, { cam, nowMs }) {
      drawLostGlint(ctx, world, zone.id, cam, nowMs);
    },
  };
}

/**
 * Wes, when he's lurking: half behind a tree, peering out the side he's on. The tree is drawn
 * over him, so only the half of him that's very bad at hiding shows; he's meant to be half hidden,
 * so no crown goes see-through for him.
 */
export function wesPass(world: World): Pass {
  return {
    name: 'wes',
    stand() {
      const wes = world.mystery.wes();
      if (!wes) return [];
      const sprite = bakeFigure('wes', wes.side, 0);
      const lean = wes.side === 'right' ? -12 : 12;
      const { x } = tileCentre(wes);
      const footY = wes.ty * TILE_SIZE + 28;
      return [{ footY, sprite, x: x - sprite.width / 2 + lean, y: footY - sprite.height }];
    },
  };
}

/** The critters out here now, the glowing ones' light, and her net's swing over everything. */
export function crittersPass(world: World, zone: MapZone): Pass {
  const critters = () => world.collecting.critters(zone.id);
  let stood: Drawable[] = [];
  return {
    name: 'critters',
    stand: ({ nowMs }) => (stood = critters().map((c) => critterDrawable(c, nowMs))),
    wanted: () => stood,
    over(ctx, { cam }) {
      drawNet(ctx, world, cam);
    },
    lights({ nowMs }) {
      const lights: WorldLight[] = [];
      for (const c of critters()) {
        const light = critterLight(c, nowMs);
        if (light) lights.push(light);
      }
      return lights;
    },
  };
}

/** Her pets here, and over the light what they're saying. */
export function petsPass(world: World): Pass {
  let stood: Drawable[] = [];
  return {
    name: 'pets',
    stand: ({ nowMs }) => (stood = world.petCare.here().map((p) => petDrawable(p, world, nowMs))),
    wanted: () => stood,
    lit(ctx, { cam, nowMs }) {
      drawPetBubbles(ctx, world.petCare.here(), world, cam, nowMs);
    },
  };
}

/** Fibi's bone, if she has left it somewhere here today. */
export function bonePass(world: World, zone: MapZone): Pass {
  let stood: Drawable[] = [];
  return {
    name: 'bone',
    stand() {
      const bone = world.petCare.lostBone();
      return (stood = bone?.scene === zone.id ? [boneDrawable(bone.tx, bone.ty)] : []);
    },
    wanted: () => stood,
  };
}
