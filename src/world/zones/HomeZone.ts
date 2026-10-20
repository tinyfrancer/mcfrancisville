import { FURNITURE } from '../../data/furniture';
import { CHEST, ROOMS, roomOf } from '../../data/home';
import { footprint, isOpenFloor, isWayThrough } from '../../systems/decor';
import type { PlacedProp } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import type { RoomId } from '../../types/ids';
import type { Home } from '../Home';
import type { Rooms } from '../Rooms';
import type { Placed } from '../../data/home';
import { besideInRoom, type Crossing, type Entry, type Zone } from './Zone';

/** The storage chest, as a prop, so walking up to it arrives `at` it like any other. */
const CHEST_PROP: PlacedProp = { id: 'storageChest', ...CHEST, w: 1, h: 1 };

/**
 * Her home: the room she's in, however big she has built it, and what stands in it. Her rooms are
 * one place (0.3's H4): going through a doorway between them is a crossing within it.
 */
export class HomeZone implements Zone {
  readonly id = 'home';
  private readonly rooms: Rooms;
  /** The open floor as of a layout, since pets ask for it every step. */
  private roam: { layout: number; tiles: Tile[] } | null = null;

  constructor(home: Home) {
    this.rooms = home.rooms;
  }

  get width(): number {
    return this.rooms.room.width;
  }

  get height(): number {
    return this.rooms.room.height;
  }

  canWalk = (tx: number, ty: number): boolean => this.rooms.canWalk(tx, ty);

  propAt(tx: number, ty: number): PlacedProp | undefined {
    const chest = this.rooms.room.chest;
    return chest && tx === chest.tx && ty === chest.ty ? CHEST_PROP : undefined;
  }

  standBeside(tx: number, ty: number): Tile[] {
    // A tap on a doorway's arch is a way through it: onto the doorway (0.3's H4).
    const room = this.rooms.room;
    const arch = ty < room.wallRows && room.doorways.find((d) => d.tx === tx);
    if (arch) return [{ tx: arch.tx, ty: arch.ty }];
    const piece = this.rooms.pieceAt(tx, ty);
    const box = this.propAt(tx, ty) ??
      (piece ? { tx: piece.tx, ty: piece.ty, ...footprint(piece.id, piece.turn) } : undefined) ?? {
        tx,
        ty,
        w: 1,
        h: 1,
      };
    return besideInRoom(box, this.rooms.room.wallRows, this.canWalk);
  }

  /**
   * In through her front door, onto the mat, facing into the room; or, for whoever comes to the
   * room she's in further in (a guest, a pet), through its doorway, on its mat.
   */
  entry(): Entry {
    return { tile: this.rooms.room.mat, facing: 'up' };
  }

  /**
   * Walking onto the door mat (not up to something beside it) goes back out, or from a room
   * further in, back through to the room before it; walking onto a doorway goes through it.
   */
  doorAt(here: Tile, prop: PlacedProp | undefined): Crossing | null {
    if (prop) return null;
    const { mat, doorways } = this.rooms.room;
    const doorway = doorways.find((d) => d.tx === here.tx && d.ty === here.ty);
    if (doorway) return { to: 'home', along: 0, room: doorway.to };
    if (here.tx !== mat.tx || here.ty !== mat.ty) return null;
    const back = ROOMS[this.rooms.here].through?.from;
    return back ? { to: 'home', along: 0, room: back } : { to: 'town', along: 0 };
  }

  /**
   * Goes through into another of her rooms (0.3's H4): onto its mat, facing in, going further
   * in; onto the doorway she came through to it, facing out of it, coming back.
   */
  through(to: RoomId): Entry {
    const from = this.rooms.here;
    this.rooms.enter(to);
    const back = this.rooms.room.doorways.find((d) => d.to === from);
    return back
      ? { tile: { tx: back.tx, ty: back.ty }, facing: 'down' }
      : { tile: this.rooms.room.mat, facing: 'up' };
  }

  /**
   * The pieces to sit on in the room she's in, standing on the floor (V1's P5: where Cody sits of
   * an evening).
   */
  get seats(): readonly Placed[] {
    return this.rooms.placed.filter((p) => !p.on && FURNITURE[p.id].seat !== undefined);
  }

  /** Whether she's in the front room, the one with the front door and the chest. */
  get inFrontRoom(): boolean {
    return this.rooms.here === 'main';
  }

  /** She has gone out: whichever room she was in, she comes back in by the front door. */
  leave(): void {
    this.rooms.enter('main');
  }

  /** The open floor a pet can wander to: anywhere but the door mat. */
  roamTiles(): readonly Tile[] {
    const layout = this.rooms.layout;
    if (this.roam?.layout !== layout) this.roam = { layout, tiles: this.openFloor() };
    return this.roam.tiles;
  }

  private openFloor(): Tile[] {
    const room = this.rooms.room;
    const tiles: Tile[] = [];
    for (let ty = 0; ty < room.height; ty++) {
      for (let tx = 0; tx < room.width; tx++) {
        const mat = tx === room.mat.tx && ty === room.mat.ty;
        if (!mat && this.canWalk(tx, ty)) tiles.push({ tx, ty });
      }
    }
    return tiles;
  }

  /**
   * Under the furniture in the front room: the open floor in front of each standing piece, there
   * whichever room she's in, as Fibi's bone is (0.3's H4).
   */
  underFurniture(): Tile[] {
    const spots: Tile[] = [];
    const placed = this.rooms.placedIn('main');
    const room = roomOf(this.rooms.extensions, 'main', this.rooms.built);
    for (const piece of placed) {
      if (FURNITURE[piece.id].layer !== 'floor' || piece.on) continue;
      const { w, h } = footprint(piece.id, piece.turn);
      const t = { tx: piece.tx + Math.floor((w - 1) / 2), ty: piece.ty + h };
      const onWay = isWayThrough(room, t.tx, t.ty);
      if (!onWay && isOpenFloor(room, placed, t.tx, t.ty)) spots.push(t);
    }
    return spots;
  }
}
