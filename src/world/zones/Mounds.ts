import type { Clock } from '../../systems/clock';
import { moundSpot } from '../../systems/fossils';
import type { PlacedProp } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import type { MapZoneId } from '../../types/ids';
import { MinuteDay } from './MinuteDay';
import type { Overlay } from './Overlay';
import { covers } from './Zone';

/**
 * A place's mound today (0.3's C1): on one of its dig spots, dealt from the day key, solid like
 * the mounds the keys were buried under, and the hole it leaves once dug standing until morning.
 */
export class Mounds implements Overlay {
  private readonly zone: MapZoneId;
  private readonly spots: readonly Tile[];
  private readonly day: MinuteDay;
  private cache: { day: string; prop: PlacedProp | null } | null = null;

  constructor(zone: MapZoneId, spots: readonly Tile[], clock: Clock) {
    this.zone = zone;
    this.spots = spots;
    this.day = new MinuteDay(() => clock.now());
  }

  /** Today's mound, or null in a place with nowhere to dig. */
  today(): PlacedProp | null {
    const day = this.day.get();
    if (this.cache?.day !== day) {
      const at = moundSpot(this.zone, this.spots, day);
      this.cache = { day, prop: at && { id: 'mound', tx: at.tx, ty: at.ty, w: 1, h: 1 } };
    }
    return this.cache.prop;
  }

  propAt(tx: number, ty: number): PlacedProp | undefined {
    const mound = this.today();
    return mound && covers(mound, tx, ty) ? mound : undefined;
  }

  blocks(tx: number, ty: number): boolean {
    return this.propAt(tx, ty) !== undefined;
  }
}
