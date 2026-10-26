import type { FairApi } from '../../hud/FairSheet';
import { VILLAGERS } from '../../data/villagers';
import { drawFairGame } from '../../render/fairGames';
import { drawRide } from '../../render/fairRide';
import { dayKey, hourOf } from '../../systems/clock';
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
    // The big wheel (1.6's X2).
    riding: () => world.activities.riding(),
    board: () => world.activities.board(),
    land() {
      changed();
      return world.activities.land();
    },
    getOff: () => world.activities.getOff(),
    freeRide: () => world.activities.freeRide(),
    rideWith: () => world.activities.rideWith(),
    nameOf: (id) => VILLAGERS[id].name,
    petName: () => {
      const pet = world.pets.walking;
      return pet ? world.pets.nameOf(pet) : null;
    },
    rideStage(canvas) {
      const now = world.clock.now();
      const riding = world.activities.riding();
      const pet = world.pets.walking;
      const company = riding?.with ?? null;
      drawRide(canvas, {
        day: dayKey(now),
        hour: hourOf(now),
        nowMs: now,
        weather: world.weather.today(),
        look: world.wardrobe.look,
        at: riding?.at ?? null,
        with: company && {
          id: company,
          costume: world.finale.costumeOf(company),
          wears: world.friends.of(company).wears ?? null,
        },
        pet: pet && { id: pet, accessory: world.pets.wearing(pet) },
      });
    },
  };
  return {
    fair,
  };
}
