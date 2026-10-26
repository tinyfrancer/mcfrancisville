import { describe, expect, it } from 'vitest';
import { CROPS } from '../../src/data/crops';
import { TOWN } from '../../src/data/maps';
import { HAPPENINGS } from '../../src/data/happenings';
import { dayKey, hourOf } from '../../src/systems/clock';
import { isVisiting } from '../../src/systems/critters';
import { stageOf } from '../../src/systems/farming';
import { happeningsOn, hourOfNight, venueOf } from '../../src/systems/happenings';
import { parseMap } from '../../src/systems/grid';
import { hasFresh, type TodayLine } from '../../src/systems/today';
import { weatherOn } from '../../src/systems/weather';
import { windyOn } from '../../src/systems/kite';
import { PASSERS } from '../../src/data/rareEvents';
import { passersOn, rareEventOn } from '../../src/systems/rareEvents';
import { canGoToday, goToday } from '../../src/wiring/todayGo';
import type { World } from '../../src/world/World';
import { FREE_GO_KEY, FREE_RIDE_KEY } from '../../src/world/services/Activities';
import { isFairDay } from '../../src/systems/fairRide';
import { harness, type Harness } from './harness';

const HOUR = 3_600_000;
const map = parseMap(TOWN);

function walkUp(h: Harness, id: string) {
  const { tx, ty } = map.props.find((p) => p.id === id)!;
  h.world.tapTile(tx, ty);
  return h.until(() => !h.world.player.moving, `walking to the ${id}`).concat(h.tick(1));
}

/**
 * Whether a line of Today is true of the world, asked of the world's own services and rules, not
 * of the facts it was worked out from. A caller's line moves the clock to see them at hers, and
 * puts it back.
 */
function holds(h: Harness, line: TodayLine): boolean {
  const w: World = h.world;
  const now = h.clock.now();
  const day = dayKey(now);
  switch (line.kind) {
    case 'firstDay':
      return w.firstDay.open && w.firstDay.done.length === line.done;
    case 'tree':
      return line.candy > 0 && w.candyTree.candy() === line.candy;
    case 'stall': {
      const { sold, tin } = w.stall.view();
      return tin === line.candy && sold.reduce((n, s) => n + s.count, 0) === line.sold;
    }
    case 'ripe': {
      const beds = w.farm
        .snapshot()
        .filter(
          (b) =>
            b.zone === line.zone &&
            b.planting !== null &&
            stageOf(b.planting, now, w.farm.sprinkled(b)) === 'ripe',
        );
      const crops = beds.map((b) => CROPS[b.planting!.crop].harvest.item);
      return beds.length === line.beds && crops.includes(line.crop);
    }
    case 'notes':
      return w.noticeboard.notices().filter((n) => !n.done).length === line.open;
    case 'favour': {
      const favour = w.talk.favour(line.who);
      const zone = w.neighbourhood.whereIs(line.who)?.zone ?? null;
      return favour?.item === line.item && favour.count === line.count && zone === line.zone;
    }
    case 'mounds':
      return line.zones.every((z) => w.fossils.mound(z) !== null && !w.fossils.isDug(z));
    case 'callers': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      h.clock.set(start.getTime() + (line.from + 0.25) * HOUR);
      const doing = w.neighbourhood.whereIs(line.who)?.doing;
      h.clock.set(now);
      return !!doing && 'visiting' in doing && doing.visiting === 'her';
    }
    case 'happening':
      return (
        happeningsOn(day).includes(line.id) &&
        hourOfNight(hourOf(now)) < HAPPENINGS[line.id].until &&
        venueOf(line.id).zone === line.zone
      );
    case 'critters':
      return (
        line.visiting.length > 0 &&
        line.visiting.every((id) => isVisiting(id, day, weatherOn(day))) &&
        line.fresh.every((id) => line.visiting.includes(id) && !w.milestones.hasHad(id))
      );
    case 'visitsSoon':
      return line.days > 0;
    case 'wanted':
      return JSON.stringify(line.items) === JSON.stringify(w.shops.wanted());
    // V1's R3.
    case 'rare':
      return rareEventOn(day) === line.id && w.rareEvents.today() === line.id;
    case 'peddler':
      return line.shop === 'moonPie' ? w.shops.isOpen('moonPie') : w.shops.isOpen('popUp');
    case 'passer':
      return passersOn(day).includes(line.who) && PASSERS[line.who].zone === line.zone;
    case 'stray': {
      const stray = line.carrying ? w.rareEvents.carrying() : w.rareEvents.stray();
      return stray?.owner === line.owner && stray.zone === line.zone;
    }
    // V1's R4.
    case 'project': {
      const view = w.projects.view().find((p) => p.id === line.id);
      return (
        w.projects.current === line.id && Math.floor((view?.progress ?? -1) * 100) === line.percent
      );
    }
    // 1.0.1.
    case 'shiny':
      return w.collecting
        .critters(line.zone)
        .some((c) => c.shiny === true && c.critter === line.critter);
    // 1.4's G3: the pond is ice, with something under it to fish for.
    case 'iceFishing':
      return w.townZone.isIce(23, 43);
    case 'freeGo':
      return (
        w.activities.freeGo() === line.id &&
        w.activities.freeToday(line.id) &&
        w.activities.isOpen(line.id) === line.open
      );
    // 1.6's X2: a fair day, the day's free ride still to be had.
    // 1.6's X3.
    case 'eggs':
      return line.eggs > 0 && w.henhouse.view().eggs === line.eggs;
    case 'bigWheel':
      return (
        isFairDay(day) && w.activities.freeRide() && w.activities.isOpen('bigWheel') === line.open
      );
    // 1.6's X4.
    case 'rainbow':
      return w.weather.rainbow() !== null;
    // 1.6's X6.
    case 'kite':
      return windyOn(day, line.zone);
    // 1.5's G4.
    case 'stars':
      return (
        w.stargazing.sky() === 'open' &&
        w.stargazing.tonight().findable.includes(line.constellation) &&
        (w.cabinet.tracedOn(line.constellation) !== null) === line.found
      );
  }
}

const kinds = (lines: readonly TodayLine[]) => lines.map((l) => l.kind);

function expectTrue(h: Harness): TodayLine[] {
  const lines = h.world.upNow.lines();
  for (const line of lines) expect(holds(h, line), JSON.stringify(line)).toBe(true);
  return lines;
}

describe("Today (V1's R2)", () => {
  it('says what a new town has waiting, every line true of it', () => {
    const h = harness(TOWN);
    const lines = expectTrue(h);
    expect(kinds(lines)).toEqual(expect.arrayContaining(['tree', 'notes', 'wanted', 'mounds']));
    expect(lines.find((l) => l.kind === 'tree')?.go).toEqual({ zone: 'town', prop: 'candyTree' });
  });

  it('stays true of the world through a week of mornings, afternoons and evenings', () => {
    const h = harness(TOWN);
    const seen = new Set<string>();
    for (let step = 0; step < 21; step++) {
      for (const line of expectTrue(h)) seen.add(line.kind);
      h.clock.advance(8 * HOUR);
      h.tick(1);
    }
    expect([...seen]).toEqual(
      expect.arrayContaining(['tree', 'notes', 'favour', 'mounds', 'happening', 'callers']),
    );
  });

  it('lets a line go once it is done: the tree shaken, the notes answered, a favour done', () => {
    const h = harness(TOWN);
    walkUp(h, 'candyTree');
    let lines = expectTrue(h);
    expect(kinds(lines)).not.toContain('tree');
    for (const note of h.world.noticeboard.notices()) {
      h.world.bag.add(note.item, note.count);
      h.world.noticeboard.answer(note.slot);
    }
    lines = expectTrue(h);
    expect(kinds(lines)).not.toContain('notes');
    const asking = lines.find((l) => l.kind === 'favour');
    expect(asking).toBeDefined();
    if (asking?.kind !== 'favour') return;
    h.world.bag.add(asking.item, asking.count);
    expect(h.world.talk.doFavour(asking.who)).not.toBeNull();
    lines = expectTrue(h);
    expect(lines.some((l) => l.kind === 'favour' && l.who === asking.who)).toBe(false);
  });

  it('counts the ripe beds by place, the mounds left to dig and the stall’s takings', () => {
    const h = harness(TOWN);
    const beds = map.beds.slice(0, 2).map((b) => ({ zone: 'town' as const, ...b }));
    for (const bed of beds) {
      h.world.farm.till(bed);
      h.world.garden.plant(bed, 'pumpkinSeed');
    }
    h.world.bag.add('pumpkin', 4);
    h.world.stall.leave('pumpkin', 4);
    const mound = h.world.upNow.lines().find((l) => l.kind === 'mounds');
    if (mound?.kind !== 'mounds') throw new Error('no mounds today');
    h.world.fossils.dig(mound.zones[0]!);
    const after = expectTrue(h).find((l) => l.kind === 'mounds');
    expect(after?.kind === 'mounds' && after.zones).not.toContain(mound.zones[0]);
    h.clock.advance(14 * 24 * HOUR);
    h.tick(1);
    const lines = expectTrue(h);
    const ripe = lines.find((l) => l.kind === 'ripe');
    expect(ripe).toMatchObject({ kind: 'ripe', zone: 'town', beds: 2, crop: 'pumpkin' });
    expect(ripe?.go).toMatchObject({ zone: 'town', bed: true });
    expect(lines.find((l) => l.kind === 'stall')).toMatchObject({ sold: 4 });
  });

  it('is news when a line comes that she has not seen, and not when the same lines are up', () => {
    const h = harness(TOWN);
    const lines = h.world.upNow.lines();
    expect(hasFresh(lines, [])).toBe(true);
    const keys = lines.map((l) => l.key);
    expect(hasFresh(h.world.upNow.lines(), keys)).toBe(false);
    // The next window, the tree has filled again and new notes are up.
    h.clock.advance(6 * HOUR);
    h.tick(1);
    expect(hasFresh(h.world.upNow.lines(), keys)).toBe(true);
  });

  it('takes her to the tree from the town, and from her house by broom', () => {
    const h = harness(TOWN);
    const tree = h.world.upNow.lines().find((l) => l.kind === 'tree')!;
    expect(canGoToday(h.world, tree.go!)).toBe(true);
    expect(goToday(h.world, tree.go!)).toBe(true);
    h.until(() => !h.world.player.moving, 'walking to the tree');
    h.tick(1);
    expect(h.world.candyTree.shakenAt).not.toBeNull();
    h.clock.advance(6 * HOUR);
    h.tick(1);
    h.world.travel.home();
    expect(h.world.scene).toBe('home');
    const again = h.world.upNow.lines().find((l) => l.kind === 'tree')!;
    expect(goToday(h.world, again.go!)).toBe(true);
    expect(h.world.scene).toBe('town');
    h.until(() => !h.world.player.moving, 'walking to the tree');
    h.tick(1);
    expect(h.world.candyTree.candy()).toBe(0);
  });

  it('flies her to a neighbour asking a favour, or walks her up to one where she is', () => {
    const h = harness(TOWN);
    h.clock.advance(-2 * HOUR);
    h.tick(2);
    const favours = h.world.upNow.lines().filter((l) => l.kind === 'favour');
    expect(favours.length).toBeGreaterThan(0);
    for (const line of favours) {
      if (line.kind !== 'favour' || !line.go) continue;
      const here = h.world.neighbourhood.neighboursIn(h.world.scene).some((n) => n.id === line.who);
      if (!canGoToday(h.world, line.go)) {
        // Only someone in a building with no door here, or where she is but out of reach.
        expect(here).toBe(false);
        continue;
      }
      expect(goToday(h.world, line.go)).toBe(true);
    }
  });

  it('says where the fair’s free go is, flies her up to its stall, and goes once it’s had (1.0.1)', () => {
    const h = harness(TOWN);
    h.clock.set(new Date(2026, 8, 19, 19));
    h.tick(1);
    const line = expectTrue(h).find((l) => l.kind === 'freeGo')!;
    expect(line).toMatchObject({ id: h.world.activities.freeGo(), open: true });
    // Once she has been to the fairground, as any flight by the map.
    h.world.atlas.find('fairground');
    expect(goToday(h.world, line.go!)).toBe(true);
    expect(h.world.scene).toBe('fairground');
    const arrived = h.until(() => !h.world.player.moving, 'walking to the stall');
    const prop = line.go && 'prop' in line.go ? line.go.prop : null;
    expect(arrived.concat(h.tick(1))).toContainEqual(expect.objectContaining({ at: prop }));
    h.world.takings.take(FREE_GO_KEY);
    expect(h.world.upNow.lines().some((l) => l.kind === 'freeGo')).toBe(false);
  });
});

describe('the big wheel (1.6 X2)', () => {
  it('says the wheel is turning on a fair day, takes her to it, and goes once she has ridden', () => {
    const h = harness(TOWN);
    // A Saturday in September, out of the festival.
    h.clock.set(new Date(2026, 8, 19, 15));
    h.tick(1);
    const line = expectTrue(h).find((l) => l.kind === 'bigWheel')!;
    expect(line).toMatchObject({ open: true, go: { zone: 'fairground', prop: 'ferrisWheel' } });
    h.world.atlas.find('fairground');
    expect(goToday(h.world, line.go!)).toBe(true);
    expect(h.world.scene).toBe('fairground');
    const arrived = h.until(() => !h.world.player.moving, 'walking to the wheel');
    expect(arrived.concat(h.tick(1))).toContainEqual(
      expect.objectContaining({ at: 'ferrisWheel' }),
    );
    h.world.takings.take(FREE_RIDE_KEY);
    expect(h.world.upNow.lines().some((l) => l.kind === 'bigWheel')).toBe(false);
  });

  it('says nothing of it on an ordinary weekday', () => {
    const h = harness(TOWN);
    // A Wednesday in September.
    h.clock.set(new Date(2026, 8, 16, 15));
    h.tick(1);
    expect(h.world.upNow.lines().some((l) => l.kind === 'bigWheel')).toBe(false);
  });
});

describe('a clear night (1.5 G4)', () => {
  it('says the telescope is out, takes her there, and moves on once one is traced', () => {
    const h = harness();
    // 7 October 2026: clear, and no meteor shower.
    h.clock.set(new Date(2026, 9, 7, 22));
    expect(weatherOn('2026-10-07')).toBe('clear');
    const stars = () => expectTrue(h).find((l) => l.kind === 'stars');
    expect(stars()).toMatchObject({ constellation: 'bat', found: false });
    h.world.atlas.find('castleHill');
    expect(goToday(h.world, stars()!.go!)).toBe(true);
    h.world.stargazing.begin('bat');
    for (let i = 0; i < 9; i++) h.world.stargazing.tap(i);
    expect(stars()).toMatchObject({ constellation: 'cauldron', found: false });
    h.clock.set(new Date(2026, 9, 7, 13));
    expect(stars()).toBeUndefined();
  });
});
