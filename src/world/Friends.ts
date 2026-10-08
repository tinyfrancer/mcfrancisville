import { ITEMS } from '../data/items';
import { VILLAGERS } from '../data/villagers';
import { heartsOf, MAX_HEARTS, POINTS_PER_HEART } from '../systems/friendship';
import { OPENERS_KEPT, type LineKey } from '../systems/remembering';
import { isBracelet } from '../systems/wardrobe';
import type { BraceletId, ItemId, VillagerId } from '../types/ids';

/** Where a friendship stands, and the day key of the last talk, gift and favour, if any. */
export interface Friendship {
  points: number;
  talked: string | null;
  gifted: string | null;
  favour: string | null;
  /** The bracelet she gave them last, which they wear (0.2's W1). */
  wears?: BraceletId;
  /** What she gave them last, on the day `gifted` (V1's P1), for them to remember it by. */
  gave?: ItemId;
  /** The hearts they had when they last spoke to her (V1's P1), to notice a band reached. */
  spoke?: number;
  /** What they opened their last few days with (V1's P1), so a week never opens the same. */
  opened?: LineKey[];
}

export interface FriendsSnapshot {
  friends: Partial<Record<VillagerId, Friendship>>;
}

const FRESH: Friendship = { points: 0, talked: null, gifted: null, favour: null };
const MOST = MAX_HEARTS * POINTS_PER_HEART;

function dayOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

/** Her friendships, each of which only ever grows (decisions.md 11). */
export class Friends {
  private readonly all = new Map<VillagerId, Friendship>();

  constructor(saved: Partial<FriendsSnapshot> = {}) {
    for (const [id, f] of Object.entries(saved.friends ?? {})) {
      if (!(id in VILLAGERS) || typeof f !== 'object' || f === null) continue;
      const points = Number.isFinite(f.points) ? Math.max(0, Math.min(MOST, f.points)) : 0;
      this.all.set(id as VillagerId, {
        points,
        talked: dayOrNull(f.talked),
        gifted: dayOrNull(f.gifted),
        favour: dayOrNull(f.favour),
        ...(isBracelet(f.wears) ? { wears: f.wears } : {}),
        // What they remember of her (V1's P1): a thing this build doesn't know is forgotten.
        ...(typeof f.gave === 'string' && f.gave in ITEMS ? { gave: f.gave } : {}),
        ...(Number.isFinite(f.spoke) ? { spoke: f.spoke } : {}),
        ...(Array.isArray(f.opened)
          ? { opened: f.opened.filter(Number.isInteger).slice(-OPENERS_KEPT) }
          : {}),
      });
    }
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

  snapshot(): FriendsSnapshot {
    return { friends: Object.fromEntries(this.all) };
  }
}
