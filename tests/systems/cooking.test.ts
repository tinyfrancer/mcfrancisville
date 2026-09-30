import { describe, expect, it } from 'vitest';
import { CRITTERS } from '../../src/data/critters';
import { DISH_IDS, DISHES, effectOf } from '../../src/data/dishes';
import { ITEMS } from '../../src/data/items';
import { RECIPES } from '../../src/data/recipes';
import { lasts, lureKey, luredCritter } from '../../src/systems/cooking';
import { VILLAGERS } from '../../src/data/villagers';

const at = (hour: number, minute = 0) => new Date(2026, 8, 26, hour, minute).getTime();

describe('dishes', () => {
  it('are each a dish in her bag, cooked from a recipe of the same name', () => {
    for (const id of DISH_IDS) {
      expect(ITEMS[id].kind, id).toBe('dish');
      expect(RECIPES[id].at, id).toBe('stove');
      expect(RECIPES[id].makes, id).toEqual({ item: id });
    }
  });

  it('lure every family but the fish, and perk her up or bring the fish in otherwise', () => {
    const lured = DISH_IDS.flatMap((id) => {
      const effect = DISHES[id].effect;
      return typeof effect === 'object' ? [effect.lure] : [];
    });
    expect(new Set(lured)).toEqual(new Set(['moth', 'bat', 'frog', 'orb', 'beetle']));
    expect(DISH_IDS.some((id) => DISHES[id].effect === 'bites')).toBe(true);
    expect(DISH_IDS.some((id) => DISHES[id].effect === 'pep')).toBe(true);
  });

  it('are loved by someone, every one', () => {
    for (const id of DISH_IDS) {
      expect(
        Object.values(VILLAGERS).some((v) => v.loves.includes(id)),
        id,
      ).toBe(true);
    }
  });

  it('can be eaten, and so can a snack or a treat, but not a seed', () => {
    expect(effectOf('pumpkinSoup')).toBe('pep');
    expect(effectOf('moonpetalCake')).toEqual({ lure: 'moth' });
    expect(effectOf('midnightPizza')).toBe('pep');
    expect(effectOf('purseButter')).toBe('pep');
    expect(effectOf('pumpkinSeed')).toBeNull();
    expect(effectOf('pumpkin')).toBeNull();
  });
});

describe('what eating does', () => {
  it('lasts until the window turns', () => {
    expect(lasts(null, at(12))).toBe(false);
    expect(lasts(at(12), at(17, 59))).toBe(true);
    expect(lasts(at(12), at(18))).toBe(false);
    // An evening's lasts past midnight, until 5am.
    expect(lasts(at(22), at(22) + 5 * 3_600_000)).toBe(true);
    expect(lasts(at(22), at(22) + 7 * 3_600_000)).toBe(false);
  });

  it('lures one of the family that lives in the place, out now and not yet caught first', () => {
    const anywhere = () => true;
    const noon = at(12);
    const beetle = luredCritter('beetle', 'town', noon, noon, () => false, anywhere);
    expect(beetle && CRITTERS[beetle].family).toBe('beetle');
    // At noon at the castle the skull, jewel and moss beetles and the ladybug are out; with three
    // caught, the fourth.
    const caught = (id: string) => ['skullBeetle', 'mossBeetle', 'ladybug'].includes(id);
    expect(luredCritter('beetle', 'castleHill', noon, noon, caught, anywhere)).toBe('jewelBeetle');
    // In town the fireflies are out of season in September, so never lured, even uncaught.
    for (const hour of [12, 21]) {
      const later = at(hour);
      const lured = luredCritter(
        'beetle',
        'town',
        later,
        later,
        (id) => id !== 'firefly',
        anywhere,
      );
      expect(lured).not.toBe('firefly');
    }
    // The wishing moth lives only in the hidden clearing.
    const moth = luredCritter('moth', 'hiddenClearing', noon, noon, () => false, anywhere);
    expect(CRITTERS[moth!].where).toContain('hiddenClearing');
    expect(luredCritter('orb', 'castleHill', noon, noon, () => false, anywhere)).toBeNull();
    expect(
      luredCritter(
        'beetle',
        'town',
        noon,
        noon,
        () => false,
        () => false,
      ),
    ).toBeNull();
  });

  it('never lures a legendary one, which waits on its own moment', () => {
    const late = at(23, 30);
    const caught = (id: string) => id !== 'orbPair' && id !== 'wishingMoth';
    const anywhere = () => true;
    expect(luredCritter('orb', 'town', late, late, caught, anywhere)).not.toBe('orbPair');
    expect(luredCritter('moth', 'hiddenClearing', late, late, caught, anywhere)).not.toBe(
      'wishingMoth',
    );
  });

  it('is the same for the same meal in the same place', () => {
    const one = luredCritter(
      'moth',
      'town',
      at(21),
      at(21, 30),
      () => false,
      () => true,
    );
    expect(
      luredCritter(
        'moth',
        'town',
        at(21),
        at(21, 30),
        () => false,
        () => true,
      ),
    ).toBe(one);
    expect(lureKey(at(21))).toBe(`lure:${at(21)}`);
  });
});
