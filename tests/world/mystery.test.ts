import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { DEFAULT_LOOK } from '../../src/data/outfits';
import { peddlerSpot } from '../../src/systems/shop';
import { WES_SLOT_MS, wesLurks } from '../../src/systems/mystery';
import { tileOf } from '../../src/world/World';
import { harness } from './harness';

const her = { closet: { look: { ...DEFAULT_LOOK, name: 'Em' } } };

describe("the mayor's letters", () => {
  it('wait until she has a name, then come, and pin a clue as she reads each', () => {
    const shy = harness();
    shy.tick(1);
    expect(shy.world.mailbox.view()).toEqual([]);

    const h = harness(undefined, her);
    expect(h.tick(1)).toContainEqual({ kind: 'mail', from: 'mayor' });
    expect(h.world.mailbox.view()[0]!.text).toMatch(/^Dear Em,/);
    h.world.mailbox.open('mayor:0');
    expect(h.tick(1)).toContainEqual({ kind: 'clue', clue: 'welcome' });
    expect(h.world.casebook.found).toEqual(['welcome']);

    const mayors = () => h.world.mailbox.view().filter((m) => m.id.startsWith('mayor:'));
    h.clock.set(new Date(2026, 9, 2, 12));
    h.tick(1);
    expect(mayors().map((m) => m.id)).toEqual(['mayor:0']);
    h.clock.set(new Date(2026, 9, 3, 12));
    h.tick(1);
    expect(mayors().map((m) => m.id)).toEqual(['mayor:1', 'mayor:0']);
    h.world.mailbox.open('mayor:1');
    expect(h.world.casebook.found).toEqual(['welcome', 'typewriter']);
  });
});

describe("the mayor's October story", () => {
  const ids = (h: ReturnType<typeof harness>) => h.world.mailbox.view().map((m) => m.id);

  it('comes a chapter a week through the festival, and none before it', () => {
    const h = harness(undefined, her);
    h.tick(1);
    expect(ids(h).filter((id) => id.startsWith('story:'))).toEqual([]);
    h.clock.set(new Date(2026, 9, 1, 12));
    expect(h.tick(1)).toContainEqual({ kind: 'mail', from: 'mayor' });
    expect(ids(h)).toContain('story:0');
    expect(h.world.mailbox.view().find((m) => m.id === 'story:0')!.text).toMatch(
      /^Dear Em,[\s\S]*Chapter One/,
    );
    h.clock.set(new Date(2026, 9, 14, 12));
    h.tick(1);
    expect(ids(h)).toContain('story:1');
    expect(ids(h)).not.toContain('story:2');
    h.clock.set(new Date(2026, 9, 30, 12));
    h.tick(1);
    expect(ids(h)).toContain('story:2');
    // The last chapter is Wes's to drop, never the post's.
    expect(ids(h)).not.toContain('story:3');
  });

  it('comes all at once, in order, to a town first opened late in the month', () => {
    const h = harness(undefined, her);
    h.clock.set(new Date(2026, 9, 20, 12));
    h.tick(1);
    expect(ids(h).filter((id) => id.startsWith('story:'))).toEqual([
      'story:2',
      'story:1',
      'story:0',
    ]);
  });
});

describe('clues', () => {
  it('turn up with a friend at three hearts, and with five kinds of critter', () => {
    const h = harness(undefined, {
      ...her,
      friends: { friends: { rufus: { points: 295, talked: null, gifted: null, favour: null } } },
      cabinet: {
        caught: {
          lunaMoth: '2026-09-26',
          candleMoth: '2026-09-26',
          pumpkinBat: '2026-09-26',
          lilyFrog: '2026-09-26',
        },
      },
    });
    h.tick(1);
    expect(h.world.casebook.foundOn('rumour')).toBeNull();
    h.world.neighbourhood.talk('rufus');
    expect(h.tick(1)).toContainEqual({ kind: 'clue', clue: 'rumour' });
    h.world.cabinet.record('greenOrb', '2026-09-26');
    expect(h.tick(1)).toContainEqual({ kind: 'clue', clue: 'visitorBook' });
    expect(h.tick(10)).not.toContainEqual(expect.objectContaining({ kind: 'clue' }));
  });

  it("turn up at the Moon Pie Man's cart", () => {
    for (let i = 0; i < 30; i++) {
      const date = new Date(2026, 8, 26 + i, 12);
      if (!peddlerSpot(TOWN.peddlerSpots!, date.getTime())) continue;
      const h = harness(undefined, { ...her, candy: 1000 });
      h.clock.set(date);
      h.world.shops.buy('moonPie', { item: 'moonPie' });
      expect(h.world.casebook.foundOn('wrapper')).not.toBeNull();
      return;
    }
    throw new Error('the Moon Pie Man never came');
  });
});

describe('Wes', () => {
  /** A harness at noon in a minute when Wes is out lurking somewhere she can see him. */
  function wesOut(day = new Date(2026, 8, 26, 12)) {
    const noon = day.getTime();
    const first = Math.floor(noon / WES_SLOT_MS);
    for (let slot = first; slot < first + 200; slot++) {
      if (!wesLurks(slot)) continue;
      const h = harness(undefined, her);
      h.clock.set(new Date(slot * WES_SLOT_MS + 1000));
      h.tick(1);
      if (h.world.mystery.wes()) return h;
    }
    throw new Error('Wes never came out');
  }

  it('lurks at the edge of what she can see, and is gone once she gets near', () => {
    const h = wesOut();
    const wes = h.world.mystery.wes()!;
    expect(h.world.tapTile(wes.tx, wes.ty)).toBe(true);
    const events = h.until(() => h.world.mystery.wes() === null, 'Wes to scarper');
    expect(events).toContainEqual({ kind: 'clue', clue: 'button' });
    const at = tileOf(h.world.player.x, h.world.player.y);
    expect(Math.max(Math.abs(at.tx - wes.tx), Math.abs(at.ty - wes.ty))).toBeLessThanOrEqual(3);
  });

  it('leaves nothing more behind once his button is on the board', () => {
    const h = wesOut();
    h.world.casebook.pin('button', '2026-09-26');
    const wes = h.world.mystery.wes()!;
    h.world.tapTile(wes.tx, wes.ty);
    const events = h.until(() => h.world.mystery.wes() === null, 'Wes to scarper');
    expect(events).toContainEqual(expect.objectContaining({ kind: 'wesGone' }));
    expect(events).not.toContainEqual(expect.objectContaining({ kind: 'clue' }));
  });

  it("drops the story's last chapter in its last week, which pins a clue", () => {
    const h = wesOut(new Date(2026, 9, 23, 12));
    h.world.casebook.pin('button', '2026-09-26');
    const wes = h.world.mystery.wes()!;
    h.world.tapTile(wes.tx, wes.ty);
    const events = h.until(() => h.world.mystery.wes() === null, 'Wes to scarper');
    expect(events).toContainEqual({ kind: 'wesDropped' });
    expect(events).not.toContainEqual(expect.objectContaining({ kind: 'wesGone' }));
    expect(events).not.toContainEqual(expect.objectContaining({ kind: 'mail' }));
    expect(h.world.mailbox.view()[0]!.id).toBe('story:3');
    h.world.mailbox.open('story:3');
    expect(h.world.casebook.foundOn('lastChapter')).not.toBeNull();
  });

  it('keeps the last chapter until its week', () => {
    const h = wesOut(new Date(2026, 9, 21, 12));
    h.world.casebook.pin('button', '2026-09-26');
    const wes = h.world.mystery.wes()!;
    h.world.tapTile(wes.tx, wes.ty);
    const events = h.until(() => h.world.mystery.wes() === null, 'Wes to scarper');
    expect(events).toContainEqual(expect.objectContaining({ kind: 'wesGone' }));
    expect(h.world.mailbox.view().map((m) => m.id)).not.toContain('story:3');
  });

  it('is never about while she is at home', () => {
    const h = wesOut();
    const house = h.world.map.props.find((p) => p.id === 'homeHouse')!;
    h.world.tapTile(house.tx + 1, house.ty + 1);
    h.until(() => h.world.scene === 'home', 'going in');
    expect(h.world.mystery.wes()).toBeNull();
  });
});
