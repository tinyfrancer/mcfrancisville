import { ITEMS } from '../data/items';
import { idsOf, EYES, HAIR_COLOURS, HAIR_STYLES, SKINS, TATTOOS } from '../data/looks';
import { DEFAULT_LOOK, OPTIONAL_SLOTS, OUTFITS } from '../data/outfits';
import type { BraceletId, FabricId, ItemId, OutfitId, Slot } from '../types/ids';
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

/** How many bracelets stack on her wrist (question 52: a stack on one wrist). */
export const WRIST_MAX = 3;

/** How many of each bracelet she has, to wear; with none given, any she names. */
export type BraceletCount = (id: BraceletId) => number;

export function isBracelet(id: unknown): id is BraceletId {
  return typeof id === 'string' && id in ITEMS && ITEMS[id as ItemId].kind === 'bracelet';
}

/** How many of one bracelet are on her wrist. */
export function onWrist(look: Look, id: ItemId): number {
  return look.wrist.filter((b) => b === id).length;
}

/**
 * Puts one more of a bracelet on her wrist, nearest her hand, if she has one not already on and
 * there's room for it in the stack.
 */
export function putOn(look: Look, id: BraceletId, have: BraceletCount): Look {
  if (look.wrist.length >= WRIST_MAX || onWrist(look, id) >= have(id)) return look;
  return { ...look, wrist: [id, ...look.wrist] };
}

/** Slips one of a bracelet off her wrist, back to being only in her bag. */
export function slipOff(look: Look, id: BraceletId): Look {
  const at = look.wrist.indexOf(id);
  if (at < 0) return look;
  return { ...look, wrist: look.wrist.filter((_, i) => i !== at) };
}

/** Her wrist as it can be drawn: bracelets this build knows, no more than she has, three at most. */
function wristOf(saved: unknown, have?: BraceletCount): BraceletId[] {
  if (!Array.isArray(saved)) return [];
  const wrist: BraceletId[] = [];
  for (const id of saved) {
    if (!isBracelet(id) || wrist.length >= WRIST_MAX) continue;
    if (have && wrist.filter((b) => b === id).length >= have(id)) continue;
    wrist.push(id);
  }
  return wrist;
}

function known<K extends string>(record: Record<K, unknown>, id: unknown, fallback: K): K {
  return typeof id === 'string' && (idsOf(record) as string[]).includes(id) ? (id as K) : fallback;
}

/**
 * Makes any saved look safe to draw. Every choice this build doesn't know (a save from a later
 * build, or a hand-edited backup) falls back to the default's, a piece she doesn't own comes off,
 * and a missing top or bottom is filled from the default. Nothing is thrown away that could be
 * drawn. A bracelet not in her bag (`have`) comes off her wrist.
 */
export function repairLook(saved: Look, owned: readonly OutfitId[], have?: BraceletCount): Look {
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
    splitColour:
      saved.splitColour === null || saved.splitColour === undefined
        ? null
        : known(HAIR_COLOURS, saved.splitColour, DEFAULT_LOOK.splitColour ?? 'pink'),
    gauges: saved.gauges === true,
    freckles: saved.freckles === true,
    nosePiercing: saved.nosePiercing === true,
    tattoos: saved.tattoos === null ? null : known(TATTOOS, saved.tattoos, DEFAULT_LOOK.tattoos!),
    stripesArm: saved.stripesArm === 'left' ? 'left' : 'right',
    wrist: wristOf(saved.wrist, have),
    outfit,
  };
}
