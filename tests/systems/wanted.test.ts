import { describe, expect, it } from 'vitest';
import { CRITTERS } from '../../src/data/critters';
import { TOWN } from '../../src/data/maps';
import { ITEM_VALUE } from '../../src/data/shop';
import { WANTED_CRITTERS, WANTED_CROPS, WANTED_DISHES, WANTED_PAYS } from '../../src/data/wanted';
import { nextDay, weekOf } from '../../src/systems/calendar';
import { dayKey } from '../../src/systems/clock';
import { paysOn, wantedOn } from '../../src/systems/shop';
import type { CritterId } from '../../src/types/ids';
import { harness } from '../world/harness';

describe("Cobweb Corner's wanted list (0.2's E1)", () => {
  it('is a critter, a crop and a dish, the same all week and new each Monday', () => {
    let day = '2026-10-05';
    const week = wantedOn(day);
    expect(WANTED_CRITTERS).toContain(week[0]);
    expect(WANTED_CROPS).toContain(week[1]);
    expect(WANTED_DISHES).toContain(week[2]);
    for (let i = 0; i < 6; i++) {
      day = nextDay(day);
      expect(wantedOn(day)).toEqual(week);
    }
    const weeks = new Set<string>();
    for (let i = 0; i < 70; i++) {
      day = nextDay(day);
      if (weekOf(day) === day) weeks.add(wantedOn(day).join());
    }
    expect(weeks.size).toBeGreaterThan(5);
  });

  it('wants only critters out in town in every season, weather and moon', () => {
    for (const id of WANTED_CRITTERS) {
      const c = CRITTERS[id as CritterId];
      expect(c.where, id).toContain('town');
      expect(c.season ?? c.weather ?? c.moon, id).toBeUndefined();
    }
    expect(WANTED_DISHES).toContain('fishChowder');
    expect(WANTED_DISHES).not.toContain('midnightPlate');
  });

  it('pays double for what it wants, and the usual for the rest', () => {
    const day = '2026-10-05';
    const [critter, crop] = wantedOn(day) as [CritterId, string];
    expect(paysOn(critter, day)).toBe(WANTED_PAYS * ITEM_VALUE[critter]);
    expect(paysOn('wood', day)).toBe(ITEM_VALUE.wood);
    expect(crop).toBeTruthy();
  });

  it('pays her double at the counter', () => {
    const h = harness(TOWN);
    const [, crop] = h.world.shops.wanted();
    h.world.bag.add(crop!, 2);
    const before = h.world.wallet.candy;
    expect(h.world.shops.sell(crop!, 2)).toMatchObject({ candy: 4 * ITEM_VALUE[crop!] });
    expect(h.world.wallet.candy).toBe(before + 4 * ITEM_VALUE[crop!]);
    expect(h.world.shops.wanted()).toEqual(wantedOn(dayKey(h.clock.now())));
  });
});
