import { PALETTE } from '../sprites/palette';

/** The HUD's look, in one place. Colours come from the game's palette so the two never drift. */
export const THEME = {
  touchMin: 44,
  radius: 14,
  font: "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif",
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",
  text: PALETTE.ghost,
  muted: '#c9bfdc',
  panel: PALETTE.night,
  panelEdge: PALETTE.plumLight,
  button: PALETTE.plum,
  buttonText: PALETTE.ghost,
  accent: PALETTE.candle,
  accentButton: PALETTE.pumpkinLight,
  /** A festival's days on the calendar, and its countdown. */
  festival: PALETTE.pumpkin,
  /** How many CSS pixels each of her pixels is in a sheet's preview. */
  dollScale: 3,
  /** The box beside a sheet's title (0.2's U2), in CSS pixels. */
  picture: 64,
  field: PALETTE.ink,
  stage: PALETTE.dusk,
  shadow: 'rgba(20, 14, 31, 0.55)',
  /** A photo's flash and its polaroid's card (0.2's J4). */
  flash: PALETTE.white,
  polaroid: PALETTE.white,
  polaroidInk: PALETTE.ink,
} as const;
