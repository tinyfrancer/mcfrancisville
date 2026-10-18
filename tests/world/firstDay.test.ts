import { describe, expect, it } from 'vitest';
import {
  FIRST_DAY,
  FIRST_DAY_IDS,
  FIRST_DAY_STEPS,
  MEET_NEIGHBOURS,
} from '../../src/data/firstDay';
import { TOWN } from '../../src/data/maps';
import { STALL_WARES } from '../../src/data/passive';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { parseMap } from '../../src/systems/grid';
import { isHusband } from '../../src/systems/cody';
import { inTown } from '../../src/systems/mayor';
import type { WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

const map = parseMap(TOWN);

/** A new town on her first day: her look made and Cody's hello said. */
function newTown(options: Parameters<typeof harness>[1] = {}): Harness {
  const h = harness(undefined, options);
  h.world.wardrobe.setLook(h.world.wardrobe.look);
  h.world.visits.welcome(null);
  return h;
}

function walkUp(h: Harness, id: string): WorldEvent[] {
  const { tx, ty } = map.props.find((p) => p.id === id)!;
  h.world.tapTile(tx, ty);
  return h.until(() => !h.world.player.moving, `walking to the ${id}`).concat(h.tick(1));
}

const told = (events: readonly WorldEvent[]) =>
  events.flatMap((e) => (e.kind === 'firstDay' ? [e.step] : []));

const neighbours = VILLAGER_IDS.filter((v) => !isHusband(v) && inTown(v));

/** Does every step but `except`, straight through the world's services. */
function doAll(h: Harness, except: string[] = []): WorldEvent[] {
  const events: WorldEvent[] = [];
  const step = () => events.push(...h.tick(1));
  if (!except.includes('shake')) events.push(...walkUp(h, 'candyTree'));
  if (!except.includes('plant')) {
    const bed = { zone: 'town' as const, ...map.beds[0]! };
    h.world.farm.till(bed);
    h.world.garden.plant(bed, 'pumpkinSeed');
    step();
  }
  if (!except.includes('stall')) {
    h.world.bag.add(STALL_WARES[0]!, 2);
    h.world.stall.leave(STALL_WARES[0]!, 2);
    step();
  }
  if (!except.includes('notice')) {
    const note = h.world.noticeboard.notices()[0]!;
    h.world.bag.add(note.item, note.count);
    h.world.noticeboard.answer(note.slot);
    step();
  }
  if (!except.includes('meet')) {
    for (const id of neighbours.slice(0, MEET_NEIGHBOURS)) h.world.neighbourhood.talk(id);
    step();
  }
  if (!except.includes('eat')) {
    h.world.kitchen.eat('ghostMallow');
    step();
  }
  return events;
}

describe("her first day (V1's R1)", () => {
  it('waits for her to make herself and hear Cody say hello', () => {
    const h = harness();
    expect(h.world.firstDay.open).toBe(false);
    h.world.wardrobe.setLook(h.world.wardrobe.look);
    expect(h.world.firstDay.open).toBe(false);
    h.world.visits.welcome(null);
    expect(h.world.firstDay.open).toBe(true);
    expect(h.world.firstDay.steps().map((s) => [s.id, s.done])).toEqual(
      FIRST_DAY_IDS.map((id) => [id, false]),
    );
  });

  it('keeps a step as it is done, with its gift and his line, in any order', () => {
    const h = newTown();
    const mallows = h.world.bag.count('ghostMallow');
    h.world.kitchen.eat('ghostMallow');
    const ate = h.tick(1);
    expect(ate).toContainEqual({
      kind: 'firstDay',
      step: 'eat',
      reward: FIRST_DAY_STEPS.eat.reward,
    });
    expect(h.world.bag.count('ghostMallow')).toBe(mallows - 1 + 2);
    const candy = h.world.wallet.candy;
    const shook = walkUp(h, 'candyTree');
    expect(told(shook)).toEqual(['shake']);
    expect(h.world.bag.count('moonPieMini')).toBe(1);
    expect(h.world.wallet.candy).toBeGreaterThan(candy);
    expect(h.world.firstDay.done).toEqual(['shake', 'eat']);
    // Told once: the next step of the world says nothing more.
    expect(told(h.tick(5))).toEqual([]);
  });

  it('counts the neighbours she has talked to, not her husband', () => {
    const h = newTown();
    h.world.neighbourhood.talk('cody');
    h.tick(1);
    const meet = () => h.world.firstDay.steps().find((s) => s.id === 'meet')!;
    expect(meet()).toMatchObject({ have: 0, need: MEET_NEIGHBOURS, done: false });
    h.world.neighbourhood.talk(neighbours[0]!);
    h.world.neighbourhood.talk(neighbours[1]!);
    expect(told(h.tick(1))).toEqual([]);
    expect(meet()).toMatchObject({ have: 2, done: false });
    h.world.neighbourhood.talk(neighbours[2]!);
    expect(told(h.tick(1))).toEqual(['meet']);
    expect(meet()).toMatchObject({ have: MEET_NEIGHBOURS, done: true });
  });

  it('counts what she did before her first day began, once it has', () => {
    const h = harness();
    h.world.wardrobe.setLook(h.world.wardrobe.look);
    walkUp(h, 'candyTree');
    expect(h.world.firstDay.done).toEqual([]);
    h.world.visits.welcome(null);
    expect(told(h.tick(1))).toEqual(['shake']);
  });

  it('ends with his keepsake in her storage chest once every step is done, and is over', () => {
    const h = newTown();
    const events = doAll(h);
    expect(told(events).sort()).toEqual([...FIRST_DAY_IDS].sort());
    const last = events.filter((e) => e.kind === 'firstDay').at(-1)!;
    expect(last).toMatchObject({ keepsake: FIRST_DAY.keepsake });
    expect(events.filter((e) => e.kind === 'firstDay' && e.keepsake)).toHaveLength(1);
    expect(h.world.home.stored.some((s) => s.id === 'welcomeSampler')).toBe(true);
    expect(h.world.firstDay.open).toBe(false);
    expect(h.world.firstDay.snapshot()).toEqual({
      firstDay: { done: [...FIRST_DAY_IDS], over: true },
    });
  });

  it('never locks anything: every step can wait for another day, and still counts', () => {
    const h = newTown();
    doAll(h, ['stall']);
    expect(h.world.firstDay.open).toBe(true);
    h.clock.advance(3 * 24 * 3_600_000);
    h.world.bag.add(STALL_WARES[0]!, 1);
    h.world.stall.leave(STALL_WARES[0]!, 1);
    const events = h.tick(1);
    expect(told(events)).toEqual(['stall']);
    expect(h.world.firstDay.open).toBe(false);
  });

  it('keeps the steps done through a save, and gives nothing twice', () => {
    const h = newTown();
    walkUp(h, 'candyTree');
    const kept = h.world.firstDay.snapshot().firstDay;
    expect(kept).toEqual({ done: ['shake'], over: false });
    const again = newTown({ firstDay: kept, candyTree: { shaken: h.clock.now(), saplings: [] } });
    expect(told(again.tick(2))).toEqual([]);
    expect(again.world.firstDay.done).toEqual(['shake']);
  });

  it('is nothing at all for an old town, which knows its way round', () => {
    const h = newTown({ firstDay: { done: [], over: true } });
    expect(h.world.firstDay.open).toBe(false);
    expect(told(doAll(h))).toEqual([]);
    expect(h.world.home.stored.some((s) => s.id === 'welcomeSampler')).toBe(false);
  });

  it('forgets a step this build does not know', () => {
    const h = newTown({ firstDay: { done: ['shake', 'juggle' as 'shake'], over: false } });
    expect(h.world.firstDay.done).toEqual(['shake']);
  });
});
