import { describe, expect, it } from 'vitest';
import { TOWN } from '../../src/data/maps';
import { VILLAGERS, type Stop } from '../../src/data/villagers';
import { parseMap } from '../../src/systems/grid';
import {
  favourCandy,
  favourOf,
  giftLine,
  heartsOf,
  letterOf,
  lineFor,
  reactionTo,
  rewardsBetween,
  specialDayOf,
  specialLetterId,
  stopAt,
  stopOf,
  welcomeLine,
  yearsMarried,
} from '../../src/systems/friendship';

describe('hearts', () => {
  it('are a hundred points each, up to ten', () => {
    expect(heartsOf(0)).toBe(0);
    expect(heartsOf(99)).toBe(0);
    expect(heartsOf(100)).toBe(1);
    expect(heartsOf(1000)).toBe(10);
    expect(heartsOf(5000)).toBe(10);
  });

  it('bring each reward once, as a friendship passes it', () => {
    expect(rewardsBetween('maude', 250, 310).map((r) => r.hearts)).toEqual([3]);
    expect(rewardsBetween('maude', 300, 350)).toEqual([]);
    expect(rewardsBetween('maude', 0, 1000).map((r) => r.hearts)).toEqual([3, 6, 10]);
  });
});

describe('gifts', () => {
  it('are loved, liked or kindly taken, and every bracelet is loved by everyone', () => {
    expect(reactionTo('rufus', 'blueRose')).toBe('loved');
    expect(reactionTo('rufus', 'moonpetal')).toBe('liked');
    expect(reactionTo('rufus', 'stone')).toBe('fine');
    for (const id of Object.keys(VILLAGERS) as (keyof typeof VILLAGERS)[]) {
      expect(reactionTo(id, 'friendshipBracelet'), id).toBe('loved');
    }
  });

  it("get Cody's own words for a burrito bowl and a bracelet", () => {
    expect(giftLine('cody', 'burritoBowl')).toBe('chipotle is mah liiiiffeee');
    expect(giftLine('cody', 'loveBracelet')).toBe("You're my orb.");
    expect(giftLine('maude', 'loveBracelet')).toBe(VILLAGERS.maude.reactions.loved);
  });
});

describe('where villagers are', () => {
  it('follows their schedule, the last stop running on past midnight', () => {
    const [first, , , last] = VILLAGERS.cody.schedule;
    const at = (s: Stop) => stopAt(s);
    expect(stopOf('cody', first!.from, '2026-09-27')).toEqual(at(first!));
    expect(stopOf('cody', 23.5, '2026-09-27')).toEqual(at(last!));
    expect(stopOf('cody', 2, '2026-09-27')).toEqual(at(last!));
  });

  it('can be somewhere beyond the town', () => {
    expect(stopOf('rufus', 7, '2026-09-27').zone).toBe('whisperwood');
    expect(stopOf('rufus', 12, '2026-09-27').zone).toBe('town');
  });

  it('is the party at the square on her birthday', () => {
    const party = stopOf('maude', 10, '2027-04-09');
    expect(party).not.toEqual(stopOf('maude', 10, '2027-04-10'));
    const well = parseMap(TOWN).props.find((p) => p.id === 'well')!;
    expect(Math.abs(party.tx - well.tx)).toBeLessThanOrEqual(2);
    expect(Math.abs(party.ty - well.ty)).toBeLessThanOrEqual(2);
  });
});

describe('favours', () => {
  it('are the same all day, and asked by about a third of the town', () => {
    expect(favourOf('barty', '2026-09-27')).toEqual(favourOf('barty', '2026-09-27'));
    let asked = 0;
    for (let d = 1; d <= 28; d++) {
      const day = `2026-10-${String(d).padStart(2, '0')}`;
      for (const id of Object.keys(VILLAGERS) as (keyof typeof VILLAGERS)[]) {
        if (favourOf(id, day)) asked += 1;
      }
    }
    expect(asked / (28 * 6)).toBeGreaterThan(0.2);
    expect(asked / (28 * 6)).toBeLessThan(0.5);
  });

  it('pay more than what she hands over would sell for', () => {
    expect(favourCandy({ item: 'wood', count: 5, ask: '' })).toBeGreaterThan(5 * 4);
  });
});

describe('special days', () => {
  it('fall on the day keys of 04-08, 04-09 and 06-06', () => {
    expect(specialDayOf('2027-04-08')).toBe('earlyBirthday');
    expect(specialDayOf('2027-04-09')).toBe('birthday');
    expect(specialDayOf('2027-06-06')).toBe('anniversary');
    expect(specialDayOf('2027-06-07')).toBeNull();
  });

  it('count the years since 2020, from the anniversary on', () => {
    expect(yearsMarried('2026-06-05')).toBe(5);
    expect(yearsMarried('2026-06-06')).toBe(6);
    expect(yearsMarried('2026-12-25')).toBe(6);
  });

  it('say their line first, and then the usual ones', () => {
    const context = { hearts: 0, day: '2027-04-08', hour: 12, talks: 0 };
    expect(lineFor('cody', context)).toMatch(/Happy birthday/);
    expect(lineFor('agatha', context)).toMatch(/tomorrow/);
    expect(VILLAGERS.cody.lines.hello).toContain(lineFor('cody', { ...context, talks: 1 }));
  });

  it('bring a letter a year, on the birthday and the anniversary', () => {
    expect(specialLetterId('2027-04-09')).toBe('birthday:2027');
    expect(specialLetterId('2027-06-06')).toBe('anniversary:2027');
    expect(specialLetterId('2027-04-08')).toBeNull();
    expect(letterOf('birthday:2027')?.gift).toEqual({ furniture: 'birthdayCake' });
  });
});

describe('letters', () => {
  it('are found by their ids, and an unknown one is nothing', () => {
    expect(letterOf('cody:3')?.gift).toEqual({ item: 'recordWalkTheTomb' });
    expect(letterOf('cody:4')).toBeNull();
    expect(letterOf('nobody:3')).toBeNull();
    expect(letterOf('rubbish')).toBeNull();
  });
});

describe("Cody's welcome back", () => {
  const day = '2026-09-27';
  it('depends on how long she has been away', () => {
    const hour = 3_600_000;
    expect(welcomeLine(5 * 60_000, day, 'Em')).toMatch(/Back already/);
    expect(welcomeLine(2 * hour, day, 'Em')).toMatch(/didn't miss you/);
    expect(welcomeLine(12 * hour, day, 'Em')).toMatch(/boring without you/);
    expect(welcomeLine(3 * 24 * hour, day, 'Em')).toMatch(/3 days/);
    expect(welcomeLine(8 * 24 * hour, day, 'Em')).toMatch(/8 days/);
    expect(welcomeLine(30 * 24 * hour, day, 'Em')).toMatch(/4 weeks/);
  });

  it("is the day's own on a special day", () => {
    expect(welcomeLine(60_000, '2027-06-06', 'Em')).toMatch(/7 years/);
  });
});
