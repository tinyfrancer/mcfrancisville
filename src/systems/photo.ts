import { CRITTER_IDS } from '../data/critters';
import { ITEMS, type ItemKind } from '../data/items';
import { shinyOf } from '../data/shinies';
import type { CritterId, ItemId } from '../types/ids';

/*
 * The photo mode's rules (1.5's G5, decision 374): what may go on a photo as a sticker, how many,
 * and how long a caption is. Nothing here is kept: the phone keeps the picture, never the save.
 */

/** Most stickers on one photo: enough to decorate it, few enough to still see who's in it. */
export const STICKER_LIMIT = 6;

/** Longest caption, in letters: one line on the polaroid's white, in her phone's font. */
export const CAPTION_MAX = 32;

/** What of her bag makes a sticker: her critters, dolls, squishies and keepsakes. */
export const STICKER_KINDS: readonly ItemKind[] = ['critter', 'doll', 'squishy', 'keepsake'];

/** A sticker on the photo: what it is, and where its middle is, as fractions of the photo. */
export interface Sticker {
  id: ItemId;
  x: number;
  y: number;
}

/**
 * The drawer of stickers: every critter she has caught (the Cabinet's, in its order, a shiny after
 * its plain), then the dolls, squishies and keepsakes in her bag, each once.
 */
export function stickerChoices(
  bag: readonly ItemId[],
  caught: (id: CritterId) => boolean,
  caughtShiny: (id: CritterId) => boolean = () => false,
): ItemId[] {
  const out: ItemId[] = [];
  const seen = new Set<string>();
  const add = (id: ItemId) => {
    if (seen.has(id) || !(id in ITEMS)) return;
    seen.add(id);
    out.push(id);
  };
  for (const id of CRITTER_IDS) {
    if (caught(id)) add(id);
    if (caughtShiny(id)) add(shinyOf(id));
  }
  for (const kind of STICKER_KINDS) {
    for (const id of bag) if (ITEMS[id].kind === kind) add(id);
  }
  return out;
}

/** Keeps a fraction on the photo. */
function onPhoto(f: number): number {
  return Math.min(1, Math.max(0, f));
}

/** The stickers with one more put on, or null if the photo already has as many as it takes. */
export function withSticker(placed: readonly Sticker[], sticker: Sticker): Sticker[] | null {
  if (placed.length >= STICKER_LIMIT) return null;
  return [...placed, { ...sticker, x: onPhoto(sticker.x), y: onPhoto(sticker.y) }];
}

/** The stickers with the `n`th moved to a new middle, kept on the photo. */
export function movedSticker(
  placed: readonly Sticker[],
  n: number,
  x: number,
  y: number,
): Sticker[] {
  return placed.map((s, i) => (i === n ? { ...s, x: onPhoto(x), y: onPhoto(y) } : s));
}

/** A caption as it's written on the polaroid: one line, its spaces tidied, cut to fit. */
export function captionOf(text: string): string {
  return [...text.replace(/\s+/g, ' ').trim()].slice(0, CAPTION_MAX).join('').trim();
}
