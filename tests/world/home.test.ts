import { describe, expect, it } from 'vitest';
import { CHEST, ROOM, STARTER_HOME } from '../../src/data/home';
import { TOWN } from '../../src/data/maps';
import { Home } from '../../src/world/Home';
import { DANCE_MS, tileOf, type WorldEvent } from '../../src/world/Town';
import { harness } from './harness';

const tileOfPlayer = (h: ReturnType<typeof harness>) => tileOf(h.town.player.x, h.town.player.y);

/** Walks her in through her front door, from the step outside it. */
function goHome(h = harness()) {
  const house = h.town.map.props.find((p) => p.id === 'homeHouse')!;
  h.town.tapTile(house.tx + 1, house.ty + 1);
  h.until(() => h.town.scene === 'home', 'going in');
  return h;
}

describe('Home', () => {
  it('starts furnished, with her succulents in the chest and the first walls and floor', () => {
    const home = new Home();
    expect(home.placed).toEqual(STARTER_HOME.placed);
    expect(home.stored).toEqual([{ id: 'succulents', count: 1 }]);
    expect(home.wallpaper).toBe('plumStripes');
    expect(home.flooring).toBe('oakBoards');
  });

  it('keeps a saved piece it no longer knows out, and one that no longer fits in the chest', () => {
    const home = new Home({
      placed: [
        { id: 'batBed', tx: 5, ty: 5, turn: 0 },
        { id: 'cauldron', tx: 6, ty: 6, turn: 0 },
        { id: 'hotTub' as never, tx: 1, ty: 8, turn: 0 },
      ],
      stored: [{ id: 'cauldron', count: 2 }],
    });
    expect(home.placed.map((p) => p.id)).toEqual(['batBed']);
    expect(home.stored).toEqual([{ id: 'cauldron', count: 3 }]);
  });

  it('keeps her walls and floor to ones she owns', () => {
    const home = new Home({ wallpaper: 'batDamask', wallpapers: ['plumStripes'] });
    expect(home.wallpaper).toBe('plumStripes');
    expect(home.paper('batDamask')).toBe(false);
    expect(home.giveWallpaper('batDamask')).toBe(true);
    expect(home.giveWallpaper('batDamask')).toBe(false);
    expect(home.paper('batDamask')).toBe(true);
    expect(home.lay('checkerboard')).toBe(false);
    expect(home.giveFlooring('checkerboard') && home.lay('checkerboard')).toBe(true);
    expect(home.snapshot()).toMatchObject({ wallpaper: 'batDamask', flooring: 'checkerboard' });
  });

  it('takes a piece out of the chest, and puts it back', () => {
    const home = new Home({ placed: [], stored: [{ id: 'cauldron', count: 1 }] });
    const piece = home.takeOut('cauldron', { tx: 6, ty: 7 }, { tx: 6, ty: 7 })!;
    expect(piece.id).toBe('cauldron');
    expect(home.stored).toEqual([]);
    expect(home.takeOut('cauldron', { tx: 6, ty: 7 }, null)).toBeNull();
    home.putAway(piece);
    expect(home.placed).toEqual([]);
    expect(home.stored).toEqual([{ id: 'cauldron', count: 1 }]);
  });

  it('moves and turns a piece where it fits, and leaves it be where it would not', () => {
    const home = new Home({ placed: [{ id: 'pumpkinChair', tx: 5, ty: 5, turn: 0 }] });
    const chair = home.placed[0]!;
    expect(home.move(chair, 8, 8, null)).toBeNull();
    expect(chair).toMatchObject({ tx: 8, ty: 8 });
    expect(home.move(chair, 3, 1, null)).toBe('noRoom');
    expect(chair).toMatchObject({ tx: 8, ty: 8 });
    for (const turn of [1, 2, 3, 0]) {
      expect(home.turn(chair, null)).toBeNull();
      expect(chair.turn).toBe(turn);
    }
  });

  it('tells what is at a tile from the top: a piece before the rug it stands on', () => {
    const home = new Home();
    expect(home.pieceAt(3, 6)?.id).toBe('pumpkinChair');
    expect(home.pieceAt(4, 7)?.id).toBe('moonRug');
    expect(home.pieceAt(2, 1)?.id).toBe('ghostPortrait');
    expect(home.canWalk(4, 7)).toBe(true);
    expect(home.canWalk(3, 6)).toBe(false);
    expect(home.canWalk(CHEST.tx, CHEST.ty)).toBe(false);
  });
});

describe('a bigger house', () => {
  it('grows wider and deeper twice, and no further, with everything where it was', () => {
    const home = new Home();
    const before = home.snapshot().placed;
    expect(home.room).toMatchObject({ size: 0, width: 13, height: 14, mat: { tx: 6, ty: 13 } });
    expect(home.grow()).toBe(true);
    expect(home.room).toMatchObject({ size: 1, width: 17, height: 16, mat: { tx: 8, ty: 15 } });
    expect(home.grow()).toBe(true);
    expect(home.room).toMatchObject({ size: 2, width: 21, height: 18 });
    expect(home.canGrow).toBe(false);
    expect(home.grow()).toBe(false);
    expect(home.snapshot()).toMatchObject({ placed: before, size: 2 });
    expect(home.canWalk(6, 13)).toBe(true);
  });

  it('is saved as big as she built it, and a size it does not know is the nearest it has', () => {
    const home = new Home();
    home.grow();
    expect(new Home(home.snapshot()).room.size).toBe(1);
    expect(new Home({ ...home.snapshot(), size: 9 }).room.size).toBe(2);
    expect(new Home({ ...home.snapshot(), size: 1.5 }).room.size).toBe(0);
  });

  it('keeps a piece out on the new floor when it loads', () => {
    const far = { id: 'cauldron' as const, tx: 15, ty: 14, turn: 0 };
    expect(new Home({ placed: [far], size: 1 }).placed).toEqual([far]);
    expect(new Home({ placed: [far], size: 0 }).stored).toEqual([{ id: 'cauldron', count: 1 }]);
  });

  it('lets her walk the new floor, and out through the mat where it is now', () => {
    const h = goHome();
    h.town.home.grow();
    expect(h.town.size).toEqual({ width: 17, height: 16 });
    h.town.tapTile(16, 15);
    h.until(() => !h.town.player.moving, 'walking into the new corner');
    expect(tileOfPlayer(h)).toEqual({ tx: 16, ty: 15 });
    h.town.tapTile(8, 15);
    h.until(() => h.town.scene === 'town', 'going out');
  });
});

describe('going home', () => {
  it('goes in through her front door, onto the mat', () => {
    const h = harness();
    const events: WorldEvent[] = [];
    const house = h.town.map.props.find((p) => p.id === 'homeHouse')!;
    h.town.tapTile(house.tx + 1, house.ty + 2);
    events.push(...h.until(() => h.town.scene === 'home', 'going in'));
    expect(events).toContainEqual({ kind: 'entered', scene: 'home' });
    expect(tileOfPlayer(h)).toEqual(ROOM.mat);
    expect(h.town.player.facing).toBe('up');
    expect(h.town.size).toEqual({ width: ROOM.width, height: ROOM.height });
  });

  it('walks about the room, round the furniture', () => {
    const h = goHome();
    expect(h.town.tapTile(1, 10)).toBe(true);
    h.until(() => !h.town.player.moving, 'crossing the room');
    expect(tileOfPlayer(h)).toEqual({ tx: 1, ty: 10 });
    expect(h.town.canWalk(3, 6)).toBe(false);
  });

  it('goes back out from the mat, onto the step outside her door', () => {
    const h = goHome();
    h.town.tapTile(4, 9);
    h.until(() => !h.town.player.moving, 'walking off the mat');
    h.town.tapTile(ROOM.mat.tx, ROOM.mat.ty);
    const events = h.until(() => h.town.scene === 'town', 'going out');
    expect(events).toContainEqual({ kind: 'entered', scene: 'town' });
    expect(tileOfPlayer(h)).toEqual(TOWN.spawn);
  });

  it('goes out at once from a tap on the mat she came in on', () => {
    const h = goHome();
    h.town.tapTile(ROOM.mat.tx, ROOM.mat.ty);
    h.tick(1);
    expect(h.town.scene).toBe('town');
  });

  it('is saved as indoors, and comes back indoors', () => {
    const h = goHome();
    const saved = h.town.snapshot();
    expect(saved).toEqual({ ...ROOM.mat, facing: 'up', indoors: true });
    const back = harness(undefined, { player: saved, home: h.town.homeSnapshot().home });
    expect(back.town.scene).toBe('home');
    expect(tileOfPlayer(back)).toEqual(ROOM.mat);
  });

  it('arrives at a piece she walks up to, and at the chest', () => {
    const h = goHome();
    h.town.tapTile(8, 3);
    const duck = h.until(() => !h.town.player.moving, 'walking to the duck');
    expect(duck).toContainEqual(
      expect.objectContaining({ kind: 'arrived', piece: 'twoHeadedDuck' }),
    );
    h.town.tapTile(CHEST.tx, CHEST.ty);
    const chest = h.until(() => !h.town.player.moving, 'walking to the chest');
    expect(chest).toContainEqual(expect.objectContaining({ kind: 'arrived', at: 'storageChest' }));
  });

  it('has the forever orbs count the years since 2020', () => {
    const h = harness(undefined, {
      home: { placed: [{ id: 'foreverOrbs', tx: 8, ty: 3, turn: 0 }] },
    });
    h.clock.set(new Date(2027, 5, 6, 21));
    goHome(h);
    h.town.tapTile(8, 3);
    const events = h.until(() => !h.town.player.moving, 'walking to the orbs');
    expect(events).toContainEqual(
      expect.objectContaining({ piece: 'foreverOrbs', says: expect.stringMatching(/7 years/) }),
    );
  });

  it('walks up below a picture on the wall', () => {
    const h = goHome();
    h.town.tapTile(6, 1);
    const events = h.until(() => !h.town.player.moving, 'walking to the painting');
    expect(tileOfPlayer(h).ty).toBe(ROOM.wallRows);
    expect(events).toContainEqual(expect.objectContaining({ piece: 'moonPainting' }));
  });

  it('puts on her records one after another, and says so when she has none', () => {
    const home = { placed: [{ id: 'recordPlayer' as const, tx: 6, ty: 3, turn: 0 }] };
    const h = goHome(harness(undefined, { finds: { bag: [] }, home }));
    const play = () => {
      h.town.tapTile(6, 3);
      return [...h.until(() => !h.town.player.moving, 'walking to it'), ...h.tick(1)];
    };
    expect(play()).toContainEqual({ kind: 'played', record: null });
    h.town.bag.add('recordBoneJovi', 1);
    h.town.bag.add('recordBoolafonte', 1);
    expect(play()).toContainEqual({ kind: 'played', record: 'recordBoneJovi' });
    expect(play()).toContainEqual({ kind: 'played', record: 'recordBoolafonte' });
    expect(play()).toContainEqual({ kind: 'played', record: 'recordBoneJovi' });
    expect(h.town.dance()).toBeNull();
  });

  it('gets her dancing to Walk the Tomb, with Cody beside her, until she walks off', () => {
    const home = { placed: [{ id: 'recordPlayer' as const, tx: 6, ty: 3, turn: 0 }] };
    const h = goHome(
      harness(undefined, { finds: { bag: [{ id: 'recordWalkTheTomb', count: 1 }] }, home }),
    );
    h.town.tapTile(6, 3);
    const events = [...h.until(() => !h.town.player.moving, 'walking to it'), ...h.tick(1)];
    expect(events).toContainEqual({ kind: 'played', record: 'recordWalkTheTomb', dance: true });
    const cody = h.town.dance()?.cody;
    expect(cody).toBeTruthy();
    expect(h.town.canWalk(cody!.tx, cody!.ty)).toBe(true);
    h.clock.advance(DANCE_MS - 1000);
    expect(h.town.dance()).not.toBeNull();
    h.town.tapTile(6, 8);
    expect(h.town.dance()).toBeNull();
  });

  it('stops dancing when the record ends', () => {
    const home = { placed: [{ id: 'recordPlayer' as const, tx: 6, ty: 3, turn: 0 }] };
    const h = goHome(
      harness(undefined, { finds: { bag: [{ id: 'recordWalkTheTomb', count: 1 }] }, home }),
    );
    h.town.tapTile(6, 3);
    h.until(() => !h.town.player.moving, 'walking to it');
    h.tick(1);
    h.clock.advance(DANCE_MS + 1);
    expect(h.town.dance()).toBeNull();
  });
});

describe('decorating', () => {
  it('only happens at home', () => {
    const h = harness();
    expect(h.town.startDecorating()).toBe(false);
    expect(h.town.takeOut('succulents')).toBe(false);
  });

  it('picks a piece up with a tap, moves it with the next, and puts it down with a tap on it', () => {
    const h = goHome();
    h.town.startDecorating();
    const x = h.town.player.x;
    expect(h.town.tapTile(8, 3)).toBe(true);
    expect(h.town.decorating?.selected?.id).toBe('twoHeadedDuck');
    expect(h.town.tapTile(9, 8)).toBe(true);
    expect(h.town.home.pieceAt(9, 8)?.id).toBe('twoHeadedDuck');
    expect(h.town.tapTile(9, 8)).toBe(true);
    expect(h.town.decorating?.selected).toBeNull();
    h.tick(10);
    expect(h.town.player.x).toBe(x);
  });

  it('puts a floor piece down on a rug, rather than picking the rug up', () => {
    const h = goHome();
    h.town.startDecorating();
    h.town.tapTile(8, 3);
    h.town.tapTile(4, 7);
    expect(h.town.home.pieceAt(4, 7)?.id).toBe('twoHeadedDuck');
  });

  it('says why a piece will not go somewhere, and leaves it where it was', () => {
    const h = goHome();
    h.town.startDecorating();
    h.town.tapTile(8, 3);
    expect(h.town.tapTile(ROOM.mat.tx, ROOM.mat.ty)).toBe(false);
    expect(h.tick(1)).toContainEqual({ kind: 'refused', why: 'noRoom' });
    expect(h.town.home.pieceAt(8, 3)?.id).toBe('twoHeadedDuck');
  });

  it('turns and puts away the piece she has picked up', () => {
    const h = goHome();
    h.town.startDecorating();
    h.town.tapTile(3, 6);
    expect(h.town.turnSelected()).toBe(true);
    expect(h.town.home.pieceAt(3, 6)?.turn).toBe(1);
    expect(h.town.putAwaySelected()).toBe(true);
    expect(h.town.home.pieceAt(3, 6)?.id).toBe('moonRug');
    expect(h.town.home.stored).toContainEqual({ id: 'pumpkinChair', count: 1 });
    expect(h.town.decorating?.selected).toBeNull();
  });

  it('takes a piece out of the chest beside her, picked up, ready to move', () => {
    const h = goHome();
    expect(h.town.takeOut('succulents')).toBe(true);
    const piece = h.town.decorating?.selected;
    expect(piece?.id).toBe('succulents');
    expect(h.town.home.stored).toEqual([]);
  });

  it('stops when she goes out', () => {
    const h = goHome();
    h.town.startDecorating();
    h.town.stopDecorating();
    h.town.tapTile(ROOM.mat.tx, ROOM.mat.ty);
    h.tick(1);
    expect(h.town.scene).toBe('town');
    expect(h.town.decorating).toBeNull();
  });
});
