import { describe, expect, it } from 'vitest';
import { ITEMS } from '../../src/data/items';
import {
  CAPTION_MAX,
  captionOf,
  movedSticker,
  STICKER_KINDS,
  STICKER_LIMIT,
  stickerChoices,
  withSticker,
  type Sticker,
} from '../../src/systems/photo';
import type { ItemId } from '../../src/types/ids';

describe("the photo mode's stickers (1.5's G5)", () => {
  it('takes six at most, and says so by taking no more', () => {
    let placed: Sticker[] = [];
    for (let n = 0; n < STICKER_LIMIT; n++) {
      placed = withSticker(placed, { id: 'lunaMoth', x: 0.5, y: 0.5 })!;
    }
    expect(STICKER_LIMIT).toBe(6);
    expect(placed).toHaveLength(6);
    expect(withSticker(placed, { id: 'lunaMoth', x: 0.5, y: 0.5 })).toBeNull();
  });

  it('keeps a sticker on the photo, however far it was put or moved', () => {
    const placed = withSticker([], { id: 'lunaMoth', x: -2, y: 3 })!;
    expect(placed[0]).toMatchObject({ x: 0, y: 1 });
    expect(movedSticker(placed, 0, 0.25, 1.5)[0]).toMatchObject({ x: 0.25, y: 1 });
  });

  it('offers her caught critters first, then the dolls, squishies and keepsakes in her bag', () => {
    const bag = Object.keys(ITEMS) as ItemId[];
    const caught = new Set(['lunaMoth', 'monarch']);
    const choices = stickerChoices(bag, (id) => caught.has(id));
    expect(choices.slice(0, 2).sort()).toEqual(['lunaMoth', 'monarch'].sort());
    expect(new Set(choices).size).toBe(choices.length);
    for (const id of choices.slice(2)) expect(STICKER_KINDS).toContain(ITEMS[id].kind);
    // Nothing of her bag that isn't one of those: no seeds, no snacks.
    expect(choices.some((id) => ITEMS[id].kind === 'seed')).toBe(false);
  });

  it('puts a shiny she has caught after its plain', () => {
    const choices = stickerChoices(
      [],
      (id) => id === 'lunaMoth',
      (id) => id === 'lunaMoth',
    );
    expect(choices).toEqual(['lunaMoth', 'lunaMothShiny']);
  });
});

describe("the photo's caption", () => {
  it('is one tidy line, cut to fit the polaroid', () => {
    expect(captionOf('  us   at the\nwell  ')).toBe('us at the well');
    const long = captionOf('a'.repeat(100));
    expect(long).toHaveLength(CAPTION_MAX);
  });
});
