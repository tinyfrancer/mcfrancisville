import { FURNITURE, turnCount } from '../data/furniture';
import type { Placed } from '../data/home';
import { isSmall } from '../data/tabletop';
import { isOutdoor, type YardSnapshot } from '../data/yard';
import { anchorsFor, covers, riderAt, ridersOf, surfaceAt, type Refusal } from '../systems/decor';
import type { Tile } from '../systems/pathfinding';
import { inBox, standsOn, yardFit, yardRefusal, type YardGround } from '../systems/yard';
import type { FurnitureId, ItemId } from '../types/ids';
import type { Home } from './Home';

/**
 * Her yard (0.3's H5): what of hers stands on the grass round her house. It keeps the pieces and
 * asks `systems/yard.ts` what fits, as `Home` asks `systems/decor.ts` for a room; the storage
 * chest is her home's, shared, so a piece put away from the yard goes in it and one taken out comes
 * from it. Nothing is ever lost: a saved piece that no longer fits waits in the chest.
 */
export class Yard {
  private readonly ground: YardGround | null;
  private readonly home: Home;
  private readonly pieces: Placed[] = [];
  private changes = 0;

  constructor(ground: YardGround | null, home: Home, saved?: Partial<YardSnapshot>) {
    this.ground = ground;
    this.home = home;
    const placed = Array.isArray(saved?.placed) ? saved.placed : [];
    // The surfaces first, so what stands on them has them to stand on (0.3's H3).
    for (const p of [...placed.filter((p) => !p.on), ...placed.filter((p) => p.on)]) {
      if (!(p.id in FURNITURE) || !Number.isInteger(p.tx) || !Number.isInteger(p.ty)) continue;
      const turn = Number.isInteger(p.turn) ? Math.abs(p.turn) % turnCount(p.id) : 0;
      const piece: Placed = { id: p.id, tx: p.tx, ty: p.ty, turn };
      if (p.on === true) piece.on = true;
      if (ground && yardRefusal(ground, this.pieces, piece, null) === null) this.pieces.push(piece);
      else home.store(p.id);
    }
  }

  /** Whether the town has a yard of hers at all (a test's small map may not). */
  get exists(): boolean {
    return this.ground !== null;
  }

  /** Whether a tile is in her yard, where she stands to decorate it. */
  contains(tx: number, ty: number): boolean {
    return this.ground !== null && inBox(this.ground.box, tx, ty);
  }

  /** The tiles a piece may stand on, for the view to mark while she decorates. */
  lawn(): Tile[] {
    const g = this.ground;
    if (!g) return [];
    return [...g.lawn].map((i) => ({ tx: i % g.map.width, ty: Math.floor(i / g.map.width) }));
  }

  /** What stands out in her yard. */
  get placed(): readonly Placed[] {
    return this.pieces;
  }

  /** Counts every change to what stands out there. */
  get layout(): number {
    return this.changes;
  }

  /** What's at a tile, from the top: what stands on a surface, then a standing piece. */
  pieceAt(tx: number, ty: number): Placed | undefined {
    const here = this.pieces.filter((p) => covers(p, tx, ty));
    return riderAt(here, tx, ty) ?? here.find((p) => !p.on);
  }

  /** Whether a piece of hers stands on a tile, which nobody walks through. */
  blocks(tx: number, ty: number): boolean {
    return this.pieces.length > 0 && standsOn(this.pieces, tx, ty);
  }

  surfaceUnder(piece: Placed): Placed | undefined {
    return piece.on ? surfaceAt(this.pieces, piece.tx, piece.ty) : undefined;
  }

  ridersOf(piece: Placed): Placed[] {
    return piece.on ? [] : ridersOf(this.pieces, piece);
  }

  /** Why a piece can't come out in her yard at all: one that stays indoors. */
  refusesHere(id: FurnitureId): Refusal | null {
    if (!this.ground) return 'noRoom';
    return isOutdoor(id) ? null : 'indoors';
  }

  /**
   * Takes a piece out of the storage chest and stands it on the lawn nearest `near`. Null, and the
   * piece left in the chest, if she has none, it stays indoors, or there's no room.
   */
  takeOut(id: FurnitureId, near: Tile, standing: Tile | null): Placed | null {
    if (!this.ground || this.refusesHere(id) || !this.home.stored.some((s) => s.id === id)) {
      return null;
    }
    const piece = yardFit(this.ground, this.pieces, id, near, standing);
    if (!piece || !this.home.unstore(id)) return null;
    this.pieces.push(piece);
    this.changes++;
    return piece;
  }

  /**
   * Moves a piece so it covers a tapped tile, whichever way round fits best, as at home: a small
   * piece tapped onto a surface stands on it, and what stands on a surface goes with it.
   */
  move(piece: Placed, tx: number, ty: number, standing: Tile | null): Refusal | null {
    if (!this.ground) return 'noRoom';
    const riders = this.ridersOf(piece);
    const others = this.pieces.filter((p) => p !== piece && !riders.includes(p));
    const up = isSmall(piece.id) && surfaceAt(others, tx, ty) !== undefined;
    const places: Placed[] = up
      ? [{ id: piece.id, turn: piece.turn, tx, ty, on: true }]
      : anchorsFor(piece.id, piece.turn, tx, ty);
    let why: Refusal | null = null;
    for (const at of places) {
      const no = yardRefusal(this.ground, others, at, standing);
      if (no === null) {
        for (const r of riders) {
          r.tx += at.tx - piece.tx;
          r.ty += at.ty - piece.ty;
        }
        piece.tx = at.tx;
        piece.ty = at.ty;
        if (at.on) piece.on = true;
        else delete piece.on;
        this.changes++;
        return null;
      }
      why ??= no;
    }
    return why;
  }

  /** Turns a piece to face the next way, if it has another way and still fits. */
  turn(piece: Placed, standing: Tile | null): Refusal | null {
    const count = turnCount(piece.id);
    if (count === 1 || !this.ground) return null;
    const turned = { ...piece, turn: (piece.turn + 1) % count };
    const others = this.pieces.filter((p) => p !== piece);
    const why = yardRefusal(this.ground, others, turned, standing);
    if (why === null) {
      piece.turn = turned.turn;
      this.changes++;
    }
    return why;
  }

  /** Puts a piece back in the storage chest, and what stands on it with it. Nothing is on show. */
  putAway(piece: Placed): ItemId[] {
    if (!this.pieces.includes(piece)) return [];
    for (const p of [piece, ...this.ridersOf(piece)]) {
      this.pieces.splice(this.pieces.indexOf(p), 1);
      this.home.store(p.id);
    }
    this.changes++;
    return [];
  }

  snapshot(): YardSnapshot {
    return { placed: this.pieces.map((p) => ({ ...p })) };
  }
}
