import { bake } from '../sprites/bake';
import {
  CAR_HANGER,
  carsAt,
  FERRIS_WHEEL_PALETTE,
  WHEEL_CARS,
  WHEEL_FRAMES,
  WHEEL_STEPS,
} from '../sprites/fairground';
import type { Moving } from './frames';
import type { Drawable } from './scene';

/**
 * The big wheel's cars (V1's E5), hung where their points on the rim are now. The rim turns in
 * frames that come round every eighth of a turn; the cars go all the way round, a step at a time
 * with it, so each keeps its colour, and each is drawn just in front of the wheel.
 */
export function wheelCars(wheel: Drawable, m: Moving, nowMs: number): Drawable[] {
  const stepMs = m.frames.period / WHEEL_FRAMES;
  const step = Math.floor((nowMs + m.phase) / stepMs) % WHEEL_STEPS;
  return carsAt(step).map(({ x, y, car }) => ({
    footY: wheel.footY + 0.5,
    sprite: bake(`prop:ferrisWheel:car:${car}`, WHEEL_CARS[car]!, FERRIS_WHEEL_PALETTE),
    x: wheel.x + x - CAR_HANGER.x,
    y: wheel.y + y - CAR_HANGER.y,
  }));
}
