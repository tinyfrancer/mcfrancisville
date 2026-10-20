import type { PropId } from '../../types/ids';
import { framed, type Moving } from '../frames';
import type { Drawable } from '../scene';
import { wheelCars } from '../wheel';
import type { Pass } from './pass';
import { moved } from './standing';

/** What moves on its own where it stands, and the frame each was last drawn at (V1's E5). */
export interface MovingPass extends Pass {
  /** Each prop's frame as the frame drawn at `drawnAt` showed it, by its id (the smoke check). */
  frames(drawnAt: number): { id: PropId; frame: number }[];
}

/** Everything that moves on its own, in the frame it's at now (V1's E5). */
export function movingPass(moving: readonly { id: PropId; drawable: Drawable; m: Moving }[]) {
  const pass: MovingPass = {
    name: 'moving',
    stand: ({ nowMs }) =>
      moving.flatMap(({ id, drawable, m }) => {
        const d = moved(drawable, m, nowMs);
        return id === 'ferrisWheel' ? [d, ...wheelCars(d, m, nowMs)] : [d];
      }),
    frames: (drawnAt) => moving.map(({ id, m }) => ({ id, frame: framed(m, drawnAt).frame })),
  };
  return pass;
}

/** The floating lanterns, each bobbing a pixel up and down in its own time. */
export function lanternsPass(bobbing: readonly { drawable: Drawable; m: Moving | null }[]): Pass {
  return {
    name: 'lanterns',
    stand: ({ nowMs }) =>
      bobbing.map(({ drawable, m }) => {
        const d = m ? moved(drawable, m, nowMs) : drawable;
        const bob = Math.round(Math.sin(nowMs / 650 + d.x / 37) * 1.2);
        return { ...d, y: d.y + bob };
      }),
  };
}
