import { TILE_SIZE } from '../../config/world';
import type { SeatRow } from '../../data/seats';
import type { Tile } from '../../systems/pathfinding';
import type { ZoneId } from '../../types/ids';

/** Facing us, or (on a chair turned to the wall) with her back to us. */
export type SeatFacing = 'down' | 'up';

/** Where she sits, in world pixels. */
export interface Seat {
  /** Her middle. */
  x: number;
  /** Where she rests: the bottom of her hips, on the seat. */
  y: number;
  /** The seat's front edge on the floor; she's drawn just in front of it, or behind facing away. */
  floor: number;
  facing: SeatFacing;
}

/** The tiles a seat covers. */
export interface SeatBox {
  tx: number;
  ty: number;
  w: number;
  h: number;
}

/**
 * Where she sits on a seat covering `box`, having walked up to it from `from`: the end of a
 * long one nearest her, on the seat's top at its front.
 */
export function seatOn(box: SeatBox, row: SeatRow, facing: SeatFacing, from: Tile): Seat {
  const tx = Math.min(box.tx + box.w - 1, Math.max(box.tx, from.tx));
  const floor = (box.ty + box.h) * TILE_SIZE;
  return { x: tx * TILE_SIZE + TILE_SIZE / 2, y: floor - row.height, floor, facing };
}

/**
 * Sitting (0.2's G1): walking up to a seat sits her down and the next tap stands her up; nothing
 * else happens (decision 136). She keeps the tile she walked to, so nothing about her is saved
 * and she opens the game standing beside it.
 */
export class Sitting {
  private readonly scene: () => ZoneId;
  private seated: { seat: Seat; scene: ZoneId } | null = null;

  constructor(scene: () => ZoneId) {
    this.scene = scene;
  }

  /** Where she's sitting, or null standing. */
  get seat(): Seat | null {
    return this.seated?.scene === this.scene() ? this.seated.seat : null;
  }

  sit(seat: Seat): void {
    this.seated = { seat, scene: this.scene() };
  }

  /** Up she gets; true if she was sitting. */
  stand(): boolean {
    const was = this.seat !== null;
    this.seated = null;
    return was;
  }
}
