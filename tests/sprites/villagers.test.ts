import { describe, expect, it } from 'vitest';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { DOLL_FRAMES, HAT_ROOM } from '../../src/sprites/doll';
import { rasterizeLayers, spriteSize } from '../../src/sprites/sprite';
import {
  figureLayers,
  MAUDE_GLOW,
  maudeRows,
  pumpkinHead,
  PUMPKIN_HEAD_GLOW,
  type Figure,
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
