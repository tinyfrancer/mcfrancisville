import type { SeasonId } from '../../data/seasons';
import type { Weather } from '../../data/weather';
import type { Daylight } from '../../systems/clock';
import type { Point } from '../camera';
import type { Life } from '../life';
import type { Drawable, WorldLight } from '../scene';

/*
 * A place outdoors is drawn in passes (1.1's A4, decision 353): each thing that draws there is a
 * `Pass` in a file of its own (or beside what it draws), and `OutdoorView` lays the ground, sorts
 * what stands by its feet once, and calls each pass's part of each layer in the order `LAYERS`
 * names.
 */

/** What every pass is handed for the frame being drawn. */
export interface Frame {
  readonly nowMs: number;
  readonly cam: Point;
  readonly canvas: HTMLCanvasElement;
  /** The day's weather, or the page's (`?weather=`). */
  readonly weather: Weather;
  /** In winter the rain falls as snow, onto snow (V1's L4). */
  readonly snowing: boolean;
  /** The season the props are baked in now. */
  readonly season: SeasonId;
  /** What moves over the ground as it stands today: the pond frozen, the farm's rows built. */
  readonly life: Life;
  /** Her, as she's drawn this frame. */
  readonly me: Drawable;
}

/** A frame once its light is worked out, for what's drawn over the light. */
export interface LitFrame extends Frame {
  readonly light: Daylight;
}

/** The layers of a frame, in the order they're drawn. */
export const LAYER_NAMES = ['ground', 'stand', 'wanted', 'over', 'lights', 'lit'] as const;
export type Layer = (typeof LAYER_NAMES)[number];

/**
 * One thing a place outdoors draws, at any of a frame's layers: on the ground (`ground`); standing
 * among everything else, sorted by its feet (`stand`), and of that what she might be looking for,
 * so a crown in front of it goes see-through (`wanted`, read after `stand` in the same frame);
 * over everything standing (`over`); its pools of light (`lights`); and over the light (`lit`).
 */
export interface Pass {
  readonly name: string;
  ground?(ctx: CanvasRenderingContext2D, f: Frame): void;
  stand?(f: Frame): readonly Drawable[];
  wanted?(): readonly Drawable[];
  over?(ctx: CanvasRenderingContext2D, f: Frame): void;
  lights?(f: Frame): readonly WorldLight[];
  lit?(ctx: CanvasRenderingContext2D, f: LitFrame): void;
}

/** Each layer's passes, in the order they draw. */
export type Layers = Readonly<Record<Layer, readonly Pass[]>>;

/**
 * The passes for each layer, in `order`'s order, by name: refused if a name has no pass, or no
 * part in that layer, or if a pass has a part in a layer that doesn't name it (it would never be
 * drawn).
 */
export function composeLayers(
  passes: readonly Pass[],
  order: Readonly<Record<Layer, readonly string[]>>,
): Layers {
  const byName = new Map<string, Pass>();
  for (const p of passes) {
    if (byName.has(p.name)) throw new Error(`two passes named ${p.name}`);
    byName.set(p.name, p);
  }
  const layers = {} as Record<Layer, Pass[]>;
  for (const layer of LAYER_NAMES) {
    layers[layer] = order[layer].map((name) => {
      const p = byName.get(name);
      if (!p) throw new Error(`no pass named ${name}`);
      if (!p[layer]) throw new Error(`${name} has no ${layer}`);
      return p;
    });
    for (const p of passes) {
      if (p[layer] && !order[layer].includes(p.name)) {
        throw new Error(`${p.name}'s ${layer} isn't in the order`);
      }
    }
  }
  return layers;
}

/** Whether the phone asks for less motion, so a storm's flash is a soft brightening. */
export const REDUCED = () =>
  globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
