import type { TitleApi } from '../../hud/TitleScreen';
import type { NotesApi } from '../../hud/NotesCard';
import { drawTitleScene } from '../../render/title';
import { DEDICATION } from '../../data/greetings';
import type { FirstDayApi } from '../../hud/FirstDayCard';
import { countdown } from '../../hud/messages';
import { CALENDAR } from '../../data/calendar';
import { drawBust } from '../../render/villagers';
import { dayKey } from '../../systems/clock';
import type { ApiWiring, SheetApis } from './shared';

/** The way in: the title, the mayor's notes, and Cody's list for her first day. */
export function welcomeApis({ world }: ApiWiring): Pick<SheetApis, 'title' | 'notes' | 'firstDay'> {
  const title: TitleApi = {
    art: (canvas) => drawTitleScene(canvas, world.wardrobe.look, dayKey(world.clock.now())),
    dedication: DEDICATION,
    festival: () => {
      const { festival } = world.calendar.today();
      if (!festival) return null;
      const row = CALENDAR[festival.id];
      return { mark: festival.id, name: row.name, countdown: `${countdown(festival)}!` };
    },
  };
  const notes: NotesApi = {
    name: () => world.wardrobe.look.name,
    hasTown: () => world.wardrobe.created,
  };
  // Cody's list for her first day (V1's R1).
  const firstDay: FirstDayApi = {
    open: () => world.firstDay.open,
    steps: () => world.firstDay.steps(),
    portrait: (canvas) => drawBust(canvas, 'cody', world.finale.costumeOf('cody')),
    onChange: (listener) => world.events.on('firstDay', listener),
  };
  return {
    title,
    notes,
    firstDay,
  };
}
