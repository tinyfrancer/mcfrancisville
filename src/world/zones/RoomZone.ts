import { FIXTURES, INTERIORS, type InteriorPiece, type PlacedFixture } from '../../data/interiors';
import { FURNITURE } from '../../data/furniture';
import { roomShaped, type Room } from '../../data/home';
import { footprint } from '../../systems/decor';
import type { PlacedProp } from '../../systems/grid';
import type { Tile } from '../../systems/pathfinding';
import { outsideOf } from '../../systems/zones';
import type { InteriorId } from '../../types/ids';
import { besideInRoom, type Crossing, type Entry, type Zone } from './Zone';

/** Something in a building she can walk up to: a fixture, or a piece of furniture. */
export type RoomThing = { fixture: PlacedFixture } | { piece: InteriorPiece };

/** The tiles a thing in a room covers. */
export function boxOf(thing: RoomThing): { tx: number; ty: number; w: number; h: number } {
  if ('fixture' in thing) {
    const { tx, ty, id } = thing.fixture;
    return { tx, ty, ...FIXTURES[id].size };
  }
  const { tx, ty, id, turn } = thing.piece;
  return { tx, ty, ...footprint(id, turn) };
}

/** Where a thing goes: standing on the floor, lying flat on it, or hanging on the wall. */
export function layerOf(thing: RoomThing): 'floor' | 'rug' | 'wall' {
  return 'fixture' in thing ? FIXTURES[thing.fixture.id].layer : FURNITURE[thing.piece.id].layer;
}

/** A rug in a building is only walked over, unless it's a keepsake to ask about. */
export function worthVisiting(thing: RoomThing): boolean {
  return 'fixture' in thing || FURNITURE[thing.piece.id].layer !== 'rug' || !!thing.piece.keepsake;
}

function covers(box: { tx: number; ty: number; w: number; h: number }, tx: number, ty: number) {
  return tx >= box.tx && tx < box.tx + box.w && ty >= box.ty && ty < box.ty + box.h;
}

/**
 * Inside one of the town's buildings (phase H): a room laid out in `data/interiors.ts`, fixed as it
 * is, with its door mat back out to where the building stands.
 */
export class RoomZone implements Zone {
  readonly id: InteriorId;
  readonly room: Room;
  /** Everything in it, fixtures first, each as it's placed. */
  readonly things: readonly RoomThing[];

  constructor(id: InteriorId) {
    const row = INTERIORS[id];
    this.id = id;
    this.room = roomShaped(row.width, row.floorRows);
    this.things = [
      ...row.fixtures.map((fixture) => ({ fixture })),
      ...row.furniture.map((piece) => ({ piece })),
    ];
  }

  get width(): number {
    return this.room.width;
  }

  get height(): number {
    return this.room.height;
  }

  /** The floor, but not under anything standing on it. */
  canWalk = (tx: number, ty: number): boolean => {
    const { room } = this;
    if (tx < 0 || tx >= room.width || ty < room.wallRows || ty >= room.height) return false;
    return !this.things.some((t) => layerOf(t) === 'floor' && covers(boxOf(t), tx, ty));
  };

  /** Nothing in a building is a prop of the town's. */
  propAt(): PlacedProp | undefined {
    return undefined;
  }

  /**
   * What's on a tile: what stands there first, then what hangs on the wall or lies on the floor.
   */
  thingAt(tx: number, ty: number): RoomThing | undefined {
    const here = this.things.filter((t) => covers(boxOf(t), tx, ty));
    return here.find((t) => layerOf(t) === 'floor') ?? here[0];
  }

  standBeside(tx: number, ty: number): Tile[] {
    const thing = this.thingAt(tx, ty);
    const box = thing ? boxOf(thing) : { tx, ty, w: 1, h: 1 };
    return besideInRoom(box, this.room.wallRows, this.canWalk);
  }

  /** In through the front door, onto the mat, facing into the room. */
  entry(): Entry {
    return { tile: this.room.mat, facing: 'up' };
  }

  /** Walking onto the mat goes back out, to the step in front of the door. */
  doorAt(here: Tile): Crossing | null {
    const mat = this.room.mat;
    return here.tx === mat.tx && here.ty === mat.ty ? { to: outsideOf(this.id), along: 0 } : null;
  }
}
