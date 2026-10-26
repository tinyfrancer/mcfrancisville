import type { BarnApi } from '../../hud/BarnSheet';
import type { CoopApi } from '../../hud/CoopCard';
import { drawHen } from '../../render/hens';
import { drawBedPicture } from '../../render/garden';
import type { BedApi } from '../../hud/BedCard';
import type { FarmApi } from '../../hud/SeedSheet';
import { drawItemIcon } from '../../render/items';
import { seedsIn, type ApiWiring, type SheetApis } from './shared';

/** The garden: planting a bed, a bed's card, the barn's wall, and the hens' coop (1.6's X3). */
export function gardenApis({
  world,
  changed,
  play,
  waiting,
}: ApiWiring): Pick<SheetApis, 'farm' | 'bed' | 'barn' | 'coop'> {
  const farm: FarmApi = {
    seeds: () => seedsIn(world),
    icon: drawItemIcon,
    plant(seed) {
      const bed = waiting.bed;
      if (!bed) return;
      const planted = world.garden.plant(bed, seed);
      waiting.bed = null;
      if (planted) play([planted]);
    },
  };
  const bed: BedApi = {
    look() {
      const at = world.garden.looking;
      return at && at.zone === world.scene ? world.garden.look(at, world.hands.held) : null;
    },
    go(job) {
      const at = world.garden.looking;
      if (at) world.tendBed(at, job);
    },
    close: () => world.garden.lookAt(null),
    picture(canvas) {
      const at = world.garden.looking;
      return at ? drawBedPicture(canvas, world, at) : false;
    },
    onChange(listener) {
      const stops = [
        world.events.on('bed', listener),
        world.events.on('held', listener),
        world.events.on('bag', listener),
        world.events.on('scene', listener),
      ];
      return () => stops.forEach((stop) => stop());
    },
    itemIcon: drawItemIcon,
  };
  const barn: BarnApi = {
    wall: () => world.barn.wall(),
    sprinkle(field) {
      changed();
      return world.barn.sprinkle(field);
    },
    bringIn(field) {
      changed();
      return world.barn.bringIn(field);
    },
    icon: drawItemIcon,
  };
  const coop: CoopApi = {
    view: () => world.henhouse.view(),
    feed(item) {
      changed();
      return world.henhouse.feed(item);
    },
    collect() {
      changed();
      return world.henhouse.collect();
    },
    count: (item) => world.bag.count(item),
    icon: drawItemIcon,
    hen: drawHen,
  };
  return {
    farm,
    bed,
    barn,
    coop,
  };
}
