import { describe, expect, it } from 'vitest';
import { FURNITURE } from '../../src/data/furniture';
import { ITEMS } from '../../src/data/items';
import { PROP_FOOTPRINT, TOWN } from '../../src/data/maps';
import { ZONES } from '../../src/data/zones';
import { OUTFIT_PRICE } from '../../src/data/shop';
import { PARTY_SPOTS, SPECIAL_LINES } from '../../src/data/specialDays';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';
import { parseMap, walkable, type TileMap } from '../../src/systems/grid';
import { exitAt } from '../../src/systems/zones';
import type { MapZoneId } from '../../src/types/ids';
import { findPath, type Tile } from '../../src/systems/pathfinding';
import { stopOf } from '../../src/systems/friendship';

const map = parseMap(TOWN);
const maps = new Map<MapZoneId, TileMap>([['town', map]]);
const mapOf = (zone: MapZoneId = 'town') => {
  if (!maps.has(zone)) maps.set(zone, parseMap(ZONES[zone].map!));
  return maps.get(zone)!;
};
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
      ...VILLAGER_IDS.flatMap((id) => VILLAGERS[id].schedule),
      ...Object.values(PARTY_SPOTS),
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

  it('never share a spot, at any hour or at the party', () => {
    for (const day of ['2026-09-27', '2027-04-09']) {
      for (let hour = 0; hour < 24; hour++) {
        const spots = VILLAGER_IDS.map((id) => stopOf(id, hour, day)).map(
          (t) => `${t.zone} ${t.tx},${t.ty}`,
        );
        expect(new Set(spots).size, `${day} ${hour}:00`).toBe(spots.length);
      }
    }
  });

  it('keep their schedules in order through the day', () => {
    for (const id of VILLAGER_IDS) {
      const hours = VILLAGERS[id].schedule.map((s) => s.from);
      expect(hours, id).toEqual([...hours].sort((a, b) => a - b));
      expect(
        hours.every((h) => Number.isInteger(h) && h >= 0 && h < 24),
        id,
      ).toBe(true);
    }
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
      const [, wear, piece] = rewards;
      expect('outfit' in wear!.gift, id).toBe(true);
      expect('furniture' in piece!.gift, id).toBe(true);
      if ('outfit' in wear!.gift) expect(OUTFIT_PRICE[wear!.gift.outfit]).toBeUndefined();
      if ('furniture' in piece!.gift)
        expect(FURNITURE[piece!.gift.furniture].price).toBeUndefined();
    }
    const cody = VILLAGERS.cody.rewards[0]!.gift;
    expect(cody).toEqual({ item: 'recordWalkTheTomb' });
    for (const id of VILLAGER_IDS.filter((v) => v !== 'cody')) {
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
