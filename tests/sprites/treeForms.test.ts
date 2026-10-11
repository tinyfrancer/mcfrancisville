import { describe, expect, it } from 'vitest';
import { PROP_ART } from '../../src/sprites/props';
import { rasterize, spriteSize, type Raster } from '../../src/sprites/sprite';

/** How wide the opaque part of a sprite is at its widest row. */
function widest(r: Raster): number {
  let best = 0;
  for (let y = 0; y < r.height; y++) {
    let left = -1;
    let right = -1;
    for (let x = 0; x < r.width; x++) {
      if (r.data[(y * r.width + x) * 4 + 3]! === 0) continue;
      if (left < 0) left = x;
      right = x;
    }
    if (left >= 0) best = Math.max(best, right - left + 1);
  }
  return best;
}

describe('the trees (V1 L2)', () => {
  const tree = PROP_ART.tree;

  it('come in six shapes the size of the town tree, every one its own, in every leaf colour', () => {
    const forms = tree.forms!;
    expect(forms).toHaveLength(6);
    const seen = new Set<string>();
    for (const form of forms) {
      expect(spriteSize(form)).toEqual(spriteSize(tree.source));
      for (const palette of tree.variants!) {
        const r = rasterize(form, palette);
        seen.add(Array.from(r.data).join(','));
      }
    }
    expect(seen.size).toBe(forms.length * tree.variants!.length);
  });

  it('grow Whisperwood’s old trees well over half as wide again as the town’s', () => {
    const town = widest(rasterize(tree.source, tree.palette));
    const old = widest(rasterize(PROP_ART.oldTree.source, PROP_ART.oldTree.palette));
    expect(old / town).toBeGreaterThan(1.8);
  });
});
