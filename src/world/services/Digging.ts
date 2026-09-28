import { BURIED, buriedAt } from '../../data/buried';
import type { PlacedProp } from '../../systems/grid';
import type { MapZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Dug } from '../Dug';
import type { WorldEvent } from '../events';

/**
 * Digging up what's buried (phase I): walking up to a mound digs up what's under it, into her bag,
 * once and for good. A mound already dug is just the hole it left.
 */
export class Digging {
  private readonly ctx: WorldContext;
  private readonly dug: Dug;
  private readonly bag: Bag;

  constructor(ctx: WorldContext, dug: Dug, bag: Bag) {
    this.ctx = ctx;
    this.dug = dug;
    this.bag = bag;
  }

  /** Whether the mound at a place's prop has been dug up already. */
  isDug(zone: MapZoneId, prop: PlacedProp): boolean {
    const id = buriedAt(zone, prop.tx, prop.ty);
    return id === undefined || this.dug.has(id);
  }

  /** She has walked up to a mound: what's under it, the first time. */
  dig(zone: MapZoneId, prop: PlacedProp): WorldEvent | null {
    const id = buriedAt(zone, prop.tx, prop.ty);
    if (id === undefined || this.dug.has(id)) return null;
    const row = BURIED[id];
    this.dug.add(id);
    this.bag.add(row.item, 1);
    this.ctx.events.emit('bag', this.bag.contents);
    this.ctx.signals.emit('thrilled', { by: 'find' });
    return { kind: 'dug', buried: id, item: row.item };
  }
}
