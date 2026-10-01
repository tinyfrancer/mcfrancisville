import { describe, expect, it } from 'vitest';
import { HAPPENINGS } from '../../src/data/happenings';
import { SMALL_TALK } from '../../src/data/smallTalk';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { aCritter, comingUp, smallTalk, type TalkScene } from '../../src/systems/dialogue';
import { lineFor, specialDayOf } from '../../src/systems/friendship';
import { SPECIAL_LINES } from '../../src/data/specialDays';
import { DOLLY_MONARCHS, happeningOn, monarchsOn } from '../../src/systems/calendar';
import { musicFor } from '../../src/audio/music';

const CLEAR: TalkScene = {
  weather: 'clear',
  storm: false,
  holding: 'hands',
  caught: null,
  pet: null,
};
// A Wednesday with nothing on but book club in the evening.
const DAY = '2027-03-10';

describe("what the neighbours bring up (0.2's D2)", () => {
  it('is her day, by the window, when nothing else is going on', () => {
    expect(smallTalk('barty', CLEAR, DAY, 9)).toEqual([SMALL_TALK.morning.barty]);
    expect(smallTalk('barty', CLEAR, DAY, 14)).toEqual([SMALL_TALK.afternoon.barty]);
    expect(smallTalk('barty', CLEAR, DAY, 20)).toEqual([SMALL_TALK.evening.barty]);
  });

  it('puts the sky first, then what she caught, her pet and what she holds', () => {
    const scene: TalkScene = {
      weather: 'rain',
      storm: false,
      holding: 'net',
      caught: 'axolotl',
      pet: 'Fibi',
    };
    const said = smallTalk('rufus', scene, DAY, 9);
    expect(said[0]).toBe(SMALL_TALK.rain.rufus);
    expect(said[1]).toContain('an axolotl');
    expect(said[2]).toContain('Fibi');
    expect(said[3]).toBe(SMALL_TALK.net.rufus);
    expect(said[4]).toBe(SMALL_TALK.morning.rufus);
  });

  it('knows a storm from rain, and fog', () => {
    const storm = { ...CLEAR, weather: 'rain' as const, storm: true };
    expect(smallTalk('cody', storm, DAY, 9)[0]).toBe(SMALL_TALK.storm.cody);
    expect(smallTalk('cody', storm, DAY, 9)).not.toContain(SMALL_TALK.rain.cody);
    expect(smallTalk('cody', { ...CLEAR, weather: 'fog' }, DAY, 9)[0]).toBe(SMALL_TALK.fog.cody);
  });

  it('knows a seed in her hand from a sprinkler', () => {
    expect(smallTalk('barty', { ...CLEAR, holding: 'pumpkinSeed' }, DAY, 9)[0]).toBe(
      SMALL_TALK.seed.barty,
    );
    expect(smallTalk('barty', { ...CLEAR, holding: 'sprinkler' }, DAY, 9)).toHaveLength(1);
  });

  it('asks her along to a happening of theirs later today, and not once it has begun', () => {
    const on = HAPPENINGS.bookClub;
    expect(on.who).toContain('maude');
    expect(comingUp('maude', DAY, 12)).toBe('bookClub');
    expect(comingUp('maude', DAY, on.from)).toBeNull();
    expect(comingUp('barty', DAY, 12)).toBeNull();
    const said = smallTalk('maude', CLEAR, DAY, 12);
    expect(said[0]).toContain('book club');
    expect(said[0]).toContain(on.place);
  });

  it('speaks of a critter with its "a"', () => {
    expect(aCritter('candleMoth')).toBe('a candle moth');
    expect(aCritter('owlEyeMoth')).toBe('an owl-eye moth');
    expect(aCritter('herculesBeetle')).toBe('a Hercules beetle');
  });

  it('comes before their own lines, every other talk at most, each once a day', () => {
    const scene: TalkScene = { ...CLEAR, weather: 'rain', holding: 'rod' };
    const topical = smallTalk('nessa', scene, DAY, 9);
    const said: string[] = [];
    for (let talks = 0; talks < 8; talks++) {
      said.push(lineFor('nessa', { hearts: 0, day: DAY, hour: 9, talks, said, scene }));
    }
    expect(said.filter((l) => topical.includes(l))).toEqual(topical);
    expect(said[0]).toBe(SMALL_TALK.rain.nessa);
    expect(topical).not.toContain(said[1]);
    expect(said[2]).toBe(SMALL_TALK.rod.nessa);
    expect(new Set(said).size).toBe(said.length);
  });

  it("gives way to the day's own line first on a special day", () => {
    const scene: TalkScene = { ...CLEAR, weather: 'rain' };
    const first = lineFor('cody', { hearts: 0, day: '2027-04-08', hour: 9, talks: 0, scene });
    expect(first).toMatch(/birthday/);
  });

  it('has a line on every topic from every neighbour, each their own', () => {
    for (const [topic, lines] of Object.entries(SMALL_TALK)) {
      for (const id of VILLAGER_IDS) expect(lines[id], `${id} ${topic}`).toBeTruthy();
    }
    const all = Object.values(SMALL_TALK).flatMap((lines) => Object.values(lines));
    expect(new Set(all).size).toBe(all.length);
  });

  it('says rainy days are good days', () => {
    for (const id of VILLAGER_IDS) {
      expect(SMALL_TALK.rain[id], id).not.toMatch(/\b(?:shame|awful|horrid|miserable|ugh)\b/i);
    }
  });
});

describe("her song day and Dolly Parton day (0.2's D2)", () => {
  it('are special days, with a line from everyone first and a mark on the calendar', () => {
    expect(specialDayOf('2027-09-21')).toBe('septemberSong');
    expect(specialDayOf('2027-09-25')).toBe('dollyDay');
    for (const id of VILLAGER_IDS) {
      expect(lineFor(id, { hearts: 0, day: '2027-09-21', hour: 9, talks: 0 })).toBe(
        SPECIAL_LINES.septemberSong[id],
      );
      expect(SPECIAL_LINES.dollyDay[id], id).toMatch(/Dolly/);
    }
    expect(happeningOn('2027-09-25')).toContain('dollyDay');
  });

  it('play a tune of its own in town on the 21st, and fill every place with monarchs on the 25th', () => {
    const occasion = { festivals: [], decor: null, fountain: false };
    expect(musicFor('town', 'morning', { ...occasion, special: 'septemberSong' })).toBe(
      'septemberSong@morning',
    );
    expect(musicFor('whisperwood', 'morning', { ...occasion, special: 'septemberSong' })).toBe(
      'whisperwood@morning',
    );
    expect(musicFor('town', 'morning', { ...occasion, special: 'dollyDay' })).toBe('town@morning');
    expect(monarchsOn('2027-09-25', 0)).toBe(DOLLY_MONARCHS);
    expect(monarchsOn('2027-09-25', 20)).toBe(20);
    expect(monarchsOn('2027-09-24', 0)).toBe(0);
  });
});
