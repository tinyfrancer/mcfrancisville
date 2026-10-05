import { Activities } from '../services/Activities';
import type { Forecast } from '../services/Forecast';
import type { Shared } from './shared';

/** The Hollow Fairground: its games, fortune and snack stalls (0.2's M2). */
export interface Fairground {
  activities: Activities;
}

export function fairground(s: Shared, weather: Forecast): Fairground {
  const { ctx, town, cabinet } = s;
  const activities = new Activities(
    ctx,
    { bag: s.bag, wallet: s.wallet, takings: s.takings },
    {
      name: town.name,
      weather: () => weather.today(),
      agathaAt: () => town.zoneOf('agatha'),
      caught: (id) => cabinet.caughtOn(id) !== null,
    },
  );
  return { activities };
}
