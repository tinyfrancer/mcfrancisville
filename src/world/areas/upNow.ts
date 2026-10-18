import { CRITTER_IDS } from '../../data/critters';
import { FIRST_DAY_IDS } from '../../data/firstDay';
import { VILLAGER_IDS } from '../../data/villagers';
import { ZONE_IDS, ZONES } from '../../data/zones';
import { BEST_HEARTS } from '../../systems/bestFriends';
import { dayKey, hourOf, windowKey } from '../../systems/clock';
import { isVisiting } from '../../systems/critters';
import { venueOf } from '../../systems/happenings';
import { inTown } from '../../systems/mayor';
import type { Had } from '../../systems/milestones';
import { callersOn } from '../../systems/today';
import { weatherOn } from '../../systems/weather';
import type { MapZoneId } from '../../types/ids';
import type { Calendar } from '../services/Calendar';
import type { CandyTree } from '../services/CandyTree';
import type { FirstDay } from '../services/FirstDay';
import type { Fossils } from '../services/Fossils';
import type { Garden } from '../services/Garden';
import type { HonestyStall } from '../services/HonestyStall';
import type { Neighbourhood } from '../services/Neighbourhood';
import type { Noticeboard } from '../services/Noticeboard';
import type { Shops } from '../services/Shops';
import { UpNow } from '../services/UpNow';
import type { Shared } from './shared';

/** What Today reads (V1's R2), each a service made before it. */
export interface UpNowParts {
  candyTree: CandyTree;
  stall: HonestyStall;
  garden: Garden;
  noticeboard: Noticeboard;
  neighbourhood: Neighbourhood;
  fossils: Fossils;
  shops: Shops;
  calendar: Calendar;
  firstDay: FirstDay;
  hasHad: (id: Had) => boolean;
}

const OUTDOORS = ZONE_IDS.filter((id): id is MapZoneId => ZONES[id].map !== undefined);

/** What's up now in the town, read off its services each time Today is asked (decision 312). */
export function upNow(s: Shared, parts: UpNowParts): UpNow {
  const { ctx, friends } = s;
  const { candyTree, stall, garden, noticeboard, neighbourhood, fossils, shops } = parts;
  return new UpNow(() => {
    const now = ctx.clock.now();
    const day = dayKey(now);
    const weather = weatherOn(day);
    const sold = stall.view();
    const visiting = CRITTER_IDS.filter((id) => isVisiting(id, day, weather));
    return {
      day,
      hour: hourOf(now),
      window: windowKey(now),
      firstDay: parts.firstDay.open
        ? { done: parts.firstDay.done.length, of: FIRST_DAY_IDS.length }
        : null,
      notes: noticeboard.notices().map((n) => ({ from: n.from, done: n.done })),
      favours: VILLAGER_IDS.filter(inTown).flatMap((who) => {
        const favour = neighbourhood.favour(who);
        if (!favour) return [];
        const zone = neighbourhood.whereIs(who)?.zone ?? null;
        return [{ who, item: favour.item, count: favour.count, zone }];
      }),
      tree: candyTree.candy(),
      stall: { tin: sold.tin, sold: sold.sold.reduce((n, s) => n + s.count, 0) },
      ripe: garden.ripe(),
      mounds: OUTDOORS.flatMap((zone) => {
        const mound = fossils.mound(zone);
        return mound
          ? [{ zone, tile: { tx: mound.tx, ty: mound.ty }, dug: fossils.isDug(zone) }]
          : [];
      }),
      wanted: shops.wanted(),
      happenings: parts.calendar.today().gatherings,
      venue: (id) => venueOf(id).zone,
      callers: callersOn(day, (who) => friends.hearts(who) >= BEST_HEARTS),
      critters: { visiting, fresh: visiting.filter((id) => !parts.hasHad(id)) },
    };
  });
}
