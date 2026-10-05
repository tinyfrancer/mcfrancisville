import { describe, expect, it } from 'vitest';
import { CHEST, ROOMS, roomOf, STARTER_HOME, type Placed } from '../../src/data/home';
import { RECIPES } from '../../src/data/recipes';
import { cantMake } from '../../src/systems/crafting';
import { refusal } from '../../src/systems/decor';
import { FakeClock } from '../../src/systems/clock';
import { Home } from '../../src/world/Home';
import { fromSave, tileOf, World } from '../../src/world/World';
import { HomeZone } from '../../src/world/zones/HomeZone';
import { harness } from './harness';

const DOORWAY = { tx: ROOMS.back.through!.tx, ty: 3 };
const BUILDS = [
  { id: 'wood' as const, count: 80 },
  { id: 'stone' as const, count: 30 },
];

type H = ReturnType<typeof harness>;
const tileOfPlayer = (h: H) => tileOf(h.world.player.x, h.world.player.y);

/** Walks her in through her front door, from the step outside it. */
function goHome(h: H): H {
  const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
  h.world.tapTile(house.tx + 1, house.ty + 1);
  h.until(() => h.world.scene === 'home', 'going in');
  return h;
}

/** Walks her onto a tile at home, to see what happens there. */
function walkOnto(h: H, tx: number, ty: number) {
  expect(h.world.tapTile(tx, ty)).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`);
}

describe('a second room (0.3’s H4)', () => {
  it('is a row, through the front room’s back wall beside the chest', () => {
    const main = roomOf(0, 'main', ['main', 'back']);
    expect(main.doorways).toEqual([{ ...DOORWAY, to: 'back' }]);
    expect(main.chest).toEqual(CHEST);
    expect(roomOf(0)).toMatchObject({ doorways: [], chest: CHEST });
    const back = roomOf(0, 'back', ['main', 'back']);
    expect(back).toMatchObject({ width: 11, floorRows: 8, chest: null, doorways: [] });
    // The way through stays by the chest however big the front room grows.
    expect(roomOf(2, 'main', ['main', 'back']).doorways).toEqual(main.doorways);
  });

  it('keeps the doorway and its arch clear, and needs no chest in a room without one', () => {
    const main = roomOf(0, 'main', ['main', 'back']);
    const at = (id: Placed['id'], tx: number, ty: number): Placed => ({ id, tx, ty, turn: 0 });
    expect(refusal(main, [], at('cauldron', DOORWAY.tx, DOORWAY.ty), null)).toBe('noRoom');
    expect(refusal(main, [], at('moonRug', DOORWAY.tx, DOORWAY.ty), null)).toBe('noRoom');
    expect(refusal(main, [], at('ghostPortrait', DOORWAY.tx, 1), null)).toBe('noRoom');
    expect(refusal(main, [], at('ghostPortrait', DOORWAY.tx + 1, 1), null)).toBeNull();
    // Walling the doorway in walls part of the floor off, which nothing may do.
    const round = [at('cauldron', 2, 3)];
    expect(refusal(main, round, at('cauldron', 1, 4), null)).toBe('blocking');
    const back = roomOf(0, 'back', ['main', 'back']);
    expect(refusal(back, [], at('cauldron', CHEST.tx, CHEST.ty), null)).toBeNull();
  });

  it('starts with none, and fits round every first-day piece', () => {
    const home = new Home();
    expect(home.built).toEqual(['main']);
    expect(home.build('back')).toEqual([]);
    expect(home.built).toEqual(['main', 'back']);
    expect(home.placed).toEqual(STARTER_HOME.rooms.main.placed);
    expect(home.room.doorways).toEqual([{ ...DOORWAY, to: 'back' }]);
    expect(home.build('back')).toBeNull();
  });

  it('puts what is in the doorway’s way in the chest as it is built, and what it showed', () => {
    const home = new Home({
      rooms: {
        main: {
          placed: [
            { id: 'ghostPortrait', tx: DOORWAY.tx, ty: 1, turn: 0 },
            { id: 'bellJar', tx: DOORWAY.tx, ty: DOORWAY.ty, turn: 0, shows: 'lunaMoth' },
            { id: 'cauldron', tx: 6, ty: 6, turn: 0 },
          ],
        },
      },
      stored: [],
    });
    const moved = home.build('back')!;
    expect(moved.map((p) => p.id).sort()).toEqual(['bellJar', 'ghostPortrait']);
    expect(home.placed.map((p) => p.id)).toEqual(['cauldron']);
    expect(home.stored).toEqual([
      { id: 'ghostPortrait', count: 1 },
      { id: 'bellJar', count: 1 },
    ]);
    expect(home.items).toEqual([{ id: 'lunaMoth', count: 1 }]);
  });

  it('keeps each room’s pieces, walls and floor, and which she is in, through a save', () => {
    const home = new Home();
    home.build('back');
    home.giveWallpaper('batDamask');
    home.store('cauldron');
    expect(home.enter('back')).toBe(true);
    expect(home.wallpaper).toBe(STARTER_HOME.rooms.main.wallpaper);
    expect(home.paper('batDamask')).toBe(true);
    const pot = home.takeOut('cauldron', { tx: 5, ty: 6 }, null)!;
    expect(home.placed).toEqual([pot]);
    const again = new Home(home.snapshot());
    expect(again.here).toBe('back');
    expect(again.placed).toEqual([pot]);
    expect(again.wallpaper).toBe('batDamask');
    expect(again.placedIn('main')).toEqual(home.placedIn('main'));
    again.enter('main');
    expect(again.wallpaper).toBe(STARTER_HOME.rooms.main.wallpaper);
    expect(again.everyPiece).toHaveLength(STARTER_HOME.rooms.main.placed.length + 1);
  });

  it('reads a save in a room she hasn’t built as in the front room', () => {
    const home = new Home({ ...new Home().snapshot(), here: 'back' });
    expect(home.built).toEqual(['main']);
    expect(home.here).toBe('main');
  });

  it('keeps her planters in the front room, by the garden', () => {
    const home = new Home({ rooms: { main: { placed: [] } }, stored: [] });
    home.build('back');
    home.store('planterBox');
    home.enter('back');
    expect(home.refusesHere('planterBox')).toBe('frontRoom');
    expect(home.takeOut('planterBox', { tx: 5, ty: 6 }, null)).toBeNull();
    expect(home.stored).toEqual([{ id: 'planterBox', count: 1 }]);
    const saved = home.snapshot();
    saved.rooms.back!.placed = [{ id: 'planterBox', tx: 5, ty: 6, turn: 0 }];
    expect(new Home(saved).placedIn('back')).toEqual([]);
    home.enter('main');
    expect(home.takeOut('planterBox', { tx: 5, ty: 6 }, null)).not.toBeNull();
  });

  it('keeps the pets’ open floor to the room she is in', () => {
    const home = new Home();
    home.build('back');
    const zone = new HomeZone(home);
    const front = zone.roamTiles();
    home.enter('back');
    const back = zone.roamTiles();
    expect(back).not.toEqual(front);
    expect(back.every((t) => t.tx < 11 && t.ty < 11)).toBe(true);
    expect(zone.propAt(CHEST.tx, CHEST.ty)).toBeUndefined();
  });
});

describe('building it and going through', () => {
  it('is made at her workbench from wood and stone, once', () => {
    expect(RECIPES.backRoom.makes).toEqual({ newRoom: 'back' });
    const knows = { knows: () => true, count: () => 999, roomSize: 0 };
    expect(cantMake('backRoom', knows)).toBeNull();
    expect(cantMake('backRoom', { ...knows, rooms: ['main', 'back'] })).toBe('built');
    const h = harness(undefined, { finds: { bag: BUILDS } });
    let changed = 0;
    h.world.events.on('home', () => changed++);
    expect(h.world.workbench.craft('backRoom')).toMatchObject({ made: { newRoom: 'back' } });
    expect(changed).toBe(1);
    expect(h.world.home.built).toEqual(['main', 'back']);
    expect(h.world.bag.count('wood')).toBe(0);
    expect(h.world.workbench.cantMake('backRoom')).toBe('built');
  });

  it('takes her through the doorway and back, and out of the front door from the front room', () => {
    const h = goHome(harness(undefined, { finds: { bag: BUILDS } }));
    h.world.workbench.craft('backRoom');
    const through = walkOnto(h, DOORWAY.tx, DOORWAY.ty);
    expect(through).toContainEqual({ kind: 'entered', scene: 'home' });
    expect(h.world.scene).toBe('home');
    expect(h.world.home.here).toBe('back');
    const back = h.world.home.room;
    expect(tileOfPlayer(h)).toEqual(back.mat);
    expect(h.world.size).toEqual({ width: back.width, height: back.height });
    // The back room's mat goes back through, onto the doorway.
    walkOnto(h, back.mat.tx - 1, back.mat.ty);
    walkOnto(h, back.mat.tx, back.mat.ty);
    expect(h.world.home.here).toBe('main');
    expect(tileOfPlayer(h)).toEqual(DOORWAY);
    expect(h.world.player.facing).toBe('down');
    const mat = h.world.home.room.mat;
    walkOnto(h, mat.tx, mat.ty);
    expect(h.world.scene).toBe('town');
  });

  it('goes through at a tap on the arch itself', () => {
    const h = goHome(harness(undefined, { finds: { bag: BUILDS } }));
    h.world.workbench.craft('backRoom');
    h.world.tapTile(DOORWAY.tx, 1);
    h.until(() => h.world.home.here === 'back', 'going through the arch');
  });

  it('comes in by the front door after leaving from the back room by the map', () => {
    const h = goHome(harness(undefined, { finds: { bag: BUILDS } }));
    h.world.workbench.craft('backRoom');
    walkOnto(h, DOORWAY.tx, DOORWAY.ty);
    h.world.atlas.find('whisperwood');
    expect(h.world.travel.go('whisperwood')).toBe(true);
    expect(h.world.home.here).toBe('main');
    expect(h.world.save().home.here).toBe('main');
  });

  it('decorates the room she is in, and keeps her there through a save', () => {
    const h = goHome(harness(undefined, { finds: { bag: BUILDS } }));
    h.world.workbench.craft('backRoom');
    walkOnto(h, DOORWAY.tx, DOORWAY.ty);
    h.world.home.store('cauldron');
    expect(h.world.decorating.takeOut('cauldron')).toBe(true);
    h.world.tapTile(3, 5);
    expect(h.world.home.pieceAt(3, 5)?.id).toBe('cauldron');
    h.world.decorating.stop();
    const save = h.world.save();
    expect(save.home.here).toBe('back');
    expect(save.home.rooms.back?.placed).toEqual([{ id: 'cauldron', tx: 3, ty: 5, turn: 0 }]);
    const again = new World({ clock: new FakeClock(h.clock.now()), ...fromSave(save) });
    expect(again.scene).toBe('home');
    expect(again.home.here).toBe('back');
    expect(again.home.pieceAt(3, 5)?.id).toBe('cauldron');
    expect(tileOf(again.player.x, again.player.y)).toEqual(tileOfPlayer(h));
  });

  it('brings the pet walking with her through, and her pets at home potter where she is', () => {
    const h = goHome(harness(undefined, { finds: { bag: BUILDS } }));
    h.world.workbench.craft('backRoom');
    h.world.petCare.walkWith('fibi');
    walkOnto(h, DOORWAY.tx, DOORWAY.ty);
    h.tick(5);
    const room = h.world.home.room;
    for (const pet of h.world.petCare.here()) {
      const t = pet.tile;
      expect(
        h.world.zone.canWalk(t.tx, t.ty) || (t.tx === room.mat.tx && t.ty === room.mat.ty),
      ).toBe(true);
    }
    expect(h.world.petCare.lostBone()?.scene).not.toBe('home');
  });
});
