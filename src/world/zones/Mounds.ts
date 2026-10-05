import { dayKey, type Clock } from '../../systems/clock';
import { moundSpot } from '../../systems/fossils';
import type { PlacedProp } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import type { MapZoneId } from '../../types/ids';

/**
 * A place's mound today (0.3's C1): on one of its dig spots, dealt from the day key, solid like
 * the mounds the keys were buried under, and the hole it leaves once dug standing until morning.
 */
export class Mounds {
  private readonly zone: MapZoneId;
  private readonly spots: readonly Tile[];
  private readonly clock: Clock;
  private cache: { day: string; prop: PlacedProp | null } | null = null;

  constructor(zone: MapZoneId, spots: readonly Tile[], clock: Clock) {
    this.zone = zone;
    this.spots = spots;
    this.clock = clock;
  }

  /** Today's mound, or null in a place with nowhere to dig. */
  today(): PlacedProp | null {
    const day = dayKey(this.clock.now());
    if (this.cache?.day !== day) {
      const at = moundSpot(this.zone, this.spots, day);
      this.cache = { day, prop: at && { id: 'mound', tx: at.tx, ty: at.ty, w: 1, h: 1 } };
    }
    return this.cache.prop;
  }
}
