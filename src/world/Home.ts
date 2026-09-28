import { FLOORINGS, FURNITURE, turnCount, WALLPAPERS } from '../data/furniture';
import {
  MAX_ROOM_SIZE,
  roomOf,
  STARTER_HOME,
  type HomeSnapshot,
  type Placed,
  type Room,
} from '../data/home';
import {
  anchorsFor,
  covers,
  isOpenFloor,
  nearestFit,
  refusal,
  type Refusal,
} from '../systems/decor';
import type { Tile } from '../systems/pathfinding';
import type { FlooringId, FurnitureId, WallpaperId } from '../types/ids';

/**
 * Her home: what stands and hangs where, what waits in the storage chest, and what's on the walls
 * and floor. It keeps the state and asks `systems/decor.ts` what fits; `World` decides when she's
 * inside and what a tap does. Nothing she owns is ever lost: a piece put away goes in the chest.
 */
export class Home {
  private readonly pieces: Placed[] = [];
  private readonly chest: { id: FurnitureId; count: number }[] = [];
  private papered: WallpaperId;
  private laid: FlooringId;
  private shape: Room;
  private changes = 0;
  readonly wallpapers: WallpaperId[];
  readonly floorings: FlooringId[];

  /**
   * `saved` is the home from a save, or the first day's for a new game. A piece this build doesn't
   * know is left out; one that no longer fits where it was (a smaller room, a new rule) goes in the
   * chest rather than being lost.
   */
  constructor(saved: Partial<HomeSnapshot> = STARTER_HOME) {
    this.shape = roomOf(Number.isInteger(saved.size) ? saved.size! : 0);
    for (const s of saved.stored ?? []) {
      if (s.id in FURNITURE && Number.isInteger(s.count) && s.count > 0) this.store(s.id, s.count);
    }
    for (const p of saved.placed ?? []) {
      if (!(p.id in FURNITURE) || !Number.isInteger(p.tx) || !Number.isInteger(p.ty)) continue;
      const turn = Number.isInteger(p.turn) ? Math.abs(p.turn) % turnCount(p.id) : 0;
      const piece = { id: p.id, tx: p.tx, ty: p.ty, turn };
      if (refusal(this.shape, this.pieces, piece, null) === null) this.pieces.push(piece);
      else this.store(p.id);
    }
    this.wallpapers = ownedOf(saved.wallpapers, WALLPAPERS, STARTER_HOME.wallpaper);
    this.floorings = ownedOf(saved.floorings, FLOORINGS, STARTER_HOME.flooring);
    this.papered =
      saved.wallpaper && this.wallpapers.includes(saved.wallpaper)
        ? saved.wallpaper
        : this.wallpapers[0]!;
    this.laid =
      saved.flooring && this.floorings.includes(saved.flooring)
        ? saved.flooring
        : this.floorings[0]!;
  }

  /** Her room, as big as she has built it. */
  get room(): Room {
    return this.shape;
  }

  /** Whether there's an extension left to build. */
  get canGrow(): boolean {
    return this.shape.size < MAX_ROOM_SIZE;
  }

  /**
   * Builds the next extension: the room grows wider and deeper, and everything stays where it was.
   * False if it's as big as it gets.
   */
  grow(): boolean {
    if (!this.canGrow) return false;
    this.shape = roomOf(this.shape.size + 1);
    this.changes++;
    return true;
  }

  /** Counts every change to the room's shape or what stands in it, so the open floor can be kept. */
  get layout(): number {
    return this.changes;
  }

  get placed(): readonly Placed[] {
    return this.pieces;
  }

  get stored(): readonly { id: FurnitureId; count: number }[] {
    return this.chest;
  }

  get wallpaper(): WallpaperId {
    return this.papered;
  }

  get flooring(): FlooringId {
    return this.laid;
  }

  /** What's at a tile, from the top: a wall piece on the wall; on the floor, a piece before a rug. */
  pieceAt(tx: number, ty: number): Placed | undefined {
    const here = this.pieces.filter((p) => covers(p, tx, ty));
    const on = (layer: string) => here.find((p) => FURNITURE[p.id].layer === layer);
    return ty < this.shape.wallRows ? on('wall') : (on('floor') ?? on('rug'));
  }

  canWalk(tx: number, ty: number): boolean {
    return isOpenFloor(this.shape, this.pieces, tx, ty);
  }

  /** Puts pieces in the chest: bought, put away, or given. */
  store(id: FurnitureId, count = 1): void {
    const stack = this.chest.find((s) => s.id === id);
    if (stack) stack.count += count;
    else this.chest.push({ id, count });
  }

  /**
   * Takes a piece out of the chest and puts it wherever it fits nearest `near`. Null, and the
   * piece left in the chest, if she has none or there's no room anywhere.
   */
  takeOut(id: FurnitureId, near: Tile, standing: Tile | null): Placed | null {
    const at = this.chest.findIndex((s) => s.id === id);
    const stack = this.chest[at];
    if (!stack) return null;
    const piece = nearestFit(this.shape, this.pieces, id, near, standing);
    if (!piece) return null;
    stack.count -= 1;
    if (stack.count === 0) this.chest.splice(at, 1);
    this.pieces.push(piece);
    this.changes++;
    return piece;
  }

  /**
   * Moves a placed piece so it covers a tapped tile, whichever way round fits best. Null if it
   * moved, or why it couldn't; it stays put if it couldn't.
   */
  move(piece: Placed, tx: number, ty: number, standing: Tile | null): Refusal | null {
    const others = this.pieces.filter((p) => p !== piece);
    let why: Refusal | null = null;
    for (const at of anchorsFor(piece.id, piece.turn, tx, ty)) {
      const no = refusal(this.shape, others, at, standing);
      if (no === null) {
        piece.tx = at.tx;
        piece.ty = at.ty;
        this.changes++;
        return null;
      }
      why ??= no;
    }
    return why;
  }

  /** Turns a piece to face the next way, if it has another way to face and still fits. */
  turn(piece: Placed, standing: Tile | null): Refusal | null {
    const count = turnCount(piece.id);
    if (count === 1) return null;
    const turned = { ...piece, turn: (piece.turn + 1) % count };
    const why = refusal(
      this.shape,
      this.pieces.filter((p) => p !== piece),
      turned,
      standing,
    );
    if (why === null) {
      piece.turn = turned.turn;
      this.changes++;
    }
    return why;
  }

  /** Puts a placed piece back in the chest. */
  putAway(piece: Placed): void {
    const at = this.pieces.indexOf(piece);
    if (at < 0) return;
    this.pieces.splice(at, 1);
    this.changes++;
    this.store(piece.id);
  }

  /** Puts up a wallpaper she owns. */
  paper(id: WallpaperId): boolean {
    if (!this.wallpapers.includes(id)) return false;
    this.papered = id;
    return true;
  }

  /** Lays a flooring she owns. */
  lay(id: FlooringId): boolean {
    if (!this.floorings.includes(id)) return false;
    this.laid = id;
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
      placed: this.pieces.map((p) => ({ ...p })),
      stored: this.chest.map((s) => ({ ...s })),
      wallpaper: this.papered,
      flooring: this.laid,
      wallpapers: [...this.wallpapers],
      floorings: [...this.floorings],
      size: this.shape.size,
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
