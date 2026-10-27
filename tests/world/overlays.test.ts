import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ZONE_IDS, ZONES } from '../../src/data/zones';
import { migrateSave } from '../../src/persistence/migrations';
import { FakeClock } from '../../src/systems/clock';
import type { MapZoneId } from '../../src/types/ids';
import { fromSave, World, type WorldOptions } from '../../src/world/World';

/**
 * Where she can walk and what she walks up to, on every tile of every place outdoors, held to
 * what `MapZone` answered before its overlays were a list (1.1's W1, decision 340): for a new
 * town and each lived-in save from her phone, with every project built, on an ordinary
 * Saturday, a film night, Christmas Eve (the square's tree, the pond frozen) and a day in May.
 * The snapshot is a hash of each place's answers, taken from the code the list replaced; 1.2's
 * town (`lived-in-v55`) was added in 1.3's F6, its snapshot taken from the code as it then was,
 * 1.5's (`lived-in-v58`) in V1.5's review, 1.6's (`lived-in-v59`) in V1.6's and 1.7's
 * (`lived-in-v60`) at its release, the same way.
 * Autumn's leaf piles (1.7's Y2), a new overlay that never blocks, are left out of the hash, so
 * it still holds everything else as it was; `leafPiles.test.ts` holds them.
 */
const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '../persistence/fixtures');
const SAVES = [
  'lived-in-v27',
  'lived-in-v31',
  'lived-in-v34',
  'lived-in-v43',
  'lived-in-v53',
  'lived-in-v55',
  'lived-in-v58',
  'lived-in-v59',
  'lived-in-v60',
];

const PLACES = ZONE_IDS.filter((id): id is MapZoneId => ZONES[id].map !== undefined);

const DAYS = [
  new Date(2026, 8, 26, 12),
  new Date(2026, 9, 24, 19),
  new Date(2026, 11, 24, 12),
  new Date(2027, 4, 12, 9),
];

function townsOf(): [string, () => WorldOptions][] {
  const built = {
    current: null,
    given: {},
    built: ['bandstand', 'castleGarden', 'footbridge', 'greenhouse'],
  } as const;
  return [
    ['new', () => ({})],
    ['built', () => ({ projects: { ...built, built: [...built.built] } })],
    ...SAVES.map((name): [string, () => WorldOptions] => [
      name,
      () => fromSave(migrateSave(JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), 'utf8')))),
    ]),
  ];
}

function answers(world: World, place: MapZoneId): string {
  const zone = world.zones.outdoor(place)!;
  const out: string[] = [];
  for (let ty = -1; ty <= zone.height; ty++) {
    for (let tx = -1; tx <= zone.width; tx++) {
      const answered = zone.propAt(tx, ty);
      const prop = answered?.id === 'leafPile' ? undefined : answered;
      out.push(`${zone.canWalk(tx, ty) ? 1 : 0}${prop ? `${prop.id}@${prop.tx},${prop.ty}` : ''}`);
    }
  }
  return createHash('sha1').update(out.join('|')).digest('hex').slice(0, 16);
}

describe("MapZone's overlays (1.1 W1)", () => {
  for (const [name, options] of townsOf()) {
    it(`answer every tile as they did, in ${name}`, () => {
      const clock = new FakeClock(DAYS[0]!);
      const world = new World({ ...options(), clock });
      const seen: Record<string, string> = {};
      for (const day of DAYS) {
        clock.set(day);
        for (const place of PLACES)
          seen[
            `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()} ${day.getHours()}h ${place}`
          ] = answers(world, place);
      }
      expect(seen).toMatchSnapshot();
    });
  }
});
