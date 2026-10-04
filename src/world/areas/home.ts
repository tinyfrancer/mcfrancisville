import { Chest } from '../services/Chest';
import { Decorator } from '../services/Decorator';
import { Display } from '../services/Display';
import { Instruments } from '../services/Instruments';
import { RecordPlayer } from '../services/RecordPlayer';
import type { Shared } from './shared';

/** Her home: decorating it, her record player, whatever plays (0.2's G2), its chest and what's on show. */
export interface HomeServices {
  recordPlayer: RecordPlayer;
  instruments: Instruments;
  decorating: Decorator;
  chest: Chest;
  display: Display;
}

/** `forget` leaves behind whatever she was on her way to do, as picking a piece up does. */
export function homeServices(s: Shared, forget: () => void): HomeServices {
  const { ctx, town } = s;
  return {
    recordPlayer: new RecordPlayer(ctx, s.bag, s.home),
    instruments: new Instruments(ctx, s.takings, town, s.options.tunes),
    decorating: new Decorator(ctx, s.home, {
      standing: () => s.movement().tile,
      atHome: () => town.scene() === 'home',
      settle: () => {
        s.movement().halt();
        forget();
      },
      giveBack: (id) => {
        s.bag.add(id, 1);
        ctx.events.emit('bag', s.bag.contents);
      },
    }),
    chest: new Chest(ctx, { bag: s.bag, home: s.home, atHome: () => town.scene() === 'home' }),
    display: new Display(ctx, { bag: s.bag, home: s.home, atHome: () => town.scene() === 'home' }),
  };
}
