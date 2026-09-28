import { FIXTURES, INTERIORS } from '../../data/interiors';
import { FURNITURE } from '../../data/furniture';
import { dayKey } from '../../systems/clock';
import { sayTo } from '../../systems/friendship';
import { keepsakeHint } from '../../systems/interiors';
import type { InteriorId, VillagerId } from '../../types/ids';
import type { WorldContext } from '../context';
import type { Arrived, WorldEvent } from '../events';
import type { Keepsakes } from '../Keepsakes';
import type { RoomThing } from '../zones/RoomZone';
import type { Belongings } from './Belongings';

/** What the insides of buildings read of the rest of the world. */
export interface InteriorsReads {
  keepsakes: Keepsakes;
  belongings: Belongings;
  hearts: (villager: VillagerId) => number;
  /** Her name, for what things say to her. */
  name: () => string;
}

/**
 * Inside the town's buildings (phase H): walking up to what's there. A shop's counter, her salon
 * chair and the museum's cases open their sheets; anything else says something; and a keepsake in a
 * neighbour's house is hers to have one like, once they're close enough.
 */
export class Interiors {
  private readonly ctx: WorldContext;
  private readonly reads: InteriorsReads;

  constructor(ctx: WorldContext, reads: InteriorsReads) {
    this.ctx = ctx;
    this.reads = reads;
  }

  /** She has walked up to something in a building: `arrived` says what, and any more follows. */
  use(interior: InteriorId, thing: RoomThing, arrived: Arrived): WorldEvent[] {
    const says = (text: string) => sayTo(text, this.reads.name(), dayKey(this.ctx.clock.now()));
    if ('fixture' in thing) {
      const row = FIXTURES[thing.fixture.id];
      arrived.fixture = thing.fixture.id;
      if (row.opens) arrived.opens = row.opens;
      else if (row.says) arrived.says = says(row.says);
      return [arrived];
    }
    const { piece } = thing;
    arrived.piece = piece.id;
    const line = FURNITURE[piece.id].says;
    const owner = INTERIORS[interior].owner;
    if (piece.keepsake === undefined || !owner || this.reads.keepsakes.has(piece.id)) {
      if (line) arrived.says = says(line);
      return [arrived];
    }
    if (this.reads.hearts(owner) < piece.keepsake) {
      arrived.says = keepsakeHint(piece.id, owner, piece.keepsake);
      return [arrived];
    }
    this.reads.keepsakes.give(piece.id);
    this.reads.belongings.receive({ furniture: piece.id });
    this.ctx.signals.emit('thrilled', { by: 'gift' });
    return [arrived, { kind: 'keepsake', piece: piece.id, from: owner }];
  }
}
