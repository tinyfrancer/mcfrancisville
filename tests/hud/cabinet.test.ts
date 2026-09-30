import { describe, expect, it } from 'vitest';
import { whenAndWhere } from '../../src/hud/CabinetSheet';

describe("the Curiosity Cabinet's hints (0.2's F1)", () => {
  it('say how rare, when, where and which months', () => {
    expect(whenAndWhere('pumpkinBat')).toBe(
      'Common. 5pm–10pm, by the pumpkins in town or up at the castle, in October and November',
    );
    expect(whenAndWhere('lilyFrog')).toMatch(/from March to August$/);
    expect(whenAndWhere('ghostMinnow')).toMatch(/^Common\. All day, .*all year$/);
  });

  it("name a legendary one's moment: its weather, or the full moon", () => {
    expect(whenAndWhere('axolotl')).toBe(
      'Legendary. 4pm–midnight on rainy days, by the frozen creek in Whisperwood, all year',
    );
    expect(whenAndWhere('blueMoonfish')).toMatch(/^Legendary\. .* on the night of a full moon, /);
  });
});
