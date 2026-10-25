import { describe, expect, it } from 'vitest';
import { CRITTERS } from '../../src/data/critters';
import { CRITTER_ART } from '../../src/sprites/critters';
import { PET_ART } from '../../src/sprites/pets';
import { spriteSize, type Palette, type SpriteSource } from '../../src/sprites/sprite';
import type { CritterId } from '../../src/types/ids';

/**
 * The creatures 1.3's F3 redrew (decision 362), so the bag, the Cabinet, the museum and the world
 * (all its 24) and a small fish's shadow and the gallery (its 16) show one creature: each 16 is
 * drawn from the 24's numbers, so the two have one silhouette and one palette family.
 */
const REDRAWN: readonly CritterId[] = [
  // The bat family.
  'pumpkinBat',
  'velvetBat',
  'vampireBat',
  'lanternBat',
  'fruitBat',
  'longEaredBat',
  'ghostBat',
  'bunnyBat',
  // The moth family.
  'lunaMoth',
  'candleMoth',
  'owlEyeMoth',
  'ghostMoth',
  'wishingMoth',
  'monarch',
  'veilMoth',
  'mourningCloak',
  'snowMoth',
  'confettiMoth',
  'turkeyTailMoth',
  // The fish, and the orbs.
  'ghostMinnow',
  'booKoi',
  'moonCarp',
  'pumpkinseed',
  'blueMoonfish',
  'snowglobeFish',
  'ghostPike',
  'lanternFish',
  'greenOrb',
  'blueOrb',
  'wisp',
  'sparklerOrb',
  // The crawlies, and the markings.
  'moonCricket',
  'fiddleHopper',
  'twigKnight',
  'woollyBear',
  'glowworm',
  'skullBeetle',
];

const CLEAR = '.';

/** Where a grid is painted: its bounding box, and how many of each key. */
function survey(source: SpriteSource) {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -1, -1];
  const counts = new Map<string, number>();
  source.rows.forEach((row, y) =>
    [...row].forEach((key, x) => {
      if (key === CLEAR) return;
      [x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)];
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }),
  );
  return { width: x1 - x0 + 1, height: y1 - y0 + 1, counts };
}

/** Its silhouette's shape, by its bounding box: how many times wider than tall. */
function aspect(source: SpriteSource): number {
  const { width, height } = survey(source);
  return width / height;
}

/** Its colours, the most of it first, its outline aside: what colour the creature mostly is. */
function colours(source: SpriteSource, palette: Palette): string[] {
  const byColour = new Map<string, number>();
  for (const [key, n] of survey(source).counts) {
    const colour = palette[key];
    if (key === 'o' || !colour) continue;
    byColour.set(colour, (byColour.get(colour) ?? 0) + n);
  }
  return [...byColour].sort((a, b) => b[1] - a[1]).map(([colour]) => colour);
}

describe('the redrawn creatures (1.3 F3)', () => {
  it('draws each at 16 and at 24, the museum nook and the bag as before', () => {
    for (const id of REDRAWN) {
      const art = CRITTER_ART[id];
      for (const frame of art.frames)
        expect(spriteSize(frame), id).toEqual({ width: 16, height: 16 });
      for (const frame of art.world)
        expect(spriteSize(frame), id).toEqual({ width: 24, height: 24 });
    }
  });

  it("keeps each one's 16 and 24 the same silhouette, frame for frame", () => {
    for (const id of REDRAWN) {
      const art = CRITTER_ART[id];
      for (const i of [0, 1] as const) {
        // As wide for its height, within a quarter: a bat a bat, a fish a fish, a worm a worm.
        const ratio = aspect(art.frames[i]) / aspect(art.world[i]);
        expect(Math.abs(Math.log(ratio)), `${id} ${i} aspect`).toBeLessThan(Math.log(1.25));
        const small = survey(art.frames[i]);
        const big = survey(art.world[i]);
        // Two thirds the size, give or take a pixel and a half either way.
        expect(Math.abs(small.width - (big.width * 2) / 3), `${id} ${i} width`).toBeLessThan(2.5);
        expect(Math.abs(small.height - (big.height * 2) / 3), `${id} ${i} height`).toBeLessThan(
          2.5,
        );
      }
    }
  });

  it("keeps each one's 16 in the 24's palette family, mostly the same colour", () => {
    for (const id of REDRAWN) {
      const art = CRITTER_ART[id];
      for (const i of [0, 1] as const) {
        const big = new Set(survey(art.world[i]).counts.keys());
        for (const key of survey(art.frames[i]).counts.keys()) {
          expect(big.has(key), `${id} ${i}: '${key}' is in the 16 but not the 24`).toBe(true);
        }
        // Its main colour at 16 is among its three at 24 (a margin takes more of a smaller wing).
        const [main] = colours(art.frames[i], art.palette);
        expect(colours(art.world[i], art.palette).slice(0, 3), `${id} ${i}`).toContain(main);
      }
    }
  });

  it('gives every fish with a tail a narrow wrist before it, so its shadow reads as a fish', () => {
    const tailed = REDRAWN.filter((id) => CRITTERS[id].family === 'fish');
    for (const id of tailed) {
      const art = CRITTER_ART[id];
      for (const source of [...art.frames, ...art.world]) {
        const width = source.rows[0]!.length;
        const columns = Array.from(
          { length: width },
          (_, x) => source.rows.filter((row) => row[x] !== CLEAR).length,
        );
        const painted = columns.flatMap((h, x) => (h > 0 ? [x] : []));
        const [first, last] = [painted[0]!, painted[painted.length - 1]!];
        const third = Math.round((last - first) / 3);
        const tail = Math.max(...columns.slice(first, first + third));
        const bodyHeight = Math.max(...columns.slice(first + third, last + 1));
        const wrist = Math.min(...columns.slice(first + 1, first + 2 * third));
        expect(wrist, `${id}: a wrist narrower than its tail and body`).toBeLessThan(
          Math.min(tail, bodyHeight),
        );
      }
    }
  });

  it('gives Fibi and Dolly a muzzle facing her, and on their snouts side on', () => {
    for (const id of ['fibi', 'dolly'] as const) {
      const art = PET_ART[id];
      for (const source of [art.sitFront, ...art.trick, art.side[0], art.side[1]]) {
        expect(survey(source).counts.get('u') ?? 0, id).toBeGreaterThan(4);
      }
    }
  });
});
