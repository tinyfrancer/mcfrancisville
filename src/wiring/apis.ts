import { herApis } from './apis/her';
import { travelApis } from './apis/travel';
import { makingApis } from './apis/making';
import { gardenApis } from './apis/garden';
import { shoppingApis } from './apis/shopping';
import { homeApis } from './apis/home';
import { neighboursApis } from './apis/neighbours';
import { collectingApis } from './apis/collecting';
import { petsApis } from './apis/pets';
import { mysteryApis } from './apis/mystery';
import { fairgroundApis } from './apis/fairground';
import { calendarApis } from './apis/calendar';
import { welcomeApis } from './apis/welcome';
import type { ApiWiring, SheetApis } from './apis/shared';

export { holdablesIn, seedsIn, type ApiWiring, type Waiting } from './apis/shared';

/**
 * Every sheet's Api, built from the world's services, so a sheet reaches the game only through its
 * interface and never the World (`docs/architecture.md`, "The HUD").
 */
export function sheetApis(wiring: ApiWiring): SheetApis {
  return {
    ...herApis(wiring),
    ...travelApis(wiring),
    ...makingApis(wiring),
    ...gardenApis(wiring),
    ...shoppingApis(wiring),
    ...homeApis(wiring),
    ...neighboursApis(wiring),
    ...collectingApis(wiring),
    ...petsApis(wiring),
    ...mysteryApis(wiring),
    ...fairgroundApis(wiring),
    ...calendarApis(wiring),
    ...welcomeApis(wiring),
  };
}
