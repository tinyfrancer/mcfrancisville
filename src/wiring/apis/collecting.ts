import { drawFossilSilhouette } from '../../render/fossils';
import type { CabinetApi } from '../../hud/CabinetSheet';
import { drawSilhouette } from '../../render/critters';
import { drawItemIcon } from '../../render/items';
import { dayKey, hourOf } from '../../systems/clock';
import { isAbout } from '../../systems/critters';
import type { ApiWiring, SheetApis } from './shared';

/** The Curiosity Cabinet and the museum. */
export function collectingApis({ world, changed }: ApiWiring): Pick<SheetApis, 'cabinet'> {
  const cabinet: CabinetApi = {
    critter: (id) => ({
      caughtOn: world.cabinet.caughtOn(id),
      donated: world.cabinet.isDonated(id),
      best: world.cabinet.bestOf(id),
      outNow: isAbout(
        id,
        dayKey(world.clock.now()),
        hourOf(world.clock.now()),
        world.weather.today(),
      ),
    }),
    inBag: (id) => world.bag.count(id),
    donate(id) {
      changed();
      return world.collecting.donate(id);
    },
    isNew: (id) => world.novelty.isNew('cabinet', id),
    seen: () => world.novelty.seen('cabinet'),
    icon: drawItemIcon,
    silhouette: drawSilhouette,
    shelf: (id) => world.milestones.progress(id),
    hasHad: (id) => world.milestones.hasHad(id),
    item: drawItemIcon,
    fossil: (id) => ({
      found: world.milestones.hasHad(id),
      donated: world.cabinet.isDonated(id),
    }),
    donateFossil(id) {
      changed();
      return world.fossils.donate(id);
    },
    fossilSilhouette: drawFossilSilhouette,
    now: () => ({ day: dayKey(world.clock.now()), hour: hourOf(world.clock.now()) }),
  };
  return {
    cabinet,
  };
}
