import type { HomeSnapshot } from '../../src/data/home';
import { describe, expect, it } from 'vitest';
import { CROPS } from '../../src/data/crops';
import { FURNITURE } from '../../src/data/furniture';
import { TOWN } from '../../src/data/maps';
import { RECIPES } from '../../src/data/recipes';
import { ZONES } from '../../src/data/zones';
import { stageOf } from '../../src/systems/farming';
import { migrateSave } from '../../src/persistence/migrations';
import { newSave } from '../../src/persistence/SaveState';
import { parseMap } from '../../src/systems/grid';
import type { MapZoneId, ZoneId } from '../../src/types/ids';
import type { Plot } from '../../src/world/Farm';
import { fromSave, World, type WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** She stands in `zone` on `tile`, with enough of everything to build and plant. */
function standingIn(zone: ZoneId, tile: { tx: number; ty: number }): Harness {
  return harness(undefined, {
    player: { zone, ...tile, facing: 'down' },
    finds: {
      bag: [
        { id: 'pumpkinSeed', count: 10 },
        { id: 'hostaDivision', count: 4 },
        { id: 'moonflowerSeed', count: 4 },
        { id: 'basilSeed', count: 2 },
        { id: 'wood', count: 200 },
        { id: 'stone', count: 100 },
      ],
    },
  });
}

/** Taps a bed twice, to look and then to walk up and do what it said, and lets her get there. */
function tend(h: Harness, bed: Plot): WorldEvent[] {
  h.world.tapTile(bed.tx, bed.ty);
  h.world.tapTile(bed.tx, bed.ty);
  return h.until(() => !h.world.player.moving, `tending ${bed.tx},${bed.ty}`).concat(h.tick(1));
}

/** Digs a bed over, plants `seed`, and brings the days round until it's ripe, watered each day. */
function grow(h: Harness, bed: Plot, seed: Parameters<World['garden']['plant']>[1]): number {
  tend(h, bed);
  expect(h.world.garden.plant(bed, seed)).not.toBeNull();
  let days = 0;
  while (stageOf(h.world.farm.planting(bed)!, h.clock.now()) !== 'ripe') {
    tend(h, bed);
    h.clock.advance(24 * 60 * 60 * 1000);
    days++;
    if (days > 10) expect.fail(`${seed} never ripened`);
  }
  return days;
}

const bedsOf = (zone: MapZoneId) => parseMap(ZONES[zone].map!).beds;

describe('beds beyond the farm', () => {
  it('has a plot by the creek in Whisperwood and by the lake at Lantern Shore', () => {
    expect(bedsOf('whisperwood').length).toBeGreaterThanOrEqual(4);
    expect(bedsOf('lanternShore').length).toBeGreaterThanOrEqual(4);
  });

  it('grows a bed in the woods, and keeps it apart from the town bed on the same tile', () => {
    const bed = { zone: 'whisperwood' as const, ...bedsOf('whisperwood')[0]! };
    const h = standingIn('whisperwood', { tx: bed.tx, ty: bed.ty + 1 });
    const events = tend(h, bed);
    expect(events).toContainEqual({ kind: 'tilled', tx: bed.tx, ty: bed.ty });
    expect(h.world.farm.isTilled(bed)).toBe(true);
    expect(h.world.farm.isTilled({ tx: bed.tx, ty: bed.ty })).toBe(false);
    grow(h, bed, 'pumpkinSeed');
    const picked = tend(h, bed);
    expect(picked).toContainEqual(expect.objectContaining({ kind: 'harvested', crop: 'pumpkin' }));
  });

  it("grows a crop a day sooner where it thrives, and says so as it's planted", () => {
    const thrives = (Object.keys(CROPS) as (keyof typeof CROPS)[]).filter(
      (c) => CROPS[c].thrives?.length,
    );
    expect(thrives.length).toBeGreaterThanOrEqual(2);
    for (const zone of ['whisperwood', 'lanternShore'] as const) {
      expect(
        thrives.some((c) => CROPS[c].thrives!.includes(zone)),
        zone,
      ).toBe(true);
    }
    const bed = { zone: 'whisperwood' as const, ...bedsOf('whisperwood')[0]! };
    const h = standingIn('whisperwood', { tx: bed.tx, ty: bed.ty + 1 });
    tend(h, bed);
    expect(h.world.garden.plant(bed, 'hostaDivision')).toMatchObject({ quick: true });
    expect(h.world.garden.look(bed, 'hands').days).toBe(CROPS.hosta.days - 1);
    h.world.farm.set(bed, null);
    expect(h.world.garden.plant(bed, 'moonflowerSeed')).not.toHaveProperty('quick');
    expect(h.world.garden.look(bed, 'hands').days).toBe(CROPS.moonflower.days);
  });

  it('grows a bed by the lake, and keeps it through a save', () => {
    const bed = { zone: 'lanternShore' as const, ...bedsOf('lanternShore')[0]! };
    const h = standingIn('lanternShore', { tx: bed.tx + 2, ty: bed.ty });
    tend(h, bed);
    h.world.garden.plant(bed, 'moonflowerSeed');
    const save = h.world.save();
    expect(save.beds).toContainEqual(expect.objectContaining(bed));
    const again = new World({ clock: h.clock, ...fromSave(save) });
    expect(again.farm.planting(bed)).toMatchObject({ crop: 'moonflower', quick: true });
  });

  it('keeps what grew by the lake before its beds moved up the bank (decision 240)', () => {
    const h = standingIn('lanternShore', { tx: 3, ty: 19 });
    const player = { zone: 'lanternShore' as const, tx: 3, ty: 19, facing: 'down' as const };
    const old = { ...newSave(h.clock.now(), player), version: 37 } as Record<string, unknown>;
    // Her home as v37 kept it, one room (0.3's H4).
    const home = old.home as HomeSnapshot;
    const { stored, items, wallpapers, floorings } = home;
    old.home = { stored, items, wallpapers, floorings, ...home.rooms.main };
    const planting = {
      crop: 'moonflower',
      plantedAt: h.clock.now(),
      waterings: 0,
      lastWatered: null,
      quick: true,
    };
    old.beds = [{ zone: 'lanternShore', tx: 3, ty: 22, planting }];
    old.sprinklers = [{ zone: 'lanternShore', tx: 3, ty: 22, since: '2026-10-01' }];
    const migrated = migrateSave(old);
    expect(migrated).not.toBeNull();
    const loaded = new World({ clock: h.clock, ...fromSave(migrated) });
    const bed = { zone: 'lanternShore' as const, tx: 1, ty: 20 };
    expect(loaded.farm.planting(bed)).toMatchObject({ crop: 'moonflower', quick: true });
    expect(loaded.farm.sprinklersIn).toEqual([{ ...bed, since: '2026-10-01' }]);
    expect(loaded.farm.strayed).toBe(0);
  });
});

describe("the farm's extensions", () => {
  const rows = parseMap(TOWN).plots;

  it('keeps grass for two rows of beds, a recipe for each, built in order', () => {
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(row.length).toBeGreaterThanOrEqual(6);
    const recipes = Object.values(RECIPES).filter((r) => 'beds' in r.makes);
    expect(recipes.map((r) => ('beds' in r.makes ? r.makes.beds : 0))).toEqual([1, 2]);
  });

  it('turns the grass into beds she can tend, solid now, and saves how far she has built', () => {
    const h = standingIn('town', TOWN.spawn);
    const bed = { zone: 'town' as const, ...rows[0]![0]! };
    expect(h.world.farm.isBed(bed)).toBe(false);
    expect(h.world.canWalk(bed.tx, bed.ty)).toBe(true);
    expect(h.world.workbench.cantMake('northRow')).toBe('notYet');
    expect(h.world.workbench.craft('gardenRow')).toMatchObject({ made: { beds: 1 } });
    expect(h.world.workbench.cantMake('gardenRow')).toBe('built');
    expect(h.world.farm.isBed(bed)).toBe(true);
    expect(h.world.canWalk(bed.tx, bed.ty)).toBe(false);
    expect(h.world.farm.isBed({ zone: 'town', ...rows[1]![0]! })).toBe(false);
    grow(h, bed, 'pumpkinSeed');
    expect(h.world.save().farmRows).toBe(1);
    const again = new World({ clock: h.clock, ...fromSave(h.world.save()) });
    expect(again.farm.planting(bed)?.crop).toBe('pumpkin');
    expect(again.workbench.craft('northRow')).toMatchObject({ made: { beds: 2 } });
    expect(again.farm.canExtend).toBe(false);
  });

  it('leaves the whole town in reach with both rows built, and every new bed beside it', () => {
    const h = standingIn('town', TOWN.spawn);
    const map = parseMap(TOWN);
    const reached = (): Set<string> => {
      const seen = new Set([`${TOWN.spawn.tx},${TOWN.spawn.ty}`]);
      const queue = [TOWN.spawn];
      while (queue.length > 0) {
        const { tx, ty } = queue.pop()!;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const next = { tx: tx + dx, ty: ty + dy };
          const key = `${next.tx},${next.ty}`;
          if (seen.has(key) || !h.world.canWalk(next.tx, next.ty)) continue;
          seen.add(key);
          queue.push(next);
        }
      }
      return seen;
    };
    const before = reached();
    h.world.workbench.craft('gardenRow');
    h.world.workbench.craft('northRow');
    const after = reached();
    const plots = new Set(rows.flat().map((t) => `${t.tx},${t.ty}`));
    for (const key of before) if (!plots.has(key)) expect(after.has(key), key).toBe(true);
    for (const t of rows.flat()) {
      const beside = h.world.zone.standBeside(t.tx, t.ty);
      expect(
        beside.some((b) => after.has(`${b.tx},${b.ty}`)),
        `${t.tx},${t.ty}`,
      ).toBe(true);
    }
    expect(map.width).toBe(40);
  });
});

describe('planters', () => {
  /** At home, with a planter box from the workbench set down in her room. */
  function withPlanter(): { h: Harness; bed: Plot } {
    const h = standingIn('home', { tx: 3, ty: 4 });
    h.world.workbench.craft('planterBox');
    expect(h.world.decorating.takeOut('planterBox')).toBe(true);
    h.world.decorating.stop();
    const piece = h.world.home.placed.find((p) => FURNITURE[p.id].planter)!;
    return { h, bed: { zone: 'home', tx: piece.tx, ty: piece.ty } };
  }

  it('is a piece of furniture with a bed in it, which grows like any other', () => {
    const { h, bed } = withPlanter();
    expect(h.world.farm.isBed(bed)).toBe(true);
    expect(h.world.farm.bedsIn('home')).toEqual([bed]);
    grow(h, bed, 'pumpkinSeed');
    expect(tend(h, bed)).toContainEqual(expect.objectContaining({ kind: 'harvested' }));
  });

  it("grows basil a day sooner, as herbs on a windowsill do (0.2's N2)", () => {
    const { h, bed } = withPlanter();
    tend(h, bed);
    expect(h.world.garden.plant(bed, 'basilSeed')).toMatchObject({ kind: 'planted', quick: true });
    expect(h.world.farm.planting(bed)).toMatchObject({ crop: 'basil', quick: true });
  });

  it('carries what grows in it across the room, and gives it back when put away', () => {
    const { h, bed } = withPlanter();
    tend(h, bed);
    h.world.garden.plant(bed, 'pumpkinSeed');
    const piece = h.world.home.placed.find((p) => FURNITURE[p.id].planter)!;
    h.world.decorating.start(piece);
    const to = { tx: bed.tx + 1, ty: bed.ty + 1 };
    expect(h.world.decorating.tap(to.tx, to.ty)).toBe(true);
    const moved = { zone: 'home' as const, tx: piece.tx, ty: piece.ty };
    expect(moved).not.toEqual(bed);
    expect(h.world.farm.planting(moved)?.crop).toBe('pumpkin');
    expect(h.world.farm.planting(bed)).toBeNull();
    const seeds = h.world.bag.count('pumpkinSeed');
    h.world.decorating.start(piece);
    expect(h.world.decorating.putAwaySelected()).toBe(true);
    expect(h.world.farm.bedsIn('home')).toEqual([]);
    expect(h.world.bag.count('pumpkinSeed')).toBe(seeds + 1);
    expect(h.world.save().beds.filter((b) => b.zone === 'home')).toEqual([]);
  });

  it('gives back the seed of a bed a save has that is no longer anywhere', () => {
    const { h, bed } = withPlanter();
    tend(h, bed);
    h.world.garden.plant(bed, 'pumpkinSeed');
    const save = h.world.save();
    const seeds = h.world.bag.count('pumpkinSeed');
    const bare = new World({
      clock: h.clock,
      ...fromSave({
        ...save,
        home: { ...save.home, rooms: { main: { ...save.home.rooms.main, placed: [] } } },
      }),
    });
    expect(bare.farm.bedsIn('home')).toEqual([]);
    expect(bare.bag.count('pumpkinSeed')).toBe(seeds + 1);
  });
});
