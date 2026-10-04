import { FURNITURE } from '../../data/furniture';
import { CHEST } from '../../data/home';
import { footprint } from '../../systems/decor';
import type { PlacedProp } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import type { Home } from '../Home';
import { besideInRoom, type Crossing, type Entry, type Zone } from './Zone';

/** The storage chest, as a prop, so walking up to it arrives `at` it like any other. */
const CHEST_PROP: PlacedProp = { id: 'storageChest', ...CHEST, w: 1, h: 1 };

/** Her home: the room, however big she has built it, and what stands in it. */
export class HomeZone implements Zone {
  readonly id = 'home';
  private readonly home: Home;
  /** The open floor as of a layout, since pets ask for it every step. */
  private roam: { layout: number; tiles: Tile[] } | null = null;

  constructor(home: Home) {
    this.home = home;
  }

  get width(): number {
    return this.home.room.width;
  }

  get height(): number {
    return this.home.room.height;
  }

  canWalk = (tx: number, ty: number): boolean => this.home.canWalk(tx, ty);

  propAt(tx: number, ty: number): PlacedProp | undefined {
    return tx === CHEST.tx && ty === CHEST.ty ? CHEST_PROP : undefined;
  }

  standBeside(tx: number, ty: number): Tile[] {
    const piece = this.home.pieceAt(tx, ty);
    const box = this.propAt(tx, ty) ??
      (piece ? { tx: piece.tx, ty: piece.ty, ...footprint(piece.id, piece.turn) } : undefined) ?? {
        tx,
        ty,
        w: 1,
        h: 1,
      };
    return besideInRoom(box, this.home.room.wallRows, this.canWalk);
  }

  /** In through her front door, onto the mat, facing into the room. */
  entry(): Entry {
    return { tile: this.home.room.mat, facing: 'up' };
  }

  /** Walking onto the door mat (not up to something beside it) goes back out. */
  doorAt(here: Tile, prop: PlacedProp | undefined): Crossing | null {
    const mat = this.home.room.mat;
    return !prop && here.tx === mat.tx && here.ty === mat.ty ? { to: 'town', along: 0 } : null;
  }

  /** The open floor a pet can wander to: anywhere but the door mat. */
  roamTiles(): readonly Tile[] {
    const layout = this.home.layout;
    if (this.roam?.layout !== layout) this.roam = { layout, tiles: this.openFloor() };
    return this.roam.tiles;
  }

  private openFloor(): Tile[] {
    const room = this.home.room;
    const tiles: Tile[] = [];
    for (let ty = 0; ty < room.height; ty++) {
      for (let tx = 0; tx < room.width; tx++) {
        const mat = tx === room.mat.tx && ty === room.mat.ty;
        if (!mat && this.canWalk(tx, ty)) tiles.push({ tx, ty });
      }
    }
    return tiles;
  }

  /** Under the furniture: the open floor in front of each standing piece. */
  underFurniture(): Tile[] {
    const spots: Tile[] = [];
    const mat = this.home.room.mat;
    for (const piece of this.home.placed) {
      if (FURNITURE[piece.id].layer !== 'floor' || piece.on) continue;
      const { w, h } = footprint(piece.id, piece.turn);
      const t = { tx: piece.tx + Math.floor((w - 1) / 2), ty: piece.ty + h };
      const onMat = t.tx === mat.tx && t.ty === mat.ty;
      if (!onMat && this.canWalk(t.tx, t.ty)) spots.push(t);
    }
    return spots;
  }
}
