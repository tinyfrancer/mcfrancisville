import { ITEMS } from '../../data/items';
import type { Tile } from '../../systems/pathfinding';
import type { ItemId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { WorldEvent } from '../events';

/** The record she dances to, and about how long it plays (personal_touches.md, "The shop"). */
export const DANCE_RECORD: ItemId = 'recordWalkTheTomb';
export const DANCE_MS = 26_500;

/**
 * Her record player: the next of her records each time, round and round her collection. The one
 * they danced to the night they met gets her dancing, and Cody comes over to dance with her.
 */
export class RecordPlayer {
  private readonly ctx: WorldContext;
  private readonly bag: Bag;
  /** How many records she has put on this visit, so the player works through her collection. */
  private plays = 0;
  /** When the dance ends, and where Cody, come over from next door, dances beside her. */
  private danceUntil = 0;
  private cody: Tile | null = null;

  constructor(ctx: WorldContext, bag: Bag) {
    this.ctx = ctx;
    this.bag = bag;
  }

  /** Puts on the next record. `beside` is where Cody could stand to dance, first choice first. */
  play(beside: readonly Tile[]): WorldEvent {
    const records = this.bag.contents.filter((s) => ITEMS[s.id].kind === 'record');
    const record = records[this.plays % Math.max(1, records.length)]?.id ?? null;
    if (record) this.plays += 1;
    this.danceUntil = 0;
    if (record !== DANCE_RECORD) return { kind: 'played', record };
    this.cody = beside[0] ?? null;
    this.danceUntil = this.ctx.clock.now() + DANCE_MS;
    return { kind: 'played', record, dance: true };
  }

  /** Whether she's dancing, and where Cody is dancing with her, if there was room. */
  dance(): { cody: Tile | null } | null {
    return this.ctx.clock.now() < this.danceUntil ? { cody: this.cody } : null;
  }

  /** She's off somewhere else, and the dance is over. */
  stop(): void {
    this.danceUntil = 0;
  }
}
