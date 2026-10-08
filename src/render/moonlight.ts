import { PALETTE } from '../sprites/palette';
import type { Daylight } from '../systems/clock';
import type { Drawable } from './scene';

/**
 * Moonlight on a full moon's night (V1's L3, decision 291): everything standing outdoors catches
 * a rim of silver along its top and its left, where the light falls (`docs/art_style.md`). A
 * sprite's rimmed look is made once from the sprite and kept with it, and drawn in its place, so
 * the rim is hidden by what stands in front exactly as the sprite is, and costs no pass.
 */

/** How far a rim pixel goes toward the moon's silver: along a top edge, and down a left one. */
const RIM_TOP = 0.55;
const RIM_LEFT = 0.3;

/** How much of the light is a full moon's night, 0 to 1. */
export function moonlitness(light: Daylight): number {
  const from = light.from === 'moonlit' ? 1 - light.t : 0;
  const to = light.to === 'moonlit' ? light.t : 0;
  return from + to;
}

/** Whether things catch the moon's rim in this light: once it's more moonlit than not. */
export function rimLit(light: Daylight): boolean {
  return moonlitness(light) >= 0.5;
}

/**
 * A sprite's pixels (RGBA, `width` × `height`) with its rim lit: each solid pixel with open air
 * above it goes `RIM_TOP` of the way to the moon's silver, and one with open air to its left
 * `RIM_LEFT`. Nothing else changes, and nothing is added outside the sprite.
 */
export function rimPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);
  const n = parseInt(PALETTE.moonRim.slice(1), 16);
  const rim = [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && data[(y * width + x) * 4 + 3]! >= 128;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!solid(x, y)) continue;
      const t = !solid(x, y - 1) ? RIM_TOP : !solid(x - 1, y) ? RIM_LEFT : 0;
      if (t === 0) continue;
      const at = (y * width + x) * 4;
      for (let i = 0; i < 3; i++)
        out[at + i] = Math.round(data[at + i]! + (rim[i]! - data[at + i]!) * t);
    }
  }
  return out;
}

const rimmed = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();

/** A sprite as it looks under the full moon, made the first time it's needed. */
export function rimmedOf(sprite: HTMLCanvasElement): HTMLCanvasElement {
  const hit = rimmed.get(sprite);
  if (hit) return hit;
  let made = sprite;
  const source = sprite.getContext('2d');
  if (source && sprite.width > 0 && sprite.height > 0) {
    const { data } = source.getImageData(0, 0, sprite.width, sprite.height);
    made = document.createElement('canvas');
    made.width = sprite.width;
    made.height = sprite.height;
    const g = made.getContext('2d');
    if (g) {
      const image = g.createImageData(sprite.width, sprite.height);
      image.data.set(rimPixels(data, sprite.width, sprite.height));
      g.putImageData(image, 0, 0);
    }
  }
  rimmed.set(sprite, made);
  return made;
}

/** Drawables as the full moon lights them: each sprite, and what it holds, rimmed. */
export function underMoon(drawables: Drawable[]): void {
  drawables.forEach((d, i) => {
    const held = d.held ? { ...d.held, sprite: rimmedOf(d.held.sprite) } : undefined;
    drawables[i] = held
      ? { ...d, sprite: rimmedOf(d.sprite), held }
      : { ...d, sprite: rimmedOf(d.sprite) };
  });
}
