import { describe, expect, it } from 'vitest';
import { ZONE_IDS, ZONES } from '../../src/data/zones';
import type { PlacedProp } from '../../src/systems/grid';
import type { MapZoneId } from '../../src/types/ids';
import type { WorldEvent } from '../../src/world/World';
import { arrivalsOf } from '../../src/world/arrivals';
import { harness, type Harness } from './harness';

/**
 * What walking up to each kind of prop does, in every place outdoors, held to what it did before
 * arriving was a table keyed by prop id (1.1's W1, decision 340): the porch pots, the candy tree,
 * a sapling, the pumpkin patch, the bandstand, the honesty stall, both geese, today's mound and
 * the buried keys', the doors, the gates, then whatever is gathered. The snapshot was taken from
 * the chain of `if`s it replaced; the order of the table is held by its answers.
 */
const PLACES = ZONE_IDS.filter((id): id is MapZoneId => ZONES[id].map !== undefined);

/** At most this many of each kind of prop in a place, so a wood of trees is a few of them. */
const EACH = 2;

function propsOf(h: Harness): PlacedProp[] {
  const zone = h.world.zones.outdoor(h.world.scene)!;
  const seen = new Set<string>();
  const count = new Map<string, number>();
  const props: PlacedProp[] = [];
  for (let ty = 0; ty < zone.height; ty++) {
    for (let tx = 0; tx < zone.width; tx++) {
      const prop = zone.propAt(tx, ty);
      if (!prop) continue;
      const key = `${prop.id}@${prop.tx},${prop.ty}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const n = count.get(prop.id) ?? 0;
      if (n >= EACH) continue;
      count.set(prop.id, n + 1);
      props.push(prop);
    }
  }
  return props;
}

/** Walks up to every kind of prop in `place` in turn, and says what each arrival gave. */
function walkRound(place: MapZoneId, h: Harness): string[] {
  const lines: string[] = [];
  for (const prop of propsOf(h)) {
    const zone = h.world.zones.outdoor(place)!;
    const beside = zone.standBeside(prop.tx, prop.ty)[0];
    if (!beside) {
      lines.push(`${prop.id}@${prop.tx},${prop.ty}: nowhere to stand`);
      continue;
    }
    h.world.sitting.stand();
    h.world.neighbourhood.endTalk();
    h.world.petCare.endPet();
    h.world.movement.standAt(beside, 'down');
    const went = h.world.tapTile(prop.tx, prop.ty);
    const events: WorldEvent[] = [];
    events.push(...h.tick(1));
    events.push(...h.until(() => !h.world.movement.walking, 'walking up', 30_000));
    events.push(...h.tick(1));
    const told = events.map((e) => JSON.stringify(e)).join(' ');
    lines.push(`${prop.id}@${prop.tx},${prop.ty} ${went ? 'went' : 'stayed'}: ${told}`);
    if (h.world.scene !== place) h.world.travel.cross({ to: place, along: 0 });
    h.tick(1);
  }
  return lines;
}

function inPlace(
  place: MapZoneId,
  at: Date,
  projects?: { built: ('bandstand' | 'castleGarden' | 'footbridge' | 'greenhouse')[] },
): Harness {
  const spawn = ZONES[place].map!.spawn;
  const h = harness(undefined, {
    player: { zone: place, tx: spawn.tx, ty: spawn.ty, facing: 'down' },
    ...(projects && { projects: { current: null, given: {}, ...projects } }),
  });
  h.clock.set(at.getTime());
  h.tick(1);
  return h;
}

describe('arriving at a prop (1.1 W1)', () => {
  for (const place of PLACES) {
    it(`does what it always did, in ${place}`, () => {
      const h = inPlace(place, new Date(2026, 8, 26, 12));
      expect(walkRound(place, h)).toMatchSnapshot();
    });
  }

  it('does what it always did on a festival evening, every project built, in town', () => {
    const built = ['bandstand', 'castleGarden', 'footbridge', 'greenhouse'] as const;
    for (const place of ['town', 'castleHill', 'whisperwood'] as const) {
      const h = inPlace(place, new Date(2026, 9, 30, 19), { built: [...built] });
      expect(walkRound(place, h)).toMatchSnapshot(place);
    }
  });

  it('has one area say what arriving at a prop does, never two', () => {
    const shake = () => [];
    expect(Object.keys(arrivalsOf({ candyTree: shake }, { goose: shake }))).toEqual([
      'candyTree',
      'goose',
    ]);
    expect(() => arrivalsOf({ candyTree: shake }, { candyTree: shake })).toThrow(/candyTree/);
  });
});
