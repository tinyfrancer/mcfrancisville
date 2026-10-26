import { TILE_SIZE } from '../config/world';
import { HENS, type HenId } from '../data/hens';
import { bake } from '../sprites/bake';
import { COOP_FRONT, COOP_H, COOP_PALETTE } from '../sprites/farm';
import { HEN_ART, HEN_PALETTES, type HenFrame } from '../sprites/hens';
import { hashString } from '../systems/random';
import type { HenSpot } from '../systems/hens';
import type { World } from '../world/World';
import type { MapZone } from '../world/zones/MapZone';
import type { Pass } from './passes/pass';
import type { Drawable } from './scene';

/*
 * The hens at Boo Acres (1.6's X3), drawn where the world says each is in the run: sorted just in
 * front of the coop they stand in, by their feet, and the run's front fence in front of them all,
 * so they potter behind its rails. In for the night, only the coop is drawn.
 */

/** How long each of a hen's trotting frames shows. */
const TROT_FRAME_MS = 140;
/** A pecking hen's beat: dips to the ground twice, then looks about. */
const PECK_MS = 1200;

/** Which frame a hen is drawn in, for what she's doing and the view's clock. */
export function henFrame(spot: HenSpot, nowMs: number): HenFrame {
  switch (spot.doing) {
    case 'walk':
      return Math.floor(nowMs / TROT_FRAME_MS) % 2 === 0 ? 'walk0' : 'walk1';
    case 'peck': {
      const t = (nowMs + (hashString(spot.id) % PECK_MS)) % PECK_MS;
      if (t < 150 || (t >= 350 && t < 500)) return 'peck1';
      return t < 650 ? 'peck0' : 'walk0';
    }
    case 'sit':
      return 'sit';
    case 'crow':
      return 'crow';
    case 'stand':
      return 'walk0';
  }
}

/** One of them as baked: her look in a frame, facing her way. */
export function bakeHen(id: HenId, frame: HenFrame, left: boolean): HTMLCanvasElement {
  const look = HENS[id].look;
  return bake(
    `hen:${look}:${frame}:${left ? 'l' : 'r'}`,
    HEN_ART[look][frame],
    HEN_PALETTES[look],
    {
      flipX: left,
    },
  );
}

/** One of them standing, facing right, at 1×, for the coop's card. */
export function drawHen(canvas: HTMLCanvasElement, id: HenId): void {
  const sprite = bakeHen(id, 'walk0', false);
  canvas.width = sprite.width;
  canvas.height = sprite.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sprite, 0, 0);
}

/** The hens in the run where she is, and the run's front fence over them. */
export function hensPass(world: World, zone: MapZone): Pass {
  const coop = zone.map.props.find((p) => p.id === 'coop');
  const foot = coop ? (coop.ty + coop.h) * TILE_SIZE : 0;
  return {
    name: 'hens',
    stand({ nowMs }) {
      if (!coop) return [];
      const run = world.henhouse.run;
      const shown: Drawable[] = world.henhouse.hens().map((spot) => {
        const sprite = bakeHen(spot.id, henFrame(spot, nowMs), spot.facing === 'left');
        const x = Math.round(spot.x);
        const feet = Math.round(spot.y);
        const behind = run ? (feet - run.y) / (run.h + 1) : 0;
        return {
          footY: foot + 1 + behind,
          sprite,
          x: x - Math.floor(sprite.width / 2),
          y: feet - (sprite.height - 2),
          shadow: { cx: x, cy: feet, w: 14, h: 4 },
        };
      });
      const front = bake('prop:coop:front', COOP_FRONT, COOP_PALETTE);
      shown.push({ footY: foot + 2, sprite: front, x: coop.tx * TILE_SIZE, y: foot - COOP_H });
      return shown;
    },
  };
}
