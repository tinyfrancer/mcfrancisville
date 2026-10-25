import { describe, expect, it } from 'vitest';
import { FURNITURE, turnCount } from '../../src/data/furniture';
import { EAVES_RISE, ROOMS, roomOf, TALL, type Placed } from '../../src/data/home';
import { RECIPES } from '../../src/data/recipes';
import { furnitureSprite } from '../../src/sprites/furniture';
import { cantMake } from '../../src/systems/crafting';
import { footprint, refusal } from '../../src/systems/decor';
import { FakeClock } from '../../src/systems/clock';
import { Home } from '../../src/world/Home';
import { fromSave, tileOf, World } from '../../src/world/World';
import type { FurnitureId } from '../../src/types/ids';
import { harness } from './harness';

/*
 * 1.5's G6: the attic, a third room up a ladder from the back room, under a sloped ceiling.
 */

const ARCH = { tx: ROOMS.back.through!.tx, ty: 3 };
const LADDER = { tx: ROOMS.attic.through!.tx, ty: 3 };
const BUILDS = [
  { id: 'wood' as const, count: 80 + 60 + 50 },
  { id: 'stone' as const, count: 30 + 10 + 15 },
  { id: 'glowGourd' as const, count: 3 },
];
const ALL = ['main', 'back', 'attic'] as const;

type H = ReturnType<typeof harness>;
const at = (id: FurnitureId, tx: number, ty: number): Placed => ({ id, tx, ty, turn: 0 });
const tileOfPlayer = (h: H) => tileOf(h.world.player.x, h.world.player.y);

function walkOnto(h: H, tx: number, ty: number) {
  expect(h.world.tapTile(tx, ty)).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`);
}

/** At home with the wood, stone and gourds for every room, the back room and the attic built. */
function upstairs(): H {
  const h = harness(undefined, { finds: { bag: BUILDS } });
  const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
  h.world.tapTile(house.tx + 1, house.ty + 1);
  h.until(() => h.world.scene === 'home', 'going in');
  expect(h.world.workbench.craft('backRoom')).not.toBeNull();
  expect(h.world.workbench.craft('attic')).toMatchObject({ made: { newRoom: 'attic' } });
  return h;
}

describe('the attic’s shape', () => {
  it('is a small room under the eaves with one extension, up a ladder from the back room', () => {
    expect(roomOf(0, 'attic', [...ALL])).toMatchObject({
      width: 7,
      floorRows: 5,
      eaves: true,
      chest: null,
      doorways: [],
      mat: { tx: 3, ty: 7 },
    });
    expect(roomOf(1, 'attic', [...ALL])).toMatchObject({ width: 9, floorRows: 7, size: 1 });
    expect(roomOf(2, 'attic', [...ALL]).size).toBe(1);
    expect(roomOf(0, 'back', [...ALL]).doorways).toEqual([
      { ...LADDER, to: 'attic', ladder: true },
    ]);
    expect(roomOf(0, 'back', ['main', 'back']).doorways).toEqual([]);
    for (const id of ['main', 'back'] as const) expect(roomOf(0, id, [...ALL]).eaves).toBe(false);
    // The arch to the back room is still an arch.
    expect(roomOf(0, 'main', [...ALL]).doorways).toEqual([{ ...ARCH, to: 'back' }]);
  });

  it('can only be built onto a back room, and grows once', () => {
    const home = new Home();
    expect(home.rooms.build('attic')).toBeNull();
    home.rooms.build('back');
    expect(home.rooms.build('attic')).toEqual([]);
    expect(home.rooms.built).toEqual([...ALL]);
    expect(home.rooms.sizeOf('attic')).toBe(0);
    expect(home.rooms.grow('attic')).toBe(true);
    expect(home.rooms.sizeOf('attic')).toBe(1);
    expect(home.rooms.grow('attic')).toBe(false);
    // The front room's extensions are its own.
    expect(home.rooms.extensions).toBe(0);
    expect(home.rooms.canGrow).toBe(true);
  });

  it('puts what stood in the ladder’s way in the back room in the chest as it is built', () => {
    const home = new Home({
      rooms: {
        main: { placed: [] },
        back: { placed: [at('ghostPortrait', LADDER.tx, 1), at('cauldron', LADDER.tx, 3)] },
      },
      stored: [],
    });
    expect(
      home.rooms
        .build('attic')!
        .map((p) => p.id)
        .sort(),
    ).toEqual(['cauldron', 'ghostPortrait']);
    expect(home.rooms.placedIn('back')).toEqual([]);
    expect(home.stored.map((s) => s.id).sort()).toEqual(['cauldron', 'ghostPortrait']);
  });
});

describe('the eaves', () => {
  const attic = roomOf(0, 'attic', [...ALL]);
  const back = roomOf(0, 'back', [...ALL]);

  it('knows which pieces are tall from their pictures', () => {
    const tall = (Object.keys(FURNITURE) as FurnitureId[]).filter((id) => {
      if (FURNITURE[id].layer !== 'floor') return false;
      for (let turn = 0; turn < turnCount(id); turn++) {
        const rows = furnitureSprite(id, turn).source.rows.length;
        if (rows - footprint(id, turn).h * 32 > EAVES_RISE) return true;
      }
      return false;
    });
    expect([...TALL].sort()).toEqual(tall.sort());
  });

  it('keeps tall pieces off the back row, and nothing hangs on the ceiling', () => {
    expect(refusal(attic, [], at('grandClock', 2, attic.wallRows), null)).toBe('eaves');
    expect(refusal(attic, [], at('grandClock', 2, attic.wallRows + 1), null)).toBeNull();
    expect(refusal(attic, [], at('cauldron', 2, attic.wallRows), null)).toBeNull();
    expect(refusal(attic, [], at('canopyBed', 1, attic.wallRows), null)).toBe('eaves');
    expect(refusal(attic, [], at('ghostPortrait', 1, 0), null)).toBe('eaves');
    expect(refusal(attic, [], at('ghostPortrait', 1, 1), null)).toBeNull();
    // Only under a roof: the back room has a ceiling as high as ever.
    expect(refusal(back, [], at('grandClock', 2, back.wallRows), null)).toBeNull();
    expect(refusal(back, [], at('ghostPortrait', 2, 0), null)).toBeNull();
  });

  it('says so kindly when she tries, and puts a tall piece where it fits from the chest', () => {
    const h = upstairs();
    walkOnto(h, ARCH.tx, ARCH.ty);
    walkOnto(h, LADDER.tx, LADDER.ty);
    expect(h.world.home.rooms.here).toBe('attic');
    h.world.home.store('grandClock');
    expect(h.world.decorating.takeOut('grandClock')).toBe(true);
    const clock = h.world.home.rooms.placed.find((p) => p.id === 'grandClock')!;
    expect(clock.ty).toBeGreaterThan(h.world.home.rooms.room.wallRows);
    h.world.decorating.start(clock);
    h.world.decorating.tap(1, h.world.home.rooms.room.wallRows);
    expect(h.tick(1)).toContainEqual({ kind: 'refused', why: 'eaves' });
    expect(clock.ty).toBeGreaterThan(h.world.home.rooms.room.wallRows);
  });

  it('moves a saved tall piece that no longer fits under the eaves into the chest', () => {
    const home = new Home({
      rooms: {
        main: { placed: [] },
        back: { placed: [] },
        attic: { placed: [at('grandClock', 2, 3), at('cauldron', 4, 3)] },
      },
      stored: [],
    });
    expect(home.rooms.placedIn('attic').map((p) => p.id)).toEqual(['cauldron']);
    expect(home.stored).toEqual([{ id: 'grandClock', count: 1 }]);
  });
});

describe('making it', () => {
  const knows = { knows: () => true, count: () => 999, roomSize: 0 };

  it('is made at the workbench once there is a back room, and grows once after', () => {
    expect(RECIPES.attic.makes).toEqual({ newRoom: 'attic' });
    expect(RECIPES.atticExtension.makes).toEqual({ room: 1, in: 'attic' });
    expect(RECIPES.attic.card ?? RECIPES.attic.teacher).toBeUndefined();
    expect(cantMake('attic', knows)).toBe('notYet');
    expect(cantMake('attic', { ...knows, rooms: ['main', 'back'] })).toBeNull();
    expect(cantMake('attic', { ...knows, rooms: [...ALL] })).toBe('built');
    expect(cantMake('atticExtension', { ...knows, rooms: ['main', 'back'] })).toBe('notYet');
    expect(cantMake('atticExtension', { ...knows, rooms: [...ALL] })).toBeNull();
    expect(cantMake('atticExtension', { ...knows, rooms: [...ALL], sizes: { attic: 1 } })).toBe(
      'built',
    );
    // The front room's extensions don't count the attic's, nor the attic's the front room's.
    expect(cantMake('roomyExtension', { ...knows, rooms: [...ALL], sizes: { attic: 1 } })).toBe(
      null,
    );
    expect(cantMake('atticExtension', { ...knows, roomSize: 2, rooms: [...ALL] })).toBeNull();
  });

  it('takes wood, stone and glow gourds from her bag, and grows the attic, not the front room', () => {
    const h = upstairs();
    expect(h.world.home.rooms.built).toEqual([...ALL]);
    expect(h.world.bag.count('glowGourd')).toBe(0);
    expect(h.world.workbench.cantMake('attic')).toBe('built');
    expect(h.world.workbench.craft('atticExtension')).toMatchObject({
      made: { room: 1, in: 'attic' },
    });
    expect(h.world.home.rooms.sizeOf('attic')).toBe(1);
    expect(h.world.home.rooms.extensions).toBe(0);
    expect(h.world.workbench.cantMake('atticExtension')).toBe('built');
    expect(h.world.bag.count('wood')).toBe(0);
    expect(h.world.bag.count('stone')).toBe(0);
  });
});

describe('climbing up and down', () => {
  it('goes up the ladder and down the hatch, both ways, and out of the front door after', () => {
    const h = upstairs();
    walkOnto(h, ARCH.tx, ARCH.ty);
    expect(h.world.home.rooms.here).toBe('back');
    const up = walkOnto(h, LADDER.tx, LADDER.ty);
    expect(up).toContainEqual({ kind: 'entered', scene: 'home' });
    expect(h.world.home.rooms.here).toBe('attic');
    const attic = h.world.home.rooms.room;
    expect(tileOfPlayer(h)).toEqual(attic.mat);
    expect(h.world.player.facing).toBe('up');
    expect(h.world.size).toEqual({ width: attic.width, height: attic.height });
    // Papered in its own whitewashed planks, given with it, and floored in oak.
    expect(h.world.home.rooms.wallpaper).toBe('atticPlanks');
    expect(h.world.home.rooms.flooring).toBe('oakBoards');
    expect(h.world.home.wallpapers).toContain('atticPlanks');
    // The hatch goes back down, onto the foot of the ladder, facing out of it.
    walkOnto(h, attic.mat.tx - 1, attic.mat.ty);
    walkOnto(h, attic.mat.tx, attic.mat.ty);
    expect(h.world.home.rooms.here).toBe('back');
    expect(tileOfPlayer(h)).toEqual(LADDER);
    expect(h.world.player.facing).toBe('down');
    const mat = h.world.home.rooms.room.mat;
    walkOnto(h, mat.tx, mat.ty);
    expect(h.world.home.rooms.here).toBe('main');
    const door = h.world.home.rooms.room.mat;
    walkOnto(h, door.tx - 1, door.ty);
    walkOnto(h, door.tx, door.ty);
    expect(h.world.scene).toBe('town');
  });

  it('goes up at a tap on the ladder itself', () => {
    const h = upstairs();
    walkOnto(h, ARCH.tx, ARCH.ty);
    h.world.tapTile(LADDER.tx, 1);
    h.until(() => h.world.home.rooms.here === 'attic', 'climbing the ladder');
  });

  it('keeps the attic, what stands in it and her up there through a save', () => {
    const h = upstairs();
    walkOnto(h, ARCH.tx, ARCH.ty);
    walkOnto(h, LADDER.tx, LADDER.ty);
    h.world.home.store('cauldron');
    expect(h.world.decorating.takeOut('cauldron')).toBe(true);
    h.world.tapTile(2, 4);
    expect(h.world.home.rooms.pieceAt(2, 4)?.id).toBe('cauldron');
    h.world.decorating.stop();
    const save = h.world.save();
    expect(save.home.here).toBe('attic');
    expect(save.home.rooms.attic).toMatchObject({
      placed: [{ id: 'cauldron', tx: 2, ty: 4, turn: 0 }],
      size: 0,
    });
    const again = new World({ clock: new FakeClock(h.clock.now()), ...fromSave(save) });
    expect(again.home.rooms.here).toBe('attic');
    expect(again.home.rooms.pieceAt(2, 4)?.id).toBe('cauldron');
    expect(tileOf(again.player.x, again.player.y)).toEqual(tileOfPlayer(h));
  });

  it('reads a save with no attic as one she hasn’t built, and one with no back room as none', () => {
    const home = new Home({ ...new Home().snapshot(), here: 'attic' });
    expect(home.rooms.built).toEqual(['main']);
    expect(home.rooms.here).toBe('main');
    const orphan = new Home({
      rooms: { main: { placed: [] }, attic: { placed: [] } },
      here: 'attic',
    });
    expect(orphan.rooms.built).toEqual(['main']);
  });

  it('lets a planter grow a bed of its own up there (1.1’s W2’s room key)', () => {
    const h = upstairs();
    h.world.home.store('planterBox');
    walkOnto(h, ARCH.tx, ARCH.ty);
    walkOnto(h, LADDER.tx, LADDER.ty);
    expect(h.world.decorating.takeOut('planterBox')).toBe(true);
    h.world.tapTile(5, 5);
    h.world.decorating.stop();
    const bed = { zone: 'home' as const, tx: 5, ty: 5 };
    expect(h.world.home.rooms.pieceAt(5, 5)?.id).toBe('planterBox');
    h.world.bag.add('basilSeed', 1);
    h.world.farm.till(bed);
    expect(h.world.garden.plant(bed, 'basilSeed')).toMatchObject({ kind: 'planted' });
    const saved = h.world.save().beds.filter((b) => b.zone === 'home');
    expect(saved.map((b) => [b.room, b.planting?.crop])).toEqual([['attic', 'basil']]);
  });
});
