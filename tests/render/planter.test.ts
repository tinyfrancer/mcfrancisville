import { describe, expect, it } from 'vitest';
import { TILE_SIZE } from '../../src/config/world';
import { CROPS } from '../../src/data/crops';
import { bedsInRoom } from '../../src/data/interiors';
import { cropTop } from '../../src/render/garden';
import { PLANTER_SOIL } from '../../src/sprites/crafted';
import { CROP_ART, SEEDED, SPROUT } from '../../src/sprites/garden';
import { GREENHOUSE_FIXTURE_ART } from '../../src/sprites/greenhouse';
import type { SpriteSource } from '../../src/sprites/sprite';
import type { Stage } from '../../src/systems/farming';
import type { CropId } from '../../src/types/ids';

/** The lowest row of a picture with any of these keys in it. */
const lowest = (art: SpriteSource, keys: string) =>
  art.rows.findLastIndex((row) => [...row].some((ch) => keys.includes(ch)));
const highest = (art: SpriteSource, keys: string) =>
  art.rows.findIndex((row) => [...row].some((ch) => keys.includes(ch)));

/** A crop's mound, `M` in every stage's art: the soil it was planted in. */
const MOUND = 'M';
/** The raised bed's soil (the kit's `DOOR` material, fill and shade). */
const SOIL = 'dD';

function artOf(crop: CropId, stage: Stage): SpriteSource {
  if (stage === 'seed') return SEEDED;
  if (stage === 'sprout') return SPROUT;
  return CROP_ART[crop][stage];
}

describe("the greenhouse's raised beds (decision 275)", () => {
  const [bed] = bedsInRoom('greenhouse');
  const plot = { zone: 'greenhouse' as const, ...bed! };
  const foot = (plot.ty + 1) * TILE_SIZE;
  // A fixture stands on its tile's foot (RoomView's `thingSprite`).
  const raised = GREENHOUSE_FIXTURE_ART.raisedBed.source;
  const soilTop = foot - raised.rows.length + highest(raised, SOIL);
  const soilBottom = foot - raised.rows.length + lowest(raised, SOIL);

  /** Where a stage's mound comes to in the world, planted in that raised bed. */
  const moundAt = (crop: CropId, stage: Stage) => {
    const art = artOf(crop, stage);
    return cropTop(plot, stage, { height: art.rows.length }, PLANTER_SOIL) + lowest(art, MOUND);
  };

  it('has soil for a crop to stand in', () => {
    expect(soilBottom).toBeGreaterThan(soilTop);
  });

  it('shows a seed just planted, and a sprout, in its soil, where the grown crop will stand', () => {
    for (const crop of Object.keys(CROPS) as CropId[]) {
      const grown = moundAt(crop, 'growing');
      // A ripe pumpkin or hosta covers its mound; any other shows it where it was.
      if (lowest(CROP_ART[crop].ripe, MOUND) >= 0) expect(moundAt(crop, 'ripe'), crop).toBe(grown);
      for (const stage of ['seed', 'sprout'] as const) {
        expect(Math.abs(moundAt(crop, stage) - grown), `${crop} ${stage}`).toBeLessThanOrEqual(1);
      }
      // On the soil, never floating over the bed's back edge.
      expect(grown, crop).toBeGreaterThanOrEqual(soilTop - 3);
      expect(grown, crop).toBeLessThanOrEqual(soilBottom);
    }
  });

  it('leaves a bed outdoors as it was: every stage drawn to its own tile', () => {
    const outdoors = { zone: 'town' as const, tx: 4, ty: 7 };
    for (const stage of ['seed', 'sprout', 'growing', 'ripe'] as const) {
      const art = artOf('pumpkin', stage);
      expect(cropTop(outdoors, stage, { height: art.rows.length }, 0)).toBe(
        8 * TILE_SIZE - art.rows.length,
      );
    }
  });
});
