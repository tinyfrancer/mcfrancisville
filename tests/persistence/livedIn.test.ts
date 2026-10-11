import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { migrateSave } from '../../src/persistence/migrations';
import { SAVE_VERSION } from '../../src/persistence/SaveState';
import { FakeClock } from '../../src/systems/clock';
import { fromSave, World } from '../../src/world/World';

/**
 * Lived-in saves written by the releases on her phone (a farm, a decorated home, friends at every
 * band, Cabinet finds, bracelets worn, the broom away from home), each made by
 * that release's own code for V1's shakedown. Whatever the save chain becomes, nothing in them is
 * lost on the way to this build. 0.2.5's is 0.2.3's opened and saved by 0.2.5's code (save v34,
 * what her phone holds as 0.3 lands); 0.3's was played over three days in a dev build (Boo Acres
 * and the greenhouse planted, both rooms and the yard decorated, things on tables and on show, the
 * chest holding things, friends at every band with Scarah, fossils and crawlies given to the
 * museum, a figurine carved, the week's set bought, an order on its way).
 */
const LIVED_IN = {
  '0.2.2': 'lived-in-v27.json',
  '0.2.3': 'lived-in-v31.json',
  '0.2.5': 'lived-in-v34.json',
  '0.3': 'lived-in-v43.json',
};

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

/** What the town works out afresh on a load rather than keeping as it was. */
const RECKONED = new Set(['version', 'createdAt', 'updatedAt', 'lastPlayedAt', 'stall']);

/** What a later version let go on purpose: when each newcomer wrote, once everyone lived here. */
const RETIRED = new Set(['newcomers']);

/** What a later version gives every bag that lacks it: her skates (decision 211). */
const GIVEN: readonly string[] = ['iceSkates'];

/** What a later version added to a part of the save, which the old one couldn't have had. */
const ADDED: Record<string, readonly string[]> = {
  look: ['wrist'],
  beds: ['zone'],
  candyTree: ['saplings'],
  stall: ['shelves'],
  home: ['items'],
  // V1's P3a: the day the chain began, and Wes.
  mystery: ['began', 'wes'],
};

/**
 * A part of the save a later version reshaped, put back in the old shape to hold against it, for
 * a save from before (`was` tells): her one room became the front room of her rooms, `rooms.main`
 * (0.3's H4), every piece where it was.
 */
const RESHAPED: Record<
  string,
  {
    was: (old: Record<string, unknown>) => boolean;
    back: (value: Record<string, unknown>) => unknown;
  }
> = {
  home: {
    was: (old) => !('rooms' in old),
    back: ({ rooms, here, ...rest }) => {
      expect(here).toBe('main');
      expect(Object.keys(rooms as object)).toEqual(['main']);
      return { ...rest, ...(rooms as { main: object }).main };
    },
  },
};

/** The saved value without what a later version added that the old one lacked. */
function withoutAdded(key: string, value: unknown, old: unknown): unknown {
  const added = ADDED[key] ?? [];
  const strip = (v: unknown, was: unknown): unknown =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).filter(
            ([k]) => !added.includes(k) || (was !== null && typeof was === 'object' && k in was),
          ),
        )
      : v;
  return Array.isArray(value) && Array.isArray(old)
    ? value.map((v, i) => strip(v, old[i]))
    : strip(value, old);
}

describe('a lived-in save from her phone', () => {
  for (const [release, file] of Object.entries(LIVED_IN)) {
    it(`carries ${release}'s forward with nothing lost`, () => {
      const old = JSON.parse(readFileSync(join(FIXTURES, file), 'utf8'));
      const migrated = migrateSave(structuredClone(old));
      expect(migrated?.version).toBe(SAVE_VERSION);
      // Opened again no sooner than she put it down, so what she took that window is still taken.
      const clock = new FakeClock(new Date(Math.max(+new Date(2026, 9, 1, 15), old.lastPlayedAt)));
      const saved = new World({ clock, ...fromSave(migrated) }).save() as Record<string, unknown>;

      for (const key of Object.keys(old)) {
        if (RECKONED.has(key)) continue;
        if (RETIRED.has(key)) {
          expect(saved, key).not.toHaveProperty(key);
          continue;
        }
        if (key === 'bag') {
          const had = (id: string) => old.bag.some((s: { id: string }) => s.id === id);
          const bag = (saved.bag as { id: string }[]).filter(
            (s) => !GIVEN.includes(s.id) || had(s.id),
          );
          expect(bag, key).toEqual(old.bag);
          continue;
        }
        if (key === 'recipes') {
          // A later build may know more from the start; none she had goes.
          expect(saved.recipes).toEqual(expect.arrayContaining(old.recipes));
          continue;
        }
        const reshape = RESHAPED[key];
        const value =
          reshape && reshape.was(old[key])
            ? reshape.back(saved[key] as Record<string, unknown>)
            : saved[key];
        expect(withoutAdded(key, value, old[key]), key).toEqual(old[key]);
      }
    });
  }
});
