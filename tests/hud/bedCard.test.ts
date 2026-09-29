import { describe, expect, it } from 'vitest';
import { bedWords } from '../../src/hud/BedCard';
import type { BedLook } from '../../src/systems/beds';

const WILD: BedLook = {
  tx: 2,
  ty: 3,
  tilled: false,
  crop: null,
  stage: null,
  days: null,
  watered: null,
  sprinkler: false,
  sprinkled: false,
  action: { kind: 'till' },
  row: 0,
};
const ROSES: BedLook = {
  ...WILD,
  tilled: true,
  crop: 'rose',
  stage: 'sprout',
  days: 2,
  action: { kind: 'water' },
};

describe("a bed's pop-up says", () => {
  it('what a wild bed and an empty one want', () => {
    expect(bedWords(WILD)).toEqual({
      title: 'A wild bed',
      status: "Dig it over, and it's ready for a seed.",
      action: 'Dig it over',
      row: null,
      unfit: null,
    });
    const empty = { ...WILD, tilled: true, watered: 'sprinkler', action: { kind: 'choose' } };
    expect(bedWords(empty as BedLook)).toMatchObject({
      title: 'An empty bed',
      status: 'Ready for a seed. Your sprinkler keeps it nice and damp.',
      action: 'Plant a seed',
    });
  });

  it('the seed in her hand, and the row when there is more than one bed to fill', () => {
    const sow: BedLook = { ...WILD, action: { kind: 'sow', seed: 'roseSeed' }, row: 4 };
    expect(bedWords(sow)).toMatchObject({ action: 'Plant a rose seed', row: 'Plant the row (4)' });
    expect(bedWords({ ...sow, row: 1 }).row).toBeNull();
  });

  it('when a crop will be ripe, and whether it has had a drink', () => {
    expect(bedWords(ROSES)).toMatchObject({
      title: 'Roses',
      status: "Ripe in 2 days. Thirsty! Water it today and it's ripe a day sooner.",
      action: 'Water it',
    });
    expect(bedWords({ ...ROSES, days: 1, watered: 'rain', action: { kind: 'wait' } })).toEqual({
      title: 'Roses',
      status: "Ripe tomorrow. The rain's watering it today. Nothing to do till tomorrow.",
      action: null,
      row: null,
      unfit: null,
    });
  });

  it('that a ripe crop is ready, and offers the sprinkler back out', () => {
    const ripe: BedLook = { ...ROSES, stage: 'ripe', days: null, action: { kind: 'pick' } };
    expect(bedWords({ ...ripe, sprinkler: true })).toEqual({
      title: 'Roses',
      status: 'Ripe and ready to pick!',
      action: 'Pick it!',
      row: null,
      unfit: 'Take the sprinkler out',
    });
  });
});
