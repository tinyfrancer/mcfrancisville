import type { Feeling } from '../types/mood';
import type { Sketch } from './sketch';

/*
 * The faces of their own (V1's L7, decision 296): Gourdon's carving, Barty's skull, the Moon Pie
 * Man's smile under his shades and Maude's eyes behind her glasses, each in every feeling, in the
 * keys their touches already colour. The doll's own face is `faces.ts`.
 */

type FaceView = 'front' | 'side';

/** Gourdon's carved eyes, each a cut 5 wide round `x` at rows 11–13, pointing up by default. */
function carvedEye(s: Sketch, x: number, feel: Feeling | null, inward: 1 | -1): void {
  const row = (y: number, from: number, to: number) => s.rect(x + from, y, to - from + 1, 1, 'c');
  switch (feel) {
    case 'laugh':
      // An arch, shut with laughing.
      row(12, -2, 2);
      s.set(x - 2, 13, 'c').set(x + 2, 13, 'c');
      return;
    case 'surprised':
      row(11, -1, 1);
      row(12, -2, 2);
      row(13, -1, 1);
      return;
    case 'sad':
      row(11, -2, 2);
      row(12, -1, 1);
      s.set(x, 13, 'c');
      return;
    case 'shy':
      s.set(x, 12, 'c');
      row(13, -1, 1);
      return;
    case 'cross': {
      // Low at the inner corner.
      const a = (d: number) => d * inward;
      for (const [y, from, to] of [
        [11, -2, -1],
        [12, -2, 1],
        [13, -1, 2],
      ] as const) {
        const [l, r] = [a(from), a(to)].sort((p, q) => p - q) as [number, number];
        row(y, l, r);
      }
      return;
    }
    default:
      s.set(x, 11, 'c');
      row(12, -1, 1);
      row(13, -2, 2);
  }
}

/** Gourdon's carved mouth, `w` wide from `left`, with a tooth or two left in. */
function carvedMouth(s: Sketch, left: number, w: number, feel: Feeling | null): void {
  const mid = left + Math.floor(w / 2);
  switch (feel) {
    case 'laugh':
      s.set(left, 17, 'c').set(left + w - 1, 17, 'c');
      s.rect(left, 18, w, 2, 'c')
        .rect(left + 1, 20, w - 2, 1, 'c')
        .rect(left + 3, 21, w - 6, 1, 'c');
      s.set(left + 3, 18, 'm').set(left + w - 4, 20, 'm');
      return;
    case 'surprised':
      s.rect(mid - 2, 18, 4, 1, 'c')
        .rect(mid - 3, 19, 6, 2, 'c')
        .rect(mid - 2, 21, 4, 1, 'c');
      return;
    case 'sad':
      s.rect(left + 2, 18, w - 4, 1, 'c').rect(left, 19, w, 1, 'c');
      s.set(left, 20, 'c').set(left + w - 1, 20, 'c');
      s.set(left + 4, 19, 'm');
      return;
    case 'shy': {
      const l = mid - 3;
      s.set(l, 18, 'c')
        .set(l + 5, 18, 'c')
        .rect(l, 19, 6, 1, 'c')
        .rect(l + 1, 20, 4, 1, 'c');
      return;
    }
    case 'cross':
      s.rect(left + 1, 19, w - 2, 1, 'c');
      for (let x = left + 1; x < left + w - 1; x += 2) s.set(x, 20, 'c');
      return;
    default:
      s.set(left, 18, 'c').set(left + w - 1, 18, 'c');
      s.rect(left, 19, w, 1, 'c').rect(left + 1, 20, w - 2, 1, 'c');
      // A tooth hanging from the top, and one standing up from the bottom.
      s.set(left + 3, 19, 'm').set(left + w - 4, 20, 'm');
      // Gladder still, his grin carved up toward his eyes.
      if (feel === 'happy') s.set(left, 17, 'c').set(left + w - 1, 17, 'c');
  }
}

/** Gourdon's carved face on his pumpkin, centred on `cx`, as he feels. */
export function carvePumpkin(s: Sketch, view: FaceView, cx: number, feel: Feeling | null): void {
  const at = view === 'front' ? [cx - 5, cx + 4] : [cx + 6];
  at.forEach((x) => carvedEye(s, x, feel, view === 'side' || x < cx ? 1 : -1));
  const nose = view === 'front' ? cx - 1 : cx + 9;
  s.set(nose, 15, 'c').rect(nose, 16, 2, 1, 'c');
  const [left, w] = view === 'front' ? [cx - 6, 12] : [cx + 3, 8];
  carvedMouth(s, left, w, feel);
}

/** One of Barty's sockets at `x`, with its twinkle, as he feels. */
function socket(s: Sketch, x: number, feel: Feeling | null, inward: 1 | -1): void {
  switch (feel) {
    case 'laugh':
      s.rect(x + 1, 15, 2, 1, 'k')
        .set(x, 16, 'k')
        .set(x + 3, 16, 'k');
      return;
    case 'surprised':
      s.rect(x + 1, 13, 2, 1, 'k')
        .rect(x, 14, 4, 3, 'k')
        .rect(x + 1, 17, 2, 1, 'k');
      s.set(x + 1, 14, 'w');
      return;
    case 'cross':
      // Its top cut off at the inner corner, a frown of bone.
      s.rect(inward > 0 ? x : x + 2, 14, 2, 1, 'k')
        .rect(x, 15, 4, 2, 'k')
        .rect(x + 1, 17, 2, 1, 'k');
      s.set(x + 1, 15, 'w');
      return;
    default:
      s.rect(x + 1, 14, 2, 1, 'k')
        .rect(x, 15, 4, 2, 'k')
        .rect(x + 1, 17, 2, 1, 'k');
      // The twinkle sinks when he's sad and slides aside when he's bashful.
      s.set(feel === 'shy' ? x + 2 : x + 1, feel === 'sad' || feel === 'shy' ? 16 : 15, 'w');
  }
}

/** Barty's skull's face: sockets, a heart of a nose and a grin, as he feels. */
export function skullFace(s: Sketch, view: FaceView, feel: Feeling | null): void {
  if (view === 'front') {
    socket(s, 10, feel, 1);
    socket(s, 18, feel, -1);
    s.set(10, 18, 'c').set(21, 18, 'c');
    if (feel === 'shy') s.set(9, 18, 'c').set(22, 18, 'c');
    s.rect(15, 19, 2, 1, 'k').set(14, 19, 'c').set(17, 19, 'c');
    switch (feel) {
      case 'laugh':
        s.set(11, 20, 'k').set(20, 20, 'k').rect(12, 21, 8, 1, 'k').rect(13, 22, 6, 1, 'k');
        return;
      case 'surprised':
        s.rect(14, 21, 4, 2, 'k');
        return;
      case 'sad':
        s.rect(13, 21, 6, 1, 'k').set(12, 22, 'k').set(19, 22, 'k');
        return;
      case 'shy':
        s.set(13, 20, 'k').set(18, 20, 'k').rect(14, 21, 4, 1, 'k');
        return;
      case 'cross':
        s.rect(13, 21, 6, 1, 'k');
        for (const x of [14, 16]) s.set(x, 22, 'c');
        return;
      default:
        s.set(12, 20, 'k').set(19, 20, 'k').rect(13, 21, 6, 1, 'k');
        for (const x of [14, 16, 18]) s.set(x, 22, 'c');
        // Gladder still, his grin up to his cheekbones.
        if (feel === 'happy') s.set(11, 19, 'k').set(20, 19, 'k');
    }
    return;
  }
  socket(s, 19, feel, 1);
  s.set(23, 18, 'c').rect(23, 19, 1, 1, 'k');
  switch (feel) {
    case 'laugh':
      s.set(18, 20, 'k').rect(19, 21, 5, 1, 'k').rect(20, 22, 3, 1, 'k');
      return;
    case 'surprised':
      s.rect(21, 21, 2, 2, 'k');
      return;
    case 'sad':
      s.rect(19, 21, 4, 1, 'k').set(18, 22, 'k');
      return;
    case 'shy':
      s.rect(20, 21, 3, 1, 'k').set(19, 20, 'k');
      return;
    case 'cross':
      s.rect(19, 21, 4, 1, 'k');
      return;
    default:
      s.rect(19, 21, 4, 1, 'k').set(18, 20, 'k').set(20, 22, 'c');
      if (feel === 'happy') s.set(17, 19, 'k');
  }
}

/** The Moon Pie Man's mouth under his shades, in his skin's shade, with ink inside. */
export function shadesMouth(s: Sketch, view: FaceView, feel: Feeling | null): void {
  const front: Record<Feeling | 'smile', readonly string[]> = {
    smile: ['m....m', '.mmmm.'],
    happy: ['m....m', '.mwwm.'],
    laugh: ['mmmmmm', 'mkkkkm', '.mmmm.'],
    surprised: ['..mm..', '.mkkm.', '..mm..'],
    sad: ['.mmmm.', 'm....m'],
    shy: ['......', '..mm..'],
    cross: ['.....m', '.mmmm.'],
  };
  const side: Record<Feeling | 'smile', readonly string[]> = {
    smile: ['m..', '.mm'],
    happy: ['m..', '.mw'],
    laugh: ['mmm', 'mkm', '.m.'],
    surprised: ['.m.', 'mkm', '.m.'],
    sad: ['.mm', 'm..'],
    shy: ['...', '.m.'],
    cross: ['..m', 'mmm'],
  };
  const rows = (view === 'front' ? front : side)[feel ?? 'smile'];
  s.stamp({ rows }, view === 'front' ? 13 : 20, 20);
}

/** Maude's eye inside her lens at `x` (its 3×3 glass), and how she feels. */
export function maudeEye(s: Sketch, x: number, feel: Feeling | null, blink: boolean): void {
  if (blink && feel !== 'laugh') {
    s.rect(x + 1, 18, 3, 1, 'e');
    return;
  }
  switch (feel) {
    case 'laugh':
      s.set(x + 1, 17, 'e')
        .set(x + 2, 16, 'e')
        .set(x + 3, 17, 'e');
      return;
    case 'surprised':
      s.rect(x + 1, 16, 3, 3, 'e').set(x + 1, 16, 'l');
      return;
    case 'sad':
      s.rect(x + 1, 17, 2, 2, 'e').set(x + 1, 17, 'l');
      return;
    case 'shy':
      s.rect(x + 2, 17, 2, 2, 'e');
      return;
    case 'cross':
      s.rect(x + 1, 16, 3, 1, 'W').rect(x + 1, 17, 2, 2, 'e');
      return;
    default:
      s.rect(x + 1, 16, 2, 2, 'e').set(x + 1, 16, 'l');
  }
}

/** Maude's mouth under her glasses' chain, and her blush, as she feels. */
export function maudeMouth(s: Sketch, view: FaceView, feel: Feeling | null): void {
  const front: Record<Feeling | 'calm', readonly string[]> = {
    calm: ['....', '.uu.'],
    happy: ['u..u', '.uu.'],
    laugh: ['uuuu', 'ueeu', '.uu.'],
    surprised: ['.uu.', 'ueeu', '.uu.'],
    sad: ['.uu.', 'u..u'],
    shy: ['....', '.uu.'],
    cross: ['...u', 'uuu.'],
  };
  const side: Record<Feeling | 'calm', readonly string[]> = {
    calm: ['..', 'u.'],
    happy: ['.u', 'u.'],
    laugh: ['uu', 'eu', 'u.'],
    surprised: ['u.', 'eu', 'u.'],
    sad: ['u.', '.u'],
    shy: ['..', 'u.'],
    cross: ['.u', 'uu'],
  };
  const key = feel ?? 'calm';
  if (view === 'front') {
    s.stamp({ rows: front[key] }, 14, 21);
    if (feel === 'shy') s.rect(8, 21, 4, 1, 'c').rect(20, 21, 4, 1, 'c');
  } else {
    s.stamp({ rows: side[key] }, 23, 21);
    if (feel === 'shy') s.rect(21, 21, 3, 1, 'c');
  }
}
