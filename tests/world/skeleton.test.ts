import { describe, expect, it } from 'vitest';
import { FOSSIL_IDS } from '../../src/data/fossils';
import { SKELETON_LETTER } from '../../src/data/museum';
import { letterOf } from '../../src/systems/friendship';
import type { WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Walks her to a tile and lets her arrive; every moment on the way. */
function walkTo(h: Harness, tx: number, ty: number): WorldEvent[] {
  expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(2));
}

const isGerald = (h: Harness) =>
  h.world.zones.room('crumbs').things.some((t) => 'fixture' in t && t.fixture.id === 'skeleton');

/** Into Crumbs & Curios, by the bakery's door. */
function goIn(h: Harness): void {
  const bakery = h.world.map.props.find((p) => p.id === 'bakery')!;
  walkTo(h, bakery.tx, bakery.ty);
  expect(h.world.scene).toBe('crumbs');
}

/**
 * The museum's skeleton (1.6's X6, decision 385): with every fossil on show, Wrapunzel stands
 * Gerald up in the middle of the museum and writes, once; nothing is kept but what's donated.
 */
describe("the museum's skeleton", () => {
  it('stands in the museum only once all twelve fossils are on show, and writes once', () => {
    const eleven = FOSSIL_IDS.slice(0, -1);
    const h = harness(undefined, { cabinet: { caught: {}, donated: eleven } });
    expect(h.world.cabinet.assembled).toBe(false);
    expect(isGerald(h)).toBe(false);
    expect(h.tick(2).some((e) => e.kind === 'assembled')).toBe(false);
    const last = FOSSIL_IDS.at(-1)!;
    h.world.bag.add(last, 1);
    expect(h.world.fossils.donate(last)).not.toBeNull();
    const events = h.tick(2);
    expect(events).toContainEqual({ kind: 'assembled' });
    expect(h.world.cabinet.assembled).toBe(true);
    expect(isGerald(h)).toBe(true);
    expect(h.world.mailbox.view().map((m) => m.id)).toContain(SKELETON_LETTER);
    expect(letterOf(SKELETON_LETTER)?.from).toBe('wrapunzel');
    expect(letterOf(SKELETON_LETTER)?.text).toMatch(/Gerald/);
    // Once only.
    expect(h.tick(20).some((e) => e.kind === 'assembled')).toBe(false);
    expect(h.world.mailbox.view().filter((m) => m.id === SKELETON_LETTER)).toHaveLength(1);
  });

  it('greets a town that had every fossil on show already, the first time it plays', () => {
    const h = harness(undefined, { cabinet: { caught: {}, donated: [...FOSSIL_IDS] } });
    expect(isGerald(h)).toBe(true);
    expect(h.tick(2)).toContainEqual({ kind: 'assembled' });
    expect(h.world.mailbox.view().map((m) => m.id)).toContain(SKELETON_LETTER);
  });

  it('reads his plaque as she walks up to him, solid where he stands', () => {
    const h = harness(undefined, { cabinet: { caught: {}, donated: [...FOSSIL_IDS] } });
    goIn(h);
    const room = h.world.zones.room('crumbs');
    const gerald = room.things.find((t) => 'fixture' in t && t.fixture.id === 'skeleton')!;
    if (!('fixture' in gerald)) throw new Error('no Gerald');
    const { tx, ty } = gerald.fixture;
    expect(room.canWalk(tx, ty)).toBe(false);
    const events = walkTo(h, tx + 1, ty + 1);
    const arrived = events.find((e) => e.kind === 'arrived');
    expect(arrived && 'says' in arrived ? arrived.says : '').toMatch(/GERALD/);
  });

  it('leaves the floor where he would stand open until then', () => {
    const h = harness();
    const room = h.world.zones.room('crumbs');
    expect(room.canWalk(17, 5)).toBe(true);
    expect(room.everything.some((t) => 'fixture' in t && t.fixture.id === 'skeleton')).toBe(true);
  });
});
