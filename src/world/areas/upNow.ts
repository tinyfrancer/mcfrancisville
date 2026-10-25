import { CRITTER_IDS } from '../../data/critters';
import { isFrozen } from '../../systems/holidays';
import { FIRST_DAY_IDS } from '../../data/firstDay';
import { VILLAGER_IDS } from '../../data/villagers';
import { ZONE_IDS, ZONES } from '../../data/zones';
import { BEST_HEARTS } from '../../systems/bestFriends';
import { dayKey, hourOf, windowKey } from '../../systems/clock';
import { isVisiting } from '../../systems/critters';
import { venueOf } from '../../systems/happenings';
import { inTown } from '../../systems/mayor';
import type { Had } from '../../systems/milestones';
import { callersOn, type TodayFacts } from '../../systems/today';
import { PASSERS } from '../../data/rareEvents';
import { passersOn } from '../../systems/rareEvents';
import type { RareEvents } from '../services/RareEvents';
import type { Projects } from '../services/Projects';
import type { Activities } from '../services/Activities';
import type { Stalls } from '../zones/Stalls';
import { weatherOn } from '../../systems/weather';
import type { MapZoneId } from '../../types/ids';
import type { Calendar } from '../services/Calendar';
import type { Collecting } from '../services/Collecting';
import type { CandyTree } from '../services/CandyTree';
import type { FirstDay } from '../services/FirstDay';
import type { Fossils } from '../services/Fossils';
import type { Garden } from '../services/Garden';
import type { HonestyStall } from '../services/HonestyStall';
import type { Neighbourhood } from '../services/Neighbourhood';
import type { Talk } from '../services/Talk';
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
  talk: Talk;
  fossils: Fossils;
  shops: Shops;
  calendar: Calendar;
  firstDay: FirstDay;
  hasHad: (id: Had) => boolean;
  /** What's out of the ordinary today (V1's R3), and the Moon Pie Man's and the pop-up's places. */
  rareEvents: RareEvents;
  stalls: Stalls;
  /** The town project she's funding (V1's R4). */
  projects: Projects;
  /** The fair's games, for the day's free go (1.0.1). */
  activities: Activities;
  /** Her net's critters, for a shiny about where she is (1.4's G1). */
  collecting: Collecting;
}

/** What Today reads of the rare events, the passers-by and the peddlers (V1's R3). */
function outOfTheOrdinary(
  parts: UpNowParts,
  day: string,
): Pick<TodayFacts, 'rare' | 'peddlers' | 'passers' | 'stray'> {
  const { rareEvents } = parts;
  const rare = rareEvents.today();
  const lost = rareEvents.stray();
  const carried = rareEvents.carrying();
  const stray = lost ?? carried;
  return {
    rare: rare ? { id: rare, began: rareEvents.began() } : null,
    peddlers: [
      ...(parts.stalls.moonPieCart()
        ? [{ shop: 'moonPie' as const, tile: parts.stalls.moonPieCart()! }]
        : []),
      ...(parts.stalls.popUp() ? [{ shop: 'popUp' as const, tile: parts.stalls.popUp()! }] : []),
    ].map(({ shop, tile }) => ({ shop, tile: { tx: tile.tx, ty: tile.ty } })),
    passers: passersOn(day).map((who) => {
      const { zone, from, until } = PASSERS[who];
      return { who, zone, from, until };
    }),
    stray: stray
      ? {
          owner: stray.owner,
          name: stray.name,
          critter: stray.critter,
          zone: stray.zone,
          carrying: carried !== null,
        }
      : null,
  };
}

/** The town project she's funding, if one's under way (V1's R4). */
function underWay(projects: Projects): TodayFacts['project'] {
  const view = projects.view().find((p) => p.current);
  return view ? { id: view.id, stage: view.stage, progress: view.progress } : null;
}

/** The fair's free go today, while it's still to be had (1.0.1). */
function freeGoOf(activities: Activities): TodayFacts['freeGo'] {
  const id = activities.freeGo();
  return activities.freeToday(id) ? { id, open: activities.isOpen(id) } : null;
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
        const favour = parts.talk.favour(who);
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
      ...outOfTheOrdinary(parts, day),
      project: underWay(parts.projects),
      freeGo: freeGoOf(parts.activities),
      shiny: parts.collecting.shinyHere(),
      iceFishing: isFrozen(day),
    };
  });
}
