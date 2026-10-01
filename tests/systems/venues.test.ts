import { afterEach, describe, expect, it } from 'vitest';
import { HAPPENING_IDS, HAPPENINGS, STAGE_SPOTS } from '../../src/data/happenings';
import { FAIRGROUND, PROP_FOOTPRINT } from '../../src/data/maps';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { wordsOf } from '../../src/systems/calendar';
import { placeAt, venueOf } from '../../src/systems/happenings';
import { parseMap } from '../../src/systems/grid';
import { postersOn } from '../../src/systems/notices';
import { stockOf } from '../../src/systems/shop';
import { knowFairground } from '../../src/systems/venues';

const MARKET_DAY = '2026-11-07';
const fair = parseMap(FAIRGROUND);
const key = (t: { tx: number; ty: number }) => `${t.tx},${t.ty}`;
const open = (t: { tx: number; ty: number }) =>
  !fair.props.some((p) => t.tx >= p.tx && t.tx < p.tx + p.w && t.ty >= p.ty && t.ty < p.ty + p.h) &&
  fair.tiles[t.ty * fair.width + t.tx] !== 'hedge';

describe('where the calendar’s events are (0.2 M3)', () => {
  afterEach(() => knowFairground(false));

  it('stay in town while the fairground is shut, so she can always get to them', () => {
    for (const id of HAPPENING_IDS) expect(venueOf(id).zone).not.toBe('fairground');
    expect(placeAt('costumeContest', 'rufus').place.zone).toBe('town');
    expect(placeAt('halloweenParty', 'cody').place.zone).toBe('town');
    expect(venueOf('welcomeParty').place).toBe('round the well');
  });

  it('move to the stage once it is open: the contest, the parties, the welcomes', () => {
    knowFairground(true);
    for (const id of [
      'costumeContest',
      'halloweenParty',
      'thanksgivingDinner',
      'countdown',
      'welcomeParty',
    ] as const) {
      expect(venueOf(id).zone, id).toBe('fairground');
      expect(venueOf(id).place).toMatch(/fairground/);
      for (const v of HAPPENINGS[id].who) expect(placeAt(id, v).place.zone).toBe('fairground');
    }
    // Carols stay round the town's Christmas tree, and everyday ones where they always are.
    expect(venueOf('carols').zone).toBe('town');
    expect(venueOf('bookClub').zone).toBe('library');
    expect(venueOf('spellGoneWrong').zone).toBe('town');
  });

  it('give everyone an open place of their own, apart from the line-up and the set', () => {
    knowFairground(true);
    const crowd = VILLAGER_IDS.map((v) => placeAt('halloweenParty', v).place);
    const lineUp = HAPPENINGS.costumeContest.who.map((v) => placeAt('costumeContest', v).place);
    expect(Object.keys(STAGE_SPOTS)).toHaveLength(VILLAGER_IDS.length);
    expect(new Set(crowd.map(key)).size).toBe(crowd.length);
    expect(new Set(lineUp.map(key)).size).toBe(lineUp.length);
    expect(crowd.some((t) => lineUp.some((l) => key(l) === key(t)))).toBe(false);
    const set = venueOf('halloweenParty').set.flatMap((p) => {
      const { w, h } = PROP_FOOTPRINT[p.prop];
      return Array.from({ length: w * h }, (_, i) => ({
        tx: p.tx + (i % w),
        ty: p.ty + ((i / w) | 0),
      }));
    });
    expect(set.length).toBeGreaterThan(0);
    for (const t of [...crowd, ...lineUp, ...set]) expect(open(t), key(t)).toBe(true);
    expect(set.some((t) => [...crowd, ...lineUp].some((c) => key(c) === key(t)))).toBe(false);
  });

  it("carry market day's table out to the stall, dealt the same", () => {
    const inTown = stockOf('corner', MARKET_DAY).find((s) => s.name === 'Market table');
    expect(inTown).toBeDefined();
    expect(stockOf('market', MARKET_DAY)).toEqual([]);
    expect(
      stockOf('corner', MARKET_DAY, 'morning', true).some((s) => s.name === 'Market table'),
    ).toBe(false);
    expect(stockOf('market', MARKET_DAY, 'morning', true)).toEqual([inTown]);
    expect(stockOf('market', '2026-11-08', 'morning', true)).toEqual([]);
  });

  it('say where to go, on the calendar and the noticeboard', () => {
    expect(wordsOf('marketDay').morning).toMatch(/Cobweb Corner/);
    expect(postersOn(MARKET_DAY, 9)[0]!.line).toMatch(/Cobweb Corner/);
    knowFairground(true);
    expect(wordsOf('marketDay').morning).toMatch(/fairground/);
    expect(postersOn(MARKET_DAY, 9)[0]!.line).toMatch(/market stall/);
    const halloween = postersOn('2026-10-31', 12);
    expect(halloween.map((p) => p.name)).toEqual(['The costume contest', 'The Halloween party']);
    expect(halloween[0]!.line).toBe("6pm to 8pm, at the fairground's stage");
    expect(postersOn('2026-10-31', 21).map((p) => p.name)).toEqual(['The Halloween party']);
  });
});
