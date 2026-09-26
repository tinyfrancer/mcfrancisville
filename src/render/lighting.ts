import { PALETTE } from '../sprites/palette';
import type { Daylight, Sky } from '../systems/clock';

const SKY_COLOUR: Record<Sky, string> = {
  day: PALETTE.skyDay,
  dawn: PALETTE.skyDawn,
  golden: PALETTE.skyGolden,
  dusk: PALETTE.skyDusk,
  night: PALETTE.skyNight,
};

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/** The colour the town is multiplied by. Pure white, at midday, leaves it exactly as drawn. */
export function skyColour(light: Daylight): Rgb {
  const a = rgb(SKY_COLOUR[light.from]);
  const b = rgb(SKY_COLOUR[light.to]);
  return [0, 1, 2].map((i) => Math.round(a[i]! + (b[i]! - a[i]!) * light.t)) as Rgb;
}

export function isPlainDay(light: Daylight): boolean {
  return light.lamps === 0 && skyColour(light).every((c) => c === 255);
}

/** A light on screen, in game pixels, and how bright it is (0 to 1). */
export interface ScreenLight {
  x: number;
  y: number;
  radius: number;
  strength: number;
}

/** The rings of a pool of light, bright in the middle; stepped rather than smooth, like the art. */
const RINGS: readonly (readonly [reach: number, alpha: number])[] = [
  [0.3, 0.85],
  [0.5, 0.65],
  [0.68, 0.45],
  [0.84, 0.27],
  [1, 0.12],
];

const pools = new Map<number, HTMLCanvasElement>();

/** A pool of lamplight of one radius, drawn once. */
function pool(radius: number): HTMLCanvasElement {
  const hit = pools.get(radius);
  if (hit) return hit;
  const size = radius * 2 + 1;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  const image = ctx.createImageData(size, size);
  const [r, g, b] = rgb(PALETTE.lampLight);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - radius, y - radius) / radius;
      const ring = RINGS.find(([reach]) => d <= reach);
      if (!ring) continue;
      const at = (y * size + x) * 4;
      image.data[at] = r;
      image.data[at + 1] = g;
      image.data[at + 2] = b;
      image.data[at + 3] = Math.round(ring[1] * 255);
    }
  }
  ctx.putImageData(image, 0, 0);
  pools.set(radius, canvas);
  return canvas;
}

/**
 * Time of day, as a light map: the sky's colour everywhere, brightened where lamps shine, and
 * multiplied over the finished frame. Only the view knows it happens (decisions.md 9).
 */
export class Lighting {
  private readonly map = document.createElement('canvas');

  /** Washes `ctx` in the light of `light`. Nothing is drawn at plain midday. */
  apply(ctx: CanvasRenderingContext2D, light: Daylight, lights: readonly ScreenLight[]): void {
    if (isPlainDay(light)) return;
    const { width, height } = ctx.canvas;
    if (this.map.width !== width || this.map.height !== height) {
      this.map.width = width;
      this.map.height = height;
    }
    const m = this.map.getContext('2d');
    if (!m) return;
    const [r, g, b] = skyColour(light);
    m.globalCompositeOperation = 'source-over';
    m.globalAlpha = 1;
    m.fillStyle = `rgb(${r}, ${g}, ${b})`;
    m.fillRect(0, 0, width, height);
    m.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      if (l.strength <= 0) continue;
      if (l.x + l.radius < 0 || l.y + l.radius < 0) continue;
      if (l.x - l.radius > width || l.y - l.radius > height) continue;
      m.globalAlpha = l.strength;
      m.drawImage(pool(l.radius), Math.round(l.x - l.radius), Math.round(l.y - l.radius));
    }
    m.globalCompositeOperation = 'source-over';
    m.globalAlpha = 1;

    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(this.map, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
  }
}
