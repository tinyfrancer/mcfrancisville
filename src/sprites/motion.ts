import { flicker, type Frames } from './frames';
import { PALETTE as C } from './palette';
import type { Palette } from './sprite';
import type { Sketch } from './sketch';

/*
 * What a frame of something moving is drawn with (V1's E5): a fire's flames, a wisp of steam,
 * bubbles rising. Each takes the beat it's on and paints keys, so every frame is a grid like any
 * other and recolours by palette swap.
 */

/** How a fire rises and leans, beat by beat: a slow lick up and a sway either way. */
const LIFT = [0, 1, 2, 1] as const;
const LEAN = [0, 1, 0, -1] as const;

/**
 * A fire burning at (cx, cy), `rx` by `ry` at rest, in `fire` with a brighter heart in `heart`, on
 * beat `beat`: it rises and settles, its heart leans, and three tongues lick up off it in turn.
 * With `within`, it paints only over those keys (the dark of a hearth's mouth, a stove's window).
 */
export function flames(
  s: Sketch,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fire: string,
  heart: string,
  beat: number,
  within?: ReadonlySet<string>,
): void {
  const put = (x: number, y: number, key: string) => {
    const under = s.get(x, y);
    if (under === undefined) return;
    if (!within || within.has(under) || under === fire || under === heart) s.set(x, y, key);
  };
  const blob = (ex: number, ey: number, erx: number, ery: number, key: string) => {
    for (let y = Math.floor(ey - ery); y <= Math.ceil(ey + ery); y++) {
      for (let x = Math.floor(ex - erx); x <= Math.ceil(ex + erx); x++) {
        const dx = (x + 0.5 - ex) / erx;
        const dy = (y + 0.5 - ey) / ery;
        if (dx * dx + dy * dy <= 1) put(x, y, key);
      }
    }
  };
  const lift = LIFT[beat % 4]!;
  const lean = LEAN[beat % 4]!;
  blob(cx, cy - lift / 2, rx, ry + lift / 2, fire);
  blob(cx + lean / 2, cy + ry * 0.4, rx * 0.6, ry * 0.55 + lift / 3, heart);
  const tongues = [-0.55, 0.45, -0.05];
  tongues.forEach((at, i) => {
    const x = Math.round(cx + at * rx) + (i === (beat + 1) % 3 ? lean : 0);
    const reach = 1 + ((beat + i * 2) % 3);
    const top = Math.round(cy - ry - lift / 2) - reach;
    for (let y = top; y <= Math.round(cy - ry * 0.6); y++) put(x, y, fire);
    if (reach === 3) put(x, top + 1, heart);
  });
}

/**
 * A wisp of steam rising from (x, y), `height` pixels, in `key`: it wavers a pixel either way and
 * thins as it goes, a gap rising up it each beat.
 */
export function wisp(s: Sketch, x: number, y: number, beat: number, key: string, height = 4) {
  for (let i = 0; i < height; i++) {
    if ((i + 4 - (beat % 4)) % 4 === 3) continue;
    s.set(x + Math.round(Math.sin((i - beat) * 1.3)), y - i, key);
  }
}

/**
 * Bubbles coming up through something from `floor` to `top` at the columns in `xs`, each a pixel
 * of `key`, a step higher each beat, each column in its own time.
 */
export function rising(
  s: Sketch,
  xs: readonly number[],
  floor: number,
  top: number,
  beat: number,
  key: string,
  step = 2,
): void {
  const span = floor - top;
  xs.forEach((x, i) => {
    const y = floor - ((beat * step + i * 5) % span);
    s.set(x + (((beat + i) >> 1) % 2), y, key);
  });
}

/** How a candle's colours dip for a beat: each a step warmer and dimmer. */
const GUTTER: Readonly<Record<string, string>> = {
  [C.white]: C.candleBright,
  [C.candleBright]: C.candle,
  [C.candle]: C.pumpkinLight,
  [C.pumpkin]: C.pumpkinShade,
};

/** A glow with its candlelight dipped, as a flame gutters; anything not candlelight stays lit. */
export function guttered(glow: Palette): Palette {
  return Object.fromEntries(
    Object.entries(glow).map(([key, colour]) => [key, colour && (GUTTER[colour] ?? colour)]),
  );
}

/**
 * Windows lit by candles after dark: now and then one gutters, twice quickly, in each building's
 * own time. A round is about ten seconds, so a street of them flickers here and there, never as one.
 */
export function candlelit(glow: Palette, period = 9600): Frames {
  return { glows: [glow, guttered(glow)], period, order: flicker(40, { 23: 1, 25: 1 }) };
}

/** A lamp's or a jack-o'-lantern's flame: a soft flicker every few seconds. */
export function flame(glow: Palette, period = 4200): Frames {
  return { glows: [glow, guttered(glow)], period, order: flicker(21, { 4: 1, 12: 1, 13: 1 }) };
}
