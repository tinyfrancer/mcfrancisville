import { PALETTE } from '../sprites/palette';

/*
 * A rainbow after the rain (1.6's X4, decision 383): soft bands in an arc across the top of the
 * view, fixed to it as the sky is, its feet fading into the town. Baked once a view size, and laid
 * over each frame at the strength its ten minutes have come to: fading in, holding, fading out.
 */

/** Its bands, outside in. */
const BANDS: readonly string[] = [
  PALETTE.scarlet,
  PALETTE.pumpkin,
  PALETTE.candle,
  PALETTE.leaf,
  PALETTE.sky,
  PALETTE.lavender,
];
/** Each band's width, in world pixels. */
const BAND = 3;
/** How strong it is at its fullest: soft, the town showing through it. */
const STRENGTH = 0.38;
/** The parts of its ten minutes it takes to come and to go. */
const COMING = 0.03;
const GOING = 0.2;

const baked = new Map<string, HTMLCanvasElement>();

/** How strong the rainbow is `t` (0 to 1) through its time. */
export function rainbowStrength(t: number): number {
  if (t < 0 || t > 1) return 0;
  const coming = Math.min(1, t / COMING);
  const going = Math.min(1, (1 - t) / GOING);
  return STRENGTH * Math.min(coming, going);
}

/** The arc for a view `width` by `height`, in whole pixels, its feet thinning to nothing. */
function arcOf(width: number, height: number): HTMLCanvasElement {
  const key = `${width}x${height}`;
  const done = baked.get(key);
  if (done) return done;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext('2d');
  if (g) {
    const cx = width / 2;
    const outer = Math.round(width * 0.62);
    const cy = outer + Math.round(height * 0.06);
    const fadeTo = height * 0.7;
    const inner = outer - BANDS.length * BAND;
    for (let y = 0; y < height; y++) {
      g.globalAlpha = Math.max(0, 1 - y / fadeTo);
      if (g.globalAlpha === 0) break;
      for (let x = 0; x < width; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d > outer || d <= inner) continue;
        g.fillStyle = BANDS[Math.min(BANDS.length - 1, Math.floor((outer - d) / BAND))]!;
        g.fillRect(x, y, 1, 1);
      }
    }
  }
  baked.set(key, canvas);
  return canvas;
}

/** The rainbow over the view, `t` through its time. */
export function drawRainbow(
  ctx: CanvasRenderingContext2D,
  view: { width: number; height: number },
  t: number,
): void {
  const strength = rainbowStrength(t);
  if (strength <= 0) return;
  ctx.globalAlpha = strength;
  ctx.drawImage(arcOf(view.width, view.height), 0, 0);
  ctx.globalAlpha = 1;
}
