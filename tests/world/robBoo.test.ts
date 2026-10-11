import { describe, expect, it } from 'vitest';
import { CASTLE_HILL, PROP_FOOTPRINT, TOWN_SPOTS } from '../../src/data/maps';
import { CHAIN, UNMASKED } from '../../src/data/mysteryChain';
import { DEFAULT_LOOK } from '../../src/data/outfits';
import { REVEAL_AT, REVEAL_LINES } from '../../src/data/robBoo';
import { VILLAGERS } from '../../src/data/villagers';
import { MAYOR_MET_TALK } from '../../src/data/mysteryTalk';
import { dayKey } from '../../src/systems/clock';
import { fill } from '../../src/systems/friendship';
import { happeningOf, happeningsOn } from '../../src/systems/happenings';
import { inTown } from '../../src/systems/mayor';
import { visitsOn } from '../../src/systems/schedules';
import { parseMap } from '../../src/systems/grid';
import { fromSave, World } from '../../src/world/World';
import { harness, type Harness } from './harness';

/*
 * Rob Boo, the mayor (V1's P3b, decision 303): nowhere about until the mystery's end, met at the
 * castle the evening the town gathers for his hello, and a neighbour like the rest from then on.
 */

const her = { closet: { look: { ...DEFAULT_LOOK, name: 'Em' } } };
const HILL = parseMap(CASTLE_HILL);

/** Opens every letter from the mayor waiting in her mailbox. */
function readMayor(h: Harness): void {
  for (const m of h.world.mailbox.view()) {
    if (m.id.startsWith('mayor:') && !m.opened) h.world.mailbox.open(m.id);
  }
}

/** Walks her up to the town's first prop of a kind, and back to her door after. */
function walkUpTo(h: Harness, id: string): void {
  const prop = h.world.map.props.find((p) => p.id === id)!;
  expect(h.world.tapTile(prop.tx, prop.ty), `walking to ${id}`).toBe(true);
  h.until(() => !h.world.player.moving && h.world.target === null, `reaching ${id}`);
}

/** Walks her through a door: taps the building's door and steps until she's through. */
function walkIn(h: Harness, tx: number, ty: number) {
  expect(h.world.tapTile(tx, ty)).toBe(true);
  return h.until(() => !h.world.player.moving, `walking in at ${tx},${ty}`).concat(h.tick(1));
}

/** Plays a day of her mystery: the post read, and the chain's clue walked up to if it's due. */
function playDay(h: Harness, date: Date): void {
  h.clock.set(date);
  h.tick(2);
  readMayor(h);
  h.tick(1);
  const step = CHAIN.find((s) => h.world.casebook.foundOn(s.clue) === null);
  if (step && 'at' in step && h.world.mystery.daysUntil(step.clue) === 0) {
    walkUpTo(h, step.at);
    h.tick(1);
  }
}

/** A town where the mayor promised to say hello on 5 October, and she has the castle hill. */
function promised(player?: { zone: 'castleHill' | 'castleHall'; tx: number; ty: number }) {
  const clues = Object.fromEntries([
    ['welcome', '2026-08-01'],
    ['typewriter', '2026-08-08'],
    ...CHAIN.map((s, i) => [s.clue, `2026-${i < 4 ? '08' : '09'}-1${i}`]),
    ['promise', '2026-10-05'],
  ]);
  return harness(undefined, {
    ...her,
    mystery: { clues, began: '2026-08-01' },
    ...(player && { player: { ...player, facing: 'up' as const } }),
    atlas: { found: ['town', 'castleHill'], opened: [] },
  });
}

describe("Rob Boo, the mayor (V1's P3b)", () => {
  it('is nowhere about before she has met him: no walk, no visits, no birthday cake', () => {
    const h = harness(undefined, her);
    h.tick(1);
    expect(inTown('robBoo')).toBe(false);
    expect(h.world.neighbourhood.neighbours.map((n) => n.id)).not.toContain('robBoo');
    for (let d = 1; d <= 28; d++) {
      const day = `2026-10-${String(d).padStart(2, '0')}`;
      for (const v of visitsOn(day)) {
        expect(v.guest).not.toBe('robBoo');
        expect(v.host).not.toBe('robBoo');
      }
      expect(happeningsOn(day)).not.toContain('unmasking');
    }
    expect(h.world.mystery.met()).toBeNull();
  });

  it('runs the chain to the promise, and the town gathers at the castle that evening', () => {
    const h = harness(undefined, her);
    for (let d = 0; d <= 61 && h.world.mystery.ready() === null; d++) {
      playDay(h, new Date(2026, 8, 26 + d, 10));
    }
    const ready = h.world.mystery.ready()!;
    expect(ready).not.toBeNull();
    expect(happeningsOn(ready)).toContain('unmasking');
    // Every evening from then until she's there, never before the promise.
    const [y, m, d] = ready.split('-').map(Number) as [number, number, number];
    h.clock.set(new Date(y, m - 1, d, 19));
    h.tick(2);
    expect(h.world.neighbourhood.happeningIn('castleHall')).toBe('unmasking');
    expect(happeningOf('cody', 19, ready)).toBe('unmasking');
    h.clock.set(new Date(y, m - 1, d + 3, 19));
    h.tick(2);
    expect(h.world.neighbourhood.happeningIn('castleHall')).toBe('unmasking');
    expect(h.world.mystery.met()).toBeNull();
  });

  it('comes out from under the sheet as she walks into the hall, once', () => {
    const castle = HILL.props.find((p) => p.id === 'castle')!;
    const { door, h: tall } = PROP_FOOTPRINT.castle;
    const h = promised({ zone: 'castleHill', tx: castle.tx + door!, ty: castle.ty + tall + 2 });
    h.clock.set(new Date(2026, 9, 6, 19, 30));
    h.tick(2);
    const events = walkIn(h, castle.tx + door!, castle.ty + tall - 1);
    expect(events).toContainEqual(
      expect.objectContaining({ kind: 'entered', scene: 'castleHall' }),
    );
    const scene = events.find((e) => e.kind === 'unmasked');
    expect(scene).toEqual({
      kind: 'unmasked',
      lines: REVEAL_LINES.map((l) => fill(l, { name: 'Em' })),
    });
    expect(REVEAL_LINES[REVEAL_AT]).toContain('ghost');
    expect(h.world.mystery.met()).toBe('2026-10-06');
    expect(h.world.casebook.foundOn(UNMASKED)).toBe('2026-10-06');
    // He's there at the front, among everyone, straight away.
    const rob = h.world.neighbourhood.neighbour('robBoo');
    expect(h.world.neighbourhood.neighboursIn('castleHall')).toContain(rob);
    expect(rob.tile).toEqual({ tx: 6, ty: 6 });
    // Once only, and the town stays the evening.
    expect(h.tick(10).some((e) => e.kind === 'unmasked')).toBe(false);
    expect(h.world.neighbourhood.happeningIn('castleHall')).toBe('unmasking');
    const hello = h.world.neighbourhood.talk('robBoo').line;
    expect(hello).toContain('Em');
  });

  it('is a neighbour like the rest the next morning, through a save and back', () => {
    const h = promised({ zone: 'castleHall', tx: 6, ty: 9 });
    h.clock.set(new Date(2026, 9, 6, 20));
    expect(h.tick(2).some((e) => e.kind === 'unmasked')).toBe(true);
    // The next morning, a Wednesday: out on the town hall steps, waving the town good morning.
    const clock = h.clock;
    const save = h.world.save();
    clock.set(new Date(2026, 9, 7, 9));
    const world = new World({ ...fromSave(save), clock });
    for (let i = 0; i < 3; i++) world.update(16);
    expect(world.mystery.met()).toBe('2026-10-06');
    expect(happeningsOn('2026-10-07')).not.toContain('unmasking');
    const rob = world.neighbourhood.neighbour('robBoo');
    expect(world.neighbourhood.neighbours).toContain(rob);
    expect(rob.zone).toBe('town');
    expect(rob.tile).toEqual(TOWN_SPOTS.townHallSteps);
    // The day's first talk: the town is still all about the mayor (V1's P3b's topic), or his own
    // lines, every one with her name filled in.
    const said = world.neighbourhood.talk('robBoo').line;
    const own = [
      ...VILLAGERS.robBoo.lines.hello,
      ...Object.values(VILLAGERS.robBoo.lines.windows),
      ...MAYOR_MET_TALK.robBoo,
    ].map((l) => fill(l, { name: 'Em' }));
    expect(said.length).toBeGreaterThan(0);
    expect(said).not.toMatch(/[{}]/);
    expect(own.some((l) => said.includes(l)) || said.includes('Em')).toBe(true);
    expect(world.friends.of('robBoo').talked).toBe(dayKey(clock.now()));
  });
});
