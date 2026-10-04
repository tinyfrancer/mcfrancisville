import type { FlooringId, FurnitureId, ItemId, WallpaperId } from '../types/ids';

/**
 * Her room, in tiles: a back wall three tiles tall, where pieces hang, over a floor where pieces
 * stand and she walks. The front wall is cut away, as in every cozy game, so the whole room shows.
 * The mat inside her front door, where she comes in and walks to go out, is in the middle of the
 * front edge.
 */
export interface Room {
  /** 0 for the house she starts with; each extension she builds adds one (phase 8). */
  size: number;
  width: number;
  wallRows: number;
  floorRows: number;
  /** The wall and the floor together. */
  height: number;
  mat: { tx: number; ty: number };
}

/**
 * How big her room is at each size. It grows right and toward her, never up or left, so every
 * piece stays where she put it, the chest stays in its corner, and the new floor joins the old
 * along its whole front edge.
 */
const ROOM_SIZES: readonly { width: number; floorRows: number }[] = [
  { width: 13, floorRows: 11 },
  { width: 17, floorRows: 13 },
  { width: 21, floorRows: 15 },
];

/** The biggest her house can grow. */
export const MAX_ROOM_SIZE = ROOM_SIZES.length - 1;

export function roomOf(size: number): Room {
  const at = Math.min(Math.max(0, Math.floor(size)), MAX_ROOM_SIZE);
  const { width, floorRows } = ROOM_SIZES[at]!;
  return roomShaped(width, floorRows, at);
}

/** A room of a width and depth of floor, under a back wall three tiles tall, the mat at the front. */
export function roomShaped(width: number, floorRows: number, size = 0): Room {
  const wallRows = 3;
  const height = wallRows + floorRows;
  return {
    size,
    width,
    wallRows,
    floorRows,
    height,
    mat: { tx: Math.floor(width / 2), ty: height - 1 },
  };
}

/** The room she starts with. */
export const ROOM = roomOf(0);

/** The storage chest, in the corner, where every piece she isn't using waits (a `storageChest`). */
export const CHEST = { tx: 0, ty: 3 } as const;

/** A piece where it stands (or hangs), by the top-left of its footprint, and which way it faces. */
export interface Placed {
  id: FurnitureId;
  tx: number;
  ty: number;
  /** 0 is facing her; see `turnCount` for how many ways a piece has. */
  turn: number;
  /** What a display piece has on show, from her bag (0.3's H2, save v36); given back when it's emptied. */
  shows?: ItemId;
}

export interface HomeSnapshot {
  placed: Placed[];
  /** Pieces in the storage chest, in the order they went in. */
  stored: { id: FurnitureId; count: number }[];
  /** Things from her bag put away in the chest (0.3's H1), in the order they went in. */
  items: { id: ItemId; count: number }[];
  wallpaper: WallpaperId;
  flooring: FlooringId;
  /** Every wallpaper and flooring she owns; like clothes, they're hers for good. */
  wallpapers: WallpaperId[];
  floorings: FlooringId[];
  /** How many extensions she has built (v7): 0 for the room she starts with. */
  size: number;
}

/**
 * Her home on the first day, which is never bare (personal_touches.md, "Her home"): a bed, a
 * pumpkin armchair on a moon rug with her stained-glass lamp beside it (phase J), a few pictures and spooky things up on the wall, the mystery
 * corkboard waiting for its mystery, and Duckworth & Duckworth under their dome. Her succulents
 * wait in the chest for her to put somewhere sunny, and her workbench stands ready (phase 8),
 * with her little stove beside it (phase R).
 */
export const STARTER_HOME: HomeSnapshot = {
  placed: [
    { id: 'batBed', tx: 10, ty: 3, turn: 0 },
    { id: 'workbench', tx: 4, ty: 3, turn: 0 },
    { id: 'stove', tx: 6, ty: 3, turn: 0 },
    { id: 'twoHeadedDuck', tx: 8, ty: 3, turn: 0 },
    { id: 'moonRug', tx: 3, ty: 6, turn: 0 },
    { id: 'pumpkinChair', tx: 3, ty: 6, turn: 0 },
    { id: 'floralLamp', tx: 2, ty: 6, turn: 0 },
    { id: 'ghostPortrait', tx: 2, ty: 1, turn: 0 },
    { id: 'wallShelf', tx: 4, ty: 1, turn: 0 },
    { id: 'moonPainting', tx: 6, ty: 1, turn: 0 },
    { id: 'batClock', tx: 8, ty: 0, turn: 0 },
    { id: 'mysteryCorkboard', tx: 10, ty: 1, turn: 0 },
  ],
  stored: [{ id: 'succulents', count: 1 }],
  items: [],
  wallpaper: 'plumStripes',
  flooring: 'oakBoards',
  wallpapers: ['plumStripes'],
  floorings: ['oakBoards'],
  size: 0,
};
