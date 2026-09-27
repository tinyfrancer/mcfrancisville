import { CLUE_IDS, type ClueId } from '../data/mystery';

/** What of the mystery is saved: the day each clue was pinned to her corkboard. */
export interface MysterySnapshot {
  clues: Partial<Record<ClueId, string>>;
}

function isClue(id: string): id is ClueId {
  return (CLUE_IDS as readonly string[]).includes(id);
}

/** The clues on her corkboard. Once pinned, a clue stays pinned. */
export class Casebook {
  private readonly pinned = new Map<ClueId, string>();

  /** A clue a later build added, that this one doesn't know, is left out. */
  constructor(saved: Partial<MysterySnapshot> = {}) {
    for (const [id, day] of Object.entries(saved.clues ?? {})) {
      if (isClue(id) && typeof day === 'string') this.pinned.set(id, day);
    }
  }

  /** Pins a clue up. True the first time. */
  pin(id: ClueId, day: string): boolean {
    if (this.pinned.has(id)) return false;
    this.pinned.set(id, day);
    return true;
  }

  /** The day a clue was pinned up, or null if it hasn't been found yet. */
  foundOn(id: ClueId): string | null {
    return this.pinned.get(id) ?? null;
  }

  /** Every clue she has found, in the board's order. */
  get found(): ClueId[] {
    return CLUE_IDS.filter((id) => this.pinned.has(id));
  }

  snapshot(): MysterySnapshot {
    return { clues: Object.fromEntries(this.found.map((id) => [id, this.pinned.get(id)!])) };
  }
}
