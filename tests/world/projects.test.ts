import { describe, expect, it } from 'vitest';
import { PROJECT_IDS, PROJECTS, CANDY_LOT } from '../../src/data/projects';
import { GATHERS_PER_WINDOW } from '../../src/systems/gathering';
import { siteOf } from '../../src/systems/projects';
import { venueOf } from '../../src/systems/happenings';
import { yardOf } from '../../src/systems/yard';
import type { ProjectId } from '../../src/types/ids';
import { tileOf } from '../../src/world/World';
import type { World } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Puts everything a project asks for in her bag and purse. */
function stock(world: World, id: ProjectId): void {
  world.wallet.earn(PROJECTS[id].candy);
  for (const n of PROJECTS[id].needs) world.bag.add(n.item, n.count);
}

/** Gives a project all it asks for, a need at a time. */
function fund(world: World, id: ProjectId) {
  stock(world, id);
  const events = [];
  for (const n of PROJECTS[id].needs) events.push(world.projects.give(n));
  events.push(world.projects.give({ candy: Math.ceil(PROJECTS[id].candy / CANDY_LOT) }));
  return events;
}

function walkTo(h: Harness, tx: number, ty: number): void {
  expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
  h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`);
  h.tick(2);
}

describe("the town's projects (V1's R4)", () => {
  it('starts one at a time, and nothing stands on a site before anything is given', () => {
    const { world } = harness();
    expect(world.projects.current).toBeNull();
    expect(world.townZone.propAt(26, 19)).toBeUndefined();
    expect(world.projects.give({ item: 'wood', count: 1 })).toBeNull();
    expect(world.projects.start('bandstand')).toEqual([]);
    expect(world.projects.start('greenhouse')).toBeNull();
    expect(world.projects.current).toBe('bandstand');
    expect(world.townZone.propAt(26, 19)).toBeUndefined();
  });

  it('puts the posts up once something is in, the frame from halfway, and builds it at the last', () => {
    const { world } = harness();
    world.projects.start('bandstand');
    stock(world, 'bandstand');
    const first = world.projects.give({ item: 'wood', count: 10 });
    expect(first).toEqual({ kind: 'pitchedIn', project: 'bandstand', raised: 'posts' });
    expect(world.bag.count('wood')).toBe(70);
    expect(world.townZone.propAt(26, 19)?.id).toBe('sitePost');
    expect(world.townZone.canWalk(26, 19)).toBe(false);
    // The posts are at the corners only.
    expect(world.townZone.propAt(27, 19)).toBeUndefined();
    // Never more than it asks, nor more than she has.
    world.projects.give({ item: 'wood', count: 500 });
    expect(world.bag.count('wood')).toBe(0);
    expect(world.projects.give({ item: 'wood', count: 1 })).toBeNull();
    const candy = world.wallet.candy;
    world.projects.give({ candy: 30 });
    expect(world.wallet.candy).toBe(candy - 30 * CANDY_LOT);
    expect(world.projects.view()[0]!.stage).toBe('frames');
    expect(world.townZone.propAt(27, 20)?.id).toBe('bandstandFrame');
    world.projects.give({ item: 'stone', count: 40 });
    const pumpkins = world.projects.give({ item: 'pumpkin', count: 6 });
    expect(pumpkins).toEqual({ kind: 'pitchedIn', project: 'bandstand' });
    expect(world.projects.give({ candy: 19 })).toEqual({ kind: 'pitchedIn', project: 'bandstand' });
    const last = world.projects.give({ candy: 100 });
    expect(last).toEqual({ kind: 'built', project: 'bandstand' });
    expect(world.townZone.propAt(27, 19)?.id).toBe('bandstand');
    expect(world.projects.current).toBeNull();
    expect(world.letters.all.some((m) => m.id === 'project:bandstand')).toBe(true);
    // The next can be started.
    expect(world.projects.start('greenhouse')).toEqual([]);
  });

  it("signs the mayor's letter as the mayor until she has met him", () => {
    const { world } = harness();
    world.projects.start('footbridge');
    fund(world, 'footbridge');
    const letter = world.mailbox.view().find((m) => m.id === 'project:footbridge');
    expect(letter?.from).toBe('mayor');
    expect(letter?.text).not.toContain('Rob');
  });

  it('plays a tune at the built bandstand, and its music box after dark', () => {
    const h = harness(undefined, { projects: { built: ['bandstand'] } });
    walkTo(h, 27, 20);
    expect(h.world.fountain.playing()).toBe(false);
    h.clock.set(new Date(2026, 9, 3, 21));
    expect(h.world.fountain.playing()).toBe(true);
  });

  it('sends a tune at the bandstand as she arrives', () => {
    const h = harness(undefined, { projects: { built: ['bandstand'] } });
    expect(h.world.tapTile(27, 20)).toBe(true);
    const events = h.until(() => !h.world.player.moving, 'walking up to the bandstand');
    expect(events.some((e) => e.kind === 'tune')).toBe(true);
  });

  it('seats her on the castle garden bench once it is restored', () => {
    const h = harness(undefined, {
      player: { zone: 'castleHill', tx: 9, ty: 26, facing: 'up' },
      projects: { built: ['castleGarden'] },
    });
    expect(h.world.zone.propAt(8, 24)?.id).toBe('gardenSeat');
    walkTo(h, 8, 24);
    expect(h.world.sitting.seat).not.toBeNull();
  });

  it('carries her over the built footbridge without her skates', () => {
    const h = harness(undefined, {
      player: { zone: 'whisperwood', tx: 21, ty: 24, facing: 'down' },
      projects: { built: ['footbridge'] },
    });
    h.world.bag.remove('iceSkates', 1);
    const wood = h.world.zones.outdoor('whisperwood')!;
    expect(wood.slippery(21, 25)).toBe(false);
    expect(wood.propAt(21, 25)).toBeUndefined();
    expect(wood.sites?.flat().map((p) => p.id)).toEqual(['footbridge']);
    walkTo(h, 21, 27);
    expect(tileOf(h.world.player.x, h.world.player.y)).toEqual({ tx: 21, ty: 27 });
  });

  it("keeps the frame's tiles off the creek's skating, and the creek ice before it's built", () => {
    const h = harness(undefined, {
      player: { zone: 'whisperwood', tx: 21, ty: 24, facing: 'down' },
    });
    const wood = h.world.zones.outdoor('whisperwood')!;
    expect(wood.slippery(21, 25)).toBe(true);
    h.world.projects.start('footbridge');
    stock(h.world, 'footbridge');
    h.world.projects.give({ item: 'wood', count: 120 });
    h.world.projects.give({ candy: 21 });
    expect(wood.propAt(21, 25)?.id).toBe('bridgeFrame');
    expect(wood.canWalk(21, 25)).toBe(false);
  });

  it("makes her greenhouse's planters beds, under glass, behind her house", () => {
    const h = harness(undefined, { projects: { built: ['greenhouse'] } });
    for (const bed of PROJECTS.greenhouse.beds!) {
      expect(h.world.farm.isBed({ zone: 'town', ...bed })).toBe(true);
      expect(h.world.townZone.canWalk(bed.tx, bed.ty)).toBe(false);
    }
    const bed = { zone: 'town' as const, ...PROJECTS.greenhouse.beds![0]! };
    h.world.farm.till(bed);
    // A spring crop in September grows as if it were in season.
    h.world.bag.add('tulipBulb', 1);
    const planted = h.world.garden.plant(bed, 'tulipBulb');
    expect(planted).toMatchObject({ kind: 'planted', quick: true });
  });

  it('makes room in her yard for her greenhouse as she starts it, and keeps it till built', () => {
    const lantern = { id: 'yardLantern' as const, tx: 5, ty: 1, turn: 0 };
    const bench = { id: 'gardenBench' as const, tx: 6, ty: 13, turn: 0 };
    const { world } = harness(undefined, { yard: { placed: [lantern, bench] } });
    // Her lawn is hers until she starts it: the lantern stays where she put it.
    expect(yardOf(world.map)!.lawn.has(1 * world.map.width + 5)).toBe(true);
    expect(world.yard.placed.map((p) => p.id)).toEqual(['yardLantern', 'gardenBench']);
    expect(world.projects.start('greenhouse')).toEqual(['yardLantern']);
    expect(world.yard.placed.map((p) => p.id)).toEqual(['gardenBench']);
    expect(world.home.stored.some((s) => s.id === 'yardLantern')).toBe(true);
    // Nothing of hers may stand there now, nor is it marked as lawn while she decorates.
    const site = new Set(siteOf('greenhouse').map((t) => `${t.tx},${t.ty}`));
    expect(world.yard.lawn().some((t) => site.has(`${t.tx},${t.ty}`))).toBe(false);
    expect(world.yard.move(world.yard.placed[0]!, 6, 2, null)).toBe('noRoom');
  });

  it('lets a whole round of the woods go once a window, at the most a round of the town', () => {
    const h = harness(undefined, {
      player: { zone: 'whisperwood', tx: 1, ty: 17, facing: 'right' },
    });
    const wood = h.world.zones.outdoor('whisperwood')!;
    const trees = wood.map.props.filter((p) => p.id === 'tree' || p.id === 'oldTree');
    expect(trees.length).toBeGreaterThan(GATHERS_PER_WINDOW);
    const gathered = trees
      .slice(0, GATHERS_PER_WINDOW + 1)
      .map((p) => h.world.gathering.arriveAt(wood, { tx: p.tx, ty: p.ty + p.h }, p)[0]!);
    expect(gathered.slice(0, GATHERS_PER_WINDOW).every((e) => e.kind === 'gathered')).toBe(true);
    expect(gathered.at(-1)).toMatchObject({ kind: 'resting', plenty: 'whisperwood' });
    // The town's are its own, and the next window the woods give again.
    h.clock.set(new Date(2026, 8, 26, 19));
    const again = trees.at(-1)!;
    expect(h.world.gathering.arriveAt(wood, again, again)[0]?.kind).toBe('gathered');
  });

  it('says so in Today while one is under way, with a tap to the noticeboard', () => {
    const { world } = harness();
    expect(world.upNow.lines().some((l) => l.kind === 'project')).toBe(false);
    world.projects.start('greenhouse');
    stock(world, 'greenhouse');
    world.projects.give({ item: 'wood', count: 60 });
    const line = world.upNow.lines().find((l) => l.kind === 'project');
    expect(line).toMatchObject({ kind: 'project', id: 'greenhouse', percent: 1 });
    expect(line?.go).toEqual({ zone: 'town', prop: 'noticeboard' });
    world.projects.give({ item: 'stone', count: 40 });
    world.projects.give({ item: 'sunflower', count: 4 });
    world.projects.give({ candy: 60 });
    expect(world.upNow.lines().some((l) => l.kind === 'project')).toBe(false);
  });

  it("moves Boothoven's recital out to the bandstand once it's built", () => {
    // A Tuesday evening.
    const tuesday = new Date(2026, 9, 6, 19, 30);
    const before = harness();
    before.clock.set(tuesday);
    expect(venueOf('recital').zone).toBe('boothovenParlour');
    const after = harness(undefined, { projects: { built: ['bandstand'] } });
    after.clock.set(tuesday);
    expect(venueOf('recital')).toMatchObject({ zone: 'town', where: { at: 'bySalonCorner' } });
    void before;
  });

  it('lists every project for the board, with what each still wants and what she has', () => {
    const { world } = harness();
    world.bag.add('wood', 5);
    const view = world.projects.view();
    expect(view.map((p) => p.id)).toEqual(PROJECT_IDS);
    const bandstand = view[0]!;
    expect(bandstand.items.find((i) => i.item === 'wood')).toEqual({
      item: 'wood',
      of: 80,
      given: 0,
      has: world.bag.spare('wood'),
    });
    expect(bandstand.candy.wanted).toBe(PROJECTS.bandstand.candy);
  });
});
