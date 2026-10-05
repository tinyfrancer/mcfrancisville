import { FIGURINE_IDS } from '../../data/figurines';
import { ITEMS } from '../../data/items';
import { MILESTONE_IDS } from '../../data/milestones';
import { dayKey } from '../../systems/clock';
import { milestoneLetterId, progressOf, type Had, type ShelfFacts } from '../../systems/milestones';
import type { ItemId, MilestoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { Cabinet } from '../Cabinet';
import type { WorldContext } from '../context';
import type { Mailbox } from './Mailbox';

/**
 * What of the milestones is saved: every squishy and monster doll she has ever had (save v30),
 * every fossil she has dug up (0.3's C1), which is how the Cabinet knows one she has found, and
 * every figurine Gourdon has carved her (0.3's C3).
 */
export interface CollectedSnapshot {
  collected: Had[];
}

/** What the milestones read of the rest of the world. */
export interface MilestoneReads {
  bag: Bag;
  cabinet: Cabinet;
  mailbox: Mailbox;
}

/** The things she collects a set of, which count once she has had one, whatever became of it. */
export function isCollectable(id: string): id is Had {
  if (FIGURINES.has(id)) return true;
  const kind = id in ITEMS ? ITEMS[id as ItemId].kind : null;
  return kind === 'squishy' || kind === 'doll' || kind === 'fossil';
}

const FIGURINES: ReadonlySet<string> = new Set(FIGURINE_IDS);

/**
 * Her shelves to finish (0.2's F2): each family caught, each season's own, each wing of the
 * museum, her squishies and her monster dolls. Worked out from what the Cabinet holds and what
 * she has had; a finished shelf posts its letter once, which is the only record of it, so a
 * shelf finished before this build sends its letter the first time she plays it.
 */
export class Milestones {
  private readonly ctx: WorldContext;
  private readonly reads: MilestoneReads;
  private readonly had = new Set<Had>();
  private dirty = true;
  readonly facts: ShelfFacts;

  constructor(ctx: WorldContext, reads: MilestoneReads, saved: readonly string[] = []) {
    this.ctx = ctx;
    this.reads = reads;
    for (const id of saved) if (isCollectable(id)) this.had.add(id);
    this.note();
    this.facts = {
      caught: (id) => reads.cabinet.caughtOn(id) !== null,
      donated: (id) => reads.cabinet.isDonated(id),
      had: (id) => this.had.has(id),
    };
    ctx.events.on('bag', () => {
      this.note();
      this.dirty = true;
    });
    ctx.events.on('cabinet', () => (this.dirty = true));
    ctx.signals.on('carved', ({ figurine }) => {
      this.had.add(figurine);
      this.dirty = true;
    });
  }

  /** Whether she has ever had one. */
  hasHad(id: Had): boolean {
    this.note();
    return this.had.has(id);
  }

  /** How far along a shelf is, and whether its letter has come. */
  progress(id: MilestoneId): { have: number; total: number; done: boolean } {
    this.note();
    return progressOf(id, this.facts);
  }

  /** Posts the letter for every shelf finished since it was last looked at. */
  check(): void {
    if (!this.dirty) return;
    this.dirty = false;
    this.note();
    const { mailbox } = this.reads;
    for (const id of MILESTONE_IDS) {
      const letter = milestoneLetterId(id);
      if (mailbox.letters.has(letter) || !progressOf(id, this.facts).done) continue;
      mailbox.post(letter, dayKey(this.ctx.clock.now()));
    }
  }

  /** Counts whatever she collects that's in her bag now. */
  private note(): void {
    for (const { id } of this.reads.bag.contents) if (isCollectable(id)) this.had.add(id);
  }

  snapshot(): CollectedSnapshot {
    const ids: Had[] = [...(Object.keys(ITEMS) as ItemId[]), ...FIGURINE_IDS];
    return { collected: ids.filter((id) => this.had.has(id)) };
  }
}
