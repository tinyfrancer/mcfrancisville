import { VILLAGER_IDS } from '../../data/villagers';
import { isHusband } from '../../systems/cody';
import { isNoticeKey } from '../../systems/firstDay';
import type { Belongings } from '../services/Belongings';
import type { CandyTree } from '../services/CandyTree';
import { FirstDay } from '../services/FirstDay';
import type { HonestyStall } from '../services/HonestyStall';
import type { Kitchen } from '../services/Kitchen';
import type { Visits } from '../services/Visits';
import type { Shared } from './shared';

/** What her first day's steps are read from (V1's R1), beyond the keepers. */
export interface FirstDayParts {
  candyTree: CandyTree;
  stall: HonestyStall;
  kitchen: Kitchen;
  visits: Visits;
  belongings: Belongings;
}

/**
 * Cody's thread over her first day (V1's R1, decision 311), read from what the town keeps
 * already: the candy tree, the beds, the stall, the day's takings, her talks and her meals.
 */
export function firstDay(s: Shared, parts: FirstDayParts): FirstDay {
  const { ctx, bag, wallet, farm, takings, friends, wardrobe } = s;
  const { candyTree, stall, kitchen, visits, belongings } = parts;
  return new FirstDay(
    ctx,
    { bag, wallet, belongings },
    {
      begun: () => wardrobe.created && visits.count > 0,
      facts: () => {
        const sold = stall.view();
        const meals = kitchen.snapshot().kitchen;
        return {
          shaken: candyTree.shakenAt !== null,
          planted: farm.harvested.length > 0 || farm.snapshot().some((b) => b.planting !== null),
          stalled: sold.stock.length > 0 || sold.sold.length > 0 || sold.tin > 0,
          answered: Object.keys(takings.all).some(isNoticeKey),
          met: VILLAGER_IDS.filter((v) => !isHusband(v) && friends.of(v).talked !== null).length,
          ate: meals.pep !== null || meals.bites !== null || meals.lure !== null,
        };
      },
    },
    s.options.firstDay,
  );
}
