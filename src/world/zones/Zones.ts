import { isInterior } from '../../data/interiors';
import type { InteriorId, MapZoneId, ZoneId } from '../../types/ids';
import type { HomeZone } from './HomeZone';
import type { MapZone } from './MapZone';
import type { RoomZone } from './RoomZone';
import type { Zone } from './Zone';

/** Every place she can be, by id (decisions.md 90). */
export class Zones {
  readonly home: HomeZone;
  private readonly maps: ReadonlyMap<MapZoneId, MapZone>;
  private readonly rooms: ReadonlyMap<InteriorId, RoomZone>;

  constructor(home: HomeZone, maps: readonly MapZone[], rooms: readonly RoomZone[]) {
    this.home = home;
    this.maps = new Map(maps.map((z) => [z.id, z]));
    this.rooms = new Map(rooms.map((z) => [z.id, z]));
  }

  get(id: ZoneId): Zone {
    if (id === 'home') return this.home;
    return isInterior(id) ? this.room(id) : this.map(id);
  }

  /** A place outdoors, by id. */
  map(id: MapZoneId): MapZone {
    return this.maps.get(id)!;
  }

  /** Inside a building, by id. */
  room(id: InteriorId): RoomZone {
    return this.rooms.get(id)!;
  }

  /** The place outdoors she's in, or undefined indoors. */
  outdoor(id: ZoneId): MapZone | undefined {
    return this.maps.get(id as MapZoneId);
  }

  /** The building she's in, or undefined anywhere else. */
  inside(id: ZoneId): RoomZone | undefined {
    return this.rooms.get(id as InteriorId);
  }

  /** Every place outdoors. */
  get outdoors(): MapZone[] {
    return [...this.maps.values()];
  }
}
