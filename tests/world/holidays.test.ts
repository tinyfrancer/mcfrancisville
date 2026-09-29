import { describe, expect, it } from 'vitest';
import { DECOR } from '../../src/data/holidays';
import { HOLIDAY_LINES } from '../../src/data/holidayLines';
import { fill } from '../../src/systems/friendship';
import { FakeClock } from '../../src/systems/clock';
import { fromSave, World } from '../../src/world/World';
import { harness, type Harness } from './harness';

function walkTo(h: Harness, tx: number, ty: number) {
  expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(2));
}

const TREE = DECOR.christmas.pieces[0]!;

describe('the decorations', () => {
  it('stand a piece in the square while they are up, solid, and take it down after', () => {
    const h = harness();
    h.clock.set(new Date(2026, 10, 30, 12));
    expect(h.world.townZone.propAt(TREE.tx, TREE.ty)).toBeUndefined();
    expect(h.world.canWalk(TREE.tx, TREE.ty)).toBe(true);
    h.clock.set(new Date(2026, 11, 12, 12));
    expect(h.world.holidays.decor()).toBe('christmas');
    expect(h.world.townZone.propAt(TREE.tx, TREE.ty)?.id).toBe('spookyTree');
    expect(h.world.canWalk(TREE.tx, TREE.ty)).toBe(false);
    // A tap on it walks her up beside it, as to anything standing.
    walkTo(h, TREE.tx, TREE.ty);
    const here = h.world.movement.tile;
    expect(Math.max(Math.abs(here.tx - TREE.tx), Math.abs(here.ty - TREE.ty))).toBe(1);
    h.clock.set(new Date(2026, 11, 31, 12));
    expect(h.world.townZone.propAt(TREE.tx, TREE.ty)?.id).toBe('glitterBall');
    h.clock.set(new Date(2027, 0, 2, 12));
    expect(h.world.townZone.propAt(TREE.tx, TREE.ty)).toBeUndefined();
  });

  it('tells her they are up on the morning they go up, the first time she is out in town', () => {
    const h = harness(undefined, { player: { zone: 'home', tx: 3, ty: 4, facing: 'down' } });
    h.clock.set(new Date(2026, 11, 1, 9));
    expect(h.tick(2).some((e) => e.kind === 'decorated')).toBe(false);
    const home = h.world.zones.get('home');
    const mat = home.entry(null).tile;
    const out = walkTo(h, mat.tx, mat.ty);
    expect(h.world.scene).toBe('town');
    expect(out.concat(h.tick(2))).toContainEqual({ kind: 'decorated', decor: 'christmas' });
    // Only the once, and not the next day.
    expect(h.tick(2).some((e) => e.kind === 'decorated')).toBe(false);
    h.clock.set(new Date(2026, 11, 2, 9));
    expect(h.tick(2).some((e) => e.kind === 'decorated')).toBe(false);
  });
});

describe("Easter's egg hunt", () => {
  it('hides eggs round town that she finds by walking onto them, once each', () => {
    const h = harness();
    h.clock.set(new Date(2027, 2, 28, 10));
    const eggs = h.world.holidays.eggs();
    expect(eggs).toHaveLength(8);
    const first = eggs[0]!;
    const events = walkTo(h, first.tx, first.ty);
    expect(events).toContainEqual({ kind: 'foundEgg', found: 1, left: 7 });
    expect(h.world.bag.count('chocolateEgg')).toBe(1);
    expect(h.world.holidays.eggs()).toHaveLength(7);
    // Found for the day, across a window and a reload.
    h.clock.set(new Date(2027, 2, 28, 19));
    const again = new World({ ...fromSave(h.world.save()), clock: new FakeClock(h.clock.now()) });
    expect(again.holidays.eggs()).toHaveLength(7);
    // None the day after.
    h.clock.set(new Date(2027, 2, 29, 10));
    expect(h.world.holidays.eggs()).toEqual([]);
  });

  it('says so when she has found the lot', () => {
    const h = harness();
    h.clock.set(new Date(2027, 2, 28, 10));
    let last = null;
    for (const egg of h.world.holidays.eggs()) {
      last = walkTo(h, egg.tx, egg.ty).find((e) => e.kind === 'foundEgg');
    }
    expect(last).toEqual({ kind: 'foundEgg', found: 8, left: 0 });
    expect(h.world.bag.count('chocolateEgg')).toBe(8);
  });
});

describe('talking on a holiday', () => {
  it('has each neighbour say their holiday line first, and hand her a treat on Halloween', () => {
    const h = harness();
    h.clock.set(new Date(2026, 9, 31, 12));
    const chat = h.world.neighbourhood.talk('rufus');
    expect(chat.line).toBe(fill(HOLIDAY_LINES.halloween.rufus, { name: h.world.name }));
    expect(chat.gift).toBe('candyCorn');
    expect(h.world.bag.count('candyCorn')).toBe(1);
    // Once each.
    expect(h.world.neighbourhood.talk('rufus').gift).toBeUndefined();
    expect(h.world.neighbourhood.talk('maude').gift).toBe('candyCorn');
    expect(h.world.bag.count('candyCorn')).toBe(2);
  });

  it('gives her the party host line, and gift, at a holiday gathering after hello', () => {
    const h = harness();
    h.clock.set(new Date(2026, 11, 24, 19));
    const hello = h.world.neighbourhood.talk('maude');
    expect(hello.line).toBe(fill(HOLIDAY_LINES.christmasEve.maude, { name: h.world.name }));
    const carols = h.world.neighbourhood.talk('maude');
    expect(carols.gift).toBe('gingerbreadBat');
    expect(h.world.bag.count('gingerbreadBat')).toBe(1);
  });
});

describe('holiday letters', () => {
  it('posts the town present at Christmas, once a year', () => {
    const h = harness();
    h.clock.set(new Date(2026, 11, 25, 10));
    const events = h.tick(1);
    expect(events).toContainEqual({ kind: 'mail', from: 'everyone' });
    expect(h.world.mailbox.open('christmas:2026')).toBe(true);
    const stored = h.world.home.stored.find((s) => s.id === 'holidayTree');
    expect(stored).toBeDefined();
    h.tick(5);
    expect(h.world.letters.all.filter((m) => m.id === 'christmas:2026')).toHaveLength(1);
  });
});

describe("the castle's great hall", () => {
  it('digs up the heart key by the frozen creek, which opens the hall', () => {
    const h = harness(undefined, {
      player: { zone: 'whisperwood', tx: 20, ty: 29, facing: 'down' },
    });
    const events = walkTo(h, 21, 28);
    expect(events).toContainEqual({ kind: 'dug', buried: 'hallKey', item: 'hallKey' });
    expect(h.world.bag.count('hallKey')).toBe(1);
    expect(events.concat(h.tick(1))).toContainEqual({ kind: 'opened', zone: 'castleHall' });
  });

  it('keeps its doors locked till she has the key, then lets her in, with a letter from Cody', () => {
    const h = harness(undefined, {
      player: { zone: 'castleHill', tx: 13, ty: 12, facing: 'up' },
      atlas: { found: ['castleHill'], opened: ['castleHill'] },
    });
    const castle = h.world.zones.outdoor('castleHill')!.map.props.find((p) => p.id === 'castle')!;
    const shut = walkTo(h, castle.tx + 4, castle.ty + 4);
    expect(shut).toContainEqual({ kind: 'shut', zone: 'castleHall' });
    expect(h.world.scene).toBe('castleHill');

    h.world.bag.add('hallKey', 1);
    h.tick(1);
    const inside = walkTo(h, castle.tx + 4, castle.ty + 4);
    expect(inside).toContainEqual({ kind: 'entered', scene: 'castleHall' });
    expect(inside).toContainEqual({ kind: 'mail', from: 'cody' });
    expect(inside.some((e) => e.kind === 'found')).toBe(false);
    expect(h.world.scene).toBe('castleHall');

    // Walking up to their portrait counts the years.
    const room = h.world.zones.inside('castleHall')!;
    const portrait = room.things.find((t) => 'fixture' in t && t.fixture.id === 'weddingPortrait')!;
    const at = 'fixture' in portrait ? portrait.fixture : portrait.piece;
    const said = walkTo(h, at.tx, at.ty).find((e) => e.kind === 'arrived' && e.says);
    expect(said).toMatchObject({ fixture: 'weddingPortrait' });
    expect(said?.kind === 'arrived' && said.says).toMatch(/^You and Cody.*\d+ years/);

    // Back out by the mat, onto the castle's step; the letter came only once.
    const mat = h.world.zones.room('castleHall').room.mat;
    walkTo(h, mat.tx, mat.ty - 1);
    walkTo(h, mat.tx, mat.ty);
    expect(h.world.scene).toBe('castleHill');
    walkTo(h, castle.tx + 4, castle.ty + 4);
    expect(h.world.letters.all.filter((m) => m.id === 'found:castleHall')).toHaveLength(1);
  });
});
