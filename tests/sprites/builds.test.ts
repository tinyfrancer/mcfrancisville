import { describe, expect, it } from 'vitest';
import { BUILD_IDS } from '../../src/data/builds';
import { OUTFITS } from '../../src/data/outfits';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';
import { WORK_IDS, WORKS } from '../../src/data/work';
import {
  ACTION_BODIES,
  ACTION_BODY,
  ACTION_FRAMES,
  ACTION_POSES,
  BODY,
  backRows,
  bodyOf,
  DOLL_FRAMES,
  measureOf,
  pieceRows,
  type Grid,
  type View,
} from '../../src/sprites/doll';
import { rasterizeLayers, spriteSize } from '../../src/sprites/sprite';
import { buildOf, figureLayers } from '../../src/sprites/villagers';
import { workPose } from '../../src/sprites/working';
import type { OutfitId } from '../../src/types/ids';

const VIEWS: View[] = ['front', 'back', 'side'];
const EVERYTHING = Object.keys(OUTFITS) as OutfitId[];

/** The columns of a row that are one of `keys`. */
const cols = (row: string, keys: string) =>
  [...row].flatMap((k, x) => (keys.includes(k) ? [x] : []));

/** Every body of a build: standing and walking, and every action's (and its arms over). */
function bodiesOf(build: (typeof BUILD_IDS)[number]): [string, Grid][] {
  const out: [string, Grid][] = [];
  for (const view of VIEWS) bodyOf(build)[view].forEach((b, i) => out.push([`${view}:${i}`, b]));
  for (const pose of ACTION_POSES) {
    for (const view of VIEWS) {
      ACTION_BODIES[build][pose][view].forEach(({ body, over }, i) => {
        out.push([`${pose}:${view}:${i}`, body]);
        if (over) out.push([`${pose}:${view}:${i}:over`, over]);
      });
    }
  }
  return out;
}

describe("the builds (1.1's A5a)", () => {
  it('give her build her own bodies', () => {
    expect(bodyOf('regular')).toBe(BODY);
    expect(ACTION_BODIES.regular).toBe(ACTION_BODY);
  });

  it('are each 32x48 in her regions only, for every view, frame and action', () => {
    for (const build of BUILD_IDS) {
      for (const view of VIEWS) expect(bodyOf(build)[view]).toHaveLength(DOLL_FRAMES);
      for (const pose of ACTION_POSES) {
        for (const view of VIEWS) {
          expect(ACTION_BODIES[build][pose][view]).toHaveLength(ACTION_FRAMES[pose]);
        }
      }
      for (const [name, body] of bodiesOf(build)) {
        expect(spriteSize({ rows: body }), `${build} ${name}`).toEqual({ width: 32, height: 48 });
        expect(body.join(''), `${build} ${name}`).toMatch(/^[.snbpaewAlfo]+$/);
      }
    }
  });

  it('keep her head and her rows: shoulders, hips, legs and feet where hers are', () => {
    for (const build of BUILD_IDS) {
      for (const view of VIEWS) {
        const body = bodyOf(build)[view][0]!;
        const hers = BODY[view][0]!;
        const rowsOf = (b: Grid, keys: string) =>
          b.flatMap((row, y) => (cols(row, keys).length > 0 ? [y] : []));
        // The same head, so her faces, hair and hats sit on it as on her.
        expect(
          body.slice(0, 23).map((r) => cols(r, 's')),
          `${build} ${view}`,
        ).toEqual(hers.slice(0, 23).map((r) => cols(r, 's')));
        for (const keys of ['n', 'b', 'p', 'l', 'f']) {
          expect(rowsOf(body, keys), `${build} ${view} ${keys}`).toEqual(rowsOf(hers, keys));
        }
        // Feet on the bottom row but one, the outline under them.
        expect(body[46], build).toContain('f');
        expect(body[47], build).not.toMatch(/[^.o]/);
      }
    }
  });

  it('measure what they draw: the chest, hips, neck and legs a cut steps in from', () => {
    for (const build of BUILD_IDS) {
      const front = bodyOf(build).front[0]!;
      const side = bodyOf(build).side[0]!;
      const m = measureOf(front);
      expect(measureOf(side), build).toBe(m);
      const span = (row: string, keys: string) => {
        const c = cols(row, keys);
        return [Math.min(...c), Math.max(...c)];
      };
      expect(span(front[30]!, 'b'), build).toEqual([m.left, m.right]);
      expect(span(front[35]!, 'p'), build).toEqual([...m.hips]);
      expect(span(front[24]!, 'n'), build).toEqual([...m.neck]);
      expect(span(side[27]!, 'b'), build).toEqual([m.back, m.front]);
      expect(span(side[35]!, 'p'), build).toEqual([m.back, m.front]);
      const legs = cols(front[40]!, 'l');
      expect([legs.slice(0, legs.length / 2), legs.slice(legs.length / 2)], build).toEqual(
        m.legs.map(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i)),
      );
      // Every arm is drawn whole, its outline inside the picture.
      for (const [name, body] of bodiesOf(build)) {
        for (const row of body) expect(row[0]! + row[31]!, `${build} ${name}`).toMatch(/^[.o]+$/);
      }
    }
  });

  it('take every piece in every view on every body', () => {
    for (const build of BUILD_IDS) {
      for (const [name, body] of bodiesOf(build)) {
        const view: View = name.includes('side')
          ? 'side'
          : name.includes('back')
            ? 'back'
            : 'front';
        for (const id of EVERYTHING) {
          const worn = { id, fabric: OUTFITS[id].fabrics[0]! };
          const rows = pieceRows(worn, view, body);
          expect(spriteSize({ rows }).width, `${build} ${name} ${id}`).toBe(32);
          for (const part of ['behind', 'over'] as const) backRows(worn, view, body, part);
        }
      }
    }
  }, 60_000);

  it('cast the town (A5b): each neighbour on their row, the unrowed by name, hers for the rest', () => {
    const cast = (build: string) =>
      [...VILLAGER_IDS, 'moonPieMan', 'wes', 'wayfarer', 'moira']
        .filter((id) => buildOf(id as Parameters<typeof buildOf>[0]) === build)
        .sort();
    expect(cast('stout')).toEqual(['gourdon', 'moonPieMan', 'rufus']);
    expect(cast('slight')).toEqual(['barty', 'robBoo', 'scarah', 'wes']);
    for (const id of VILLAGER_IDS) expect(buildOf(id)).toBe(VILLAGERS[id].build);
    expect(buildOf('cody'), 'Cody is drawn as she is').toBe('regular');
    for (const id of ['wayfarer', 'moira'] as const) expect(buildOf(id)).toBe('regular');
  });

  it('draw a stout neighbour broader than her and a slight one narrower, every way', () => {
    const width = (rows: readonly string[], keys: string) => {
      const c = rows.flatMap((row) => cols(row, keys));
      return Math.max(...c) - Math.min(...c);
    };
    // Her body's regions below the head, against their skin's tones.
    const hers = width(BODY.front[0]!.slice(24), 'nbpaewAlf');
    expect(hers).toBe(19);
    const cast = [
      ['rufus', 1],
      ['gourdon', 1],
      ['moonPieMan', 1],
      ['barty', -1],
      ['scarah', -1],
      ['robBoo', -1],
      ['wes', -1],
    ] as const;
    for (const [id, way] of cast) {
      for (const facing of ['down', 'up', 'left', 'right'] as const) {
        for (let frame = 0; frame < DOLL_FRAMES; frame++) {
          for (const costume of [null, 'own'] as const) {
            const layers = figureLayers(id, facing, frame, costume);
            expect(() => rasterizeLayers(layers), `${id} ${facing}`).not.toThrow();
          }
        }
      }
      // Their skin reaches further out, or less far, than it would on her body.
      const skin = figureLayers(id, 'down', 0).find((l) => /[sS]/.test(l.source.rows.join('')));
      // From her feet up (a tall hat lifts every layer).
      expect(Math.sign(width(skin!.source.rows.slice(-24), 'sS') - hers), id).toBe(way);
    }
  });

  it('hold what they work with inside the picture, as far apart as their hands', () => {
    for (const build of BUILD_IDS) {
      for (const work of WORK_IDS) {
        if (work === 'reading') continue;
        const facing = WORKS[work].faces;
        const view: View = facing === 'down' ? 'front' : facing === 'up' ? 'back' : 'side';
        for (const frame of [0, 1]) {
          const pose = workPose(work, view, frame, build)!;
          expect(pose, `${build} ${work}`).not.toBeNull();
          for (const held of pose.held) {
            expect(spriteSize({ rows: held.rows })).toEqual({ width: 32, height: 48 });
          }
        }
      }
    }
  });
});
