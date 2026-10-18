import type { Glyph } from './glyphs';

/**
 * The little seasonal touch on the bar along the top (0.2's U1, question 53): one small thing a
 * month, never in the way. A row per month, January first.
 */
export const BAR_TRIMS: readonly { icon: Glyph; name: string }[] = [
  { icon: 'snowflake', name: 'A snowflake' },
  { icon: { mark: 'valentines' }, name: 'A heart' },
  { icon: { item: 'blackTulip' }, name: 'A tulip' },
  { icon: 'blossom', name: 'A blossom' },
  { icon: { item: 'ghostDaisy' }, name: 'A daisy' },
  { icon: { item: 'sunflower' }, name: 'A sunflower' },
  { icon: 'watermelon', name: 'A slice of watermelon' },
  { icon: 'shell', name: 'A shell' },
  { icon: 'leaf', name: 'A fallen leaf' },
  { icon: { mark: 'halloween' }, name: 'A pumpkin' },
  { icon: { item: 'pumpkinPie' }, name: 'A pie' },
  { icon: { mark: 'christmas' }, name: 'A little tree' },
];

/** The trim for a day, from its `YYYY-MM-DD` key. */
export function trimOn(day: string): { icon: Glyph; name: string } {
  const month = Number(day.slice(5, 7));
  return BAR_TRIMS[(month - 1 + 12) % 12]!;
}
