import { describe, expect, it } from 'vitest';
import { VILLAGER_IDS, VILLAGERS } from '../../src/data/villagers';
import { WORK_IDS, WORKS } from '../../src/data/work';
import { DOLL_FRAMES, HAT_ROOM, SIT_DROP, viewOf } from '../../src/sprites/doll';
import { rasterizeLayers, spriteSize } from '../../src/sprites/sprite';
import { workPose } from '../../src/sprites/working';
import {
  figureLayers,
  MAUDE_GLOW,
  maudeRows,
  pumpkinHead,
  PUMPKIN_HEAD_GLOW,
  stanceFolded,
  type Figure,
  type Stance,
} from '../../src/sprites/villagers';
import type { Facing } from '../../src/types/ids';

const FACINGS: Facing[] = ['down', 'up', 'left', 'right'];
const FIGURES: Figure[] = [...VILLAGER_IDS, 'moonPieMan'];

/** How many pixels of a grid are one of `keys`. */
const count = (rows: readonly string[], keys: string) =>
  rows
    .join('')
    .split('')
    .filter((k) => keys.includes(k)).length;

describe('the villagers', () => {
  it('draw at her scale, in every facing and frame', () => {
    for (const id of FIGURES) {
      for (const facing of FACINGS) {
        for (let frame = 0; frame < DOLL_FRAMES; frame++) {
          const layers = figureLayers(id, facing, frame);
          // Her scale, and room over her head only for a tall hat (Agatha's witch hat).
          const tall = id === 'agatha' ? 48 + HAT_ROOM : 48;
          for (const layer of layers) {
            expect(spriteSize(layer.source), `${id} ${facing} ${frame}`).toEqual({
              width: 32,
              height: tall,
            });
          }
          const raster = rasterizeLayers(layers, { flipX: facing === 'left' });
          expect(
            raster.data.some((v, i) => i % 4 === 3 && v > 0),
            id,
          ).toBe(true);
        }
      }
    }
  });

  it('draw in costume, every layer the same size, in every facing and frame', () => {
    for (const id of VILLAGER_IDS) {
      for (const facing of FACINGS) {
        for (let frame = 0; frame < DOLL_FRAMES; frame++) {
          const layers = figureLayers(id, facing, frame, 'own');
          const sizes = new Set(layers.map((l) => JSON.stringify(spriteSize(l.source))));
          expect(sizes.size, `${id} ${facing} ${frame}`).toBe(1);
          expect(spriteSize(layers[0]!.source).width).toBe(32);
        }
      }
    }
  });

  it("light up Gourdon's carved face after dark, from the front and side only", () => {
    const lit = Object.keys(PUMPKIN_HEAD_GLOW).join('');
    expect(count(pumpkinHead('down', 0).rows, lit)).toBeGreaterThan(20);
    expect(count(pumpkinHead('right', 0).rows, lit)).toBeGreaterThan(8);
    expect(count(pumpkinHead('up', 0).rows, lit)).toBe(0);
  });

  it("glow Maude's sheet but not the book she holds", () => {
    const glows = Object.keys(MAUDE_GLOW).join('');
    const front = maudeRows('down');
    expect(count(front, 'Bbp')).toBeGreaterThan(40);
    expect(glows).not.toMatch(/[Bbpg]/);
    expect(count(front, glows)).toBeGreaterThan(count(front, 'Bbp') * 5);
  });
});

/** A figure flattened to one picture's pixels, for comparing two of them. */
const flat = (id: Figure, facing: Facing, stance: Stance, frame = 0) =>
  Array.from(rasterizeLayers(figureLayers(id, facing, frame, null, null, stance)).data).join();

describe("the villagers alive (V1's E3)", () => {
  it('wave, blink, sit and breathe, every layer at their size, each a picture of its own', () => {
    for (const id of VILLAGER_IDS) {
      const still = flat(id, 'down', {});
      const stances: Stance[] = [
        { act: 'wave', frame: 0 },
        { act: 'wave', frame: 1 },
        { sit: true },
        { out: true },
        { sit: true, act: 'wave', frame: 1 },
      ];
      // A pumpkin and a skull have faces of their own, with no lids to blink.
      if (id !== 'gourdon' && id !== 'barty') stances.push({ blink: true });
      const seen = new Set([still]);
      for (const stance of stances) {
        const layers = figureLayers(id, 'down', 0, null, null, stance);
        const tall = id === 'agatha' ? 48 + HAT_ROOM : 48;
        for (const l of layers) expect(spriteSize(l.source)).toEqual({ width: 32, height: tall });
        const picture = flat(id, 'down', stance);
        expect(seen.has(picture), `${id} ${JSON.stringify(stance)}`).toBe(false);
        seen.add(picture);
      }
    }
  });

  it('do every job a stop of theirs names, in two frames that differ, facing its way', () => {
    let jobs = 0;
    for (const id of VILLAGER_IDS) {
      const { weekday, weekend } = VILLAGERS[id].schedule;
      for (const work of new Set([...weekday, ...weekend].flatMap((s) => s.doing ?? []))) {
        const facing = WORKS[work].faces;
        const still = flat(id, facing, {});
        const frames = [0, 1].map((frame) => flat(id, facing, { act: work, frame }));
        expect(frames[0], `${id} ${work}`).not.toBe(still);
        expect(frames[0], `${id} ${work}`).not.toBe(frames[1]);
        jobs += 1;
      }
    }
    expect(jobs).toBe(12);
  });

  it("hold what they're working with inside their picture, and light Nessa's lantern", () => {
    for (const work of WORK_IDS) {
      if (work === 'reading') {
        expect(workPose(work, 'front', 0)).toBeNull();
        continue;
      }
      const view = viewOf(WORKS[work].faces);
      for (const frame of [0, 1]) {
        const pose = workPose(work, view, frame)!;
        expect(pose.held.length, work).toBeGreaterThan(0);
        for (const h of pose.held) {
          expect(spriteSize({ rows: h.rows })).toEqual({ width: 32, height: 48 });
        }
      }
      // Asked for another way, it isn't drawn, and they stand.
      expect(workPose(work, view === 'front' ? 'back' : 'front', 0)).toBeNull();
    }
    expect(workPose('lantern', 'front', 0)!.held.some((h) => h.lit)).toBe(true);
  });

  it("sway Maude's hem as she drifts, so her walk has frames", () => {
    const frames = [0, 1, 2].map((frame) => flat('maude', 'down', {}, frame));
    expect(new Set(frames).size).toBe(3);
    expect(maudeRows('down', { hem: 1 })).not.toEqual(maudeRows('down'));
  });

  it("fold Gourdon's glow with him, so his face stays lit where it is", () => {
    const lit = Object.keys(PUMPKIN_HEAD_GLOW).join('');
    const head = pumpkinHead('down', 0);
    const [sat] = stanceFolded([{ source: { rows: head.rows }, palette: head.palette }], {
      sit: true,
    });
    const firstLit = (rows: readonly string[]) => rows.findIndex((r) => count([r], lit) > 0);
    expect(firstLit(sat!.source.rows)).toBe(firstLit(head.rows) + SIT_DROP);
  });
});
