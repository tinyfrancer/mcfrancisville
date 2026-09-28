import { SHELF_IDS } from '../../data/shelves';
import type { ShelfId } from '../../types/ids';
import type { WorldContext } from '../context';

/** What each collection has in it now, by id. */
export type Shelves = Record<ShelfId, () => Iterable<string>>;

/** What of the "new" marks is saved: the ids on each shelf she hasn't looked at yet. */
export type FreshSnapshot = Record<ShelfId, string[]>;

/** The state events after which a shelf may have something new on it. */
const CHANGES = ['bag', 'home', 'closet', 'recipes', 'cabinet'] as const;

/**
 * The "new" marks on her collections (phase M): anything that arrives on a shelf it wasn't on is
 * new until she opens that shelf's sheet and closes it again. It works by comparing each shelf
 * with what was on it before, so nothing that gives her things needs to know it exists. What she
 * starts with, or had when the game was opened, is never new.
 */
export class Novelty {
  private readonly ctx: WorldContext;
  private readonly shelves: Shelves;
  private readonly known = new Map<ShelfId, Set<string>>();
  private readonly fresh = new Map<ShelfId, Set<string>>();

  /** A saved mark on something she no longer has, or that this build doesn't know, is let go. */
  constructor(ctx: WorldContext, shelves: Shelves, saved: Partial<FreshSnapshot> = {}) {
    this.ctx = ctx;
    this.shelves = shelves;
    for (const shelf of SHELF_IDS) {
      const now = new Set(shelves[shelf]());
      this.known.set(shelf, now);
      this.fresh.set(shelf, new Set((saved[shelf] ?? []).filter((id) => now.has(id))));
    }
    for (const change of CHANGES) ctx.events.on(change, () => this.check());
  }

  /** Marks whatever has arrived on a shelf since it was last looked at, and lets go of what left. */
  check(): void {
    let changed = false;
    for (const shelf of SHELF_IDS) {
      const now = new Set(this.shelves[shelf]());
      const known = this.known.get(shelf)!;
      const fresh = this.fresh.get(shelf)!;
      for (const id of now) {
        if (!known.has(id) && !fresh.has(id)) {
          fresh.add(id);
          changed = true;
        }
      }
      for (const id of fresh) {
        if (!now.has(id)) {
          fresh.delete(id);
          changed = true;
        }
      }
      this.known.set(shelf, now);
    }
    if (changed) this.ctx.events.emit('fresh', this.counts());
  }

  isNew(shelf: ShelfId, id: string): boolean {
    this.check();
    return this.fresh.get(shelf)!.has(id);
  }

  /** How many new things are on each shelf. */
  counts(): Record<ShelfId, number> {
    return Object.fromEntries(SHELF_IDS.map((s) => [s, this.fresh.get(s)!.size])) as Record<
      ShelfId,
      number
    >;
  }

  /** She has looked at a shelf: nothing on it is new any more. */
  seen(shelf: ShelfId): void {
    this.check();
    const fresh = this.fresh.get(shelf)!;
    if (fresh.size === 0) return;
    fresh.clear();
    this.ctx.events.emit('fresh', this.counts());
  }

  snapshot(): { fresh: FreshSnapshot } {
    this.check();
    return {
      fresh: Object.fromEntries(
        SHELF_IDS.map((s) => [s, [...this.fresh.get(s)!]]),
      ) as FreshSnapshot,
    };
  }
}
