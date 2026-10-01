import type { Placed } from '../../data/home';
import { FURNITURE } from '../../data/furniture';
import type { Tile } from '../../systems/pathfinding';
import type { FurnitureId } from '../../types/ids';
import type { WorldContext } from '../context';
import type { Decorating as DecoratingState } from '../events';
import type { Home } from '../Home';

/**
 * Decorating her home: picking up a piece, moving it, turning it, putting it
 * away in the chest or taking one out. `standing` is where she is, which nothing may cover.
 */
export class Decorator {
  private readonly ctx: WorldContext;
  private readonly home: Home;
  private readonly standing: () => Tile;
  private readonly atHome: () => boolean;
  /** Stops her walking and whatever she was about to do, as decorating begins. */
  private readonly settle: () => void;
  private decor: DecoratingState | null = null;

  constructor(
    ctx: WorldContext,
    home: Home,
    her: { standing: () => Tile; atHome: () => boolean; settle: () => void },
  ) {
    this.ctx = ctx;
    this.home = home;
    this.standing = her.standing;
    this.atHome = her.atHome;
    this.settle = her.settle;
    ctx.signals.on('crossed', ({ from }) => {
      if (from === 'home') this.stop();
    });
  }

  /** Where she's decorating, and what she has picked up; null when she isn't. */
  get state(): DecoratingState | null {
    return this.decor;
  }

  /** Starts decorating her home: she stops where she is, and taps pick up and put down pieces. */
  start(selected: Placed | null = null): boolean {
    if (!this.atHome()) return false;
    this.settle();
    this.decor = { selected };
    this.ctx.events.emit('decorating', this.decor);
    return true;
  }

  stop(): void {
    if (!this.decor) return;
    this.decor = null;
    this.ctx.events.emit('decorating', null);
  }

  /**
   * A tap while decorating. A tap on a piece picks it up, and a tap on it again puts it down; with
   * a piece picked up, a tap on somewhere else it could go moves it there.
   */
  tap(tx: number, ty: number): boolean {
    const selected = this.decor?.selected ?? null;
    const there = this.home.pieceAt(tx, ty);
    if (selected && there === selected) {
      this.select(null);
      return true;
    }
    // A floor piece can be put down on a rug, and a rug slid under nothing.
    const onto =
      there &&
      selected &&
      FURNITURE[there.id].layer === 'rug' &&
      FURNITURE[selected.id].layer === 'floor';
    if (there && !onto) {
      this.select(there);
      return true;
    }
    if (!selected) return false;
    const from = { tx: selected.tx, ty: selected.ty };
    const why = this.home.move(selected, tx, ty, this.standing());
    if (why) this.ctx.moments.push({ kind: 'refused', why });
    else {
      const to = { tx: selected.tx, ty: selected.ty };
      this.ctx.signals.emit('moved', { piece: selected.id, from, to });
      this.ctx.events.emit('home', this.home);
    }
    return why === null;
  }

  private select(piece: Placed | null): void {
    this.decor = { selected: piece };
    this.ctx.events.emit('decorating', this.decor);
  }

  /** Turns the piece she has picked up. */
  turnSelected(): boolean {
    const piece = this.decor?.selected;
    if (!piece) return false;
    const why = this.home.turn(piece, this.standing());
    if (why) this.ctx.moments.push({ kind: 'refused', why });
    else this.ctx.events.emit('home', this.home);
    return why === null;
  }

  /** Puts the piece she has picked up back in the chest. */
  putAwaySelected(): boolean {
    const piece = this.decor?.selected;
    if (!piece) return false;
    this.home.putAway(piece);
    this.ctx.signals.emit('moved', {
      piece: piece.id,
      from: { tx: piece.tx, ty: piece.ty },
      to: null,
    });
    this.select(null);
    this.ctx.events.emit('home', this.home);
    return true;
  }

  /**
   * Takes a piece out of the storage chest and sets it down near her, picked up so the next tap
   * moves it. Starts decorating if she wasn't.
   */
  takeOut(id: FurnitureId): boolean {
    if (!this.atHome()) return false;
    const here = this.standing();
    const piece = this.home.takeOut(id, here, here);
    if (!piece) {
      this.ctx.moments.push({ kind: 'refused', why: 'noRoom' });
      return false;
    }
    this.ctx.events.emit('home', this.home);
    if (this.decor) this.select(piece);
    else this.start(piece);
    return true;
  }
}
