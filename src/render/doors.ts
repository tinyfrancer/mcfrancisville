import { TILE_SIZE } from '../config/world';
import { bake } from '../sprites/bake';
import type { DoorRect } from '../sprites/buildings';
import { OPEN_DOOR_GLOW, OPEN_DOOR_PALETTE, openDoor, type Opening } from '../sprites/doorsOpen';
import type { Palette, SpriteSource } from '../sprites/sprite';
import type { TileBox } from '../world/events';
import type { World } from '../world/World';
import { glowOf, type Drawable } from './scene';

/** A building's front door where it stands: what it is, where, and what it's drawn in. */
export interface Entrance {
  box: TileBox;
  /** The building's top left and feet, in world pixels. */
  x: number;
  y: number;
  footY: number;
  door: DoorRect;
  /** What the building is baked under. */
  key: string;
  source: SpriteSource;
  palette: Palette;
}

/** How near the middle of the door step she is when it starts to open, and when it's wide. */
const AJAR_WITHIN = 56;
const OPEN_WITHIN = 24;

/**
 * How far a door stands open (V1's E5): ajar as she comes up to it, wide as she reaches the step,
 * so it's open in the frame the iris takes with it when she goes in (decision 284). Coming out,
 * she stands on the step with it open behind her, and it shuts as she walks off. Read from where
 * she is and what she set off for, as everything a view draws is.
 */
export function openingOf(world: World, e: Entrance): Opening | 0 {
  const p = world.player;
  const sx = e.x + e.door.x + e.door.w / 2;
  const sy = e.footY + TILE_SIZE / 2;
  const d = Math.hypot(p.x - sx, p.y - sy);
  const aim = world.aim;
  const aimed =
    aim !== null &&
    'box' in aim &&
    aim.box.tx === e.box.tx &&
    aim.box.ty === e.box.ty &&
    aim.box.w === e.box.w &&
    aim.box.h === e.box.h;
  if (aimed) return d < OPEN_WITHIN ? 2 : d < AJAR_WITHIN ? 1 : 0;
  return d < OPEN_WITHIN / 2 ? 2 : d < OPEN_WITHIN ? 1 : 0;
}

/** The door patch over its building, `opening` open, lit after dark; null while it's shut. */
export function openDoorDrawable(world: World, e: Entrance): Drawable | null {
  const opening = openingOf(world, e);
  if (opening === 0) return null;
  const source = openDoor(e.source, e.door, opening);
  const palette = { ...e.palette, ...OPEN_DOOR_PALETTE };
  const key = `door:open:${e.key}:${opening}`;
  return {
    // Over its building, and behind anyone standing on the step.
    footY: e.footY + 0.25,
    sprite: bake(key, source, palette),
    x: e.x + e.door.x,
    y: e.y + e.door.y,
    glow: glowOf(`glow:${key}`, source, palette, OPEN_DOOR_GLOW),
  };
}
