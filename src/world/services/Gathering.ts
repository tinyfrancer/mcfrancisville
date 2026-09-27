import { PATCHES, PROP_YIELDS, type Yield } from '../../data/gathering';
import { dayKey } from '../../systems/clock';
import { bonusOf, yieldOf } from '../../systems/farming';
import { patchKey, propKey, SNACK_KEY, snackTonight, type Snack } from '../../systems/gathering';
import type { PlacedProp, TileMap } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { GatherSource, WorldEvent } from '../events';
import type { Takings } from './Takings';

/**
 * What she picks up by arriving: the tree or rock she walked up to, the flowers she walked onto,
 * the night's snack where it waits, and Fibi's bone. Each gives once a day (decisions.md 35).
 */
export class Gathering {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  private readonly takings: Takings;
  private readonly map: TileMap;

  constructor(ctx: WorldContext, bag: Bag, takings: Takings, map: TileMap) {
    this.ctx = ctx;
    this.bag = bag;
    this.takings = takings;
    this.map = map;
  }

  /** Tonight's snack, where it waits, until she finds it. Null by day. */
  snack(): Snack | null {
    return snackTonight(this.map.snackSpots, this.takings.all, this.ctx.clock.now());
  }

  /** Whatever gives something where she arrived in town, with `prop` what she walked up to. */
  arriveAt(here: Tile, prop: PlacedProp | undefined): WorldEvent[] {
    const events: WorldEvent[] = [];
    if (prop) {
      const give = PROP_YIELDS[prop.id];
      if (give) events.push(this.gather(propKey(prop), prop.id, give));
      return events;
    }
    const patch = this.map.patches.find((p) => p.tx === here.tx && p.ty === here.ty);
    if (patch) events.push(this.gather(patchKey(patch), 'flowers', PATCHES[patch.id]));
    const snack = this.snack();
    if (snack && snack.tx === here.tx && snack.ty === here.ty) {
      events.push(this.gather(SNACK_KEY, 'snack', { item: snack.item, count: 1 }));
    }
    return events;
  }

  /**
   * Gathers what a key gives, once a day. Something rare (a blue rose) or found as well (a bead)
   * is read from where and which day, so it's fixed all day.
   */
  gather(key: string, from: GatherSource, give: Yield): WorldEvent {
    if (!this.takings.isReady(key)) return { kind: 'resting', from, item: give.item };
    const today = dayKey(this.ctx.clock.now());
    const { item, count } = yieldOf(give, `${key}@${today}`);
    this.takings.take(key);
    this.bag.add(item, count);
    const gathered: WorldEvent = { kind: 'gathered', from, item, count };
    const bead = bonusOf(give, `${key}@${today}`);
    if (bead) {
      this.bag.add(bead, 1);
      gathered.bead = bead;
    }
    this.ctx.events.emit('bag', this.bag.contents);
    return gathered;
  }
}
