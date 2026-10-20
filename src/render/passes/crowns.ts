import type { PlacedProp } from '../../systems/grid';
import type { PropId } from '../../types/ids';
import { coveredCrowns, maskOf, nearHer, SeeThrough, type Placed } from '../occlusion';
import type { Drawable } from '../scene';

/** What has a crown, drawn see-through while it hides something she might want (0.3's A3). */
export const CROWNS: ReadonlySet<PropId> = new Set([
  'tree',
  'oldTree',
  'willow',
  'candyTree',
  // Boo Acres' orchard (0.3's F1).
  'appleTree',
  'pearTree',
  'plumTree',
  'persimmonTree',
]);

/** A tree's crown, keyed by the tile it stands on. */
export function crownOf(prop: PlacedProp): { crown: string } {
  return { crown: `${prop.tx},${prop.ty}` };
}

/** A drawable as it stands, for working out what hides what: on whole pixels, with its mask. */
function placed(d: Drawable): Placed {
  return { x: Math.round(d.x), y: Math.round(d.y), footY: d.footY, mask: maskOf(d.sprite) };
}

/**
 * The see-through crowns (0.3's A3): view state, eased like the camera, between the frame's sort
 * and its drawing.
 */
export class Crowns {
  /** How faded each tree is that hides something, eased like the camera. */
  private readonly seeThrough = new SeeThrough();

  step(deltaMs: number): void {
    this.seeThrough.step(deltaMs);
  }

  clear(): void {
    this.seeThrough.clear();
  }

  /** The trees drawn see-through now, by the tile each stands on, and how opaque. */
  faded(): { tx: number; ty: number; alpha: number }[] {
    return this.seeThrough.faded().map(({ key, alpha }) => {
      const [tx, ty] = key.split(',').map(Number);
      return { tx: tx!, ty: ty!, alpha };
    });
  }

  /**
   * Draws each tree see-through as far as it has faded, once its crown hides her, or something
   * near her she might want (0.3's A3). Copies, never the drawables themselves: the props' are kept
   * from frame to frame.
   */
  fade(drawables: Drawable[], me: Drawable, wanted: readonly Drawable[]): void {
    const crowns = drawables.flatMap((d) => (d.crown ? [{ ...placed(d), key: d.crown }] : []));
    const her = placed(me);
    const behind = [her, ...nearHer(her, wanted.map(placed))];
    this.seeThrough.see(crowns.length > 0 ? coveredCrowns(crowns, behind) : new Set());
    drawables.forEach((d, i) => {
      const alpha = d.crown ? this.seeThrough.alpha(d.crown) : 1;
      if (alpha < 1) drawables[i] = { ...d, alpha };
    });
  }
}
