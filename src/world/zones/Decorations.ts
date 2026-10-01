import { HAPPENINGS } from '../../data/happenings';
import { DECOR } from '../../data/holidays';
import { PROP_FOOTPRINT } from '../../data/maps';
import type { FurnitureId, PropId } from '../../types/ids';
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
  /** Whether she has a piece of furniture, for a set's piece that's hers (her carving). */
  private readonly has: (piece: FurnitureId) => boolean;
  /**
   * Worked out once a day: pathfinding asks on every step. What of hers the day's sets put out is
   * looked at each time, since she may make it that day.
   */
  private cache: {
    day: string;
    props: readonly PlacedProp[];
    hers: readonly { piece: FurnitureId; prop: PlacedProp }[];
    frozen: boolean;
  } | null = null;

  constructor(now: () => number, has: (piece: FurnitureId) => boolean = () => false) {
    this.now = now;
    this.has = has;
  }

  private today(): { props: readonly PlacedProp[]; frozen: boolean } {
    const day = dayKey(this.now());
    if (this.cache?.day !== day) {
      const decor = decorOn(day);
      const sets = happeningsOn(day).flatMap((id) => HAPPENINGS[id].set ?? []);
      const place = (p: { prop: PropId; tx: number; ty: number }): PlacedProp => ({
        id: p.prop,
        tx: p.tx,
        ty: p.ty,
        ...PROP_FOOTPRINT[p.prop],
      });
      const props = [...(decor ? DECOR[decor].pieces : []), ...sets.filter((p) => !p.hers)].map(
        place,
      );
      const hers = sets.flatMap((p) => (p.hers ? [{ piece: p.hers, prop: place(p) }] : []));
      this.cache = { day, props, hers, frozen: isFrozen(day) };
    }
    const { props, hers, frozen } = this.cache;
    if (hers.length === 0) return { props, frozen };
    return {
      props: [...props, ...hers.filter((h) => this.has(h.piece)).map((h) => h.prop)],
      frozen,
    };
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
