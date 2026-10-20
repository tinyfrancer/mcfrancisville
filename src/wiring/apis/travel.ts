import type { MapApi } from '../../hud/MapSheet';
import { drawBroomIcon } from '../../render/items';
import type { BroomApi } from '../../hud/BroomSheet';
import { ZONES } from '../../data/zones';
import type { ApiWiring, SheetApis } from './shared';

/** Going places: her broom, and the world map. */
export function travelApis({ world, changed }: ApiWiring): Pick<SheetApis, 'broom' | 'map'> {
  const broom: BroomApi = {
    look: () => world.broom.look,
    dress(look) {
      if (world.broom.dress(look)) changed();
    },
    backTo() {
      const zone = world.broom.backTo;
      return zone ? ZONES[zone].name : null;
    },
    flyBack() {
      if (world.broom.flyBack()) changed();
    },
    icon: drawBroomIcon,
  };
  const map: MapApi = {
    places: () => world.travel.places(),
    waysOut: () => world.travel.waysOut(),
    go: (id) => world.travel.go(id),
  };
  return {
    broom,
    map,
  };
}
