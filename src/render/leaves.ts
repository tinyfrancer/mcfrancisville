import { FALLING_LEAVES } from '../data/leaves';
import { bake } from '../sprites/bake';
import { LEAF_FRAMES, LEAF_PALETTES } from '../sprites/leaves';
import { tileHash } from '../sprites/terrain';
import type { PropId } from '../types/ids';
import type { Drawable } from './scene';

/*
 * Leaves falling under the trees in autumn (V1's E5), with `render/butterflies.ts` as the
 * pattern: drawing only, worked out from the clock and a phase of each leaf's own. Each drops
 * from somewhere in its tree's crown, rocking side to side, to the grass round its trunk, where
 * the baked leaves already lie, and is gone; then a while before the next.
 */

/** How long a leaf takes to fall, and how long its round is at least, its own on top. */
const FALL_MS = 4200;
const ROUND_MS = 6500;
/** How long it rocks one way and back. */
const ROCK_MS = 1300;

/** Whether leaves fall on a day, by its key. */
export function leavesFall(day: string): boolean {
  return (FALLING_LEAVES.months as readonly number[]).includes(Number(day.slice(5, 7)));
}

/** Whether a prop is a tree that lets its leaves go. */
export function shedsLeaves(id: PropId): boolean {
  return (FALLING_LEAVES.trees as readonly PropId[]).includes(id);
}

/** Where a leaf from `tree` is now, and which way it's tipped; null between falls. */
export function leafAt(
  tree: Drawable,
  index: number,
  nowMs: number,
): { x: number; y: number; frame: number; colour: number } | null {
  const w = tree.sprite.width;
  const h = tileHash(Math.round(tree.x) * 3 + index * 17, Math.round(tree.footY) + index);
  const round = ROUND_MS + (h % 9000);
  const t = (((nowMs + (h >>> 6)) % round) + round) % round;
  if (t >= FALL_MS) return null;
  const f = t / FALL_MS;
  // From the crown's middle half, across and down, to the ground round its foot.
  const startX = tree.x + w * (0.25 + ((h >>> 3) % 50) / 100);
  const startY = tree.y + tree.sprite.height * (0.2 + ((h >>> 9) % 25) / 100);
  const endY = tree.footY - 2 - ((h >>> 13) % 10);
  const sway = Math.sin((t / ROCK_MS) * Math.PI * 2 + (h % 7));
  const drift = ((h >>> 4) & 1 ? 1 : -1) * f * 10;
  const x = startX + sway * 6 + drift;
  const y = startY + (endY - startY) * f;
  return {
    x: Math.round(x),
    y: Math.round(y),
    frame: Math.cos((t / ROCK_MS) * Math.PI * 2 + (h % 7)) > 0 ? 0 : 1,
    colour: (h >>> 17) % LEAF_PALETTES.length,
  };
}

/** Every leaf falling now from these trees, drawn in front of its tree. */
export function leafDrawables(trees: readonly Drawable[], nowMs: number): Drawable[] {
  const drawn: Drawable[] = [];
  for (const tree of trees) {
    for (let i = 0; i < FALLING_LEAVES.perTree; i++) {
      const at = leafAt(tree, i, nowMs);
      if (!at) continue;
      const source = LEAF_FRAMES[at.frame]!;
      const sprite = bake(`leaf:${at.frame}:${at.colour}`, source, LEAF_PALETTES[at.colour]!);
      drawn.push({ footY: tree.footY + 1, sprite, x: at.x - 2, y: at.y - 2 });
    }
  }
  return drawn;
}
