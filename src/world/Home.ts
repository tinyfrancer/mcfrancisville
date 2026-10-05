import { isDisplayPiece } from '../data/display';
import { FLOORINGS, FURNITURE, turnCount, WALLPAPERS } from '../data/furniture';
import { ITEMS } from '../data/items';
import {
  MAX_ROOM_SIZE,
  ROOM_IDS,
  roomOf,
  ROOMS,
  STARTER_HOME,
  type HomeInput,
  type HomeSnapshot,
  type Placed,
  type Room,
  type RoomSnapshot,
} from '../data/home';
import {
  anchorsFor,
  covers,
  isOpenFloor,
  nearestFit,
  refusal,
  riderAt,
  ridersOf,
  surfaceAt,
  type Refusal,
} from '../systems/decor';
import { isSmall } from '../data/tabletop';
import { takes } from '../systems/display';
import type { Tile } from '../systems/pathfinding';
import type { FlooringId, FurnitureId, ItemId, RoomId, WallpaperId } from '../types/ids';

/** One of her rooms: what stands and hangs in it, its walls and floor, and how big it is. */
interface RoomState {
  id: RoomId;
  pieces: Placed[];
  papered: WallpaperId;
  laid: FlooringId;
  shape: Room;
}

/**
 * Her home: what stands and hangs where in each of her rooms (0.3's H4), what waits in the storage
 * chest, and what's on the walls and floor. It keeps the state and asks `systems/decor.ts` what
 * fits; `World` decides when she's inside and what a tap does. Nothing she owns is ever lost: a
 * piece put away goes in the chest. The chest keeps things from her bag too (0.3's H1), which
 * `world.chest` moves in and out. Whatever reads "the room" reads the one she's in.
 */
export class Home {
  private readonly rooms = new Map<RoomId, RoomState>();
  private at: RoomState;
  private readonly chest: { id: FurnitureId; count: number }[] = [];
  private readonly things: { id: ItemId; count: number }[] = [];
  private changes = 0;
  readonly wallpapers: WallpaperId[];
  readonly floorings: FlooringId[];

  /**
   * `saved` is the home from a save, or the first day's for a new game. A piece this build doesn't
   * know is left out; one that no longer fits where it was (a smaller room, a new rule) goes in the
   * chest rather than being lost.
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
    // A room is hers if it's saved and the room it's through is too; the front room always is.
    const built: RoomId[] = [];
    for (const id of ROOM_IDS) {
      const from = ROOMS[id].through?.from;
      if (id === 'main' || (saved.rooms?.[id] && from && built.includes(from))) built.push(id);
    }
    for (const id of built) {
      const room = saved.rooms?.[id] ?? {};
      const state: RoomState = {
        id,
        pieces: [],
        papered: ownedOr(room.wallpaper, this.wallpapers),
        laid: ownedOr(room.flooring, this.floorings),
        shape: roomOf(Number.isInteger(room.size) ? room.size! : 0, id, built),
      };
      this.rooms.set(id, state);
      this.fit(state, room.placed ?? []);
    }
    this.at = this.rooms.get(saved.here ?? 'main') ?? this.rooms.get('main')!;
  }

  /**
   * Stands pieces in a room, each where it says if it fits there now, or in the chest. The
   * surfaces go first, so what stands on them has them to stand on (0.3's H3).
   */
  private fit(state: RoomState, placed: readonly Placed[]): void {
    for (const p of [...placed.filter((p) => !p.on), ...placed.filter((p) => p.on)]) {
      if (!(p.id in FURNITURE) || !Number.isInteger(p.tx) || !Number.isInteger(p.ty)) continue;
      const turn = Number.isInteger(p.turn) ? Math.abs(p.turn) % turnCount(p.id) : 0;
      const piece: Placed = { id: p.id, tx: p.tx, ty: p.ty, turn };
      // A small piece whose surface has gone stands on the floor where it was, if it can.
      if (p.on === true) piece.on = true;
      if (piece.on && refusal(state.shape, state.pieces, piece, null) !== null) delete piece.on;
      // What was on show stays on show, or waits in the chest if it can't, never lost (0.3's H2).
      const shows = p.shows !== undefined && p.shows in ITEMS ? p.shows : undefined;
      const fits =
        refusal(state.shape, state.pieces, piece, null) === null &&
        refusesIn(state.id, p.id) === null;
      if (shows && fits && isDisplayPiece(p.id) && takes(p.id, shows)) piece.shows = shows;
      else if (shows) this.keep(shows, 1);
      if (fits) state.pieces.push(piece);
      else this.store(p.id);
    }
  }

  /** The room she's in, as big as she has built it. */
  get room(): Room {
    return this.at.shape;
  }

  /** Which of her rooms she's in. */
  get here(): RoomId {
    return this.at.id;
  }

  /** The rooms she has, the front room first. */
  get built(): RoomId[] {
    return [...this.rooms.keys()];
  }

  has(id: RoomId): boolean {
    return this.rooms.has(id);
  }

  /** Goes into one of her rooms; false, and staying where she is, if it isn't one she has. */
  enter(id: RoomId): boolean {
    const room = this.rooms.get(id);
    if (!room) return false;
    if (room !== this.at) this.changes++;
    this.at = room;
    return true;
  }

  /**
   * Builds a room onto her home (0.3's H4), through a doorway in the back wall of the room it's
   * through, papered and floored like that room. Anything in the doorway's way goes in the chest,
   * with what it had on show, and is handed back so a planter's bed can go too. Null if she has it
   * already, or hasn't the room it's through.
   */
  build(id: RoomId): Placed[] | null {
    const from = ROOMS[id].through?.from;
    if (this.rooms.has(id) || !from || !this.rooms.has(from)) return null;
    const parent = this.rooms.get(from)!;
    this.rooms.set(id, {
      id,
      pieces: [],
      papered: parent.papered,
      laid: parent.laid,
      shape: roomOf(0, id, this.built),
    });
    return this.reshape(parent, parent.shape.size);
  }

  /** How many extensions her front room has had, whichever room she's in. */
  get extensions(): number {
    return this.rooms.get('main')!.shape.size;
  }

  /** Whether there's an extension left to build. */
  get canGrow(): boolean {
    return this.extensions < MAX_ROOM_SIZE;
  }

  /**
   * Builds the next extension: the front room grows wider and deeper, and everything stays where
   * it was. False if it's as big as it gets.
   */
  grow(): boolean {
    if (!this.canGrow) return false;
    this.reshape(this.rooms.get('main')!, this.extensions + 1);
    return true;
  }

  /**
   * A room at a size, with a doorway to each room through it, and its pieces stood again: those
   * that no longer fit, which went in the chest.
   */
  private reshape(state: RoomState, size: number): Placed[] {
    state.shape = roomOf(size, state.id, this.built);
    const was = state.pieces.splice(0);
    this.fit(state, was);
    this.changes++;
    const kept = new Set(state.pieces.map((p) => `${p.id}:${p.tx},${p.ty}`));
    return was.filter((p) => !kept.has(`${p.id}:${p.tx},${p.ty}`));
  }

  /** Counts every change to the room's shape or what stands in it, so the open floor can be kept. */
  get layout(): number {
    return this.changes;
  }

  /** What stands and hangs in the room she's in. */
  get placed(): readonly Placed[] {
    return this.at.pieces;
  }

  /** What stands and hangs in one of her rooms; nothing, in one she hasn't built. */
  placedIn(id: RoomId): readonly Placed[] {
    return this.rooms.get(id)?.pieces ?? [];
  }

  /** Every piece she has out, in every room. */
  get everyPiece(): Placed[] {
    return [...this.rooms.values()].flatMap((r) => r.pieces);
  }

  get stored(): readonly { id: FurnitureId; count: number }[] {
    return this.chest;
  }

  /** The things from her bag waiting in the chest. */
  get items(): readonly { id: ItemId; count: number }[] {
    return this.things;
  }

  get wallpaper(): WallpaperId {
    return this.at.papered;
  }

  get flooring(): FlooringId {
    return this.at.laid;
  }

  /**
   * What's at a tile, from the top: a wall piece on the wall; on the floor, what stands on a
   * surface, then a piece, then a rug.
   */
  pieceAt(tx: number, ty: number): Placed | undefined {
    const here = this.at.pieces.filter((p) => covers(p, tx, ty));
    const on = (layer: string) => here.find((p) => !p.on && FURNITURE[p.id].layer === layer);
    if (ty < this.room.wallRows) return on('wall');
    return riderAt(here, tx, ty) ?? on('floor') ?? on('rug');
  }

  /** The surface a small piece stands on, or undefined if it's on the floor. */
  surfaceUnder(piece: Placed): Placed | undefined {
    return piece.on ? surfaceAt(this.at.pieces, piece.tx, piece.ty) : undefined;
  }

  /** What stands on a surface (0.3's H3): nothing, for anything else. */
  ridersOf(piece: Placed): Placed[] {
    return piece.on ? [] : ridersOf(this.at.pieces, piece);
  }

  canWalk(tx: number, ty: number): boolean {
    return isOpenFloor(this.room, this.at.pieces, tx, ty);
  }

  /** Puts pieces in the chest: bought, put away, or given. */
  store(id: FurnitureId, count = 1): void {
    const stack = this.chest.find((s) => s.id === id);
    if (stack) stack.count += count;
    else this.chest.push({ id, count });
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

  /** Why a piece can't come out in the room she's in at all (0.3's H4), or null if it can. */
  refusesHere(id: FurnitureId): Refusal | null {
    return refusesIn(this.at.id, id);
  }

  /**
   * Takes a piece out of the chest and puts it wherever it fits nearest `near`. Null, and the
   * piece left in the chest, if she has none, it can't come out in this room, or there's no room
   * anywhere.
   */
  takeOut(id: FurnitureId, near: Tile, standing: Tile | null): Placed | null {
    const at = this.chest.findIndex((s) => s.id === id);
    const stack = this.chest[at];
    if (!stack || this.refusesHere(id)) return null;
    const piece = nearestFit(this.room, this.at.pieces, id, near, standing);
    if (!piece) return null;
    stack.count -= 1;
    if (stack.count === 0) this.chest.splice(at, 1);
    this.at.pieces.push(piece);
    this.changes++;
    return piece;
  }

  /**
   * Moves a placed piece so it covers a tapped tile, whichever way round fits best. Null if it
   * moved, or why it couldn't; it stays put if it couldn't. A small piece tapped onto a surface
   * stands on it, and what stands on a surface goes with it (0.3's H3).
   */
  move(piece: Placed, tx: number, ty: number, standing: Tile | null): Refusal | null {
    const riders = this.ridersOf(piece);
    const others = this.at.pieces.filter((p) => p !== piece && !riders.includes(p));
    const up = isSmall(piece.id) && surfaceAt(others, tx, ty) !== undefined;
    const places: Placed[] = up
      ? [{ id: piece.id, turn: piece.turn, tx, ty, on: true }]
      : anchorsFor(piece.id, piece.turn, tx, ty);
    let why: Refusal | null = null;
    for (const at of places) {
      const no = refusal(this.room, others, at, standing);
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

  /** Turns a piece to face the next way, if it has another way to face and still fits. */
  turn(piece: Placed, standing: Tile | null): Refusal | null {
    const count = turnCount(piece.id);
    if (count === 1) return null;
    const turned = { ...piece, turn: (piece.turn + 1) % count };
    const why = refusal(
      this.room,
      this.at.pieces.filter((p) => p !== piece),
      turned,
      standing,
    );
    if (why === null) {
      piece.turn = turned.turn;
      this.changes++;
    }
    return why;
  }

  /**
   * Puts a placed piece back in the chest, and what stands on it with it (0.3's H3). What any of
   * them had on show comes out, for her bag (0.3's H2).
   */
  putAway(piece: Placed): ItemId[] {
    const pieces = this.at.pieces;
    if (!pieces.includes(piece)) return [];
    const shown: ItemId[] = [];
    for (const p of [piece, ...this.ridersOf(piece)]) {
      pieces.splice(pieces.indexOf(p), 1);
      this.store(p.id);
      if (p.shows) shown.push(p.shows);
      delete p.shows;
    }
    this.changes++;
    return shown;
  }

  /**
   * Puts a thing on show in a placed display piece, or nothing, and hands back what was on show
   * before (0.3's H2): null if nothing was, or if the piece isn't hers or won't take it.
   */
  showIn(piece: Placed, id: ItemId | null): ItemId | null {
    if (!this.at.pieces.includes(piece) || !isDisplayPiece(piece.id)) return null;
    if (id !== null && !takes(piece.id, id)) return null;
    const was = piece.shows ?? null;
    if (id === null) delete piece.shows;
    else piece.shows = id;
    return was;
  }

  /** How many of a thing are on show in her display pieces, in every room. */
  onShow(id: ItemId): number {
    return this.everyPiece.filter((p) => p.shows === id).length;
  }

  /** Puts up a wallpaper she owns, in the room she's in. */
  paper(id: WallpaperId): boolean {
    if (!this.wallpapers.includes(id)) return false;
    this.at.papered = id;
    return true;
  }

  /** Lays a flooring she owns, in the room she's in. */
  lay(id: FlooringId): boolean {
    if (!this.floorings.includes(id)) return false;
    this.at.laid = id;
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
    const room = (r: RoomState): RoomSnapshot => ({
      placed: r.pieces.map((p) => ({ ...p })),
      wallpaper: r.papered,
      flooring: r.laid,
      size: r.shape.size,
    });
    const rooms: HomeSnapshot['rooms'] = { main: room(this.rooms.get('main')!) };
    for (const r of this.rooms.values()) if (r.id !== 'main') rooms[r.id] = room(r);
    return {
      rooms,
      here: this.at.id,
      stored: this.chest.map((s) => ({ ...s })),
      items: this.things.map((s) => ({ ...s })),
      wallpapers: [...this.wallpapers],
      floorings: [...this.floorings],
    };
  }
}

/**
 * Why a piece can't stand in a room at all (0.3's H4): a planter is a bed, kept by the garden in
 * the front room only, so it stays there.
 */
function refusesIn(room: RoomId, id: FurnitureId): Refusal | null {
  return FURNITURE[id].planter && room !== 'main' ? 'frontRoom' : null;
}

/** A wallpaper or flooring she owns, or the first she owns if not. */
function ownedOr<Id extends string>(id: Id | undefined, owned: readonly Id[]): Id {
  return id && owned.includes(id) ? id : owned[0]!;
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
