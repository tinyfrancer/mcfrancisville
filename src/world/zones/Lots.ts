import { PROP_FOOTPRINT } from '../../data/maps';
import type { PlacedProp } from '../../systems/grid';
import { boxesAt, LOTS, type Lot, type Moving } from '../../systems/newcomers';
import type { MapZoneId, VillagerId } from '../../types/ids';
import { covers } from './Zone';

/**
 * The newcomers' lots in a place (phase T): a "coming soon" sign on each while its owner is still
 * to come, "sold" the day their letter comes, and their house from moving day on, with their boxes
 * by the door that day. Each is solid over its footprint, like the stalls.
 */
export class Lots {
  private readonly lots: readonly Lot[];
  private readonly moving: (villager: VillagerId) => Moving;
  /**
   * Worked out at most once a minute, or when a letter comes (`written` counts them): pathfinding
   * asks on every step.
   */
  private cache: { key: string; props: readonly PlacedProp[] } | null = null;
  private readonly now: () => number;
  private readonly written: () => number;

  constructor(
    zone: MapZoneId,
    moving: (villager: VillagerId) => Moving,
    now: () => number,
    written: () => number,
  ) {
    this.lots = LOTS.filter((l) => l.zone === zone);
    this.moving = moving;
    this.now = now;
    this.written = written;
  }

  /** Whether the place has any lots at all. */
  get any(): boolean {
    return this.lots.length > 0;
  }

  /** What stands on the lots now: signs, houses, and boxes on a moving day. */
  props(): readonly PlacedProp[] {
    const key = `${Math.floor(this.now() / 60_000)}:${this.written()}`;
    if (this.cache?.key !== key) this.cache = { key, props: this.work() };
    return this.cache.props;
  }

  /** A newcomer's house, if it stands. */
  house(prop: PlacedProp['id']): PlacedProp | undefined {
    return this.props().find((p) => p.id === prop);
  }

  propAt(tx: number, ty: number): PlacedProp | undefined {
    return this.props().find((p) => covers(p, tx, ty));
  }

  private work(): PlacedProp[] {
    return this.lots.flatMap((lot) => {
      const moving = this.moving(lot.owner);
      if (moving === 'away' || moving === 'coming') {
        const id = moving === 'away' ? 'lotSign' : 'soldSign';
        const at = {
          tx: lot.house.tx + (PROP_FOOTPRINT[lot.house.id].door ?? 0),
          ty: lot.house.ty + lot.house.h - 1,
        };
        return [{ id, ...at, w: 1, h: 1 }];
      }
      if (moving === 'settled') return [lot.house];
      return [lot.house, { id: 'movingBoxes', ...boxesAt(lot), w: 1, h: 1 }];
    });
  }
}
