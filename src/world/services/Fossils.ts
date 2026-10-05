import { FOSSILS, isFossil } from '../../data/fossils';
import { dayKey } from '../../systems/clock';
import { findIn, moundKey, type MoundFind } from '../../systems/fossils';
import type { PlacedProp } from '../../systems/grid';
import type { FossilId, ItemId, MapZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { Cabinet } from '../Cabinet';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Zones } from '../zones/Zones';
import type { Takings } from './Takings';
import type { Wallet } from './Wallet';

/** What digging and donating fossils reach into. */
export interface FossilKeeps {
  bag: Bag;
  takings: Takings;
  wallet: Wallet;
  cabinet: Cabinet;
  zones: Zones;
  /** Whether she has ever had one, whatever became of it (`Milestones.hasHad`). */
  hasHad: (id: ItemId) => boolean;
}

/**
 * The day's mounds (0.3's C1, decision 250): one in each place, dug by walking up to it, giving a
 * fossil most days, or a bead, or a little Candy, once a day; and the fossils given to
 * Wrapunzel's seventh case.
 */
export class Fossils {
  private readonly ctx: WorldContext;
  private readonly keeps: FossilKeeps;

  constructor(ctx: WorldContext, keeps: FossilKeeps) {
    this.ctx = ctx;
    this.keeps = keeps;
  }

  /** A place's mound today, or null where there's nowhere to dig. */
  mound(zone: MapZoneId): PlacedProp | null {
    return this.keeps.zones.map(zone).mounds?.today() ?? null;
  }

  /** Whether today's mound in a place has been dug. */
  isDug(zone: MapZoneId): boolean {
    return !this.keeps.takings.isReady(moundKey(zone));
  }

  /** Whether a prop is a place's mound today, rather than one where a key was buried. */
  isToday(zone: MapZoneId, prop: PlacedProp): boolean {
    const mound = this.mound(zone);
    return mound !== null && mound.tx === prop.tx && mound.ty === prop.ty;
  }

  /** What's in a place's mound today, dug or not. */
  findToday(zone: MapZoneId): MoundFind {
    return findIn(zone, dayKey(this.ctx.clock.now()));
  }

  /** She has walked up to today's mound: what's in it, once. */
  dig(zone: MapZoneId): WorldEvent | null {
    const { bag, takings, wallet } = this.keeps;
    if (this.isDug(zone)) return null;
    takings.take(moundKey(zone));
    const find = this.findToday(zone);
    if ('candy' in find) {
      wallet.earn(find.candy);
      return { kind: 'unearthed', find, first: false };
    }
    const item = 'fossil' in find ? find.fossil : find.bead;
    const first = 'fossil' in find && !this.keeps.hasHad(item);
    bag.add(item, 1);
    this.ctx.events.emit('bag', bag.contents);
    this.ctx.signals.emit('thrilled', { by: 'find' });
    return { kind: 'unearthed', find, first };
  }

  /** How many of a fossil are in her bag. */
  inBag(id: FossilId): number {
    return this.keeps.bag.count(id);
  }

  /** Gives one from her bag to the seventh case: Wrapunzel's label, or null if it couldn't be. */
  donate(id: FossilId): string | null {
    const { bag, cabinet } = this.keeps;
    if (!isFossil(id) || cabinet.isDonated(id) || !bag.remove(id)) return null;
    cabinet.donate(id);
    this.ctx.events.emit('bag', bag.contents);
    this.ctx.events.emit('cabinet', cabinet);
    return FOSSILS[id].label;
  }
}
