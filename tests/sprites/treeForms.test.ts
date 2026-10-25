import { describe, expect, it } from 'vitest';
import { ZONES } from '../../src/data/zones';
import { lookOf, PROP_ART } from '../../src/sprites/props';
import { rasterize, spriteSize, type Raster } from '../../src/sprites/sprite';
import { BROKEN_FORM, DEAD_FORM, LEANING_FORM } from '../../src/sprites/treeForms';
import { parseMap } from '../../src/systems/grid';

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

  it('come in nine shapes the size of the town tree, every one its own, in every leaf colour', () => {
    const forms = tree.forms!;
    // The town tree's three, L2's conifer, dead tree and birch, and A2's poplar, leaning and
    // broken trees for the woods' edges.
    expect(forms).toHaveLength(9);
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

  // 1.3's F4 (decision 363): A2 dealt the nine to every tree, a third of the town's bare.
  it('stand bare only in the woods and by the graves, broken and leaning only in a wood’s edge', () => {
    const counts: Partial<Record<string, number[]>> = {};
    for (const [id, zone] of Object.entries(ZONES)) {
      if (!zone.map) continue;
      const map = parseMap(zone.map);
      const tally = new Array<number>(9).fill(0);
      for (const p of map.props.filter((q) => q.id === 'tree')) {
        const form = lookOf(p).form;
        tally[form]!++;
        const at = `${id} ${p.tx},${p.ty}`;
        if (form === BROKEN_FORM || form === LEANING_FORM) expect(p.grove, at).toBe('edge');
        if (form === DEAD_FORM) expect(['edge', 'woods', 'graves'], at).toContain(p.grove);
        // The same tree every time, from its tile.
        expect(lookOf({ ...p }).key, at).toBe(lookOf(p).key);
      }
      counts[id] = tally;
    }
    // The town in leaf but the graveyard's tree; the woods keep their bare trees, edged with broken.
    const bare = (id: string) =>
      [DEAD_FORM, LEANING_FORM, BROKEN_FORM].reduce((n, f) => n + counts[id]![f]!, 0);
    expect(bare('town')).toBe(1);
    expect(counts.town![DEAD_FORM]).toBe(1);
    expect(bare('fairground') + bare('booAcres')).toBe(0);
    for (const id of ['whisperwood', 'lanternShore', 'castleHill', 'hiddenClearing']) {
      expect(counts[id]![DEAD_FORM], id).toBeGreaterThan(5);
      expect(counts[id]![BROKEN_FORM], id).toBeGreaterThan(2);
    }
  });

  it('grow Whisperwood’s old trees well over half as wide again as the town’s', () => {
    const town = widest(rasterize(tree.source, tree.palette));
    const old = widest(rasterize(PROP_ART.oldTree.source, PROP_ART.oldTree.palette));
    expect(old / town).toBeGreaterThan(1.8);
  });
});
