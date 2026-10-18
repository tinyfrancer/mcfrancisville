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
import { canGoToday, goToday } from '../../src/wiring/todayGo';
import type { World } from '../../src/world/World';
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
      const favour = w.neighbourhood.favour(line.who);
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
    expect(h.world.neighbourhood.doFavour(asking.who)).not.toBeNull();
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
});
