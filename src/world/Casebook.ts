import { CLUE_IDS, type ClueId } from '../data/mystery';

/**
 * What she and Wes have been through (V1's P3a): how many times she got near and he ran, how many
 * days she has stopped to chat, and the last of them.
 */
export interface WesSnapshot {
  glimpses: number;
  chats: number;
  talked: string | null;
}

/**
 * What of the mystery is saved: the day each clue was pinned to her corkboard, the day this build
 * first saw her town (V1's P3a: the chain starts no sooner than the morning after), and Wes.
 */
export interface MysterySnapshot {
  clues: Partial<Record<ClueId, string>>;
  began?: string | null;
  wes?: WesSnapshot;
}

function isClue(id: string): id is ClueId {
  return (CLUE_IDS as readonly string[]).includes(id);
}

/** A count from a save, or none. */
function count(value: unknown): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 0;
}

/** The clues on her corkboard. Once pinned, a clue stays pinned. */
export class Casebook {
  private readonly pinned = new Map<ClueId, string>();
  /** The day this build first saw her town, set on the first look. */
  began: string | null;
  /** How many times she got near Wes and he ran. */
  glimpses: number;
  /** The days she has stopped to chat with Wes, and the last. */
  chats: number;
  talked: string | null;

  /** A clue a later build added, that this one doesn't know, is left out. */
  constructor(saved: Partial<MysterySnapshot> = {}) {
    for (const [id, day] of Object.entries(saved.clues ?? {})) {
      if (isClue(id) && typeof day === 'string') this.pinned.set(id, day);
    }
    this.began = typeof saved.began === 'string' ? saved.began : null;
    const wes: Partial<WesSnapshot> = saved.wes ?? {};
    this.glimpses = count(wes.glimpses);
    this.chats = count(wes.chats);
    this.talked = typeof wes.talked === 'string' ? wes.talked : null;
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

  /** The clue pinned most lately, and its day. */
  get newest(): { id: ClueId; day: string } | null {
    let newest: { id: ClueId; day: string } | null = null;
    for (const [id, day] of this.pinned) if (!newest || day >= newest.day) newest = { id, day };
    return newest;
  }

  snapshot(): MysterySnapshot {
    return {
      clues: Object.fromEntries(this.found.map((id) => [id, this.pinned.get(id)!])),
      began: this.began,
      wes: { glimpses: this.glimpses, chats: this.chats, talked: this.talked },
    };
  }
}
