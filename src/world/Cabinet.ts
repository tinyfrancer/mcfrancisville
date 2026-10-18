import { CRITTER_IDS, isCritter } from '../data/critters';
import { FOSSIL_IDS, isFossil } from '../data/fossils';
import type { CritterId, FossilId } from '../types/ids';

/**
 * What of the Curiosity Cabinet is saved: the day each critter was first caught, and what's on
 * show, critters first and then fossils (0.3's C1).
 */
export interface CabinetSnapshot {
  caught: Partial<Record<CritterId, string>>;
  donated: (CritterId | FossilId)[];
  /** The biggest of each fish she has landed, in quarters of a hand (V1's R6a, save v52). */
  best: Partial<Record<CritterId, number>>;
}

/**
 * Her Curiosity Cabinet: every critter she has ever caught, and the day she first did, and which
 * critters and fossils she has given to Wrapunzel's museum. Neither is ever forgotten, whatever
 * became of the critter.
 */
export class Cabinet {
  private readonly firsts = new Map<CritterId, string>();
  private readonly shown = new Set<CritterId | FossilId>();
  private readonly biggest = new Map<CritterId, number>();

  /** An id a later build added, that this one doesn't know, is left out. */
  constructor(saved: Partial<CabinetSnapshot> = {}) {
    for (const [id, day] of Object.entries(saved.caught ?? {})) {
      if (isCritter(id) && typeof day === 'string') this.firsts.set(id, day);
    }
    for (const id of saved.donated ?? []) if (isCritter(id) || isFossil(id)) this.shown.add(id);
    for (const [id, size] of Object.entries(saved.best ?? {})) {
      if (isCritter(id) && typeof size === 'number' && size > 0) this.biggest.set(id, size);
    }
  }

  /**
   * Notes the size of a fish she landed (V1's R6a): `best` if it beat the biggest she had,
   * `first` if it's the first she has measured, or null if she has had a bigger one.
   */
  measure(id: CritterId, size: number): 'first' | 'best' | null {
    const was = this.biggest.get(id);
    if (was !== undefined && size <= was) return null;
    this.biggest.set(id, size);
    return was === undefined ? 'first' : 'best';
  }

  /** The biggest of a kind she has landed, or null if she has never measured one. */
  bestOf(id: CritterId): number | null {
    return this.biggest.get(id) ?? null;
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

  isDonated(id: CritterId | FossilId): boolean {
    return this.shown.has(id);
  }

  /** Puts one on show. False if one is already. */
  donate(id: CritterId | FossilId): boolean {
    if (this.shown.has(id)) return false;
    this.shown.add(id);
    return true;
  }

  /** How many kinds she has caught. */
  get found(): number {
    return this.firsts.size;
  }

  /** How many kinds of critter are on show (Wrapunzel's letters count these). */
  get onShow(): number {
    return CRITTER_IDS.filter((id) => this.shown.has(id)).length;
  }

  /** How many fossils are in the seventh case. */
  get fossilsOnShow(): number {
    return FOSSIL_IDS.filter((id) => this.shown.has(id)).length;
  }

  snapshot(): CabinetSnapshot {
    return {
      caught: Object.fromEntries(
        CRITTER_IDS.filter((id) => this.firsts.has(id)).map((id) => [id, this.firsts.get(id)!]),
      ),
      donated: [...CRITTER_IDS, ...FOSSIL_IDS].filter((id) => this.shown.has(id)),
      best: Object.fromEntries(
        CRITTER_IDS.filter((id) => this.biggest.has(id)).map((id) => [id, this.biggest.get(id)!]),
      ),
    };
  }
}
