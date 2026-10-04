import { Decorator } from '../services/Decorator';
import { Instruments } from '../services/Instruments';
import { RecordPlayer } from '../services/RecordPlayer';
import type { Shared } from './shared';

/** Her home: decorating it, her record player, and whatever plays (0.2's G2). */
export interface HomeServices {
  recordPlayer: RecordPlayer;
  instruments: Instruments;
  decorating: Decorator;
}

/** `forget` leaves behind whatever she was on her way to do, as picking a piece up does. */
export function homeServices(s: Shared, forget: () => void): HomeServices {
  const { ctx, town } = s;
  return {
    recordPlayer: new RecordPlayer(ctx, s.bag),
    instruments: new Instruments(ctx, s.takings, town, s.options.tunes),
    decorating: new Decorator(ctx, s.home, {
      standing: () => s.movement().tile,
      atHome: () => town.scene() === 'home',
      settle: () => {
        s.movement().halt();
        forget();
      },
    }),
  };
}
