/**
 * The little seasonal touch on the bar along the top (0.2's U1, question 53): one small thing a
 * month, never in the way. A row per month, January first.
 */
export const BAR_TRIMS: readonly { icon: string; name: string }[] = [
  { icon: '❄️', name: 'A snowflake' },
  { icon: '💝', name: 'A heart' },
  { icon: '🌷', name: 'A tulip' },
  { icon: '🌸', name: 'A blossom' },
  { icon: '🌼', name: 'A daisy' },
  { icon: '🌻', name: 'A sunflower' },
  { icon: '🍉', name: 'A slice of watermelon' },
  { icon: '🐚', name: 'A shell' },
  { icon: '🍂', name: 'A fallen leaf' },
  { icon: '🎃', name: 'A pumpkin' },
  { icon: '🥧', name: 'A pie' },
  { icon: '🎄', name: 'A little tree' },
];

/** The trim for a day, from its `YYYY-MM-DD` key. */
export function trimOn(day: string): { icon: string; name: string } {
  const month = Number(day.slice(5, 7));
  return BAR_TRIMS[(month - 1 + 12) % 12]!;
}
