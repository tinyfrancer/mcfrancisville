import type { Weather } from '../data/weather';
import type { Effects, Underfoot } from '../render/effects';
import { puddlesOf } from '../render/puddles';
import { dayKey } from '../systems/clock';
import { tileAt, type TileMap } from '../systems/grid';
import { snowLies } from '../systems/seasons';
import { snowyOn } from '../systems/snow';
import { tileOf, type World } from '../world/World';
import type { MapZone } from '../world/zones/MapZone';

/*
 * What's underfoot outdoors (1.6's X4, decision 383): lying snow, where every step leaves a
 * footprint, hers, her neighbours' and her pets' paws; and on a rainy day the puddles on the
 * paths, which she and her pets splash through. Seen, never kept: the effects layer's, as the dust
 * of her footfalls is.
 */

/** Her feet, and a neighbour's, are this far below where they stand; a pet's paws, this far. */
const FEET = 13;
const PAWS = 8;

const puddleTiles = new WeakMap<TileMap, ReadonlySet<number>>();

/** The tiles a map's puddles lie on when it rains, worked out once a map. */
function puddlesIn(map: TileMap): ReadonlySet<number> {
  let tiles = puddleTiles.get(map);
  if (!tiles) {
    tiles = new Set(puddlesOf(map).map((p) => p.ty * map.width + p.tx));
    puddleTiles.set(map, tiles);
  }
  return tiles;
}

/** What's underfoot on a tile of a place outdoors, on a day, in a weather. */
export function underfootOn(
  zone: MapZone,
  tx: number,
  ty: number,
  day: string,
  weather: Weather,
): Underfoot {
  if (zone.slippery(tx, ty)) return null;
  if (snowyOn(day, tileAt(zone.map, tx, ty))) return 'snow';
  if (weather === 'rain' && !snowLies(day) && puddlesIn(zone.map).has(ty * zone.map.width + tx)) {
    return 'puddle';
  }
  return null;
}

/**
 * Each step of the loop: her footfall's footprint, splash or dust, and each neighbour's and pet's
 * as they step onto a new tile where she is. `weather` is the page's (`?weather=rain`) or the day's.
 */
export class Trails {
  private readonly last = new Map<string, number>();
  private zone = '';

  step(world: World, effects: Effects, weather: () => Weather): void {
    const scene = world.scene;
    const zone = world.zones.outdoor(scene);
    if (scene !== this.zone) {
      this.zone = scene;
      this.last.clear();
    }
    const day = dayKey(world.clock.now());
    const her = world.player;
    const at = (x: number, y: number) => {
      if (!zone) return null;
      const t = tileOf(x, y);
      return underfootOn(zone, t.tx, t.ty, day, weather());
    };
    effects.walking(scene, her, zone !== undefined, at(her.x, her.y));
    if (!zone) return;
    for (const n of world.neighbourhood.neighboursIn(scene)) {
      this.stepped(`n:${n.id}`, n, FEET, 'boot', at, effects, scene);
    }
    for (const p of world.petCare.here()) {
      this.stepped(`p:${p.id}`, p, PAWS, 'paw', at, effects, scene);
    }
  }

  /** One of them stepped onto a new tile: a print in the snow, or a splash in a puddle. */
  private stepped(
    key: string,
    who: { x: number; y: number; moving: boolean; facing: string },
    below: number,
    kind: 'boot' | 'paw',
    at: (x: number, y: number) => Underfoot,
    effects: Effects,
    scene: World['scene'],
  ): void {
    const t = tileOf(who.x, who.y);
    const index = t.ty * 1000 + t.tx;
    const was = this.last.get(key);
    this.last.set(key, index);
    if (was === undefined || was === index || !who.moving) return;
    const under = at(who.x, who.y);
    const feet = { x: who.x, y: who.y + below };
    if (under === 'snow') {
      effects.print(scene, feet.x, feet.y, who.facing === 'left' || who.facing === 'right', kind);
    } else if (under === 'puddle') {
      effects.push(scene, { kind: 'burst', particle: 'splash', at: feet, count: 3, spread: 3 });
    }
  }
}
