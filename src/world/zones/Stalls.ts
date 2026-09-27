import { PROP_FOOTPRINT } from '../../data/maps';
import type { Clock } from '../../systems/clock';
import type { PlacedProp, TileMap } from '../../systems/grid';
import { peddlerSpot, popUpLot } from '../../systems/shop';

/**
 * What stands in town only on some days: the pop-up shop on one of its lots, and the Moon Pie
 * Man's cart on one of his spots, each solid over its footprint while it's there.
 */
export class Stalls {
  private readonly clock: Clock;
  private readonly map: TileMap;
  /** Worked out at most once a minute each: pathfinding asks on every step. */
  private popUpCache: { minute: number; prop: PlacedProp | null } | null = null;
  private cartCache: { minute: number; prop: PlacedProp | null } | null = null;

  constructor(clock: Clock, map: TileMap) {
    this.clock = clock;
    this.map = map;
  }

  /** Where the pop-up shop stands today, or null if it isn't in town. */
  popUp(): PlacedProp | null {
    const now = this.clock.now();
    const minute = Math.floor(now / 60_000);
    if (this.popUpCache?.minute !== minute) {
      const lot = popUpLot(this.map.popUpLots, now);
      const prop: PlacedProp | null = lot
        ? { id: 'popUpShop', ...lot, ...PROP_FOOTPRINT.popUpShop }
        : null;
      this.popUpCache = { minute, prop };
    }
    return this.popUpCache.prop;
  }

  /** Where the Moon Pie Man's cart stands today, or null if he's away. */
  moonPieCart(): PlacedProp | null {
    const now = this.clock.now();
    const minute = Math.floor(now / 60_000);
    if (this.cartCache?.minute !== minute) {
      const spot = peddlerSpot(this.map.peddlerSpots, now);
      const prop: PlacedProp | null = spot
        ? { id: 'moonPieCart', ...spot, ...PROP_FOOTPRINT.moonPieCart }
        : null;
      this.cartCache = { minute, prop };
    }
    return this.cartCache.prop;
  }
}
