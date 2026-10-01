import { VILLAGER_IDS, VILLAGERS } from '../../data/villagers';
import { dayKey } from '../../systems/clock';
import { knowWelcomes } from '../../systems/happenings';
import {
  dueOn,
  livesHere,
  movingOf,
  newcomerLetterId,
  writesSoon,
  type Arrivals,
  type Moving,
} from '../../systems/newcomers';
import type { UnlockFacts } from '../../systems/zones';
import type { VillagerId } from '../../types/ids';
import type { WorldContext } from '../context';
import type { Mailbox } from './Mailbox';

/** What newcomers reach into: the mailbox their letters come to, and what they wait on. */
export interface NewcomerKeeps {
  mailbox: Mailbox;
  facts: UnlockFacts;
}

/**
 * Her newcomers (phase T, decisions.md 125). Once a day it looks to see whether one is due, and if
 * so their letter comes and they move in the next day; everything about who lives here is worked
 * out from the days they wrote (`newcomers`, save v25), never ticked.
 */
export class Newcomers {
  private readonly ctx: WorldContext;
  private readonly keeps: NewcomerKeeps;
  private arrivals: Arrivals;
  /** The day last looked at, so it's looked at once a day. */
  private checkedOn: string | null = null;
  private dayCache: { day: string; residents: readonly VillagerId[] } | null = null;
  /** How many letters have come while the game has been open, for what's worked out from them. */
  private letters = 0;

  constructor(ctx: WorldContext, keeps: NewcomerKeeps, saved?: Partial<Arrivals>) {
    this.ctx = ctx;
    this.keeps = keeps;
    const known = (saved: Arrivals['wrote'] | undefined): Arrivals['wrote'] => {
      const out: Arrivals['wrote'] = {};
      for (const [id, day] of Object.entries(saved ?? {})) {
        if (id in VILLAGERS && VILLAGERS[id as VillagerId].newcomer && typeof day === 'string') {
          out[id as VillagerId] = day;
        }
      }
      return out;
    };
    const wrote = known(saved?.wrote);
    // Anyone who writes soon is heard of the first day the game knows of them (0.2's L1).
    const heard = known(saved?.heard);
    for (const id of VILLAGER_IDS) {
      if (writesSoon(id) && !wrote[id] && !heard[id]) heard[id] = this.today;
    }
    const since = typeof saved?.since === 'string' && saved.since ? saved.since : this.today;
    this.arrivals = { since, wrote, heard };
    knowWelcomes(wrote);
  }

  private get today(): string {
    return dayKey(this.ctx.clock.now());
  }

  /** Where a neighbour is with moving in today. */
  moving(villager: VillagerId): Moving {
    return movingOf(villager, this.today, this.arrivals.wrote);
  }

  /** Everyone who lives in town today, moving in or settled. */
  residents(): readonly VillagerId[] {
    const day = this.today;
    if (this.dayCache?.day !== day) {
      const residents = VILLAGER_IDS.filter((id) =>
        livesHere(movingOf(id, day, this.arrivals.wrote)),
      );
      this.dayCache = { day, residents };
    }
    return this.dayCache.residents;
  }

  /**
   * Once a day: a newcomer's letter, if one is due, and a word that someone has moved in on the
   * day they do.
   */
  check(): void {
    const day = this.today;
    if (day === this.checkedOn) return;
    this.checkedOn = day;
    const due = dueOn(day, this.arrivals, this.keeps.facts);
    if (due) {
      // One who writes soon doesn't start the month to the next newcomer over.
      const since = writesSoon(due) ? this.arrivals.since : day;
      this.arrivals = { ...this.arrivals, since, wrote: { ...this.arrivals.wrote, [due]: day } };
      knowWelcomes(this.arrivals.wrote);
      this.dayCache = null;
      this.letters += 1;
      this.keeps.mailbox.post(newcomerLetterId(due), day);
    }
    for (const id of VILLAGER_IDS) {
      if (this.moving(id) === 'moving') this.ctx.moments.push({ kind: 'movedIn', villager: id });
    }
  }

  /** Counts the letters come since the game opened: what stands on a lot changes with each. */
  get written(): number {
    return this.letters;
  }

  snapshot(): { newcomers: Arrivals } {
    const { since, wrote, heard } = this.arrivals;
    return { newcomers: { since, wrote: { ...wrote }, heard: { ...heard } } };
  }
}
