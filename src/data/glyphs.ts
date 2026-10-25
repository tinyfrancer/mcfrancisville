import type { ItemId, ToolId } from '../types/ids';
import type { CalendarId } from './calendar';

/*
 * The HUD's pictures (V1's L5, decision 295): every mark the chrome shows beside a word (the bars'
 * buttons, a toast, a place on the map, a happening on the calendar) is one of the game's own
 * 16-pixel drawings, never a phone's emoji. Drawn in `src/sprites/ui.ts`, shown by `glyph` in
 * `src/hud/glyph.ts`.
 */

/** The drawings made for the chrome itself. */
export type GlyphId =
  // The bars.
  | 'candy'
  | 'neighbours'
  | 'settings'
  | 'decorate'
  | 'bag'
  | 'closet'
  | 'book'
  | 'map'
  | 'plant'
  | 'more'
  | 'heart'
  | 'heartEmpty'
  | 'morning'
  | 'afternoon'
  | 'evening'
  // Toasts, sheets and places.
  | 'skull'
  | 'castle'
  | 'signpost'
  | 'house'
  | 'town'
  | 'door'
  | 'sparkle'
  | 'yum'
  | 'drops'
  | 'piano'
  | 'letter'
  | 'letterOpen'
  | 'pin'
  | 'lookingGlass'
  | 'scroll'
  | 'storm'
  | 'rain'
  | 'fog'
  | 'question'
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'here'
  | 'footprints'
  | 'camera'
  | 'crown'
  | 'sort'
  | 'parcel'
  | 'neighbourCake'
  | 'tree'
  | 'lantern'
  | 'wheel'
  | 'wave'
  | 'topHat'
  | 'telescope'
  // The photo mode's strip (1.5's G5).
  | 'filters'
  | 'sticker'
  | 'pencil'
  | 'zoomIn'
  | 'zoomOut'
  | 'hammer'
  | 'bottle'
  | 'star'
  | 'tallyHit'
  | 'tallyMiss'
  | 'tallyLeft'
  // The month's little touch at the end of the top bar.
  | 'snowflake'
  | 'blossom'
  | 'watermelon'
  | 'shell'
  | 'leaf';

/**
 * A picture for the chrome: one drawn for it, or something that already has a picture of its own
 * (a thing in her bag, a day's mark on the calendar, what she holds), so a toast about a moth
 * shows that moth.
 */
export type Glyph = GlyphId | { item: ItemId } | { mark: CalendarId } | { tool: ToolId };
