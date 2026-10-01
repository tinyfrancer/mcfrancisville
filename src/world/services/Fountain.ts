import { hourOf } from '../../systems/clock';
import { byFountain, fountainLit } from '../../systems/fountain';
import type { PlacedProp } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import type { WorldContext } from '../context';

/** Where she is outdoors: the place's props and her tile; null indoors. */
export type Outdoors = () => { props: readonly PlacedProp[]; tile: Tile } | null;

/**
 * The fountain's music box (0.2's H2): whether it plays now, for the music and the lights. It
 * keeps nothing; it's read off the clock and where she stands.
 */
export class Fountain {
  private readonly ctx: WorldContext;
  private readonly outdoors: Outdoors;

  constructor(ctx: WorldContext, outdoors: Outdoors) {
    this.ctx = ctx;
    this.outdoors = outdoors;
  }

  /** Whether she's standing by a fountain after dark, so it plays for her. */
  playing(): boolean {
    const here = this.outdoors();
    if (!here || !fountainLit(hourOf(this.ctx.clock.now()))) return false;
    return byFountain(here.props, here.tile);
  }
}
