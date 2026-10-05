import type { FlooringId, FurnitureId, ItemId, RoomId, WallpaperId } from '../types/ids';

/**
 * A room of her home, in tiles: a back wall three tiles tall, where pieces hang, over a floor where
 * pieces stand and she walks. The front wall is cut away, as in every cozy game, so the whole room
 * shows. The mat in the middle of the front edge is the way in: her front door's, or for a room
 * further in (0.3's H4), the doorway back through to the room before it.
 */
export interface Room {
  /** 0 for the size it starts at; each extension she builds adds one (phase 8). */
  size: number;
  width: number;
  wallRows: number;
  floorRows: number;
  /** The wall and the floor together. */
  height: number;
  mat: { tx: number; ty: number };
  /** Where the storage chest stands, in the room it's in; null in every other (0.3's H4). */
  chest: { tx: number; ty: number } | null;
  /** The doorways in its back wall to the rooms she has built beyond it (0.3's H4). */
  doorways: Doorway[];
}

/**
 * A doorway in a room's back wall (0.3's H4): an arch in the wall over the top row of floor, the
 * tile she walks onto to go through, as she walks onto the mat to go out.
 */
export interface Doorway {
  tx: number;
  ty: number;
  to: RoomId;
}

/** A room of her home as a row (0.3's H4): a third room is a row here and a recipe. */
export interface RoomRow {
  name: string;
  /** How big it is at each size, the first to start; it grows right and toward her, never up or left. */
  sizes: readonly { width: number; floorRows: number }[];
  /** For a room further in: the room whose back wall its doorway is in, and how far along. */
  through?: { from: RoomId; tx: number };
  /** Whether the storage chest stands in it, in the corner. */
  chest?: true;
}

/**
 * Her rooms. The front room grows with the extensions, so every piece stays where she put it, the
 * chest stays in its corner, and the new floor joins the old along its whole front edge. The back
 * room is a bedroom's worth of floor, through an arch in the front room's back wall beside the
 * chest, a column no starting piece hangs or stands in.
 */
export const ROOMS: Record<RoomId, RoomRow> = {
  main: {
    name: 'Front room',
    sizes: [
      { width: 13, floorRows: 11 },
      { width: 17, floorRows: 13 },
      { width: 21, floorRows: 15 },
    ],
    chest: true,
  },
  back: {
    name: 'Back room',
    sizes: [{ width: 11, floorRows: 8 }],
    through: { from: 'main', tx: 1 },
  },
};

export const ROOM_IDS = Object.keys(ROOMS) as RoomId[];

/** The biggest her front room can grow. */
export const MAX_ROOM_SIZE = ROOMS.main.sizes.length - 1;

/** The storage chest, in the front room's corner, where every piece she isn't using waits. */
export const CHEST = { tx: 0, ty: 3 } as const;

/**
 * A room of hers at a size, as far as she has built it: with a doorway in its back wall for each
 * room in `built` that is through it.
 */
export function roomOf(size: number, id: RoomId = 'main', built: readonly RoomId[] = []): Room {
  const row = ROOMS[id];
  const at = Math.min(Math.max(0, Math.floor(size)), row.sizes.length - 1);
  const { width, floorRows } = row.sizes[at]!;
  const room = roomShaped(width, floorRows, at);
  room.chest = row.chest ? { ...CHEST } : null;
  for (const to of built) {
    const through = ROOMS[to].through;
    if (through?.from === id) room.doorways.push({ tx: through.tx, ty: room.wallRows, to });
  }
  return room;
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
    chest: null,
    doorways: [],
  };
}

/** The room she starts with. */
export const ROOM = roomOf(0);

/** A piece where it stands (or hangs), by the top-left of its footprint, and which way it faces. */
export interface Placed {
  id: FurnitureId;
  tx: number;
  ty: number;
  /** 0 is facing her; see `turnCount` for how many ways a piece has. */
  turn: number;
  /** What a display piece has on show, from her bag (0.3's H2, save v36); given back when it's emptied. */
  shows?: ItemId;
  /**
   * A small piece standing on the surface under it rather than on the floor (0.3's H3, save v37):
   * it rides along when the surface moves, and goes in the chest with it.
   */
  on?: true;
}

/** One room as saved (0.3's H4): what stands and hangs in it, its walls and floor, and its size. */
export interface RoomSnapshot {
  placed: Placed[];
  wallpaper: WallpaperId;
  flooring: FlooringId;
  /** How many extensions it has had (v7): 0 for the size it starts at. */
  size: number;
}

export interface HomeSnapshot {
  /** Each room she has, the front room always (0.3's H4: the one room became `main`). */
  rooms: { main: RoomSnapshot } & Partial<Record<RoomId, RoomSnapshot>>;
  /** The room she's in, which is the front room whenever she's out. */
  here: RoomId;
  /** Pieces in the storage chest, in the order they went in. */
  stored: { id: FurnitureId; count: number }[];
  /** Things from her bag put away in the chest (0.3's H1), in the order they went in. */
  items: { id: ItemId; count: number }[];
  /** Every wallpaper and flooring she owns; like clothes, they're hers for good. */
  wallpapers: WallpaperId[];
  floorings: FlooringId[];
}

/** A home as a save or a test gives it: any part may be missing, and is the first day's. */
export type HomeInput = Partial<Omit<HomeSnapshot, 'rooms'>> & {
  rooms?: Partial<Record<RoomId, Partial<RoomSnapshot>>>;
};

/**
 * Her home on the first day, which is never bare (personal_touches.md, "Her home"): a bed, a
 * pumpkin armchair on a moon rug with her stained-glass lamp beside it (phase J), a few pictures and spooky things up on the wall, the mystery
 * corkboard waiting for its mystery, and Duckworth & Duckworth under their dome. Her succulents
 * wait in the chest for her to put somewhere sunny, and her workbench stands ready (phase 8),
 * with her little stove beside it (phase R).
 */
export const STARTER_HOME: HomeSnapshot = {
  rooms: {
    main: {
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
      wallpaper: 'plumStripes',
      flooring: 'oakBoards',
      size: 0,
    },
  },
  here: 'main',
  stored: [{ id: 'succulents', count: 1 }],
  items: [],
  wallpapers: ['plumStripes'],
  floorings: ['oakBoards'],
};
