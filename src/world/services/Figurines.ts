import { CARVE_COUNT, figurineOf } from '../../data/figurines';
import { canCarve, carvingsFrom, type Carving } from '../../systems/figurines';
import type { Had } from '../../systems/milestones';
import type { Carvable } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Belongings } from './Belongings';

/** What carving reads of the rest of the world. */
export interface FigurineReads {
  bag: Bag;
  belongings: Belongings;
  /** Whether she has ever had one (`Milestones.hasHad`, made later). */
  hasHad: (id: Had) => boolean;
}

/**
 * Gourdon's figurines (0.3's C3), at his bench: three of a critter, a squishy, a doll or a fossil
 * from her bag, carved while she waits into a figurine of it, which goes in her storage chest like
 * any piece. Nothing but the three is asked.
 */
export class Figurines {
  private readonly ctx: WorldContext;
  private readonly reads: FigurineReads;

  constructor(ctx: WorldContext, reads: FigurineReads) {
    this.ctx = ctx;
    this.reads = reads;
  }

  /** Everything she has that he could carve, with how many of each she has. */
  carvings(): Carving[] {
    return carvingsFrom((id) => this.reads.bag.count(id));
  }

  /** Carves a figurine from three of a thing in her bag. Null, and nothing taken, if she hasn't three. */
  carve(thing: Carvable): WorldEvent | null {
    const { bag, belongings } = this.reads;
    if (!canCarve(bag.count(thing)) || !bag.remove(thing, CARVE_COUNT)) return null;
    this.ctx.events.emit('bag', bag.contents);
    const figurine = figurineOf(thing);
    const first = !this.reads.hasHad(figurine);
    belongings.receive({ furniture: figurine });
    this.ctx.signals.emit('carved', { figurine });
    return { kind: 'carved', thing, figurine, first };
  }
}
