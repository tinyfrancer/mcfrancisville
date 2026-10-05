import { describe, expect, it } from 'vitest';
import { CRITTER_IDS, CRITTERS, isFish, type Habitat } from '../../src/data/critters';
import { ITEMS } from '../../src/data/items';
import { MUSEUM_LETTERS } from '../../src/data/museum';
import { TOWN } from '../../src/data/maps';
import { ZONE_IDS, ZONES } from '../../src/data/zones';
import { ITEM_VALUE } from '../../src/data/shop';
import { isFullMoon } from '../../src/systems/calendar';
import { dayKey } from '../../src/systems/clock';
import {
  CRITTERS_PER_HOUR,
  FISH_PER_HOUR,
  RAIN_FISH,
  crittersOut,
  flutterTo,
  habitatsOf,
  hoursOf,
  inSeason,
  isAbout,
  isOut,
  isMoonlit,
  MOON_BOUND_WEIGHT,
  likesWeather,
  weightOf,
  placeHabitats,
  townHabitats,
  type Habitats,
} from '../../src/systems/critters';
import { parseMap, tileAt, walkable } from '../../src/systems/grid';
import { findPath, type Tile } from '../../src/systems/pathfinding';
import type { CritterId, MapZoneId } from '../../src/types/ids';
import { tinyMap } from '../world/harness';

const map = parseMap(TOWN);
const habitats = townHabitats(map, true);

/** Every place outdoors beyond the town (phase I), with its map and habitats. */
const BEYOND = ZONE_IDS.filter(
  (id): id is MapZoneId => id !== 'town' && ZONES[id].map !== undefined,
).map((id) => {
  const m = parseMap(ZONES[id].map!);
  return { id, map: m, habitats: placeHabitats(id, m) };
});
const PLACES: { id: MapZoneId; map: typeof map; habitats: Habitats }[] = [
  { id: 'town', map, habitats },
  ...BEYOND,
];

/** Two months of day keys. */
const DAYS = Array.from({ length: 60 }, (_, i) => dayKey(new Date(2026, 8, 26 + i, 12).getTime()));

/** A day in every four through a year, for what only a season brings out. */
const YEAR = Array.from({ length: 92 }, (_, i) =>
  dayKey(new Date(2026, 8, 26 + i * 4, 12).getTime()),
);

describe('when critters are out', () => {
  it('reads their hours round midnight', () => {
    expect(isOut('lunaMoth', 20)).toBe(true);
    expect(isOut('lunaMoth', 3.9)).toBe(true);
    expect(isOut('lunaMoth', 4)).toBe(false);
    expect(isOut('lunaMoth', 12)).toBe(false);
    expect(isOut('lilyFrog', 6)).toBe(true);
    expect(isOut('lilyFrog', 19)).toBe(false);
    for (let h = 0; h < 24; h++) expect(isOut('ghostMinnow', h)).toBe(true);
    expect(isOut('firefly', 23.5)).toBe(true);
    expect(isOut('firefly', 0)).toBe(false);
  });

  it('says their hours as a clock would', () => {
    expect(hoursOf('lunaMoth')).toBe('8pm–4am');
    expect(hoursOf('ghostMinnow')).toBe('All day');
    expect(hoursOf('firefly')).toBe('7pm–midnight');
    expect(hoursOf('skullBeetle')).toBe('6am–7pm');
  });

  it('keeps the luna moth and the orbs to the night', () => {
    for (const id of ['lunaMoth', 'greenOrb', 'blueOrb', 'orbPair'] as CritterId[]) {
      for (let h = 7; h < 19; h++) expect(isOut(id, h), `${id} ${h}:00`).toBe(false);
    }
  });

  it('has at least four kinds about at every hour, day or night', () => {
    for (let h = 0; h < 24; h++) {
      const about = CRITTER_IDS.filter((id) => isOut(id, h));
      expect(about.length, `${h}:00`).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('the critters', () => {
  it('are each something for her bag, with a value', () => {
    for (const id of CRITTER_IDS) {
      expect(ITEMS[id].kind).toBe('critter');
      expect(ITEMS[id].name).toBe(CRITTERS[id].name);
      expect(ITEM_VALUE[id]).toBeGreaterThan(0);
    }
  });

  it('number between thirty and sixty-four, a luna moth, and green, blue and paired orbs', () => {
    expect(CRITTER_IDS.length).toBeGreaterThanOrEqual(30);
    expect(CRITTER_IDS.length).toBeLessThanOrEqual(64);
    expect(CRITTERS.orbPair.rarity).toBe('legendary');
    expect(CRITTERS.orbPair.description).toMatch(/green/);
    expect(CRITTERS.orbPair.description).toMatch(/blue/);
    expect(CRITTERS.lunaMoth.family).toBe('moth');
  });

  it('live somewhere, and some only in one place: the wishing moth, the monarch', () => {
    for (const id of CRITTER_IDS) expect(CRITTERS[id].where.length, id).toBeGreaterThan(0);
    expect(CRITTERS.wishingMoth.where).toEqual(['hiddenClearing']);
    expect(CRITTERS.monarch.where).toEqual(['castleHill']);
  });

  it("fill every case at the museum when the last of Wrapunzel's letters comes", () => {
    expect(MUSEUM_LETTERS.at(-1)!.donated).toBe(CRITTER_IDS.length);
  });

  it('are only wary when they are rare or legendary', () => {
    for (const id of CRITTER_IDS) {
      if (CRITTERS[id].wary > 0) expect(['rare', 'legendary'], id).toContain(CRITTERS[id].rarity);
    }
  });
});

describe('critters in the weather', () => {
  /** Every critter dealt in town through the year, at every hour, in one weather. */
  const dealtIn = (weather: 'clear' | 'rain' | 'fog') =>
    YEAR.flatMap((day) =>
      Array.from({ length: 24 }, (_, h) =>
        crittersOut(day, h, habitats, undefined, 'town', weather),
      ).flat(),
    ).map((c) => c.critter);
  const clear = dealtIn('clear');
  const rain = dealtIn('rain');
  const fog = dealtIn('fog');
  /** A family's share of what her net can catch: the fish are dealt apart (phase Q). */
  const share = (dealt: CritterId[], family: string) => {
    const netted = dealt.filter((id) => !isFish(id));
    return netted.filter((id) => CRITTERS[id].family === family).length / netted.length;
  };

  it('keeps the raindrop frog to the rain and the veil moth to the fog', () => {
    expect(likesWeather('raindropFrog', 'rain')).toBe(true);
    expect(likesWeather('raindropFrog', 'clear')).toBe(false);
    expect(likesWeather('veilMoth', 'fog')).toBe(true);
    expect(likesWeather('lunaMoth', 'rain')).toBe(true);
    expect(clear).not.toContain('raindropFrog');
    expect(clear).not.toContain('veilMoth');
    expect(rain).toContain('raindropFrog');
    expect(rain).not.toContain('veilMoth');
    expect(fog).toContain('veilMoth');
    expect(fog).not.toContain('raindropFrog');
  });

  it('brings out more frogs in the rain, and more orbs in the fog', () => {
    expect(share(rain, 'frog')).toBeGreaterThan(share(clear, 'frog') * 1.2);
    // A little under 1.2 since the pumpkin bats, toads and fireflies moved to the fairground, which
    // left fewer others in town for the fog's orbs to crowd out (0.2's M1, decision 200).
    expect(share(fog, 'orb')).toBeGreaterThan(share(clear, 'orb') * 1.15);
  });

  it('brings out more moths and orbs on the night of a full moon, and only at night', () => {
    expect(isMoonlit('2026-09-26', 22)).toBe(isFullMoon('2026-09-26'));
    const moon = ['2026-09-25', '2026-09-26', '2026-09-27'].find(isFullMoon)!;
    expect(isMoonlit(moon, 12)).toBe(false);
    expect(isMoonlit(moon, 2)).toBe(true);
    expect(weightOf('lunaMoth', 'clear', true)).toBeGreaterThan(weightOf('lunaMoth', 'clear'));
    expect(weightOf('vampireBat', 'clear', true)).toBe(weightOf('vampireBat', 'clear'));
  });

  it("deals by the day's own weather when none is said", () => {
    const rainy = '2026-09-28';
    for (let h = 0; h < 24; h++) {
      expect(crittersOut(rainy, h, habitats)).toEqual(
        crittersOut(rainy, h, habitats, undefined, 'town', 'rain'),
      );
    }
  });
});

describe('the habitats', () => {
  it('each have room for a few critters, in every place with a critter that lives there', () => {
    for (const place of PLACES) {
      const needed = new Set(
        CRITTER_IDS.filter((id) => CRITTERS[id].where.includes(place.id)).map(
          (id) => CRITTERS[id].habitat,
        ),
      );
      for (const habitat of needed) {
        const room = place.id === 'hiddenClearing' ? 3 : 4;
        expect(place.habitats[habitat].length, `${place.id} ${habitat}`).toBeGreaterThanOrEqual(
          room,
        );
      }
    }
  });

  it('can all be reached, and the water from its bank', () => {
    for (const { id, map, habitats } of PLACES) {
      const reachable = (t: Tile) =>
        findPath(map.spawn, t, (x, y) => walkable(map, x, y), map.width, map.height) !== null;
      for (const [habitat, tiles] of Object.entries(habitats)) {
        for (const t of tiles) {
          const from =
            habitat === 'pond'
              ? [-1, 0, 1].flatMap((dx) =>
                  [-1, 0, 1].map((dy) => ({ tx: t.tx + dx, ty: t.ty + dy })),
                )
              : [t];
          const ok = from.some((f) => walkable(map, f.tx, f.ty) && reachable(f));
          expect(ok, `${id} ${habitat} ${t.tx},${t.ty}`).toBe(true);
        }
      }
    }
  });

  it('keep clear of her door, the snack spots and the flower patches', () => {
    const all = Object.values(habitats).flat();
    for (const t of [map.spawn, ...map.snackSpots, ...map.patches]) {
      expect(all.some((a) => a.tx === t.tx && a.ty === t.ty)).toBe(false);
    }
  });

  it('are found from the map: beside a tree, and water beside the bank', () => {
    const tiny = parseMap(tinyMap(['#######', '#.T...#', '#.....#', '#######'], { tx: 5, ty: 2 }));
    const found = habitatsOf(tiny);
    expect(found.trees).toContainEqual({ tx: 1, ty: 1 });
    expect(found.trees).toContainEqual({ tx: 3, ty: 2 });
    expect(found.trees).not.toContainEqual({ tx: 4, ty: 1 });
    expect(found.pond).toEqual([]);
  });
});

describe('the critters out each hour', () => {
  it('are the same all hour and change with the hour and the day', () => {
    const a = crittersOut('2026-09-27', 21, habitats);
    expect(crittersOut('2026-09-27', 21.9, habitats)).toEqual(a);
    expect(crittersOut('2026-09-27', 22, habitats)).not.toEqual(a);
    expect(crittersOut('2026-09-28', 21, habitats)).not.toEqual(a);
  });

  it('are about at that hour, each a different kind, on its own tile of its habitat', () => {
    for (const day of DAYS) {
      for (let h = 0; h < 24; h++) {
        const out = crittersOut(day, h, habitats);
        expect(out.length).toBeGreaterThanOrEqual(4);
        expect(out.length).toBeLessThanOrEqual(CRITTERS_PER_HOUR + FISH_PER_HOUR + RAIN_FISH);
        expect(new Set(out.map((c) => c.critter)).size).toBe(out.length);
        expect(new Set(out.map((c) => `${c.tx},${c.ty}`)).size).toBe(out.length);
        for (const c of out) {
          expect(isOut(c.critter, h)).toBe(true);
          const tiles = habitats[CRITTERS[c.critter].habitat as Habitat];
          expect(tiles).toContainEqual({ tx: c.tx, ty: c.ty });
        }
      }
    }
  });

  it('turn up rare now and then: every critter within a year of evenings and days', () => {
    const seen = new Set<CritterId>();
    for (const place of PLACES) {
      for (const day of YEAR) {
        for (let h = 0; h < 24; h++)
          for (const c of crittersOut(day, h, place.habitats, undefined, place.id)) {
            seen.add(c.critter);
          }
      }
    }
    expect([...seen].sort()).toEqual([...CRITTER_IDS].sort());
  });

  it('are only those that live in a place, a few at every hour, dealt apart from the town', () => {
    for (const { id, habitats } of BEYOND) {
      for (const day of DAYS.slice(0, 7)) {
        for (let h = 0; h < 24; h++) {
          const out = crittersOut(day, h, habitats, undefined, id);
          expect(out.length, `${id} ${day} ${h}:00`).toBeGreaterThanOrEqual(2);
          for (const c of out) {
            expect(CRITTERS[c.critter].where, c.critter).toContain(id);
            expect(habitats[CRITTERS[c.critter].habitat]).toContainEqual({ tx: c.tx, ty: c.ty });
          }
        }
      }
    }
  });

  it('keep off tiles something else is standing on', () => {
    const blocked = (t: { tx: number; ty: number }) => t.tx % 2 === 0;
    for (const c of crittersOut('2026-09-27', 22, habitats, (t) => !blocked(t))) {
      expect(blocked(c)).toBe(false);
    }
  });
});

describe("rarity and the seasons (0.2's F1)", () => {
  it('come in four tiers, about 12:5:2:1 by weight', () => {
    const counts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
    for (const id of CRITTER_IDS) counts[CRITTERS[id].rarity]++;
    for (const tier of Object.keys(counts) as (keyof typeof counts)[]) {
      expect(counts[tier], tier).toBeGreaterThan(0);
    }
    expect(weightOf('ghostMinnow', 'clear')).toBe(12 * weightOf('glowJelly', 'clear'));
    expect(weightOf('booKoi', 'clear')).toBe(5 * weightOf('glowJelly', 'clear'));
    expect(weightOf('ghostPike', 'clear')).toBe(2 * weightOf('glowJelly', 'clear'));
  });

  it('keep a legendary one to its moment: a few hours of the night, its weather, or the moon', () => {
    for (const id of CRITTER_IDS.filter((c) => CRITTERS[c].rarity === 'legendary')) {
      const { from, to, weather, moon } = CRITTERS[id];
      const hours = (to - from + 24) % 24 || 24;
      expect(hours <= 6 || weather !== undefined || moon === true, id).toBe(true);
    }
  });

  it('have a big beetle among the legendary ones: the Hercules beetle, among the old trees', () => {
    expect(CRITTERS.herculesBeetle.family).toBe('beetle');
    expect(CRITTERS.herculesBeetle.rarity).toBe('legendary');
    expect(CRITTERS.herculesBeetle.where).toContain('whisperwood');
  });

  it("put the axolotl by Whisperwood's creek, and the glowing jellyfish in the lake at night", () => {
    expect(CRITTERS.axolotl.rarity).toBe('legendary');
    expect(CRITTERS.axolotl.where).toEqual(['whisperwood']);
    expect(CRITTERS.axolotl.habitat).toBe('creek');
    expect(CRITTERS.glowJelly.rarity).toBe('legendary');
    expect(CRITTERS.glowJelly.where).toEqual(['lanternShore']);
    expect(isFish('glowJelly')).toBe(true);
    for (let h = 7; h < 20; h++) expect(isOut('glowJelly', h)).toBe(false);
  });

  it("find the creek's banks from the map: open ground beside the ice, never on it", () => {
    const woods = BEYOND.find((p) => p.id === 'whisperwood')!;
    expect(woods.habitats.creek.length).toBeGreaterThanOrEqual(4);
    for (const t of woods.habitats.creek) expect(tileAt(woods.map, t.tx, t.ty)).not.toBe('ice');
    const iced = (t: Tile) =>
      [-1, 0, 1].some((dx) =>
        [-1, 0, 1].some((dy) => tileAt(woods.map, t.tx + dx, t.ty + dy) === 'ice'),
      );
    expect(woods.habitats.creek.every(iced)).toBe(true);
    expect(habitats.creek).toEqual([]);
  });

  it('give about a third of the Cabinet a season, some short, round past December', () => {
    const seasonal = CRITTER_IDS.filter((id) => CRITTERS[id].season);
    expect(seasonal.length).toBeGreaterThanOrEqual(CRITTER_IDS.length / 3);
    expect(seasonal.length).toBeLessThan(CRITTER_IDS.length / 2);
    expect(inSeason('pumpkinBat', '2026-10-31')).toBe(true);
    expect(inSeason('pumpkinBat', '2026-12-01')).toBe(false);
    expect(inSeason('mistNewt', '2026-12-24')).toBe(true);
    expect(inSeason('mistNewt', '2027-01-31')).toBe(true);
    expect(inSeason('mistNewt', '2027-02-01')).toBe(false);
    expect(inSeason('ghostMinnow', '2027-06-15')).toBe(true);
    // Every month has a short season of its own, so the last of them is always most of a year off.
    for (let m = 1; m <= 12; m++) {
      const day = `2027-${String(m).padStart(2, '0')}-15`;
      const short = seasonal.filter((id) => {
        const [from, to] = CRITTERS[id].season!;
        return (to - from + 12) % 12 <= 1 && inSeason(id, day);
      });
      expect(short.length, day).toBeGreaterThan(0);
    }
  });

  it('never deal one out of season, and the blue moonfish only under a full moon', () => {
    for (const day of YEAR) {
      for (const h of [2, 12, 21]) {
        for (const place of PLACES) {
          for (const c of crittersOut(day, h, place.habitats, undefined, place.id)) {
            expect(inSeason(c.critter, day), `${c.critter} ${day}`).toBe(true);
          }
        }
      }
    }
    const moon = YEAR.find(isFullMoon)!;
    const dark = YEAR.find((d) => !isFullMoon(d))!;
    expect(isAbout('blueMoonfish', moon, 22, 'clear')).toBe(true);
    expect(isAbout('blueMoonfish', dark, 22, 'clear')).toBe(false);
    expect(isAbout('blueMoonfish', moon, 12, 'clear')).toBe(false);
    expect(weightOf('blueMoonfish', 'clear', true)).toBe(MOON_BOUND_WEIGHT);
  });
});

describe('a wary critter', () => {
  it('flutters to the nearest free tile of its habitat, at least two tiles off', () => {
    const tiles = [
      { tx: 0, ty: 0 },
      { tx: 1, ty: 0 },
      { tx: 3, ty: 0 },
      { tx: 9, ty: 0 },
    ];
    expect(flutterTo({ tx: 0, ty: 0 }, tiles, () => true)).toEqual({ tx: 3, ty: 0 });
    expect(flutterTo({ tx: 0, ty: 0 }, tiles, (t) => t.tx !== 3)).toEqual({ tx: 9, ty: 0 });
    expect(flutterTo({ tx: 0, ty: 0 }, tiles.slice(0, 2), () => true)).toBeNull();
  });
});
