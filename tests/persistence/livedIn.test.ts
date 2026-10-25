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
 * museum, a figurine carved, the week's set bought, an order on its way). 1.0's was played over
 * four days by real taps in a dev build, a new town from its title (Cody's first-day list done,
 * the bandstand started, a ghost minnow measured, Fibi fond to her first level, Wrapunzel's first
 * story told, Cody's question and his "how was your day?" answered, the wandering stall seen).
 * 1.2's is 1.0's opened in a 1.2 dev build as her phone will open it (through steps 53 and 54),
 * then played on by taps over four days to 5 October: the square's bench sat on, the fair's free
 * go, Whisperwood and Lantern Shore found on foot and their ice skated, talks with every build of
 * neighbour, the back room built with a pumpkin growing in a planter there, Fibi fond enough for
 * her trick, and Rufus's lost frog carried home on a rare event's day.
 */
const LIVED_IN = {
  '0.2.2': 'lived-in-v27.json',
  '0.2.3': 'lived-in-v31.json',
  '0.2.5': 'lived-in-v34.json',
  '0.3': 'lived-in-v43.json',
  '1.0': 'lived-in-v53.json',
  '1.2': 'lived-in-v55.json',
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
  // V1's R6a: the biggest of each fish she has landed; 1.4's G1: her shinies, and those on show;
  // 1.5's G4: her star chart.
  cabinet: ['best', 'shinies', 'shinyShown', 'stars'],
  // V1's R6c: how fond each pet has grown of her.
  pets: ['affection'],
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
      // Opened again just as she put it down, so what she took that window is still taken (1.0's
      // was played in September, before the 1 October the older ones were once opened on).
      const clock = new FakeClock(new Date(old.lastPlayedAt));
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

describe("1.2's town on her phone opening 1.4 (1.4's G1, save v56)", () => {
  it('opens with no shinies caught or on show, and every critter it had still had', () => {
    const old = JSON.parse(readFileSync(join(FIXTURES, LIVED_IN['1.2']), 'utf8'));
    const migrated = migrateSave(structuredClone(old));
    expect(migrated?.version).toBe(SAVE_VERSION);
    expect(migrated?.cabinet.shinies).toEqual({});
    expect(migrated?.cabinet.shinyShown).toEqual([]);
    const world = new World({
      clock: new FakeClock(new Date(old.lastPlayedAt)),
      ...fromSave(migrated),
    });
    expect(world.cabinet.shinies).toBe(0);
    expect(world.cabinet.found).toBe(Object.keys(old.cabinet.caught).length);
    expect(world.milestones.progress('shinies').have).toBe(0);
    expect(world.mailbox.letters.has('shelf:shinyFamilies')).toBe(false);
  });
});

describe("1.2's town on her phone opening 1.5 (1.5's G4, save v57)", () => {
  it('opens with an empty star chart, and every critter it had still had', () => {
    const old = JSON.parse(readFileSync(join(FIXTURES, LIVED_IN['1.2']), 'utf8'));
    const migrated = migrateSave(structuredClone(old));
    expect(migrated?.version).toBe(SAVE_VERSION);
    expect(migrated?.cabinet.stars).toEqual({});
    const world = new World({
      clock: new FakeClock(new Date(old.lastPlayedAt)),
      ...fromSave(migrated),
    });
    expect(world.cabinet.stars).toBe(0);
    expect(world.cabinet.found).toBe(Object.keys(old.cabinet.caught).length);
    expect(world.milestones.progress('halfTheSky')).toEqual({ have: 0, total: 8, done: false });
    expect(world.mailbox.letters.has('stars:first')).toBe(false);
  });
});

describe('a planter in a lived-in front room (1.1’s W2, save v55)', () => {
  it('comes through in the front room, with its crop growing and its sprinkler', () => {
    const old = JSON.parse(readFileSync(join(FIXTURES, LIVED_IN['1.0']), 'utf8'));
    const clock = new FakeClock(new Date(old.lastPlayedAt));
    // Where a planter fits in 1.0's front room, as the decorator would set one down.
    const probe = new World({ clock, ...fromSave(migrateSave(structuredClone(old))) });
    probe.home.store('planterBox');
    const at = probe.home.rooms.takeOut('planterBox', { tx: 6, ty: 6 }, null)!;
    expect(at).not.toBeNull();
    // As 1.0's code saved a planter: its bed and sprinkler at home, with no room.
    const day = 24 * 60 * 60 * 1000;
    const planting = {
      crop: 'pumpkin',
      plantedAt: old.lastPlayedAt - day,
      waterings: 1,
      lastWatered: null,
    };
    old.home.rooms.main.placed.push({ id: 'planterBox', tx: at.tx, ty: at.ty, turn: 0 });
    old.beds.push({ zone: 'home', tx: at.tx, ty: at.ty, planting });
    old.sprinklers.push({ zone: 'home', tx: at.tx, ty: at.ty, since: '2026-09-20' });
    const migrated = migrateSave(structuredClone(old));
    expect(migrated?.version).toBe(SAVE_VERSION);
    const world = new World({ clock, ...fromSave(migrated) });
    const bed = { zone: 'home' as const, room: 'main' as const, tx: at.tx, ty: at.ty };
    expect(world.farm.planting(bed)).toEqual(planting);
    expect(world.farm.hasSprinkler(bed)).toBe(true);
    expect(world.farm.sprinkled(bed)).toBe('2026-09-20');
    const saved = world.save();
    expect(saved.beds).toContainEqual({ ...bed, planting });
    expect(saved.sprinklers).toContainEqual({ ...bed, since: '2026-09-20' });
    // Nothing went back in her bag: no seed from a bed gone, no sprinkler from nowhere.
    const count = (id: string) => saved.bag.find((s) => s.id === id)?.count ?? 0;
    const had = (id: string) => old.bag.find((s: { id: string }) => s.id === id)?.count ?? 0;
    expect(count('pumpkinSeed')).toBe(had('pumpkinSeed'));
    expect(count('sprinkler')).toBe(had('sprinkler'));
  });
});
