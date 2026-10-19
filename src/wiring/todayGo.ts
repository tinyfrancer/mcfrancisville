import { isInterior } from '../data/interiors';
import type { Tile } from '../systems/pathfinding';
import type { TodayGo } from '../systems/today';
import { outsideOf } from '../systems/zones';
import type { MapZoneId, ZoneId } from '../types/ids';
import type { WorldState } from '../world/events';
import type { World } from '../world/World';

/** What the world says as anything Today reads changes, so the date chip's dot is asked again. */
export const TODAY_TOLD_BY: readonly (keyof WorldState)[] = [
  'today',
  'bag',
  'candy',
  'friends',
  'stall',
  'firstDay',
  'scene',
  // A town project given to, started or built (V1's R4).
  'projects',
];

/**
 * Where a line of the calendar's Today takes her (V1's R2, decision 312): up to a neighbour where
 * she is, or to what's waiting in a place, walking there when she's in it and flying there by
 * broom when she isn't, as the map does; into a building by walking up to its door.
 */
type Plan =
  | { seek: Parameters<World['seek']>[0] }
  | { home: true }
  | { fly: MapZoneId; then: Step | null }
  | Step;

/** What she walks up to once she's in the right place. */
type Step = { tap: Tile } | { bed: Tile & { zone: ZoneId } };

/** The building's door to walk up to, from the place outdoors it stands in. */
function doorOf(world: World, zone: ZoneId): Step | null {
  if (!isInterior(zone)) return null;
  const building = world.zones.map(outsideOf(zone)).buildingOf(zone);
  return building ? { tap: { tx: building.tx, ty: building.ty } } : null;
}

/** What to walk up to in a place once she's there. */
function spotIn(world: World, to: Extract<TodayGo, { zone: ZoneId }>): Step | null {
  const tile =
    to.tile ??
    (to.prop && isInterior(to.zone) === false && to.zone !== 'home'
      ? world.zones.map(to.zone as MapZoneId).map.props.find((p) => p.id === to.prop)
      : undefined);
  if (!tile) return null;
  const at = { tx: tile.tx, ty: tile.ty };
  return to.bed ? { bed: { zone: to.zone, ...at } } : { tap: at };
}

function planFor(world: World, to: TodayGo): Plan | null {
  const here = world.scene;
  if ('villager' in to) {
    if (world.neighbourhood.neighboursIn(here).some((n) => n.id === to.villager)) {
      return { seek: to.villager };
    }
    const zone = world.neighbourhood.whereIs(to.villager)?.zone;
    if (!zone || zone === here) return null;
    return toPlace(world, zone, doorOf(world, zone));
  }
  const spot = spotIn(world, to);
  if (to.zone === here) return spot;
  if (to.zone === 'home') return { home: true };
  return toPlace(world, to.zone, isInterior(to.zone) ? doorOf(world, to.zone) : spot);
}

/** To a place she isn't in: her house, a walk to a building's door where she is, or a flight. */
function toPlace(world: World, zone: ZoneId, then: Step | null): Plan | null {
  if (zone === 'home') return { home: true };
  const out = outsideOf(zone);
  if (out === world.scene) return then;
  return world.travel.canFly(out) ? { fly: out, then } : null;
}

function take(world: World, step: Step): boolean {
  if ('bed' in step) return world.tendBed(step.bed, 'tend');
  return world.tapTile(step.tap.tx, step.tap.ty);
}

/** Whether a tap on a line of Today would take her anywhere, as things are. */
export function canGoToday(world: World, to: TodayGo): boolean {
  return planFor(world, to) !== null;
}

/** Takes her where a line of Today says; false if there's nowhere to go. */
export function goToday(world: World, to: TodayGo): boolean {
  const plan = planFor(world, to);
  if (!plan) return false;
  if ('seek' in plan) return world.seek(plan.seek);
  if ('home' in plan) return world.travel.home();
  if ('fly' in plan) {
    if (!world.travel.fly(plan.fly)) return false;
    if (plan.then) take(world, plan.then);
    return true;
  }
  return take(world, plan);
}
