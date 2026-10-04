import { isDisplayPiece, isSetPiece } from '../../data/display';
import type { Placed } from '../../data/home';
import { onShow, takes } from '../../systems/display';
import type { ItemId } from '../../types/ids';
import type { Bag, Stack } from '../Bag';
import type { WorldContext } from '../context';
import type { Home } from '../Home';

/** What showing things off reaches into: her bag, her home, and whether she's in it. */
export interface DisplayKeeps {
  bag: Bag;
  home: Home;
  atHome: () => boolean;
}

/**
 * Showing off what she has (0.3's H2). A set piece (her squishy shelf, the dollhouse, the record
 * crate, the bead jar, the bracelet board) shows one of every thing of its kind she owns, wherever
 * it is: her bag, her storage chest, or on show. A display piece (a bell jar, a shadow box, a
 * plinth, a terrarium, a bud vase) holds one thing from her bag, chosen when she walks up to it,
 * and gives it back when it's emptied or put away, so nothing is lost.
 */
export class Display {
  private readonly ctx: WorldContext;
  private readonly keeps: DisplayKeeps;
  private visiting: Placed | null = null;

  constructor(ctx: WorldContext, keeps: DisplayKeeps) {
    this.ctx = ctx;
    this.keeps = keeps;
  }

  /** How many of a thing she owns: in her bag, in her storage chest, and on show. */
  owned(id: ItemId): number {
    const { bag, home } = this.keeps;
    const kept = home.items.find((s) => s.id === id)?.count ?? 0;
    return bag.count(id) + kept + home.onShow(id);
  }

  /** What a placed piece shows, for drawing it: its set as she has it, or what's on show in it. */
  contents(piece: Placed): readonly ItemId[] {
    if (isSetPiece(piece.id)) return onShow(piece.id, (id) => this.owned(id) > 0);
    return piece.shows ? [piece.shows] : [];
  }

  /** She walked up to a display piece: the one the sheet shows. */
  visit(piece: Placed): void {
    this.visiting = isDisplayPiece(piece.id) ? piece : null;
  }

  /** The display piece she last walked up to, while she's home and it's still out. */
  get piece(): Placed | null {
    const piece = this.visiting;
    if (!piece || !this.keeps.atHome() || !this.keeps.home.placed.includes(piece)) return null;
    return piece;
  }

  /** What in her bag the piece will take, and how many of each she could spare. */
  offers(): Stack[] {
    const kind = this.piece?.id;
    if (!kind || !isDisplayPiece(kind)) return [];
    const { bag } = this.keeps;
    return bag.contents.flatMap(({ id }) => {
      const count = bag.spare(id);
      return count > 0 && takes(kind, id) ? [{ id, count }] : [];
    });
  }

  /** Puts one of a thing from her bag on show, giving back whatever was there. */
  show(id: ItemId): boolean {
    const piece = this.piece;
    if (!piece || !this.offers().some((s) => s.id === id)) return false;
    const { bag, home } = this.keeps;
    if (!bag.remove(id, 1)) return false;
    const was = home.showIn(piece, id);
    if (was) bag.add(was, 1);
    this.changed();
    return true;
  }

  /** Takes what's on show back into her bag; false if nothing was. */
  empty(): boolean {
    const piece = this.piece;
    if (!piece?.shows) return false;
    const was = this.keeps.home.showIn(piece, null);
    if (!was) return false;
    this.keeps.bag.add(was, 1);
    this.changed();
    return true;
  }

  private changed(): void {
    this.ctx.events.emit('bag', this.keeps.bag.contents);
    this.ctx.events.emit('home', this.keeps.home);
  }
}
