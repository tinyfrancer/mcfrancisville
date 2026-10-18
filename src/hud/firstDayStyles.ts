import { THEME as T } from '../ui/theme';

/** The first-day card's look, and the one-time glow on a button (V1's R1), read into the HUD's styles. */
export const FIRST_DAY_CSS = `
.hud-first-day-steps { list-style: none; margin: 4px 0 0; padding: 0; display: grid; gap: 10px; }
.hud-first-day-step {
  display: grid;
  grid-template-columns: 16px 32px minmax(0, 1fr);
  align-items: start;
  gap: 8px;
  padding: 10px;
  border-radius: 12px;
  background: ${T.field};
}
.hud-first-day-step .hud-glyph { vertical-align: top; }
.hud-first-day-mark { padding-top: 8px; }
.hud-first-day-title { display: block; font-size: 17px; margin-bottom: 4px; }
.hud-first-day-count { font-weight: 600; font-size: 15px; opacity: 0.8; }
.hud-sheet .hud-first-day-line { margin: 0 0 4px; font-size: 15px; }
.hud-sheet .hud-first-day-gift { margin: 0; font-size: 14px; opacity: 0.85; }
.hud-first-day-step[data-done] .hud-first-day-title { opacity: 0.75; }
.hud [data-hint] { animation: hud-hint-glow 1600ms ease-in-out infinite; }
@keyframes hud-hint-glow {
  0%, 100% { outline: 2px solid transparent; outline-offset: 2px; }
  50% { outline: 3px solid ${T.accent}; outline-offset: 3px; }
}
@media (prefers-reduced-motion: reduce) {
  .hud [data-hint] { animation: none; outline: 3px solid ${T.accent}; outline-offset: 3px; }
}
`;
