import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { DEFAULT_LOOK } from '../../src/data/outfits';
import { peddlerSpot } from '../../src/systems/shop';
import { WES_SLOT_MS, wesLurks } from '../../src/systems/mystery';
import { tileOf } from '../../src/world/Town';
import { harness } from './harness';

const her = { closet: { look: { ...DEFAULT_LOOK, name: 'Em' } } };

describe("the mayor's letters", () => {
  it('wait until she has a name, then come, and pin a clue as she reads each', () => {
    const shy = harness();
    shy.tick(1);
    expect(shy.town.mail).toEqual([]);

    const h = harness(undefined, her);
    expect(h.tick(1)).toContainEqual({ kind: 'mail', from: 'mayor' });
    expect(h.town.mail[0]!.text).toMatch(/^Dear Em,/);
    h.town.openLetter('mayor:0');
    expect(h.tick(1)).toContainEqual({ kind: 'clue', clue: 'welcome' });
    expect(h.town.casebook.found).toEqual(['welcome']);

    h.clock.set(new Date(2026, 9, 2, 12));
    h.tick(1);
    expect(h.town.mail.map((m) => m.id)).toEqual(['mayor:0']);
    h.clock.set(new Date(2026, 9, 3, 12));
    h.tick(1);
    expect(h.town.mail.map((m) => m.id)).toEqual(['mayor:1', 'mayor:0']);
    h.town.openLetter('mayor:1');
    expect(h.town.casebook.found).toEqual(['welcome', 'typewriter']);
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
    expect(h.town.casebook.foundOn('rumour')).toBeNull();
    h.town.talk('rufus');
    expect(h.tick(1)).toContainEqual({ kind: 'clue', clue: 'rumour' });
    h.town.cabinet.record('greenOrb', '2026-09-26');
    expect(h.tick(1)).toContainEqual({ kind: 'clue', clue: 'visitorBook' });
    expect(h.tick(10)).not.toContainEqual(expect.objectContaining({ kind: 'clue' }));
  });

  it("turn up at the Moon Pie Man's cart", () => {
    for (let i = 0; i < 30; i++) {
      const date = new Date(2026, 8, 26 + i, 12);
      if (!peddlerSpot(TOWN.peddlerSpots!, date.getTime())) continue;
      const h = harness(undefined, { ...her, candy: 1000 });
      h.clock.set(date);
      h.town.shops.buy('moonPie', { item: 'moonPie' });
      expect(h.town.casebook.foundOn('wrapper')).not.toBeNull();
      return;
    }
    throw new Error('the Moon Pie Man never came');
  });
});

describe('Wes', () => {
  /** A harness at noon in a minute when Wes is out lurking somewhere she can see him. */
  function wesOut() {
    const noon = new Date(2026, 8, 26, 12).getTime();
    const first = Math.floor(noon / WES_SLOT_MS);
    for (let slot = first; slot < first + 200; slot++) {
      if (!wesLurks(slot)) continue;
      const h = harness(undefined, her);
      h.clock.set(new Date(slot * WES_SLOT_MS + 1000));
      h.tick(1);
      if (h.town.wes()) return h;
    }
    throw new Error('Wes never came out');
  }

  it('lurks at the edge of what she can see, and is gone once she gets near', () => {
    const h = wesOut();
    const wes = h.town.wes()!;
    expect(h.town.tapTile(wes.tx, wes.ty)).toBe(true);
    const events = h.until(() => h.town.wes() === null, 'Wes to scarper');
    expect(events).toContainEqual({ kind: 'clue', clue: 'button' });
    const at = tileOf(h.town.player.x, h.town.player.y);
    expect(Math.max(Math.abs(at.tx - wes.tx), Math.abs(at.ty - wes.ty))).toBeLessThanOrEqual(3);
  });

  it('leaves nothing more behind once his button is on the board', () => {
    const h = wesOut();
    h.town.casebook.pin('button', '2026-09-26');
    const wes = h.town.wes()!;
    h.town.tapTile(wes.tx, wes.ty);
    const events = h.until(() => h.town.wes() === null, 'Wes to scarper');
    expect(events).toContainEqual(expect.objectContaining({ kind: 'wesGone' }));
    expect(events).not.toContainEqual(expect.objectContaining({ kind: 'clue' }));
  });

  it('is never about while she is at home', () => {
    const h = wesOut();
    const house = h.town.map.props.find((p) => p.id === 'homeHouse')!;
    h.town.tapTile(house.tx + 1, house.ty + 1);
    h.until(() => h.town.scene === 'home', 'going in');
    expect(h.town.wes()).toBeNull();
  });
});
