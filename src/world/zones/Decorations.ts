import { DECOR } from '../../data/holidays';
import { PROP_FOOTPRINT } from '../../data/maps';
import { dayKey } from '../../systems/clock';
import type { PlacedProp } from '../../systems/grid';
import { decorOn } from '../../systems/holidays';
import { covers } from './Zone';

/**
 * What stands in the square while a holiday's decorations are up (phase U): a tree at Christmas, a
 * tower of pumpkins all October. Each piece is solid over its footprint while it's there, like the
 * stalls, and gone the day the decorations come down.
 */
export class Decorations {
  private readonly now: () => number;
  /** Worked out once a day: pathfinding asks on every step. */
  private cache: { day: string; props: readonly PlacedProp[] } | null = null;

  constructor(now: () => number) {
    this.now = now;
  }

  /** What stands in the square today. */
  props(): readonly PlacedProp[] {
    const day = dayKey(this.now());
    if (this.cache?.day !== day) {
      const decor = decorOn(day);
      const props = (decor ? DECOR[decor].pieces : []).map((p): PlacedProp => ({
        id: p.prop,
        tx: p.tx,
        ty: p.ty,
        ...PROP_FOOTPRINT[p.prop],
      }));
      this.cache = { day, props };
    }
    return this.cache.props;
  }

  propAt(tx: number, ty: number): PlacedProp | undefined {
    return this.props().find((p) => covers(p, tx, ty));
  }
}
