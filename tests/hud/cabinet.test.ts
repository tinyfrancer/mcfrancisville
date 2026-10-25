import { describe, expect, it } from 'vitest';
import { nextOf, whenAndWhere } from '../../src/hud/CabinetSheet';
import { isVisitDay } from '../../src/systems/critters';

describe("the Curiosity Cabinet's hints (0.2's F1)", () => {
  it('say how rare, when, where and which months', () => {
    expect(whenAndWhere('pumpkinBat')).toBe(
      'Common. 5pm–10pm, by the pumpkins at the fairground, in October and November, and the day ' +
        'after each full or new moon',
    );
    expect(whenAndWhere('lilyFrog')).toMatch(
      /from March to August, and the day after each full or new moon$/,
    );
    expect(whenAndWhere('ghostMinnow')).toMatch(/^Common\. All day, .*all year$/);
  });

  it("name a legendary one's moment: its weather, or the full moon", () => {
    expect(whenAndWhere('axolotl')).toBe(
      'Legendary. 4pm–midnight on rainy days, by the frozen creek in Whisperwood, all year, and ' +
        'the day after each full or new moon whatever the weather',
    );
    expect(whenAndWhere('blueMoonfish')).toMatch(/^Legendary\. .* on the night of a full moon, /);
    expect(whenAndWhere('blueMoonfish')).toMatch(/all year$/);
  });
});

describe("the Cabinet's next chance (V1's R5, decision 310)", () => {
  it('names a holiday critter by its holiday, and says it comes round after', () => {
    expect(whenAndWhere('lovebug')).toMatch(
      /^Common\. 8am–7pm, among the flowers in town, .*, for Valentine's Day, and the day after each full or new moon$/,
    );
    expect(whenAndWhere('baubleBeetle')).toMatch(/for Christmas, and the day after/);
  });

  it('says when the next chance is, if not today', () => {
    // The new moon is on 9 December 2026 and the full moon on the 24th, so out of season the
    // pumpkin toad visits on the 10th, and then on the 25th (1.3's F1, decision 360).
    expect(whenAndWhere('pumpkinToad', { day: '2026-12-02', hour: 12 })).toMatch(
      /; next on the 10th$/,
    );
    expect(whenAndWhere('pumpkinToad', { day: '2026-12-11', hour: 12 })).toMatch(
      /; next on the 25th$/,
    );
    expect(nextOf('pumpkinBat', { day: '2027-01-30', hour: 12 })).toBe(
      '; next on the 7th of February',
    );
    expect(nextOf('pumpkinBat', { day: '2027-01-02', hour: 12 })).toBe('; next on the 8th');
    expect(nextOf('pumpkinBat', { day: '2027-01-10', hour: 12 })).toBe('; next on the 23rd');
    expect(isVisitDay('2027-01-23')).toBe(true);
    expect(nextOf('pumpkinBat', { day: '2027-01-22', hour: 12 })).toBe('; next tomorrow');
    expect(nextOf('pumpkinBat', { day: '2027-01-23', hour: 12 })).toBe('; visiting today');
    expect(nextOf('pumpkinBat', { day: '2026-10-07', hour: 12 })).toBe('');
    expect(nextOf('skullBeetle', { day: '2026-10-07', hour: 22 })).toBe('; next tomorrow');
    expect(nextOf('ghostMinnow', { day: '2026-10-07', hour: 22 })).toBe('');
  });
});
