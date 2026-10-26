import { describe, expect, it } from 'vitest';
import { SNOWMAN_IDS } from '../../src/data/snow';
import { RAINBOW_MS, THROW_BACK_MS } from '../../src/data/snow';
import { shiftDay } from '../../src/systems/calendar';
import { chatOn } from '../../src/systems/neighbourLife';
import { hatOf, rainbowDay } from '../../src/systems/snow';
import { weatherOn } from '../../src/systems/weather';
import type { Tile } from '../../src/systems/pathfinding';
import { tileOf, type WorldEvent } from '../../src/world/World';
import { harness } from './harness';

type H = ReturnType<typeof harness>;

const here = (h: H) => tileOf(h.world.player.x, h.world.player.y);

/** A day's key at an hour on the harness's clock. */
function at(h: H, day: string, hour = 12): void {
  const [y, m, d] = day.split('-').map(Number);
  h.clock.set(new Date(y!, m! - 1, d!, hour).getTime());
}

/** A tile of her lawn with lawn below it, both open: she stands on one, the snowball rolls on the other. */
function lawnPair(h: H): { stand: Tile; below: Tile } {
  const lawn = h.world.yard.lawn();
  const has = (tx: number, ty: number) => lawn.some((t) => t.tx === tx && t.ty === ty);
  const ok = (tx: number, ty: number) => has(tx, ty) && h.world.canWalk(tx, ty);
  const stand = lawn.find((t) => ok(t.tx, t.ty) && ok(t.tx, t.ty + 1) && ok(t.tx, t.ty + 2));
  expect(stand, 'a stretch of open lawn in her yard').toBeDefined();
  return { stand: stand!, below: { tx: stand!.tx, ty: stand!.ty + 1 } };
}

function walkOnto(h: H, t: Tile): WorldEvent[] {
  expect(h.world.tapTile(t.tx, t.ty)).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${t.tx},${t.ty}`).concat(h.tick(1));
}

/** Her on her lawn on a winter's day, facing down at more lawn, her hands empty. */
function onTheSnow(day = '2027-01-15'): { h: H; stand: Tile; below: Tile } {
  const h = harness();
  at(h, day);
  h.tick(1);
  const { stand, below } = lawnPair(h);
  walkOnto(h, stand);
  h.world.player.facing = 'down';
  return { h, stand, below };
}

const kinds = (events: readonly WorldEvent[]) => events.map((e) => e.kind);

describe('a snowman in her yard (1.6’s X4)', () => {
  it('rolls a snowball beside her at a tap on herself, bigger at the next, and stands him up at the third', () => {
    const { h, stand, below } = onTheSnow();
    expect(h.world.tapTile(stand.tx, stand.ty)).toBe(true);
    const rolled = h.tick(1);
    expect(rolled).toContainEqual({ kind: 'snowball', did: 'rolled', ...below });
    expect(h.world.yard.snowball).toEqual({ ...below, size: 1 });
    // Solid: nobody walks through a snowball.
    expect(h.world.canWalk(below.tx, below.ty)).toBe(false);

    expect(h.world.tapTile(below.tx, below.ty)).toBe(true);
    const grew = h.tick(2);
    expect(grew).toContainEqual({ kind: 'snowball', did: 'grew', ...below });
    expect(h.world.yard.snowball?.size).toBe(2);

    expect(h.world.tapTile(below.tx, below.ty)).toBe(true);
    const built = h.tick(2);
    const snowman = hatOf(below.tx, below.ty);
    expect(built).toContainEqual({ kind: 'snowman', snowman, ...below });
    expect(h.world.yard.snowball).toBeNull();
    expect(h.world.yard.pieceAt(below.tx, below.ty)?.id).toBe(snowman);
    // A piece of hers like any: saved with the yard.
    expect(h.world.save().yard?.placed.some((p) => p.id === snowman)).toBe(true);
  });

  it('deals each tile its hat, all three about the town', () => {
    const hats = new Set<string>();
    for (let tx = 0; tx < 12; tx++) for (let ty = 0; ty < 12; ty++) hats.add(hatOf(tx, ty));
    expect([...hats].sort()).toEqual([...SNOWMAN_IDS].sort());
    expect(hatOf(3, 4)).toBe(hatOf(3, 4));
  });

  it('rolls nothing out of winter, nor with something in her hands', () => {
    const autumn = onTheSnow('2026-10-20');
    autumn.h.world.tapTile(autumn.stand.tx, autumn.stand.ty);
    expect(kinds(autumn.h.tick(2))).not.toContain('snowball');
    expect(autumn.h.world.yard.snowball).toBeNull();

    const { h, stand } = onTheSnow();
    expect(h.world.hands.hold('net')).toBe(true);
    h.world.tapTile(stand.tx, stand.ty);
    const events = h.tick(2);
    expect(kinds(events)).not.toContain('snowball');
    expect(kinds(events)).not.toContain('threw');
    expect(h.world.yard.snowball).toBeNull();
  });

  it('keeps a snowman out in the cold: the chest takes him, a room never does', () => {
    const h = harness();
    at(h, '2027-01-15');
    h.world.home.store('snowmanWitch');
    expect(h.world.home.rooms.refusesHere('snowmanWitch')).toBe('melts');
    expect(h.world.home.rooms.takeOut('snowmanWitch', { tx: 3, ty: 4 }, null)).toBeNull();
    expect(h.world.home.stored.some((s) => s.id === 'snowmanWitch')).toBe(true);
    expect(h.world.yard.refusesHere('snowmanWitch')).toBeNull();
  });

  it('sweeps her snowmen in at the thaw, out of the yard and the chest, a keepsake each', () => {
    const { h, stand, below } = onTheSnow('2027-02-27');
    h.world.tapTile(stand.tx, stand.ty);
    h.tick(1);
    for (let i = 0; i < 2; i++) {
      h.world.tapTile(below.tx, below.ty);
      h.tick(2);
    }
    expect(h.world.yard.placed.some((p) => SNOWMAN_IDS.includes(p.id as never))).toBe(true);
    h.world.home.store('snowmanBobble');
    // Still winter tomorrow, the last of February: nothing melts.
    at(h, '2027-02-28');
    expect(kinds(h.tick(2))).not.toContain('thawed');
    // The first of March: the thaw.
    at(h, '2027-03-01');
    const thawed = h.tick(2);
    expect(thawed).toContainEqual({ kind: 'thawed', count: 2 });
    expect(h.world.bag.count('meltlessSnowman')).toBe(2);
    expect(h.world.yard.placed.some((p) => SNOWMAN_IDS.includes(p.id as never))).toBe(false);
    expect(h.world.home.stored.some((s) => SNOWMAN_IDS.includes(s.id as never))).toBe(false);
    // Once.
    expect(kinds(h.tick(2))).not.toContain('thawed');
  });
});

describe('snowballs (1.6’s X4)', () => {
  it('are thrown out of her yard, the way she faces, with nobody about', () => {
    const h = harness();
    at(h, '2027-01-15', 7);
    h.tick(1);
    const lawn = (tx: number, ty: number) =>
      h.world.canWalk(tx, ty) &&
      !h.world.yard.contains(tx, ty) &&
      h.world.snow.underfoot({ tx, ty });
    let spot: Tile | null = null;
    for (let ty = 20; ty < 45 && !spot; ty++) {
      for (let tx = 2; tx < 38 && !spot; tx++) if (lawn(tx, ty)) spot = { tx, ty };
    }
    expect(spot).not.toBeNull();
    walkOnto(h, spot!);
    const alone = h.world.neighbourhood
      .neighboursIn('town')
      .every((n) => Math.hypot(n.tile.tx - spot!.tx, n.tile.ty - spot!.ty) > 4);
    h.world.player.facing = 'left';
    expect(h.world.tapTile(spot!.tx, spot!.ty)).toBe(true);
    const threw = h.tick(1).find((e) => e.kind === 'threw');
    expect(threw).toBeDefined();
    if (alone)
      expect(threw).toEqual({ kind: 'threw', by: 'her', at: { tx: spot!.tx - 3, ty: spot!.ty } });
  });

  it('thrown at a neighbour come back, gently, and they laugh', () => {
    const h = harness();
    at(h, '2027-01-15');
    h.tick(1);
    // Beside whoever's standing on the snow in town, on lawn of their own.
    const found = h.world.neighbourhood.neighboursIn('town').flatMap((n) => {
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, 1],
      ] as const) {
        const t = { tx: n.tile.tx + dx, ty: n.tile.ty + dy };
        if (h.world.canWalk(t.tx, t.ty) && h.world.snow.underfoot(t)) return [{ n, t }];
      }
      return [];
    })[0];
    expect(found, 'a neighbour on the snow').toBeDefined();
    const { n, t } = found!;
    h.world.movement.standAt(t, 'down');
    expect(h.world.tapTile(t.tx, t.ty)).toBe(true);
    const threw = h.tick(1).find((e) => e.kind === 'threw');
    expect(threw?.kind === 'threw' && threw.by).toBe('her');
    const target = threw?.kind === 'threw' ? threw.at : null;
    expect(target && 'villager' in target).toBe(true);
    const at2 = target && 'villager' in target ? target.villager : n.id;
    expect(h.world.snow.feelingOf(at2)).toBe('laugh');
    h.clock.advance(THROW_BACK_MS);
    const back = h.tick(1);
    expect(back).toContainEqual({ kind: 'threw', by: at2, at: { her: true } });
  });

  it('fly between two neighbours together now and then in the snow, never out of it', () => {
    const pair = ['maude', 'rufus'] as const;
    const beats = Array.from({ length: 200 }, (_, beat) => beat);
    const snowy = beats.filter((b) => chatOn(pair, b, true)?.chat === 'snowball').length;
    expect(snowy).toBeGreaterThan(20);
    expect(snowy).toBeLessThan(90);
    expect(beats.some((b) => chatOn(pair, b, false)?.chat === 'snowball')).toBe(false);
  });
});

describe('a rainbow after the rain (1.6’s X4)', () => {
  /** The first sunny day after a rainy one, out of winter, from a day on. */
  function rainbowAfter(from: string): string {
    let day = from;
    for (let i = 0; i < 400; i++, day = shiftDay(day, 1)) if (rainbowDay(day)) return day;
    throw new Error('no rainbow in a year');
  }

  it('comes on a sunny day after a rainy one, never in winter', () => {
    const day = rainbowAfter('2027-04-01');
    expect(weatherOn(day)).toBe('clear');
    expect(weatherOn(shiftDay(day, -1))).toBe('rain');
    for (let d = '2027-12-01'; d < '2028-03-01'; d = shiftDay(d, 1)) {
      expect(rainbowDay(d), d).toBe(d === '2027-12-01' && weatherOn('2027-11-30') === 'rain');
    }
  });

  it('is up the first ten minutes she is out under it, with a jar of it the first time', () => {
    const day = rainbowAfter('2027-04-01');
    const h = harness();
    at(h, day, 10);
    const first = h.tick(1);
    expect(first).toContainEqual({ kind: 'rainbow', first: true });
    expect(h.world.bag.count('rainbowJar')).toBe(1);
    expect(h.world.weather.rainbow()).toBe(0);
    expect(h.world.upNow.lines().some((l) => l.kind === 'rainbow')).toBe(true);
    h.clock.advance(RAINBOW_MS / 2);
    h.tick(1);
    expect(h.world.weather.rainbow()).toBeCloseTo(0.5);
    h.clock.advance(RAINBOW_MS / 2);
    h.tick(1);
    expect(h.world.weather.rainbow()).toBeNull();
    expect(h.world.upNow.lines().some((l) => l.kind === 'rainbow')).toBe(false);
    // The next rainbow day: a rainbow, and no second jar.
    const next = rainbowAfter(shiftDay(day, 1));
    at(h, next, 10);
    expect(h.tick(1)).toContainEqual({ kind: 'rainbow', first: false });
    expect(h.world.bag.count('rainbowJar')).toBe(1);
  });

  it('waits for the sun to be up, and for her to be outdoors', () => {
    const day = rainbowAfter('2027-04-01');
    const h = harness();
    at(h, day, 5);
    expect(kinds(h.tick(1))).not.toContain('rainbow');
    expect(h.world.weather.rainbow()).toBeNull();
    at(h, day, 8);
    expect(kinds(h.tick(1))).toContain('rainbow');
  });
});

describe('her snowball in the way (1.6’s X4)', () => {
  it('stands where she is not, on her lawn, and only one at a time', () => {
    const { h, stand, below } = onTheSnow();
    expect(here(h)).toEqual(stand);
    expect(h.world.yard.rollSnowball(stand, stand)).toBe(false);
    expect(h.world.yard.rollSnowball(below, stand)).toBe(true);
    expect(h.world.yard.rollSnowball({ tx: below.tx, ty: below.ty + 1 }, stand)).toBe(true);
    expect(h.world.yard.snowball).toEqual({ tx: below.tx, ty: below.ty + 1, size: 1 });
    expect(h.world.canWalk(below.tx, below.ty)).toBe(true);
  });
});
