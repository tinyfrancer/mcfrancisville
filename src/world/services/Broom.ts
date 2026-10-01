import {
  BRISTLES,
  BROOM_AFTER_DAYS,
  BROOM_CALLS,
  FIRST_BROOM,
  RIBBONS,
  type BroomLook,
} from '../../data/broom';
import { dayKey } from '../../systems/clock';
import type { Tile } from '../../systems/pathfinding';
import type { ZoneId } from '../../types/ids';
import type { Bag } from '../Bag';
import type { WorldContext } from '../context';
import type { Home } from '../Home';
import type { Mailbox } from './Mailbox';
import type { Travel } from './Travel';

/** Agatha's letter with the broom. */
export const BROOM_LETTER_ID = 'broom:1';

/** What the broom reads of the rest of the world. */
export interface BroomReads {
  bag: Bag;
  home: Home;
  mailbox: Mailbox;
  travel: Travel;
  /** How many days she has come to town. */
  visits: () => number;
  /** Where she stands, while she's at home, for the stand to be set out clear of her. */
  standing: () => Tile | null;
}

/**
 * Her broom (0.2's P1): Agatha sends it once she has come to town on a second day (a new game's
 * second day, or an older town's first day of 0.2), its stand is set out by her mat as she opens
 * the letter, and from then on it swoops her home from anywhere outside and back out again.
 * Its ribbon and bristles are hers to colour (question 57).
 */
export class Broom {
  private readonly ctx: WorldContext;
  private readonly reads: BroomReads;
  private colours: BroomLook;

  constructor(ctx: WorldContext, reads: BroomReads, saved?: Partial<BroomLook>) {
    this.ctx = ctx;
    this.reads = reads;
    this.colours = {
      ribbon: saved?.ribbon && saved.ribbon in RIBBONS ? saved.ribbon : FIRST_BROOM.ribbon,
      bristles:
        saved?.bristles && saved.bristles in BRISTLES ? saved.bristles : FIRST_BROOM.bristles,
    };
    ctx.signals.on('opened', ({ letter }) => {
      if (letter === BROOM_LETTER_ID) this.setOutStand();
    });
  }

  /** Whether she has her broom. */
  get has(): boolean {
    return this.reads.bag.count('broom') > 0;
  }

  get look(): BroomLook {
    return this.colours;
  }

  /**
   * Agatha writes with the broom once she has come to town on enough days. Looked at every step
   * until it has come, since today's visit is counted only once she's past the title.
   */
  check(): void {
    const { mailbox } = this.reads;
    if (this.reads.visits() < BROOM_AFTER_DAYS || mailbox.letters.has(BROOM_LETTER_ID)) return;
    mailbox.post(BROOM_LETTER_ID, dayKey(this.ctx.clock.now()));
  }

  /** Ties a new ribbon on, or changes the bristles. False for a colour it doesn't come in. */
  dress(look: Partial<BroomLook>): boolean {
    const next = { ...this.colours, ...look };
    if (!(next.ribbon in RIBBONS) || !(next.bristles in BRISTLES)) return false;
    this.colours = next;
    this.ctx.events.emit('broom', this.colours);
    return true;
  }

  /** Hops on and swoops home. False if she has no broom yet, or is home already. */
  flyHome(): boolean {
    return this.has && this.reads.travel.home(this.call());
  }

  /** From the stand at home, back to exactly where she flew home from. */
  flyBack(): boolean {
    return this.has && this.reads.travel.back(this.call());
  }

  /** Where flying back would take her, if anywhere. */
  get backTo(): ZoneId | null {
    return this.reads.travel.left?.zone ?? null;
  }

  snapshot(): { broom: BroomLook } {
    return { broom: { ...this.colours } };
  }

  /** The stand goes by her mat, or into her storage chest if there's no room there. */
  private setOutStand(): void {
    const { home } = this.reads;
    home.store('broomStand');
    const mat = home.room.mat;
    home.takeOut('broomStand', { tx: mat.tx + 2, ty: mat.ty - 1 }, this.reads.standing());
    this.ctx.events.emit('home', home);
  }

  /** What she calls as she hops on, from the flight's moment: now and then one of hers. */
  private call(): string {
    const total = BROOM_CALLS.reduce((sum, c) => sum + c.weight, 0);
    let pick = Math.floor(this.ctx.clock.now() / 997) % total;
    for (const c of BROOM_CALLS) {
      pick -= c.weight;
      if (pick < 0) return c.line;
    }
    return BROOM_CALLS[0]!.line;
  }
}
