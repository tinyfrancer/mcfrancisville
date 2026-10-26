import { describe, expect, it } from 'vitest';
import { PET_GIFTS } from '../../src/data/petGifts';
import { tileAt } from '../../src/systems/grid';
import type { Tile } from '../../src/systems/pathfinding';
import {
  CAW_REACH,
  giftOn,
  GIFT_AFTER_MS,
  PERCH_AFTER_MS,
  PERCH_EVERY_MS,
} from '../../src/systems/delights';
import { pickleAwake } from '../../src/systems/pets';
import type { MapZoneId } from '../../src/types/ids';
import { tileOf, type WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

const of = <K extends WorldEvent['kind']>(events: readonly WorldEvent[], kind: K) =>
  events.filter((e): e is Extract<WorldEvent, { kind: K }> => e.kind === kind);

function at(h: Harness, day: string, hour: number): void {
  const [y, m, d] = day.split('-').map(Number);
  h.clock.set(new Date(y!, m! - 1, d!, hour).getTime());
}

/** Walks her to a tile, and steps the world till she's there. */
function walkTo(h: Harness, t: Tile): WorldEvent[] {
  expect(h.world.tapTile(t.tx, t.ty)).toBe(true);
  return h.until(() => !h.world.movement.walking, `walking to ${t.tx},${t.ty}`).concat(h.tick(1));
}

/** An open tile of lawn a few steps down from where she starts, by her door. */
function awayFromHerDoor(h: Harness): Tile {
  const here = tileOf(h.world.player.x, h.world.player.y);
  const to = [3, 4, 2, 5].map((d) => ({ tx: here.tx, ty: here.ty + d }));
  const open = to.find((t) => h.world.canWalk(t.tx, t.ty));
  expect(open, 'open ground below her door').toBeDefined();
  return open!;
}

/** Steps the world for `ms` of game time. */
const stand = (h: Harness, ms: number) => h.tick(Math.ceil(ms / 16));

describe('a butterfly lands on her hat (1.6’s X5)', () => {
  it('when she has stood still outdoors a while where one is about, and flies off as she moves', () => {
    const h = harness();
    h.tick(1);
    expect(of(stand(h, PERCH_AFTER_MS - 200), 'landed')).toEqual([]);
    const landed = of(stand(h, 400), 'landed');
    expect(landed).toHaveLength(1);
    expect(h.world.delights.perched()).toBe(landed[0]!.critter);
    // Not catchable: no critter came out for it, and her net knows nothing of it.
    expect(h.world.collecting.critters().some((c) => c.key.includes('perch'))).toBe(false);

    const off = walkTo(h, awayFromHerDoor(h));
    expect(of(off, 'flewOff')).toEqual([{ kind: 'flewOff', critter: landed[0]!.critter }]);
    expect(h.world.delights.perched()).toBeNull();
  });

  it('once a minute at most, however often she stands still', () => {
    const h = harness();
    h.tick(1);
    expect(of(stand(h, PERCH_AFTER_MS + 100), 'landed')).toHaveLength(1);
    walkTo(h, awayFromHerDoor(h));
    expect(of(stand(h, PERCH_AFTER_MS * 3), 'landed')).toEqual([]);
    h.clock.advance(PERCH_EVERY_MS);
    expect(of(stand(h, 100), 'landed')).toHaveLength(1);
  });

  it('never indoors', () => {
    const h = harness();
    h.world.travel.home();
    h.tick(2);
    expect(of(stand(h, PERCH_AFTER_MS * 2), 'landed')).toEqual([]);
  });
});

describe('fireflies round her (1.6’s X5)', () => {
  it('on a summer night on the grass, not by day, not in winter, not indoors', () => {
    const h = harness();
    at(h, '2026-07-10', 22);
    h.tick(1);
    const t = tileOf(h.world.player.x, h.world.player.y);
    const map = h.world.zones.map('town').map;
    // On the lawn by her door.
    const lawn = [-1, 1, -2, 2].map((d) => ({ tx: t.tx + d, ty: t.ty + 1 }));
    const grass = lawn.find(
      (g) => tileAt(map, g.tx, g.ty) === 'grass' && h.world.canWalk(g.tx, g.ty),
    );
    expect(grass, 'a tile of lawn by her door').toBeDefined();
    walkTo(h, grass!);
    expect(h.world.delights.fireflies()).toBe(true);
    at(h, '2026-07-10', 12);
    expect(h.world.delights.fireflies()).toBe(false);
    at(h, '2027-01-10', 22);
    expect(h.world.delights.fireflies()).toBe(false);
    at(h, '2026-07-10', 22);
    h.world.travel.home();
    h.tick(2);
    expect(h.world.delights.fireflies()).toBe(false);
  });
});

/** Over to Boo Acres, onto open ground a few steps from the scarecrow. */
function byTheScarecrow(h: Harness): { scarecrow: Tile; near: Tile; far: Tile } {
  h.world.travel.cross({ to: 'booAcres', along: 0 });
  h.tick(2);
  const map = h.world.zones.map('booAcres').map;
  const s = map.props.find((p) => p.id === 'scarecrow')!;
  expect(s, 'the scarecrow at Boo Acres').toBeDefined();
  const ring = (r: number): Tile[] => {
    const tiles: Tile[] = [];
    for (let ty = s.ty - r; ty <= s.ty + r; ty++) {
      for (let tx = s.tx - r; tx <= s.tx + r; tx++) {
        const d = Math.max(Math.abs(tx - s.tx), Math.abs(ty - s.ty));
        if (d === r && h.world.canWalk(tx, ty)) tiles.push({ tx, ty });
      }
    }
    return tiles;
  };
  const near = ring(CAW_REACH)[0];
  const far = [6, 7, 8].flatMap(ring)[0];
  expect(near && far, 'open ground near and far from the scarecrow').toBeTruthy();
  walkTo(h, far!);
  return { scarecrow: s, near: near!, far: far! };
}

describe('the crow on the scarecrow caws (1.6’s X5)', () => {
  it('as she walks past by day, once a window', () => {
    const h = harness();
    at(h, '2026-10-26', 9);
    const { near, far, scarecrow } = byTheScarecrow(h);
    const cawed = of(walkTo(h, near), 'cawed');
    expect(cawed).toEqual([
      { kind: 'cawed', box: { tx: scarecrow.tx, ty: scarecrow.ty, w: 1, h: 1 } },
    ]);
    expect(h.world.delights.cawed()?.place).toBe('booAcres');
    walkTo(h, far);
    expect(of(walkTo(h, near), 'cawed')).toEqual([]);
    // The afternoon's window: again.
    at(h, '2026-10-26', 13);
    walkTo(h, far);
    expect(of(walkTo(h, near), 'cawed')).toHaveLength(1);
  });

  it('not after dark, with the crows gone to roost', () => {
    const h = harness();
    at(h, '2026-10-26', 20);
    const { near } = byTheScarecrow(h);
    expect(of(walkTo(h, near), 'cawed')).toEqual([]);
  });
});

/** A run of open meadow or long grass at least `n` tiles long, in a row, in a place. */
function tickleRun(h: Harness, place: MapZoneId, n: number): Tile[] | null {
  const map = h.world.zones.map(place).map;
  const tickly = (tx: number, ty: number) => {
    const t = tileAt(map, tx, ty);
    return (t === 'meadow' || t === 'longGrass') && h.world.zones.map(place).canWalk(tx, ty);
  };
  for (let ty = 0; ty < map.height; ty++) {
    let run: Tile[] = [];
    for (let tx = 0; tx < map.width; tx++) {
      if (tickly(tx, ty)) run.push({ tx, ty });
      else run = [];
      if (run.length >= n) return run;
    }
  }
  return null;
}

describe('a sneeze in the long grass (1.6’s X5)', () => {
  it('in spring, once a window, stopping her a moment on her way', () => {
    const h = harness();
    at(h, '2027-04-15', 9);
    h.tick(1);
    const place = (['town', 'castleHill', 'booAcres', 'whisperwood'] as const).find(
      (p) => tickleRun(h, p, 6) !== null,
    );
    expect(place, 'a long run of meadow somewhere').toBeDefined();
    if (place !== 'town') h.world.travel.cross({ to: place!, along: 0 });
    h.tick(2);
    const run = tickleRun(h, place!, 6)!;
    walkTo(h, run[0]!);
    let events: WorldEvent[] = [];
    for (let i = 0; i < 2; i++) events = events.concat(walkTo(h, run.at(-1)!), walkTo(h, run[0]!));
    const sneezes = of(events, 'sneezed');
    expect(sneezes).toHaveLength(1);
    // She got where she was going all the same.
    const t = tileOf(h.world.player.x, h.world.player.y);
    expect(t).toEqual(run[0]);
    // Not again this window, however far she walks.
    expect(of(walkTo(h, run.at(-1)!).concat(walkTo(h, run[0]!)), 'sneezed')).toEqual([]);
  });

  it('never out of spring', () => {
    const h = harness();
    at(h, '2027-07-15', 9);
    h.tick(1);
    const place = (['town', 'castleHill', 'booAcres', 'whisperwood'] as const).find(
      (p) => tickleRun(h, p, 6) !== null,
    )!;
    if (place !== 'town') h.world.travel.cross({ to: place, along: 0 });
    h.tick(2);
    const run = tickleRun(h, place, 6)!;
    walkTo(h, run[0]!);
    let events: WorldEvent[] = [];
    for (let i = 0; i < 2; i++) events = events.concat(walkTo(h, run.at(-1)!), walkTo(h, run[0]!));
    expect(of(events, 'sneezed')).toEqual([]);
  });

  it('is blessed by a neighbour close by, in their own words', () => {
    const h = harness();
    at(h, '2027-04-15', 9);
    h.tick(1);
    const place = (['town', 'castleHill', 'booAcres', 'whisperwood'] as const).find(
      (p) => tickleRun(h, p, 6) !== null,
    )!;
    if (place !== 'town') h.world.travel.cross({ to: place, along: 0 });
    h.tick(2);
    const run = tickleRun(h, place, 6)!;
    walkTo(h, run[0]!);
    const n = h.world.neighbourhood.neighbour('maude');
    n.zone = place;
    let events: WorldEvent[] = [];
    for (let i = 0; i < 6 && of(events, 'sneezed').length === 0; i++) {
      const to = i % 2 === 0 ? run.at(-1)! : run[0]!;
      expect(h.world.tapTile(to.tx, to.ty)).toBe(true);
      events = h.until(() => {
        // Maude keeps beside her as she goes, for the test.
        const her = tileOf(h.world.player.x, h.world.player.y);
        n.place({ tx: her.tx, ty: her.ty + 1 });
        return !h.world.movement.walking;
      }, 'walking the meadow');
    }
    const sneezed = of(events, 'sneezed');
    expect(sneezed).toHaveLength(1);
    expect(sneezed[0]!.by).toBe('maude');
    expect(sneezed[0]!.line).toMatch(/^Bless you/);
  });
});

describe('her pets at the door (1.6’s X5)', () => {
  it('trot over to say hello when she comes home, and go once round her', () => {
    const h = harness();
    at(h, '2026-10-26', 12);
    h.tick(1);
    h.world.travel.home();
    const events = stand(h, 6000);
    const greeted = of(events, 'greeted').map((e) => e.pet);
    expect(greeted).toContain('fibi');
    expect(greeted).toContain('dolly');
    // Gary beams from where he is, and Pickle sleeps through it by day.
    expect(greeted).not.toContain('gary');
    expect(pickleAwake(h.clock.now())).toBe(false);
    expect(greeted).not.toContain('pickle');
    for (const id of greeted) expect(h.world.petCare.pet(id).comingOver).not.toBe('greet');
  });

  it('Pickle, up at night, plays dead at her feet by way of hello', () => {
    const h = harness();
    at(h, '2026-10-26', 22);
    h.tick(1);
    h.world.travel.home();
    const pickle = h.world.petCare.pet('pickle');
    let dead = false;
    const events = h.until(() => {
      dead ||= pickle.pose === 'playDead';
      return dead;
    }, 'Pickle playing dead');
    expect(of(events, 'greeted').map((e) => e.pet)).toContain('pickle');
  });
});

describe('Fibi’s gift (1.6’s X5)', () => {
  it('once a day at home, something of no use to anyone, never in her bag', () => {
    const h = harness();
    at(h, '2026-10-26', 12);
    h.tick(1);
    h.world.travel.home();
    const bag = JSON.stringify(h.world.bag.contents);
    const events = stand(h, GIFT_AFTER_MS + 8000);
    const gifts = of(events, 'petGift');
    expect(gifts).toHaveLength(1);
    const gift = giftOn('2026-10-26');
    expect(gifts[0]).toMatchObject({ pet: 'fibi', gift });
    expect(gifts[0]!.line).toBe(PET_GIFTS[gift].line.replace('{name}', 'Fibi'));
    expect(JSON.stringify(h.world.bag.contents)).toBe(bag);

    // Out and home again the same day: nothing more.
    h.world.travel.back();
    h.tick(2);
    h.world.travel.home();
    expect(of(stand(h, GIFT_AFTER_MS + 8000), 'petGift')).toEqual([]);

    // The next day, again.
    at(h, '2026-10-27', 12);
    h.world.travel.back();
    h.tick(2);
    h.world.travel.home();
    expect(of(stand(h, GIFT_AFTER_MS + 8000), 'petGift')).toHaveLength(1);
  });
});
