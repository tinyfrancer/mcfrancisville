/**
 * Every colour in the game. Spooky-cute (decisions.md 3): dusky plums and mossy greens stand in for
 * black, and anything inviting is lit in warm pumpkin and candle light. Sprites reach these through
 * their own palettes of semantic keys; nothing else writes a hex.
 */
export const PALETTE = {
  night: '#2a1f3d',
  dusk: '#3b2c55',
  ink: '#140e1f',
  ghost: '#f3e9ff',

  moss: '#4f6b4a',
  mossLight: '#5d7c56',
  mossDark: '#3f5a3d',
  lavender: '#b48ce0',
  candle: '#ffd37a',
  candleBright: '#fff1c1',

  stone: '#8a7f95',
  stoneLight: '#a89fb3',
  stoneDark: '#716a80',

  water: '#3d5a8a',
  waterLight: '#5a7fb8',
  earth: '#4a3b3f',

  hedge: '#2f4a36',
  hedgeLight: '#3e5e44',
  hedgeDark: '#1f3326',

  canopy: '#355e5a',
  canopyLight: '#4a7d73',
  canopyDark: '#284a47',
  bark: '#5a4232',
  barkDark: '#3e2d22',

  pumpkin: '#f28c28',
  pumpkinLight: '#ffb35c',
  pumpkinDark: '#7a3b12',
  iron: '#2b2238',

  berry: '#6b2f45',
  berryLight: '#8a3f5a',
  rope: '#c9b28a',
  wood: '#7a5a3a',

  plum: '#5b3d7a',
  plumLight: '#7a58a0',
  teal: '#2f6b73',
  tealLight: '#3f8a92',
  cream: '#e9dcc4',
  creamShade: '#cbbba0',
  rose: '#c4587a',
  roseLight: '#e07c9b',

  skin: '#f2c6a0',
  skinShade: '#d9a07e',
  cheek: '#f59a9a',
  hair: '#3a2a2a',
  hairLight: '#5a4040',
  tee: '#4a7fd0',
  teeShade: '#3a63a8',
  denim: '#3b4f7a',
  denimDark: '#2c3b5c',
} as const;
