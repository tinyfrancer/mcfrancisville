import { VILLAGERS } from '../data/villagers';
import { heartsOf, letterOf, MAX_HEARTS, POINTS_PER_HEART } from '../systems/friendship';
import type { VillagerId } from '../types/ids';

/** Where a friendship stands, and the day key of the last talk, gift and favour, if any. */
export interface Friendship {
  points: number;
  talked: string | null;
  gifted: string | null;
  favour: string | null;
}

/** A letter in her mailbox, by its id (see `letterOf`), the day it came, and whether she's read it. */
export interface MailEntry {
  id: string;
  on: string;
  opened: boolean;
}

export interface FriendsSnapshot {
  friends: Partial<Record<VillagerId, Friendship>>;
  mail: MailEntry[];
}

const FRESH: Friendship = { points: 0, talked: null, gifted: null, favour: null };
const MOST = MAX_HEARTS * POINTS_PER_HEART;

function dayOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/**
 * Her friendships and her mail. A friendship only ever grows (decisions.md 11), and a letter, once
 * it has come, stays in the mailbox for good.
 */
export class Friends {
  private readonly all = new Map<VillagerId, Friendship>();
  private readonly letters: MailEntry[];

  constructor(saved: Partial<FriendsSnapshot> = {}) {
    for (const [id, f] of Object.entries(saved.friends ?? {})) {
      if (!(id in VILLAGERS) || typeof f !== 'object' || f === null) continue;
      const points = Number.isFinite(f.points) ? Math.max(0, Math.min(MOST, f.points)) : 0;
      this.all.set(id as VillagerId, {
        points,
        talked: dayOrNull(f.talked),
        gifted: dayOrNull(f.gifted),
        favour: dayOrNull(f.favour),
      });
    }
    // A letter a later build wrote, that this one doesn't know, is left out.
    this.letters = (saved.mail ?? [])
      .filter((m) => letterOf(m.id) !== null)
      .map((m) => ({ id: m.id, on: m.on, opened: m.opened === true }));
  }

  of(id: VillagerId): Friendship {
    return this.all.get(id) ?? FRESH;
  }

  hearts(id: VillagerId): number {
    return heartsOf(this.of(id).points);
  }

  /** Changes a friendship; points are only ever added, and stop at ten hearts. */
  update(id: VillagerId, change: Partial<Friendship>): void {
    const next = { ...this.of(id), ...change };
    next.points = Math.min(MOST, Math.max(this.of(id).points, next.points));
    this.all.set(id, next);
  }

  get mail(): readonly MailEntry[] {
    return this.letters;
  }

  get unread(): number {
    return this.letters.filter((m) => !m.opened).length;
  }

  has(id: string): boolean {
    return this.letters.some((m) => m.id === id);
  }

  /** Puts a letter in her mailbox, unless it's already come. */
  send(id: string, on: string): boolean {
    if (this.has(id) || letterOf(id) === null) return false;
    this.letters.push({ id, on, opened: false });
    return true;
  }

  /** Marks a letter read. True the first time, which is when its gift is taken out. */
  open(id: string): boolean {
    const entry = this.letters.find((m) => m.id === id);
    if (!entry || entry.opened) return false;
    entry.opened = true;
    return true;
  }

  snapshot(): FriendsSnapshot {
    return {
      friends: Object.fromEntries(this.all),
      mail: this.letters.map((m) => ({ ...m })),
    };
  }
}
