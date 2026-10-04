import { Belongings } from '../services/Belongings';
import { HonestyStall } from '../services/HonestyStall';
import { Kitchen } from '../services/Kitchen';
import { Workbench } from '../services/Workbench';
import type { Shared } from './shared';

/** What she makes, and where anything she's bought, given or made goes. */
export interface Making {
  /** The honesty stall, made first, as the workbench builds onto it (decisions.md 218). */
  stall: HonestyStall;
  workbench: Workbench;
  kitchen: Kitchen;
  belongings: Belongings;
}

export function making(s: Shared): Making {
  const { ctx, options, bag, home } = s;
  const stall = new HonestyStall(ctx, { bag, wallet: s.wallet }, options.stall);
  const workbench = new Workbench(ctx, { bag, home, farm: s.farm, stall }, options.recipes);
  const kitchen = new Kitchen(ctx, { bag, workbench, takings: s.takings }, options.kitchen);
  const belongings = new Belongings(ctx.events, {
    bag,
    wardrobe: s.wardrobe,
    home,
    workbench,
    pets: s.pets,
  });
  return { stall, workbench, kitchen, belongings };
}
