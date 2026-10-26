import { dayKey } from '../../systems/clock';
import { atKiteSpot, isKitePlace, nextWindy, windyOn } from '../../systems/kite';
import type { Tile } from '../../systems/pathfinding';
import type { KitePlace } from '../../data/kites';
import type { KiteId, ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';
import type { Hands } from './Hands';

/** The keepsake of her first flight. */
const SKY_ON_A_STRING = 'skyOnAString';

/** A kite up in the sky: which, where she stands holding its string, and since when. */
export interface Flight {
  kite: KiteId;
  zone: KitePlace;
  tile: Tile;
  since: number;
}

/** What the kite reads of the rest of the world. */
export interface KiteKeeps {
  bag: Bag;
  hands: Hands;
  /** Where she is. */
  scene: () => ZoneId;
  /** The tile she stands on. */
  tile: () => Tile;
}

/**
 * Her kite (1.6's X6, decision 385): flown from where the wind is up today, the end of the pier or
 * the castle lookout, with one in her hand; any tap winds it in, and so does walking off, going
 * anywhere or putting it down. The first flight ever brings a keepsake. A flight isn't saved: a
 * reload finds the kite back in her hand, as sitting finds her standing.
 */
export class Kite {
  private readonly ctx: WorldContext;
  private readonly keeps: KiteKeeps;
  private flight: Flight | null = null;

  constructor(ctx: WorldContext, keeps: KiteKeeps) {
    this.ctx = ctx;
    this.keeps = keeps;
  }

  /** The kite up in the sky now, or null. */
  get flying(): Flight | null {
    return this.flight;
  }

  /** Whether the wind is up for a kite where she is, today. */
  windyHere(): boolean {
    return windyOn(dayKey(this.ctx.clock.now()), this.keeps.scene());
  }

  /** The next day the wind is up in a place, from today: a dev build's handle for smoke. */
  nextWindy(zone: KitePlace): string | null {
    return nextWindy(dayKey(this.ctx.clock.now()), zone);
  }

  /** Whether she's holding a kite where one could go up, wind or no wind. */
  atSpot(here: Tile = this.keeps.tile()): boolean {
    const zone = this.keeps.scene();
    return this.keeps.hands.kite !== null && isKitePlace(zone) && atKiteSpot(zone, here);
  }

  /**
   * She tries to fly the kite in her hand where she stands: up it goes where the wind is up today,
   * or a word that it isn't; null with no kite in her hand.
   */
  fly(here: Tile = this.keeps.tile()): WorldEvent | null {
    const kite = this.keeps.hands.kite;
    if (!kite || this.flight) return null;
    const zone = this.keeps.scene();
    if (!isKitePlace(zone) || !atKiteSpot(zone, here)) return { kind: 'kite', did: 'nowhere' };
    if (!this.windyHere()) return { kind: 'kite', did: 'still' };
    this.flight = { kite, zone, tile: { ...here }, since: this.ctx.clock.now() };
    const { bag } = this.keeps;
    const first = bag.count(SKY_ON_A_STRING) === 0;
    if (first) {
      bag.add(SKY_ON_A_STRING, 1);
      this.ctx.events.emit('bag', bag.contents);
    }
    return { kind: 'kite', did: 'up', kite, first };
  }

  /** Winds it in: the moment, or null with nothing up. */
  bringIn(): WorldEvent | null {
    if (!this.flight) return null;
    const { kite } = this.flight;
    this.flight = null;
    return { kind: 'kite', did: 'in', kite };
  }

  /**
   * Each step: a kite goes back in her hand, quietly, once she's somewhere else, holding something
   * else, or the day turns still.
   */
  check(): void {
    const f = this.flight;
    if (!f) return;
    const here = this.keeps.tile();
    const gone =
      this.keeps.scene() !== f.zone ||
      here.tx !== f.tile.tx ||
      here.ty !== f.tile.ty ||
      this.keeps.hands.kite !== f.kite ||
      !this.windyHere();
    if (gone) this.flight = null;
  }
}
