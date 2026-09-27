import { CRITTER_IDS, isCritter } from '../data/critters';
import type { CritterId } from '../types/ids';

/** What of the Curiosity Cabinet is saved: the day each critter was first caught, and what's on show. */
export interface CabinetSnapshot {
  caught: Partial<Record<CritterId, string>>;
  donated: CritterId[];
}

/**
 * Her Curiosity Cabinet: every critter she has ever caught, and the day she first did, and which
 * she has given to Wrapunzel's museum. Neither is ever forgotten, whatever became of the critter.
 */
export class Cabinet {
  private readonly firsts = new Map<CritterId, string>();
  private readonly shown = new Set<CritterId>();

  /** An id a later build added, that this one doesn't know, is left out. */
  constructor(saved: Partial<CabinetSnapshot> = {}) {
    for (const [id, day] of Object.entries(saved.caught ?? {})) {
      if (isCritter(id) && typeof day === 'string') this.firsts.set(id, day);
    }
    for (const id of saved.donated ?? []) if (isCritter(id)) this.shown.add(id);
  }

  /** Notes a catch. True if it's the first of its kind she's ever caught. */
  record(id: CritterId, day: string): boolean {
    if (this.firsts.has(id)) return false;
    this.firsts.set(id, day);
    return true;
  }

  /** The day she first caught one, or null if she never has. */
  caughtOn(id: CritterId): string | null {
    return this.firsts.get(id) ?? null;
  }

  isDonated(id: CritterId): boolean {
    return this.shown.has(id);
  }

  /** Puts one on show. False if one is already. */
  donate(id: CritterId): boolean {
    if (this.shown.has(id)) return false;
    this.shown.add(id);
    return true;
  }

  /** How many kinds she has caught. */
  get found(): number {
    return this.firsts.size;
  }

  /** How many kinds are on show. */
  get onShow(): number {
    return this.shown.size;
  }

  snapshot(): CabinetSnapshot {
    return {
      caught: Object.fromEntries(
        CRITTER_IDS.filter((id) => this.firsts.has(id)).map((id) => [id, this.firsts.get(id)!]),
      ),
      donated: CRITTER_IDS.filter((id) => this.shown.has(id)),
    };
  }
}
