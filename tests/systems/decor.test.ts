import { describe, expect, it } from 'vitest';
import { FURNITURE, turnCount } from '../../src/data/furniture';
import { CHEST, DOOR_MAT, ROOM, ROOM_HEIGHT, STARTER_HOME, type Placed } from '../../src/data/home';
import { anchorsFor, footprint, isOpenFloor, nearestFit, refusal } from '../../src/systems/decor';
import type { FurnitureId } from '../../src/types/ids';

const at = (id: FurnitureId, tx: number, ty: number, turn = 0): Placed => ({ id, tx, ty, turn });

describe('footprint', () => {
  it('is the size of the piece, whichever way round a square piece faces', () => {
    expect(footprint('batBed', 0)).toEqual({ w: 2, h: 2 });
    expect(footprint('pumpkinChair', 1)).toEqual({ w: 1, h: 1 });
    expect(footprint('mysteryCorkboard', 1)).toEqual({ w: 2, h: 1 });
  });

  it('has as many turns as the piece has ways to face', () => {
    expect(turnCount('pumpkinChair')).toBe(4);
    expect(turnCount('twoHeadedDuck')).toBe(2);
    expect(turnCount('candelabra')).toBe(1);
  });
});

describe('refusal', () => {
  it('lets a floor piece stand on open floor, and on a rug', () => {
    expect(refusal([], at('cauldron', 5, 5), null)).toBeNull();
    expect(refusal([at('moonRug', 5, 5)], at('cauldron', 5, 5), null)).toBeNull();
  });

  it('keeps each layer to its own place: pieces on the floor, pictures on the wall', () => {
    expect(refusal([], at('cauldron', 5, 1), null)).toBe('noRoom');
    expect(refusal([], at('ghostPortrait', 5, 1), null)).toBeNull();
    expect(refusal([], at('ghostPortrait', 5, ROOM.wallRows), null)).toBe('noRoom');
    expect(refusal([], at('moonRug', 5, 0), null)).toBe('noRoom');
  });

  it('keeps everything inside the room', () => {
    expect(refusal([], at('batBed', ROOM.width - 1, 5), null)).toBe('noRoom');
    expect(refusal([], at('batBed', 5, ROOM_HEIGHT - 1), null)).toBe('noRoom');
    expect(refusal([], at('mysteryCorkboard', -1, 0), null)).toBe('noRoom');
    expect(refusal([], at('gothicMirror', 3, 2), null)).toBe('noRoom');
  });

  it('keeps the door mat and the chest clear, even of rugs', () => {
    expect(refusal([], at('cauldron', DOOR_MAT.tx, DOOR_MAT.ty), null)).toBe('noRoom');
    expect(refusal([], at('moonRug', DOOR_MAT.tx, DOOR_MAT.ty - 1), null)).toBe('noRoom');
    expect(refusal([], at('cauldron', CHEST.tx, CHEST.ty), null)).toBe('noRoom');
  });

  it('never puts two things in one place on the same layer', () => {
    expect(refusal([at('batBed', 5, 5)], at('cauldron', 6, 6), null)).toBe('noRoom');
    expect(refusal([at('moonRug', 5, 5)], at('spiderwebRug', 4, 4), null)).toBe('noRoom');
    expect(refusal([at('mysteryCorkboard', 5, 1)], at('batClock', 6, 1), null)).toBe('noRoom');
    expect(refusal([at('batClock', 5, 1)], at('batClock', 5, 2), null)).toBeNull();
  });

  it('never puts a piece on her', () => {
    expect(refusal([], at('cauldron', 5, 5), { tx: 5, ty: 5 })).toBe('standing');
    expect(refusal([], at('moonRug', 5, 5), { tx: 5, ty: 5 })).toBeNull();
  });

  it('never walls off part of the room, or the chest', () => {
    // A corner tile shut in by two pieces either side of it.
    const corner = [at('cauldron', ROOM.width - 2, ROOM.wallRows)];
    expect(refusal(corner, at('cauldron', ROOM.width - 1, ROOM.wallRows + 1), null)).toBe(
      'blocking',
    );
    const byChest = [at('cauldron', CHEST.tx + 1, CHEST.ty)];
    expect(refusal(byChest, at('cauldron', CHEST.tx, CHEST.ty + 1), null)).toBe('blocking');
  });
});

describe('anchorsFor', () => {
  it('puts a tapped tile at the middle of the front of the piece first', () => {
    expect(anchorsFor('batBed', 0, 5, 5)[0]).toMatchObject({ tx: 5, ty: 4 });
    expect(anchorsFor('spiderwebRug', 0, 5, 5)[0]).toMatchObject({ tx: 4, ty: 3 });
    expect(anchorsFor('cauldron', 0, 5, 5)).toEqual([at('cauldron', 5, 5)]);
  });

  it('tries every way round that still covers the tile', () => {
    const all = anchorsFor('spiderwebRug', 0, 5, 5);
    expect(all).toHaveLength(9);
    for (const a of all) {
      expect(a.tx <= 5 && a.tx + 3 > 5 && a.ty <= 5 && a.ty + 3 > 5).toBe(true);
    }
  });
});

describe('nearestFit', () => {
  it('finds room next to her rather than on her', () => {
    const here = { tx: 6, ty: 7 };
    const fit = nearestFit([], 'cauldron', here, here)!;
    expect(Math.abs(fit.tx - 6) + Math.abs(fit.ty - 7)).toBe(1);
  });

  it('hangs a wall piece on the wall above her', () => {
    expect(nearestFit([], 'batClock', { tx: 6, ty: 7 }, null)).toMatchObject({ tx: 6, ty: 1 });
  });

  it('says so when there is no room left', () => {
    const wall: Placed[] = [];
    for (let ty = 0; ty < ROOM.wallRows; ty++) {
      for (let tx = 0; tx < ROOM.width; tx++) wall.push(at('batClock', tx, ty));
    }
    expect(nearestFit(wall, 'ghostPortrait', { tx: 6, ty: 7 }, null)).toBeNull();
  });
});

describe('the first day', () => {
  it('has every starting piece where it fits, and her in the room with room to walk', () => {
    const placed: Placed[] = [];
    for (const piece of STARTER_HOME.placed) {
      expect(refusal(placed, piece, DOOR_MAT), piece.id).toBeNull();
      placed.push(piece);
    }
    expect(isOpenFloor(placed, DOOR_MAT.tx, DOOR_MAT.ty)).toBe(true);
  });

  it('starts with pictures up and the two-headed duck out', () => {
    const ids = STARTER_HOME.placed.map((p) => p.id);
    expect(ids).toContain('twoHeadedDuck');
    expect(ids.filter((id) => FURNITURE[id].layer === 'wall').length).toBeGreaterThanOrEqual(4);
  });
});
