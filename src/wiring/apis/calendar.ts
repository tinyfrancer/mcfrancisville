import type { CalendarApi } from '../../hud/CalendarSheet';
import { drawCalendarMark, drawConstellationMark, drawPlainMark } from '../../render/items';
import { townsfolk } from '../../systems/mayor';
import { canGoToday, goToday, TODAY_TOLD_BY } from '../todayGo';
import type { ApiWiring, SheetApis } from './shared';

/** The calendar, and Today. */
export function calendarApis({ world }: ApiWiring): Pick<SheetApis, 'calendar'> {
  const calendar: CalendarApi = {
    today: () => world.calendar.today(),
    month: (year, month) => world.calendar.month(year, month),
    comingUp: () => world.calendar.comingUp(),
    mark: drawCalendarMark,
    plain: drawPlainMark,
    stars: drawConstellationMark,
    birthdays: () => townsfolk(),
    onChange: (listener) => world.events.on('today', listener),
    // What's up now (V1's R2), and where a line of it takes her.
    upNow: () => world.upNow.lines(),
    canGo: (to) => canGoToday(world, to),
    go: (to) => goToday(world, to),
    onUpNow: (listener) => {
      const offs = TODAY_TOLD_BY.map((key) => world.events.on(key, listener));
      return () => offs.forEach((off) => off());
    },
  };
  return {
    calendar,
  };
}
