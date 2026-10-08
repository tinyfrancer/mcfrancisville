import type { Placed } from '../../data/home';
import { FURNITURE } from '../../data/furniture';
import { isSmall, isSurface } from '../../data/tabletop';
import type { Refusal } from '../../systems/decor';
import type { Tile } from '../../systems/pathfinding';
import type { FurnitureId, ItemId } from '../../types/ids';
import type { WorldContext } from '../context';
import type { Decorating as DecoratingState } from '../events';
import type { Home } from '../Home';
import type { Yard } from '../Yard';

/**
 * Where she decorates (her rooms, or her yard, 0.3's H5): what's where, and the moves a tap
 * makes. `Home` and `Yard` each keep their own and share the storage chest.
 */
export interface Decorable {
  pieceAt(tx: number, ty: number): Placed | undefined;
  surfaceUnder(piece: Placed): Placed | undefined;
  ridersOf(piece: Placed): Placed[];
  move(piece: Placed, tx: number, ty: number, standing: Tile | null): Refusal | null;
  turn(piece: Placed, standing: Tile | null): Refusal | null;
  putAway(piece: Placed): ItemId[];
  takeOut(id: FurnitureId, near: Tile, standing: Tile | null): Placed | null;
  refusesHere(id: FurnitureId): Refusal | null;
}

/**
 * Decorating her home, or her yard: picking up a piece, moving it, turning it, putting it
 * away in the chest or taking one out. `standing` is where she is, which nothing may cover.
 */
export class Decorator {
  private readonly ctx: WorldContext;
  private readonly home: Home;
  private readonly yard: Yard;
  private readonly standing: () => Tile;
  private readonly atHome: () => boolean;
  /** Whether she stands in her yard, in town (0.3's H5). */
  private readonly inYard: () => boolean;
  /** Stops her walking and whatever she was about to do, as decorating begins. */
  private readonly settle: () => void;
  /** Puts what a display piece had on show back in her bag, as it goes in the chest (0.3's H2). */
  private readonly giveBack: (id: ItemId) => void;
  private decor: DecoratingState | null = null;
  /** Whether she's decorating her yard rather than her home. */
  private outside = false;
  /** Whether she stood in her yard when last looked, to say when she steps in or out. */
  private wasInYard = false;

  constructor(
    ctx: WorldContext,
    keeps: { home: Home; yard: Yard },
    her: {
      standing: () => Tile;
      atHome: () => boolean;
      inYard: () => boolean;
      settle: () => void;
      giveBack: (id: ItemId) => void;
    },
  ) {
    this.ctx = ctx;
    this.home = keeps.home;
    this.yard = keeps.yard;
    this.standing = her.standing;
    this.atHome = her.atHome;
    this.inYard = her.inYard;
    this.settle = her.settle;
    this.giveBack = her.giveBack;
    ctx.signals.on('crossed', ({ from }) => {
      if (from === 'home' || from === 'town') this.stop();
    });
  }

  /** Says when she steps into her yard or out of it, so its Decorate button comes and goes. */
  check(): void {
    const now = this.inYard();
    if (now === this.wasInYard) return;
    this.wasInYard = now;
    this.ctx.events.emit('inYard', now);
  }

  /** Whether she stands in her yard now, where she may decorate it. */
  get canDecorateYard(): boolean {
    return this.inYard();
  }

  /** Whether she's decorating her yard (0.3's H5) rather than her home. */
  get outdoors(): boolean {
    return this.decor !== null && this.outside;
  }

  /** Where she decorates now: the room she's in, or her yard. */
  private get place(): Decorable {
    return this.outside ? this.yard : this.home;
  }

  /** Says what changed, for the HUD and the save: her home, or her yard. */
  private changed(): void {
    if (this.outside) this.ctx.events.emit('yard', this.yard);
    else this.ctx.events.emit('home', this.home);
  }

  /** Where she's decorating, and what she has picked up; null when she isn't. */
  get state(): DecoratingState | null {
    return this.decor;
  }

  /**
   * Starts decorating her home, or her yard while she stands in it: she stops where she is, and
   * taps pick up and put down pieces.
   */
  start(selected: Placed | null = null): boolean {
    const home = this.atHome();
    if (!home && !this.inYard()) return false;
    this.outside = !home;
    this.settle();
    this.decor = { selected };
    this.ctx.events.emit('decorating', this.decor);
    return true;
  }

  stop(): void {
    if (!this.decor) return;
    this.decor = null;
    this.outside = false;
    this.ctx.events.emit('decorating', null);
  }

  /**
   * A tap while decorating. A tap on a piece picks it up, and a tap on it again puts it down; with
   * a piece picked up, a tap on somewhere else it could go moves it there. A tap again on a small
   * piece standing on a surface picks up the surface instead, with it on top, and one more puts
   * the surface down (0.3's H3).
   */
  tap(tx: number, ty: number): boolean {
    const place = this.place;
    const selected = this.decor?.selected ?? null;
    const there = place.pieceAt(tx, ty);
    if (selected && there === selected) {
      this.select(place.surfaceUnder(selected) ?? null);
      return true;
    }
    if (selected && there?.on && place.surfaceUnder(there) === selected) {
      this.select(null);
      return true;
    }
    // A floor piece can be put down on a rug, and a rug slid under nothing; a small piece can be
    // put down on a surface with room on it.
    const onto =
      there &&
      selected &&
      ((FURNITURE[there.id].layer === 'rug' && FURNITURE[selected.id].layer === 'floor') ||
        (isSmall(selected.id) && isSurface(there.id) && !there.on));
    if (there && !onto) {
      this.select(there);
      return true;
    }
    if (!selected) return false;
    const going = [selected, ...place.ridersOf(selected)];
    const from = going.map((p) => ({ tx: p.tx, ty: p.ty }));
    const why = place.move(selected, tx, ty, this.standing());
    if (why) this.ctx.moments.push({ kind: 'refused', why });
    else {
      // A planter's bed goes with it, in her front room (the yard has none).
      if (!this.outside) {
        going.forEach((p, k) => {
          const to = { tx: p.tx, ty: p.ty };
          this.ctx.signals.emit('moved', { piece: p.id, from: from[k]!, to });
        });
      }
      this.changed();
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
    const why = this.place.turn(piece, this.standing());
    if (why) this.ctx.moments.push({ kind: 'refused', why });
    else this.changed();
    return why === null;
  }

  /** Puts the piece she has picked up back in the chest. */
  putAwaySelected(): boolean {
    const piece = this.decor?.selected;
    if (!piece) return false;
    const place = this.place;
    const going = [piece, ...place.ridersOf(piece)];
    for (const shown of place.putAway(piece)) this.giveBack(shown);
    for (const p of this.outside ? [] : going) {
      this.ctx.signals.emit('moved', { piece: p.id, from: { tx: p.tx, ty: p.ty }, to: null });
    }
    this.select(null);
    this.changed();
    // The chest is her home's, so it changed either way.
    if (this.outside) this.ctx.events.emit('home', this.home);
    return true;
  }

  /**
   * Takes a piece out of the storage chest and sets it down near her, picked up so the next tap
   * moves it: in her home, or in her yard while she decorates it. Starts decorating if she wasn't.
   */
  takeOut(id: FurnitureId): boolean {
    const home = this.atHome();
    if (!home && !this.inYard()) return false;
    if (!this.decor) this.outside = !home;
    const place = this.place;
    const here = this.standing();
    const piece = place.takeOut(id, here, here);
    if (!piece) {
      this.ctx.moments.push({ kind: 'refused', why: place.refusesHere(id) ?? 'noRoom' });
      return false;
    }
    this.ctx.signals.emit('placed', { piece: id });
    this.changed();
    if (this.outside) this.ctx.events.emit('home', this.home);
    if (this.decor) this.select(piece);
    else this.start(piece);
    return true;
  }

  /** Whether a piece in her storage chest can come out where she's decorating now. */
  fits(id: FurnitureId): boolean {
    return this.place.refusesHere(id) === null;
  }
}
