import { describe, expect, it } from 'vitest';
import { VILLAGER_IDS } from '../../src/data/villagers';
import { DOLL_FRAMES } from '../../src/sprites/oldDoll';
import { rasterizeLayers, spriteSize } from '../../src/sprites/sprite';
import { figureLayers, type Figure } from '../../src/sprites/villagers';
import type { Facing } from '../../src/types/ids';

const FACINGS: Facing[] = ['down', 'up', 'left', 'right'];
const FIGURES: Figure[] = [...VILLAGER_IDS, 'moonPieMan'];

describe('the villagers', () => {
  it('draw at her scale, in every facing and frame', () => {
    for (const id of FIGURES) {
      for (const facing of FACINGS) {
        for (let frame = 0; frame < DOLL_FRAMES; frame++) {
          const layers = figureLayers(id, facing, frame);
          for (const layer of layers) {
            expect(spriteSize(layer.source), `${id} ${facing} ${frame}`).toEqual({
              width: 16,
              height: 32,
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
});
