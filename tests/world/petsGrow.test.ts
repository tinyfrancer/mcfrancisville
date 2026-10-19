import { describe, expect, it } from 'vitest';
import { FONDNESS, LEVEL_AT, TRICKS, WALK_TILES } from '../../src/data/affection';
import { CRITTERS } from '../../src/data/critters';
import { isKept } from '../../src/data/items';
import { PETS } from '../../src/data/pets';
import { eventToast } from '../../src/hud/messages';
import { windowKey } from '../../src/systems/clock';
import { smallEventOf } from '../../src/systems/smallEvents';
import type { PetId } from '../../src/types/ids';
import { tileOf, type WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/**
 * Pets that grow (V1's R6c, decision 317): fondness from pats, walks and treats, capped a day;
 * a level that changes what each does; their jobs on walks, their tricks, and where they rest.
 */

const reach = (a: { tx: number; ty: number }, b: { tx: number; ty: number }) =>
  Math.max(Math.abs(a.tx - b.tx), Math.abs(a.ty - b.ty));
const here = (h: Harness) => tileOf(h.world.player.x, h.world.player.y);

function run(h: Harness, ms: number, step = 16): WorldEvent[] {
  const events: WorldEvent[] = [];
  for (let t = 0; t < ms; t += step) {
    h.clock.advance(step);
    events.push(...h.world.update(step));
  }
  return events;
}

function goHome(h: Harness): void {
  const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
  h.world.tapTile(house.tx + 1, house.ty + 1);
  h.until(() => h.world.scene === 'home', 'going in');
}

function goOut(h: Harness): void {
  const mat = h.world.home.room.mat;
  h.world.tapTile(mat.tx, mat.ty);
  h.until(() => h.world.scene === 'town', 'going out');
}

function walkWith(h: Harness, id: PetId, points = 0): void {
  h.world.pets.setPoints(id, points);
  goHome(h);
  h.world.petCare.walkWith(id);
  goOut(h);
}

/**
 * Walks her to an open tile `far` tiles from `of`, one she can get to: what happened on the way,
 * or null if there's none.
 */
function standNear(h: Harness, of: { tx: number; ty: number }, far: number): WorldEvent[] | null {
  const zone = h.world.zone;
  for (let dy = -far; dy <= far; dy++) {
    for (let dx = -far; dx <= far; dx++) {
      const t = { tx: of.tx + dx, ty: of.ty + dy };
      if (reach(t, of) !== far || !zone.canWalk(t.tx, t.ty)) continue;
      if (!h.world.tapTile(t.tx, t.ty)) continue;
      return h.until(() => !h.world.player.moving, `walking to ${t.tx},${t.ty}`);
    }
  }
  return null;
}

describe('fondness', () => {
  it('grows with pats, up to three a day, and on the next day again', () => {
    const h = harness();
    for (let i = 0; i < 10; i++) h.world.petCare.patPet('gary');
    expect(h.world.pets.points('gary')).toBe(FONDNESS.pat.perDay);
    h.clock.advance(24 * 3600_000);
    h.world.petCare.patPet('gary');
    expect(h.world.pets.points('gary')).toBe(FONDNESS.pat.perDay + 1);
    // Each pet's is its own.
    expect(h.world.pets.points('fibi')).toBe(0);
  });

  it('grows with walks outdoors, a point every so many tiles, four a day', () => {
    const h = harness();
    walkWith(h, 'dolly');
    const start = here(h);
    // Back and forth along the road until the day's walk is all counted.
    for (let i = 0; i < 40 && h.world.pets.fondness('dolly').walk < FONDNESS.walk.perDay; i++) {
      const to = i % 2 === 0 ? { tx: start.tx + 8, ty: start.ty + 3 } : start;
      h.world.tapTile(to.tx, to.ty);
      h.until(() => !h.world.player.moving, 'walking');
    }
    expect(h.world.pets.fondness('dolly').walk).toBe(FONDNESS.walk.perDay);
    const points = h.world.pets.points('dolly');
    for (let i = 0; i < 4; i++) {
      h.world.tapTile(start.tx + (i % 2) * 8, start.ty + (i % 2) * 3);
      h.until(() => !h.world.player.moving, 'walking on');
    }
    expect(h.world.pets.points('dolly')).toBe(points);
    expect(WALK_TILES).toBeGreaterThan(10);
  });

  it('grows with a treat from her bag, once a day, and never a kept thing', () => {
    const h = harness();
    for (const s of [...h.world.bag.contents]) {
      if (!isKept(s.id)) h.world.bag.remove(s.id, s.count);
    }
    expect(h.world.petCare.canTreat('fibi')).toBe(false);
    expect(h.world.petCare.treat('fibi')).toBeNull();
    h.world.bag.add('midnightPizza', 2);
    expect(h.world.petCare.canTreat('fibi')).toBe(true);
    expect(h.world.petCare.treat('fibi')).toContain('Fibi');
    expect(h.world.bag.count('midnightPizza')).toBe(1);
    expect(h.world.pets.points('fibi')).toBe(FONDNESS.treat.points);
    expect(h.world.petCare.canTreat('fibi')).toBe(false);
    expect(h.world.petCare.treat('fibi')).toBeNull();
    expect(h.world.bag.count('midnightPizza')).toBe(1);
    // Another pet can have one the same day.
    expect(h.world.petCare.treat('gary')).toContain('Gary');
    expect(h.world.bag.count('midnightPizza')).toBe(0);
  });

  it('reaches a level with a moment, and new pat lines come with it', () => {
    const h = harness();
    const before = new Set(PETS.wybie.pats.map((l) => l.replaceAll('{name}', 'Wybie')));
    h.world.pets.setPoints('wybie', LEVEL_AT[1] - 2);
    expect(before.has(h.world.petCare.patPet('wybie'))).toBe(true);
    expect(h.world.pets.level('wybie')).toBe(0);
    // The pat that reaches the level is said in its new lines straight away.
    expect(before.has(h.world.petCare.patPet('wybie'))).toBe(false);
    expect(h.world.pets.level('wybie')).toBe(1);
    expect(h.tick(1)).toContainEqual(
      expect.objectContaining({ kind: 'petGrew', pet: 'wybie', level: 1 }),
    );
  });

  it('is kept in the save, and never goes down', () => {
    const h = harness();
    h.world.pets.setPoints('elvira', 33);
    h.world.petCare.patPet('elvira');
    const saved = h.world.save().pets;
    expect(saved.affection.elvira?.points).toBe(34);
    const again = harness(undefined, { pets: saved });
    expect(again.world.pets.points('elvira')).toBe(34);
    expect(again.world.pets.level('elvira')).toBe(1);
    again.clock.advance(30 * 24 * 3600_000);
    expect(again.world.pets.points('elvira')).toBe(34);
  });
});

describe('a trick', () => {
  it('is learnt at level two, done on the sheet and over in its time', () => {
    const h = harness();
    expect(h.world.petCare.trick('dolly')).toBeNull();
    h.world.pets.setPoints('dolly', LEVEL_AT[2]);
    goHome(h);
    expect(h.world.petCare.trick('dolly')).toContain('spins');
    const dolly = h.world.petCare.pet('dolly');
    expect(dolly.pose).toBe('trick');
    expect(h.tick(1)).toContainEqual(expect.objectContaining({ kind: 'petTrick', pet: 'dolly' }));
    run(h, 200);
    expect(dolly.pose).toBe('trick');
    run(h, TRICKS.dolly.ms);
    expect(dolly.pose).not.toBe('trick');
  });

  it('is shown off now and then on its own, once known, while she stands by', () => {
    const shown = (points: number) => {
      const h = harness();
      walkWith(h, 'fibi', points);
      const events = run(h, 6 * 40_000, 100);
      return events.some((e) => e.kind === 'petTrick' && e.own);
    };
    expect(shown(LEVEL_AT[2])).toBe(true);
    expect(shown(LEVEL_AT[1])).toBe(false);
  }, 30_000);

  it('asked for, says what it does as a toast, since its sheet is down first (1.0.1)', () => {
    const h = harness();
    h.world.pets.setPoints('dolly', LEVEL_AT[2]);
    goHome(h);
    const line = h.world.petCare.trick('dolly')!;
    const trick = h.tick(1).find((e) => e.kind === 'petTrick');
    expect(trick).toMatchObject({ pet: 'dolly', line });
    expect(eventToast(trick!)?.text).toBe(line);
    // One done on its own is only seen.
    expect(eventToast({ kind: 'petTrick', pet: 'dolly', at: { x: 0, y: 0 }, own: true })).toBeNull();
  });
});

describe('jobs on walks', () => {
  it("Fibi, fond enough, goes and sits by the day's mound when she's near it", () => {
    const sniffs = (points: number) => {
      const h = harness();
      walkWith(h, 'fibi', points);
      const mound = h.world.fossils.mound('town')!;
      expect(standNear(h, mound, 4)).not.toBeNull();
      const events = run(h, 4000);
      return { h, events, near: reach(h.world.petCare.pet('fibi').tile, mound), mound };
    };
    const fond = sniffs(LEVEL_AT[1]);
    expect(fond.near).toBe(1);
    expect(fond.events).toContainEqual(
      expect.objectContaining({ kind: 'petHelped', pet: 'fibi', job: 'sniff' }),
    );
    // Once a day in a place, however long she waits.
    expect(run(fond.h, 4000).some((e) => e.kind === 'petHelped')).toBe(false);
    const not = sniffs(0);
    expect(not.near).toBeGreaterThan(1);
    expect(not.events.some((e) => e.kind === 'petHelped')).toBe(false);
  });

  it('Dolly barks a shy critter out, and it settles: her net has it first time', () => {
    const h = harness();
    // A day and an hour with a shy critter out in town, near enough to walk to.
    let shy: ReturnType<typeof h.world.collecting.critters>[number] | undefined;
    for (let d = 0; d < 40 && !shy; d++) {
      for (const hour of [21, 22, 23, 10, 14]) {
        h.clock.set(new Date(2026, 8, 26 + d, hour, 5));
        shy = h.world.collecting
          .critters('town')
          .find((c) => CRITTERS[c.critter].wary > 0 && CRITTERS[c.critter].family !== 'fish');
        if (shy) break;
      }
    }
    expect(shy).toBeDefined();
    walkWith(h, 'dolly', LEVEL_AT[1]);
    // She barks it out as they come near, before they've even stopped.
    const barked = standNear(h, shy!, 3);
    expect(barked).not.toBeNull();
    expect(barked!.concat(h.tick(2))).toContainEqual(
      expect.objectContaining({ kind: 'petHelped', pet: 'dolly', job: 'bark' }),
    );
    expect(h.world.petCare.calmed(shy!.key)).toBe(true);
    h.world.tapTile(shy!.tx, shy!.ty);
    const events = h.until(() => !h.world.player.moving, 'walking up to it').concat(h.tick(2));
    expect(events).toContainEqual(
      expect.objectContaining({ kind: 'caught', critter: shy!.critter }),
    );
    expect(events.some((e) => e.kind === 'fled')).toBe(false);
  });

  it('Elvira draws an orb a tile nearer, and that is where it is', () => {
    const h = harness();
    let orb: ReturnType<typeof h.world.collecting.critters>[number] | undefined;
    for (let d = 0; d < 40 && !orb; d++) {
      for (const hour of [21, 22, 23, 0, 1]) {
        h.clock.set(new Date(2026, 8, 26 + d, hour, 5));
        orb = h.world.collecting
          .critters('town')
          .find(
            (c) => CRITTERS[c.critter].family === 'orb' && !h.world.collecting.isShy(c.critter),
          );
        if (orb) break;
      }
    }
    expect(orb).toBeDefined();
    walkWith(h, 'elvira', LEVEL_AT[1]);
    const events = standNear(h, orb!, 4)!.concat(run(h, 1000));
    expect(events).toContainEqual(
      expect.objectContaining({ kind: 'petHelped', pet: 'elvira', job: 'draw' }),
    );
    const now = h.world.collecting.critters('town').find((c) => c.key === orb!.key)!;
    expect(h.world.petCare.drawnTo(orb!.key)).toEqual({ tx: now.tx, ty: now.ty });
    expect(reach(now, orb!)).toBe(1);
  });

  it('Wybie fetches something a neighbour dropped, as though she found it', () => {
    let at: Date | null = null;
    for (let day = 26; day < 60 && !at; day++) {
      for (const hour of [8, 13, 19]) {
        const when = new Date(2026, 8, day, hour);
        if (smallEventOf(windowKey(when.getTime())).kind === 'lost') {
          at = when;
          break;
        }
      }
    }
    const h = harness();
    h.clock.set(at!);
    walkWith(h, 'wybie', LEVEL_AT[1]);
    const lying = h.world.smallEvents.lying()!;
    expect(lying).not.toBeNull();
    expect(standNear(h, lying.at, 5)).not.toBeNull();
    const events = run(h, 6000);
    expect(events).toContainEqual(expect.objectContaining({ kind: 'foundLost', lost: lying.lost }));
    expect(events).toContainEqual(expect.objectContaining({ kind: 'petHelped', job: 'fetch' }));
    expect(h.world.smallEvents.errand).toBe(lying.lost);
    expect(reach(h.world.petCare.pet('wybie').tile, here(h))).toBeLessThanOrEqual(1);
  });

  it('Gary naps in his shell on walks once he is fond enough: his job', () => {
    const naps = (points: number) => {
      const h = harness();
      walkWith(h, 'gary', points);
      run(h, 30_000);
      return h.world.petCare.pet('gary').pose;
    };
    expect(naps(LEVEL_AT[1])).toBe('sleep');
    expect(naps(0)).not.toBe('sleep');
  });
});

describe('at home', () => {
  it('each rests somewhere it likes in the room, up on the bed or on the rug', () => {
    const h = harness();
    goHome(h);
    const florence = h.world.petCare.restOf('florence');
    expect(florence?.kind).toBe('bed');
    expect(florence?.perch?.lift).toBeGreaterThan(0);
    expect(h.world.petCare.restOf('fibi')?.kind).toBe('rug');
    // Never two on one spot.
    const held = ['florence', 'fibi', 'dolly', 'gary', 'wybie', 'elvira']
      .map((id) => h.world.petCare.restOf(id as PetId))
      .filter((s) => s !== null)
      .map((s) => JSON.stringify(s!.perch?.tile ?? s!.floor));
    expect(new Set(held).size).toBe(held.length);
  });

  it('go and settle there now and then, and hop up onto the bed', () => {
    const h = harness();
    goHome(h);
    let perched = false;
    for (let t = 0; t < 120_000 && !perched; t += 1000) {
      run(h, 1000);
      perched = h.world.petCare.all.some((p) => p.scene === 'home' && p.perch !== null);
    }
    expect(perched).toBe(true);
  });

  it('sit facing her: their backs to her when she is further up the room', () => {
    const h = harness();
    walkWith(h, 'dolly');
    const start = here(h);
    h.world.tapTile(start.tx + 6, start.ty + 3);
    h.until(() => !h.world.player.moving, 'walking out');
    h.world.tapTile(start.tx + 6, start.ty + 6);
    h.until(() => !h.world.player.moving, 'walking south');
    expect(h.world.player.facing).toBe('down');
    run(h, 1500);
    const dolly = h.world.petCare.pet('dolly');
    expect(dolly.pose).toBe('sit');
    expect(dolly.tile.ty).toBeLessThan(here(h).ty);
    expect(dolly.looking).toBe('front');
    h.world.tapTile(start.tx + 6, start.ty + 3);
    h.until(() => !h.world.player.moving, 'walking north');
    run(h, 1500);
    expect(h.world.player.facing).toBe('up');
    expect(dolly.pose).toBe('sit');
    expect(dolly.tile.ty).toBeGreaterThan(here(h).ty);
    expect(dolly.looking).toBe('back');
  });
});
