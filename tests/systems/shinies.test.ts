import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS, type Rarity } from '../../src/data/critters';
import { ITEMS } from '../../src/data/items';
import { TOWN } from '../../src/data/maps';
import { ITEM_VALUE } from '../../src/data/shop';
import { isShiny, plainOf, SHINY_IDS, shinyName, shinyOf } from '../../src/data/shinies';
import { ZONE_IDS, ZONES } from '../../src/data/zones';
import { CRITTER_ART, SHINY_ART } from '../../src/sprites/critters';
import { SHINIES, shinePalette } from '../../src/sprites/critterLooks';
import { ITEM_ART } from '../../src/sprites/items';
import { PALETTE } from '../../src/sprites/palette';
import { shiftDay } from '../../src/systems/calendar';
import {
  crittersOut,
  isCharmed,
  isShinyDeal,
  placeHabitats,
  SHINY_CHARM_DAYS,
  SHINY_ONE_IN,
  townHabitats,
} from '../../src/systems/critters';
import { parseMap } from '../../src/systems/grid';
import type { MapZoneId } from '../../src/types/ids';

/*
 * 1.4's G1 (decision 370): the shinies. A critter dealt into a slot is shiny by a roll of its own
 * from the day, the place, the hour and the slot, about one in twelve for a common one up to one
 * in forty for a legendary; never which critter, only its colours.
 */

const PLACES = ZONE_IDS.filter((id): id is MapZoneId => ZONES[id].map !== undefined).map((id) => {
  const map = parseMap(id === 'town' ? TOWN : ZONES[id].map!);
  return { id, habitats: id === 'town' ? townHabitats(map, true) : placeHabitats(id, map) };
});

describe('dealing the shinies', () => {
  it('deals each tier at its rate, within a third, over a year of every place and hour', () => {
    const seen: Record<Rarity, { all: number; shiny: number }> = {
      common: { all: 0, shiny: 0 },
      uncommon: { all: 0, shiny: 0 },
      rare: { all: 0, shiny: 0 },
      legendary: { all: 0, shiny: 0 },
    };
    for (let d = 0; d < 365; d++) {
      const day = shiftDay('2026-10-01', d);
      for (const place of PLACES) {
        for (let hour = 0; hour < 24; hour++) {
          for (const c of crittersOut(day, hour, place.habitats, undefined, place.id)) {
            const tier = seen[CRITTERS[c.critter].rarity];
            tier.all++;
            if (c.shiny) tier.shiny++;
          }
        }
      }
    }
    for (const rarity of Object.keys(seen) as Rarity[]) {
      const { all, shiny } = seen[rarity];
      const rate = shiny / all;
      const target = 1 / SHINY_ONE_IN[rarity];
      expect(rate, `${rarity}: ${shiny} of ${all}`).toBeGreaterThan(target * 0.7);
      expect(rate, `${rarity}: ${shiny} of ${all}`).toBeLessThan(target * 1.3);
    }
  }, 60_000);

  it('deals the same shinies to anyone who looks, and never changes which critter comes out', () => {
    const town = PLACES.find((p) => p.id === 'town')!;
    for (let d = 0; d < 30; d++) {
      const day = shiftDay('2027-01-01', d);
      const first = crittersOut(day, 21, town.habitats);
      expect(crittersOut(day, 21, town.habitats)).toEqual(first);
      for (const c of first) {
        expect(c.shiny === true).toBe(isShinyDeal(day, 21, c.slot, c.critter));
      }
    }
  });

  it('charms a kind nine months in her Cabinet with no shiny, until she has one', () => {
    const first = '2026-10-01';
    expect(isCharmed(first, false, shiftDay(first, SHINY_CHARM_DAYS - 1))).toBe(false);
    expect(isCharmed(first, false, shiftDay(first, SHINY_CHARM_DAYS))).toBe(true);
    expect(isCharmed(first, true, shiftDay(first, SHINY_CHARM_DAYS))).toBe(false);
    expect(isCharmed(null, false, shiftDay(first, 999))).toBe(false);
  });
});

describe('the shinies’ looks', () => {
  it('gives every critter a shine, by palette alone, its eyes and ink kept', () => {
    expect(Object.keys(SHINIES).sort()).toEqual([...CRITTER_IDS].sort());
    for (const id of CRITTER_IDS) {
      const plain = CRITTER_ART[id];
      const shiny = SHINY_ART[id];
      expect(shiny.world, id).toBe(plain.world);
      expect(shiny.frames, id).toBe(plain.frames);
      expect(Object.keys(shiny.palette).sort(), id).toEqual(Object.keys(plain.palette).sort());
      const changed = Object.keys(plain.palette).filter(
        (k) => plain.palette[k] !== shiny.palette[k],
      );
      expect(changed.length, id).toBeGreaterThan(0);
      for (const key of ['e', 'E', 'F']) {
        if (key in plain.palette)
          expect(shiny.palette[key], `${id} ${key}`).toBe(plain.palette[key]);
      }
      for (const [key, colour] of Object.entries(plain.palette)) {
        if (colour === PALETTE.ink) expect(shiny.palette[key], `${id} ${key}`).toBe(PALETTE.ink);
      }
      if (plain.glow)
        expect(Object.keys(shiny.glow!).sort()).toEqual(Object.keys(plain.glow).sort());
    }
  });

  it('keeps what a shine says to keep', () => {
    const palette = { '.': null, o: PALETTE.ink, W: PALETTE.luna, l: PALETTE.candle };
    const shone = shinePalette(palette, { gem: 'rose', keep: 'l' });
    expect(shone.l).toBe(PALETTE.candle);
    expect(shone.o).toBe(PALETTE.ink);
    expect(shone.W).not.toBe(PALETTE.luna);
  });
});

describe('a shiny in her bag', () => {
  it('is a critter of its own, named for its plain self, worth twice as much, with its icon', () => {
    expect(SHINY_IDS).toHaveLength(CRITTER_IDS.length);
    for (const id of CRITTER_IDS) {
      const shiny = shinyOf(id);
      expect(isShiny(shiny)).toBe(true);
      expect(isShiny(id)).toBe(false);
      expect(plainOf(shiny)).toBe(id);
      expect(ITEMS[shiny].kind).toBe('critter');
      expect(ITEMS[shiny].name).toBe(shinyName(id));
      expect(ITEM_VALUE[shiny]).toBe(ITEM_VALUE[id] * 2);
      expect(ITEM_ART[shiny], shiny).toBeDefined();
    }
    expect(shinyName('lunaMoth')).toBe('Shiny luna moth');
    expect(shinyName('herculesBeetle')).toBe('Shiny Hercules beetle');
  });
});
