import { describe, expect, it } from 'vitest';
import { DUET, LESSONS, TUNES, tunesOf } from '../../src/data/instruments';
import { happensOn } from '../../src/systems/happenings';
import type { FixtureId, ZoneId } from '../../src/types/ids';
import { fromSave, tileOf, World, type WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Boothoven, moved in long ago, and as close to her as `points` says. */
function withBoothoven(points: number, zone: ZoneId, tx: number, ty: number) {
  return {
    newcomers: { since: '2026-09-01', wrote: { boothoven: '2026-09-01' }, heard: {} },
    friends: {
      friends: { boothoven: { points, talked: null, gifted: null, favour: null } },
    },
    player: { zone, tx, ty, facing: 'up' as const },
  };
}

/** Lets everyone get where they're going this hour. */
function settle(h: Harness) {
  h.tick(2);
  h.until(
    () => h.world.neighbourhood.neighbours.every((n) => !n.moving),
    'everyone to get where they are going',
    180_000,
  );
}

const tunesIn = (events: WorldEvent[]) => events.flatMap((e) => (e.kind === 'tune' ? [e] : []));

function walkTo(h: Harness, tx: number, ty: number): WorldEvent[] {
  expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(2));
}

function hallPiano(h: Harness) {
  const room = h.world.zones.inside('castleHall')!;
  const thing = room.things.find(
    (t) => 'fixture' in t && t.fixture.id === ('hallPiano' as FixtureId),
  )!;
  return 'fixture' in thing ? thing.fixture : thing.piece;
}

describe("Boothoven's lessons (0.2's L2)", () => {
  it('has four lessons and a duet, none known from the start', () => {
    expect(LESSONS).toHaveLength(4);
    expect(TUNES[DUET].learnt).toBe('duet');
    for (const id of [...LESSONS, DUET]) {
      expect(TUNES[id].instrument, id).toBe('piano');
      expect(TUNES[id].taught, id).toContain('{name}');
      expect(tunesOf('piano'), id).not.toContain(id);
    }
  });

  it('teaches her a tune a day in his parlour once they are friends, every piano playing it after', () => {
    // A Tuesday morning: he's composing in his parlour.
    const h = harness(undefined, withBoothoven(300, 'boothovenParlour', 4, 7));
    h.clock.set(new Date(2026, 9, 6, 9));
    settle(h);
    expect(h.world.neighbourhood.neighbour('boothoven').zone).toBe('boothovenParlour');
    expect(h.world.instruments.canLearn('boothoven')).toBe(true);
    expect(h.world.instruments.canLearn('maude')).toBe(false);

    const points = h.world.friends.of('boothoven').points;
    const lesson = h.world.instruments.learn('boothoven');
    expect(lesson?.tune).toBe(LESSONS[0]);
    expect(lesson!.line).not.toContain('{name}');
    expect(h.world.friends.of('boothoven').points).toBeGreaterThan(points);
    expect(tunesIn(h.tick(1))).toContainEqual(expect.objectContaining({ tune: LESSONS[0] }));
    expect(h.world.instruments.learnt).toEqual([LESSONS[0]]);
    expect(tunesOf('piano', h.world.instruments.learnt)).toContain(LESSONS[0]);

    // Once a day.
    expect(h.world.instruments.learn('boothoven')).toBeNull();
    h.clock.set(new Date(2026, 9, 7, 9));
    settle(h);
    expect(h.world.instruments.learn('boothoven')?.tune).toBe(LESSONS[1]);

    // Saved, and loaded.
    expect(h.world.save().tunes).toEqual([LESSONS[0], LESSONS[1]]);
    const again = new World({ ...fromSave(h.world.save()), clock: h.clock });
    expect(again.instruments.learnt).toEqual([LESSONS[0], LESSONS[1]]);
    expect(again.instruments.nextLesson()).toBe(LESSONS[2]);
  });

  it('waits until they are friends, and for him to be home', () => {
    const h = harness(undefined, withBoothoven(250, 'boothovenParlour', 4, 7));
    h.clock.set(new Date(2026, 9, 6, 9));
    settle(h);
    expect(h.world.instruments.canLearn('boothoven')).toBe(false);

    // At noon he's out by the salon.
    const out = harness(undefined, withBoothoven(300, 'boothovenParlour', 4, 7));
    out.clock.set(new Date(2026, 9, 6, 13));
    settle(out);
    expect(out.world.instruments.canLearn('boothoven')).toBe(false);
  });

  it('has nothing more to teach once she knows them all', () => {
    const h = harness(undefined, {
      ...withBoothoven(1000, 'boothovenParlour', 4, 7),
      tunes: [...LESSONS],
    });
    h.clock.set(new Date(2026, 9, 6, 9));
    settle(h);
    expect(h.world.instruments.nextLesson()).toBeNull();
    expect(h.world.instruments.canLearn('boothoven')).toBe(false);
  });

  it('plays their duet at the castle hall on her anniversary, once they are close', () => {
    expect(happensOn('anniversaryDuet', '2027-06-06')).toBe(true);
    expect(happensOn('anniversaryDuet', '2027-06-07')).toBe(false);

    const h = harness(undefined, withBoothoven(700, 'castleHall', 6, 9));
    h.clock.set(new Date(2027, 5, 6, 19));
    settle(h);
    expect(h.world.neighbourhood.neighbour('boothoven').zone).toBe('castleHall');
    const piano = hallPiano(h);
    const played = tunesIn(walkTo(h, piano.tx, piano.ty));
    expect(played).toHaveLength(1);
    expect(played[0]!.tune).toBe(DUET);
    expect(played[0]!.line).not.toContain('{name}');
    // She sits down beside him at the keys, not inside him (V1's shakedown).
    const him = h.world.neighbourhood.neighbour('boothoven');
    expect(tileOf(h.world.player.x, h.world.player.y)).not.toEqual(tileOf(him.x, him.y));
    expect(h.world.instruments.learnt).toContain(DUET);
    expect(h.world.save().tunes).toContain(DUET);
  });

  it('plays the hall piano as ever on her anniversary if they are not yet close', () => {
    const h = harness(undefined, withBoothoven(500, 'castleHall', 6, 9));
    h.clock.set(new Date(2027, 5, 6, 19));
    settle(h);
    const piano = hallPiano(h);
    const played = tunesIn(walkTo(h, piano.tx, piano.ty));
    expect(played.map((e) => e.tune)).not.toContain(DUET);
    expect(h.world.instruments.learnt).not.toContain(DUET);
  });

  it('lets go of a saved tune this build does not know, and of one known from the start', () => {
    const h = harness(undefined, { tunes: ['lanternWaltz', 'hushUpAndDance', 'kazooConcerto'] });
    expect(h.world.instruments.learnt).toEqual(['lanternWaltz']);
  });
});
