import { describe, expect, it } from 'vitest';
import { FALLING_LEAVES } from '../../src/data/leaves';
import { PILES_A_PLACE } from '../../src/data/leafPiles';
import { SPOTS } from '../../src/data/maps';
import { ZONE_IDS, ZONES } from '../../src/data/zones';
import { shiftDay } from '../../src/systems/calendar';
import type { PlacedProp } from '../../src/systems/grid';
import { pilesFallOn } from '../../src/systems/leafPiles';
import type { MapZoneId, PropId } from '../../src/types/ids';
import type { WorldEvent } from '../../src/world/World';
import { harness, type Harness } from './harness';

const PLACES = ZONE_IDS.filter((id): id is MapZoneId => ZONES[id].map !== undefined);

/** The autumn's days, September to November 2026. */
const AUTUMN = Array.from({ length: 91 }, (_, k) => shiftDay('2026-09-01', k));

function at(h: Harness, day: string, hour = 12): void {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  h.clock.set(new Date(y, m - 1, d, hour));
  h.tick(1);
}

/** Goes to a place, stands beside a pile there, and taps it: the moments of walking in. */
function jumpIn(h: Harness, zone: MapZoneId, pile: PlacedProp): WorldEvent[] {
  if (h.world.scene !== zone) {
    h.world.atlas.find(zone);
    expect(h.world.travel.go(zone)).toBe(true);
    h.tick(2);
  }
  const place = h.world.zones.outdoor(zone)!;
  const beside = place.standBeside(pile.tx, pile.ty)[0]!;
  h.world.movement.standAt(beside, 'down');
  h.tick(1);
  expect(h.world.tapTile(pile.tx, pile.ty)).toBe(true);
  const events = h.tick(1);
  events.push(...h.until(() => !h.world.movement.walking, 'walking in', 20_000));
  events.push(...h.tick(2));
  return events;
}

const leapt = (events: WorldEvent[]) =>
  events.filter((e): e is Extract<WorldEvent, { kind: 'leapt' }> => e.kind === 'leapt');

describe('leaf piles (1.7 Y2)', () => {
  it('gather in autumn only, as the leaves fall', () => {
    expect(pilesFallOn('2026-10-27')).toBe(true);
    expect(pilesFallOn('2026-12-15')).toBe(false);
    expect(pilesFallOn('2027-07-01')).toBe(false);
    const h = harness();
    at(h, '2027-01-15');
    for (const place of PLACES) expect(h.world.leafPiles.piles(place), place).toEqual([]);
  });

  it("lie two or three to a place at the trees' feet, on open grass, never in anyone's way", () => {
    const h = harness();
    for (const day of AUTUMN.filter((_, k) => k % 9 === 0)) {
      at(h, day);
      for (const place of PLACES) {
        const zone = h.world.zones.outdoor(place)!;
        const piles = h.world.leafPiles.piles(place).map((p) => p.pile);
        expect(piles.length, `${place} ${day}`).toBeGreaterThanOrEqual(PILES_A_PLACE.least);
        expect(piles.length, `${place} ${day}`).toBeLessThanOrEqual(PILES_A_PLACE.most);
        const spots = Object.values(SPOTS[place] as Record<string, { tx: number; ty: number }>);
        for (const pile of piles) {
          const where = `${place} ${day} ${pile.tx},${pile.ty}`;
          expect(zone.map.tiles[pile.ty * zone.width + pile.tx], where).toBe('grass');
          expect(zone.canWalk(pile.tx, pile.ty), where).toBe(true);
          expect(
            zone.map.props.some(
              (p) =>
                p.tx <= pile.tx && pile.tx < p.tx + p.w && p.ty <= pile.ty && pile.ty < p.ty + p.h,
            ),
            where,
          ).toBe(false);
          expect(
            spots.some((s) => s.tx === pile.tx && s.ty === pile.ty),
            where,
          ).toBe(false);
          expect(
            zone.map.digSpots.some((s) => s.tx === pile.tx && s.ty === pile.ty),
            where,
          ).toBe(false);
          // At a tree's foot: a shedding tree beside it, or just behind.
          const tree = zone.map.props.some(
            (p) =>
              (FALLING_LEAVES.trees as readonly PropId[]).includes(p.id) &&
              pile.tx >= p.tx - 1 &&
              pile.tx <= p.tx + p.w &&
              pile.ty >= p.ty + p.h - 1 &&
              pile.ty <= p.ty + p.h,
          );
          expect(tree, where).toBe(true);
          // No two piles side by side.
          for (const other of piles) {
            if (other === pile) continue;
            expect(
              Math.max(Math.abs(other.tx - pile.tx), Math.abs(other.ty - pile.ty)),
              where,
            ).toBeGreaterThan(1);
          }
        }
      }
    }
  });

  it('stand where they are all day, and somewhere else another day', () => {
    const h = harness();
    at(h, '2026-10-27', 6);
    const morning = JSON.stringify(h.world.leafPiles.piles('town'));
    at(h, '2026-10-27', 21);
    expect(JSON.stringify(h.world.leafPiles.piles('town'))).toBe(morning);
    const days = ['2026-10-28', '2026-10-29', '2026-10-30'].map((day) => {
      at(h, day);
      return JSON.stringify(h.world.leafPiles.piles('town').map((p) => p.pile));
    });
    expect(new Set([morning, ...days]).size).toBeGreaterThan(1);
  });

  it('are jumped in with a crunch, the first time ever finding the golden leaf, then lie flat', () => {
    const h = harness();
    at(h, '2026-10-27', 15);
    const [first, second] = h.world.leafPiles.piles('town').map((p) => p.pile);
    const events = jumpIn(h, 'town', first!);
    expect(leapt(events)).toEqual([
      { kind: 'leapt', tile: { tx: first!.tx, ty: first!.ty }, item: 'goldenLeaf' },
    ]);
    expect(h.world.bag.count('goldenLeaf')).toBe(1);
    // She's in it, where it was, and it lies flat: grass to a tap, the rest of the window.
    expect(h.world.movement.tile).toEqual({ tx: first!.tx, ty: first!.ty });
    expect(h.world.leafPiles.piles('town')[0]!.flat).toBe(true);
    expect(h.world.zones.outdoor('town')!.propAt(first!.tx, first!.ty)).toBeUndefined();
    // Another pile today crunches, with nothing in it: the day's find was had.
    expect(leapt(jumpIn(h, 'town', second!))).toEqual([
      { kind: 'leapt', tile: { tx: second!.tx, ty: second!.ty } },
    ]);
    // Heaped again the next window.
    at(h, '2026-10-27', 18);
    expect(h.world.leafPiles.piles('town').every((p) => !p.flat)).toBe(true);
  });

  it('find something the first jump of every day in every place, a critter, Candy or a lost thing', () => {
    const h = harness(undefined, { candy: 0 });
    h.world.bag.add('goldenLeaf', 1);
    const finds = new Map<string, number>();
    for (const day of AUTUMN.filter((_, k) => k % 4 === 0)) {
      for (const place of ['town', 'whisperwood', 'booAcres'] as const) {
        at(h, day, 15);
        // A tap on a critter sat on a pile nets the critter, so she jumps in one without.
        const out = h.world.collecting.critters(place);
        const pile = h.world.leafPiles
          .piles(place)
          .map((p) => p.pile)
          .find((p) => !out.some((c) => c.tx === p.tx && c.ty === p.ty))!;
        const events = jumpIn(h, place, pile);
        const jump = leapt(events)[0]!;
        const lost = events.some((e) => e.kind === 'foundLost');
        const found = jump.critter ? 'critter' : jump.candy ? 'candy' : lost ? 'lost' : null;
        expect(found, `${place} ${day}`).not.toBeNull();
        finds.set(found!, (finds.get(found!) ?? 0) + 1);
        // A critter rustles out beside her, for her net.
        if (jump.critter) {
          const out = h.world.collecting.critters(place);
          const critter = out.find(
            (c) => c.critter === jump.critter && c.key === `rustled:${place}`,
          );
          expect(critter, `${place} ${day}`).toBeDefined();
          expect(Math.max(Math.abs(critter!.tx - pile.tx), Math.abs(critter!.ty - pile.ty))).toBe(
            1,
          );
        }
      }
    }
    expect(finds.get('critter') ?? 0).toBeGreaterThan(0);
    expect(finds.get('candy') ?? 0).toBeGreaterThan(0);
    expect(h.world.wallet.candy).toBeGreaterThan(0);
  });

  it("turns up a neighbour's lost thing lying in town that window", () => {
    const h = harness();
    h.world.bag.add('goldenLeaf', 1);
    let found = false;
    for (let k = 0; k < 40 && !found; k++) {
      for (const hour of [9, 14, 20]) {
        at(h, shiftDay('2026-10-01', k), hour);
        if (!h.world.smallEvents.lying()) continue;
        const pile = h.world.leafPiles.piles('town').find((p) => !p.flat)?.pile;
        if (!pile || !h.world.takings.isReady('pile:town')) continue;
        const events = jumpIn(h, 'town', pile);
        expect(events.some((e) => e.kind === 'foundLost')).toBe(true);
        expect(h.world.smallEvents.errand).not.toBeNull();
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });
});
