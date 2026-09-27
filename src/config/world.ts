/** One tile, in game pixels. The world measures in these; the renderer only scales them. */
export const TILE_SIZE = 32;

/**
 * The tile version 0's art was drawn for. Until its phase redraws it, such art is baked at
 * `TILE_SIZE / OLD_TILE` times its size, so the game keeps working (decisions.md 79, 86).
 */
export const OLD_TILE = 16;
