import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import { ITEMS } from '../../src/data/items';
import { PROP_FOOTPRINT, spotOf, TOWN } from '../../src/data/maps';
import { ZONES } from '../../src/data/zones';
import { OUTFIT_PRICE } from '../../src/data/shop';
import { PARTY_SPOTS, SPECIAL_LINES } from '../../src/data/specialDays';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';
import { parseMap, walkable, type TileMap } from '../../src/systems/grid';
import { exitAt } from '../../src/systems/zones';
import type { ItemId, MapZoneId } from '../../src/types/ids';
import { RECIPES } from '../../src/data/recipes';
import { isOutdoor } from '../../src/data/yard';
import { findPath, type Tile } from '../../src/systems/pathfinding';
import { stopAt, stopOf } from '../../src/systems/schedules';
import { INTERIORS, isInterior } from '../../src/data/interiors';
import { RoomZone, worthVisiting } from '../../src/world/zones/RoomZone';
import { WINDOW_FROM } from '../../src/data/windows';
import type { Stop } from '../../src/data/villagers';

const map = parseMap(TOWN);
const maps = new Map<MapZoneId, TileMap>([['town', map]]);
const mapOf = (zone: MapZoneId = 'town') => {
  if (!maps.has(zone)) maps.set(zone, parseMap(ZONES[zone].map!));
  return maps.get(zone)!;
};
const everyStop = (): Stop[] =>
  VILLAGER_IDS.flatMap((id) => [
    ...VILLAGERS[id].schedule.weekday,
    ...VILLAGERS[id].schedule.weekend,
  ]);
const reachable = (t: Tile, m: TileMap = map) =>
  findPath(m.spawn, t, (x, y) => walkable(m, x, y), m.width, m.height) !== null;

/** Every tile something that comes and goes (the pop-up, the Moon Pie Man's cart) may stand on. */
const visiting = new Set<string>();
for (const lot of map.popUpLots) {
  const { w, h } = PROP_FOOTPRINT.popUpShop;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) visiting.add(`${lot.tx + x},${lot.ty + y}`);
}
for (const spot of map.peddlerSpots) {
  const { w, h } = PROP_FOOTPRINT.moonPieCart;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) visiting.add(`${spot.tx + x},${spot.ty + y}`);
  }
}

describe('the villagers', () => {
  it('stand on open ground she can reach, clear of the pop-up and the cart, at every stop', () => {
    const stops: { zone?: MapZoneId; tx: number; ty: number }[] = [
      ...everyStop()
        .map(stopAt)
        .filter((s) => !isInterior(s.zone) && s.zone !== 'home')
        .map((s) => ({ ...s, zone: s.zone as MapZoneId })),
      ...Object.values(PARTY_SPOTS).map((name) => spotOf('town', name)),
    ];
    for (const stop of stops) {
      const m = mapOf(stop.zone);
      const town = m === map;
      const at = `${stop.zone ?? 'town'} ${stop.tx},${stop.ty}`;
      const tile = `${stop.tx},${stop.ty}`;
      expect(walkable(m, stop.tx, stop.ty), at).toBe(true);
      expect(reachable(stop, m), at).toBe(true);
      expect(town && visiting.has(tile), at).toBe(false);
      expect(
        m.patches.some((p) => p.tx === stop.tx && p.ty === stop.ty),
        at,
      ).toBe(false);
      expect(tile, at).not.toBe(`${m.spawn.tx},${m.spawn.ty}`);
      expect(exitAt(m.exits, stop), at).toBeUndefined();
      // Nor with their head over a snack, where a tap for the snack would be a hello instead.
      const head = { tx: stop.tx, ty: stop.ty - 1 };
      expect(
        m.snackSpots.some((s) => s.tx === head.tx && s.ty === head.ty),
        at,
      ).toBe(false);
    }
  });

  it('stand inside on open floor she can reach, off the mat and out from under anything', () => {
    for (const [id, row] of Object.entries(INTERIORS)) {
      const room = new RoomZone(id as keyof typeof INTERIORS);
      const { mat } = room.room;
      expect(row.stands.length, id).toBeGreaterThanOrEqual(3);
      for (const t of row.stands) {
        const at = `${id} ${t.tx},${t.ty}`;
        expect(room.canWalk(t.tx, t.ty), at).toBe(true);
        expect(findPath(mat, t, room.canWalk, room.width, room.height), at).not.toBeNull();
        expect(`${t.tx},${t.ty}`, at).not.toBe(`${mat.tx},${mat.ty}`);
        // Their head is on the tile above, where a tap would be a hello rather than a look.
        const above = room.thingAt(t.tx, t.ty - 1);
        expect(above && worthVisiting(above), at).toBeFalsy();
      }
      expect(new Set(row.stands.map((t) => `${t.tx},${t.ty}`)).size, id).toBe(row.stands.length);
    }
    for (const stop of everyStop()) {
      if ('inside' in stop) {
        expect(INTERIORS[stop.inside].stands[stop.stand ?? 0], stop.inside).toBeDefined();
      }
    }
  });

  it('never share a spot, at any hour or at the party', () => {
    for (const day of ['2026-09-26', '2026-09-27', '2026-09-28', '2027-04-09']) {
      for (let hour = 0; hour < 24; hour++) {
        const spots = VILLAGER_IDS.map((id) => stopOf(id, hour, day)).map(
          (t) => `${t.zone} ${t.tx},${t.ty}`,
        );
        expect(new Set(spots).size, `${day} ${hour}:00`).toBe(spots.length);
      }
    }
  });

  it('keep their schedules in order through the day, with a stop in every window', () => {
    const windowOf = (h: number) =>
      h >= WINDOW_FROM.evening || h < WINDOW_FROM.morning
        ? 'evening'
        : h >= WINDOW_FROM.afternoon
          ? 'afternoon'
          : 'morning';
    for (const id of VILLAGER_IDS) {
      for (const kind of ['weekday', 'weekend'] as const) {
        const hours = VILLAGERS[id].schedule[kind].map((s) => s.from);
        expect(hours, `${id} ${kind}`).toEqual([...hours].sort((a, b) => a - b));
        expect(
          hours.every((h) => Number.isInteger(h) && h >= 0 && h < 24),
          id,
        ).toBe(true);
        expect(new Set(hours.map(windowOf)).size, `${id} ${kind}`).toBe(3);
      }
    }
  });

  it('are all out in town at noon at the weekend, for the square to be lively', () => {
    for (const id of VILLAGER_IDS) expect(stopOf(id, 12, '2026-09-26').zone, id).toBe('town');
  });

  it('have something to say at every closeness, day and night, and on every special day', () => {
    for (const id of VILLAGER_IDS) {
      const { lines } = VILLAGERS[id];
      for (const tier of ['hello', 'friend', 'close', 'night'] as const) {
        expect(lines[tier].length, `${id} ${tier}`).toBeGreaterThan(0);
      }
      for (const day of Object.values(SPECIAL_LINES)) expect(day[id]).toBeTruthy();
    }
  });

  it('only call her babe if they are Cody', () => {
    for (const id of VILLAGER_IDS) {
      const { lines, reactions, thanks } = VILLAGERS[id];
      const said = [...Object.values(lines).flat(), ...Object.values(reactions), thanks].join(' ');
      expect(/\bbabe\b/.test(said.replace(/calls you babe/, '')), id).toBe(id === 'cody');
    }
  });

  it('ask favours of things she can gather, grow or buy, a few at a time', () => {
    for (const id of VILLAGER_IDS) {
      for (const favour of VILLAGERS[id].favours) {
        expect(ITEMS[favour.item], favour.item).toBeDefined();
        expect(favour.count).toBeGreaterThan(0);
        expect(favour.count).toBeLessThanOrEqual(6);
        expect(favour.ask).toContain('{what}');
      }
    }
  });

  it('teach a recipe at three hearts, give something to wear at six, and a piece at ten', () => {
    for (const id of VILLAGER_IDS) {
      const rewards = VILLAGERS[id].rewards;
      expect(
        rewards.map((r) => r.hearts),
        id,
      ).toEqual([3, 6, 10]);
      // Boothoven's are a record, a piece and a recipe, and Scarah's seeds, a hat and a recipe,
      // checked below.
      if (id === 'boothoven' || id === 'scarah') continue;
      const [, wear, piece] = rewards;
      expect('outfit' in wear!.gift, id).toBe(true);
      expect('furniture' in piece!.gift, id).toBe(true);
      if ('outfit' in wear!.gift) expect(OUTFIT_PRICE[wear!.gift.outfit]).toBeUndefined();
      if ('furniture' in piece!.gift)
        expect(FURNITURE[piece!.gift.furniture].price).toBeUndefined();
    }
    const cody = VILLAGERS.cody.rewards[0]!.gift;
    expect(cody).toEqual({ item: 'recordWalkTheTomb' });
    // Boothoven's are his record, his metronome (0.2's L1) and the piano's recipe (0.2's L2).
    expect(VILLAGERS.boothoven.rewards.map((r) => [r.hearts, r.gift])).toEqual([
      [3, { item: 'recordBoonlightSonata' }],
      [6, { furniture: 'metronome' }],
      [10, { recipe: 'piano' }],
    ]);
    expect(FURNITURE.metronome.price).toBeUndefined();
    // Scarah's (0.3's F3): a packet of every seed there is, her straw hat's twin, and how to make
    // the straw friend for her yard.
    const [seeds, hat, friend] = VILLAGERS.scarah.rewards;
    const packets = [seeds!.gift, ...(seeds!.also ?? [])];
    const everySeed = (Object.keys(ITEMS) as ItemId[]).filter((i) => ITEMS[i].kind === 'seed');
    expect(packets).toHaveLength(everySeed.length);
    expect(new Set(packets.map((w) => ('item' in w ? w.item : null)))).toEqual(new Set(everySeed));
    expect(hat!.gift).toEqual({ outfit: 'scarahHat' });
    expect(OUTFIT_PRICE.scarahHat).toBeUndefined();
    expect(friend!.gift).toEqual({ recipe: 'strawFriend' });
    expect(RECIPES.strawFriend.makes).toEqual({ furniture: 'strawFriend' });
    expect(isOutdoor('strawFriend')).toBe(true);
    for (const id of VILLAGER_IDS.filter((v) => !['cody', 'boothoven', 'scarah'].includes(v))) {
      expect('recipe' in VILLAGERS[id].rewards[0]!.gift, id).toBe(true);
    }
  });
});

describe('the Moon Pie Man', () => {
  it('sets up his cart only on open ground she can reach, clear of the pop-up lots', () => {
    const lots = new Set<string>();
    for (const lot of map.popUpLots) {
      const { w, h } = PROP_FOOTPRINT.popUpShop;
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) lots.add(`${lot.tx + x},${lot.ty + y}`);
    }
    const { w, h } = PROP_FOOTPRINT.moonPieCart;
    for (const spot of map.peddlerSpots) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const at = `${spot.tx + x},${spot.ty + y}`;
          expect(walkable(map, spot.tx + x, spot.ty + y), at).toBe(true);
          expect(lots.has(at), at).toBe(false);
        }
      }
      // The tile below the cart's counter is where she stands to buy.
      expect(reachable({ tx: spot.tx, ty: spot.ty + h }), `${spot.tx},${spot.ty}`).toBe(true);
    }
  });
});
