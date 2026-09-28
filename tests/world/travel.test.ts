import { describe, expect, it } from 'vitest';
import { fromSave, World } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Walks her to a tile and lets her arrive; every moment on the way. */
function walkTo(h: Harness, tx: number, ty: number) {
  expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(2));
}

/** Walks her from her door into Whisperwood, by the road east out of the square. */
function intoTheWoods(h: Harness) {
  return walkTo(h, 29, 16);
}

describe('going from place to place', () => {
  it('takes her into Whisperwood off the east end of the road, level with where she left', () => {
    const h = harness();
    const events = intoTheWoods(h);
    expect(h.world.scene).toBe('whisperwood');
    expect(h.world.movement.tile).toEqual({ tx: 1, ty: 17 });
    expect(h.world.player.facing).toBe('right');
    expect(events).toContainEqual({ kind: 'entered', scene: 'whisperwood' });
    expect(events).toContainEqual({ kind: 'found', zone: 'whisperwood' });
    expect(h.world.atlas.hasFound('whisperwood')).toBe(true);
  });

  it('brings a letter from Cody the first time, with their first-date skates', () => {
    const h = harness();
    const events = intoTheWoods(h);
    expect(events).toContainEqual({ kind: 'mail', from: 'cody' });
    const letter = h.world.mailbox.view().find((m) => m.id === 'found:whisperwood')!;
    expect(letter.text).toMatch(/first date/);
    expect(h.world.mailbox.open('found:whisperwood')).toBe(true);
    expect(h.world.bag.count('iceSkates')).toBe(1);
    // A second visit brings nothing more.
    walkTo(h, 0, 18);
    expect(h.world.scene).toBe('town');
    expect(h.world.movement.tile).toEqual({ tx: 28, ty: 17 });
    intoTheWoods(h);
    expect(h.world.letters.all.filter((m) => m.id === 'found:whisperwood')).toHaveLength(1);
  });

  it('stops her at the frozen creek until she has skates, then opens it for good', () => {
    const h = harness();
    intoTheWoods(h);
    const shut = walkTo(h, 18, 35);
    expect(shut).toContainEqual({ kind: 'shut', zone: 'lanternShore' });
    expect(h.world.scene).toBe('whisperwood');
    expect(h.world.travel.isOpen('lanternShore')).toBe(false);

    h.world.mailbox.open('found:whisperwood');
    const opened = h.tick(1);
    expect(opened).toContainEqual({ kind: 'opened', zone: 'lanternShore' });
    walkTo(h, 18, 33);
    const crossing = walkTo(h, 19, 35);
    expect(h.world.scene).toBe('lanternShore');
    expect(h.world.movement.tile).toEqual({ tx: 19, ty: 1 });
    expect(crossing).toContainEqual({ kind: 'found', zone: 'lanternShore' });

    // Nothing shuts it again, even without the skates.
    h.world.bag.remove('iceSkates');
    expect(h.tick(1).some((e) => e.kind === 'opened')).toBe(false);
    expect(h.world.travel.isOpen('lanternShore')).toBe(true);
  });

  it('goes by the world map only to places she has found and can get into', () => {
    const h = harness();
    expect(h.world.travel.go('whisperwood')).toBe(false);
    expect(h.world.travel.go('town')).toBe(false);
    intoTheWoods(h);
    expect(h.world.travel.go('lanternShore')).toBe(false);
    expect(h.world.travel.go('town')).toBe(true);
    expect(h.world.scene).toBe('town');
    expect(h.world.movement.tile).toEqual(h.world.map.spawn);
    expect(h.tick(1)).toContainEqual({ kind: 'entered', scene: 'town' });
    expect(h.world.travel.go('whisperwood')).toBe(true);
    expect(h.world.movement.tile).toEqual({ tx: 1, ty: 17 });
  });

  it('shows the places she has found on the map, and a question mark beside them', () => {
    const h = harness();
    expect(h.world.travel.places().map((p) => [p.id, p.found])).toEqual([
      ['town', true],
      ['whisperwood', false],
    ]);
    intoTheWoods(h);
    const places = h.world.travel.places();
    expect(places.map((p) => p.id)).toEqual(['town', 'whisperwood', 'lanternShore']);
    const shore = places.find((p) => p.id === 'lanternShore')!;
    expect(shore).toMatchObject({ found: false, open: false, here: false });
    expect(shore.hint).toMatch(/skates/);
    expect(places.find((p) => p.here)?.id).toBe('whisperwood');
  });

  it('counts being at home as being in town on the map, and stops decorating to go', () => {
    const h = harness();
    intoTheWoods(h);
    h.world.travel.go('town');
    walkTo(h, 4, 4);
    expect(h.world.scene).toBe('home');
    expect(h.world.travel.places().find((p) => p.here)?.id).toBe('town');
    expect(h.world.decorating.start()).toBe(true);
    expect(h.world.travel.go('whisperwood')).toBe(true);
    expect(h.world.decorating.state).toBeNull();
    expect(h.world.scene).toBe('whisperwood');
  });

  it('brings the pet walking with her along, through the trees too', () => {
    const h = harness();
    h.world.petCare.walkWith('dolly');
    intoTheWoods(h);
    const dolly = h.world.petCare.pet('dolly');
    expect(dolly.scene).toBe('whisperwood');
    expect(h.world.petCare.here().map((p) => p.id)).toEqual(['dolly']);
  });

  it('gathers from the trees in the woods apart from those in town', () => {
    const h = harness();
    intoTheWoods(h);
    const events = walkTo(h, 7, 16);
    expect(events.some((e) => e.kind === 'arrived' && e.at === 'tree')).toBe(true);
    expect(events.some((e) => e.kind === 'gathered')).toBe(true);
    expect(Object.keys(h.world.takings.all)).toContain('whisperwood:prop:7,16');
  });
});

describe('saving where she has been', () => {
  it('keeps her in the woods, and the places found and opened', () => {
    const h = harness();
    intoTheWoods(h);
    h.world.mailbox.open('found:whisperwood');
    h.tick(1);
    walkTo(h, 8, 18);
    const again = new World({ ...fromSave(h.world.save()), clock: h.clock });
    expect(again.scene).toBe('whisperwood');
    expect(again.movement.tile).toEqual({ tx: 8, ty: 18 });
    expect(again.atlas.hasFound('whisperwood')).toBe(true);
    expect(again.travel.isOpen('lanternShore')).toBe(true);
    expect(again.update(16).some((e) => e.kind === 'opened')).toBe(false);
  });

  it('puts her back at her door from a place this build does not know', () => {
    const h = harness();
    const save = h.world.save();
    const lost = { ...save, player: { ...save.player, zone: 'castleHill' as never, tx: 3, ty: 3 } };
    const again = new World({ ...fromSave(lost), clock: h.clock });
    expect(again.scene).toBe('town');
    expect(again.movement.tile).toEqual(again.map.spawn);
  });
});

describe('her neighbours, beyond the town', () => {
  it('are only walked in the place she is in, and simply at their stop anywhere else', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 26, 7));
    const rufus = h.world.neighbourhood.neighbour('rufus');
    // He was in town when the hour turned, so off he walks, out by the east road.
    h.tick(1);
    expect(rufus.zone).toBe('town');
    expect(rufus.moving).toBe(true);
    h.until(() => rufus.zone === 'whisperwood', 'Rufus to go off to the woods', 120_000);
    expect(rufus.tile).toEqual({ tx: 6, ty: 5 });
    expect(h.world.neighbourhood.neighboursIn('town').map((n) => n.id)).not.toContain('rufus');
    expect(h.world.neighbourhood.villagerAt(6, 5)).toBeUndefined();
    intoTheWoods(h);
    expect(h.world.neighbourhood.villagerAt(6, 5)?.id).toBe('rufus');
  });

  it('walk out by the edge when their next stop is somewhere else, and come in by it', () => {
    const h = harness();
    h.clock.set(new Date(2026, 8, 26, 10, 59));
    intoTheWoods(h);
    const rufus = h.world.neighbourhood.neighbour('rufus');
    expect(rufus.zone).toBe('whisperwood');
    h.clock.set(new Date(2026, 8, 26, 11, 0));
    h.until(() => rufus.zone === 'town', 'Rufus to head back to town', 120_000);
    expect(rufus.tile).toEqual({ tx: 17, ty: 17 });

    h.clock.set(new Date(2026, 8, 26, 19, 0));
    h.tick(1);
    const agatha = h.world.neighbourhood.neighbour('agatha');
    expect(agatha.zone).toBe('whisperwood');
    // She comes in from the town's side, and walks on to her stop.
    expect(agatha.tile.tx).toBeLessThanOrEqual(2);
    h.until(() => agatha.tile.tx === 12 && agatha.tile.ty === 5, 'Agatha to her stop', 120_000);
  });
});
