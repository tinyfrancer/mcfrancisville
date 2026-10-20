import { describe, expect, expectTypeOf, it } from 'vitest';
import { OutdoorView, type OutdoorViewOptions } from '../../src/render/OutdoorView';
import type { SceneView } from '../../src/render/scene';
import type { World } from '../../src/world/World';
import type { MapZone } from '../../src/world/zones/MapZone';

/**
 * What the rest of the game and smoke reach an `OutdoorView` by (1.1's A4): `main.ts` makes one
 * and draws it as a `SceneView`, and the dev handles and smoke read the rest. Splitting its
 * drawing into passes changes none of it.
 */
const SURFACE = [
  'cameraOrigin',
  'daylight',
  'draw',
  'follow',
  'groundMemory',
  'groundSeams',
  'motion',
  'rest',
  'seasonNow',
  'seeThroughCrowns',
  'tap',
  'tileToClient',
  'weather',
] as const;

describe("OutdoorView's surface", () => {
  it('has every method the game and smoke call', () => {
    for (const name of SURFACE) expect(typeof OutdoorView.prototype[name], name).toBe('function');
  });

  it('has its map size', () => {
    expect(Object.getOwnPropertyDescriptor(OutdoorView.prototype, 'mapSize')?.get).toBeTypeOf(
      'function',
    );
  });

  it('is made as main.ts makes it, and drawn as a SceneView', () => {
    expectTypeOf<OutdoorView>().toMatchTypeOf<SceneView>();
    expectTypeOf(OutdoorView).constructorParameters.toEqualTypeOf<
      [World, MapZone, HTMLCanvasElement, (OutdoorViewOptions | undefined)?]
    >();
    expectTypeOf<OutdoorViewOptions>().toEqualTypeOf<{
      hour?: number | null;
      weather?: import('../../src/data/weather').Weather | null;
      fountainBeat?: () => number | null;
      effects?: import('../../src/render/effects').Effects;
    }>();
  });

  it('answers motion() and seeThroughCrowns() in the shapes smoke reads', () => {
    expectTypeOf<ReturnType<OutdoorView['motion']>>().toEqualTypeOf<{
      props: { id: import('../../src/types/ids').PropId; frame: number }[];
      flyers: number;
      leaves: number;
    }>();
    expectTypeOf<ReturnType<OutdoorView['seeThroughCrowns']>>().toEqualTypeOf<
      { tx: number; ty: number; alpha: number }[]
    >();
  });
});
