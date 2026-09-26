import type { FlooringId, FurnitureId, WallpaperId } from '../types/ids';

/**
 * Her room, in tiles: a back wall three tiles tall, where pieces hang, over a floor where pieces
 * stand and she walks. The front wall is cut away, as in every cozy game, so the whole room shows.
 */
export const ROOM = {
  width: 13,
  wallRows: 3,
  floorRows: 9,
} as const;

export const ROOM_HEIGHT = ROOM.wallRows + ROOM.floorRows;

/** The mat inside her front door: where she comes in, and where she walks to go out. */
export const DOOR_MAT = { tx: 6, ty: ROOM_HEIGHT - 1 } as const;

/** The storage chest, in the corner, where every piece she isn't using waits (a `storageChest`). */
export const CHEST = { tx: 0, ty: ROOM.wallRows } as const;

/** A piece where it stands (or hangs), by the top-left of its footprint, and which way it faces. */
export interface Placed {
  id: FurnitureId;
  tx: number;
  ty: number;
  /** 0 is facing her; see `turnCount` for how many ways a piece has. */
  turn: number;
}

export interface HomeSnapshot {
  placed: Placed[];
  /** Pieces in the storage chest, in the order they went in. */
  stored: { id: FurnitureId; count: number }[];
  wallpaper: WallpaperId;
  flooring: FlooringId;
  /** Every wallpaper and flooring she owns; like clothes, they're hers for good. */
  wallpapers: WallpaperId[];
  floorings: FlooringId[];
}

/**
 * Her home on the first day, which is never bare (personal_touches.md, "Her home"): a bed, a
 * pumpkin armchair on a moon rug, a few pictures and spooky things up on the wall, the mystery
 * corkboard waiting for its mystery, and Duckworth & Duckworth under their dome. Her succulents
 * wait in the chest for her to put somewhere sunny.
 */
export const STARTER_HOME: HomeSnapshot = {
  placed: [
    { id: 'batBed', tx: 10, ty: 3, turn: 0 },
    { id: 'twoHeadedDuck', tx: 8, ty: 3, turn: 0 },
    { id: 'moonRug', tx: 3, ty: 6, turn: 0 },
    { id: 'pumpkinChair', tx: 3, ty: 6, turn: 0 },
    { id: 'ghostPortrait', tx: 2, ty: 1, turn: 0 },
    { id: 'wallShelf', tx: 4, ty: 1, turn: 0 },
    { id: 'moonPainting', tx: 6, ty: 1, turn: 0 },
    { id: 'batClock', tx: 8, ty: 0, turn: 0 },
    { id: 'mysteryCorkboard', tx: 10, ty: 1, turn: 0 },
  ],
  stored: [{ id: 'succulents', count: 1 }],
  wallpaper: 'plumStripes',
  flooring: 'oakBoards',
  wallpapers: ['plumStripes'],
  floorings: ['oakBoards'],
};
