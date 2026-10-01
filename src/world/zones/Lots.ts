import type { PlacedProp } from '../../systems/grid';
import { LOTS } from '../../systems/lots';
import type { MapZoneId } from '../../types/ids';
import { covers } from './Zone';

/**
 * The houses on a place's lots (phase T), standing from her first day (decision 211). Each is
 * solid over its footprint, like the stalls.
 */
export class Lots {
  private readonly houses: readonly PlacedProp[];

  constructor(zone: MapZoneId) {
    this.houses = LOTS.filter((l) => l.zone === zone).map((l) => l.house);
  }

  /** Whether the place has any lots at all. */
  get any(): boolean {
    return this.houses.length > 0;
  }

  /** The houses on the lots. */
  props(): readonly PlacedProp[] {
    return this.houses;
  }

  /** A house on a lot, by its prop. */
  house(prop: PlacedProp['id']): PlacedProp | undefined {
    return this.houses.find((p) => p.id === prop);
  }

  propAt(tx: number, ty: number): PlacedProp | undefined {
    return this.houses.find((p) => covers(p, tx, ty));
  }
}
