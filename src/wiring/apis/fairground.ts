import type { FairApi } from '../../hud/FairSheet';
import { drawFairGame } from '../../render/fairGames';
import { drawFixtureIcon } from '../../render/furniture';
import { drawItemIcon } from '../../render/items';
import { drawBust } from '../../render/villagers';
import type { ApiWiring, SheetApis } from './shared';

/** The fairground's games, fortune and snacks. */
export function fairgroundApis({ world, changed }: ApiWiring): Pick<SheetApis, 'fair'> {
  const fair: FairApi = {
    candy: () => world.wallet.candy,
    round: (id) => world.activities.round(id),
    start: (id, slow) => world.activities.start(id, slow),
    // The games in time (V1's R6b).
    hold: (id) => world.activities.hold(id),
    toss(id, at) {
      changed();
      return world.activities.toss(id, at);
    },
    freeToday: (id) => world.activities.freeToday(id),
    freeGo: () => {
      const id = world.activities.freeGo();
      return world.activities.freeToday(id) ? id : null;
    },
    stage: (canvas, id, last) =>
      drawFairGame(canvas, {
        activity: id,
        round: world.activities.round(id),
        last,
        now: world.clock.now(),
      }),
    readToday: () => world.activities.readToday,
    readFortune() {
      changed();
      return world.activities.readFortune();
    },
    menu: (id) => world.activities.menu(id),
    buy(id, item) {
      changed();
      return world.activities.buy(id, item);
    },
    count: (item) => world.bag.count(item),
    icon: drawItemIcon,
    reader(canvas) {
      if (world.neighbourhood.neighbour('agatha').zone === 'fortuneTent') {
        drawBust(canvas, 'agatha');
      } else drawFixtureIcon(canvas, 'fortuneTable');
    },
  };
  return {
    fair,
  };
}
