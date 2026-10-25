import type { CritterId, ItemId, ShinyId, ShinyPiece } from '../types/ids';
import { CRITTER_IDS, CRITTERS } from './critters';
import type { FurnitureRow } from './furniture';
import type { ItemRow } from './items';

/*
 * The shinies (1.4's G1, decision 370): once in a while a critter comes out in colours all its own.
 * Caught, it's the same critter, kept in her bag as a thing of its own (`lunaMothShiny`), as a blue
 * rose is a rose's rare harvest: it sells for twice as much, shows as itself in a display piece,
 * goes in the museum's case in place of the plain, and three of it carve a shiny figurine.
 */

/** A critter's shiny, as a thing in her bag. */
export function shinyOf(id: CritterId): ShinyId {
  return `${id}Shiny`;
}

/** Every critter's shiny, in the Cabinet's order. */
export const SHINY_IDS: readonly ShinyId[] = CRITTER_IDS.map(shinyOf);

const SHINY_SET: ReadonlySet<string> = new Set(SHINY_IDS);

/** Whether a thing in her bag is a shiny. */
export function isShiny(id: string): id is ShinyId {
  return SHINY_SET.has(id);
}

/** The critter a shiny is. */
export function plainOf(id: ShinyId): CritterId {
  return id.slice(0, -'Shiny'.length) as CritterId;
}

/** A critter's name with "Shiny" before it: "Shiny luna moth", "Shiny Hercules beetle". */
export function shinyName(id: CritterId): string {
  const name = CRITTERS[id].name;
  const proper = /^Hercules/.test(name);
  return `Shiny ${proper ? name : name[0]!.toLowerCase() + name.slice(1)}`;
}

/** Each shiny as something in her bag, a critter like its plain self. */
export const SHINY_ITEMS = Object.fromEntries(
  CRITTER_IDS.map((id) => {
    const c = CRITTERS[id];
    const row: ItemRow = {
      name: shinyName(id),
      kind: 'critter',
      description: `A shiny one, in colours all its own! ${c.description}`,
    };
    if (c.plural) row.plural = `shiny ${c.plural}`;
    return [shinyOf(id), row];
  }),
) as Record<ShinyId, ItemRow>;

/** What a shiny fetches at Cobweb Corner: twice its plain self. */
export const SHINY_VALUE_TIMES = 2;

/** Every shiny's value, by its plain self's. */
export const SHINY_VALUES = Object.fromEntries(
  CRITTER_IDS.map((id) => [shinyOf(id), CRITTERS[id].value * SHINY_VALUE_TIMES]),
) as Record<ShinyId, number>;

/** Whether an item is a critter, plain or shiny. */
export function isCritterItem(id: ItemId): boolean {
  return id in CRITTERS || isShiny(id);
}

/** What the two shiny shelves send her, from Wrapunzel (1.4's G1). */
export const SHINY_FURNITURE: Record<ShinyPiece, FurnitureRow> = {
  framedShiny: {
    name: 'Framed shiny luna moth',
    description:
      'A rosy luna moth with golden eyespots in a gilt frame, for a shiny of every family. It twinkles.',
    layer: 'wall',
    size: { w: 1, h: 1 },
    says: 'The shiny luna moth in its frame catches the light, and throws it back a little pinker.',
  },
  shinyDome: {
    name: 'Shiny orb dome',
    description:
      'A pair of orbs, one rose and one gold, under a glass dome, for a shiny of every critter there is.',
    layer: 'floor',
    size: { w: 1, h: 1 },
    says: 'The rose orb and the gold orb go round each other under the glass. Forever, probably.',
  },
};
