/**
 * See-through trees (0.3's A3). A tree's crown covers the rows above its base, where critters are
 * dealt, where she walks and where toadstools and rocks stand; whatever she might want that's
 * hidden behind one fades the tree to about half, eased in and out over a few steps.
 */

/** Which pixels of a sprite are drawn, one byte a pixel, row by row, and how many there are. */
export interface Mask {
  width: number;
  height: number;
  solid: Uint8Array;
  count: number;
}

/** Something stood in the world: its top-left in whole world pixels, its feet and its mask. */
export interface Placed {
  x: number;
  y: number;
  footY: number;
  mask: Mask;
}

/** How opaque a tree is while it's hiding something. */
export const SEE_THROUGH_ALPHA = 0.5;
/** How many of a thing's pixels a crown must hide before it fades: a leaf over her hair isn't it. */
export const HIDDEN_PIXELS = 12;
/** How long a crown takes to fade, and to come back. */
export const FADE_MS = 200;
/**
 * How long a crown stays faded once nothing is behind it: her walk frames and a fluttering moth
 * move a pixel or two in and out of its edge, and that shouldn't flicker it.
 */
export const LINGER_MS = 250;

/**
 * How many pixels of `behind` that `front` draws over, counting no further than `enough`: where
 * both are solid, in the rows and columns they share.
 */
export function hiddenPixels(front: Placed, behind: Placed, enough = Infinity): number {
  const left = Math.max(front.x, behind.x);
  const right = Math.min(front.x + front.mask.width, behind.x + behind.mask.width);
  const top = Math.max(front.y, behind.y);
  const bottom = Math.min(front.y + front.mask.height, behind.y + behind.mask.height);
  let hidden = 0;
  for (let y = top; y < bottom; y++) {
    const f = (y - front.y) * front.mask.width - front.x;
    const b = (y - behind.y) * behind.mask.width - behind.x;
    for (let x = left; x < right; x++) {
      if (front.mask.solid[f + x] && behind.mask.solid[b + x] && ++hidden >= enough) return hidden;
    }
  }
  return hidden;
}

/**
 * The crowns hiding something she might want: anything drawn before the crown (its feet higher up
 * the screen) with enough of it under the crown's pixels, or all of it, if it's smaller than that.
 */
export function coveredCrowns<K>(
  crowns: readonly (Placed & { key: K })[],
  wanted: readonly Placed[],
): Set<K> {
  const covered = new Set<K>();
  for (const crown of crowns) {
    for (const w of wanted) {
      if (w.footY >= crown.footY) continue;
      const enough = Math.max(1, Math.min(HIDDEN_PIXELS, w.mask.count));
      if (hiddenPixels(crown, w, enough) >= enough) {
        covered.add(crown.key);
        break;
      }
    }
  }
  return covered;
}

/**
 * How near her something must be for a tree hiding it to fade, in world pixels: three tiles. A
 * wood has toadstools, flowers and critters behind half its trees, and fading every one of them
 * at once would turn the whole wood to glass; near her, it's what she's come to find.
 */
export const NEAR_HER = 3 * 32;

/** What of `others` stands near her, measured between where each one's feet are. */
export function nearHer<T extends Placed>(her: Placed, others: readonly T[]): T[] {
  const feet = (p: Placed) => p.x + p.mask.width / 2;
  return others.filter(
    (o) => Math.abs(feet(o) - feet(her)) <= NEAR_HER && Math.abs(o.footY - her.footY) <= NEAR_HER,
  );
}

/** Eases in and out, so a crown starts and finishes its fade gently. */
function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * How faded each crown is, kept by the view like its camera: told which crowns are hiding
 * something each frame (`see`), and moved on by each step of the simulation (`step`), so a fade
 * takes the same time on every phone and only ever goes one way until it's done or turned back.
 */
export class SeeThrough {
  /** How far through its fade each crown is, from 0 (solid) to 1, and how long it's been clear. */
  private readonly fading = new Map<string, { level: number; clear: number }>();
  private covered: ReadonlySet<string> = new Set();

  see(covered: ReadonlySet<string>): void {
    this.covered = covered;
  }

  step(deltaMs: number): void {
    for (const key of this.covered) {
      if (!this.fading.has(key)) this.fading.set(key, { level: 0, clear: 0 });
    }
    for (const [key, f] of this.fading) {
      if (this.covered.has(key)) {
        f.clear = 0;
        f.level = Math.min(1, f.level + deltaMs / FADE_MS);
        continue;
      }
      f.clear += deltaMs;
      if (f.clear < LINGER_MS) continue;
      f.level -= deltaMs / FADE_MS;
      if (f.level <= 0) this.fading.delete(key);
    }
  }

  /** How opaque to draw a crown now. */
  alpha(key: string): number {
    const f = this.fading.get(key);
    return f ? 1 - (1 - SEE_THROUGH_ALPHA) * smooth(f.level) : 1;
  }

  /** Every crown drawn see-through now, and how opaque. */
  faded(): { key: string; alpha: number }[] {
    return [...this.fading.keys()].map((key) => ({ key, alpha: this.alpha(key) }));
  }

  /** She has gone: every crown is solid again for when she's back. */
  clear(): void {
    this.fading.clear();
    this.covered = new Set();
  }
}

const masks = new WeakMap<HTMLCanvasElement, Mask>();

/** A baked sprite's mask, read from its pixels once. */
export function maskOf(sprite: HTMLCanvasElement): Mask {
  const known = masks.get(sprite);
  if (known) return known;
  const { width, height } = sprite;
  const solid = new Uint8Array(width * height);
  const data = sprite.getContext('2d')?.getImageData(0, 0, width, height).data;
  let count = 0;
  if (data) {
    for (let i = 0; i < solid.length; i++) {
      if (data[i * 4 + 3]! > 0) {
        solid[i] = 1;
        count++;
      }
    }
  }
  const mask = { width, height, solid, count };
  masks.set(sprite, mask);
  return mask;
}
