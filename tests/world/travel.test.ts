import { describe, expect, it } from 'vitest';
import { CRITTERS } from '../../src/data/critters';
import { spotOf } from '../../src/data/maps';
import { fromSave, World } from '../../src/world/World';
import { harness, type Harness } from './harness';

/** Walks her to a tile and lets her arrive; every moment on the way. */
function walkTo(h: Harness, tx: number, ty: number) {
  expect(h.world.tapTile(tx, ty), `a way to ${tx},${ty}`).toBe(true);
  return h.until(() => !h.world.player.moving, `walking to ${tx},${ty}`).concat(h.tick(2));
}

/** Walks her from her door into Whisperwood, by the road east out of the square. */
function intoTheWoods(h: Harness) {
  const road = h.world.map.exits.find((e) => e.to === 'whisperwood')!;
  return walkTo(h, road.tx, road.ty);
}

describe("the ways out, as she finds them (0.2's C1)", () => {
  it('has a signpost by the road out of town that says where it goes', () => {
    const h = harness();
    const post = h.world.map.props.find((p) => p.sign?.to === 'whisperwood')!;
    expect(post.sign?.way).toBe('right');
    const events = walkTo(h, post.tx, post.ty);
    expect(events).toContainEqual(
      expect.objectContaining({ kind: 'arrived', at: 'signpost', sign: 'whisperwood' }),
    );
  });

  it('lists the ways out of where she is for the map, named once she has been', () => {
    const h = harness();
    expect(h.world.travel.waysOut()).toEqual([
      expect.objectContaining({ to: 'whisperwood', side: 'east', found: false }),
      expect.objectContaining({ to: 'booAcres', side: 'west', found: false }),
      expect.objectContaining({ to: 'castleHill', side: 'north', found: false }),
      expect.objectContaining({ to: 'fairground', side: 'south', found: false }),
    ]);
    intoTheWoods(h);
    const ways = h.world.travel.waysOut();
    expect(ways.map((w) => [w.to, w.side, w.found])).toEqual([
      ['town', 'west', true],
      ['lanternShore', 'south', false],
      ['hiddenClearing', 'north', false],
    ]);
    expect(ways.find((w) => w.to === 'hiddenClearing')?.secret).toBe(true);
  });
});

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

  it('brings a letter from Cody the first time, about their first date', () => {
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
    const road = h.world.map.exits.find((e) => e.to === 'whisperwood')!;
    expect(h.world.movement.tile).toEqual({ tx: road.tx - 1, ty: road.ty + 1 });
    intoTheWoods(h);
    expect(h.world.letters.all.filter((m) => m.id === 'found:whisperwood')).toHaveLength(1);
  });

  it('slides her back to the bank off the frozen creek without her skates', () => {
    // She has them from the first day (decision 211), so only a test can take them away.
    const h = harness();
    h.world.bag.remove('iceSkates');
    intoTheWoods(h);
    const woods = h.world.zones.map('whisperwood');
    expect(h.world.canWalk(18, 37)).toBe(false);
    expect(h.world.tapTile(18, 37)).toBe(true);
    // She walks to the bank, tries the ice, and slides back, facing it all the way.
    const events = h.until(() => h.world.target === null && h.world.player.moving, 'the ice');
    expect(events).toContainEqual({ kind: 'slipped' });
    const bank = h.world.movement.tile;
    expect(woods.slippery(bank.tx, bank.ty)).toBe(false);
    const facing = h.world.player.facing;
    const back = h.until(() => !h.world.player.moving, 'sliding back');
    expect(h.world.player.facing).toBe(facing);
    expect(h.world.movement.tile).toEqual(bank);
    expect(back.some((e) => e.kind === 'slipped')).toBe(false);
    expect(h.world.scene).toBe('whisperwood');
  });

  it('skates her down the creek to Lantern Shore from her first day (decision 211)', () => {
    const h = harness();
    expect(h.world.bag.count('iceSkates')).toBe(1);
    expect(h.world.travel.isOpen('lanternShore')).toBe(true);
    intoTheWoods(h);
    walkTo(h, 17, 35);
    const crossing = walkTo(h, 18, 37);
    expect(h.world.scene).toBe('lanternShore');
    expect(h.world.movement.tile).toEqual({ tx: 13, ty: 1 });
    expect(crossing).toContainEqual({ kind: 'found', zone: 'lanternShore' });

    // Nothing shuts it, even without the skates.
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
      ['castleHill', false],
      ['fairground', false],
      ['booAcres', false],
    ]);
    intoTheWoods(h);
    const places = h.world.travel.places();
    // The hidden clearing is a secret: no question mark down the way to it.
    expect(places.map((p) => p.id)).toEqual([
      'town',
      'whisperwood',
      'lanternShore',
      'castleHill',
      'fairground',
      'booAcres',
    ]);
    const shore = places.find((p) => p.id === 'lanternShore')!;
    expect(shore).toMatchObject({ found: false, open: true, here: false, hint: null });
    expect(places.find((p) => p.here)?.id).toBe('whisperwood');
  });

  it('counts being at home as being in town on the map, and stops decorating to go', () => {
    const h = harness();
    intoTheWoods(h);
    h.world.travel.go('town');
    const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
    walkTo(h, house.tx + 1, house.ty + 1);
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
    const events = walkTo(h, 14, 16);
    expect(events.some((e) => e.kind === 'arrived' && e.at === 'tree')).toBe(true);
    expect(events.some((e) => e.kind === 'gathered')).toBe(true);
    expect(Object.keys(h.world.takings.all)).toContain('whisperwood:prop:14,16');
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
    const lost = { ...save, player: { ...save.player, zone: 'moonCave' as never, tx: 3, ty: 3 } };
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
    const stop = spotOf('whisperwood', 'wildflowers');
    expect(rufus.tile).toEqual(stop);
    expect(h.world.neighbourhood.neighboursIn('town').map((n) => n.id)).not.toContain('rufus');
    expect(h.world.neighbourhood.villagerAt(stop.tx, stop.ty)).toBeUndefined();
    intoTheWoods(h);
    expect(h.world.neighbourhood.villagerAt(stop.tx, stop.ty)?.id).toBe('rufus');
  });

  it('walk out by the edge when their next stop is somewhere else, and come in by it', () => {
    const h = harness();
    // A Monday, when Rufus picks wildflowers in the woods till eleven.
    h.clock.set(new Date(2026, 8, 28, 10, 59));
    intoTheWoods(h);
    const rufus = h.world.neighbourhood.neighbour('rufus');
    expect(rufus.zone).toBe('whisperwood');
    h.clock.set(new Date(2026, 8, 28, 11, 0));
    h.until(() => rufus.zone === 'town', 'Rufus to head back to town', 120_000);
    expect(rufus.tile).toEqual(spotOf('town', 'squareNorth'));

    h.clock.set(new Date(2026, 8, 28, 19, 0));
    h.tick(1);
    const agatha = h.world.neighbourhood.neighbour('agatha');
    expect(agatha.zone).toBe('whisperwood');
    // She comes in from the town's side, and walks on to her stop.
    expect(agatha.tile.tx).toBeLessThanOrEqual(2);
    const herbs = spotOf('whisperwood', 'herbs');
    h.until(
      () => agatha.tile.tx === herbs.tx && agatha.tile.ty === herbs.ty,
      'Agatha to her stop',
      120_000,
    );
  });
});

describe('the hidden clearing and the castle hill', () => {
  /** The gate up to the castle, one tile in from the top of the town. */
  const GATE = { tx: 28, ty: 1 };

  /** Walks her from the woods up the hidden way into the clearing. */
  function intoTheClearing(h: Harness) {
    if (h.world.scene !== 'whisperwood') intoTheWoods(h);
    const way = h.world.zones.map('whisperwood').map.exits;
    const hidden = way.find((e) => e.to === 'hiddenClearing')!;
    return walkTo(h, hidden.tx, hidden.ty);
  }

  it('has the castle gate standing open from the first day (decision 211)', () => {
    const h = harness();
    expect(h.world.travel.isOpen('castleHill')).toBe(true);
    expect(h.world.canWalk(GATE.tx, GATE.ty)).toBe(true);
    expect(h.world.travel.places().find((p) => p.id === 'castleHill')?.hint).toBeNull();
  });

  it('finds the hidden clearing up the way through the thicket, a secret until then', () => {
    const h = harness();
    intoTheWoods(h);
    expect(h.world.travel.places().some((p) => p.id === 'hiddenClearing')).toBe(false);
    const events = intoTheClearing(h);
    expect(h.world.scene).toBe('hiddenClearing');
    expect(events).toContainEqual({ kind: 'found', zone: 'hiddenClearing' });
    expect(h.world.travel.places().find((p) => p.id === 'hiddenClearing')?.found).toBe(true);
  });

  it('digs up the castle key in the ring of toadstools, once, a keepsake', () => {
    const h = harness();
    intoTheClearing(h);
    const events = walkTo(h, 8, 11);
    expect(events).toContainEqual({ kind: 'dug', buried: 'castleKey', item: 'castleKey' });
    expect(h.world.bag.count('castleKey')).toBe(1);
    // Walking up again digs up nothing more.
    walkTo(h, 9, 15);
    expect(walkTo(h, 8, 11).some((e) => e.kind === 'dug')).toBe(false);
    expect(h.world.bag.count('castleKey')).toBe(1);
    // It's remembered, even with the key sold or lost.
    h.world.bag.remove('castleKey');
    const again = new World({ ...fromSave(h.world.save()), clock: h.clock });
    expect(again.dug.has('castleKey')).toBe(true);
  });

  it('lets her through the open gate up to the castle, with a letter from Cody', () => {
    const h = harness();
    h.tick(1);
    expect(h.world.canWalk(GATE.tx, GATE.ty)).toBe(true);
    const events = walkTo(h, 29, 0);
    expect(h.world.scene).toBe('castleHill');
    expect(h.world.movement.tile).toEqual({ tx: 14, ty: 40 });
    expect(events).toContainEqual({ kind: 'found', zone: 'castleHill' });
    expect(events).toContainEqual({ kind: 'mail', from: 'cody' });
    walkTo(h, 13, 41);
    expect(h.world.scene).toBe('town');
    expect(h.world.movement.tile).toEqual({ tx: 28, ty: 1 });
  });

  it('has critters of its own in each place: monarchs only at the castle', () => {
    const h = harness();
    h.tick(1);
    walkTo(h, 29, 0);
    let seen = false;
    for (let d = 0; d < 30 && !seen; d++) {
      h.clock.set(new Date(2026, 8, 26 + d, 12));
      const out = h.world.collecting.critters();
      for (const c of out) expect(CRITTERS[c.critter].where).toContain('castleHill');
      seen = out.some((c) => c.critter === 'monarch');
    }
    expect(seen).toBe(true);
    expect(h.world.collecting.critters('town').some((c) => c.critter === 'monarch')).toBe(false);
  });
});

describe("the Hollow Fairground (0.2's M1)", () => {
  /** The gate down to the fairground, one tile in from the bottom of the town. */
  const GATE = { tx: 34, ty: 48 };

  /** Lets the town step once, as it does before she can tap anything. */
  function settleIn(h: Harness) {
    h.tick(1);
  }

  it('has its gate standing open from the first day (decision 211)', () => {
    const h = harness();
    expect(h.world.travel.isOpen('fairground')).toBe(true);
    expect(h.world.canWalk(GATE.tx, GATE.ty)).toBe(true);
    expect(h.world.travel.places().find((p) => p.id === 'fairground')?.hint).toBeNull();
  });

  it('lets her through, with a letter from Boothoven, and back up to the town', () => {
    const h = harness();
    settleIn(h);
    const events = walkTo(h, 35, 49);
    expect(h.world.scene).toBe('fairground');
    expect(h.world.movement.tile).toEqual({ tx: 4, ty: 1 });
    expect(events).toContainEqual({ kind: 'found', zone: 'fairground' });
    expect(events).toContainEqual({ kind: 'mail', from: 'boothoven' });
    walkTo(h, 3, 0);
    expect(h.world.scene).toBe('town');
    expect(h.world.movement.tile).toEqual({ tx: 34, ty: 48 });
  });

  it('goes into the fortune tent by its flap, and back out in front of it', () => {
    const h = harness();
    settleIn(h);
    walkTo(h, 35, 49);
    const tent = h.world.zones.map('fairground').map.props.find((p) => p.id === 'fortuneTent')!;
    const events = walkTo(h, tent.tx + 1, tent.ty + 1);
    expect(events).toContainEqual({ kind: 'entered', scene: 'fortuneTent' });
    const room = h.world.zones.room('fortuneTent').room;
    walkTo(h, room.mat.tx, room.mat.ty - 1);
    expect(walkTo(h, room.mat.tx, room.mat.ty)).toContainEqual({
      kind: 'entered',
      scene: 'fairground',
    });
    expect(h.world.movement.tile).toEqual({ tx: tent.tx + 1, ty: tent.ty + tent.h });
  });

  it('has critters of its own: pumpkin toads and bats live only there, and fireflies', () => {
    expect(CRITTERS.pumpkinToad.where).toEqual(['fairground']);
    expect(CRITTERS.pumpkinBat.where).toEqual(['fairground']);
    // Fireflies light Boo Acres' fields too since V1's R5 (decision 310).
    expect(CRITTERS.firefly.where).toEqual(['fairground', 'booAcres']);
    const h = harness();
    settleIn(h);
    walkTo(h, 35, 49);
    let seen = false;
    for (let d = 0; d < 30 && !seen; d++) {
      h.clock.set(new Date(2026, 8, 26 + d, 12));
      for (const c of h.world.collecting.critters()) {
        expect(CRITTERS[c.critter].where).toContain('fairground');
        seen ||= c.critter === 'pumpkinToad';
      }
    }
    expect(seen).toBe(true);
  });
});
