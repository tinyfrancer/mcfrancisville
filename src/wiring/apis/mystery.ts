import type { MysteryApi } from '../../hud/CorkboardSheet';
import { drawBust } from '../../render/villagers';
import { clearedOf, suspectsOf } from '../../systems/mystery';
import { inChain } from '../../systems/mysteryChain';
import { MAYOR } from '../../systems/mayor';
import { PALETTE } from '../../sprites/palette';
import type { ApiWiring, SheetApis } from './shared';

/** The mayor's mystery: her corkboard. */
export function mysteryApis({ world }: ApiWiring): Pick<SheetApis, 'mystery'> {
  const mystery: MysteryApi = {
    foundOn: (id) => world.casebook.foundOn(id),
    suspects: () => suspectsOf(world.casebook.found),
    portrait: (canvas, id) => drawBust(canvas, id),
    cleared: (id) => clearedOf(world.casebook.found).includes(id),
    daysUntil: (id) => world.mystery.daysUntil(id),
    inChain,
    ready: () => world.mystery.ready() !== null,
    mayor: (canvas, seen) => drawBust(canvas, MAYOR, null, 'neutral', seen ? null : PALETTE.ghost),
  };
  return {
    mystery,
  };
}
