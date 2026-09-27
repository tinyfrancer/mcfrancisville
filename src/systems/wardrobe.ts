import { idsOf, EYES, HAIR_COLOURS, HAIR_STYLES, SKINS, TATTOOS } from '../data/looks';
import { DEFAULT_LOOK, OPTIONAL_SLOTS, OUTFITS } from '../data/outfits';
import type { FabricId, OutfitId, Slot } from '../types/ids';
import type { Look, Worn } from '../types/look';

/** Long enough for any name she'd go by, short enough to fit on a sign above a shop door. */
export const NAME_MAX = 16;

export function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

export function isDress(worn: Worn | undefined): boolean {
  return worn !== undefined && OUTFITS[worn.id].dress === true;
}

/**
 * Puts a piece on in its slot. A dress covers the bottom, so the bottom comes off; a bottom put on
 * over a dress swaps the dress for the first top she owns, so she is never left half dressed.
 * `fabric` defaults to what she already wears it in, or else the colour it comes in.
 */
export function wear(
  look: Look,
  id: OutfitId,
  owned: readonly OutfitId[],
  fabric?: FabricId,
): Look {
  const row = OUTFITS[id];
  const current = look.outfit[row.slot];
  const chosen =
    fabric && row.fabrics.includes(fabric)
      ? fabric
      : current?.id === id
        ? current.fabric
        : row.fabrics[0]!;
  const outfit = { ...look.outfit, [row.slot]: { id, fabric: chosen } };
  if (row.dress) delete outfit.bottom;
  if (row.slot === 'bottom' && isDress(look.outfit.top)) {
    const top = owned.find((o) => OUTFITS[o].slot === 'top' && !OUTFITS[o].dress);
    if (top) outfit.top = { id: top, fabric: OUTFITS[top].fabrics[0]! };
    else return look;
  }
  return { ...look, outfit };
}

/** Takes off what is in an optional slot. The top and bottom stay on. */
export function takeOff(look: Look, slot: Slot): Look {
  if (!OPTIONAL_SLOTS.includes(slot)) return look;
  const outfit = { ...look.outfit };
  delete outfit[slot];
  return { ...look, outfit };
}

function known<K extends string>(record: Record<K, unknown>, id: unknown, fallback: K): K {
  return typeof id === 'string' && (idsOf(record) as string[]).includes(id) ? (id as K) : fallback;
}

/**
 * Makes any saved look safe to draw. Every choice this build doesn't know (a save from a later
 * build, or a hand-edited backup) falls back to the default's, a piece she doesn't own comes off,
 * and a missing top or bottom is filled from the default. Nothing is thrown away that could be
 * drawn.
 */
export function repairLook(saved: Look, owned: readonly OutfitId[]): Look {
  const outfit: Partial<Record<Slot, Worn>> = {};
  for (const [slot, worn] of Object.entries(saved.outfit ?? {}) as [Slot, Worn | undefined][]) {
    if (!worn || !(worn.id in OUTFITS) || !owned.includes(worn.id)) continue;
    const row = OUTFITS[worn.id];
    if (row.slot !== slot) continue;
    outfit[slot] = {
      id: worn.id,
      fabric: row.fabrics.includes(worn.fabric) ? worn.fabric : row.fabrics[0]!,
    };
  }
  if (!outfit.top) outfit.top = DEFAULT_LOOK.outfit.top;
  if (isDress(outfit.top)) delete outfit.bottom;
  else if (!outfit.bottom) outfit.bottom = DEFAULT_LOOK.outfit.bottom;

  return {
    name: typeof saved.name === 'string' ? cleanName(saved.name) : '',
    skin: known(SKINS, saved.skin, DEFAULT_LOOK.skin),
    eyes: known(EYES, saved.eyes, DEFAULT_LOOK.eyes),
    hairStyle: known(HAIR_STYLES, saved.hairStyle, DEFAULT_LOOK.hairStyle),
    hairColour: known(HAIR_COLOURS, saved.hairColour, DEFAULT_LOOK.hairColour),
    gauges: saved.gauges === true,
    freckles: saved.freckles === true,
    nosePiercing: saved.nosePiercing === true,
    tattoos: saved.tattoos === null ? null : known(TATTOOS, saved.tattoos, DEFAULT_LOOK.tattoos!),
    outfit,
  };
}
