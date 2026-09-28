import type { MapZoneId, ZoneId } from '../../types/ids';
import type { HomeZone } from './HomeZone';
import type { MapZone } from './MapZone';
import type { Zone } from './Zone';

/** Every place she can be, by id (decisions.md 90). */
export class Zones {
  readonly home: HomeZone;
  private readonly maps: ReadonlyMap<MapZoneId, MapZone>;

  constructor(home: HomeZone, maps: readonly MapZone[]) {
    this.home = home;
    this.maps = new Map(maps.map((z) => [z.id, z]));
  }

  get(id: ZoneId): Zone {
    return id === 'home' ? this.home : this.map(id);
  }

  /** A place outdoors, by id. */
  map(id: MapZoneId): MapZone {
    return this.maps.get(id)!;
  }

  /** Every place outdoors. */
  get outdoors(): MapZone[] {
    return [...this.maps.values()];
  }
}
