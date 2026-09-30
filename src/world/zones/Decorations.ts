import { HAPPENINGS } from '../../data/happenings';
import { DECOR } from '../../data/holidays';
import { PROP_FOOTPRINT } from '../../data/maps';
import { dayKey } from '../../systems/clock';
import type { PlacedProp } from '../../systems/grid';
import { happeningsOn } from '../../systems/happenings';
import { decorOn, isFrozen } from '../../systems/holidays';
import { covers } from './Zone';

/**
 * The town through the year (phase U): what stands in the square while a holiday's decorations are
 * up (a tree at Christmas, a tower of pumpkins all October), and what's set out for a happening
 * on its day (film night's screen, 0.2's J3), each piece solid over its footprint while it's
 * there and gone the day they come down; and the pond, frozen over for skating in
 * winter, which is walked on then.
 */
export class Decorations {
  private readonly now: () => number;
  /** Worked out once a day: pathfinding asks on every step. */
  private cache: { day: string; props: readonly PlacedProp[]; frozen: boolean } | null = null;

  constructor(now: () => number) {
    this.now = now;
  }

  private today(): { props: readonly PlacedProp[]; frozen: boolean } {
    const day = dayKey(this.now());
    if (this.cache?.day !== day) {
      const decor = decorOn(day);
      const sets = happeningsOn(day).flatMap((id) => HAPPENINGS[id].set ?? []);
      const props = [...(decor ? DECOR[decor].pieces : []), ...sets].map((p): PlacedProp => ({
        id: p.prop,
        tx: p.tx,
        ty: p.ty,
        ...PROP_FOOTPRINT[p.prop],
      }));
      this.cache = { day, props, frozen: isFrozen(day) };
    }
    return this.cache;
  }

  /** What stands in the square today. */
  props(): readonly PlacedProp[] {
    return this.today().props;
  }

  /** Whether the pond is frozen over today. */
  get frozen(): boolean {
    return this.today().frozen;
  }

  propAt(tx: number, ty: number): PlacedProp | undefined {
    return this.props().find((p) => covers(p, tx, ty));
  }
}
