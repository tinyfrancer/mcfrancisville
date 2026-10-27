import type { WellApi } from '../../hud/WellCard';
import { drawItemIcon } from '../../render/items';
import type { ApiWiring, SheetApis } from './shared';

/** The wishing well on the square (1.7's Y2); its moment is played from the loop's moments. */
export function wellApis({ world, changed }: ApiWiring): Pick<SheetApis, 'well'> {
  const well: WellApi = {
    view: () => world.well.view(),
    toss() {
      changed();
      return world.well.toss() !== null;
    },
    icon: drawItemIcon,
  };
  return { well };
}
