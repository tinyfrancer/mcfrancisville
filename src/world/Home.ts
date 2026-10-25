import { FLOORINGS, FURNITURE, WALLPAPERS } from '../data/furniture';
import { ITEMS } from '../data/items';
import { STARTER_HOME, type HomeInput, type HomeSnapshot } from '../data/home';
import type { FlooringId, FurnitureId, ItemId, WallpaperId } from '../types/ids';
import { Rooms } from './Rooms';

/**
 * Her home: the storage chest, which every room and her yard share (pieces, and since 0.3's H1
 * things from her bag, which `world.chest` moves in and out), the wallpapers and floorings she
 * owns, and her rooms, kept by `Rooms` (1.1's W2). Nothing she owns is ever lost: a piece put away
 * goes in the chest. Whatever reads "the room" reads the one she's in, through `home.rooms`
 * (1.3's F6 dropped the one-line reads this class once kept for it).
 */
export class Home {
  private readonly chest: { id: FurnitureId; count: number }[] = [];
  private readonly things: { id: ItemId; count: number }[] = [];
  readonly wallpapers: WallpaperId[];
  readonly floorings: FlooringId[];
  /** Her rooms: what's in each, its walls, floor and size, and which she's in. */
  readonly rooms: Rooms;

  /**
   * `saved` is the home from a save, or the first day's for a new game. Anything this build
   * doesn't know is left out; a piece that no longer fits where it was goes in the chest.
   */
  constructor(saved: HomeInput = STARTER_HOME) {
    for (const s of saved.stored ?? []) {
      if (s.id in FURNITURE && Number.isInteger(s.count) && s.count > 0) this.store(s.id, s.count);
    }
    for (const s of saved.items ?? []) {
      if (s.id in ITEMS && Number.isInteger(s.count) && s.count > 0) this.keep(s.id, s.count);
    }
    const first = STARTER_HOME.rooms.main;
    this.wallpapers = ownedOf(saved.wallpapers, WALLPAPERS, first.wallpaper);
    this.floorings = ownedOf(saved.floorings, FLOORINGS, first.flooring);
    this.rooms = new Rooms(saved, this, this);
  }

  get stored(): readonly { id: FurnitureId; count: number }[] {
    return this.chest;
  }

  /** The things from her bag waiting in the chest. */
  get items(): readonly { id: ItemId; count: number }[] {
    return this.things;
  }

  /** Puts pieces in the chest: bought, put away, or given. */
  store(id: FurnitureId, count = 1): void {
    const stack = this.chest.find((s) => s.id === id);
    if (stack) stack.count += count;
    else this.chest.push({ id, count });
  }

  /**
   * Takes one piece out of the chest, for a room or her yard (0.3's H5); false, and the chest as
   * it was, if she has none.
   */
  unstore(id: FurnitureId): boolean {
    const at = this.chest.findIndex((s) => s.id === id);
    const stack = this.chest[at];
    if (!stack) return false;
    stack.count -= 1;
    if (stack.count === 0) this.chest.splice(at, 1);
    return true;
  }

  /** Puts things from her bag in the chest, on top of any of the same already there. */
  keep(id: ItemId, count: number): void {
    if (!Number.isInteger(count) || count <= 0) return;
    const stack = this.things.find((s) => s.id === id);
    if (stack) stack.count += count;
    else this.things.push({ id, count });
  }

  /**
   * Takes `count` of a thing out of the chest, if that many are there; false, and the chest as it
   * was, if not. A stack taken out to the last leaves the chest.
   */
  release(id: ItemId, count: number): boolean {
    const at = this.things.findIndex((s) => s.id === id);
    const stack = this.things[at];
    if (!stack || !Number.isInteger(count) || count <= 0 || stack.count < count) return false;
    stack.count -= count;
    if (stack.count === 0) this.things.splice(at, 1);
    return true;
  }

  /** A wallpaper for good, bought or given. False if she already had it. */
  giveWallpaper(id: WallpaperId): boolean {
    if (this.wallpapers.includes(id)) return false;
    this.wallpapers.push(id);
    return true;
  }

  giveFlooring(id: FlooringId): boolean {
    if (this.floorings.includes(id)) return false;
    this.floorings.push(id);
    return true;
  }

  snapshot(): HomeSnapshot {
    return {
      ...this.rooms.snapshot(),
      stored: this.chest.map((s) => ({ ...s })),
      items: this.things.map((s) => ({ ...s })),
      wallpapers: [...this.wallpapers],
      floorings: [...this.floorings],
    };
  }
}

/** The ones of `saved` this build knows, or just the first day's if that leaves none. */
function ownedOf<Id extends string>(
  saved: readonly Id[] | undefined,
  rows: Record<Id, unknown>,
  starter: Id,
): Id[] {
  const known = [...new Set((saved ?? []).filter((id) => id in rows))];
  return known.length > 0 ? known : [starter];
}
